export const graphsFlashcards = [
  {
    id: 'graph-vertices-edges',
    topicLabel: '01 · STRUCTURE',
    title: 'VERTICES & EDGES',
    content:
      'A Graph pairs Vertices (nodes like A, B, C) with Edges connecting related pairs.',
    takeaway: 'Networks, maps, and dependencies all model cleanly as G = (V, E).',
    tint: 'cyan',
    icon: 'share2',
    visual: {
      type: 'graphMini',
      mode: 'undirected',
      caption: '4 vertices (A–D) linked by undirected edges',
    },
  },
  {
    id: 'graph-directed-undirected',
    topicLabel: '02 · EDGE TYPES',
    title: 'DIRECTED VS UNDIRECTED',
    content:
      'Undirected edges allow two-way travel (A—B). Directed edges go one way (A → B); weighted edges also carry costs.',
    takeaway: 'Always check arrow direction and cycles before traversing.',
    tint: 'cream',
    icon: 'arrowRight',
    visual: {
      type: 'metrics',
      items: [
        { label: 'UNDIRECTED', val: 'A ↔ B', sub: 'Mutual edge', tone: 'neutral' },
        { label: 'DIRECTED', val: 'A → B', sub: 'One-way arc', tone: 'good' },
      ],
    },
  },
  {
    id: 'graph-adj-list',
    topicLabel: '03 · REPRESENTATION',
    title: 'ADJACENCY LIST',
    content:
      'Storing each node’s list of neighbors uses O(V + E) memory — much leaner than an O(V²) matrix for sparse graphs.',
    takeaway: 'Iterate neighbors directly via graph[node].',
    tint: 'mint',
    icon: 'listTree',
    visual: {
      type: 'indexGrid',
      rowALabel: 'Node:',
      rowBLabel: 'Adj:',
      cols: [
        { a: 'A', b: 'B,C', hot: true },
        { a: 'B', b: 'A,D' },
        { a: 'C', b: 'A,D' },
        { a: 'D', b: 'B,C' },
      ],
    },
  },
  {
    id: 'graph-bfs',
    topicLabel: '04 · BREADTH-FIRST SEARCH',
    title: 'BFS (QUEUE · LEVEL ORDER)',
    content:
      'BFS uses a Queue (FIFO) plus a visited set to expand ring by ring, finding shortest paths in unweighted graphs.',
    takeaway: 'Mark neighbors visited BEFORE pushing onto the queue — O(V + E).',
    tint: 'cyan',
    icon: 'waves',
    visual: {
      type: 'metrics',
      items: [
        { label: 'STRUCTURE', val: 'Queue', sub: 'FIFO wave order', tone: 'good' },
        { label: 'COMPLEXITY', val: 'O(V + E)', sub: 'Each edge once', tone: 'neutral' },
      ],
    },
  },
  {
    id: 'graph-dfs',
    topicLabel: '05 · DEPTH-FIRST SEARCH',
    title: 'DFS (RECURSION / STACK)',
    content:
      'DFS plunges down one path as far as possible before backtracking, using recursion or an explicit Stack (LIFO).',
    takeaway: 'Track visited nodes to avoid infinite loops around cycles.',
    tint: 'purple',
    icon: 'route',
    visual: {
      type: 'metrics',
      items: [
        { label: 'STRUCTURE', val: 'Stack', sub: 'Recursion / LIFO', tone: 'good' },
        { label: 'BEST FOR', val: 'Paths / Islands', sub: 'Flood fill & cycles', tone: 'neutral' },
      ],
    },
  },
];

