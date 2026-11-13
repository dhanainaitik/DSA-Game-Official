import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { runCode, normalize } from '../../utils/codeRunner.js';

const sampleTestCases = [
  { input: [3, 1, 4, 1, 5, 9, 2, 6], expected: 9 },
  { input: [-5, -1, -3], expected: -1 },
  { input: [7], expected: 7 },
];

describe('Test Cases & Results Data Model Tests', () => {

  test('1. Successful JavaScript execution: returns caseNumber, actual, expected, passed and status: passed', async () => {
    const code = `
      function solve(arr) {
        let m = arr[0];
        for (let x of arr) if (x > m) m = x;
        return m;
      }
    `;
    const results = await runCode(code, 'javascript', sampleTestCases);

    assert.equal(results.length, 3);
    assert.equal(results.passed, true);
    assert.equal(results.passedCount, 3);
    assert.equal(results.totalCount, 3);
    assert.equal(results.compileError, null);
    assert.equal(results.runtimeError, null);

    // Case 1
    assert.equal(results[0].caseNumber, 1);
    assert.equal(results[0].expected, '9');
    assert.equal(results[0].actual, '9');
    assert.equal(results[0].passed, true);
    assert.equal(results[0].status, 'passed');

    // Case 2
    assert.equal(results[1].caseNumber, 2);
    assert.equal(results[1].expected, '-1');
    assert.equal(results[1].actual, '-1');
    assert.equal(results[1].passed, true);
    assert.equal(results[1].status, 'passed');

    // Case 3
    assert.equal(results[2].caseNumber, 3);
    assert.equal(results[2].expected, '7');
    assert.equal(results[2].actual, '7');
    assert.equal(results[2].passed, true);
    assert.equal(results[2].status, 'passed');
  });

  test('2. Failed JavaScript execution: captures actual output mismatch and status: failed', async () => {
    const code = `
      function solve(arr) {
        // Deliberately returns minimum
        let m = arr[0];
        for (let x of arr) if (x < m) m = x;
        return m;
      }
    `;
    const results = await runCode(code, 'javascript', sampleTestCases);

    assert.equal(results.length, 3);
    assert.equal(results.passed, false);
    assert.equal(results.passedCount, 1); // Case 3 ([7]) matches since min and max are 7
    assert.equal(results.totalCount, 3);

    // Case 1: min of [3,1,4,1,5,9,2,6] is 1, expected 9
    assert.equal(results[0].caseNumber, 1);
    assert.equal(results[0].expected, '9');
    assert.equal(results[0].actual, '1');
    assert.equal(results[0].passed, false);
    assert.equal(results[0].status, 'failed');

    // Case 2: min of [-5,-1,-3] is -5, expected -1
    assert.equal(results[1].caseNumber, 2);
    assert.equal(results[1].expected, '-1');
    assert.equal(results[1].actual, '-5');
    assert.equal(results[1].passed, false);
    assert.equal(results[1].status, 'failed');

    // Case 3: min of [7] is 7, expected 7 (passed)
    assert.equal(results[2].caseNumber, 3);
    assert.equal(results[2].expected, '7');
    assert.equal(results[2].actual, '7');
    assert.equal(results[2].passed, true);
    assert.equal(results[2].status, 'passed');
    assert.equal(results[1].caseNumber, 2);
    assert.equal(results[1].expected, '-1');
    assert.equal(results[1].actual, '-5');
    assert.equal(results[1].passed, false);
    assert.equal(results[1].status, 'failed');
  });

  test('3. JavaScript Runtime Error: captures exception message and sets status: error', async () => {
    const code = `
      function solve(arr) {
        throw new Error('Null Pointer in algorithm step');
      }
    `;
    const results = await runCode(code, 'javascript', sampleTestCases);

    assert.equal(results.length, 3);
    assert.equal(results.passed, false);
    assert.equal(results[0].status, 'error');
    assert.ok(results[0].actual.includes('Runtime Error: Null Pointer'));
    assert.ok(results.runtimeError.includes('Null Pointer'));
  });

  test('4. Normalize output utility handles primitives, numbers, booleans, and JSON objects', () => {
    assert.equal(normalize(null), 'null');
    assert.equal(normalize(undefined), 'undefined');
    assert.equal(normalize(true), 'true');
    assert.equal(normalize(false), 'false');
    assert.equal(normalize(42), '42');
    assert.equal(normalize(-5), '-5');
    assert.equal(normalize([1, 2, 3]), '[1,2,3]');
    assert.equal(normalize(' [1, 2, 3] '), '[1,2,3]');
    assert.equal(normalize('true'), 'true');
  });
});
