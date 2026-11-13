import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Plus,
  Copy,
  Check,
  Terminal,
  Clock,
  Loader2,
  Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TestCasesPanel({
  testCases = [],
  runResults = null,
  submitResult = null,
  aiFeedback = null,
  enemy = null,
  playerHP = 100,
  setPlayerHP = () => {},
  selectedLang = 'javascript',
  isRunning = false,
  isSubmitting = false,
  panelOpen = true,
  setPanelOpen = () => {},
  showAddCase = false,
  setShowAddCase = () => {},
  customInput = '',
  setCustomInput = () => {},
  customExpected = '',
  setCustomExpected = () => {},
  addCustomCase = () => {},
  panelRef = null,
}) {
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const [copiedKey, setCopiedKey] = useState(null);

  // Active results list (from run or submit)
  const currentResults = runResults || submitResult?.results || null;
  const compileError = runResults?.compileError || submitResult?.compileError || null;
  const runtimeError = runResults?.runtimeError || submitResult?.runtimeError || null;
  const serviceError = runResults?.serviceError || submitResult?.serviceError || null;

  // Derive execution stats
  const totalCount = testCases.length;
  const resultsAvailable = Array.isArray(currentResults) && currentResults.length > 0;
  const passedCount = resultsAvailable ? currentResults.filter(r => r.passed).length : 0;
  const allPassed = resultsAvailable && passedCount === currentResults.length && !compileError && !runtimeError && !serviceError;
  const hasFailed = resultsAvailable && (!allPassed || compileError || runtimeError || serviceError);

  // Auto-select first failing test case on failed run or submit
  useEffect(() => {
    if (resultsAvailable) {
      const firstFailIndex = currentResults.findIndex(r => !r.passed);
      if (firstFailIndex !== -1) {
        setSelectedCaseIndex(firstFailIndex);
      } else {
        setSelectedCaseIndex(0);
      }
    }
  }, [runResults, submitResult]); // eslint-disable-line

  // Copy helper
  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(typeof text === 'string' ? text : JSON.stringify(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Safe selected test case
  const safeIndex = Math.min(Math.max(0, selectedCaseIndex), Math.max(0, testCases.length - 1));
  const activeTestCase = testCases[safeIndex] || { input: '', expected: '' };
  const activeResult = currentResults ? currentResults[safeIndex] : null;

  // Language display tag
  const langLabel = selectedLang === 'cpp' ? 'C++17' : selectedLang === 'c' ? 'C11' : 'JS';

  return (
    <div className={`testcase-panel ${panelOpen ? 'open' : 'closed'}`} ref={panelRef}>
      {/* ── 1. Panel Header ── */}
      <div className="testcase-panel-header" onClick={() => setPanelOpen(v => !v)}>
        <div className="testcase-header-left">
          <div className="testcase-title-badge">
            <Terminal size={15} />
            <span>TEST CASES</span>
          </div>

          {/* Test Counter */}
          {resultsAvailable ? (
            <span className={`tc-counter-pill ${allPassed ? 'pass' : 'fail'}`}>
              {passedCount} / {totalCount} Passed
            </span>
          ) : (
            <span className="tc-counter-pill neutral">
              {totalCount} Cases
            </span>
          )}

          {/* Status Badge */}
          {isRunning || isSubmitting ? (
            <span className="tc-status-pill running">
              <Loader2 size={13} className="spin-icon" />
              <span>RUNNING...</span>
            </span>
          ) : serviceError ? (
            <span className="tc-status-pill error" title={serviceError}>
              <AlertTriangle size={13} />
              <span>COMPILER UNAVAILABLE</span>
            </span>
          ) : compileError ? (
            <span className="tc-status-pill error">
              <AlertTriangle size={13} />
              <span>COMPILE ERROR</span>
            </span>
          ) : runtimeError ? (
            <span className="tc-status-pill error">
              <AlertCircle size={13} />
              <span>{runtimeError.includes('Time Limit') ? 'TIME LIMIT EXCEEDED' : 'RUNTIME ERROR'}</span>
            </span>
          ) : resultsAvailable && allPassed ? (
            <span className="tc-status-pill pass">
              <CheckCircle2 size={13} />
              <span>PASSED</span>
            </span>
          ) : resultsAvailable && hasFailed ? (
            <span className="tc-status-pill fail">
              <XCircle size={13} />
              <span>FAILED</span>
            </span>
          ) : (
            <span className="tc-status-pill neutral">
              <span>NOT RUN</span>
            </span>
          )}
        </div>

        <div className="testcase-header-right">
          <span className="tc-lang-tag">{langLabel}</span>
          <button className="tc-collapse-btn" aria-label="Toggle Test Cases Panel">
            {panelOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {/* ── 2. Panel Body ── */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            className="testcase-panel-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Submit banner */}
            {submitResult && (
              <div className={`submit-banner ${submitResult.allPassed ? 'pass' : 'fail'} animate-scaleIn`}>
                {submitResult.allPassed ? (
                  <>
                    <CheckCircle2 size={20} color="#16A34A" />
                    <div>
                      <div className="submit-banner-title">VICTORY — CHALLENGE COMPLETE</div>
                      <div className="submit-banner-sub">
                        {aiFeedback?.feedback || (enemy?.name ? `Enemy ${enemy.name} defeated!` : 'All test cases passed cleanly!')}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle size={20} color="#DC2626" />
                    <div>
                      <div className="submit-banner-title">MISSION FAILED</div>
                      <div className="submit-banner-sub">
                        {compileError
                          ? 'Compilation failed. Inspect the compiler diagnostics below.'
                          : (aiFeedback?.feedback || 'One or more test cases failed. Review the diff below and try again.')
                        }
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* AI Mentorship Feedback (when available) */}
            {aiFeedback && aiFeedback.details && (
              <div className="ai-feedback-box animate-fadeIn">
                <div className="ai-feedback-header">
                  <Shield size={16} />
                  <span>System Diagnostics & Complexity</span>
                  <div className="complexity-badges">
                    <span className="badge-outline">Time: {aiFeedback.complexity?.time || 'O(?)'}</span>
                    <span className="badge-outline">Space: {aiFeedback.complexity?.space || 'O(?)'}</span>
                  </div>
                </div>
                <p className="ai-details">{aiFeedback.details}</p>
                {aiFeedback.hints?.length > 0 && (
                  <div className="ai-suggestions">
                    <span className="suggestion-label">Hints & Recommendations</span>
                    <ul>
                      {aiFeedback.hints.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Player HP zero alert */}
            {playerHP <= 0 && (
              <div className="submit-banner fail animate-scaleIn" style={{ borderColor: 'var(--hard)' }}>
                <AlertCircle size={18} color="var(--hard)" />
                <div>
                  <div className="submit-banner-title" style={{ color: 'var(--hard)' }}>Defeated in Battle</div>
                  <div className="submit-banner-sub">
                    HP reached zero.{' '}
                    <button
                      className="btn-link"
                      onClick={(e) => { e.preventDefault(); setPlayerHP(100); }}
                    >
                      Revive & Retry
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── 3. Dedicated Compiler / Runtime / Service Error Output Panel ── */}
            {(serviceError || compileError || runtimeError) && (
              <div className="compiler-error-box animate-fadeIn">
                <div className="compiler-error-header">
                  <div className="error-title-wrap">
                    <AlertTriangle size={16} className="error-icon" />
                    <span className="compiler-error-title">
                      {serviceError
                        ? 'COMPILER SERVICE UNAVAILABLE'
                        : compileError
                        ? `COMPILATION ERROR (${selectedLang === 'cpp' ? 'g++' : selectedLang === 'c' ? 'gcc' : 'SyntaxError'})`
                        : (runtimeError?.includes('Time Limit') ? 'TIME LIMIT EXCEEDED (3000ms)' : 'RUNTIME ERROR')
                      }
                    </span>
                  </div>
                  <button
                    className="btn-copy-error"
                    onClick={() => handleCopy(serviceError || compileError || runtimeError, 'compErr')}
                    title="Copy full error output"
                  >
                    {copiedKey === 'compErr' ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedKey === 'compErr' ? 'COPIED' : 'COPY LOG'}</span>
                  </button>
                </div>
                <pre className="compiler-error-terminal">
                  <code>{serviceError || compileError || runtimeError}</code>
                </pre>
              </div>
            )}

            {/* ── 4. Test Case Navigation Tabs ── */}
            <div className="tc-tabs-bar">
              <div className="tc-tabs-list">
                {testCases.map((tc, idx) => {
                  const res = currentResults ? currentResults[idx] : null;
                  const isPassed = res?.passed === true;
                  const isServiceError = res?.status === 'service_error' || Boolean(serviceError);
                  const isFailed = res && !res.passed && !isServiceError;
                  const isSelected = idx === safeIndex;

                  return (
                    <button
                      key={idx}
                      className={`tc-tab-btn ${isSelected ? 'active' : ''} ${isPassed ? 'status-pass' : isServiceError ? 'status-warning' : isFailed ? 'status-fail' : 'status-neutral'}`}
                      onClick={() => setSelectedCaseIndex(idx)}
                    >
                      <span className="tc-tab-indicator">
                        {isPassed ? (
                          <CheckCircle2 size={13} className="tab-icon pass" />
                        ) : isServiceError ? (
                          <AlertTriangle size={13} className="tab-icon warning" color="#D97706" />
                        ) : isFailed ? (
                          <XCircle size={13} className="tab-icon fail" />
                        ) : (
                          <span className="tab-dot neutral" />
                        )}
                      </span>
                      <span className="tc-tab-text">Case {idx + 1}</span>
                      {res?.duration && res.duration !== '0.0' && (
                        <span className="tc-tab-time">{res.duration}ms</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                className="btn-brutalist btn-add-case"
                onClick={() => setShowAddCase(v => !v)}
                title="Add a custom test case"
              >
                <Plus size={13} />
                <span>CUSTOM CASE</span>
              </button>
            </div>

            {/* Custom Case Form */}
            {showAddCase && (
              <div className="add-case-form animate-fadeIn">
                <div className="add-case-row">
                  <div className="add-field">
                    <label>Custom Input</label>
                    <input
                      className="input"
                      placeholder="e.g. [1, 2, 3, 4] or racecar"
                      value={customInput}
                      onChange={e => setCustomInput(e.target.value)}
                    />
                  </div>
                  <div className="add-field">
                    <label>Expected Output</label>
                    <input
                      className="input"
                      placeholder="e.g. 4 or true"
                      value={customExpected}
                      onChange={e => setCustomExpected(e.target.value)}
                    />
                  </div>
                </div>
                <div className="add-case-actions">
                  <button className="btn-brutalist primary" onClick={addCustomCase}>ADD CASE</button>
                  <button className="btn-brutalist" onClick={() => setShowAddCase(false)}>CANCEL</button>
                </div>
              </div>
            )}

            {/* ── 5. Selected Test Case Detail Cards ── */}
            <div className="tc-detail-card">
              <div className="tc-detail-header">
                <div className="tc-detail-title-group">
                  <span className="tc-detail-casename">TEST CASE {safeIndex + 1}</span>
                  {activeResult ? (
                    <span className={`tc-detail-badge ${activeResult.passed ? 'pass' : (activeResult.status === 'service_error' || serviceError) ? 'warning' : 'fail'}`}>
                      {activeResult.passed
                        ? 'PASSED'
                        : (activeResult.status === 'service_error' || serviceError)
                        ? 'COMPILER UNAVAILABLE'
                        : activeResult.error
                        ? 'FAILED (ERROR)'
                        : 'FAILED (WRONG ANSWER)'}
                    </span>
                  ) : (
                    <span className="tc-detail-badge neutral">NOT RUN</span>
                  )}
                </div>

                {activeResult?.duration && (
                  <div className="tc-detail-meta">
                    <Clock size={13} />
                    <span>{activeResult.duration}ms execution time</span>
                  </div>
                )}
              </div>

              {/* Three-Column Input, Expected, Actual Output Layout */}
              <div className="tc-detail-grid">
                {/* Input Card */}
                <div className="tc-card">
                  <div className="tc-card-header">
                    <span className="tc-card-label">INPUT</span>
                    <button
                      className="btn-copy-card"
                      onClick={() => handleCopy(activeTestCase.input, `in-${safeIndex}`)}
                      title="Copy Input"
                    >
                      {copiedKey === `in-${safeIndex}` ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                  <pre className="tc-code-block input-block">
                    <code>
                      {typeof activeTestCase.input === 'string'
                        ? activeTestCase.input
                        : JSON.stringify(activeTestCase.input, null, 2)}
                    </code>
                  </pre>
                </div>

                {/* Expected Output Card */}
                <div className="tc-card">
                  <div className="tc-card-header">
                    <span className="tc-card-label">EXPECTED OUTPUT</span>
                    <button
                      className="btn-copy-card"
                      onClick={() => handleCopy(activeTestCase.expected, `exp-${safeIndex}`)}
                      title="Copy Expected Output"
                    >
                      {copiedKey === `exp-${safeIndex}` ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                  <pre className="tc-code-block expected-block">
                    <code>
                      {typeof activeTestCase.expected === 'string'
                        ? activeTestCase.expected
                        : JSON.stringify(activeTestCase.expected, null, 2)}
                    </code>
                  </pre>
                </div>

                {/* Actual Output Card */}
                <div className={`tc-card actual-card ${activeResult ? (activeResult.passed ? 'pass' : 'fail') : 'unrun'}`}>
                  <div className="tc-card-header">
                    <span className="tc-card-label">ACTUAL OUTPUT</span>
                    {activeResult && activeResult.actual && (
                      <button
                        className="btn-copy-card"
                        onClick={() => handleCopy(activeResult.actual, `act-${safeIndex}`)}
                        title="Copy Actual Output"
                      >
                        {copiedKey === `act-${safeIndex}` ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>
                  <pre className={`tc-code-block actual-block ${activeResult ? (activeResult.passed ? 'correct' : 'wrong') : 'unrun'}`}>
                    <code>
                      {activeResult
                        ? (activeResult.actual ?? activeResult.error ?? 'No Output')
                        : '(Click "Run" to execute code against this test case)'}
                    </code>
                  </pre>
                </div>
              </div>

              {/* Fail Diff Callout (when actual != expected and code was actually evaluated) */}
              {activeResult && !activeResult.passed && !compileError && !serviceError && activeResult.status !== 'service_error' && (
                <div className="tc-diff-banner">
                  <AlertCircle size={15} className="diff-icon" />
                  <span>
                    <strong>Output Mismatch:</strong> Expected <code>{String(activeTestCase.expected)}</code> but your solution returned <code>{String(activeResult.actual)}</code>.
                  </span>
                </div>
              )}

              {/* Service Error Notice (when code was blocked before execution) */}
              {(serviceError || activeResult?.status === 'service_error') && (
                <div className="tc-diff-banner warning" style={{ background: '#FEF3C7', borderColor: '#F59E0B' }}>
                  <AlertTriangle size={15} className="diff-icon" color="#D97706" />
                  <span>
                    <strong>Execution Not Completed:</strong> The remote compiler service could not process this code ({activeResult?.error || serviceError}). Your logic was not evaluated.
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

