import assert from 'node:assert/strict';
import { CrdtEditorAdapter } from '../src/adapters/crdt-editor-adapter.js';

class FakeEditor extends EventTarget {
  constructor(value = '') { super(); this.value = value; this.selectionStart = 0; this.selectionEnd = 0; }
  setSelectionRange(a, b = a) { this.selectionStart = a; this.selectionEnd = b; }
  input(value) { this.value = value; this.dispatchEvent(new Event('input')); }
}

class FakeStack extends EventTarget {
  constructor() { super(); this.messages = []; this.handlers = new Map(); }
  start() { return true; }
  joinLobby() {}
  onMessage(type, fn) { this.handlers.set(type, fn); }
  broadcast(type, message) { this.messages.push({ type, message }); }
  inject(type, message) { this.handlers.get(type)?.(message); }
}

const stack = new FakeStack();
const editor = new FakeEditor('abc');
const adapter = new CrdtEditorAdapter(editor, { siteId: 'local', docId: 'doc', stack, batchMs: 0 });
adapter.start();
editor.input('abcz');
adapter.flushOps();
assert.equal(adapter.text, 'abcz');
assert.equal(stack.messages.some(m => m.type === 'crdt-ops'), true);

assert.equal(adapter.undo(), true);
adapter.flushOps();
assert.equal(editor.value, 'abc');
assert.equal(adapter.redo(), true);
adapter.flushOps();
assert.equal(editor.value, 'abcz');

const remoteOps = adapter.doc.localInsert(0, 'R');
const remoteMessage = { docId: 'doc', siteId: 'remote', ops: remoteOps };
stack.inject('crdt-ops', remoteMessage);
assert.equal(editor.value.startsWith('R'), true);

adapter.broadcastCursor();
assert.equal(stack.messages.some(m => m.type === 'crdt-cursor'), true);
adapter.compact();
assert.equal([...adapter.doc.nodes.values()].some(n => n.deleted), false);

console.log('crdt adapter smoke ok');
