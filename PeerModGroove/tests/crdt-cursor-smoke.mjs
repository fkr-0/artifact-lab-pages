import assert from 'node:assert/strict';
import { TextCrdt, cursorToAnchor, anchorToCursor } from '../src/crdt/text-crdt.js';

const a = TextCrdt.fromText('hello', { siteId: 'a' });
const anchor = cursorToAnchor(a, 5);
const ops = a.localInsert(0, 'X');
const b = TextCrdt.fromText('hello', { siteId: 'b' });
b.applyMany(ops);
assert.equal(a.value(), b.value());
assert.equal(anchorToCursor(a, anchor), 6);

const c = new TextCrdt({ siteId: 'c' });
const d = new TextCrdt({ siteId: 'd' });
const cOps = c.localInsert(0, 'C');
const dOps = d.localInsert(0, 'D');
c.applyMany(dOps);
d.applyMany(cOps);
assert.equal(c.value(), d.value());
console.log('crdt cursor smoke ok');
