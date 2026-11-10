export const recursionFlashcards = [
  {
    id: 'rec-base-case',
    topicLabel: '01 · STOP CONDITION',
    title: 'BASE CASE',
    content:
      'Every recursive function must have a base case that returns directly without calling itself — stopping infinite loops.',
    takeaway: 'Without a reachable base case, calls trigger Stack Overflow.',
    tint: 'green',
    icon: 'shield',
    visual: {
      type: 'metrics',
      items: [
        { label: 'if (n <= 0)', val: 'return 1', sub: 'Base case halts', tone: 'good' },
        { label: 'NO BASE CASE', val: 'Overflow!', sub: 'Endless calls', tone: 'warn' },
      ],
    },
  },
  {
    id: 'rec-recursive-case',
    topicLabel: '02 · SUBPROBLEM STEP',
    title: 'RECURSIVE CASE',
    content:
      'The recursive step shrinks the problem toward the base case on every call, like n * factorial(n - 1).',
    takeaway: 'Make sure arguments progress strictly toward the base case.',
    tint: 'mint',
    icon: 'refresh',
    visual: {
      type: 'chain',
      tone: 'green',
      nodes: [
        { top: 'call', val: 'f(4)', highlight: true },
        { top: 'call', val: 'f(3)' },
        { top: 'call', val: 'f(2)' },
        { top: 'base', val: '1' },
      ],
    },
  },
  {
    id: 'rec-call-stack',
    topicLabel: '03 · MEMORY FRAMES',
    title: 'THE CALL STACK',
    content:
      'Each active function call pushes a frame onto the LIFO Call Stack; frames pop back as base results unwind.',
    takeaway: 'Peak stack height equals recursion depth (O(n) memory for depth n).',
    tint: 'cream',
    icon: 'layers',
    visual: {
      type: 'stackMini',
      frames: [
        { label: 'fib(1) → 1', note: 'TOP', hot: true },
        { label: 'fib(2)', note: 'waiting' },
        { label: 'fib(3)', note: 'waiting' },
      ],
    },
  },
  {
    id: 'rec-tree',
    topicLabel: '04 · VISUALIZING CALLS',
    title: 'RECURSION TREE',
    content:
      'Functions making two calls (like fib(n-1) + fib(n-2)) trace a branching tree whose leaves are base cases.',
    takeaway: 'Tree width shows total work; tree height shows stack memory.',
    tint: 'yellow',
    icon: 'gitBranch',
    visual: {
      type: 'treeMini',
      root: 'fib(3)',
      left: 'fib(2)',
      right: '1*',
      highlightLeaves: true,
      caption: 'Branching splits input until leaves return base values',
    },
  },
  {
    id: 'rec-backtracking',
    topicLabel: '05 · BACKTRACKING & SPLIT',
    title: 'BACKTRACKING & O(log n)',
    content:
      'Recursion powers Backtracking (choose, explore, undo on return) and Divide-and-Conquer like fast pow() in O(log n).',
    takeaway: 'Splitting exponent in half shrinks depth from n down to log₂(n).',
    tint: 'teal',
    icon: 'zap',
    visual: {
      type: 'metrics',
      items: [
        { label: 'LINEAR f(n-1)', val: 'O(n)', sub: '1 step smaller', tone: 'neutral' },
        { label: 'HALF pow(n/2)', val: 'O(log n)', sub: 'Halves each call', tone: 'good' },
      ],
    },
  },
];

