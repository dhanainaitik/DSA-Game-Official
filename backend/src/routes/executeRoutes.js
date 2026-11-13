/**
 * Code Execution API Routes.
 * Provides isolated multi-language code execution for Run and Submit operations.
 */

const express = require('express');
const router = express.Router();
const { executeCode, SUPPORTED_LANGUAGES } = require('../services/codeExecutionService');

// Optional backend problems cache if problemId is sent without testCases
let PROBLEMS_CACHE = null;
function getProblemTestCases(problemId) {
  if (!PROBLEMS_CACHE) {
    try {
      const { PROBLEMS } = require('../../../frontend/src/data/problems.js');
      PROBLEMS_CACHE = PROBLEMS;
    } catch {
      PROBLEMS_CACHE = {};
    }
  }
  return PROBLEMS_CACHE[problemId]?.testCases || null;
}

// Compiler health and diagnostic check endpoint
router.get('/health', async (req, res) => {
  try {
    const cppCheck = await executeCode({
      language: 'cpp',
      code: '#include <iostream>\nusing namespace std;\nint main() { cout << 42; return 0; }',
      testCases: [{ input: '', expected: '42' }],
    });

    const cCheck = await executeCode({
      language: 'c',
      code: '#include <stdio.h>\nint main() { printf("42"); return 0; }',
      testCases: [{ input: '', expected: '42' }],
    });

    const healthy = cppCheck.passed && cCheck.passed;
    return res.status(healthy ? 200 : 503).json({
      status: healthy ? 'healthy' : 'degraded',
      compiler: 'native-gcc',
      cpp: {
        healthy: cppCheck.passed,
        output: cppCheck.results?.[0]?.actual,
        error: cppCheck.compileError || cppCheck.runtimeError,
      },
      c: {
        healthy: cCheck.passed,
        output: cCheck.results?.[0]?.actual,
        error: cCheck.compileError || cCheck.runtimeError,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      compiler: 'native-gcc',
      error: err.message,
    });
  }
});

router.post('/', async (req, res) => {
  const { language, code, problemId, testCases, mode } = req.body;

  // 1. Validate language
  if (!language || typeof language !== 'string') {
    return res.status(400).json({
      error: 'Language is required. Supported languages: ' + SUPPORTED_LANGUAGES.join(', '),
      code: 'MISSING_LANGUAGE',
    });
  }

  const normalizedLang = language.toLowerCase().trim();
  if (!SUPPORTED_LANGUAGES.includes(normalizedLang)) {
    return res.status(400).json({
      error: `Invalid or unsupported language '${language}'. Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`,
      code: 'UNSUPPORTED_LANGUAGE',
    });
  }

  // 2. Validate code
  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({
      error: 'Code is required and must be a non-empty string.',
      code: 'MISSING_CODE',
    });
  }

  // 3. Resolve test cases
  let resolvedTestCases = Array.isArray(testCases) && testCases.length > 0 ? testCases : null;
  if (!resolvedTestCases && problemId) {
    resolvedTestCases = getProblemTestCases(problemId);
  }

  // If code contains main() (standalone program or diagnostic), allow execution without problemId
  const isStandalone = /\bint\s+main\s*\(/.test(code) || /\bvoid\s+main\s*\(/.test(code);
  if (!resolvedTestCases && isStandalone) {
    resolvedTestCases = [{ input: '', expected: '' }];
  }

  if (!resolvedTestCases || resolvedTestCases.length === 0) {
    return res.status(400).json({
      error: 'Either problemId or testCases must be provided with at least one test case.',
      code: 'MISSING_TEST_CASES',
    });
  }

  try {
    const result = await executeCode({
      language: normalizedLang,
      code,
      problemId,
      testCases: resolvedTestCases,
      mode: mode || 'run',
    });

    return res.json(result);
  } catch (err) {
    console.error('Code execution error:', err);
    return res.status(500).json({
      passed: false,
      error: err.message,
      results: [],
    });
  }
});

module.exports = router;

