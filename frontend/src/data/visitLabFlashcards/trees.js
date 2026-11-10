export const treesFlashcards = [
  {
    id: 'tree-root-child',
    topicLabel: '01 · HIERARCHY',
    title: 'ROOT & CHILD NODES',
    content:
      'A tree starts at a single Root node at the top. In a binary tree, each node has at most two children: left and right.',
    takeaway: 'Every child connects downward via left / right references.',
    tint: 'blue',
    icon: 'gitBranch',
    visual: {
      type: 'treeMini',
      root: '50',
      left: '30',
      right: '70',
      caption: 'Root 50 branches left (30) and right (70)',
    },
  },
  {
    id: 'tree-parent-leaf',
    topicLabel: '02 · NODE ROLES',
    title: 'PARENT & LEAF NODES',
    content:
      'Every non-root node has exactly one parent. A Leaf node sits at the edge with both left = null and right = null.',
    takeaway: 'Leaves terminate branches and act as recursion base hits.',
    tint: 'pink',
    icon: 'network',
    visual: {
      type: 'treeMini',
      root: '30',
      left: '20*',
      right: '40*',
      highlightLeaves: true,
      caption: 'Nodes 20 and 40 are Leaves (0 children)',
    },
  },
  {
    id: 'tree-height-depth',
    topicLabel: '03 · DIMENSIONS',
    title: 'HEIGHT & DEPTH',
    content:
      'Depth counts steps down from Root. Height is the longest root-to-leaf path: 1 + max(leftHeight, rightHeight).',
    takeaway: 'Balanced binary trees keep height around O(log n).',
    tint: 'cream',
    icon: 'ruler',
    visual: {
      type: 'metrics',
      items: [
        { label: 'BALANCED HEIGHT', val: 'O(log n)', sub: 'Fast branching', tone: 'good' },
        { label: 'SKEWED HEIGHT', val: 'O(n)', sub: 'Acts like a list', tone: 'warn' },
      ],
    },
  },
  {
    id: 'tree-traversals',
    topicLabel: '04 · DFS ORDERS',
    title: 'TREE TRAVERSALS',
    content:
      'Inorder walks Left → Root → Right; Preorder visits Root first; Postorder visits children before Root.',
    takeaway: 'Inorder traversal yields sorted values on a Binary Search Tree.',
    tint: 'yellow',
    icon: 'route',
    visual: {
      type: 'cells',
      badges: ['Inorder: Left → Root → Right'],
      items: [
        { top: '1st', val: '30' },
        { top: '2nd', val: '50', highlight: true },
        { top: '3rd', val: '70' },
      ],
    },
  },
  {
    id: 'tree-bst-property',
    topicLabel: '05 · BINARY SEARCH TREE',
    title: 'BST ORDERING RULE',
    content:
      'A BST keeps every node in its left subtree < root.val, and every node in its right subtree > root.val.',
    takeaway: 'This invariant halves search space each step on balanced trees.',
    tint: 'blue',
    icon: 'search',
    visual: {
      type: 'metrics',
      items: [
        { label: 'LEFT SUBTREE', val: '< 50', sub: 'Smaller keys', tone: 'neutral' },
        { label: 'RIGHT SUBTREE', val: '> 50', sub: 'Larger keys', tone: 'good' },
      ],
    },
  },
];

