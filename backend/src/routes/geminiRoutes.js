const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const authMiddleware = require('../middleware/authMiddleware');
const { executeCode } = require('../services/codeExecutionService');

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

router.post('/', authMiddleware, async (req, res) => {
  const { code, language, context, mode, problemId } = req.body;

  // 1. Validate language
  if (!language || typeof language !== 'string') {
    return res.status(400).json({
      passed: false,
      error: 'Language is required. Supported languages: javascript, cpp, c.',
      results: [],
    });
  }

  const testCases = context?.testCases || [];
  if (!testCases || testCases.length === 0) {
    return res.status(400).json({
      passed: false,
      error: 'Test cases are required for evaluation.',
      results: [],
    });
  }

  // 2. Perform REAL multi-language compiler / runtime execution
  let executionResult;
  try {
    executionResult = await executeCode({
      language,
      code,
      problemId: problemId || context?.problemId,
      testCases,
      mode: mode || 'run',
    });
  } catch (execErr) {
    console.error('[Execution Error in /api/evaluate]:', execErr);
    return res.status(400).json({
      passed: false,
      error: execErr.message,
      results: [],
    });
  }

  // If compilation error or runtime error occurred, return actual compiler error immediately
  if (executionResult.compileError) {
    return res.json({
      passed: false,
      correctness: 0,
      compileError: executionResult.compileError,
      feedback: 'Compilation Error: ' + executionResult.compileError,
      details: executionResult.compileError,
      results: [],
      complexity: { time: 'N/A', space: 'N/A' },
    });
  }

  // If in technical RUN mode or no Gemini API key configured, return genuine compiler results immediately
  if (mode === 'run' || !genAI) {
    return res.json({
      passed: executionResult.passed,
      correctness: executionResult.passed ? 1 : 0,
      efficiency: 0.8,
      codeQuality: 0.8,
      feedback: executionResult.feedback,
      details: executionResult.feedback,
      complexity: { time: 'Evaluated', space: 'Evaluated' },
      results: executionResult.results,
    });
  }

  // 3. For SUBMIT mode with active Gemini API key, obtain mentor advice
  // but strictly retain genuine test execution results from compiler!
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    const prompt = `
      You are an expert Code Mentor for "Codo Leveling".
      The user submitted ${language} code for problem "${context.title || 'Challenge'}".
      
      Actual compiler execution results:
      - All Passed: ${executionResult.passed}
      - Test case pass count: ${executionResult.results.filter(r => r.passed).length}/${executionResult.results.length}

      User Code:
      \`\`\`${language}
      ${code}
      \`\`\`

      Provide constructive educational feedback, algorithmic complexity estimation, and optimization tips.
      Respond ONLY with a JSON object in this format:
      {
        "feedback": "Mentor style feedback",
        "details": "Technical breakdown",
        "mistakes": ["..."],
        "hints": ["..."],
        "next_step": "...",
        "complexity": { "time": "O(?)", "space": "O(?)" },
        "efficiency": number (0.0 to 1.0),
        "codeQuality": number (0.0 to 1.0)
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonStr = text.replace(/```json|```/g, '').trim();
    const aiFeedback = JSON.parse(jsonStr);

    return res.json({
      passed: executionResult.passed,
      correctness: executionResult.passed ? 1 : 0,
      efficiency: aiFeedback.efficiency ?? 0.8,
      codeQuality: aiFeedback.codeQuality ?? 0.8,
      feedback: aiFeedback.feedback || executionResult.feedback,
      details: aiFeedback.details || executionResult.feedback,
      mistakes: aiFeedback.mistakes || [],
      hints: aiFeedback.hints || [],
      next_step: aiFeedback.next_step || '',
      complexity: aiFeedback.complexity || { time: 'Evaluated', space: 'Evaluated' },
      results: executionResult.results, // Always return actual compiler execution results!
    });
  } catch (geminiError) {
    console.warn('[Gemini Feedback Fallback]:', geminiError.message);
    // Return real compiler execution results even if AI feedback fails
    return res.json({
      passed: executionResult.passed,
      correctness: executionResult.passed ? 1 : 0,
      efficiency: 0.8,
      codeQuality: 0.8,
      feedback: executionResult.feedback,
      details: executionResult.feedback,
      complexity: { time: 'Evaluated', space: 'Evaluated' },
      results: executionResult.results,
    });
  }
});

module.exports = router;
