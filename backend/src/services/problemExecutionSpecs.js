/**
 * Problem Execution Specs & Harness Generators for Codo Champ.
 * Defines test-case harnesses for all 25 problems in JavaScript, C++, and C.
 */

const { parseArgsFromInput } = require('./executionUtils');

const PROBLEM_TYPES = {
  // ── Arrays State 1 ──
  'p-arr-1-1': { type: 'ARRAY_INT_TO_INT', sentinelEmpty: true },
  'p-arr-1-2': { type: 'ARRAY_INT_TO_INT', sentinelEmpty: true },
  'p-arr-1-3': { type: 'ARRAY_INT_TO_INT' },
  'p-arr-1-4': { type: 'ARRAY_INT_TO_ARRAY' },
  'p-arr-1-5': { type: 'ARRAY_INT_TO_BOOL' },

  // ── Arrays State 2 ──
  'p-arr-2-1': { type: 'ARRAY_INT_AND_INT_TO_ARRAY' },
  'p-arr-2-2': { type: 'TWO_ARRAY_INT_TO_ARRAY' },
  'p-arr-2-3': { type: 'ARRAY_INT_TO_INT' },
  'p-arr-2-4': { type: 'ARRAY_INT_AND_INT_ROTATE' },
  'p-arr-2-5': { type: 'ARRAY_INT_TO_INT' },

  // ── Arrays State 3 ──
  'p-arr-3-1': { type: 'ARRAY_INT_TO_ARRAY_PRODUCT' },
  'p-arr-3-2': { type: 'MATRIX_INT_VOID' },
  'p-arr-3-3': { type: 'MATRIX_INT_TO_ARRAY' },
  'p-arr-3-4': { type: 'ARRAY_INT_TO_INT' },
  'p-arr-3-5': { type: 'ARRAY_INT_TO_INT' },

  // ── Strings State 1 ──
  'p-str-1-1': { type: 'STRING_TO_BOOL' },
  'p-str-1-2': { type: 'TWO_STRINGS_TO_BOOL' },
  'p-str-1-3': { type: 'STRING_TO_INT' },
  'p-str-1-4': { type: 'STRING_TO_INT' },
  'p-str-1-5': { type: 'ARRAY_STRING_TO_MATRIX_STRING' },

  // ── Linked Lists State 1 ──
  'p-ll-1-1': { type: 'LINKED_LIST_TO_INT' },
  'p-ll-1-2': { type: 'LINKED_LIST_TO_LINKED_LIST' },
  'p-ll-1-3': { type: 'LINKED_LIST_CYCLE_TO_BOOL' },
  'p-ll-1-4': { type: 'LINKED_LIST_AND_INT_TO_LINKED_LIST' },
  'p-ll-1-5': { type: 'TWO_LINKED_LISTS_TO_LINKED_LIST' },
};

function hasMainFunction(code) {
  return /\bint\s+main\s*\(/.test(code) || /\bvoid\s+main\s*\(/.test(code);
}

/**
 * Builds C++ complete source with harness.
 */
function buildCppSource(userCode, testCases, problemId) {
  const spec = PROBLEM_TYPES[problemId] || { type: 'ARRAY_INT_TO_INT' };

  let header = `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <climits>
#include <cmath>
#include <map>
#include <set>
#include <queue>
#include <stack>
#include <sstream>
#include <numeric>
#include <utility>
#include <deque>
#include <unordered_map>
#include <unordered_set>
#include <iterator>
#include <functional>
#include <cassert>
using namespace std;
`;

  // Safely normalize user code: if user code includes <bits/stdc++.h>, substitute with comment
  // because all standard STL headers are explicitly included above, guaranteeing cross-platform compilation
  const normalizedUserCode = userCode.replace(/#\s*include\s*<bits\/stdc\+\+\.h>/g, '// [Codo Champ Engine] Standard STL headers included');

  // If user code contains a main function, treat as a complete standalone program (diagnostic or custom)
  if (hasMainFunction(userCode)) {
    return `${header}\n${normalizedUserCode}\n`;
  }

  // Provide ListNode definition if problem needs it and user code doesn't define it
  const isLLProblem = spec.type.startsWith('LINKED_LIST') || spec.type.startsWith('TWO_LINKED_LISTS');
  if (isLLProblem && !userCode.includes('struct ListNode') && !userCode.includes('class ListNode')) {
    header += `
struct ListNode {
    int val;
    ListNode* next;
    ListNode(int x) : val(x), next(nullptr) {}
};
`;
  }

  let harnessHelpers = `
// Harness printers and helpers
template<typename T>
void printVal(const T& val) {
    cout << val;
}
void printVal(bool val) {
    cout << (val ? "true" : "false");
}
void printVal(const string& s) {
    cout << "\\"" << s << "\\"";
}
template<typename T>
void printVec(const vector<T>& vec) {
    cout << "[";
    for (size_t i = 0; i < vec.size(); ++i) {
        if (i > 0) cout << ",";
        printVal(vec[i]);
    }
    cout << "]";
}
template<typename T>
void printMatrix(const vector<vector<T>>& mat) {
    cout << "[";
    for (size_t i = 0; i < mat.size(); ++i) {
        if (i > 0) cout << ",";
        printVec(mat[i]);
    }
    cout << "]";
}
`;

  if (isLLProblem) {
    harnessHelpers += `
ListNode* buildList(const vector<int>& vals) {
    if (vals.empty()) return nullptr;
    ListNode* head = new ListNode(vals[0]);
    ListNode* curr = head;
    for (size_t i = 1; i < vals.size(); ++i) {
        curr->next = new ListNode(vals[i]);
        curr = curr->next;
    }
    return head;
}
ListNode* buildListWithCycle(const vector<int>& vals, int pos) {
    if (vals.empty()) return nullptr;
    vector<ListNode*> nodes;
    for (int v : vals) nodes.push_back(new ListNode(v));
    for (size_t i = 0; i + 1 < nodes.size(); ++i) nodes[i]->next = nodes[i + 1];
    if (pos >= 0 && pos < (int)nodes.size()) {
        nodes.back()->next = nodes[pos];
    }
    return nodes[0];
}
void printList(ListNode* head) {
    cout << "[";
    ListNode* curr = head;
    bool first = true;
    int count = 0;
    while (curr && count < 1000) {
        if (!first) cout << ",";
        cout << curr->val;
        first = false;
        curr = curr->next;
        count++;
    }
    cout << "]";
}
`;
  }

  // Generate main() calling each testcase
  let mainBody = 'int main() {\n';

  testCases.forEach((tc, idx) => {
    const args = parseArgsFromInput(tc.input);
    mainBody += `    // Test Case ${idx}\n    {\n`;

    if (spec.type === 'ARRAY_INT_TO_INT') {
      const arr = Array.isArray(args[0]) ? args[0] : [];
      mainBody += `        vector<int> arr = {${arr.join(', ')}};\n`;
      mainBody += `        int res = solve(arr);\n`;
      if (spec.sentinelEmpty) {
        mainBody += `        cout << "__RESULT_START__${idx}__";\n`;
        mainBody += `        if (arr.empty() && res == -1) cout << "null"; else cout << res;\n`;
        mainBody += `        cout << "__RESULT_END__" << endl;\n`;
      } else {
        mainBody += `        cout << "__RESULT_START__${idx}__" << res << "__RESULT_END__" << endl;\n`;
      }
    } else if (spec.type === 'ARRAY_INT_TO_ARRAY') {
      const arr = Array.isArray(args[0]) ? args[0] : [];
      mainBody += `        vector<int> arr = {${arr.join(', ')}};\n`;
      mainBody += `        vector<int> res = solve(arr);\n`;
      mainBody += `        cout << "__RESULT_START__${idx}__";\n`;
      mainBody += `        printVec(res);\n`;
      mainBody += `        cout << "__RESULT_END__" << endl;\n`;
    } else if (spec.type === 'ARRAY_INT_TO_BOOL') {
      const arr = Array.isArray(args[0]) ? args[0] : [];
      mainBody += `        vector<int> arr = {${arr.join(', ')}};\n`;
      mainBody += `        bool res = solve(arr);\n`;
      mainBody += `        cout << "__RESULT_START__${idx}__" << (res ? "true" : "false") << "__RESULT_END__" << endl;\n`;
    } else if (spec.type === 'ARRAY_INT_AND_INT_TO_ARRAY') {
      const arr = Array.isArray(args[0]) ? args[0] : [];
      const target = args[1] !== undefined ? args[1] : 0;
      mainBody += `        vector<int> arr = {${arr.join(', ')}};\n`;
      mainBody += `        int target = ${target};\n`;
      mainBody += `        vector<int> res = solve(arr, target);\n`;
      mainBody += `        cout << "__RESULT_START__${idx}__";\n`;
      mainBody += `        printVec(res);\n`;
      mainBody += `        cout << "__RESULT_END__" << endl;\n`;
    } else if (spec.type === 'TWO_ARRAY_INT_TO_ARRAY') {
      const a1 = Array.isArray(args[0]) ? args[0] : [];
      const a2 = Array.isArray(args[1]) ? args[1] : [];
      mainBody += `        vector<int> a1 = {${a1.join(', ')}};\n`;
      mainBody += `        vector<int> a2 = {${a2.join(', ')}};\n`;
      mainBody += `        vector<int> res = solve(a1, a2);\n`;
      mainBody += `        cout << "__RESULT_START__${idx}__";\n`;
      mainBody += `        printVec(res);\n`;
      mainBody += `        cout << "__RESULT_END__" << endl;\n`;
    } else if (spec.type === 'ARRAY_INT_AND_INT_ROTATE') {
      const arr = Array.isArray(args[0]) ? args[0] : [];
      const k = args[1] !== undefined ? args[1] : 0;
      mainBody += `        vector<int> arr = {${arr.join(', ')}};\n`;
      mainBody += `        vector<int> res = solve(arr, ${k});\n`;
      mainBody += `        cout << "__RESULT_START__${idx}__";\n`;
      mainBody += `        printVec(res);\n`;
      mainBody += `        cout << "__RESULT_END__" << endl;\n`;
    } else if (spec.type === 'ARRAY_INT_TO_ARRAY_PRODUCT') {
      const arr = Array.isArray(args[0]) ? args[0] : [];
      mainBody += `        vector<int> arr = {${arr.join(', ')}};\n`;
      mainBody += `        vector<int> res = solve(arr);\n`;
      mainBody += `        cout << "__RESULT_START__${idx}__";\n`;
      mainBody += `        printVec(res);\n`;
      mainBody += `        cout << "__RESULT_END__" << endl;\n`;
    } else if (spec.type === 'MATRIX_INT_VOID') {
      const mat = Array.isArray(args[0]) ? args[0] : [];
      const matStr = mat.map(row => `{${row.join(', ')}}`).join(', ');
      mainBody += `        vector<vector<int>> mat = {${matStr}};\n`;
      mainBody += `        solve(mat);\n`;
      mainBody += `        cout << "__RESULT_START__${idx}__";\n`;
      mainBody += `        printMatrix(mat);\n`;
      mainBody += `        cout << "__RESULT_END__" << endl;\n`;
    } else if (spec.type === 'MATRIX_INT_TO_ARRAY') {
      const mat = Array.isArray(args[0]) ? args[0] : [];
      const matStr = mat.map(row => `{${row.join(', ')}}`).join(', ');
      mainBody += `        vector<vector<int>> mat = {${matStr}};\n`;
      mainBody += `        vector<int> res = solve(mat);\n`;
      mainBody += `        cout << "__RESULT_START__${idx}__";\n`;
      mainBody += `        printVec(res);\n`;
      mainBody += `        cout << "__RESULT_END__" << endl;\n`;
    } else if (spec.type === 'STRING_TO_BOOL') {
      const str = String(args[0] || '');
      mainBody += `        string s = ${JSON.stringify(str)};\n`;
      mainBody += `        bool res = solve(s);\n`;
      mainBody += `        cout << "__RESULT_START__${idx}__" << (res ? "true" : "false") << "__RESULT_END__" << endl;\n`;
    } else if (spec.type === 'TWO_STRINGS_TO_BOOL') {
      const s1 = String(args[0] || '');
      const s2 = String(args[1] || '');
      mainBody += `        string s1 = ${JSON.stringify(s1)};\n`;
      mainBody += `        string s2 = ${JSON.stringify(s2)};\n`;
      mainBody += `        bool res = solve(s1, s2);\n`;
      mainBody += `        cout << "__RESULT_START__${idx}__" << (res ? "true" : "false") << "__RESULT_END__" << endl;\n`;
    } else if (spec.type === 'STRING_TO_INT') {
      const str = String(args[0] || '');
      mainBody += `        string s = ${JSON.stringify(str)};\n`;
      mainBody += `        int res = solve(s);\n`;
      mainBody += `        cout << "__RESULT_START__${idx}__" << res << "__RESULT_END__" << endl;\n`;
    } else if (spec.type === 'ARRAY_STRING_TO_MATRIX_STRING') {
      const words = Array.isArray(args[0]) ? args[0] : [];
      const wordsStr = words.map(w => JSON.stringify(w)).join(', ');
      mainBody += `        vector<string> words = {${wordsStr}};\n`;
      mainBody += `        vector<vector<string>> res = solve(words);\n`;
      mainBody += `        cout << "__RESULT_START__${idx}__";\n`;
      mainBody += `        printMatrix(res);\n`;
      mainBody += `        cout << "__RESULT_END__" << endl;\n`;
    } else if (spec.type === 'LINKED_LIST_TO_INT') {
      const vals = Array.isArray(args[0]) ? args[0] : [];
      mainBody += `        ListNode* head = buildList({${vals.join(', ')}});\n`;
      mainBody += `        int res = solve(head);\n`;
      mainBody += `        cout << "__RESULT_START__${idx}__" << res << "__RESULT_END__" << endl;\n`;
    } else if (spec.type === 'LINKED_LIST_TO_LINKED_LIST') {
      const vals = Array.isArray(args[0]) ? args[0] : [];
      mainBody += `        ListNode* head = buildList({${vals.join(', ')}});\n`;
      mainBody += `        ListNode* res = solve(head);\n`;
      mainBody += `        cout << "__RESULT_START__${idx}__";\n`;
      mainBody += `        printList(res);\n`;
      mainBody += `        cout << "__RESULT_END__" << endl;\n`;
    } else if (spec.type === 'LINKED_LIST_CYCLE_TO_BOOL') {
      const vals = Array.isArray(args[0]) ? args[0] : [];
      const pos = args[1] !== undefined ? args[1] : -1;
      mainBody += `        ListNode* head = buildListWithCycle({${vals.join(', ')}}, ${pos});\n`;
      mainBody += `        bool res = solve(head);\n`;
      mainBody += `        cout << "__RESULT_START__${idx}__" << (res ? "true" : "false") << "__RESULT_END__" << endl;\n`;
    } else if (spec.type === 'LINKED_LIST_AND_INT_TO_LINKED_LIST') {
      const vals = Array.isArray(args[0]) ? args[0] : [];
      const n = args[1] !== undefined ? args[1] : 1;
      mainBody += `        ListNode* head = buildList({${vals.join(', ')}});\n`;
      mainBody += `        ListNode* res = solve(head, ${n});\n`;
      mainBody += `        cout << "__RESULT_START__${idx}__";\n`;
      mainBody += `        printList(res);\n`;
      mainBody += `        cout << "__RESULT_END__" << endl;\n`;
    } else if (spec.type === 'TWO_LINKED_LISTS_TO_LINKED_LIST') {
      const v1 = Array.isArray(args[0]) ? args[0] : [];
      const v2 = Array.isArray(args[1]) ? args[1] : [];
      mainBody += `        ListNode* l1 = buildList({${v1.join(', ')}});\n`;
      mainBody += `        ListNode* l2 = buildList({${v2.join(', ')}});\n`;
      mainBody += `        ListNode* res = solve(l1, l2);\n`;
      mainBody += `        cout << "__RESULT_START__${idx}__";\n`;
      mainBody += `        printList(res);\n`;
      mainBody += `        cout << "__RESULT_END__" << endl;\n`;
    }

    mainBody += `    }\n`;
  });

  mainBody += '    return 0;\n}\n';

  return `${header}\n${normalizedUserCode}\n${harnessHelpers}\n${mainBody}`;
}

/**
 * Builds C complete source with harness.
 */
function buildCSource(userCode, testCases, problemId) {
  const spec = PROBLEM_TYPES[problemId] || { type: 'ARRAY_INT_TO_INT' };

  let header = `#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>
#include <limits.h>
#include <math.h>
`;

  // If user code contains a main function, treat as a complete standalone program
  if (hasMainFunction(userCode)) {
    return `${header}\n${userCode}\n`;
  }

  const isLLProblem = spec.type.startsWith('LINKED_LIST') || spec.type.startsWith('TWO_LINKED_LISTS');
  if (isLLProblem && !userCode.includes('struct ListNode')) {
    header += `
struct ListNode {
    int val;
    struct ListNode* next;
};
`;
  }

  let harnessHelpers = `
void printIntArr(int arr[], int n) {
    printf("[");
    for (int i = 0; i < n; ++i) {
        if (i > 0) printf(",");
        printf("%d", arr[i]);
    }
    printf("]");
}
void printMatrix(int** mat, int rows, int cols) {
    printf("[");
    for (int r = 0; r < rows; ++r) {
        if (r > 0) printf(",");
        printIntArr(mat[r], cols);
    }
    printf("]");
}
`;

  if (isLLProblem) {
    harnessHelpers += `
struct ListNode* buildList(int arr[], int n) {
    if (n <= 0) return NULL;
    struct ListNode* head = (struct ListNode*)malloc(sizeof(struct ListNode));
    head->val = arr[0];
    head->next = NULL;
    struct ListNode* curr = head;
    for (int i = 1; i < n; ++i) {
        curr->next = (struct ListNode*)malloc(sizeof(struct ListNode));
        curr->next->val = arr[i];
        curr->next->next = NULL;
        curr = curr->next;
    }
    return head;
}
struct ListNode* buildListWithCycle(int arr[], int n, int pos) {
    if (n <= 0) return NULL;
    struct ListNode** nodes = (struct ListNode**)malloc(n * sizeof(struct ListNode*));
    for (int i = 0; i < n; ++i) {
        nodes[i] = (struct ListNode*)malloc(sizeof(struct ListNode));
        nodes[i]->val = arr[i];
        nodes[i]->next = NULL;
    }
    for (int i = 0; i + 1 < n; ++i) nodes[i]->next = nodes[i + 1];
    if (pos >= 0 && pos < n) nodes[n - 1]->next = nodes[pos];
    struct ListNode* head = nodes[0];
    free(nodes);
    return head;
}
void printList(struct ListNode* head) {
    printf("[");
    struct ListNode* curr = head;
    int first = 1;
    int count = 0;
    while (curr && count < 1000) {
        if (!first) printf(",");
        printf("%d", curr->val);
        first = 0;
        curr = curr->next;
        count++;
    }
    printf("]");
}
`;
  }

  let mainBody = 'int main() {\n';

  testCases.forEach((tc, idx) => {
    const args = parseArgsFromInput(tc.input);
    mainBody += `    // Test Case ${idx}\n    {\n`;

    if (spec.type === 'ARRAY_INT_TO_INT') {
      const arr = Array.isArray(args[0]) ? args[0] : [];
      if (arr.length === 0) {
        mainBody += `        int* arr = NULL;\n`;
      } else {
        mainBody += `        int arr[] = {${arr.join(', ')}};\n`;
      }
      mainBody += `        int res = solve(arr, ${arr.length});\n`;
      if (spec.sentinelEmpty) {
        mainBody += `        printf("__RESULT_START__${idx}__");\n`;
        mainBody += `        if (${arr.length} == 0 && res == -1) printf("null"); else printf("%d", res);\n`;
        mainBody += `        printf("__RESULT_END__\\n");\n`;
      } else {
        mainBody += `        printf("__RESULT_START__${idx}__%d__RESULT_END__\\n", res);\n`;
      }
    } else if (spec.type === 'ARRAY_INT_TO_ARRAY') {
      const arr = Array.isArray(args[0]) ? args[0] : [];
      mainBody += `        int arr[] = {${arr.join(', ')}};\n`;
      mainBody += `        solve(arr, ${arr.length});\n`;
      mainBody += `        printf("__RESULT_START__${idx}__");\n`;
      mainBody += `        printIntArr(arr, ${arr.length});\n`;
      mainBody += `        printf("__RESULT_END__\\n");\n`;
    } else if (spec.type === 'ARRAY_INT_TO_BOOL') {
      const arr = Array.isArray(args[0]) ? args[0] : [];
      mainBody += `        int arr[] = {${arr.join(', ')}};\n`;
      mainBody += `        bool res = solve(arr, ${arr.length});\n`;
      mainBody += `        printf("__RESULT_START__${idx}__%s__RESULT_END__\\n", res ? "true" : "false");\n`;
    } else if (spec.type === 'ARRAY_INT_AND_INT_TO_ARRAY') {
      const arr = Array.isArray(args[0]) ? args[0] : [];
      const target = args[1] !== undefined ? args[1] : 0;
      mainBody += `        int arr[] = {${arr.join(', ')}};\n`;
      mainBody += `        int* res = solve(arr, ${arr.length}, ${target});\n`;
      mainBody += `        printf("__RESULT_START__${idx}__");\n`;
      mainBody += `        if (res) { printIntArr(res, 2); free(res); } else printf("[]");\n`;
      mainBody += `        printf("__RESULT_END__\\n");\n`;
    } else if (spec.type === 'TWO_ARRAY_INT_TO_ARRAY') {
      const a1 = Array.isArray(args[0]) ? args[0] : [];
      const a2 = Array.isArray(args[1]) ? args[1] : [];
      mainBody += `        int a1[] = {${a1.length ? a1.join(', ') : '0'}};\n`;
      mainBody += `        int a2[] = {${a2.length ? a2.join(', ') : '0'}};\n`;
      mainBody += `        int* res = solve(${a1.length ? 'a1' : 'NULL'}, ${a1.length}, ${a2.length ? 'a2' : 'NULL'}, ${a2.length});\n`;
      mainBody += `        printf("__RESULT_START__${idx}__");\n`;
      mainBody += `        if (res) { printIntArr(res, ${a1.length + a2.length}); free(res); } else printf("[]");\n`;
      mainBody += `        printf("__RESULT_END__\\n");\n`;
    } else if (spec.type === 'ARRAY_INT_AND_INT_ROTATE') {
      const arr = Array.isArray(args[0]) ? args[0] : [];
      const k = args[1] !== undefined ? args[1] : 0;
      mainBody += `        int arr[] = {${arr.join(', ')}};\n`;
      mainBody += `        solve(arr, ${arr.length}, ${k});\n`;
      mainBody += `        printf("__RESULT_START__${idx}__");\n`;
      mainBody += `        printIntArr(arr, ${arr.length});\n`;
      mainBody += `        printf("__RESULT_END__\\n");\n`;
    } else if (spec.type === 'ARRAY_INT_TO_ARRAY_PRODUCT') {
      const arr = Array.isArray(args[0]) ? args[0] : [];
      mainBody += `        int arr[] = {${arr.join(', ')}};\n`;
      mainBody += `        int* res = solve(arr, ${arr.length});\n`;
      mainBody += `        printf("__RESULT_START__${idx}__");\n`;
      mainBody += `        if (res) { printIntArr(res, ${arr.length}); free(res); } else printf("[]");\n`;
      mainBody += `        printf("__RESULT_END__\\n");\n`;
    } else if (spec.type === 'MATRIX_INT_VOID') {
      const mat = Array.isArray(args[0]) ? args[0] : [];
      const rows = mat.length;
      const cols = rows > 0 ? mat[0].length : 0;
      mainBody += `        int** mat = (int**)malloc(${rows} * sizeof(int*));\n`;
      mat.forEach((r, rIdx) => {
        mainBody += `        mat[${rIdx}] = (int[]) {${r.join(', ')}};\n`;
      });
      mainBody += `        solve(mat, ${rows}, ${cols});\n`;
      mainBody += `        printf("__RESULT_START__${idx}__");\n`;
      mainBody += `        printMatrix(mat, ${rows}, ${cols});\n`;
      mainBody += `        printf("__RESULT_END__\\n");\n`;
      mainBody += `        free(mat);\n`;
    } else if (spec.type === 'MATRIX_INT_TO_ARRAY') {
      const mat = Array.isArray(args[0]) ? args[0] : [];
      const rows = mat.length;
      const cols = rows > 0 ? mat[0].length : 0;
      mainBody += `        int** mat = (int**)malloc(${rows} * sizeof(int*));\n`;
      mat.forEach((r, rIdx) => {
        mainBody += `        mat[${rIdx}] = (int[]) {${r.join(', ')}};\n`;
      });
      mainBody += `        int retSize = 0;\n`;
      mainBody += `        int* res = solve(mat, ${rows}, ${cols}, &retSize);\n`;
      mainBody += `        printf("__RESULT_START__${idx}__");\n`;
      mainBody += `        if (res) { printIntArr(res, retSize); free(res); } else printf("[]");\n`;
      mainBody += `        printf("__RESULT_END__\\n");\n`;
      mainBody += `        free(mat);\n`;
    } else if (spec.type === 'STRING_TO_BOOL') {
      const str = String(args[0] || '');
      mainBody += `        char s[] = ${JSON.stringify(str)};\n`;
      mainBody += `        bool res = solve(s);\n`;
      mainBody += `        printf("__RESULT_START__${idx}__%s__RESULT_END__\\n", res ? "true" : "false");\n`;
    } else if (spec.type === 'TWO_STRINGS_TO_BOOL') {
      const s1 = String(args[0] || '');
      const s2 = String(args[1] || '');
      mainBody += `        char s1[] = ${JSON.stringify(s1)};\n`;
      mainBody += `        char s2[] = ${JSON.stringify(s2)};\n`;
      mainBody += `        bool res = solve(s1, s2);\n`;
      mainBody += `        printf("__RESULT_START__${idx}__%s__RESULT_END__\\n", res ? "true" : "false");\n`;
    } else if (spec.type === 'STRING_TO_INT') {
      const str = String(args[0] || '');
      mainBody += `        char s[] = ${JSON.stringify(str)};\n`;
      mainBody += `        int res = solve(s);\n`;
      mainBody += `        printf("__RESULT_START__${idx}__%d__RESULT_END__\\n", res);\n`;
    } else if (spec.type === 'LINKED_LIST_TO_INT') {
      const vals = Array.isArray(args[0]) ? args[0] : [];
      if (vals.length === 0) {
        mainBody += `        struct ListNode* head = NULL;\n`;
      } else {
        mainBody += `        int arr[] = {${vals.join(', ')}};\n`;
        mainBody += `        struct ListNode* head = buildList(arr, ${vals.length});\n`;
      }
      mainBody += `        int res = solve(head);\n`;
      mainBody += `        printf("__RESULT_START__${idx}__%d__RESULT_END__\\n", res);\n`;
    } else if (spec.type === 'LINKED_LIST_TO_LINKED_LIST') {
      const vals = Array.isArray(args[0]) ? args[0] : [];
      if (vals.length === 0) {
        mainBody += `        struct ListNode* head = NULL;\n`;
      } else {
        mainBody += `        int arr[] = {${vals.join(', ')}};\n`;
        mainBody += `        struct ListNode* head = buildList(arr, ${vals.length});\n`;
      }
      mainBody += `        struct ListNode* res = solve(head);\n`;
      mainBody += `        printf("__RESULT_START__${idx}__");\n`;
      mainBody += `        printList(res);\n`;
      mainBody += `        printf("__RESULT_END__\\n");\n`;
    } else if (spec.type === 'LINKED_LIST_CYCLE_TO_BOOL') {
      const vals = Array.isArray(args[0]) ? args[0] : [];
      const pos = args[1] !== undefined ? args[1] : -1;
      mainBody += `        int arr[] = {${vals.join(', ')}};\n`;
      mainBody += `        struct ListNode* head = buildListWithCycle(arr, ${vals.length}, ${pos});\n`;
      mainBody += `        bool res = solve(head);\n`;
      mainBody += `        printf("__RESULT_START__${idx}__%s__RESULT_END__\\n", res ? "true" : "false");\n`;
    } else if (spec.type === 'LINKED_LIST_AND_INT_TO_LINKED_LIST') {
      const vals = Array.isArray(args[0]) ? args[0] : [];
      const n = args[1] !== undefined ? args[1] : 1;
      mainBody += `        int arr[] = {${vals.join(', ')}};\n`;
      mainBody += `        struct ListNode* head = buildList(arr, ${vals.length});\n`;
      mainBody += `        struct ListNode* res = solve(head, ${n});\n`;
      mainBody += `        printf("__RESULT_START__${idx}__");\n`;
      mainBody += `        printList(res);\n`;
      mainBody += `        printf("__RESULT_END__\\n");\n`;
    } else if (spec.type === 'TWO_LINKED_LISTS_TO_LINKED_LIST') {
      const v1 = Array.isArray(args[0]) ? args[0] : [];
      const v2 = Array.isArray(args[1]) ? args[1] : [];
      mainBody += `        int a1[] = {${v1.length ? v1.join(', ') : '0'}};\n`;
      mainBody += `        int a2[] = {${v2.length ? v2.join(', ') : '0'}};\n`;
      mainBody += `        struct ListNode* l1 = ${v1.length ? `buildList(a1, ${v1.length})` : 'NULL'};\n`;
      mainBody += `        struct ListNode* l2 = ${v2.length ? `buildList(a2, ${v2.length})` : 'NULL'};\n`;
      mainBody += `        struct ListNode* res = solve(l1, l2);\n`;
      mainBody += `        printf("__RESULT_START__${idx}__");\n`;
      mainBody += `        printList(res);\n`;
      mainBody += `        printf("__RESULT_END__\\n");\n`;
    }

    mainBody += `    }\n`;
  });

  mainBody += '    return 0;\n}\n';

  return `${header}\n${userCode}\n${harnessHelpers}\n${mainBody}`;
}

/**
 * Builds isolated JavaScript runner script.
 */
function buildJsRunner(userCode, testCases) {
  return `
"use strict";

class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}

function buildList(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const head = new ListNode(arr[0]);
  let curr = head;
  for (let i = 1; i < arr.length; i++) {
    curr.next = new ListNode(arr[i]);
    curr = curr.next;
  }
  return head;
}

function buildListWithCycle(arr, pos) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const nodes = arr.map(v => new ListNode(v));
  for (let i = 0; i + 1 < nodes.length; i++) nodes[i].next = nodes[i + 1];
  if (pos >= 0 && pos < nodes.length) {
    nodes[nodes.length - 1].next = nodes[pos];
  }
  return nodes[0];
}

function serializeList(head) {
  const res = [];
  let curr = head;
  let count = 0;
  while (curr && count < 1000) {
    res.push(curr.val);
    curr = curr.next;
    count++;
  }
  return JSON.stringify(res);
}

${userCode}

const testCases = ${JSON.stringify(testCases)};

for (let i = 0; i < testCases.length; i++) {
  const tc = testCases[i];
  let rawInput = tc.input;
  let args = [];
  
  if (typeof rawInput === 'string') {
    const trimmed = rawInput.trim();
    if (trimmed.includes('with cycle at pos')) {
      const m = trimmed.match(/(\\[.*?\\])\\s*with cycle at pos\\s*(-?\\d+)/);
      if (m) args = [buildListWithCycle(JSON.parse(m[1]), parseInt(m[2], 10))];
    } else if (trimmed.includes('no cycle')) {
      const m = trimmed.match(/(\\[.*?\\])/);
      if (m) args = [buildListWithCycle(JSON.parse(m[1]), -1)];
    } else if (trimmed.includes(', n=')) {
      const parts = trimmed.split(', n=');
      args = [buildList(JSON.parse(parts[0])), parseInt(parts[1], 10)];
    } else {
      try {
        const parsed = JSON.parse(\`[\${trimmed}]\`);
        args = parsed.map(arg => Array.isArray(arg) && tc.input.includes('->') ? buildList(arg) : arg);
      } catch {
        args = [trimmed];
      }
    }
  } else if (Array.isArray(rawInput)) {
    args = [rawInput];
  } else {
    args = [rawInput];
  }

  const start = process.hrtime.bigint();
  let actual;
  try {
    actual = solve(...args);
    if (actual && typeof actual === 'object' && actual instanceof ListNode) {
      actual = serializeList(actual);
    } else if (actual !== undefined && typeof actual === 'object') {
      actual = JSON.stringify(actual);
    }
  } catch (err) {
    actual = 'Runtime Error: ' + err.message;
  }
  const end = process.hrtime.bigint();
  const durationMs = Number(end - start) / 1e6;

  console.log('__RESULT_START__' + i + '__' + actual + '__RESULT_END__');
}
`;
}

module.exports = {
  PROBLEM_TYPES,
  buildCppSource,
  buildCSource,
  buildJsRunner,
};

