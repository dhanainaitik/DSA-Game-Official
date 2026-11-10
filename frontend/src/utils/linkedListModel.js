/**
 * Educational Singly Linked List Data Model & Execution Trace Engine.
 *
 * Simulated hexadecimal addresses (e.g. `0x100`, `0x240`) illustrate heap allocation
 * where nodes live independently in memory and connect via `nextId` references.
 * JavaScript manages real memory internally.
 */

// Deliberately non-contiguous simulated heap address pool so students can observe
// that linked-list nodes do not require sequential memory locations.
const ADDRESS_POOL = [
  '0x100', '0x240', '0x3A0', '0x1E0', '0x4C0',
  '0x520', '0x2B0', '0x640', '0x3F0', '0x710',
  '0x480', '0x820', '0x5D0', '0x940', '0x6F0',
  '0xA30', '0x7B0', '0xB60', '0x8E0', '0xC10',
];

let addressCursor = 0;
let idCounter = 0;

function nextSimulatedAddress(usedAddresses) {
  for (let i = 0; i < ADDRESS_POOL.length; i++) {
    const candidate = ADDRESS_POOL[(addressCursor + i) % ADDRESS_POOL.length];
    if (!usedAddresses.has(candidate)) {
      addressCursor = (addressCursor + i + 1) % ADDRESS_POOL.length;
      return candidate;
    }
  }
  const fallback = `0x${(0xD00 + addressCursor * 0x40).toString(16).toUpperCase()}`;
  addressCursor += 1;
  return fallback;
}

function nextNodeId() {
  idCounter += 1;
  return `ll-node-${idCounter}`;
}

export function resetModelCounters() {
  addressCursor = 0;
  idCounter = 0;
}

export function cloneModel(model) {
  const nodesCopy = {};
  for (const [id, node] of Object.entries(model.nodes || {})) {
    nodesCopy[id] = { ...node };
  }
  return {
    headId: model.headId ?? null,
    tailId: model.tailId ?? null,
    length: model.length ?? 0,
    nodes: nodesCopy,
  };
}

/**
 * Walks the linked list starting strictly from `headId` following `.nextId`.
 * Protects against temporary cycles created mid-operation.
 */
export function deriveChain(model, startId = model?.headId) {
  const chain = [];
  const visited = new Set();
  let curId = startId;
  while (curId && model?.nodes?.[curId] && !visited.has(curId)) {
    visited.add(curId);
    const node = model.nodes[curId];
    chain.push(node);
    curId = node.nextId;
  }
  return chain;
}

/**
 * Derives actual pointer arrows (`fromId -> toId | null`) directly from node `.nextId` references.
 */
export function deriveArrows(model) {
  const arrows = [];
  const chain = deriveChain(model);
  for (const node of chain) {
    arrows.push({
      fromId: node.id,
      toId: node.nextId,
    });
  }
  return arrows;
}

/**
 * Validates core singly linked list structural invariants.
 */
export function validateModelInvariants(model) {
  const chain = deriveChain(model);
  if (chain.length === 0) {
    return (
      model.headId === null &&
      model.tailId === null &&
      model.length === 0 &&
      Object.keys(model.nodes).length === 0
    );
  }
  const first = chain[0];
  const last = chain[chain.length - 1];
  return (
    model.headId === first.id &&
    model.tailId === last.id &&
    last.nextId === null &&
    model.length === chain.length &&
    chain.length === Object.keys(model.nodes).length
  );
}

/**
 * Creates a singly linked list model from initial values.
 */
export function createLinkedList(values = [10, 25, 37, 52, 68], deterministicAddresses = false) {
  if (deterministicAddresses) {
    resetModelCounters();
  }

  const nodes = {};
  const used = new Set();
  const createdIds = [];

  for (const val of values) {
    const id = nextNodeId();
    const address = nextSimulatedAddress(used);
    used.add(address);
    nodes[id] = { id, data: val, nextId: null, address };
    createdIds.push(id);
  }

  for (let i = 0; i < createdIds.length - 1; i++) {
    nodes[createdIds[i]].nextId = createdIds[i + 1];
  }

  return {
    headId: createdIds[0] ?? null,
    tailId: createdIds[createdIds.length - 1] ?? null,
    length: createdIds.length,
    nodes,
  };
}

function getUsedAddresses(model) {
  return new Set(Object.values(model.nodes).map((n) => n.address));
}

function formatAddr(model, id) {
  if (!id || !model.nodes[id]) return 'NULL';
  return model.nodes[id].address;
}

function createStep({
  model,
  title,
  description,
  codeLine = '',
  pointers = {},
  highlightedNodeId = null,
  highlightedField = null, // 'data' | 'next' | 'both' | null
  highlightedArrowFromId = null,
  foundNodeId = null,
  detachedNodeIds = [],
  secondaryHeadId = null,
  isReversedHighlight = false,
}) {
  return {
    model: cloneModel(model),
    title,
    description,
    codeLine,
    pointers: { ...pointers },
    highlightedNodeId,
    highlightedField,
    highlightedArrowFromId,
    foundNodeId,
    detachedNodeIds: [...detachedNodeIds],
    secondaryHeadId,
    isReversedHighlight,
  };
}

/* ─── Interactive Operations Returning Step Traces & Final Model ─────────── */

export function tracePrepend(initialModel, value) {
  const m = cloneModel(initialModel);
  const steps = [];
  const used = getUsedAddresses(m);
  const newId = nextNodeId();
  const newAddr = nextSimulatedAddress(used);

  // Step 1: Allocate node independently
  m.nodes[newId] = { id: newId, data: value, nextId: null, address: newAddr };
  steps.push(
    createStep({
      model: m,
      title: `Step 1: Allocate new node (${value})`,
      description: `Created a new node in memory at ${newAddr} with DATA = ${value} and NEXT = NULL. HEAD still points to ${formatAddr(m, m.headId)}.`,
      codeLine: `const newNode = new Node(${value});`,
      pointers: { newNode: newId },
      highlightedNodeId: newId,
      highlightedField: 'data',
      detachedNodeIds: [newId],
    })
  );

  // Step 2: Wire newNode.next = head
  m.nodes[newId].nextId = m.headId;
  steps.push(
    createStep({
      model: m,
      title: `Step 2: Point newNode.next to HEAD`,
      description: m.headId
        ? `Updated newNode.next (${newAddr}) to store ${formatAddr(m, m.headId)}, linking it to the current first node.`
        : `List was empty, so newNode.next stays NULL.`,
      codeLine: 'newNode.next = this.head;',
      pointers: { newNode: newId },
      highlightedNodeId: newId,
      highlightedField: 'next',
      highlightedArrowFromId: newId,
      detachedNodeIds: [newId],
    })
  );

  // Step 3: Update head (and tail if list was empty)
  m.headId = newId;
  if (!m.tailId) m.tailId = newId;
  m.length += 1;
  steps.push(
    createStep({
      model: m,
      title: 'Step 3: Reassign HEAD to newNode',
      description: `Updated HEAD to store ${newAddr}. Prepend completes in O(1) time without shifting existing nodes.`,
      codeLine: 'this.head = newNode;',
      pointers: { newNode: newId },
      highlightedNodeId: newId,
      highlightedField: 'both',
    })
  );

  return { model: m, steps };
}

export function traceAppend(initialModel, value) {
  const m = cloneModel(initialModel);
  const steps = [];
  const used = getUsedAddresses(m);
  const newId = nextNodeId();
  const newAddr = nextSimulatedAddress(used);

  m.nodes[newId] = { id: newId, data: value, nextId: null, address: newAddr };
  steps.push(
    createStep({
      model: m,
      title: `Step 1: Allocate new node (${value})`,
      description: `Allocated new node at ${newAddr} with DATA = ${value} and NEXT = NULL.`,
      codeLine: `const newNode = new Node(${value});`,
      pointers: { newNode: newId },
      highlightedNodeId: newId,
      highlightedField: 'data',
      detachedNodeIds: [newId],
    })
  );

  if (!m.headId) {
    m.headId = newId;
    m.tailId = newId;
    m.length = 1;
    steps.push(
      createStep({
        model: m,
        title: 'Step 2: Empty list — set HEAD and TAIL',
        description: `Since HEAD was NULL, both HEAD and TAIL now point to ${newAddr}.`,
        codeLine: 'this.head = newNode; this.tail = newNode;',
        pointers: { newNode: newId },
        highlightedNodeId: newId,
        highlightedField: 'both',
      })
    );
    return { model: m, steps };
  }

  const oldTailId = m.tailId;
  m.nodes[oldTailId].nextId = newId;
  steps.push(
    createStep({
      model: m,
      title: 'Step 2: Wire old TAIL.next to newNode',
      description: `Updated old TAIL (${formatAddr(m, oldTailId)}) NEXT field from NULL to ${newAddr}.`,
      codeLine: 'this.tail.next = newNode;',
      pointers: { oldTail: oldTailId, newNode: newId },
      highlightedNodeId: oldTailId,
      highlightedField: 'next',
      highlightedArrowFromId: oldTailId,
    })
  );

  m.tailId = newId;
  m.length += 1;
  steps.push(
    createStep({
      model: m,
      title: 'Step 3: Move TAIL to newNode',
      description: `Updated TAIL reference to ${newAddr}. Because TAIL is maintained, Append runs in O(1) time.`,
      codeLine: 'this.tail = newNode;',
      pointers: { newNode: newId },
      highlightedNodeId: newId,
      highlightedField: 'both',
    })
  );

  return { model: m, steps };
}

export function traceInsertAt(initialModel, value, position) {
  const idx = Number(position);
  if (!Number.isInteger(idx) || idx < 0 || idx > initialModel.length) {
    return {
      model: cloneModel(initialModel),
      steps: [
        createStep({
          model: initialModel,
          title: 'Invalid Position',
          description: `Position must be between 0 and ${initialModel.length}.`,
        }),
      ],
      error: `Position must be between 0 and ${initialModel.length}.`,
    };
  }

  if (idx === 0) return tracePrepend(initialModel, value);
  if (idx === initialModel.length) return traceAppend(initialModel, value);

  const m = cloneModel(initialModel);
  const steps = [];
  const used = getUsedAddresses(m);
  const chain = deriveChain(m);

  // Step 1..idx: Traverse curr to position - 1
  for (let i = 0; i < idx; i++) {
    const currNode = chain[i];
    steps.push(
      createStep({
        model: m,
        title: `Traverse to predecessor (index ${i}/${idx - 1})`,
        description:
          i === idx - 1
            ? `Reached node ${currNode.data} (${currNode.address}), the node right before insertion index ${idx}.`
            : `Moving curr pointer from ${currNode.address} to ${formatAddr(m, currNode.nextId)} to reach index ${idx - 1}.`,
        codeLine: i === 0 ? 'let curr = this.head;' : 'curr = curr.next;',
        pointers: { curr: currNode.id },
        highlightedNodeId: currNode.id,
        highlightedField: i === idx - 1 ? 'next' : 'data',
        highlightedArrowFromId: i < idx - 1 ? currNode.id : null,
      })
    );
  }

  const prevNodeId = chain[idx - 1].id;
  const nextAfterId = m.nodes[prevNodeId].nextId;
  const newId = nextNodeId();
  const newAddr = nextSimulatedAddress(used);

  // Allocate newNode
  m.nodes[newId] = { id: newId, data: value, nextId: null, address: newAddr };
  steps.push(
    createStep({
      model: m,
      title: `Allocate newNode (${value})`,
      description: `Created node ${value} at ${newAddr} before modifying existing list links.`,
      codeLine: `const newNode = new Node(${value});`,
      pointers: { curr: prevNodeId, newNode: newId },
      highlightedNodeId: newId,
      highlightedField: 'data',
      detachedNodeIds: [newId],
    })
  );

  // Set newNode.next = curr.next
  m.nodes[newId].nextId = nextAfterId;
  steps.push(
    createStep({
      model: m,
      title: 'Link newNode.next to curr.next',
      description: `Set newNode.next (${newAddr}) = ${formatAddr(m, nextAfterId)} first so the remaining chain is never lost.`,
      codeLine: 'newNode.next = curr.next;',
      pointers: { curr: prevNodeId, newNode: newId },
      highlightedNodeId: newId,
      highlightedField: 'next',
      highlightedArrowFromId: newId,
      detachedNodeIds: [newId],
    })
  );

  // Set curr.next = newNode
  m.nodes[prevNodeId].nextId = newId;
  m.length += 1;
  steps.push(
    createStep({
      model: m,
      title: 'Reassign curr.next = newNode',
      description: `Updated node ${m.nodes[prevNodeId].data}'s NEXT pointer to ${newAddr}. Insertion at index ${idx} complete.`,
      codeLine: 'curr.next = newNode;',
      pointers: { curr: prevNodeId, newNode: newId },
      highlightedNodeId: prevNodeId,
      highlightedField: 'next',
      highlightedArrowFromId: prevNodeId,
    })
  );

  return { model: m, steps };
}

export function traceDeleteHead(initialModel) {
  const m = cloneModel(initialModel);
  if (!m.headId) {
    return {
      model: m,
      steps: [
        createStep({
          model: m,
          title: 'List is Empty',
          description: 'HEAD is already NULL — there is no head node to remove.',
          codeLine: 'if (!this.head) return null;',
        }),
      ],
      error: 'Cannot delete from an empty list.',
    };
  }

  const steps = [];
  const oldHeadId = m.headId;
  const oldHead = m.nodes[oldHeadId];
  const newHeadId = oldHead.nextId;

  steps.push(
    createStep({
      model: m,
      title: 'Step 1: Mark old HEAD node',
      description: `Holding reference to current HEAD (${oldHead.data} at ${oldHead.address}) before updating HEAD.`,
      codeLine: 'const removed = this.head;',
      pointers: { oldHead: oldHeadId },
      highlightedNodeId: oldHeadId,
      highlightedField: 'both',
    })
  );

  m.headId = newHeadId;
  if (!newHeadId) {
    m.tailId = null;
  }
  steps.push(
    createStep({
      model: m,
      title: 'Step 2: Advance HEAD to head.next',
      description: newHeadId
        ? `Updated HEAD to ${formatAddr(m, newHeadId)}. Old node ${oldHead.address} is now unreachable from HEAD.`
        : 'List had only one node, so HEAD and TAIL both become NULL.',
      codeLine: 'this.head = this.head.next;',
      pointers: { oldHead: oldHeadId },
      highlightedNodeId: newHeadId,
      highlightedField: newHeadId ? 'data' : null,
      detachedNodeIds: [oldHeadId],
    })
  );

  delete m.nodes[oldHeadId];
  m.length = Math.max(0, m.length - 1);
  steps.push(
    createStep({
      model: m,
      title: 'Step 3: Old HEAD removed from list',
      description: `Removed ${oldHead.data} (${oldHead.address}). Delete Head is always O(1).`,
      codeLine: 'return removed.data;',
      highlightedNodeId: m.headId,
      highlightedField: m.headId ? 'data' : null,
    })
  );

  return { model: m, steps };
}

export function traceDeleteTail(initialModel) {
  const m = cloneModel(initialModel);
  if (!m.headId) {
    return {
      model: m,
      steps: [
        createStep({
          model: m,
          title: 'List is Empty',
          description: 'HEAD is NULL — no tail node exists to delete.',
          codeLine: 'if (!this.head) return null;',
        }),
      ],
      error: 'Cannot delete from an empty list.',
    };
  }

  if (m.headId === m.tailId) {
    return traceDeleteHead(initialModel);
  }

  const steps = [];
  const chain = deriveChain(m);
  const oldTailId = m.tailId;
  const oldTailAddr = m.nodes[oldTailId].address;
  const oldTailData = m.nodes[oldTailId].data;

  // Traverse until curr.next === tail (chain.length - 2)
  for (let i = 0; i <= chain.length - 2; i++) {
    const node = chain[i];
    const isSecondLast = i === chain.length - 2;
    steps.push(
      createStep({
        model: m,
        title: isSecondLast
          ? `Found second-last node (${node.data})`
          : `Traversing from HEAD (${i + 1}/${chain.length - 1})`,
        description: isSecondLast
          ? `Stopped at ${node.data} (${node.address}) because curr.next points to TAIL (${oldTailAddr}).`
          : `In a singly linked list we have no backward pointer from TAIL, so curr walks forward from ${node.address}.`,
        codeLine: i === 0 ? 'let curr = this.head;' : 'while (curr.next.next !== null) curr = curr.next;',
        pointers: { curr: node.id },
        highlightedNodeId: node.id,
        highlightedField: isSecondLast ? 'next' : 'data',
        highlightedArrowFromId: isSecondLast ? null : node.id,
      })
    );
  }

  const prevTailId = chain[chain.length - 2].id;
  m.nodes[prevTailId].nextId = null;
  m.tailId = prevTailId;

  steps.push(
    createStep({
      model: m,
      title: 'Set second-last.next = NULL & update TAIL',
      description: `Detached ${oldTailData} (${oldTailAddr}) by setting ${m.nodes[prevTailId].data}.next = NULL and reassigning TAIL.`,
      codeLine: 'curr.next = null; this.tail = curr;',
      pointers: { curr: prevTailId, removed: oldTailId },
      highlightedNodeId: prevTailId,
      highlightedField: 'next',
      detachedNodeIds: [oldTailId],
    })
  );

  delete m.nodes[oldTailId];
  m.length = Math.max(0, m.length - 1);

  steps.push(
    createStep({
      model: m,
      title: 'Delete Tail complete — O(n)',
      description: `Removed old TAIL (${oldTailData}). Deleting TAIL in a singly linked list takes O(n) time.`,
      codeLine: 'return removed.data;',
      highlightedNodeId: prevTailId,
      highlightedField: 'both',
    })
  );

  return { model: m, steps };
}

export function traceDeleteAt(initialModel, position) {
  const idx = Number(position);
  if (!initialModel.headId) {
    return {
      model: cloneModel(initialModel),
      steps: [
        createStep({
          model: initialModel,
          title: 'List is Empty',
          description: 'Cannot delete from an empty list.',
        }),
      ],
      error: 'Cannot delete from an empty list.',
    };
  }
  if (!Number.isInteger(idx) || idx < 0 || idx >= initialModel.length) {
    return {
      model: cloneModel(initialModel),
      steps: [
        createStep({
          model: initialModel,
          title: 'Invalid Position',
          description: `Position must be between 0 and ${initialModel.length - 1}.`,
        }),
      ],
      error: `Position must be between 0 and ${initialModel.length - 1}.`,
    };
  }

  if (idx === 0) return traceDeleteHead(initialModel);
  if (idx === initialModel.length - 1) return traceDeleteTail(initialModel);

  const m = cloneModel(initialModel);
  const steps = [];
  const chain = deriveChain(m);

  for (let i = 0; i < idx; i++) {
    const node = chain[i];
    steps.push(
      createStep({
        model: m,
        title: `Traverse to predecessor (${i}/${idx - 1})`,
        description:
          i === idx - 1
            ? `Reached predecessor ${node.data} (${node.address}) right before target index ${idx}.`
            : `Stepping curr from ${node.address} toward index ${idx - 1}.`,
        codeLine: i === 0 ? 'let curr = this.head;' : 'curr = curr.next;',
        pointers: { curr: node.id },
        highlightedNodeId: node.id,
        highlightedField: i === idx - 1 ? 'next' : 'data',
        highlightedArrowFromId: node.id,
      })
    );
  }

  const prevId = chain[idx - 1].id;
  const targetId = chain[idx].id;
  const targetNode = m.nodes[targetId];
  const afterTargetId = targetNode.nextId;

  m.nodes[prevId].nextId = afterTargetId;
  steps.push(
    createStep({
      model: m,
      title: `Bypass target node (${targetNode.data})`,
      description: `Set ${m.nodes[prevId].data}.next = ${formatAddr(m, afterTargetId)}, skipping over ${targetNode.data} (${targetNode.address}).`,
      codeLine: 'curr.next = curr.next.next;',
      pointers: { curr: prevId, removed: targetId },
      highlightedNodeId: prevId,
      highlightedField: 'next',
      highlightedArrowFromId: prevId,
      detachedNodeIds: [targetId],
    })
  );

  delete m.nodes[targetId];
  m.length = Math.max(0, m.length - 1);

  steps.push(
    createStep({
      model: m,
      title: `Deleted node at index ${idx}`,
      description: `Node ${targetNode.data} (${targetNode.address}) has been freed from the active chain.`,
      codeLine: `// Node at position ${idx} removed`,
      highlightedNodeId: prevId,
      highlightedField: 'both',
    })
  );

  return { model: m, steps };
}

export function traceSearch(initialModel, target) {
  const m = cloneModel(initialModel);
  const chain = deriveChain(m);
  const steps = [];

  if (chain.length === 0) {
    steps.push(
      createStep({
        model: m,
        title: `Search for ${target} — Empty List`,
        description: 'HEAD is NULL. Value cannot exist in an empty list.',
        codeLine: 'return -1;',
      })
    );
    return { model: m, steps, foundIndex: -1 };
  }

  for (let i = 0; i < chain.length; i++) {
    const node = chain[i];
    const isMatch = node.data === target;
    steps.push(
      createStep({
        model: m,
        title: isMatch
          ? `Found ${target} at index ${i}!`
          : `Inspecting index ${i}: ${node.data} !== ${target}`,
        description: isMatch
          ? `DATA at ${node.address} equals ${target}. Traversal stops after checking ${i + 1} node${i === 0 ? '' : 's'}.`
          : `Checked ${node.data} at ${node.address}. Following NEXT pointer (${formatAddr(m, node.nextId)}).`,
        codeLine: isMatch ? 'if (curr.data === target) return curr;' : 'curr = curr.next;',
        pointers: { curr: node.id },
        highlightedNodeId: node.id,
        highlightedField: isMatch ? 'data' : 'next',
        highlightedArrowFromId: isMatch ? null : node.id,
        foundNodeId: isMatch ? node.id : null,
      })
    );
    if (isMatch) {
      return { model: m, steps, foundIndex: i, foundNodeId: node.id };
    }
  }

  steps.push(
    createStep({
      model: m,
      title: `${target} not found (reached NULL)`,
      description: `Followed NEXT from TAIL and hit NULL. Sequential search visited all ${chain.length} nodes — O(n).`,
      codeLine: 'return null;',
    })
  );

  return { model: m, steps, foundIndex: -1 };
}

export function traceTraverse(initialModel) {
  const m = cloneModel(initialModel);
  const chain = deriveChain(m);
  const steps = [];

  if (chain.length === 0) {
    steps.push(
      createStep({
        model: m,
        title: 'Traversal complete immediately (HEAD = NULL)',
        description: 'With HEAD === NULL, the while (curr !== null) loop executes 0 times.',
        codeLine: 'while (curr !== null) { curr = curr.next; }',
      })
    );
    return { model: m, steps };
  }

  chain.forEach((node, i) => {
    steps.push(
      createStep({
        model: m,
        title: `Visit node ${i + 1}/${chain.length}: ${node.data}`,
        description: node.nextId
          ? `Read DATA = ${node.data} at ${node.address}, then follow NEXT (${formatAddr(m, node.nextId)}).`
          : `Read final DATA = ${node.data} at ${node.address}. Its NEXT is NULL, ending traversal.`,
        codeLine: 'console.log(curr.data); curr = curr.next;',
        pointers: { curr: node.id },
        highlightedNodeId: node.id,
        highlightedField: 'both',
        highlightedArrowFromId: node.id,
      })
    );
  });

  steps.push(
    createStep({
      model: m,
      title: 'Traversal terminated at NULL',
      description: `Visited every node exactly once (${chain.length} steps total) — O(n) time, O(1) space.`,
      codeLine: '// curr === null -> loop ends',
    })
  );

  return { model: m, steps };
}

/**
 * Iterative 3-pointer linked list reversal trace (`prev`, `curr`, `nextNode`).
 * Reverses actual `.nextId` references step-by-step and preserves forward-chain visibility
 * through `secondaryHeadId` when `curr.next = prev` temporarily splits the remaining nodes.
 */
export function traceReverse(initialModel) {
  const m = cloneModel(initialModel);
  const steps = [];

  if (!m.headId) {
    steps.push(
      createStep({
        model: m,
        title: 'List is Empty',
        description: 'HEAD is NULL — reversing an empty list produces NULL.',
        codeLine: 'return null;',
      })
    );
    return { model: m, steps };
  }

  const originalHeadId = m.headId;
  let prevId = null;
  let currId = m.headId;
  let nextNodeIdVal = null;

  steps.push(
    createStep({
      model: m,
      title: 'Initialize Pointers',
      description: `Set prev = NULL and curr = HEAD (${formatAddr(m, currId)}). No links have been reversed yet.`,
      codeLine: 'let prev = null; let curr = this.head;',
      pointers: { prev: prevId, curr: currId, nextNode: null },
      highlightedNodeId: currId,
      highlightedField: 'both',
    })
  );

  let iter = 1;
  while (currId) {
    nextNodeIdVal = m.nodes[currId].nextId;

    // Step 1: Save nextNode
    steps.push(
      createStep({
        model: m,
        title: `Iteration ${iter} · Step 1: Save nextNode`,
        description: nextNodeIdVal
          ? `Store nextNode = curr.next (${formatAddr(m, nextNodeIdVal)}) before overwriting curr.next so the rest of the list isn't lost.`
          : 'curr.next is NULL, so nextNode = NULL (this is the last node to reverse).',
        codeLine: 'const nextNode = curr.next;',
        pointers: { prev: prevId, curr: currId, nextNode: nextNodeIdVal },
        highlightedNodeId: currId,
        highlightedField: 'next',
        highlightedArrowFromId: currId,
        secondaryHeadId: nextNodeIdVal,
      })
    );

    // Step 2: Reverse actual pointer curr.next = prev
    m.nodes[currId].nextId = prevId;
    steps.push(
      createStep({
        model: m,
        title: `Iteration ${iter} · Step 2: Reverse pointer (curr.next = prev)`,
        description: prevId
          ? `Flipped ${m.nodes[currId].data}.next (${formatAddr(m, currId)}) backward to point to ${formatAddr(m, prevId)}!`
          : `Set ${m.nodes[currId].data}.next (${formatAddr(m, currId)}) = NULL — it will become the new TAIL.`,
        codeLine: 'curr.next = prev;',
        pointers: { prev: prevId, curr: currId, nextNode: nextNodeIdVal },
        highlightedNodeId: currId,
        highlightedField: 'next',
        highlightedArrowFromId: currId,
        secondaryHeadId: nextNodeIdVal,
        isReversedHighlight: true,
      })
    );

    // Step 3: prev = curr
    prevId = currId;
    steps.push(
      createStep({
        model: m,
        title: `Iteration ${iter} · Step 3: Advance prev = curr`,
        description: `Moved prev pointer forward to ${m.nodes[prevId].data} (${formatAddr(m, prevId)}).`,
        codeLine: 'prev = curr;',
        pointers: { prev: prevId, curr: currId, nextNode: nextNodeIdVal },
        highlightedNodeId: prevId,
        highlightedField: 'data',
        secondaryHeadId: nextNodeIdVal,
      })
    );

    // Step 4: curr = nextNode
    currId = nextNodeIdVal;
    steps.push(
      createStep({
        model: m,
        title: `Iteration ${iter} · Step 4: Advance curr = nextNode`,
        description: currId
          ? `Moved curr forward to ${m.nodes[currId].data} (${formatAddr(m, currId)}) for the next iteration.`
          : 'nextNode is NULL, so curr becomes NULL — the while loop terminates!',
        codeLine: 'curr = nextNode;',
        pointers: { prev: prevId, curr: currId, nextNode: nextNodeIdVal },
        highlightedNodeId: currId || prevId,
        highlightedField: 'data',
        secondaryHeadId: currId,
      })
    );

    iter += 1;
  }

  // Finalize HEAD and TAIL on reversed model
  m.headId = prevId;
  m.tailId = originalHeadId;

  steps.push(
    createStep({
      model: m,
      title: 'Finalize HEAD = prev',
      description: `All next pointers have reversed direction. Reassigned HEAD = ${formatAddr(m, m.headId)} and TAIL = ${formatAddr(m, m.tailId)}.`,
      codeLine: 'this.head = prev;',
      pointers: { prev: prevId, curr: null, nextNode: null },
      highlightedNodeId: m.headId,
      highlightedField: 'both',
    })
  );

  return { model: m, steps };
}

/**
 * Fast & Slow Pointers trace (Tortoise & Hare) for Middle of Linked List.
 * When list length is even, advances to the second middle node cleanly.
 */
export function traceFastSlow(initialModel) {
  const m = cloneModel(initialModel);
  const steps = [];

  if (!m.headId) {
    steps.push(
      createStep({
        model: m,
        title: 'Empty List — No Middle Node',
        description: 'HEAD is NULL, so slow = fast = NULL.',
        codeLine: 'if (!head) return null;',
      })
    );
    return { model: m, steps, middleNode: null };
  }

  let slowId = m.headId;
  let fastId = m.headId;

  steps.push(
    createStep({
      model: m,
      title: 'Initialize slow = head, fast = head',
      description: `Both slow (+1 step) and fast (+2 steps) begin at HEAD (${m.nodes[slowId].data} at ${m.nodes[slowId].address}).`,
      codeLine: 'let slow = head, fast = head;',
      pointers: { slow: slowId, fast: fastId },
      highlightedNodeId: slowId,
      highlightedField: 'data',
    })
  );

  let stepNum = 1;
  while (fastId && m.nodes[fastId].nextId) {
    const fastNext = m.nodes[fastId].nextId;
    slowId = m.nodes[slowId].nextId;
    fastId = m.nodes[fastNext]?.nextId ?? null;

    steps.push(
      createStep({
        model: m,
        title: `Round ${stepNum}: slow +1 · fast +2`,
        description: fastId
          ? `slow stepped 1x to ${m.nodes[slowId].data} (${formatAddr(m, slowId)}), while fast leaped 2x to ${m.nodes[fastId].data} (${formatAddr(m, fastId)}).`
          : `slow stepped 1x to ${m.nodes[slowId].data} (${formatAddr(m, slowId)}), and fast reached NULL past the tail.`,
        codeLine: 'slow = slow.next; fast = fast.next.next;',
        pointers: { slow: slowId, fast: fastId },
        highlightedNodeId: slowId,
        highlightedField: 'both',
      })
    );
    stepNum += 1;
  }

  const midNode = m.nodes[slowId];
  steps.push(
    createStep({
      model: m,
      title: `Middle Found: ${midNode.data} (${midNode.address})`,
      description: `Because fast moved twice as fast as slow, slow sits at the middle node (${midNode.data}) when fast hits the end!`,
      codeLine: 'return slow;',
      pointers: { slow: slowId, fast: fastId },
      highlightedNodeId: slowId,
      highlightedField: 'both',
      foundNodeId: slowId,
    })
  );

  return { model: m, steps, middleNode: midNode };
}

