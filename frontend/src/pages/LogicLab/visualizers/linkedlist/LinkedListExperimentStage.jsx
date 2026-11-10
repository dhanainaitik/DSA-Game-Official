import { useEffect, useMemo, useState } from 'react';
import PointerNodeDiagram from '../../../../components/Visualizer/PointerNodeDiagram';
import {
  createLinkedList,
  deriveChain,
  traceDeleteTail,
  traceFastSlow,
  traceInsertAt,
  tracePrepend,
  traceReverse,
  traceSearch,
} from '../../../../utils/linkedListModel';
import './LinkedListStyles.css';

const SCENARIOS = [
  { id: 'reverse', label: 'Reverse List (3 Pointers)', complexity: 'O(n) time · O(1) space' },
  { id: 'fastSlow', label: 'Fast & Slow (Middle)', complexity: 'O(n) time · O(1) space' },
  { id: 'insertAt', label: 'Insert at Position', complexity: 'O(n)' },
  { id: 'deleteTail', label: 'Delete Tail', complexity: 'O(n) in SLL' },
  { id: 'prepend', label: 'Prepend Node', complexity: 'O(1)' },
  { id: 'search', label: 'Search Value', complexity: 'O(n)' },
];

const LIST_PRESETS = [
  { id: 'default', label: '5 Nodes [10,25,37,52,68]', values: [10, 25, 37, 52, 68] },
  { id: 'even', label: 'Even [1,2,3,4]', values: [1, 2, 3, 4] },
  { id: 'single', label: 'Single [42]', values: [42] },
  { id: 'empty', label: 'Empty []', values: [] },
];

function buildSimulation(scenarioId, values, paramVal, paramPos) {
  const initialModel = createLinkedList(values, true);
  const initialOrderIds = deriveChain(initialModel).map((n) => n.id);
  const initialSummary =
    values.length > 0 ? values.join(' → ') + ' → NULL' : 'NULL (Empty)';

  let result;
  switch (scenarioId) {
    case 'reverse':
      result = traceReverse(initialModel);
      break;
    case 'fastSlow':
      result = traceFastSlow(initialModel);
      break;
    case 'insertAt':
      result = traceInsertAt(initialModel, paramVal, paramPos);
      break;
    case 'deleteTail':
      result = traceDeleteTail(initialModel);
      break;
    case 'prepend':
      result = tracePrepend(initialModel, paramVal);
      break;
    case 'search':
      result = traceSearch(initialModel, paramVal);
      break;
    default:
      result = traceReverse(initialModel);
  }

  const finalChain = deriveChain(result.model);
  const finalSummary =
    finalChain.length > 0
      ? finalChain.map((n) => n.data).join(' → ') + ' → NULL'
      : 'NULL (Empty)';

  return {
    initialOrderIds,
    initialSummary,
    finalSummary,
    steps: result.steps,
    error: result.error || null,
  };
}

export default function LinkedListExperimentStage() {
  const [scenarioId, setScenarioId] = useState('reverse');
  const [presetId, setPresetId] = useState('default');
  const [paramVal, setParamVal] = useState('37');
  const [paramPos, setParamPos] = useState('2');
  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(900);
  const [alignReversedFinal, setAlignReversedFinal] = useState(false);

  const activePreset = LIST_PRESETS.find((p) => p.id === presetId) || LIST_PRESETS[0];

  const simulation = useMemo(() => {
    const parsedNum = Number(paramVal);
    const val = paramVal.trim() === '' ? 99 : Number.isNaN(parsedNum) ? paramVal : parsedNum;
    const pos = Number.isNaN(Number(paramPos)) ? 0 : Number(paramPos);
    return buildSimulation(scenarioId, activePreset.values, val, pos);
  }, [scenarioId, activePreset.values, paramVal, paramPos]);

  const safeStepIdx = Math.min(stepIdx, Math.max(0, simulation.steps.length - 1));
  const currentStep = simulation.steps[safeStepIdx];
  const scenarioMeta = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];

  useEffect(() => {
    if (!isPlaying) return undefined;
    if (safeStepIdx >= simulation.steps.length - 1) return undefined;

    const timer = setTimeout(() => {
      setStepIdx((prev) => {
        const next = prev + 1;
        if (next >= simulation.steps.length - 1) {
          setIsPlaying(false);
        }
        return Math.min(next, simulation.steps.length - 1);
      });
    }, speedMs);

    return () => clearTimeout(timer);
  }, [isPlaying, safeStepIdx, simulation.steps.length, speedMs]);

  const selectScenario = (id) => {
    setIsPlaying(false);
    setScenarioId(id);
    setStepIdx(0);
    setAlignReversedFinal(false);
    if (id === 'insertAt' || id === 'prepend') {
      setParamVal('99');
    } else if (id === 'search') {
      setParamVal('37');
    }
  };

  const selectPreset = (id) => {
    setIsPlaying(false);
    setPresetId(id);
    setStepIdx(0);
    setAlignReversedFinal(false);
  };

  const isLastStep = safeStepIdx >= simulation.steps.length - 1;
  const keepStableOrder =
    scenarioId === 'reverse'
      ? !(isLastStep && alignReversedFinal)
      : !isLastStep && ['insertAt', 'deleteTail', 'prepend', 'search', 'fastSlow'].includes(scenarioId);

  return (
    <div className="ll-stage-wrap">
      <div className="ll-toolbar">
        <div className="ll-toolbar-row">
          <span className="ll-section-kicker" style={{ marginBottom: 0 }}>
            CHOOSE SIMULATION:
          </span>
          <div className="ll-scenario-tabs">
            {SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                type="button"
                className={`ll-scenario-btn ${scenarioId === sc.id ? 'active' : ''}`}
                onClick={() => selectScenario(sc.id)}
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ll-toolbar-row">
          <span className="ll-section-kicker" style={{ marginBottom: 0 }}>
            INPUT LIST:
          </span>
          {LIST_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`ll-preset-chip ${presetId === p.id ? 'll-btn-accent' : ''}`}
              onClick={() => selectPreset(p.id)}
            >
              {p.label}
            </button>
          ))}

          {['insertAt', 'prepend', 'search'].includes(scenarioId) && (
            <div className="ll-input-group">
              <label htmlFor="ll-exp-val" className="ll-input-label">
                {scenarioId === 'search' ? 'Target' : 'Value'}
              </label>
              <input
                id="ll-exp-val"
                className="ll-input"
                value={paramVal}
                onChange={(e) => {
                  setIsPlaying(false);
                  setParamVal(e.target.value);
                  setStepIdx(0);
                }}
              />
            </div>
          )}

          {scenarioId === 'insertAt' && (
            <div className="ll-input-group">
              <label htmlFor="ll-exp-pos" className="ll-input-label">
                Pos
              </label>
              <input
                id="ll-exp-pos"
                type="number"
                min="0"
                className="ll-input"
                value={paramPos}
                onChange={(e) => {
                  setIsPlaying(false);
                  setParamPos(e.target.value);
                  setStepIdx(0);
                }}
              />
            </div>
          )}
        </div>
      </div>

      <PointerNodeDiagram
        model={currentStep.model}
        label={`${scenarioMeta.label.toUpperCase()} · STEP ${safeStepIdx + 1} OF ${simulation.steps.length}`}
        pointers={currentStep.pointers}
        highlightedNodeId={currentStep.highlightedNodeId}
        highlightedField={currentStep.highlightedField}
        highlightedArrowFromId={currentStep.highlightedArrowFromId}
        foundNodeId={currentStep.foundNodeId}
        detachedNodeIds={currentStep.detachedNodeIds}
        secondaryHeadId={currentStep.secondaryHeadId}
        stableOrderIds={keepStableOrder ? simulation.initialOrderIds : null}
        newNodePlacement={scenarioId === 'prepend' ? 'start' : 'auto'}
        isReversedHighlight={currentStep.isReversedHighlight}
        showInspector={false}
        memoryNote={null}
      />

      {simulation.error && <div className="ll-error-banner">{simulation.error}</div>}

      <div className="ll-trace-card">
        <div className="ll-trace-head">
          <div className="ll-trace-title">
            <span>{currentStep.title}</span>
            <span className="ll-complexity-badge">{scenarioMeta.complexity}</span>
          </div>

          <div className="ll-toolbar-row">
            <button
              type="button"
              className="ll-btn"
              onClick={() => {
                setIsPlaying(false);
                setStepIdx(0);
                setAlignReversedFinal(false);
              }}
            >
              ⏮ Reset
            </button>
            <button
              type="button"
              className="ll-btn"
              disabled={safeStepIdx === 0}
              onClick={() => {
                setIsPlaying(false);
                setStepIdx((p) => Math.max(0, p - 1));
              }}
            >
              ◀ Previous Step
            </button>
            <button
              type="button"
              className="ll-btn ll-btn-primary"
              disabled={simulation.steps.length <= 1}
              onClick={() => {
                if (isLastStep) {
                  setStepIdx(0);
                  setAlignReversedFinal(false);
                  setIsPlaying(true);
                } else {
                  setIsPlaying((p) => !p);
                }
              }}
            >
              {isPlaying ? '⏸ Pause' : isLastStep ? '↻ Replay' : '▶ Play'}
            </button>
            <button
              type="button"
              className="ll-btn"
              disabled={isLastStep}
              onClick={() => {
                setIsPlaying(false);
                setStepIdx((p) => Math.min(simulation.steps.length - 1, p + 1));
              }}
            >
              Next Step ▶
            </button>
            <select
              aria-label="Playback Speed"
              className="ll-select"
              value={speedMs}
              onChange={(e) => setSpeedMs(Number(e.target.value))}
            >
              <option value={1400}>0.7x Speed</option>
              <option value={900}>1.0x Speed</option>
              <option value={450}>2.0x Speed</option>
            </select>
          </div>
        </div>

        <p className="ll-trace-desc">{currentStep.description}</p>
        {currentStep.codeLine && <div className="ll-trace-code">{currentStep.codeLine}</div>}

        {scenarioId === 'reverse' && isLastStep && simulation.steps.length > 1 && (
          <div className="ll-toolbar-row">
            <button
              type="button"
              className="ll-btn ll-btn-accent"
              onClick={() => setAlignReversedFinal((p) => !p)}
            >
              {alignReversedFinal
                ? 'View Flipped Pointers In-Place'
                : 'Re-Align Reversed Nodes Left → Right'}
            </button>
          </div>
        )}

        <div className="ll-step-dots" aria-label="Simulation steps">
          {simulation.steps.map((s, idx) => (
            <button
              key={`${s.title}-${idx}`}
              type="button"
              className={`ll-step-dot ${idx === safeStepIdx ? 'active' : idx < safeStepIdx ? 'done' : ''}`}
              onClick={() => {
                setIsPlaying(false);
                setStepIdx(idx);
              }}
              title={s.title}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <div className="ll-summary-compare">
          <div className="ll-summary-box">
            <strong>INITIAL LIST STATE</strong>
            <span>{simulation.initialSummary}</span>
          </div>
          <div className="ll-summary-box">
            <strong>FINAL LIST STATE</strong>
            <span>{simulation.finalSummary}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

