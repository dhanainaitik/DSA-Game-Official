import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  playVictoryCrowdCheer,
  stopVictoryCrowdCheer,
  resetVictoryAudioState,
  isSoundMuted,
  setSoundMuted,
  VICTORY_SOUND_PATH,
  VICTORY_SOUND_DURATION_MS,
} from './victorySound.js';

function createStorageMock() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
}

/**
 * Simulates Question.jsx submission handling logic
 */
function simulateQuestionSubmission({
  action = 'submit', // 'submit' or 'run'
  result,
  testCases = [{ input: [1, 2], expected: 2 }, { input: [3, 4], expected: 4 }],
  mockPlayCheer = playVictoryCrowdCheer,
}) {
  let cheerTriggered = false;

  if (action === 'run') {
    // RUN flow in Question.jsx: never triggers cheer
    return { cheerTriggered: false };
  }

  // SUBMIT flow in Question.jsx:
  if (result.compileError) {
    result.passed = false;
  }

  const tcResults = result.results || [];
  const passedCount = tcResults.filter((tc) => tc.passed).length;
  const totalCount = Math.max(tcResults.length, testCases.length, 1);
  const correctness = passedCount / totalCount;

  if (correctness === 1 && result.passed) {
    cheerTriggered = Boolean(mockPlayCheer());
  }

  return { cheerTriggered, correctness, passed: Boolean(result.passed) };
}

test('1. Successful C++ submission (100% passed): triggers crowd cheer exactly once', () => {
  let playCount = 0;
  const mockCheer = () => { playCount++; return true; };

  const res = simulateQuestionSubmission({
    action: 'submit',
    result: {
      passed: true,
      results: [
        { caseNumber: 1, passed: true, actual: '9', expected: '9' },
        { caseNumber: 2, passed: true, actual: '-1', expected: '-1' },
      ],
      complexity: { time: 'O(N)', space: 'O(1)' },
    },
    mockPlayCheer: mockCheer,
  });

  assert.equal(res.correctness, 1.0);
  assert.equal(res.passed, true);
  assert.equal(res.cheerTriggered, true);
  assert.equal(playCount, 1, 'Cheer sound must play exactly once');
});

test('2. Successful JavaScript submission (100% passed): triggers crowd cheer exactly once', () => {
  let playCount = 0;
  const mockCheer = () => { playCount++; return true; };

  const res = simulateQuestionSubmission({
    action: 'submit',
    result: {
      passed: true,
      results: [
        { caseNumber: 1, passed: true, actual: '42', expected: '42' },
        { caseNumber: 2, passed: true, actual: '100', expected: '100' },
      ],
    },
    mockPlayCheer: mockCheer,
  });

  assert.equal(res.correctness, 1.0);
  assert.equal(res.cheerTriggered, true);
  assert.equal(playCount, 1);
});

test('3. Successful C submission (100% passed): triggers crowd cheer exactly once', () => {
  let playCount = 0;
  const mockCheer = () => { playCount++; return true; };

  const res = simulateQuestionSubmission({
    action: 'submit',
    result: {
      passed: true,
      results: [
        { caseNumber: 1, passed: true, actual: '0', expected: '0' },
        { caseNumber: 2, passed: true, actual: '5', expected: '5' },
      ],
    },
    mockPlayCheer: mockCheer,
  });

  assert.equal(res.correctness, 1.0);
  assert.equal(res.cheerTriggered, true);
  assert.equal(playCount, 1);
});

test('4. Failed submission (incorrect answer): crowd cheer does NOT play', () => {
  let playCount = 0;
  const mockCheer = () => { playCount++; return true; };

  const res = simulateQuestionSubmission({
    action: 'submit',
    result: {
      passed: false,
      results: [
        { caseNumber: 1, passed: false, actual: '-5', expected: '-1' },
        { caseNumber: 2, passed: false, actual: '3', expected: '9' },
      ],
    },
    mockPlayCheer: mockCheer,
  });

  assert.equal(res.correctness, 0);
  assert.equal(res.passed, false);
  assert.equal(res.cheerTriggered, false);
  assert.equal(playCount, 0, 'Cheer sound must NEVER play on incorrect submission');
});

test('5. Compilation or Runtime error: crowd cheer does NOT play', () => {
  let playCount = 0;
  const mockCheer = () => { playCount++; return true; };

  // Compilation Error
  const compileRes = simulateQuestionSubmission({
    action: 'submit',
    result: {
      passed: false,
      compileError: "solution.cpp:6:5: error: expected ';' before 'return'",
      results: [],
    },
    mockPlayCheer: mockCheer,
  });
  assert.equal(compileRes.cheerTriggered, false);
  assert.equal(playCount, 0);

  // Runtime Error / Timeout
  const runtimeRes = simulateQuestionSubmission({
    action: 'submit',
    result: {
      passed: false,
      runtimeError: 'Time Limit Exceeded (3000ms)',
      results: [],
    },
    mockPlayCheer: mockCheer,
  });
  assert.equal(runtimeRes.cheerTriggered, false);
  assert.equal(playCount, 0);
});

test('6. Partial test-case success (1 of 2 passed): crowd cheer does NOT play', () => {
  let playCount = 0;
  const mockCheer = () => { playCount++; return true; };

  const res = simulateQuestionSubmission({
    action: 'submit',
    result: {
      passed: false,
      results: [
        { caseNumber: 1, passed: true, actual: '9', expected: '9' },
        { caseNumber: 2, passed: false, actual: '-5', expected: '-1' },
      ],
    },
    mockPlayCheer: mockCheer,
  });

  assert.equal(res.correctness, 0.5);
  assert.equal(res.cheerTriggered, false);
  assert.equal(playCount, 0, 'Cheer sound must NEVER play on partial test-case success');
});

test('7. RUN button click (even if all dry-run tests pass): crowd cheer does NOT play', () => {
  let playCount = 0;
  const mockCheer = () => { playCount++; return true; };

  const res = simulateQuestionSubmission({
    action: 'run',
    result: {
      passed: true,
      results: [
        { caseNumber: 1, passed: true, actual: '9', expected: '9' },
        { caseNumber: 2, passed: true, actual: '-1', expected: '-1' },
      ],
    },
    mockPlayCheer: mockCheer,
  });

  assert.equal(res.cheerTriggered, false);
  assert.equal(playCount, 0, 'Cheer sound must NEVER play on RUN');
});

test('8. Repeated successful submissions: cleanly stops previous audio before starting new cheer', () => {
  globalThis.window = globalThis;
  globalThis.localStorage = createStorageMock();

  const pauses = [];
  const plays = [];

  class MockAudio {
    constructor(src) {
      this.src = src;
      this.loop = false;
      this.playbackRate = 1.0;
      this.currentTime = 0;
    }
    play() {
      plays.push(Date.now());
      return Promise.resolve();
    }
    pause() {
      pauses.push(Date.now());
    }
  }

  globalThis.Audio = MockAudio;
  resetVictoryAudioState();

  // First submission success
  const played1 = playVictoryCrowdCheer({ durationMs: 2000 });
  assert.equal(played1, true);
  assert.equal(plays.length, 1);
  assert.equal(pauses.length, 0);

  // Second submission success (e.g. user submits again)
  const played2 = playVictoryCrowdCheer({ durationMs: 2000 });
  assert.equal(played2, true);
  assert.equal(plays.length, 2);
  assert.equal(pauses.length, 1, 'Previous audio instance must be paused before starting new one');

  stopVictoryCrowdCheer();
  assert.equal(pauses.length, 2);

  delete globalThis.Audio;
  delete globalThis.window;
  delete globalThis.localStorage;
});

