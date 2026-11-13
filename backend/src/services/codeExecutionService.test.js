const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { executeCode, SUPPORTED_LANGUAGES } = require('./codeExecutionService');

const maxSignalTestCases = [
  { input: [3, 1, 4, 1, 5, 9, 2, 6], expected: 9 },
  { input: [-5, -1, -3], expected: -1 },
  { input: [7], expected: 7 },
];

describe('Multi-Language Code Execution Engine', () => {

  // ── 1. Distinct Output Verification (Test A, B, C) ──
  test('Test A (JavaScript): Returns 100 for every test case', async () => {
    const code = `
      function solve(arr) {
        return 100;
      }
    `;
    const res = await executeCode({
      language: 'javascript',
      code,
      problemId: 'p-arr-1-3',
      testCases: maxSignalTestCases,
    });

    assert.equal(res.passed, false, 'Expected solution to fail because 100 != 9');
    assert.equal(res.results.length, 3);
    assert.equal(res.results[0].actual, '100');
    assert.equal(res.results[1].actual, '100');
    assert.equal(res.results[2].actual, '100');
  });

  test('Test B (C++): Returns 200 for every test case (Compiled with g++)', async () => {
    const code = `
      #include <vector>
      using namespace std;
      int solve(vector<int>& arr) {
        return 200;
      }
    `;
    const res = await executeCode({
      language: 'cpp',
      code,
      problemId: 'p-arr-1-3',
      testCases: maxSignalTestCases,
    });

    assert.equal(res.passed, false, 'Expected solution to fail because 200 != 9');
    assert.equal(res.results.length, 3);
    assert.equal(res.results[0].actual, '200');
    assert.equal(res.results[1].actual, '200');
    assert.equal(res.results[2].actual, '200');
  });

  test('Test C (C): Returns 300 for every test case (Compiled with gcc)', async () => {
    const code = `
      int solve(int arr[], int n) {
        return 300;
      }
    `;
    const res = await executeCode({
      language: 'c',
      code,
      problemId: 'p-arr-1-3',
      testCases: maxSignalTestCases,
    });

    assert.equal(res.passed, false, 'Expected solution to fail because 300 != 9');
    assert.equal(res.results.length, 3);
    assert.equal(res.results[0].actual, '300');
    assert.equal(res.results[1].actual, '300');
    assert.equal(res.results[2].actual, '300');
  });

  // ── 2. Real Correct & Incorrect Solutions ──
  test('Correct C++ Maximum Signal Solution passes all test cases', async () => {
    const code = `
      #include <bits/stdc++.h>
      using namespace std;

      int solve(vector<int>& arr) {
        int maxi = INT_MIN;
        for (int i = 0; i < arr.size(); i++) {
          maxi = max(maxi, arr[i]);
        }
        return maxi;
      }
    `;
    const res = await executeCode({
      language: 'cpp',
      code,
      problemId: 'p-arr-1-3',
      testCases: maxSignalTestCases,
    });

    assert.equal(res.compileError, null);
    assert.equal(res.passed, true);
    assert.equal(res.results[0].actual, '9');
    assert.equal(res.results[0].passed, true);
    assert.equal(res.results[1].actual, '-1');
    assert.equal(res.results[1].passed, true);
    assert.equal(res.results[2].actual, '7');
    assert.equal(res.results[2].passed, true);
  });

  test('C++ solution with *max_element and bits/stdc++.h passes test cases [3,1,4,1,5]->5, [-5,-1,-3]->-1, [7]->7', async () => {
    const code = `
      #include <bits/stdc++.h>
      using namespace std;

      int solve(vector<int>& arr) {
        return *max_element(arr.begin(), arr.end());
      }
    `;
    const userTestCases = [
      { input: [3, 1, 4, 1, 5], expected: 5 },
      { input: [-5, -1, -3], expected: -1 },
      { input: [7], expected: 7 },
    ];
    const res = await executeCode({
      language: 'cpp',
      code,
      problemId: 'p-arr-1-3',
      testCases: userTestCases,
    });

    assert.equal(res.compileError, null);
    assert.equal(res.passed, true);
    assert.equal(res.passedCount, 3);
    assert.equal(res.totalCount, 3);
    assert.equal(res.results[0].actual, '5');
    assert.equal(res.results[0].passed, true);
    assert.equal(res.results[1].actual, '-1');
    assert.equal(res.results[1].passed, true);
    assert.equal(res.results[2].actual, '7');
    assert.equal(res.results[2].passed, true);
  });

  test('Incorrect C++ Maximum Signal Solution fails accurately', async () => {
    const code = `
      #include <bits/stdc++.h>
      using namespace std;

      int solve(vector<int>& arr) {
        // Deliberately returns minimum instead of maximum
        int mini = INT_MAX;
        for (int i = 0; i < arr.size(); i++) {
          mini = min(mini, arr[i]);
        }
        return mini;
      }
    `;
    const res = await executeCode({
      language: 'cpp',
      code,
      problemId: 'p-arr-1-3',
      testCases: maxSignalTestCases,
    });

    assert.equal(res.compileError, null);
    assert.equal(res.passed, false);
    assert.equal(res.results[0].actual, '1'); // min of [3,1,4,1,5,9,2,6] is 1
    assert.equal(res.results[0].expected, '9');
    assert.equal(res.results[0].passed, false);
  });

  test('Correct C Maximum Signal Solution passes all test cases', async () => {
    const code = `
      #include <stdio.h>
      #include <limits.h>

      int solve(int arr[], int n) {
        int maxi = INT_MIN;
        for (int i = 0; i < n; i++) {
          if (arr[i] > maxi) maxi = arr[i];
        }
        return maxi;
      }
    `;
    const res = await executeCode({
      language: 'c',
      code,
      problemId: 'p-arr-1-3',
      testCases: maxSignalTestCases,
    });

    assert.equal(res.compileError, null);
    assert.equal(res.passed, true);
    assert.equal(res.results[0].actual, '9');
    assert.equal(res.results[0].passed, true);
    assert.equal(res.results[1].actual, '-1');
    assert.equal(res.results[1].passed, true);
    assert.equal(res.results[2].actual, '7');
    assert.equal(res.results[2].passed, true);
  });

  // ── 3. Compilation Error Handling ──
  test('Compilation error in C++ is captured and returned', async () => {
    const code = `
      #include <vector>
      using namespace std;
      int solve(vector<int>& arr) {
        this_is_an_invalid_syntax_error!!!!
        return 0;
      }
    `;
    const res = await executeCode({
      language: 'cpp',
      code,
      problemId: 'p-arr-1-3',
      testCases: maxSignalTestCases,
    });

    assert.equal(res.passed, false);
    assert.ok(res.compileError, 'compileError should not be null');
    assert.ok(res.compileError.includes('error:'), 'compileError should contain g++ error message');
    assert.equal(res.results.length, 3);
    assert.equal(res.results.every(r => !r.passed), true);
  });

  test('Compilation error in C is captured and returned', async () => {
    const code = `
      int solve(int arr[], int n) {
        syntax_error_in_c_code????;
        return 0;
      }
    `;
    const res = await executeCode({
      language: 'c',
      code,
      problemId: 'p-arr-1-3',
      testCases: maxSignalTestCases,
    });

    assert.equal(res.passed, false);
    assert.ok(res.compileError, 'compileError should not be null');
    assert.ok(res.compileError.includes('error:'), 'compileError should contain gcc error message');
    assert.equal(res.results.length, 3);
    assert.equal(res.results.every(r => !r.passed), true);
  });

  // ── 4. Validation & Error Handling ──
  test('Unsupported language is rejected with error', async () => {
    await assert.rejects(
      async () => {
        await executeCode({
          language: 'ruby',
          code: 'puts "hello"',
          problemId: 'p-arr-1-3',
          testCases: maxSignalTestCases,
        });
      },
      /Invalid or unsupported language 'ruby'/
    );
  });

  test('Missing language is rejected with error', async () => {
    await assert.rejects(
      async () => {
        await executeCode({
          code: 'function solve() {}',
          problemId: 'p-arr-1-3',
          testCases: maxSignalTestCases,
        });
      },
      /Language is required/
    );
  });
});

