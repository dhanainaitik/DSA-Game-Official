import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PROBLEMS, getProblem } from '../data/problems.js';
import { getStarterCode, generateStarterCode, PROBLEM_TEMPLATES } from './starterCodeTemplates.js';

describe('C++ & Multi-Language Default Starter Code System', () => {
  describe('1. Coverage across all PROBLEMS', () => {
    it('provides valid, non-empty starter code for all 25 problems in all 5 languages', () => {
      const problemList = Object.values(PROBLEMS);
      assert.equal(problemList.length, 25, 'Expected 25 problems in PROBLEMS catalog');

      const supportedLanguages = ['javascript', 'cpp', 'c', 'python', 'java'];

      for (const p of problemList) {
        for (const lang of supportedLanguages) {
          const starter = getStarterCode(p, lang);
          assert.ok(starter, `Problem ${p.id} must return non-empty starter code for ${lang}`);
          assert.ok(starter.trim().length > 15, `Problem ${p.id} ${lang} starter code too short: "${starter}"`);

          if (lang === 'cpp') {
            assert.ok(starter.includes('#include <bits/stdc++.h>'), `Problem ${p.id} C++ must include <bits/stdc++.h>`);
            assert.ok(starter.includes('using namespace std;'), `Problem ${p.id} C++ must have using namespace std;`);
            assert.ok(starter.includes('solve('), `Problem ${p.id} C++ must declare solve()`);
          } else if (lang === 'c') {
            assert.ok(starter.includes('#include <stdio.h>'), `Problem ${p.id} C must include <stdio.h>`);
            assert.ok(starter.includes('solve('), `Problem ${p.id} C must declare solve()`);
          } else if (lang === 'javascript') {
            assert.ok(starter.includes('function solve('), `Problem ${p.id} JS must declare function solve()`);
          }
        }
      }
    });

    it('enriches every problem in PROBLEMS with functionSignatures for cpp and c', () => {
      for (const p of Object.values(PROBLEMS)) {
        assert.ok(p.functionSignatures, `Problem ${p.id} must have functionSignatures`);
        assert.ok(p.functionSignatures.cpp, `Problem ${p.id} functionSignatures must have cpp`);
        assert.ok(p.functionSignatures.c, `Problem ${p.id} functionSignatures must have c`);
        assert.ok(p.functionSignatures.javascript, `Problem ${p.id} functionSignatures must have javascript`);
      }
    });
  });

  describe('2. Maximum Signal specific template', () => {
    it('returns the exact expected C++ starter template for Maximum Signal (p-arr-1-3)', () => {
      const problem = getProblem('p-arr-1-3');
      const cppCode = getStarterCode(problem, 'cpp');

      assert.ok(cppCode.includes('#include <bits/stdc++.h>'));
      assert.ok(cppCode.includes('using namespace std;'));
      assert.ok(cppCode.includes('int solve(vector<int>& arr)'));
      assert.ok(cppCode.includes('// Return the maximum value'));
    });
  });

  describe('3. Distinct signatures across different problem types (No Hardcoding)', () => {
    it('array problems have distinct parameters and return types', () => {
      const maxSignal = getStarterCode(getProblem('p-arr-1-3'), 'cpp');
      const mirrorProtocol = getStarterCode(getProblem('p-arr-1-4'), 'cpp');
      const twoSum = getStarterCode(getProblem('p-arr-2-1'), 'cpp');
      const duplicateScan = getStarterCode(getProblem('p-arr-1-5'), 'cpp');

      // Maximum Signal returns int
      assert.ok(maxSignal.includes('int solve(vector<int>& arr)'));

      // Mirror Protocol returns vector<int>
      assert.ok(mirrorProtocol.includes('vector<int> solve(vector<int>& arr)'));

      // Two-Sum Gate takes (vector<int>& arr, int target) and returns vector<int>
      assert.ok(twoSum.includes('vector<int> solve(vector<int>& arr, int target)'));

      // Duplicate Scan returns bool
      assert.ok(duplicateScan.includes('bool solve(vector<int>& arr)'));

      // Assert they are not identical
      assert.notEqual(maxSignal, mirrorProtocol);
      assert.notEqual(maxSignal, twoSum);
      assert.notEqual(maxSignal, duplicateScan);
    });

    it('string problems use string parameters and return types', () => {
      const palindrome = getStarterCode(getProblem('p-str-1-1'), 'cpp');
      const anagram = getStarterCode(getProblem('p-str-1-2'), 'cpp');
      const uniqueCorridor = getStarterCode(getProblem('p-str-1-3'), 'cpp');
      const groupScramble = getStarterCode(getProblem('p-str-1-5'), 'cpp');

      // Palindrome Gate returns bool
      assert.ok(palindrome.includes('bool solve(string s)'));

      // Anagram Check takes two strings and returns bool
      assert.ok(anagram.includes('bool solve(string s, string t)'));

      // Unique Corridor returns int length
      assert.ok(uniqueCorridor.includes('int solve(string s)'));

      // Group Scramble returns vector<vector<string>>
      assert.ok(groupScramble.includes('vector<vector<string>> solve(vector<string>& words)'));
    });

    it('linked list problems define ListNode struct and use pointer parameters', () => {
      const chainLength = getStarterCode(getProblem('p-ll-1-1'), 'cpp');
      const reverseChain = getStarterCode(getProblem('p-ll-1-2'), 'cpp');
      const mergeChains = getStarterCode(getProblem('p-ll-1-5'), 'cpp');

      // All linked list problems should include struct ListNode
      assert.ok(chainLength.includes('struct ListNode {'));
      assert.ok(chainLength.includes('ListNode* head'));
      assert.ok(chainLength.includes('int solve(ListNode* head)'));

      // Reverse Chain returns ListNode*
      assert.ok(reverseChain.includes('ListNode* solve(ListNode* head)'));

      // Merge Two Chains takes two ListNode pointers
      assert.ok(mergeChains.includes('ListNode* solve(ListNode* l1, ListNode* l2)'));
    });
  });

  describe('4. Language Switching & Code Preservation Simulation', () => {
    it('simulates switching languages without overwriting modified user code', () => {
      const problem = getProblem('p-arr-1-3');
      const codesByLanguage = {};

      // 1. Initial load on JavaScript
      let selectedLang = 'javascript';
      if (!codesByLanguage[selectedLang]) {
        codesByLanguage[selectedLang] = getStarterCode(problem, selectedLang);
      }
      assert.ok(codesByLanguage['javascript'].includes('function solve(arr)'));

      // 2. User edits JavaScript code
      const userJsCode = 'function solve(arr) {\n  return Math.max(...arr);\n}';
      codesByLanguage['javascript'] = userJsCode;

      // 3. User switches to C++
      selectedLang = 'cpp';
      if (!codesByLanguage[selectedLang]) {
        codesByLanguage[selectedLang] = getStarterCode(problem, selectedLang);
      }
      assert.ok(codesByLanguage['cpp'].includes('int solve(vector<int>& arr)'));
      assert.ok(codesByLanguage['cpp'].includes('#include <bits/stdc++.h>'));

      // 4. User edits C++ code
      const userCppCode = '#include <bits/stdc++.h>\nusing namespace std;\n\nint solve(vector<int>& arr) {\n  return *max_element(arr.begin(), arr.end());\n}';
      codesByLanguage['cpp'] = userCppCode;

      // 5. User switches back to JavaScript -> MUST PRESERVE userJsCode!
      selectedLang = 'javascript';
      const restoredJs = codesByLanguage[selectedLang] || getStarterCode(problem, selectedLang);
      assert.equal(restoredJs, userJsCode, 'JavaScript code must be preserved intact');

      // 6. User switches back to C++ -> MUST PRESERVE userCppCode!
      selectedLang = 'cpp';
      const restoredCpp = codesByLanguage[selectedLang] || getStarterCode(problem, selectedLang);
      assert.equal(restoredCpp, userCppCode, 'C++ code must be preserved intact');

      // 7. User switches to C for the first time
      selectedLang = 'c';
      if (!codesByLanguage[selectedLang]) {
        codesByLanguage[selectedLang] = getStarterCode(problem, selectedLang);
      }
      assert.ok(codesByLanguage['c'].includes('#include <stdio.h>'));
      assert.ok(codesByLanguage['c'].includes('int solve(int arr[], int n)'));
    });
  });

  describe('5. Fallback Dynamic Generator', () => {
    it('dynamically generates valid C++ starter code for arbitrary unmapped problem', () => {
      const customProblem = {
        title: 'Binary Tree Inversion',
        starterCode: 'function solve(root) {\n  // Invert the binary tree\n}',
        testCases: [{ input: [1, 2, 3], expected: [1, 3, 2] }],
      };

      const cpp = generateStarterCode(customProblem, 'cpp');
      assert.ok(cpp.includes('#include <bits/stdc++.h>'));
      assert.ok(cpp.includes('using namespace std;'));
      assert.ok(cpp.includes('solve('));
      assert.ok(cpp.includes('// Invert the binary tree'));

      const c = generateStarterCode(customProblem, 'c');
      assert.ok(c.includes('#include <stdio.h>'));
      assert.ok(c.includes('solve('));
    });
  });
});

