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

