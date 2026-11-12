/**
 * Language-specific Starter Templates for Codo Champ Problems.
 * Supports: JavaScript, C++, C, Python, Java.
 */

export const PROBLEM_TEMPLATES = {
  // ── Arrays State 1 ──
  'p-arr-1-1': {
    javascript: `function solve(arr) {\n  // Return the first element, or null if empty\n  \n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint solve(vector<int>& arr) {\n    // Return the first element, or -1 if empty\n    \n}`,
    c: `#include <stdio.h>\n#include <stdlib.h>\n\nint solve(int arr[], int n) {\n    // Return the first element, or -1 if empty\n    \n}`,
    python: `def solve(arr):\n    # Return the first element, or None if empty\n    pass`,
    java: `public class Solution {\n    public Integer solve(int[] arr) {\n        // Return the first element, or null if empty\n        return null;\n    }\n}`,
  },
  'p-arr-1-2': {
    javascript: `function solve(arr) {\n  // Return the last element, or null if empty\n  \n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint solve(vector<int>& arr) {\n    // Return the last element, or -1 if empty\n    \n}`,
    c: `#include <stdio.h>\n#include <stdlib.h>\n\nint solve(int arr[], int n) {\n    // Return the last element, or -1 if empty\n    \n}`,
    python: `def solve(arr):\n    # Return the last element, or None if empty\n    pass`,
    java: `public class Solution {\n    public Integer solve(int[] arr) {\n        // Return the last element, or null if empty\n        return null;\n    }\n}`,
  },
  'p-arr-1-3': {
    javascript: `function solve(arr) {\n  // Return the maximum value\n  \n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint solve(vector<int>& arr) {\n    // Return the maximum value\n    \n}`,
    c: `#include <stdio.h>\n#include <stdlib.h>\n\nint solve(int arr[], int n) {\n    // Return the maximum value\n    \n}`,
    python: `def solve(arr):\n    # Return the maximum value\n    pass`,
    java: `public class Solution {\n    public int solve(int[] arr) {\n        return 0;\n    }\n}`,
  },
  'p-arr-1-4': {
    javascript: `function solve(arr) {\n  // Return a new reversed array\n  \n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nvector<int> solve(vector<int>& arr) {\n    // Return a new reversed array\n    \n}`,
    c: `#include <stdio.h>\n#include <stdlib.h>\n\nvoid solve(int arr[], int n) {\n    // Reverse the array in-place\n    \n}`,
    python: `def solve(arr):\n    # Return a new reversed array\n    pass`,
    java: `public class Solution {\n    public int[] solve(int[] arr) {\n        return new int[0];\n    }\n}`,
  },
  'p-arr-1-5': {
    javascript: `function solve(arr) {\n  // Return true if duplicates exist, false otherwise\n  \n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nbool solve(vector<int>& arr) {\n    // Return true if duplicates exist, false otherwise\n    \n}`,
    c: `#include <stdio.h>\n#include <stdbool.h>\n\nbool solve(int arr[], int n) {\n    // Return true if duplicates exist, false otherwise\n    \n}`,
    python: `def solve(arr):\n    # Return True if duplicates exist, False otherwise\n    pass`,
    java: `public class Solution {\n    public boolean solve(int[] arr) {\n        return false;\n    }\n}`,
  },

  // ── Arrays State 2 ──
  'p-arr-2-1': {
    javascript: `function solve(arr, target) {\n  // Return [i, j] where arr[i] + arr[j] === target\n  \n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nvector<int> solve(vector<int>& arr, int target) {\n    // Return [i, j] where arr[i] + arr[j] == target\n    \n}`,
    c: `#include <stdio.h>\n#include <stdlib.h>\n\nint* solve(int arr[], int n, int target) {\n    // Return allocated array of two indices\n    \n}`,
    python: `def solve(arr, target):\n    # Return [i, j] where arr[i] + arr[j] == target\n    pass`,
    java: `public class Solution {\n    public int[] solve(int[] arr, int target) {\n        return new int[2];\n    }\n}`,
  },
  'p-arr-2-2': {
    javascript: `function solve(arr1, arr2) {\n  // Merge two sorted arrays into one sorted array\n  \n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nvector<int> solve(vector<int>& arr1, vector<int>& arr2) {\n    // Merge two sorted arrays into one sorted array\n    \n}`,
    c: `#include <stdio.h>\n#include <stdlib.h>\n\nint* solve(int arr1[], int n1, int arr2[], int n2) {\n    // Merge two sorted arrays into one sorted array\n    \n}`,
    python: `def solve(arr1, arr2):\n    # Merge two sorted arrays into one sorted array\n    pass`,
    java: `public class Solution {\n    public int[] solve(int[] arr1, int[] arr2) {\n        return new int[0];\n    }\n}`,
  },
  'p-arr-2-3': {
    javascript: `function solve(arr) {\n  // Return the maximum subarray sum (Kadane's algorithm)\n  \n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint solve(vector<int>& arr) {\n    // Return the maximum subarray sum (Kadane's algorithm)\n    \n}`,
    c: `#include <stdio.h>\n\nint solve(int arr[], int n) {\n    // Return the maximum subarray sum (Kadane's algorithm)\n    \n}`,
    python: `def solve(arr):\n    # Return the maximum subarray sum\n    pass`,
    java: `public class Solution {\n    public int solve(int[] arr) {\n        return 0;\n    }\n}`,
  },
  'p-arr-2-4': {
    javascript: `function solve(arr, k) {\n  // Rotate array right by k steps\n  \n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nvector<int> solve(vector<int>& arr, int k) {\n    // Rotate array right by k steps\n    \n}`,
    c: `#include <stdio.h>\n\nvoid solve(int arr[], int n, int k) {\n    // Rotate array right by k steps\n    \n}`,
    python: `def solve(arr, k):\n    # Rotate array right by k steps\n    pass`,
    java: `public class Solution {\n    public int[] solve(int[] arr, int k) {\n        return new int[0];\n    }\n}`,
  },
  'p-arr-2-5': {
    javascript: `function solve(heights) {\n  // Return the maximum water volume between any two walls\n  \n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint solve(vector<int>& heights) {\n    // Return the maximum water volume between any two walls\n    \n}`,
    c: `#include <stdio.h>\n\nint solve(int heights[], int n) {\n    // Return the maximum water volume between any two walls\n    \n}`,
    python: `def solve(heights):\n    # Return the maximum water volume between any two walls\n    pass`,
    java: `public class Solution {\n    public int solve(int[] heights) {\n        return 0;\n    }\n}`,
  },

  // ── Arrays State 3 ──
  'p-arr-3-1': {
    javascript: `function solve(arr) {\n  // Return product of all elements except self at each index\n  \n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nvector<int> solve(vector<int>& arr) {\n    // Return product of all elements except self at each index\n    \n}`,
    c: `#include <stdio.h>\n#include <stdlib.h>\n\nint* solve(int arr[], int n) {\n    // Return product of all elements except self at each index\n    \n}`,
    python: `def solve(arr):\n    # Return product of all elements except self at each index\n    pass`,
    java: `public class Solution {\n    public int[] solve(int[] arr) {\n        return new int[0];\n    }\n}`,
  },
  'p-arr-3-2': {
    javascript: `function solve(matrix) {\n  // Set entire row and col to 0 if cell is 0 (in-place)\n  \n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nvoid solve(vector<vector<int>>& matrix) {\n    // Set entire row and col to 0 if cell is 0 (in-place)\n    \n}`,
    c: `#include <stdio.h>\n\nvoid solve(int** matrix, int rows, int cols) {\n    // Set entire row and col to 0 if cell is 0 (in-place)\n    \n}`,
    python: `def solve(matrix):\n    # Set entire row and col to 0 if cell is 0 (in-place)\n    pass`,
    java: `public class Solution {\n    public void solve(int[][] matrix) {\n        \n    }\n}`,
  },
  'p-arr-3-3': {
    javascript: `function solve(matrix) {\n  // Return elements in spiral order\n  \n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nvector<int> solve(vector<vector<int>>& matrix) {\n    // Return elements in spiral order\n    \n}`,
    c: `#include <stdio.h>\n#include <stdlib.h>\n\nint* solve(int** matrix, int rows, int cols, int* returnSize) {\n    // Return elements in spiral order\n    \n}`,
    python: `def solve(matrix):\n    # Return elements in spiral order\n    pass`,
    java: `public class Solution {\n    public List<Integer> solve(int[][] matrix) {\n        return new ArrayList<>();\n    }\n}`,
  },
  'p-arr-3-4': {
    javascript: `function solve(heights) {\n  // Return total trapped water units\n  \n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint solve(vector<int>& heights) {\n    // Return total trapped water units\n    \n}`,
    c: `#include <stdio.h>\n\nint solve(int heights[], int n) {\n    // Return total trapped water units\n    \n}`,
    python: `def solve(heights):\n    # Return total trapped water units\n    pass`,
    java: `public class Solution {\n    public int solve(int[] heights) {\n        return 0;\n    }\n}`,
  },
  'p-arr-3-5': {
    javascript: `function solve(arr) {\n  // Return the length of longest consecutive sequence\n  \n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint solve(vector<int>& arr) {\n    // Return the length of longest consecutive sequence\n    \n}`,
    c: `#include <stdio.h>\n\nint solve(int arr[], int n) {\n    // Return the length of longest consecutive sequence\n    \n}`,
    python: `def solve(arr):\n    # Return the length of longest consecutive sequence\n    pass`,
    java: `public class Solution {\n    public int solve(int[] arr) {\n        return 0;\n    }\n}`,
  },

  // ── Strings State 1 ──
  'p-str-1-1': {
    javascript: `function solve(s) {\n  // Return true if s is a palindrome\n  \n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nbool solve(string s) {\n    // Return true if s is a palindrome\n    \n}`,
    c: `#include <stdio.h>\n#include <stdbool.h>\n#include <string.h>\n\nbool solve(char* s) {\n    // Return true if s is a palindrome\n    \n}`,
    python: `def solve(s):\n    # Return true if s is a palindrome\n    pass`,
    java: `public class Solution {\n    public boolean solve(String s) {\n        return false;\n    }\n}`,
  },
  'p-str-1-2': {
    javascript: `function solve(s, t) {\n  // Return true if s and t are anagrams\n  \n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nbool solve(string s, string t) {\n    // Return true if s and t are anagrams\n    \n}`,
    c: `#include <stdio.h>\n#include <stdbool.h>\n#include <string.h>\n\nbool solve(char* s, char* t) {\n    // Return true if s and t are anagrams\n    \n}`,
    python: `def solve(s, t):\n    # Return true if s and t are anagrams\n    pass`,
    java: `public class Solution {\n    public boolean solve(String s, String t) {\n        return false;\n    }\n}`,
  },
  'p-str-1-3': {
    javascript: `function solve(s) {\n  // Return the length of the longest substring without repeating characters\n  \n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint solve(string s) {\n    // Return the length of the longest substring without repeating characters\n    \n}`,
    c: `#include <stdio.h>\n#include <string.h>\n\nint solve(char* s) {\n    // Return the length of the longest substring without repeating characters\n    \n}`,
    python: `def solve(s):\n    # Return the length of the longest substring without repeating characters\n    pass`,
    java: `public class Solution {\n    public int solve(String s) {\n        return 0;\n    }\n}`,
  },
  'p-str-1-4': {
    javascript: `function solve(s) {\n  // Convert Roman numeral string to integer\n  \n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint solve(string s) {\n    // Convert Roman numeral string to integer\n    \n}`,
    c: `#include <stdio.h>\n#include <string.h>\n\nint solve(char* s) {\n    // Convert Roman numeral string to integer\n    \n}`,
    python: `def solve(s):\n    # Convert Roman numeral string to integer\n    pass`,
    java: `public class Solution {\n    public int solve(String s) {\n        return 0;\n    }\n}`,
  },
  'p-str-1-5': {
    javascript: `function solve(words) {\n  // Group anagrams together\n  \n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nvector<vector<string>> solve(vector<string>& words) {\n    // Group anagrams together\n    \n}`,
    c: `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n// Group anagrams together\nchar*** solve(char** words, int wordsSize, int* returnSize, int** returnColumnSizes) {\n    \n}`,
    python: `def solve(words):\n    # Group anagrams together\n    pass`,
    java: `public class Solution {\n    public List<List<String>> solve(String[] words) {\n        return new ArrayList<>();\n    }\n}`,
  },

  // ── Linked Lists State 1 ──
  'p-ll-1-1': {
    javascript: `// Node structure:\n// class Node { constructor(val) { this.val = val; this.next = null; } }\n\nfunction solve(head) {\n  // Return the number of nodes\n  \n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nstruct ListNode {\n    int val;\n    ListNode* next;\n    ListNode(int x) : val(x), next(nullptr) {}\n};\n\nint solve(ListNode* head) {\n    // Return the number of nodes\n    \n}`,
    c: `#include <stdio.h>\n#include <stdlib.h>\n\nstruct ListNode {\n    int val;\n    struct ListNode* next;\n};\n\nint solve(struct ListNode* head) {\n    // Return the number of nodes\n    \n}`,
    python: `class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef solve(head):\n    # Return the number of nodes\n    pass`,
    java: `public class Solution {\n    public int solve(ListNode head) {\n        return 0;\n    }\n}`,
  },
  'p-ll-1-2': {
    javascript: `function solve(head) {\n  // Reverse the linked list in-place, return new head\n  \n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nstruct ListNode {\n    int val;\n    ListNode* next;\n    ListNode(int x) : val(x), next(nullptr) {}\n};\n\nListNode* solve(ListNode* head) {\n    // Reverse the linked list in-place, return new head\n    \n}`,
    c: `#include <stdio.h>\n#include <stdlib.h>\n\nstruct ListNode {\n    int val;\n    struct ListNode* next;\n};\n\nstruct ListNode* solve(struct ListNode* head) {\n    // Reverse the linked list in-place, return new head\n    \n}`,
    python: `def solve(head):\n    # Reverse the linked list in-place, return new head\n    pass`,
    java: `public class Solution {\n    public ListNode solve(ListNode head) {\n        return null;\n    }\n}`,
  },
  'p-ll-1-3': {
    javascript: `function solve(head) {\n  // Return true if the linked list has a cycle\n  \n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nstruct ListNode {\n    int val;\n    ListNode* next;\n    ListNode(int x) : val(x), next(nullptr) {}\n};\n\nbool solve(ListNode* head) {\n    // Return true if the linked list has a cycle\n    \n}`,
    c: `#include <stdio.h>\n#include <stdbool.h>\n\nstruct ListNode {\n    int val;\n    struct ListNode* next;\n};\n\nbool solve(struct ListNode* head) {\n    // Return true if the linked list has a cycle\n    \n}`,
    python: `def solve(head):\n    # Return True if the linked list has a cycle\n    pass`,
    java: `public class Solution {\n    public boolean solve(ListNode head) {\n        return false;\n    }\n}`,
  },
  'p-ll-1-4': {
    javascript: `function solve(head, n) {\n  // Remove nth node from end and return head\n  \n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nstruct ListNode {\n    int val;\n    ListNode* next;\n    ListNode(int x) : val(x), next(nullptr) {}\n};\n\nListNode* solve(ListNode* head, int n) {\n    // Remove nth node from end and return head\n    \n}`,
    c: `#include <stdio.h>\n#include <stdlib.h>\n\nstruct ListNode {\n    int val;\n    struct ListNode* next;\n};\n\nstruct ListNode* solve(struct ListNode* head, int n) {\n    // Remove nth node from end and return head\n    \n}`,
    python: `def solve(head, n):\n    # Remove nth node from end and return head\n    pass`,
    java: `public class Solution {\n    public ListNode solve(ListNode head, int n) {\n        return null;\n    }\n}`,
  },
  'p-ll-1-5': {
    javascript: `function solve(l1, l2) {\n  // Merge two sorted linked lists, return new head\n  \n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nstruct ListNode {\n    int val;\n    ListNode* next;\n    ListNode(int x) : val(x), next(nullptr) {}\n};\n\nListNode* solve(ListNode* l1, ListNode* l2) {\n    // Merge two sorted linked lists, return new head\n    \n}`,
    c: `#include <stdio.h>\n#include <stdlib.h>\n\nstruct ListNode {\n    int val;\n    struct ListNode* next;\n};\n\nstruct ListNode* solve(struct ListNode* l1, struct ListNode* l2) {\n    // Merge two sorted linked lists, return new head\n    \n}`,
    python: `def solve(l1, l2):\n    # Merge two sorted linked lists, return new head\n    pass`,
    java: `public class Solution {\n    public ListNode solve(ListNode l1, ListNode l2) {\n        return null;\n    }\n}`,
  },
};

/**
 * Dynamically synthesizes an appropriate starter code template for any problem
 * and language if no explicit template was pre-defined.
 */
export function generateStarterCode(problem, language) {
  if (!problem) return '';
  const lang = (language || 'javascript').toLowerCase();

  // If JavaScript and legacy starterCode exists, return that directly
  if (lang === 'javascript' && problem.starterCode) {
    return problem.starterCode;
  }

  const jsCode = problem.starterCode || problem.functionSignatures?.javascript || '';
  const fnMatch = jsCode.match(/function\s+(\w+)\s*\(([^)]*)\)/);
  const fnName = fnMatch ? fnMatch[1] : 'solve';
  const paramNames = fnMatch ? fnMatch[2].split(',').map((p) => p.trim()).filter(Boolean) : ['arr'];

  // Infer return type from problem testCases expected output
  const sampleExpected = problem.testCases?.[0]?.expected;
  let returnTypeCpp = 'int';
  let returnTypeC = 'int';
  let comment = '// Your solution here';

  const commentMatch = jsCode.match(/\/\/\s*([^\n]+)/);
  if (commentMatch) {
    comment = `// ${commentMatch[1].trim()}`;
  }

  if (sampleExpected === true || sampleExpected === false || sampleExpected === 'true' || sampleExpected === 'false') {
    returnTypeCpp = 'bool';
    returnTypeC = 'bool';
  } else if (Array.isArray(sampleExpected)) {
    if (sampleExpected.length > 0 && Array.isArray(sampleExpected[0])) {
      returnTypeCpp = 'vector<vector<int>>';
      returnTypeC = 'int**';
    } else {
      returnTypeCpp = 'vector<int>';
      returnTypeC = 'int*';
    }
  } else if (typeof sampleExpected === 'string' && isNaN(Number(sampleExpected))) {
    returnTypeCpp = 'string';
    returnTypeC = 'char*';
  }

  // Construct parameter types
  const cppParams = paramNames.map((p) => {
    if (p.includes('matrix')) return 'vector<vector<int>>& matrix';
    if (p.includes('heights') || p.includes('nums') || p.includes('arr')) return `vector<int>& ${p}`;
    if (p.includes('words')) return 'vector<string>& words';
    if (p === 's' || p === 't' || p.includes('str')) return `string ${p}`;
    if (p === 'head' || p.startsWith('l')) return `ListNode* ${p}`;
    if (p === 'target' || p === 'k' || p === 'n') return `int ${p}`;
    return `auto ${p}`;
  }).join(', ');

  const cParams = paramNames.map((p) => {
    if (p.includes('matrix')) return 'int** matrix, int rows, int cols';
    if (p.includes('heights') || p.includes('nums') || p.includes('arr')) return `int ${p}[], int n`;
    if (p === 's' || p === 't' || p.includes('str')) return `char* ${p}`;
    if (p === 'head' || p.startsWith('l')) return `struct ListNode* ${p}`;
    if (p === 'target' || p === 'k' || p === 'n') return `int ${p}`;
    return `int ${p}`;
  }).join(', ');

  const isLinkedList = paramNames.some((p) => p === 'head' || p.startsWith('l'));

  switch (lang) {
    case 'cpp': {
      const listNodeDef = isLinkedList
        ? `struct ListNode {\n    int val;\n    ListNode* next;\n    ListNode(int x) : val(x), next(nullptr) {}\n};\n\n`
        : '';
      return `#include <bits/stdc++.h>\nusing namespace std;\n\n${listNodeDef}${returnTypeCpp} ${fnName}(${cppParams}) {\n    ${comment}\n    \n}`;
    }
    case 'c': {
      const boolInclude = (returnTypeC === 'bool' || cParams.includes('bool')) ? `#include <stdbool.h>\n` : '';
      const listNodeDef = isLinkedList
        ? `struct ListNode {\n    int val;\n    struct ListNode* next;\n};\n\n`
        : '';
      return `#include <stdio.h>\n#include <stdlib.h>\n${boolInclude}\n${listNodeDef}${returnTypeC} ${fnName}(${cParams}) {\n    ${comment}\n    \n}`;
    }
    case 'python': {
      const pyParams = paramNames.join(', ');
      return `def ${fnName}(${pyParams}):\n    ${comment.replace('//', '#')}\n    pass`;
    }
    case 'java': {
      return `public class Solution {\n    public ${returnTypeCpp === 'vector<int>' ? 'int[]' : returnTypeCpp === 'bool' ? 'boolean' : 'int'} ${fnName}(${cppParams.replace(/vector<int>&/g, 'int[]').replace(/string/g, 'String')}) {\n        ${comment}\n        \n    }\n}`;
    }
    default: {
      const jsParams = paramNames.join(', ');
      return `function ${fnName}(${jsParams}) {\n  ${comment}\n  \n}`;
    }
  }
}

/**
 * Resolves the starter code for any problem and target language.
 */
export function getStarterCode(problem, language = 'javascript') {
  if (!problem) return '';
  const lang = (language || 'javascript').toLowerCase();

  // 1. Direct functionSignatures on problem object
  if (problem.functionSignatures?.[lang]) {
    return problem.functionSignatures[lang];
  }

  // 2. Exact match in PROBLEM_TEMPLATES registry
  if (problem.id && PROBLEM_TEMPLATES[problem.id]?.[lang]) {
    return PROBLEM_TEMPLATES[problem.id][lang];
  }

  // 3. Direct starterCode for JavaScript
  if (lang === 'javascript' && problem.starterCode) {
    return problem.starterCode;
  }

  // 4. Dynamic generator based on problem metadata
  return generateStarterCode(problem, lang);
}

