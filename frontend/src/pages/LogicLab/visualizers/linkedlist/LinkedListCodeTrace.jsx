import { useEffect, useMemo, useState } from 'react';
import PointerNodeDiagram from '../../../../components/Visualizer/PointerNodeDiagram';
import { createLinkedList, traceFastSlow } from '../../../../utils/linkedListModel';
import './LinkedListStyles.css';

const SAMPLE_LISTS = [
  { id: 'odd3', label: 'Test 1: [1, 2, 3] → 2', values: [1, 2, 3] },
  { id: 'even4', label: 'Test 2: [1, 2, 3, 4] → 3', values: [1, 2, 3, 4] },
  { id: 'odd5', label: 'Sample: [10, 20, 30, 40, 50] → 30', values: [10, 20, 30, 40, 50] },
];

export default function LinkedListCodeTrace({ runPulse = 0 }) {
  const [sampleId, setSampleId] = useState('even4');
  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const sample = SAMPLE_LISTS.find((s) => s.id === sampleId) || SAMPLE_LISTS[1];

  const trace = useMemo(
    () => traceFastSlow(createLinkedList(sample.values, true)),
    [sample.values]
  );

  // Trigger replay cleanly when user clicks Run Code / Submit Solution
  useEffect(() => {
    if (runPulse > 0) {
      const raf = requestAnimationFrame(() => {
        setStepIdx(0);
        setIsPlaying(true);
      });
      return () => cancelAnimationFrame(raf);
    }
    return undefined;
  }, [runPulse]);

  useEffect(() => {
    if (!isPlaying) return undefined;
    if (stepIdx >= trace.steps.length - 1) return undefined;

    const timer = setTimeout(() => {
      setStepIdx((prev) => {
        const next = prev + 1;
        if (next >= trace.steps.length - 1) {
          setIsPlaying(false);
        }
        return Math.min(next, trace.steps.length - 1);
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [isPlaying, stepIdx, trace.steps.length]);

  const safeIdx = Math.min(stepIdx, Math.max(0, trace.steps.length - 1));
  const currentStep = trace.steps[safeIdx];
  const isDone = safeIdx >= trace.steps.length - 1;

  return (
    <div className="ll-trace-card" style={{ marginTop: '1rem' }}>
      <div className="ll-trace-head">
        <div className="ll-trace-title">
          <span>FAST (2X) & SLOW (1X) POINTER EXECUTION TRACE</span>
          <span className="ll-complexity-badge">O(n) time · O(1) space</span>
        </div>
        <div className="ll-toolbar-row">
          {SAMPLE_LISTS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`ll-preset-chip ${sampleId === s.id ? 'll-btn-accent' : ''}`}
              onClick={() => {
                setIsPlaying(false);
                setSampleId(s.id);
                setStepIdx(0);
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <PointerNodeDiagram
        model={currentStep.model}
        label={`DRY RUN · STEP ${safeIdx + 1}/${trace.steps.length}`}
        pointers={currentStep.pointers}
        highlightedNodeId={currentStep.highlightedNodeId}
        highlightedField={currentStep.highlightedField}
        foundNodeId={currentStep.foundNodeId}
        showInspector={false}
        compact
        memoryNote={null}
      />

      <div className="ll-trace-head">
        <div style={{ fontSize: '0.84rem', color: '#1c1917' }}>
          <strong>{currentStep.title}:</strong> {currentStep.description}
        </div>
        <div className="ll-toolbar-row">
          <button
            type="button"
            className="ll-btn"
            disabled={safeIdx === 0}
            onClick={() => {
              setIsPlaying(false);
              setStepIdx((p) => Math.max(0, p - 1));
            }}
          >
            ◀ Prev
          </button>
          <button
            type="button"
            className="ll-btn ll-btn-primary"
            onClick={() => {
              if (isDone) {
                setStepIdx(0);
                setIsPlaying(true);
              } else {
                setIsPlaying((p) => !p);
              }
            }}
          >
            {isPlaying ? '⏸ Pause' : isDone ? '↻ Replay' : '▶ Animate Pointers'}
          </button>
          <button
            type="button"
            className="ll-btn"
            disabled={isDone}
            onClick={() => {
              setIsPlaying(false);
              setStepIdx((p) => Math.min(trace.steps.length - 1, p + 1));
            }}
          >
            Next ▶
          </button>
        </div>
      </div>

      {currentStep.codeLine && <div className="ll-trace-code">{currentStep.codeLine}</div>}
    </div>
  );
}

