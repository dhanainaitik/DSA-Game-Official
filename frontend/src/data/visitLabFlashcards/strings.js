export const stringsFlashcards = [
  {
    id: 'string-char-sequence',
    topicLabel: '01 · CHARACTER SEQUENCES',
    title: 'CHARACTER SEQUENCES',
    content:
      'A string is an ordered sequence of characters where whitespace and punctuation each occupy a position.',
    takeaway: '"hi !" stores 4 characters including the space.',
    tint: 'orange',
    icon: 'type',
    visual: {
      type: 'cells',
      items: [
        { top: '0', val: "'h'", highlight: true },
        { top: '1', val: "'i'" },
        { top: '2', val: "' '" },
        { top: '3', val: "'!'" },
      ],
    },
  },
  {
    id: 'string-immutability',
    topicLabel: '02 · IMMUTABILITY',
    title: 'STRING IMMUTABILITY',
    content:
      'In JavaScript, Python, and Java, strings are immutable — changing them creates a brand-new string instead of editing in place.',
    takeaway: 's.toUpperCase() leaves original s untouched and returns a copy.',
    tint: 'yellow',
    icon: 'lock',
    visual: {
      type: 'metrics',
      items: [
        { label: 'ORIGINAL s', val: '"code"', sub: 'Remains unchanged', tone: 'neutral' },
        { label: 'NEW STRING', val: '"CODE"', sub: 'Allocated copy', tone: 'good' },
      ],
    },
  },
  {
    id: 'string-indexing',
    topicLabel: '03 · CHARACTER INDEXING',
    title: 'ZERO-BASED INDEXING',
    content:
      'Read any character at index i using s[i] in O(1) time (indexed by UTF-16 code units in JavaScript).',
    takeaway: 'Last valid index is s.length - 1.',
    tint: 'orange',
    icon: 'hash',
    visual: {
      type: 'indexGrid',
      rowALabel: 'Index:',
      rowBLabel: 'Char:',
      cols: [
        { a: '0', b: 'h', hot: true },
        { a: '1', b: 'e' },
        { a: '2', b: 'l' },
        { a: '3', b: 'l' },
        { a: '4', b: 'o' },
      ],
    },
  },
  {
    id: 'string-traversal',
    topicLabel: '04 · TRAVERSAL',
    title: 'STRING TRAVERSAL',
    content:
      'Counting vowels, checking palindromes, or frequency checks scan characters sequentially in O(n) time.',
    takeaway: 'Inspect each character once from left to right (or two pointers).',
    tint: 'cream',
    icon: 'scan',
    visual: {
      type: 'cells',
      badges: ['Visit each char once · O(n)'],
      items: [
        { top: '0', val: 'a', highlight: true },
        { top: '1', val: 'b' },
        { top: '2', val: 'c' },
        { top: '3', val: 'e', highlight: true },
      ],
    },
  },
  {
    id: 'string-substrings',
    topicLabel: '05 · SUBSTRINGS & COMPLEXITY',
    title: 'SUBSTRING COMPLEXITY',
    content:
      'Extracting a substring of length k copies k characters (O(k)). Repeated string + concatenation inside loops can cost O(n²).',
    takeaway: 'Collect chunks in an array and join() once at the end — O(n).',
    tint: 'mint',
    icon: 'scissors',
    visual: {
      type: 'metrics',
      items: [
        { label: 'slice(0, k)', val: 'O(k)', sub: 'Copies k chars', tone: 'good' },
        { label: 'loop s += ch', val: 'Up to O(n²)', sub: 'Re-copies prefix', tone: 'warn' },
      ],
    },
  },
];

