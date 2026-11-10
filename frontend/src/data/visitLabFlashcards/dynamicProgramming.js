export const dpFlashcards = [
  {
    id: 'dp-overlapping',
    topicLabel: '01 · CORE IDEA',
    title: 'OVERLAPPING SUBPROBLEMS',
    content:
      'When naive recursion solves the same subproblem repeatedly (like fib(2) inside fib(4) and fib(5)), store the result once.',
    takeaway: 'Solve once, look up in O(1) whenever repeated.',
    tint: 'cyan',
    icon: 'sparkles',
    visual: {
      type: 'treeMini',
      root: 'fib(4)',
      left: 'fib(3)',
      right: 'fib(2)*',
      highlightLeaves: true,
      caption: 'fib(2) gets requested again — cache avoids re-work',
    },
  },
  {
    id: 'dp-optimal-substructure',
    topicLabel: '02 · RECURRENCE',
    title: 'OPTIMAL SUBSTRUCTURE',
    content:
      'A problem has optimal substructure when its solution builds cleanly from solutions to smaller subproblems.',
    takeaway: 'Write state relation first: dp[i] = dp[i - 1] + dp[i - 2].',
    tint: 'cream',
    icon: 'layers',
    visual: {
      type: 'cells',
      items: [
        { top: 'dp[0]', val: '0' },
        { top: 'dp[1]', val: '1' },
        { top: 'dp[2]', val: '1', highlight: true },
        { top: 'dp[3]', val: '2', highlight: true },
      ],
    },
  },
  {
    id: 'dp-memoization',
    topicLabel: '03 · TOP-DOWN DP',
    title: 'MEMOIZATION',
    content:
      'Keep your recursive function, but check a memo object before recursing so each state computes at most once.',
    takeaway: 'Top-down asks for n and caches answers during recursion.',
    tint: 'purple',
    icon: 'database',
    visual: {
      type: 'metrics',
      items: [
        { label: 'HIT memo[n]', val: 'Return O(1)', sub: 'Skip branch', tone: 'good' },
        { label: 'MISS', val: 'Compute & Save', sub: 'Once per state', tone: 'neutral' },
      ],
    },
  },
  {
    id: 'dp-tabulation',
    topicLabel: '04 · BOTTOM-UP DP',
    title: 'TABULATION (dp TABLE)',
    content:
      'Fill dp[0], dp[1], ... iteratively from base cases upward — avoiding recursion stack overhead altogether.',
    takeaway: 'Keep only the last two variables when only i-1 and i-2 matter.',
    tint: 'yellow',
    icon: 'cpu',
    visual: {
      type: 'cells',
      badges: ['dp[i] = dp[i-1] + dp[i-2]'],
      items: [
        { top: 'dp[2]', val: '1' },
        { top: 'dp[3]', val: '2' },
        { top: 'dp[4]', val: '3' },
        { top: 'dp[5]', val: '5', highlight: true },
      ],
    },
  },
  {
    id: 'dp-complexity',
    topicLabel: '05 · SPEED GAIN',
    title: 'EXPONENTIAL TO LINEAR',
    content:
      'Fibonacci drops from O(2^n) naive recursion to O(n) time with memoization, and O(1) space with rolling tabulation.',
    takeaway: 'Each unique subproblem runs once instead of branching exponentially.',
    tint: 'mint',
    icon: 'zap',
    visual: {
      type: 'metrics',
      items: [
        { label: 'NAIVE TREE', val: 'O(2^n)', sub: 'Re-solves states', tone: 'warn' },
        { label: 'DP ROLLING', val: 'O(n) / O(1)', sub: 'Linear & lean', tone: 'good' },
      ],
    },
  },
];

