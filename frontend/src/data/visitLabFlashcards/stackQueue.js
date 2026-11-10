export const stackQueueFlashcards = [
  {
    id: 'sq-lifo',
    topicLabel: '01 · STACK PRINCIPLE',
    title: 'STACK: LIFO PRINCIPLE',
    content:
      'A Stack follows Last In, First Out (LIFO): the newest element pushed on top is always the first popped off.',
    takeaway: 'Think of a vertical stack of plates — only the TOP is open.',
    tint: 'pink',
    icon: 'layers',
    visual: {
      type: 'stackMini',
      frames: [
        { label: '30', note: 'TOP', hot: true },
        { label: '20', note: '' },
        { label: '10', note: 'bottom' },
      ],
    },
  },
  {
    id: 'sq-push-pop',
    topicLabel: '02 · STACK OPERATIONS',
    title: 'PUSH, POP & PEEK',
    content:
      'push(x) inserts at the top, pop() removes the top item, and peek() reads the top without removing it — all O(1).',
    takeaway: 'Access is strictly restricted to the TOP end.',
    tint: 'yellow',
    icon: 'arrowUp',
    visual: {
      type: 'metrics',
      items: [
        { label: 'PUSH / POP', val: 'O(1)', sub: 'Modify top only', tone: 'good' },
        { label: 'PEEK top', val: 'O(1)', sub: 'Read without pop', tone: 'good' },
      ],
    },
  },
  {
    id: 'sq-fifo',
    topicLabel: '03 · QUEUE PRINCIPLE',
    title: 'QUEUE: FIFO PRINCIPLE',
    content:
      'A Queue follows First In, First Out (FIFO): elements wait in line and leave in exact arrival order.',
    takeaway: 'Oldest item leaves first from FRONT; new items join REAR.',
    tint: 'teal',
    icon: 'arrowRight',
    visual: {
      type: 'chain',
      tone: 'teal',
      nodes: [
        { top: 'FRONT', val: '10', highlight: true },
        { top: 'next', val: '20' },
        { top: 'REAR', val: '30' },
      ],
    },
  },
  {
    id: 'sq-enqueue-dequeue',
    topicLabel: '04 · QUEUE OPERATIONS',
    title: 'ENQUEUE & DEQUEUE',
    content:
      'enqueue appends at REAR (O(1)). Using a circular buffer or linked head makes dequeue O(1), unlike JS array.shift() which is O(n).',
    takeaway: 'Circular arrays reuse freed front slots mod capacity.',
    tint: 'mint',
    icon: 'refresh',
    visual: {
      type: 'metrics',
      items: [
        { label: 'TRUE QUEUE DEQUEUE', val: 'O(1)', sub: 'Head pointer / ring', tone: 'good' },
        { label: 'ARRAY .shift()', val: 'O(n)', sub: 'Shifts all items', tone: 'warn' },
      ],
    },
  },
  {
    id: 'sq-applications',
    topicLabel: '05 · REAL APPLICATIONS',
    title: 'STACK VS QUEUE USES',
    content:
      'Stacks solve balanced parentheses, undo history, and DFS. Queues schedule tasks and power level-order BFS.',
    takeaway: 'LIFO backtracks cleanly; FIFO processes oldest work fairly.',
    tint: 'cream',
    icon: 'sparkles',
    visual: {
      type: 'metrics',
      items: [
        { label: 'STACK (LIFO)', val: 'DFS / Undo', sub: 'Valid "()[]{}"', tone: 'neutral' },
        { label: 'QUEUE (FIFO)', val: 'BFS / Tasks', sub: 'Level by level', tone: 'good' },
      ],
    },
  },
];

