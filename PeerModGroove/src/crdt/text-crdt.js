// PeerModGroove/src/crdt/text-crdt.js
// Small operation-based sequence CRDT for artifact text editors.
//
// Model:
// - Every character has a globally stable id: <siteId>:<counter>
// - Inserts reference the visible character before them via afterId
// - Deletes are tombstones, so late inserts referencing deleted chars still merge
// - Siblings with the same afterId are sorted by character id for deterministic convergence

export class TextCrdt {
  constructor({ siteId = randomSiteId(), clock = 0 } = {}) {
    this.siteId = siteId;
    this.clock = clock;
    this.nodes = new Map();
    this.children = new Map();
    this.applied = new Set();
    this.rootId = 'ROOT';
    this.children.set(this.rootId, []);
  }

  static fromText(text, opts = {}) {
    const doc = new TextCrdt(opts);
    let afterId = doc.rootId;
    for (const ch of text) {
      const op = doc.localInsertAfter(afterId, ch);
      afterId = op.id;
    }
    return doc;
  }

  nextId() {
    this.clock += 1;
    return `${this.siteId}:${this.clock}`;
  }

  value() {
    let out = '';
    this.walkVisible((node) => { out += node.value; });
    return out;
  }

  visibleIds() {
    const ids = [];
    this.walkVisible((node) => ids.push(node.id));
    return ids;
  }

  localInsert(index, value) {
    const chars = Array.from(String(value || ''));
    const ops = [];
    let afterId = this.afterIdForIndex(index);
    for (const ch of chars) {
      const op = this.localInsertAfter(afterId, ch);
      ops.push(op);
      afterId = op.id;
    }
    return ops;
  }

  localInsertAfter(afterId, value) {
    const op = {
      kind: 'insert',
      id: this.nextId(),
      afterId: afterId || this.rootId,
      value,
      siteId: this.siteId
    };
    this.apply(op);
    return op;
  }

  localDelete(index, count = 1) {
    const ids = this.visibleIds().slice(index, index + count);
    return ids.map((id) => {
      const op = { kind: 'delete', id, siteId: this.siteId, opId: this.nextId() };
      this.apply(op);
      return op;
    });
  }

  apply(op) {
    if (!op || typeof op !== 'object') return false;
    const key = op.opId || `${op.kind}:${op.id}`;
    if (this.applied.has(key)) return false;
    this.applied.add(key);

    if (op.kind === 'insert') return this.applyInsert(op);
    if (op.kind === 'delete') return this.applyDelete(op);
    return false;
  }

  applyMany(ops = []) {
    let changed = false;
    for (const op of ops) changed = this.apply(op) || changed;
    return changed;
  }

  applyInsert(op) {
    if (!op.id || this.nodes.has(op.id)) return false;
    const afterId = op.afterId || this.rootId;
    const node = {
      id: op.id,
      afterId,
      value: String(op.value ?? ''),
      deleted: false,
      siteId: op.siteId || parseSiteId(op.id)
    };
    this.nodes.set(node.id, node);
    if (!this.children.has(afterId)) this.children.set(afterId, []);
    if (!this.children.has(node.id)) this.children.set(node.id, []);
    const siblings = this.children.get(afterId);
    siblings.push(node.id);
    siblings.sort(compareIds);
    this.clock = Math.max(this.clock, parseClock(op.id));
    return true;
  }

  applyDelete(op) {
    const node = this.nodes.get(op.id);
    if (!node || node.deleted) return false;
    node.deleted = true;
    this.clock = Math.max(this.clock, parseClock(op.opId || ''));
    return true;
  }

  snapshot() {
    return {
      siteId: this.siteId,
      clock: this.clock,
      nodes: Array.from(this.nodes.values()),
      applied: Array.from(this.applied)
    };
  }

  loadSnapshot(snapshot = {}) {
    this.clock = Math.max(this.clock, Number(snapshot.clock || 0));
    this.nodes.clear();
    this.children.clear();
    this.children.set(this.rootId, []);
    this.applied = new Set(snapshot.applied || []);

    for (const raw of snapshot.nodes || []) {
      const node = { ...raw, afterId: raw.afterId || this.rootId };
      this.nodes.set(node.id, node);
      if (!this.children.has(node.afterId)) this.children.set(node.afterId, []);
      if (!this.children.has(node.id)) this.children.set(node.id, []);
      this.children.get(node.afterId).push(node.id);
    }

    for (const siblings of this.children.values()) siblings.sort(compareIds);
  }

  afterIdForIndex(index) {
    if (index <= 0) return this.rootId;
    const ids = this.visibleIds();
    return ids[Math.min(index, ids.length) - 1] || this.rootId;
  }

  walkVisible(fn) {
    const walk = (parentId) => {
      const childIds = this.children.get(parentId) || [];
      for (const id of childIds) {
        const node = this.nodes.get(id);
        if (!node) continue;
        if (!node.deleted) fn(node);
        walk(id);
      }
    };
    walk(this.rootId);
  }
}

export function diffToOps(doc, oldText, newText) {
  let start = 0;
  while (start < oldText.length && start < newText.length && oldText[start] === newText[start]) start += 1;

  let oldEnd = oldText.length;
  let newEnd = newText.length;
  while (oldEnd > start && newEnd > start && oldText[oldEnd - 1] === newText[newEnd - 1]) {
    oldEnd -= 1;
    newEnd -= 1;
  }

  const ops = [];
  const deleteCount = oldEnd - start;
  if (deleteCount > 0) ops.push(...doc.localDelete(start, deleteCount));
  const insertText = newText.slice(start, newEnd);
  if (insertText) ops.push(...doc.localInsert(start, insertText));
  return ops;
}

function randomSiteId() {
  return `site-${Math.random().toString(36).slice(2, 10)}`;
}

function parseSiteId(id) {
  return String(id || '').split(':')[0] || 'unknown';
}

function parseClock(id) {
  const n = Number(String(id || '').split(':')[1]);
  return Number.isFinite(n) ? n : 0;
}

function compareIds(a, b) {
  const [as, ac] = String(a).split(':');
  const [bs, bc] = String(b).split(':');
  const an = Number(ac);
  const bn = Number(bc);
  if (an !== bn) return an - bn;
  return as.localeCompare(bs);
}




export function cursorToAnchor(doc, index, bias = 'right') {
  const ids = doc.visibleIds();
  const clamped = Math.max(0, Math.min(Number(index || 0), ids.length));
  return {
    leftId: clamped <= 0 ? doc.rootId : ids[clamped - 1] || doc.rootId,
    rightId: ids[clamped] || null,
    offset: clamped,
    bias
  };
}

export function anchorToCursor(doc, anchor = {}) {
  const ids = doc.visibleIds();
  if (anchor.rightId) {
    const rightIndex = ids.indexOf(anchor.rightId);
    if (rightIndex !== -1) return rightIndex;
  }
  if (anchor.leftId && anchor.leftId !== doc.rootId) {
    const leftIndex = ids.indexOf(anchor.leftId);
    if (leftIndex !== -1) return leftIndex + 1;
  }
  if (anchor.leftId === doc.rootId) return 0;
  return Math.max(0, Math.min(Number(anchor.offset || 0), ids.length));
}

export function selectionToAnchors(doc, start, end = start) {
  const anchor = cursorToAnchor(doc, start, 'right');
  const focusAnchor = cursorToAnchor(doc, end, 'left');
  return { anchor, focusAnchor, reversed: Number(start || 0) > Number(end || 0) };
}

export function anchorsToSelection(doc, selection = {}) {
  const anchorIndex = anchorToCursor(doc, selection.anchor);
  const focusIndex = anchorToCursor(doc, selection.focusAnchor || selection.anchor);
  return {
    anchorIndex,
    focusIndex,
    start: Math.min(anchorIndex, focusIndex),
    end: Math.max(anchorIndex, focusIndex),
    reversed: Boolean(selection.reversed)
  };
}
