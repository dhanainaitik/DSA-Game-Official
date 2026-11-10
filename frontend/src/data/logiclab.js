// Logic Lab topics — each with a 5-step learning flow
export const LOGIC_LAB_TOPICS = [
  {
    id: 'arrays',
    name: 'Arrays',
    tagline: 'Indexed, sequential memory',
    color: '#7c3aed',
    steps: ['See', 'Touch', 'Experiment', 'Understand', 'Code'],
    description: 'Arrays store elements in contiguous memory, accessible by index.',
    concept: 'An Array is a fixed-size, ordered collection of elements. Access any element in O(1) by its index.',
    codeExample: `// JavaScript Array
const arr = [10, 20, 30, 40, 50];
console.log(arr[0]);     // 10   — O(1) access
console.log(arr.length); // 5

arr.push(60);  // Add to end — O(1)
arr.pop();     // Remove from end — O(1)
arr.shift();   // Remove from front — O(n)`,
    challenge: {
      title: 'Find the Missing Number',
      description: 'Given an array of n distinct numbers from 0 to n, find the missing number.',
      fnName: 'findMissing',
      testCases: [
        { input: [[3, 0, 1]], expected: 2 },
        { input: [[0, 1]], expected: 2 },
        { input: [[9, 6, 4, 2, 3, 5, 7, 0, 1]], expected: 8 },
      ],
      starterCode: `function findMissing(arr) {
  // Your implementation here
}`,
      solution: `function findMissing(arr) {
  const n = arr.length;
  const expected = (n * (n + 1)) / 2;
  return expected - arr.reduce((a, b) => a + b, 0);
}`,
    },
  },
  {
    id: 'strings',
    name: 'Strings',
    tagline: 'Characters in sequence',
    color: '#0891b2',
    steps: ['See', 'Touch', 'Experiment', 'Understand', 'Code'],
    description: 'Strings are immutable sequences of characters.',
    concept: 'A String is an ordered sequence of characters. In JavaScript, strings are immutable — operations return new strings.',
    codeExample: `// JavaScript String
const s = "hello world";
console.log(s[0]);         // 'h' — O(1)
console.log(s.length);     // 11
console.log(s.toUpperCase()); // 'HELLO WORLD'
console.log(s.slice(0, 5));   // 'hello'
console.log(s.split(' '));    // ['hello', 'world']`,
    challenge: {
      title: 'Count Vowels',
      description: 'Return the count of vowels in the string.',
      fnName: 'countVowels',
      testCases: [
        { input: ['hello'], expected: 2 },
        { input: ['Code2Living'], expected: 4 },
        { input: ['rhythm'], expected: 0 },
      ],
      starterCode: `function countVowels(s) {
  // Your implementation here
}`,
      solution: `function countVowels(s) {
  return (s.match(/[aeiou]/gi) || []).length;
}`,
    },
  },
  {
    id: 'linked-lists',
    name: 'Linked Lists',
    tagline: 'Nodes connected by pointers',
    color: '#059669',
    steps: ['See', 'Touch', 'Experiment', 'Understand', 'Code'],
    description: 'Each node holds a DATA value and a NEXT reference to the following node.',
    concept: 'A Linked List is a chain of heap nodes connected by NEXT pointers. Prepend/Delete-Head run in O(1), while sequential access, Delete-Tail (in singly linked lists), and Search run in O(n).',
    codeExample: `class Node {
  constructor(val) {
    this.val = val;
    this.next = null;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
  }

  prepend(val) {                  // O(1)
    const node = new Node(val);
    node.next = this.head;
    this.head = node;
    if (!this.tail) this.tail = node;
  }

  append(val) {                   // O(1) with tail
    const node = new Node(val);
    if (!this.head) {
      this.head = this.tail = node;
      return;
    }
    this.tail.next = node;
    this.tail = node;
  }

  deleteTail() {                  // O(n) in Singly Linked List
    if (!this.head) return null;
    if (this.head === this.tail) {
      this.head = this.tail = null;
      return;
    }
    let curr = this.head;
    while (curr.next !== this.tail) curr = curr.next;
    curr.next = null;
    this.tail = curr;
  }

  reverse() {                     // O(n) time, O(1) space
    let prev = null, curr = this.head;
    this.tail = this.head;
    while (curr) {
      const nextNode = curr.next;
      curr.next = prev;
      prev = curr;
      curr = nextNode;
    }
    this.head = prev;
  }
}`,
    challenge: {
      title: 'Middle of the List',
      description: 'Given the head of a singly linked list, return the middle node (or its value). If there are two middle nodes, return the second middle node.',
      examples: [
        { input: 'head = [1, 2, 3]', output: 'Node(2) (val: 2)' },
        { input: 'head = [1, 2, 3, 4]', output: 'Node(3) (second middle, val: 3)' },
      ],
      constraints: [
        'The number of nodes is in the range [1, 100]',
        'Expected complexity: O(n) time, O(1) extra space',
      ],
      fnName: 'findMiddle',
      testCases: [
        { input: [{ val: 1, next: { val: 2, next: { val: 3, next: null } } }], expected: 2, displayInput: '[1, 2, 3]' },
        { input: [{ val: 1, next: { val: 2, next: { val: 3, next: { val: 4, next: null } } } }], expected: 3, displayInput: '[1, 2, 3, 4]' },
        { input: [{ val: 10, next: { val: 20, next: { val: 30, next: { val: 40, next: { val: 50, next: null } } } } }], expected: 30, displayInput: '[10, 20, 30, 40, 50]' },
      ],
      starterCode: `function findMiddle(head) {
  // Move slow (+1 step) and fast (+2 steps)
  // Return slow (middle node) or slow.val
}`,
      solution: `function findMiddle(head) {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}`,
    },
  },
  {
    id: 'stack-queue',
    name: 'Stack / Queue',
    tagline: 'Controlled order of access',
    color: '#d97706',
    steps: ['See', 'Touch', 'Experiment', 'Understand', 'Code'],
    description: 'Stack is LIFO. Queue is FIFO. Both restrict access to specific ends.',
    concept: 'Stack: Last In, First Out (like a stack of plates). Queue: First In, First Out (like a line). Both are O(1) for push/pop.',
    codeExample: `// Stack
const stack = [];
stack.push(1);   // [1]
stack.push(2);   // [1, 2]
stack.push(3);   // [1, 2, 3]
stack.pop();     // 3 — removes last

// Queue
const queue = [];
queue.push(1);    // [1]
queue.push(2);    // [1, 2]
queue.shift();    // 1 — removes first (O(n) in JS!)

// Better Queue with two stacks — O(1) amortized`,
    challenge: {
      title: 'Valid Parentheses',
      description: 'Return true if brackets are properly nested and closed.',
      fnName: 'isValid',
      testCases: [
        { input: ['()'], expected: true },
        { input: ['()[]{}'], expected: true },
        { input: ['(]'], expected: false },
      ],
      starterCode: `function isValid(s) {
  // Use a stack!
}`,
      solution: `function isValid(s) {
  const stack = [];
  const pairs = { ')': '(', ']': '[', '}': '{' };
  for (const ch of s) {
    if ('([{'.includes(ch)) stack.push(ch);
    else if (stack.pop() !== pairs[ch]) return false;
  }
  return stack.length === 0;
}`,
    },
  },
  {
    id: 'trees',
    name: 'Trees',
    tagline: 'Hierarchical node structures',
    color: '#be185d',
    steps: ['See', 'Touch', 'Experiment', 'Understand', 'Code'],
    description: 'Trees are hierarchical with a root, internal nodes, and leaves.',
    concept: 'A Binary Tree has at most 2 children per node. A BST enforces: left < node < right. Traversal: inorder, preorder, postorder.',
    codeExample: `class TreeNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

// Inorder traversal (Left → Root → Right)
function inorder(root, result = []) {
  if (!root) return result;
  inorder(root.left, result);
  result.push(root.val);
  inorder(root.right, result);
  return result;
}`,
    challenge: {
      title: 'Maximum Depth',
      description: 'Return the maximum depth (height) of a binary tree.',
      fnName: 'maxDepth',
      testCases: [
        { input: [{ val: 3, left: { val: 9, left: null, right: null }, right: { val: 20, left: null, right: null } }], expected: 2 },
        { input: [null], expected: 0 },
      ],
      starterCode: `function maxDepth(root) {
  // Use recursion
}`,
      solution: `function maxDepth(root) {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}`,
    },
  },
  {
    id: 'graphs',
    name: 'Graphs',
    tagline: 'Nodes connected by edges',
    color: '#7c3aed',
    steps: ['See', 'Touch', 'Experiment', 'Understand', 'Code'],
    description: 'Graphs model relationships between entities using vertices and edges.',
    concept: 'A Graph is a set of vertices (nodes) connected by edges. Can be directed or undirected, weighted or unweighted. BFS, DFS are the core traversal algorithms.',
    codeExample: `// Adjacency List representation
const graph = {
  0: [1, 2],
  1: [0, 3],
  2: [0],
  3: [1]
};

// BFS — visits level by level
function bfs(graph, start) {
  const visited = new Set([start]);
  const queue = [start];
  const order = [];
  while (queue.length) {
    const node = queue.shift();
    order.push(node);
    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return order;
}`,
    challenge: {
      title: 'Number of Islands',
      description: 'Count connected land regions ("1"s) in a 2D grid of 0s and 1s.',
      fnName: 'numIslands',
      testCases: [
        { input: [[["1","1","0"],["1","1","0"],["0","0","1"]]], expected: 2 },
        { input: [[["1","1","1"],["0","1","0"],["1","1","1"]]], expected: 1 },
      ],
      starterCode: `function numIslands(grid) {
  // DFS or BFS flood fill
}`,
      solution: `function numIslands(grid) {
  let count = 0;
  function dfs(r, c) {
    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] !== '1') return;
    grid[r][c] = '0';
    dfs(r+1,c); dfs(r-1,c); dfs(r,c+1); dfs(r,c-1);
  }
  for (let r = 0; r < grid.length; r++)
    for (let c = 0; c < grid[0].length; c++)
      if (grid[r][c] === '1') { dfs(r,c); count++; }
  return count;
}`,
    },
  },
  {
    id: 'dynamic-programming',
    name: 'Dynamic Programming',
    tagline: 'Solve once, remember forever',
    color: '#0891b2',
    steps: ['See', 'Touch', 'Experiment', 'Understand', 'Code'],
    description: 'DP breaks problems into overlapping subproblems and caches results.',
    concept: 'Dynamic Programming applies when a problem has optimal substructure and overlapping subproblems. Memoization (top-down) or tabulation (bottom-up).',
    codeExample: `// Fibonacci — naive O(2^n)
function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}

// With memoization O(n)
function fibMemo(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n <= 1) return n;
  memo[n] = fibMemo(n-1, memo) + fibMemo(n-2, memo);
  return memo[n];
}

// Tabulation O(n) O(1) space
function fibTab(n) {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  return b;
}`,
    challenge: {
      title: 'Climbing Stairs',
      description: 'Count distinct ways to climb n stairs, taking 1 or 2 steps at a time.',
      fnName: 'climbStairs',
      testCases: [
        { input: [2], expected: 2 },
        { input: [3], expected: 3 },
        { input: [5], expected: 8 },
      ],
      starterCode: `function climbStairs(n) {
  // DP — notice the fibonacci pattern
}`,
      solution: `function climbStairs(n) {
  if (n <= 2) return n;
  let a = 1, b = 2;
  for (let i = 3; i <= n; i++) [a, b] = [b, a + b];
  return b;
}`,
    },
  },
  {
    id: 'recursion',
    name: 'Recursion',
    tagline: 'A function that calls itself',
    color: '#059669',
    steps: ['See', 'Touch', 'Experiment', 'Understand', 'Code'],
    description: 'Recursion solves problems by breaking them into smaller versions of themselves.',
    concept: 'A recursive function calls itself with a smaller input. Every recursive solution needs a base case (stop condition) and a recursive case.',
    codeExample: `// Factorial — classic recursion
function factorial(n) {
  if (n === 0) return 1;       // Base case
  return n * factorial(n - 1); // Recursive case
}

// factorial(4)
// = 4 * factorial(3)
// = 4 * 3 * factorial(2)
// = 4 * 3 * 2 * factorial(1)
// = 4 * 3 * 2 * 1 * factorial(0)
// = 4 * 3 * 2 * 1 * 1 = 24`,
    challenge: {
      title: 'Power Function',
      description: 'Implement pow(base, exp) recursively. Handle negative exponents.',
      fnName: 'pow',
      testCases: [
        { input: [2, 10], expected: 1024 },
        { input: [2, 0], expected: 1 },
        { input: [3, 3], expected: 27 },
      ],
      starterCode: `function pow(base, exp) {
  // Recursive — aim for O(log n)
}`,
      solution: `function pow(base, exp) {
  if (exp === 0) return 1;
  if (exp < 0) return 1 / pow(base, -exp);
  if (exp % 2 === 0) {
    const half = pow(base, Math.floor(exp / 2));
    return half * half;
  }
  return base * pow(base, exp - 1);
}`,
    },
  },
];

export const getLabTopic = (id) => LOGIC_LAB_TOPICS.find(t => t.id === id);
