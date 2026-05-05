import assert from 'node:assert/strict';
import { TextCrdt, cursorToAnchor, anchorToCursor, selectionToAnchors, anchorsToSelection, diffToOps } from '../src/crdt/text-crdt.js';

// bug regression: local insert at head remains at head and end cursor shifts.
const a = TextCrdt.fromText('hello', { siteId: 'a' });
const endAnchor = cursorToAnchor(a, 5);
a.localInsert(0, 'X');
assert.equal(a.value(), 'Xhello');
assert.equal(anchorToCursor(a, endAnchor), 6);

// selection ranges survive inserts inside the selected span.
const selection = selectionToAnchors(a, 1, 4);
a.localInsert(1, 'YY');
const resolved = anchorsToSelection(a, selection);
assert.equal(a.value(), 'XYYhello');
assert.equal(resolved.start, 1);
assert.equal(resolved.end, 6);

// concurrent inserts converge deterministically.
const c = new TextCrdt({ siteId: 'c' });
const d = new TextCrdt({ siteId: 'd' });
const cOps = c.localInsert(0, 'C');
const dOps = d.localInsert(0, 'D');
c.applyMany(dOps);
d.applyMany(cOps);
assert.equal(c.value(), d.value());

// diff ops converge.
const e = TextCrdt.fromText('abc', { siteId: 'e' });
const ops = diffToOps(e, 'abc', 'aXYZc');
assert.equal(e.value(), 'aXYZc');
const f = TextCrdt.fromText('abc', { siteId: 'f' });
f.applyMany(ops);
assert.equal(f.value(), 'aXYZc');

// compaction preserves live value and removes tombstones.
const beforeCount = e.nodes.size;
e.localDelete(1, 2);
assert.ok(e.nodes.size >= beforeCount);
const live = e.value();
e.compact();
assert.equal(e.value(), live);
assert.equal([...e.nodes.values()].some(n => n.deleted), false);

console.log('crdt core smoke ok');
