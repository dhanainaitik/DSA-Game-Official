/**
 * Advanced Multi-Language Code Execution Engine for Codo Champ.
 * Supports Local JavaScript sandboxing and Native Backend Multi-language execution (C++, C, JS).
 */

import { apiUrl } from './api';

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
      if (typeof parsed === 'object' || Array.isArray(parsed)) {
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

  for (const tc of testCases) {
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

      results.push({
        input: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input),
        expected,
        actual,
        passed: actual === expected,
        duration: duration.toFixed(1)
      });
    } catch (err) {
      results.push({
        input: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input),
        expected: normalize(tc.expected),
        actual: 'Execution Error',
        passed: false,
        error: err.message
      });
    }
  }

  return results;
}

/**
 * Main entry point for running code (RUN mode).
 * Sends C, C++ and remote workloads to backend execution service.
 */
export async function runCode(userCode, language, testCases, userToken = null, problemId = null) {
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
      return [{ error: errMsg, passed: false }];
    }

    if (data.compileError) {
      return [{
        error: data.compileError,
        compileError: data.compileError,
        actual: 'Compilation Error',
        expected: 'Successful compilation',
        passed: false,
      }];
    }

    // Return genuine execution results from compiler
    if (Array.isArray(data.results) && data.results.length > 0) {
      return data.results;
    }

    return [{
      error: data.runtimeError || 'No test case results produced',
      passed: false,
    }];
  } catch (err) {
    console.error('Remote Runner Error:', err);
    return [{ error: 'Remote compiler unavailable: ' + err.message, passed: false }];
  }
}
