import assert from 'node:assert/strict';
import { TextCrdt, cursorToAnchor, anchorToCursor, selectionToAnchors, anchorsToSelection } from '../src/crdt/text-crdt.js';

const a = TextCrdt.fromText('hello', { siteId: 'a' });
const endAnchor = cursorToAnchor(a, 5);
a.localInsert(0, 'X');
assert.equal(a.value(), 'Xhello');
assert.equal(anchorToCursor(a, endAnchor), 6);

const selection = selectionToAnchors(a, 1, 4);
a.localInsert(1, 'YY');
const resolved = anchorsToSelection(a, selection);
assert.equal(a.value(), 'XYYhello');
assert.equal(resolved.start, 1);
assert.equal(resolved.end, 6);

const c = new TextCrdt({ siteId: 'c' });
const d = new TextCrdt({ siteId: 'd' });
const cOps = c.localInsert(0, 'C');
const dOps = d.localInsert(0, 'D');
c.applyMany(dOps);
d.applyMany(cOps);
assert.equal(c.value(), d.value());
console.log('crdt selection smoke ok');
