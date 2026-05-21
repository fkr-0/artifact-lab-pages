import assert from 'node:assert/strict';
import test from 'node:test';
import { Blob } from 'node:buffer';
import { PeernetFileShare, buildFileShareUrl, parseFileShareIntent } from '../peernetjs/peernet-file-share.js';

if (!globalThis.CustomEvent) {
  globalThis.CustomEvent = class CustomEvent extends Event {
    constructor(type, params = {}) {
      super(type);
      this.detail = params.detail;
    }
  };
}

if (!URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:test-download';
}

class FakeNetwork {
  constructor(myId) {
    this.myId = myId;
    this.handlers = new Map();
    this.remote = null;
    this.sent = [];
  }

  on(type, handler) {
    this.handlers.set(type, handler);
  }

  send(peerId, type, payload) {
    this.sent.push({ peerId, type, payload });
    const remoteHandler = this.remote?.handlers.get(`message:${type}`);
    if (remoteHandler) remoteHandler({ id: this.myId, payload, raw: { type, payload } });
  }
}

function connect(a, b) {
  a.remote = b;
  b.remote = a;
}

function makeFile(text, name = 'hello.txt') {
  const blob = new Blob([text], { type: 'text/plain' });
  return {
    name,
    size: blob.size,
    type: 'text/plain',
    lastModified: 1,
    slice(start, end) {
      return blob.slice(start, end);
    },
  };
}

test('buildFileShareUrl and parseFileShareIntent round-trip offer links', () => {
  const url = buildFileShareUrl({
    baseUrl: 'https://example.test/app-hub-v11/index.html?old=1#ignored',
    lobbyId: 'nexus-v11-hub-main',
    offer: {
      offerId: 'file-1',
      token: 'cap-1',
      fromPeerId: 'peer-a',
      name: 'hello world.txt',
      size: 123,
      mime: 'text/plain',
    },
  });
  assert.equal(url, 'https://example.test/app-hub-v11/index.html?dl=1&lobby=nexus-v11-hub-main&from=peer-a&offer=file-1&token=cap-1&name=hello+world.txt&size=123&mime=text%2Fplain');
  assert.deepEqual(parseFileShareIntent(new URL(url)), {
    offerId: 'file-1',
    fromPeerId: 'peer-a',
    token: 'cap-1',
    lobbyId: 'nexus-v11-hub-main',
    name: 'hello world.txt',
    size: 123,
    mime: 'text/plain',
  });
});

test('PeernetFileShare offers, requests, chunks, and completes a local-only transfer', async () => {
  const senderNetwork = new FakeNetwork('peer-sender');
  const receiverNetwork = new FakeNetwork('peer-receiver');
  connect(senderNetwork, receiverNetwork);

  const sender = new PeernetFileShare({
    network: senderNetwork,
    profile: { displayName: 'Sender' },
    lobbyId: 'test-lobby',
    chunkSize: 4,
    now: () => 1000,
  });
  const receiver = new PeernetFileShare({
    network: receiverNetwork,
    profile: { displayName: 'Receiver' },
    lobbyId: 'test-lobby',
    chunkSize: 4,
    now: () => 1000,
  });

  let incomingOffer;
  let completed;
  receiver.addEventListener('offer:received', (event) => {
    incomingOffer = event.detail;
  });
  receiver.addEventListener('transfer:complete', (event) => {
    completed = event.detail;
  });

  const publicOffer = sender.createOffer(makeFile('hello peer'), {
    targetPeerId: 'peer-receiver',
    baseUrl: 'https://example.test/app-hub-v11/index.html',
  });

  assert.equal(publicOffer.name, 'hello.txt');
  assert.equal(incomingOffer.offerId, publicOffer.offerId);
  assert.equal(incomingOffer.fromPeerId, 'peer-sender');
  assert.match(publicOffer.shareUrl, /dl=1/);

  receiver.request(incomingOffer);
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.ok(completed, 'receiver should emit completed transfer');
  assert.equal(completed.name, 'hello.txt');
  assert.equal(completed.size, 10);
  assert.equal(await completed.blob.text(), 'hello peer');
  assert.equal(senderNetwork.sent.some((message) => message.type === 'file-accept'), true);
  assert.equal(senderNetwork.sent.some((message) => message.type === 'file-complete'), true);
});

test('PeernetFileShare denies token mismatches before streaming bytes', async () => {
  const senderNetwork = new FakeNetwork('peer-sender');
  const receiverNetwork = new FakeNetwork('peer-receiver');
  connect(senderNetwork, receiverNetwork);
  const sender = new PeernetFileShare({ network: senderNetwork, profile: { displayName: 'Sender' }, chunkSize: 4, now: () => 1000 });
  const receiver = new PeernetFileShare({ network: receiverNetwork, profile: { displayName: 'Receiver' }, chunkSize: 4, now: () => 1000 });

  let denial;
  receiver.addEventListener('transfer:denied', (event) => {
    denial = event.detail;
  });
  const offer = sender.createOffer(makeFile('secret'), { targetPeerId: 'peer-receiver', baseUrl: 'https://example.test/app-hub-v11/index.html' });
  receiver.request({ ...offer, token: 'wrong-token' });
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(denial.reason, 'token-mismatch');
  assert.equal(senderNetwork.sent.some((message) => message.type === 'file-chunk'), false);
});
