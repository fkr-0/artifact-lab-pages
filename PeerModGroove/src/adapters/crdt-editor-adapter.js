// PeerModGroove/src/adapters/crdt-editor-adapter.js
// CRDT-backed adapter for textarea-like editors operating through PeernetStack.

import { PeernetStack } from '../core/peernet-stack.js';
import { TextCrdt, diffToOps, selectionToAnchors, anchorsToSelection } from '../crdt/text-crdt.js';

export class CrdtEditorAdapter extends EventTarget {
  constructor(editor, opts = {}) {
    super();
    this.editor = editor;
    this.docId = opts.docId || 'default';
    this.profile = opts.profile || {};
    this.silent = false;
    this.text = editor.value || '';
    this.remoteCursors = new Map();
    this.doc = TextCrdt.fromText(this.text, { siteId: opts.siteId || persistedSiteId(this.docId) });
    this.stack = opts.stack || new PeernetStack({
      namespace: opts.namespace || `artifact-editor:${this.docId}`,
      capture: () => this.snapshot(),
      apply: (snapshot) => this.applySnapshot(snapshot)
    });
  }

  start() {
    this.stack.start(this.profile);
    if (typeof this.stack.joinLobby === 'function') this.stack.joinLobby(`artifact:${this.docId}`);

    this.editor.addEventListener('input', () => this.handleLocalInput());
    this.editor.addEventListener('keyup', () => this.broadcastCursor());
    this.editor.addEventListener('click', () => this.broadcastCursor());
    this.editor.addEventListener('select', () => this.broadcastCursor());

    const onOps = (payload) => this.receiveOps(payload?.data || payload);
    const onCursor = (payload) => this.receiveCursor(payload?.data || payload);
    if (typeof this.stack.onMessage === 'function') {
      this.stack.onMessage('crdt-ops', onOps);
      this.stack.onMessage('crdt-cursor', onCursor);
    } else {
      this.stack.core?.on?.('message:artifact:crdt-ops', onOps);
      this.stack.core?.on?.('message:artifact:crdt-cursor', onCursor);
    }

    this.stack.addEventListener?.('presence', (event) => this.emit('presence', event.detail));
    this.emit('ready', { docId: this.docId, siteId: this.doc.siteId });
    return this;
  }

  handleLocalInput() {
    if (this.silent) return;
    const next = this.editor.value;
    const ops = diffToOps(this.doc, this.text, next);
    if (!ops.length) return;
    this.text = this.doc.value();
    this.broadcastOps(ops);
  }

  receiveOps(message = {}) {
    if (!message || message.docId !== this.docId || message.siteId === this.doc.siteId) return;
    const changed = this.doc.applyMany(message.ops || []);
    if (!changed) return;
    this.renderRemote();
    this.emit('remote-change', message);
  }

  broadcastCursor() {
    const message = {
      docId: this.docId,
      siteId: this.doc.siteId,
      selection: selectionToAnchors(this.doc, this.editor.selectionStart || 0, this.editor.selectionEnd || this.editor.selectionStart || 0),
      at: Date.now()
    };
    if (typeof this.stack.broadcast === 'function') this.stack.broadcast('crdt-cursor', message);
    else this.stack.core?.broadcast?.({ type: 'artifact:crdt-cursor', data: message });
  }

  receiveCursor(message = {}) {
    if (!message || message.docId !== this.docId || message.siteId === this.doc.siteId) return;
    const cursor = {
      ...message,
      ...anchorsToSelection(this.doc, message.selection || { anchor: message.anchor, focusAnchor: message.focusAnchor })
    };
    this.remoteCursors.set(message.siteId, cursor);
    this.emit('cursor', cursor);
  }

  broadcastOps(ops) {
    const message = {
      docId: this.docId,
      siteId: this.doc.siteId,
      ops,
      textClock: this.doc.clock,
      at: Date.now()
    };
    if (typeof this.stack.broadcast === 'function') this.stack.broadcast('crdt-ops', message);
    else this.stack.core?.broadcast?.({ type: 'artifact:crdt-ops', data: message });
    this.emit('local-change', message);
  }

  renderRemote() {
    const next = this.doc.value();
    if (next === this.text) return;
    const selectionStart = this.editor.selectionStart;
    const selectionEnd = this.editor.selectionEnd;
    this.silent = true;
    this.editor.value = next;
    this.text = next;
    const clampedStart = Math.min(selectionStart ?? next.length, next.length);
    const clampedEnd = Math.min(selectionEnd ?? clampedStart, next.length);
    this.editor.setSelectionRange?.(clampedStart, clampedEnd);
    this.silent = false;
  }

  snapshot() {
    return {
      kind: 'artifact-editor-crdt',
      docId: this.docId,
      text: this.doc.value(),
      crdt: this.doc.snapshot()
    };
  }

  applySnapshot(snapshot = {}) {
    if (snapshot.docId && snapshot.docId !== this.docId) return;
    if (snapshot.crdt) this.doc.loadSnapshot(snapshot.crdt);
    this.renderRemote();
  }

  emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }
}

function persistedSiteId(docId) {
  const key = `artifact-editor:${docId}:site-id`;
  let id = localStorage.getItem(key);
  if (!id) {
    id = `site-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, id);
  }
  return id;
}
