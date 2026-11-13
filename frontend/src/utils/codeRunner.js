/**
 * Advanced Multi-Language Code Execution Engine for Codo Champ.
 * Supports Local JavaScript sandboxing and Native Backend Multi-language execution (C++, C, JS).
 */

import { apiUrl } from './api.js';

/**
 * Normalizes output and expected values for comparison.
 */
export function normalize(val) {
  if (val === null || val === undefined) return String(val).toLowerCase(); // 'null' or 'undefined'
  
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === 'true' || trimmed === 'false') return trimmed;
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'object' && parsed !== null) {
        return JSON.stringify(parsed);
      }
      return String(parsed);
    } catch {
      return trimmed;
    }
  }
  
  if (Array.isArray(val) || typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

/**
 * Executes JavaScript locally using a Function wrapper.
 */
function runJSLocally(userCode, testCases) {
  const results = [];
  
  // Attempt to find function name, default to 'solve'
  const fnMatch = userCode.match(/function\s+(\w+)\s*\(/);
  const fnName = fnMatch ? fnMatch[1] : 'solve';

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    try {
      // Parse input into an array of arguments
      let args;
      if (typeof tc.input === 'string') {
        try {
          args = JSON.parse(`[${tc.input}]`);
        } catch {
          args = [tc.input];
        }
      } else if (Array.isArray(tc.input)) {
        args = [tc.input];
      } else {
        args = [tc.input];
      }
      const expected = normalize(tc.expected);

      // eslint-disable-next-line no-new-func
      const runner = new Function(
        'args',
        `"use strict";
        ${userCode}
        return ${fnName}(...args);`
      );

      const startTime = performance.now();
      const actualRaw = runner(args);
      const duration = performance.now() - startTime;
      const actual = normalize(actualRaw);
      const passed = actual === expected;

      results.push({
        caseNumber: i + 1,
        input: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input),
        expected,
        expectedOutput: expected,
        actual,
        actualOutput: actual,
        passed,
        status: passed ? 'passed' : 'failed',
        duration: duration.toFixed(1),
        executionTime: Number(duration.toFixed(1)),
        error: null,
      });
    } catch (err) {
      results.push({
        caseNumber: i + 1,
        input: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input),
        expected: normalize(tc.expected),
        expectedOutput: normalize(tc.expected),
        actual: 'Runtime Error: ' + err.message,
        actualOutput: 'Runtime Error: ' + err.message,
        passed: false,
        status: 'error',
        duration: '0.0',
        executionTime: 0,
        error: err.message,
      });
    }
  }

  const passedCount = results.filter(r => r.passed).length;
  results.passed = results.length > 0 && passedCount === results.length;
  results.success = results.passed;
  results.passedCount = passedCount;
  results.totalCount = results.length;
  results.language = 'javascript';
  results.compileError = null;
  results.runtimeError = results.some(r => r.error) ? results.find(r => r.error).error : null;
  results.feedback = results.passed ? 'All test cases verified successfully!' : `${passedCount} of ${results.length} test cases passed.`;

  return results;
}

/**
 * Main entry point for running code (RUN mode).
 * Sends C, C++ and remote workloads to backend execution service.
 */
export async function runCode(userCode, language, testCases = [], userToken = null, problemId = null) {
  const normalizedLang = (language || '').toLowerCase().trim();

  // If JavaScript and testCases are standard, run locally for instant feedback
  if (normalizedLang === 'javascript') {
    return runJSLocally(userCode, testCases);
  }

  // For C++ and C, invoke backend compiler execution endpoint
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (userToken) {
      headers['Authorization'] = `Bearer ${userToken}`;
    }

    const response = await fetch(apiUrl('/api/execute'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        code: userCode,
        language: normalizedLang,
        problemId: problemId || null,
        testCases,
        mode: 'run',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error || 'Execution failed on server';
      const results = testCases.map((tc, idx) => ({
        caseNumber: idx + 1,
        input: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input),
        expected: normalize(tc.expected),
        expectedOutput: normalize(tc.expected),
        actual: 'Server Error',
        actualOutput: 'Server Error',
        passed: false,
        status: 'error',
        error: errMsg,
      }));
      results.error = errMsg;
      results.runtimeError = errMsg;
      results.compileError = null;
      results.passed = false;
      results.success = false;
      results.passedCount = 0;
      results.totalCount = testCases.length;
      results.language = normalizedLang;
      return results;
    }

    if (data.compileError) {
      const results = (Array.isArray(data.results) && data.results.length > 0)
        ? data.results
        : testCases.map((tc, idx) => ({
            caseNumber: idx + 1,
            input: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input),
            expected: normalize(tc.expected),
            expectedOutput: normalize(tc.expected),
            actual: 'Compilation Error',
            actualOutput: 'Compilation Error',
            passed: false,
            status: 'error',
            error: data.compileError,
          }));
      results.error = data.compileError;
      results.compileError = data.compileError;
      results.runtimeError = null;
      results.passed = false;
      results.success = false;
      results.passedCount = 0;
      results.totalCount = testCases.length;
      results.language = normalizedLang;
      results.feedback = data.feedback || 'Compilation Error';
      return results;
    }

    const results = Array.isArray(data.results) ? data.results : [];
    const passedCount = results.filter(r => r.passed).length;
    results.compileError = null;
    results.runtimeError = data.runtimeError || null;
    results.error = data.runtimeError || null;
    results.passed = Boolean(data.passed);
    results.success = Boolean(data.passed);
    results.passedCount = data.passedCount !== undefined ? data.passedCount : passedCount;
    results.totalCount = data.totalCount !== undefined ? data.totalCount : results.length;
    results.language = normalizedLang;
    results.duration = data.duration || '0.0';
    results.feedback = data.feedback || '';
    return results;
  } catch (err) {
    console.error('Remote Runner Error:', err);
    const results = testCases.map((tc, idx) => ({
      caseNumber: idx + 1,
      input: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input),
      expected: normalize(tc.expected),
      expectedOutput: normalize(tc.expected),
      actual: 'Remote engine unavailable',
      actualOutput: 'Remote engine unavailable',
      passed: false,
      status: 'error',
      error: err.message,
    }));
    results.error = 'Remote compiler unavailable: ' + err.message;
    results.runtimeError = 'Remote compiler unavailable: ' + err.message;
    results.compileError = null;
    results.passed = false;
    results.success = false;
    results.passedCount = 0;
    results.totalCount = testCases.length;
    results.language = normalizedLang;
    return results;
  }
}
