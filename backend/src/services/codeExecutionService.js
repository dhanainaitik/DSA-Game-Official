/**
 * Isolated Multi-Language Code Execution Service for Codo Champ.
 * Supports:
 *  - JavaScript (Isolated Node.js process)
 *  - C++ (Native GCC g++ compiler)
 *  - C (Native GCC gcc compiler)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const {
  SUPPORTED_LANGUAGES,
  normalizeOutput,
} = require('./executionUtils');
const {
  buildCppSource,
  buildCSource,
  buildJsRunner,
} = require('./problemExecutionSpecs');

// Security & Timeout limits
const COMPILE_TIMEOUT_MS = 8000;
const EXEC_TIMEOUT_MS = 3000;
const MAX_BUFFER_BYTES = 1024 * 1024; // 1MB stdout protection

/**
 * Executes a binary or script with isolated environment and timeout.
 */
function runProcess(file, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(
      file,
      args,
      {
        timeout: options.timeout || EXEC_TIMEOUT_MS,
        maxBuffer: options.maxBuffer || MAX_BUFFER_BYTES,
        env: options.env !== undefined ? options.env : {}, // Stripped environment
        cwd: options.cwd || process.cwd(),
      },
      (error, stdout, stderr) => {
        if (error) {
          return resolve({
            error,
            stdout: stdout ? stdout.toString() : '',
            stderr: stderr ? stderr.toString() : '',
            timedOut: error.killed && (error.signal === 'SIGTERM' || error.code === 'ETIMEDOUT'),
          });
        }
        resolve({
          error: null,
          stdout: stdout ? stdout.toString() : '',
          stderr: stderr ? stderr.toString() : '',
          timedOut: false,
        });
      }
    );
  });
}

/**
 * Compiles source file using g++ or gcc.
 */
async function compileSource(compiler, srcFile, binFile, standardFlags) {
  const compileRes = await runProcess(
    compiler,
    [...standardFlags, srcFile, '-o', binFile],
    { timeout: COMPILE_TIMEOUT_MS, env: process.env }
  );

  if (compileRes.error || compileRes.stderr.includes('error:')) {
    const errorDetails = compileRes.stderr || compileRes.stdout || (compileRes.error && compileRes.error.message) || 'Compilation failed';
    return {
      success: false,
      compileError: errorDetails.trim(),
    };
  }

  return { success: true };
}

/**
 * Parses execution stdout looking for markers: __RESULT_START__<idx>__<val>__RESULT_END__
 */
function parseExecutionResults(stdout, testCases) {
  const markerRegex = /__RESULT_START__(\d+)__([\s\S]*?)__RESULT_END__/g;
  const resultMap = {};
  let match;

  while ((match = markerRegex.exec(stdout)) !== null) {
    const idx = parseInt(match[1], 10);
    const val = match[2].trim();
    resultMap[idx] = val;
  }

  return testCases.map((tc, idx) => {
    const expected = normalizeOutput(tc.expected);
    const rawActual = resultMap[idx];
    const actual = rawActual !== undefined ? normalizeOutput(rawActual) : 'No Output / Crash';
    const passed = rawActual !== undefined && actual === expected;

    return {
      caseNumber: idx + 1,
      input: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input),
      expected,
      expectedOutput: expected,
      actual,
      actualOutput: actual,
      passed,
      status: passed ? 'passed' : 'failed',
      duration: '0.0',
      executionTime: 0,
      error: rawActual === undefined ? 'Process exited without returning a result' : null,
    };
  });
}

/**
 * Main execution entry point.
 *
 * @param {Object} params
 * @param {string} params.language - 'javascript', 'cpp', or 'c'
 * @param {string} params.code - Source code
 * @param {string} [params.problemId] - Problem ID
 * @param {Array} [params.testCases] - Array of test case objects { input, expected }
 * @param {string} [params.mode] - 'run' or 'submit'
 */
async function executeCode({ language, code, problemId, testCases = [], mode = 'run' }) {
  // 1. Strict validation
  if (!language || typeof language !== 'string') {
    throw new Error('Language is required and must be a string.');
  }

  const normalizedLang = language.toLowerCase().trim();
  if (!SUPPORTED_LANGUAGES.includes(normalizedLang)) {
    throw new Error(`Invalid or unsupported language '${language}'. Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}.`);
  }

  if (!code || typeof code !== 'string' || !code.trim()) {
    throw new Error('Code is required and must be a non-empty string.');
  }

  if (!Array.isArray(testCases) || testCases.length === 0) {
    throw new Error('Test cases must be provided as a non-empty array.');
  }

  // 2. Create isolated temporary workspace
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), `codo_exec_${normalizedLang}_`));

  try {
    const startTime = Date.now();

    if (normalizedLang === 'cpp') {
      const srcFile = path.join(tmpDir, 'solution.cpp');
      const binFile = path.join(tmpDir, 'solution.exe');

      const fullSource = buildCppSource(code, testCases, problemId);
      await fs.promises.writeFile(srcFile, fullSource, 'utf8');

      // Compile with g++
      const compileResult = await compileSource(
        'g++',
        srcFile,
        binFile,
        ['-O2', '-std=c++17', '-DONLINE_JUDGE']
      );

      if (!compileResult.success) {
        return {
          success: false,
          passed: false,
          language: normalizedLang,
          passedCount: 0,
          totalCount: testCases.length,
          compileError: compileResult.compileError,
          runtimeError: null,
          error: compileResult.compileError,
          results: testCases.map((tc, idx) => ({
            caseNumber: idx + 1,
            input: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input),
            expected: normalizeOutput(tc.expected),
            expectedOutput: normalizeOutput(tc.expected),
            actual: 'Compilation Error',
            actualOutput: 'Compilation Error',
            passed: false,
            status: 'error',
            error: compileResult.compileError,
            executionTime: 0,
            duration: '0.0',
          })),
          feedback: 'Compilation Error: Please check your syntax and types.',
          details: compileResult.compileError,
        };
      }

      // Execute binary with stripped env
      const execRes = await runProcess(binFile, [], {
        timeout: EXEC_TIMEOUT_MS,
        env: {},
        cwd: tmpDir,
      });

      if (execRes.timedOut) {
        return {
          success: false,
          passed: false,
          language: normalizedLang,
          passedCount: 0,
          totalCount: testCases.length,
          compileError: null,
          runtimeError: 'Time Limit Exceeded (3000ms). Check for infinite loops or inefficient recursion.',
          error: 'Time Limit Exceeded (3000ms)',
          results: testCases.map((tc, idx) => ({
            caseNumber: idx + 1,
            input: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input),
            expected: normalizeOutput(tc.expected),
            expectedOutput: normalizeOutput(tc.expected),
            actual: 'Time Limit Exceeded',
            actualOutput: 'Time Limit Exceeded',
            passed: false,
            status: 'timeout',
            error: 'Time Limit Exceeded (3000ms)',
            executionTime: 3000,
            duration: '3000.0',
          })),
          feedback: 'Time Limit Exceeded (3000ms). Check for infinite loops.',
          details: 'The execution took longer than 3000ms and was terminated.',
        };
      }

      const results = parseExecutionResults(execRes.stdout, testCases);
      const passedCount = results.filter(r => r.passed).length;
      const allPassed = results.length > 0 && passedCount === results.length;
      const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

      return {
        success: allPassed,
        passed: allPassed,
        language: normalizedLang,
        passedCount,
        totalCount: results.length,
        results,
        compileError: null,
        runtimeError: execRes.error ? (execRes.stderr || execRes.error.message) : null,
        error: execRes.error ? (execRes.stderr || execRes.error.message) : null,
        duration: totalDuration,
        feedback: allPassed
          ? 'All test cases verified successfully in C++.'
          : `${passedCount} of ${results.length} test cases passed.`,
        details: allPassed
          ? 'Verified 100% pass rate across all test cases.'
          : `${passedCount} of ${results.length} test cases passed.`,
      };
    } else if (normalizedLang === 'c') {
      const srcFile = path.join(tmpDir, 'solution.c');
      const binFile = path.join(tmpDir, 'solution.exe');

      const fullSource = buildCSource(code, testCases, problemId);
      await fs.promises.writeFile(srcFile, fullSource, 'utf8');

      // Compile with gcc
      const compileResult = await compileSource(
        'gcc',
        srcFile,
        binFile,
        ['-O2', '-std=c11', '-lm', '-DONLINE_JUDGE']
      );

      if (!compileResult.success) {
        return {
          success: false,
          passed: false,
          language: normalizedLang,
          passedCount: 0,
          totalCount: testCases.length,
          compileError: compileResult.compileError,
          runtimeError: null,
          error: compileResult.compileError,
          results: testCases.map((tc, idx) => ({
            caseNumber: idx + 1,
            input: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input),
            expected: normalizeOutput(tc.expected),
            expectedOutput: normalizeOutput(tc.expected),
            actual: 'Compilation Error',
            actualOutput: 'Compilation Error',
            passed: false,
            status: 'error',
            error: compileResult.compileError,
            executionTime: 0,
            duration: '0.0',
          })),
          feedback: 'Compilation Error: Please check your syntax and types in C.',
          details: compileResult.compileError,
        };
      }

      // Execute binary with stripped env
      const execRes = await runProcess(binFile, [], {
        timeout: EXEC_TIMEOUT_MS,
        env: {},
        cwd: tmpDir,
      });

      if (execRes.timedOut) {
        return {
          success: false,
          passed: false,
          language: normalizedLang,
          passedCount: 0,
          totalCount: testCases.length,
          compileError: null,
          runtimeError: 'Time Limit Exceeded (3000ms). Check for infinite loops or inefficient recursion.',
          error: 'Time Limit Exceeded (3000ms)',
          results: testCases.map((tc, idx) => ({
            caseNumber: idx + 1,
            input: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input),
            expected: normalizeOutput(tc.expected),
            expectedOutput: normalizeOutput(tc.expected),
            actual: 'Time Limit Exceeded',
            actualOutput: 'Time Limit Exceeded',
            passed: false,
            status: 'timeout',
            error: 'Time Limit Exceeded (3000ms)',
            executionTime: 3000,
            duration: '3000.0',
          })),
          feedback: 'Time Limit Exceeded (3000ms). Check for infinite loops.',
          details: 'The execution took longer than 3000ms and was terminated.',
        };
      }

      const results = parseExecutionResults(execRes.stdout, testCases);
      const passedCount = results.filter(r => r.passed).length;
      const allPassed = results.length > 0 && passedCount === results.length;
      const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

      return {
        success: allPassed,
        passed: allPassed,
        language: normalizedLang,
        passedCount,
        totalCount: results.length,
        results,
        compileError: null,
        runtimeError: execRes.error ? (execRes.stderr || execRes.error.message) : null,
        error: execRes.error ? (execRes.stderr || execRes.error.message) : null,
        duration: totalDuration,
        feedback: allPassed
          ? 'All test cases verified successfully in C.'
          : `${passedCount} of ${results.length} test cases passed.`,
        details: allPassed
          ? 'Verified 100% pass rate across all test cases.'
          : `${passedCount} of ${results.length} test cases passed.`,
      };
    } else if (normalizedLang === 'javascript') {
      const runnerFile = path.join(tmpDir, 'runner.js');
      const runnerSource = buildJsRunner(code, testCases);
      await fs.promises.writeFile(runnerFile, runnerSource, 'utf8');

      const execRes = await runProcess(process.execPath, [runnerFile], {
        timeout: EXEC_TIMEOUT_MS,
        env: {},
        cwd: tmpDir,
      });

      if (execRes.timedOut) {
        return {
          success: false,
          passed: false,
          language: normalizedLang,
          passedCount: 0,
          totalCount: testCases.length,
          compileError: null,
          runtimeError: 'Time Limit Exceeded (3000ms). Check for infinite loops or inefficient recursion.',
          error: 'Time Limit Exceeded (3000ms)',
          results: testCases.map((tc, idx) => ({
            caseNumber: idx + 1,
            input: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input),
            expected: normalizeOutput(tc.expected),
            expectedOutput: normalizeOutput(tc.expected),
            actual: 'Time Limit Exceeded',
            actualOutput: 'Time Limit Exceeded',
            passed: false,
            status: 'timeout',
            error: 'Time Limit Exceeded (3000ms)',
            executionTime: 3000,
            duration: '3000.0',
          })),
          feedback: 'Time Limit Exceeded (3000ms). Check for infinite loops.',
          details: 'The execution took longer than 3000ms and was terminated.',
        };
      }

      if (execRes.error && !execRes.stdout.includes('__RESULT_START__')) {
        const runtimeErr = execRes.stderr || execRes.error.message;
        return {
          success: false,
          passed: false,
          language: normalizedLang,
          passedCount: 0,
          totalCount: testCases.length,
          compileError: null,
          runtimeError: runtimeErr,
          error: runtimeErr,
          results: testCases.map((tc, idx) => ({
            caseNumber: idx + 1,
            input: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input),
            expected: normalizeOutput(tc.expected),
            expectedOutput: normalizeOutput(tc.expected),
            actual: 'Runtime Error',
            actualOutput: 'Runtime Error',
            passed: false,
            status: 'error',
            error: runtimeErr,
            executionTime: 0,
            duration: '0.0',
          })),
          feedback: 'JavaScript Execution Error: ' + runtimeErr,
          details: runtimeErr,
        };
      }

      const results = parseExecutionResults(execRes.stdout, testCases);
      const passedCount = results.filter(r => r.passed).length;
      const allPassed = results.length > 0 && passedCount === results.length;
      const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

      return {
        success: allPassed,
        passed: allPassed,
        language: normalizedLang,
        passedCount,
        totalCount: results.length,
        results,
        compileError: null,
        runtimeError: execRes.error ? (execRes.stderr || execRes.error.message) : null,
        error: execRes.error ? (execRes.stderr || execRes.error.message) : null,
        duration: totalDuration,
        feedback: allPassed
          ? 'All test cases verified successfully in JavaScript.'
          : `${passedCount} of ${results.length} test cases passed.`,
        details: allPassed
          ? 'Verified 100% pass rate across all test cases.'
          : `${passedCount} of ${results.length} test cases passed.`,
      };
    }
  } finally {
    // Guaranteed sandbox cleanup
    try {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore transient cleanup errors
    }
  }
}

module.exports = {
  executeCode,
  SUPPORTED_LANGUAGES,
};
