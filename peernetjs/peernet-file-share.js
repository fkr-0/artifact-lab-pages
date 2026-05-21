// peernet-file-share.js
// Local-only P2P file offer/download helper for Peernet-compatible transports.
// Keeps File objects in memory; links carry only a short-lived capability pointer.

const DEFAULT_CHUNK_SIZE = 64 * 1024;
const DEFAULT_EXPIRES_MS = 15 * 60 * 1000;

function fallbackId(prefix = 'id') {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj?.randomUUID) return `${prefix}-${cryptoObj.randomUUID()}`;
  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoObj.getRandomValues(bytes);
    return `${prefix}-${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

function toArrayBuffer(value) {
  if (value instanceof ArrayBuffer) return value;
  if (ArrayBuffer.isView(value)) return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
  if (Array.isArray(value)) return new Uint8Array(value).buffer;
  return new ArrayBuffer(0);
}

function fileDisplayName(file) {
  return String(file?.name || 'download.bin');
}

export function parseFileShareIntent(input = globalThis.location) {
  const search = input?.search || '';
  const hash = String(input?.hash || '').replace(/^#/, '');
  const params = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hash);
  const get = (key) => hashParams.get(key) || params.get(key) || '';
  const mode = get('dl') || get('fs') || get('fileShare');
  if (!mode) return null;
  const offerId = get('offer') || get('offerId');
  const fromPeerId = get('from') || get('peer') || get('fromPeerId');
  const token = get('token') || get('cap');
  if (!offerId || !fromPeerId || !token) return null;
  return {
    offerId,
    fromPeerId,
    token,
    lobbyId: get('lobby') || '',
    name: get('name') || '',
    size: Number(get('size') || 0),
    mime: get('mime') || '',
  };
}

export function buildFileShareUrl({ baseUrl = globalThis.location?.href || '', lobbyId = '', offer }) {
  const cleanBase = String(baseUrl || '').split('#')[0].split('?')[0];
  const params = new URLSearchParams();
  params.set('dl', '1');
  if (lobbyId) params.set('lobby', lobbyId);
  params.set('from', offer.fromPeerId || '');
  params.set('offer', offer.offerId || '');
  params.set('token', offer.token || '');
  if (offer.name) params.set('name', offer.name);
  if (offer.size) params.set('size', String(offer.size));
  if (offer.mime) params.set('mime', offer.mime);
  return `${cleanBase}?${params.toString()}`;
}

export class PeernetFileShare extends EventTarget {
  constructor({ network, profile = {}, lobbyId = '', now = () => Date.now(), chunkSize = DEFAULT_CHUNK_SIZE, expiresMs = DEFAULT_EXPIRES_MS } = {}) {
    super();
    this.network = network;
    this.profile = profile;
    this.lobbyId = lobbyId;
    this.now = now;
    this.chunkSize = chunkSize;
    this.expiresMs = expiresMs;
    this.offers = new Map();
    this.incoming = new Map();
    this.transfers = new Map();
    this._bindNetwork();
  }

  _bindNetwork() {
    if (!this.network?.on) return;
    this.network.on('message:file-offer', (event) => this._receiveOffer(event));
    this.network.on('message:file-request', (event) => this._receiveRequest(event));
    this.network.on('message:file-accept', (event) => this._receiveAccept(event));
    this.network.on('message:file-deny', (event) => this._receiveDeny(event));
    this.network.on('message:file-chunk', (event) => this._receiveChunk(event));
    this.network.on('message:file-complete', (event) => this._receiveComplete(event));
    this.network.on('message:file-cancel', (event) => this._receiveCancel(event));
  }

  setProfile(profile = {}) {
    this.profile = profile;
  }

  emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  createOffer(file, { targetPeerId = '', baseUrl, expiresMs = this.expiresMs } = {}) {
    if (!file) throw new Error('No file selected');
    const offerId = fallbackId('file');
    const token = fallbackId('cap');
    const createdAt = this.now();
    const offer = {
      offerId,
      token,
      targetPeerId,
      fromPeerId: this.network?.myId || '',
      fromName: this.profile.displayName || this.profile.username || 'peer',
      name: fileDisplayName(file),
      size: Number(file.size || 0),
      mime: String(file.type || 'application/octet-stream'),
      lastModified: Number(file.lastModified || 0),
      createdAt,
      expiresAt: createdAt + expiresMs,
      file,
    };
    this.offers.set(offerId, offer);
    const shareUrl = buildFileShareUrl({ baseUrl, lobbyId: this.lobbyId, offer });
    const publicOffer = this.publicOffer(offer, shareUrl);
    if (targetPeerId && this.network?.send) this.network.send(targetPeerId, 'file-offer', publicOffer);
    this.emit('offer:created', publicOffer);
    return publicOffer;
  }

  publicOffer(offer, shareUrl = '') {
    return {
      offerId: offer.offerId,
      token: offer.token,
      targetPeerId: offer.targetPeerId || '',
      fromPeerId: offer.fromPeerId || this.network?.myId || '',
      fromName: offer.fromName || this.profile.displayName || 'peer',
      name: offer.name,
      size: offer.size,
      mime: offer.mime,
      lastModified: offer.lastModified,
      createdAt: offer.createdAt,
      expiresAt: offer.expiresAt,
      shareUrl,
    };
  }

  _receiveOffer({ id, payload }) {
    if (!payload?.offerId) return;
    const incoming = { ...payload, fromPeerId: payload.fromPeerId || id || '', receivedAt: this.now() };
    this.incoming.set(incoming.offerId, incoming);
    this.emit('offer:received', incoming);
  }

  request(intentOrOffer) {
    const intent = intentOrOffer || {};
    if (!intent.offerId || !intent.fromPeerId || !intent.token) return false;
    this.incoming.set(intent.offerId, { ...intent, receivedAt: this.now() });
    this.transfers.set(intent.offerId, {
      offerId: intent.offerId,
      fromPeerId: intent.fromPeerId,
      name: intent.name || 'download.bin',
      size: Number(intent.size || 0),
      mime: intent.mime || 'application/octet-stream',
      chunks: [],
      receivedBytes: 0,
      status: 'requested',
    });
    this.network?.send?.(intent.fromPeerId, 'file-request', {
      offerId: intent.offerId,
      token: intent.token,
      want: { offset: 0 },
    });
    this.emit('transfer:request', intent);
    return true;
  }

  deny(incoming, reason = 'user-denied') {
    const offer = incoming || {};
    if (!offer.offerId || !offer.fromPeerId) return false;
    this.network?.send?.(offer.fromPeerId, 'file-deny', { offerId: offer.offerId, reason });
    this.incoming.delete(offer.offerId);
    this.emit('offer:denied', { offerId: offer.offerId, reason });
    return true;
  }

  async _receiveRequest({ id, payload }) {
    const offer = this.offers.get(payload?.offerId);
    if (!offer) return this._sendDeny(id, payload?.offerId, 'not-found');
    if (offer.expiresAt && offer.expiresAt < this.now()) {
      this.offers.delete(offer.offerId);
      return this._sendDeny(id, offer.offerId, 'expired');
    }
    if (offer.targetPeerId && offer.targetPeerId !== id) return this._sendDeny(id, offer.offerId, 'wrong-peer');
    if (!payload?.token || payload.token !== offer.token) return this._sendDeny(id, offer.offerId, 'token-mismatch');
    this.network?.send?.(id, 'file-accept', {
      offerId: offer.offerId,
      name: offer.name,
      size: offer.size,
      mime: offer.mime,
      chunkSize: this.chunkSize,
    });
    this.emit('transfer:accepted', { offerId: offer.offerId, peerId: id, direction: 'send' });
    await this._sendFile(id, offer);
  }

  _sendDeny(peerId, offerId, reason) {
    if (peerId && offerId) this.network?.send?.(peerId, 'file-deny', { offerId, reason });
    this.emit('transfer:denied', { offerId, peerId, reason, direction: 'send' });
    return false;
  }

  async _sendFile(peerId, offer) {
    const total = offer.size || 0;
    let sent = 0;
    let seq = 0;
    for (let offset = 0; offset < total; offset += this.chunkSize) {
      const slice = offer.file.slice(offset, Math.min(offset + this.chunkSize, total));
      const bytes = await slice.arrayBuffer();
      this.network?.send?.(peerId, 'file-chunk', {
        offerId: offer.offerId,
        seq,
        offset,
        total,
        bytes,
      });
      sent += bytes.byteLength;
      this.emit('transfer:progress', { offerId: offer.offerId, peerId, direction: 'send', sentBytes: sent, totalBytes: total, progress: total ? sent / total : 1 });
      seq += 1;
      await Promise.resolve();
    }
    this.network?.send?.(peerId, 'file-complete', { offerId: offer.offerId, totalBytes: total, totalChunks: seq });
    this.emit('transfer:complete', { offerId: offer.offerId, peerId, direction: 'send', totalBytes: total });
  }

  _receiveAccept({ id, payload }) {
    if (!payload?.offerId) return;
    const transfer = this.transfers.get(payload.offerId) || { offerId: payload.offerId, fromPeerId: id, chunks: [], receivedBytes: 0 };
    Object.assign(transfer, {
      fromPeerId: id || transfer.fromPeerId,
      name: payload.name || transfer.name || 'download.bin',
      size: Number(payload.size || transfer.size || 0),
      mime: payload.mime || transfer.mime || 'application/octet-stream',
      chunkSize: payload.chunkSize || transfer.chunkSize || this.chunkSize,
      status: 'accepted',
    });
    this.transfers.set(payload.offerId, transfer);
    this.emit('transfer:accepted', { ...transfer, direction: 'receive' });
  }

  _receiveDeny({ id, payload }) {
    const detail = { offerId: payload?.offerId, peerId: id, reason: payload?.reason || 'denied', direction: 'receive' };
    if (detail.offerId) this.transfers.delete(detail.offerId);
    this.emit('transfer:denied', detail);
  }

  _receiveChunk({ id, payload }) {
    if (!payload?.offerId) return;
    const transfer = this.transfers.get(payload.offerId) || { offerId: payload.offerId, fromPeerId: id, chunks: [], receivedBytes: 0, size: Number(payload.total || 0), mime: 'application/octet-stream', name: 'download.bin' };
    const bytes = toArrayBuffer(payload.bytes ?? payload.chunk);
    transfer.chunks[payload.seq || 0] = bytes;
    transfer.receivedBytes = (transfer.receivedBytes || 0) + bytes.byteLength;
    transfer.size = Number(payload.total || transfer.size || 0);
    transfer.status = 'receiving';
    this.transfers.set(payload.offerId, transfer);
    this.emit('transfer:progress', { offerId: payload.offerId, peerId: id, direction: 'receive', receivedBytes: transfer.receivedBytes, totalBytes: transfer.size, progress: transfer.size ? transfer.receivedBytes / transfer.size : 0 });
  }

  _receiveComplete({ id, payload }) {
    const transfer = this.transfers.get(payload?.offerId);
    if (!transfer) return;
    const blob = new Blob(transfer.chunks.filter(Boolean), { type: transfer.mime || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    Object.assign(transfer, { blob, url, status: 'complete', completedAt: this.now() });
    this.emit('transfer:complete', { ...transfer, peerId: id, direction: 'receive' });
  }

  _receiveCancel({ id, payload }) {
    const offerId = payload?.offerId;
    if (offerId) {
      this.transfers.delete(offerId);
      this.incoming.delete(offerId);
    }
    this.emit('transfer:cancel', { offerId, peerId: id, reason: payload?.reason || 'cancelled' });
  }
}
