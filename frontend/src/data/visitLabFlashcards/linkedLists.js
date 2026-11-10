export const linkedListsFlashcards = [
  {
    id: 'll-node-structure',
    topicLabel: '01 · NODE STRUCTURE',
    title: 'NODE STRUCTURE',
    content:
      'Each node stores two fields together: DATA (its payload value) and NEXT (a reference to the following node).',
    takeaway: 'Every node carries its own link to keep the chain intact.',
    tint: 'green',
    icon: 'box',
    visual: {
      type: 'chain',
      tone: 'green',
      nodes: [
        { top: '0x100', val: 'DATA: 10 | 0x240', highlight: true },
        { top: '0x240', val: 'DATA: 25 | NULL' },
      ],
    },
  },
  {
    id: 'll-head-tail',
    topicLabel: '02 · ENTRY & BOUNDARY',
    title: 'HEAD AND TAIL',
    content:
      'HEAD points to the first node (list entry). TAIL marks the last node, whose NEXT reference stores NULL.',
    takeaway: 'Overwrite HEAD prematurely and the rest of the list becomes unreachable.',
    tint: 'mint',
    icon: 'compass',
    visual: {
      type: 'chain',
      tone: 'green',
      nodes: [
        { top: 'HEAD', val: '10', highlight: true },
        { top: '0x240', val: '25' },
        { top: 'TAIL', val: '37' },
        { top: 'END', val: 'NULL' },
      ],
    },
  },
  {
    id: 'll-pointers',
    topicLabel: '03 · MEMORY REFERENCES',
    title: 'POINTERS & REFERENCES',
    content:
      'Unlike arrays, nodes do not need contiguous memory. Their .next references connect nodes scattered across the heap.',
    takeaway: 'Simulated addresses 0x100 → 0x3A0 jump freely via references.',
    tint: 'cream',
    icon: 'link',
    visual: {
      type: 'chain',
      tone: 'green',
      nodes: [
        { top: '0x100', val: '10' },
        { top: '0x3A0', val: '25', highlight: true },
        { top: '0x1E0', val: '37' },
      ],
    },
  },
  {
    id: 'll-traversal',
    topicLabel: '04 · SEQUENTIAL ACCESS',
    title: 'TRAVERSAL (NO INDEXING)',
    content:
      'Linked lists have no O(1) index access like arr[i]. Start curr = HEAD and step curr = curr.next until NULL.',
    takeaway: 'Reaching the k-th element requires O(n) pointer chasing.',
    tint: 'yellow',
    icon: 'arrowRight',
    visual: {
      type: 'metrics',
      items: [
        { label: 'GET index i', val: 'O(n)', sub: 'Walk from HEAD', tone: 'warn' },
        { label: 'SPACE / STEP', val: 'O(1)', sub: 'One curr pointer', tone: 'good' },
      ],
    },
  },
  {
    id: 'll-insert-delete',
    topicLabel: '05 · OPERATIONS & SPEED',
    title: 'INSERTION & DELETION',
    content:
      'Prepend and Delete Head run in O(1) without shifting elements. Delete Tail in a singly linked list is O(n) without a backward link.',
    takeaway: 'Link newNode.next = curr.next BEFORE changing curr.next.',
    tint: 'green',
    icon: 'zap',
    visual: {
      type: 'metrics',
      items: [
        { label: 'PREPEND / DEL HEAD', val: 'O(1)', sub: 'Rewire HEAD once', tone: 'good' },
        { label: 'DELETE TAIL (SLL)', val: 'O(n)', sub: 'Find second-last', tone: 'warn' },
      ],
    },
  },
];

