import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createLinkedList,
  resetModelCounters,
  deriveChain,
  deriveArrows,
  validateModelInvariants,
  tracePrepend,
  traceAppend,
  traceInsertAt,
  traceDeleteHead,
  traceDeleteTail,
  traceDeleteAt,
  traceSearch,
  traceTraverse,
  traceReverse,
  traceFastSlow,
} from './linkedListModel.js';

function valuesOf(model) {
  return deriveChain(model).map((node) => node.data);
}

test('Invariant 1: default list initializes 5 nodes [10,25,37,52,68] with distinct non-contiguous addresses, valid HEAD/TAIL, and TAIL.next === null', () => {
  resetModelCounters();
  const list = createLinkedList([10, 25, 37, 52, 68], true);

  assert.equal(validateModelInvariants(list), true);
  assert.deepEqual(valuesOf(list), [10, 25, 37, 52, 68]);

  const chain = deriveChain(list);
  assert.equal(list.headId, chain[0].id);
  assert.equal(list.tailId, chain[chain.length - 1].id);
  assert.equal(chain[chain.length - 1].nextId, null);

  const addresses = chain.map((n) => n.address);
  assert.equal(new Set(addresses).size, 5);
  assert.deepEqual(addresses, ['0x100', '0x240', '0x3A0', '0x1E0', '0x4C0']);
});

test('Invariant 2: deriveArrows mirrors exact .nextId references with no skipped or fabricated links', () => {
  const list = createLinkedList([10, 25, 37], true);
  const chain = deriveChain(list);
  const arrows = deriveArrows(list);

  assert.equal(arrows.length, 3);
  assert.deepEqual(arrows[0], { fromId: chain[0].id, toId: chain[1].id });
  assert.deepEqual(arrows[1], { fromId: chain[1].id, toId: chain[2].id });
  assert.deepEqual(arrows[2], { fromId: chain[2].id, toId: null });
});

test('Invariant 3: prepend updates HEAD, points new node nextId to old HEAD, preserves TAIL on non-empty, and sets TAIL on empty', () => {
  const empty = createLinkedList([], true);
  const fromEmpty = tracePrepend(empty, 99);
  assert.equal(validateModelInvariants(fromEmpty.model), true);
  assert.deepEqual(valuesOf(fromEmpty.model), [99]);
  assert.equal(fromEmpty.model.headId, fromEmpty.model.tailId);

  const base = createLinkedList([10, 25, 37], true);
  const oldHeadId = base.headId;
  const oldTailId = base.tailId;
  const res = tracePrepend(base, 5);

  assert.equal(validateModelInvariants(res.model), true);
  assert.deepEqual(valuesOf(res.model), [5, 10, 25, 37]);
  assert.notEqual(res.model.headId, oldHeadId);
  assert.equal(res.model.nodes[res.model.headId].nextId, oldHeadId);
  assert.equal(res.model.tailId, oldTailId);
  assert.ok(res.steps.length >= 3);
});

test('Invariant 4: append updates TAIL and sets old TAIL nextId to new node whose nextId is null', () => {
  const empty = createLinkedList([], true);
  const fromEmpty = traceAppend(empty, 42);
  assert.equal(validateModelInvariants(fromEmpty.model), true);
  assert.deepEqual(valuesOf(fromEmpty.model), [42]);
  assert.equal(fromEmpty.model.headId, fromEmpty.model.tailId);

  const base = createLinkedList([10, 25], true);
  const oldTailId = base.tailId;
  const res = traceAppend(base, 99);

  assert.equal(validateModelInvariants(res.model), true);
  assert.deepEqual(valuesOf(res.model), [10, 25, 99]);
  assert.notEqual(res.model.tailId, oldTailId);
  assert.equal(res.model.nodes[oldTailId].nextId, res.model.tailId);
  assert.equal(res.model.nodes[res.model.tailId].nextId, null);
});

test('Invariant 5: insertAt handles head (0), middle (idx), tail (length), and rejects invalid indices safely', () => {
  const base = createLinkedList([10, 30, 40], true);
  const mid = traceInsertAt(base, 20, 1);
  assert.equal(mid.error, undefined);
  assert.equal(validateModelInvariants(mid.model), true);
  assert.deepEqual(valuesOf(mid.model), [10, 20, 30, 40]);

  const atHead = traceInsertAt(mid.model, 5, 0);
  assert.deepEqual(valuesOf(atHead.model), [5, 10, 20, 30, 40]);
  assert.equal(validateModelInvariants(atHead.model), true);

  const atTail = traceInsertAt(atHead.model, 50, 5);
  assert.deepEqual(valuesOf(atTail.model), [5, 10, 20, 30, 40, 50]);
  assert.equal(validateModelInvariants(atTail.model), true);

  const invalid = traceInsertAt(base, 99, 9);
  assert.ok(invalid.error);
  assert.deepEqual(valuesOf(invalid.model), [10, 30, 40]);
});

test('Invariant 6: deleteHead advances HEAD cleanly and transitions single-node list to empty HEAD=TAIL=null', () => {
  const base = createLinkedList([10, 25, 37], true);
  const res = traceDeleteHead(base);
  assert.equal(validateModelInvariants(res.model), true);
  assert.deepEqual(valuesOf(res.model), [25, 37]);

  const single = createLinkedList([42], true);
  const emptied = traceDeleteHead(single);
  assert.equal(validateModelInvariants(emptied.model), true);
  assert.equal(emptied.model.headId, null);
  assert.equal(emptied.model.tailId, null);
  assert.equal(emptied.model.length, 0);

  const emptyErr = traceDeleteHead(emptied.model);
  assert.ok(emptyErr.error);
});

test('Invariant 7: deleteTail removes last node, sets new TAIL.nextId === null, and empties single-node list cleanly', () => {
  const base = createLinkedList([10, 25, 37], true);
  const res = traceDeleteTail(base);
  assert.equal(validateModelInvariants(res.model), true);
  assert.deepEqual(valuesOf(res.model), [10, 25]);
  assert.equal(res.model.nodes[res.model.tailId].nextId, null);

  const single = createLinkedList([77], true);
  const emptied = traceDeleteTail(single);
  assert.equal(validateModelInvariants(emptied.model), true);
  assert.deepEqual(valuesOf(emptied.model), []);
});

test('Invariant 8: deleteAt removes interior node while relinking predecessor.nextId -> deleted.nextId', () => {
  const base = createLinkedList([10, 25, 37, 52], true);
  const res = traceDeleteAt(base, 2);
  assert.equal(res.error, undefined);
  assert.equal(validateModelInvariants(res.model), true);
  assert.deepEqual(valuesOf(res.model), [10, 25, 52]);

  const outOfRange = traceDeleteAt(base, -1);
  assert.ok(outOfRange.error);
});

test('Invariant 9: search finds existing node index and handles miss by reaching NULL', () => {
  const base = createLinkedList([10, 25, 37, 52, 68], true);
  const hit = traceSearch(base, 37);
  assert.equal(hit.foundIndex, 2);
  assert.ok(hit.foundNodeId);
  assert.equal(hit.steps.length, 3);

  const miss = traceSearch(base, 999);
  assert.equal(miss.foundIndex, -1);
  assert.equal(miss.steps.length, 6);
});

test('Invariant 10: traverse visits every node once from HEAD to NULL in O(n) steps', () => {
  const base = createLinkedList([10, 25, 37, 52, 68], true);
  const res = traceTraverse(base);
  assert.equal(res.steps.length, 6); // 5 node visits + termination at NULL

  const empty = createLinkedList([], true);
  const emptyRes = traceTraverse(empty);
  assert.equal(emptyRes.steps.length, 1);
});

test('Invariant 11: reverse flips actual .nextId links step-by-step with secondaryHeadId preservation and ends valid', () => {
  const base = createLinkedList([10, 25, 37], true);
  const origChain = deriveChain(base);
  const res = traceReverse(base);

  assert.equal(validateModelInvariants(res.model), true);
  assert.deepEqual(valuesOf(res.model), [37, 25, 10]);
  assert.equal(res.model.headId, origChain[2].id);
  assert.equal(res.model.tailId, origChain[0].id);

  // Verify intermediate reversal step has secondaryHeadId pointing to remaining forward chain and isReversedHighlight true
  const reversedHighlightSteps = res.steps.filter((s) => s.isReversedHighlight);
  assert.equal(reversedHighlightSteps.length, 3);
  assert.equal(reversedHighlightSteps[0].secondaryHeadId, origChain[1].id);
  // During iteration 2 (node 25), node 25's .nextId must literally point back to node 10
  assert.equal(
    reversedHighlightSteps[1].model.nodes[origChain[1].id].nextId,
    origChain[0].id
  );
  // Final step has head = 37, tail = 10, tail.next = null
  assert.equal(res.steps[res.steps.length - 1].model.headId, origChain[2].id);
});

test('Invariant 12: reverse handles empty and single-node edge cases safely', () => {
  const empty = createLinkedList([], true);
  const revEmpty = traceReverse(empty);
  assert.equal(validateModelInvariants(revEmpty.model), true);
  assert.deepEqual(valuesOf(revEmpty.model), []);

  const single = createLinkedList([88], true);
  const revSingle = traceReverse(single);
  assert.equal(validateModelInvariants(revSingle.model), true);
  assert.deepEqual(valuesOf(revSingle.model), [88]);
});

test('Invariant 13: traceFastSlow moves slow +1 and fast +2 and lands on middle (odd) or second middle (even)', () => {
  const odd = createLinkedList([1, 2, 3, 4, 5], true);
  const oddRes = traceFastSlow(odd);
  assert.equal(oddRes.middleNode?.data, 3);
  assert.equal(oddRes.steps[0].pointers.slow, odd.headId);
  assert.equal(oddRes.steps[0].pointers.fast, odd.headId);

  const even = createLinkedList([1, 2, 3, 4], true);
  const evenRes = traceFastSlow(even);
  assert.equal(evenRes.middleNode?.data, 3); // second middle per LeetCode 876 & prompt

  const single = createLinkedList([7], true);
  const singleRes = traceFastSlow(single);
  assert.equal(singleRes.middleNode?.data, 7);
});

