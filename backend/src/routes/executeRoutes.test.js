const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const http = require('http');
const executeRoutes = require('./executeRoutes');

let server;
let baseUrl;

const sampleTestCases = [
  { input: [3, 1, 4, 1, 5, 9, 2, 6], expected: 9 },
  { input: [-5, -1, -3], expected: -1 },
  { input: [7], expected: 7 },
];

before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/execute', executeRoutes);

  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api/execute`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

describe('Execution API Endpoint (/api/execute) Integration Tests', () => {

  test('POST /api/execute - Test A (JavaScript): returns 100 for all test cases', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'javascript',
        code: 'function solve(arr) { return 100; }',
        problemId: 'p-arr-1-3',
        testCases: sampleTestCases,
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.passed, false);
    assert.equal(data.results.length, 3);
    assert.equal(data.results[0].actual, '100');
    assert.equal(data.results[1].actual, '100');
    assert.equal(data.results[2].actual, '100');
  });

  test('POST /api/execute - Test B (C++): returns 200 for all test cases (Compiled with g++)', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'cpp',
        code: '#include <vector>\nusing namespace std;\nint solve(vector<int>& arr) { return 200; }',
        problemId: 'p-arr-1-3',
        testCases: sampleTestCases,
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.passed, false);
    assert.equal(data.results.length, 3);
    assert.equal(data.results[0].actual, '200');
    assert.equal(data.results[1].actual, '200');
    assert.equal(data.results[2].actual, '200');
  });

  test('POST /api/execute - Test C (C): returns 300 for all test cases (Compiled with gcc)', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'c',
        code: 'int solve(int arr[], int n) { return 300; }',
        problemId: 'p-arr-1-3',
        testCases: sampleTestCases,
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.passed, false);
    assert.equal(data.results.length, 3);
    assert.equal(data.results[0].actual, '300');
    assert.equal(data.results[1].actual, '300');
    assert.equal(data.results[2].actual, '300');
  });

  test('POST /api/execute - Correct C++ Maximum Signal Solution', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'cpp',
        code: `
          #include <bits/stdc++.h>
          using namespace std;
          int solve(vector<int>& arr) {
            int maxi = INT_MIN;
            for (int x : arr) if (x > maxi) maxi = x;
            return maxi;
          }
        `,
        problemId: 'p-arr-1-3',
        testCases: sampleTestCases,
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.passed, true);
    assert.equal(data.results[0].actual, '9');
    assert.equal(data.results[0].passed, true);
    assert.equal(data.results[1].actual, '-1');
    assert.equal(data.results[1].passed, true);
    assert.equal(data.results[2].actual, '7');
    assert.equal(data.results[2].passed, true);
  });

  test('POST /api/execute - Incorrect C++ Solution fails', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'cpp',
        code: `
          #include <vector>
          using namespace std;
          int solve(vector<int>& arr) { return -999; }
        `,
        problemId: 'p-arr-1-3',
        testCases: sampleTestCases,
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.passed, false);
    assert.equal(data.results[0].passed, false);
  });

  test('POST /api/execute - Correct C Solution passes', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'c',
        code: `
          #include <limits.h>
          int solve(int arr[], int n) {
            int maxi = INT_MIN;
            for (int i = 0; i < n; i++) {
              if (arr[i] > maxi) maxi = arr[i];
            }
            return maxi;
          }
        `,
        problemId: 'p-arr-1-3',
        testCases: sampleTestCases,
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.passed, true);
    assert.equal(data.results[0].actual, '9');
    assert.equal(data.results[0].passed, true);
  });

  test('POST /api/execute - Compilation error in C++ returns compileError', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'cpp',
        code: 'int solve(vector<int>& arr) { syntax_error! }',
        problemId: 'p-arr-1-3',
        testCases: sampleTestCases,
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.passed, false);
    assert.ok(data.compileError);
    assert.ok(data.compileError.includes('error:'));
  });

  test('POST /api/execute - Compilation error in C returns compileError', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'c',
        code: 'int solve(int arr[], int n) { syntax_error! }',
        problemId: 'p-arr-1-3',
        testCases: sampleTestCases,
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.passed, false);
    assert.ok(data.compileError);
    assert.ok(data.compileError.includes('error:'));
  });

  test('POST /api/execute - Unsupported language rejected with 400', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'rust',
        code: 'fn solve() {}',
        problemId: 'p-arr-1-3',
        testCases: sampleTestCases,
      }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.code, 'UNSUPPORTED_LANGUAGE');
  });

  test('POST /api/execute - Missing language rejected with 400', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'function solve() {}',
        problemId: 'p-arr-1-3',
        testCases: sampleTestCases,
      }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.code, 'MISSING_LANGUAGE');
  });

  test('POST /api/execute - Missing code rejected with 400', async () => {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'cpp',
        code: '   ',
        problemId: 'p-arr-1-3',
        testCases: sampleTestCases,
      }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.code, 'MISSING_CODE');
  });
});
