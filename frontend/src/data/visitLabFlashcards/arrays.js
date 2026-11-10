export const arraysFlashcards = [
  {
    id: 'array-basics',
    topicLabel: '01 · WHAT IS AN ARRAY?',
    title: 'ARRAY BASICS',
    content:
      'An array stores multiple elements of the same data type in contiguous memory locations.',
    takeaway: 'Every slot holds a value paired with its position index.',
    tint: 'purple',
    icon: 'layers',
    visual: {
      type: 'cells',
      items: [
        { top: 'idx 0', val: '12', highlight: true },
        { top: 'idx 1', val: '47', highlight: true },
        { top: 'idx 2', val: '8', highlight: true },
        { top: 'idx 3', val: '93', highlight: true },
      ],
    },
  },
  {
    id: 'zero-based-indexing',
    topicLabel: '02 · ZERO-BASED INDEXING',
    title: 'INDEX STARTS AT ZERO',
    content: 'The first element of an array is stored at index 0, not index 1.',
    takeaway: 'Offset from start address is 0 steps for arr[0] = 12.',
    tint: 'yellow',
    icon: 'hash',
    visual: {
      type: 'indexGrid',
      rowALabel: 'Index:',
      rowBLabel: 'Value:',
      cols: [
        { a: '0', b: '12', hot: true },
        { a: '1', b: '47' },
        { a: '2', b: '8' },
        { a: '3', b: '93' },
      ],
    },
  },
  {
    id: 'contiguous-memory',
    topicLabel: '03 · CONTIGUOUS MEMORY',
    title: 'MEMORY MAGIC',
    content:
      'Array elements sit side-by-side in consecutive addresses, making indexed access instant.',
    takeaway: 'Illustrative 4-byte integer addresses (layout depends on runtime).',
    tint: 'mint',
    icon: 'cpu',
    visual: {
      type: 'chain',
      tone: 'mint',
      nodes: [
        { top: '0x100', val: '12' },
        { top: '0x104', val: '47' },
        { top: '0x108', val: '8' },
        { top: '0x10C', val: '93' },
      ],
    },
  },
  {
    id: 'time-complexity',
    topicLabel: '04 · TIME COMPLEXITY',
    title: 'SPEED CHECK',
    content:
      'Accessing an element by index takes O(1) time in the RAM model. Searching an unsorted array takes O(n) time.',
    takeaway: 'Direct offset arithmetic jumps to any index without scanning.',
    tint: 'cream',
    icon: 'zap',
    visual: {
      type: 'metrics',
      items: [
        { label: 'ACCESS arr[i]', val: 'O(1)', sub: 'Direct jump', tone: 'good' },
        { label: 'SEARCH val', val: 'O(n)', sub: 'Scan unsorted', tone: 'warn' },
      ],
    },
  },
  {
    id: 'array-length',
    topicLabel: '05 · ARRAY LENGTH',
    title: 'SIZE MATTERS',
    content:
      'Array length counts currently stored elements (distinct from capacity). The last valid index is length - 1.',
    takeaway: 'With 4 stored items, valid indices run from 0 up to 3.',
    tint: 'yellow',
    icon: 'ruler',
    visual: {
      type: 'cells',
      badges: ['Length = 4', 'Last index = 3'],
      items: [
        { top: 'idx 0', val: '12' },
        { top: 'idx 1', val: '47' },
        { top: 'idx 2', val: '8' },
        { top: 'idx 3', val: '93', highlight: true },
      ],
    },
  },
];

