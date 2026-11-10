import { useEffect, useState } from 'react';
import PointerNodeDiagram from '../../../../components/Visualizer/PointerNodeDiagram';
import {
  createLinkedList,
  deriveChain,
  traceAppend,
  traceDeleteAt,
  traceDeleteHead,
  traceDeleteTail,
  traceInsertAt,
  tracePrepend,
  traceSearch,
  traceTraverse,
} from '../../../../utils/linkedListModel';
import './LinkedListStyles.css';

const DEFAULT_VALUES = [10, 25, 37, 52, 68];

const COMPLEXITY_MAP = {
  prepend: 'O(1)',
  append: 'O(1) w/ tail',
  insertAt: 'O(n)',
  deleteHead: 'O(1)',
  deleteTail: 'O(n) in SLL',
  deleteAt: 'O(n)',
  search: 'O(n)',
  traverse: 'O(n)',
};

export default function LinkedListTouchStage() {
  const [baseModel, setBaseModel] = useState(() => createLinkedList(DEFAULT_VALUES, true));
  const [valueInput, setValueInput] = useState('99');
  const [posInput, setPosInput] = useState('2');

  const [traceState, setTraceState] = useState(null);
  // traceState = { opType, steps, finalModel, stepIdx, isPlaying, stableOrderIds, placement, error }

  const [selectedTarget, setSelectedTarget] = useState(null);
  const [historyLog, setHistoryLog] = useState([
    'Initialized 5-node list [10, 25, 37, 52, 68]. Trigger any operation below to watch pointers update step-by-step.',
  ]);

  // Playback timer
  useEffect(() => {
    if (!traceState?.isPlaying) return undefined;
    if (traceState.stepIdx >= traceState.steps.length - 1) return undefined;

    const timer = setTimeout(() => {
      setTraceState((prev) => {
        if (!prev || !prev.isPlaying) return prev;
        const nextIdx = prev.stepIdx + 1;
        const finished = nextIdx >= prev.steps.length - 1;
        return {
          ...prev,
          stepIdx: nextIdx,
          isPlaying: !finished,
        };
      });
    }, 850);

    return () => clearTimeout(timer);
  }, [traceState]);

  const commitActiveTraceIfPending = () => {
    if (traceState?.finalModel) {
      setBaseModel(traceState.finalModel);
      return traceState.finalModel;
    }
    return baseModel;
  };

  const launchTrace = (opType, result, logSummary, options = {}) => {
    if (result.error) {
      setTraceState({
        opType,
        steps: result.steps,
        finalModel: baseModel,
        stepIdx: 0,
        isPlaying: false,
        stableOrderIds: null,
        placement: 'auto',
        error: result.error,
      });
      setHistoryLog((prev) => [`⚠ ${result.error}`, ...prev.slice(0, 6)]);
      return;
    }

    // Apply result cleanly as committed model for subsequent ops while animating current trace
    setBaseModel(result.model);
    setTraceState({
      opType,
      steps: result.steps,
      finalModel: result.model,
      stepIdx: 0,
      isPlaying: result.steps.length > 1,
      stableOrderIds: options.stableOrderIds || null,
      placement: options.placement || 'auto',
      error: null,
    });
    setHistoryLog((prev) => [logSummary, ...prev.slice(0, 6)]);
  };

  const parseValueOrDefault = () => {
    const trimmed = String(valueInput).trim();
    if (!trimmed) return Math.floor(Math.random() * 90) + 10;
    const num = Number(trimmed);
    return Number.isNaN(num) ? trimmed : num;
  };

  const handleOp = (opType) => {
    const current = commitActiveTraceIfPending();
    const initialIds = deriveChain(current).map((n) => n.id);
    const val = parseValueOrDefault();
    const pos = Number(posInput);

    switch (opType) {
      case 'prepend': {
        const res = tracePrepend(current, val);
        launchTrace('prepend', res, `Prepend(${val}) — new HEAD assigned in O(1)`, {
          stableOrderIds: initialIds,
          placement: 'start',
        });
        break;
      }
      case 'append': {
        const res = traceAppend(current, val);
        launchTrace('append', res, `Append(${val}) — wired tail.next in O(1)`, {
          stableOrderIds: initialIds,
          placement: 'end',
        });
        break;
      }
      case 'insertAt': {
        const res = traceInsertAt(current, val, pos);
        launchTrace('insertAt', res, `InsertAt(val=${val}, pos=${pos}) — traversed & relinked`, {
          stableOrderIds: initialIds,
          placement: pos === 0 ? 'start' : 'auto',
        });
        break;
      }
      case 'deleteHead': {
        const res = traceDeleteHead(current);
        launchTrace('deleteHead', res, `DeleteHead() — moved HEAD forward in O(1)`, {
          stableOrderIds: initialIds,
        });
        break;
      }
      case 'deleteTail': {
        const res = traceDeleteTail(current);
        launchTrace('deleteTail', res, `DeleteTail() — traversed from HEAD to second-last node O(n)`, {
          stableOrderIds: initialIds,
        });
        break;
      }
      case 'deleteAt': {
        const res = traceDeleteAt(current, pos);
        launchTrace('deleteAt', res, `DeleteAt(pos=${pos}) — skipped removed node`, {
          stableOrderIds: initialIds,
        });
        break;
      }
      case 'search': {
        const res = traceSearch(current, val);
        launchTrace(
          'search',
          res,
          res.foundIndex >= 0
            ? `Search(${val}) — found at index ${res.foundIndex}`
            : `Search(${val}) — not found (reached NULL)`,
          { stableOrderIds: initialIds }
        );
        break;
      }
      case 'traverse': {
        const res = traceTraverse(current);
        launchTrace('traverse', res, `Traverse() — visited ${deriveChain(current).length} nodes from HEAD to NULL`, {
          stableOrderIds: initialIds,
        });
        break;
      }
      default:
        break;
    }
  };

  const applyPreset = (values, presetName) => {
    const fresh = createLinkedList(values, true);
    setBaseModel(fresh);
    setTraceState(null);
    setSelectedTarget(null);
    setHistoryLog((prev) => [`Loaded preset: ${presetName}`, ...prev.slice(0, 6)]);
  };

  const activeStep = traceState ? traceState.steps[traceState.stepIdx] : null;
  const displayedModel = activeStep ? activeStep.model : baseModel;

  return (
    <div className="ll-stage-wrap">
      <PointerNodeDiagram
        model={displayedModel}
        label={
          traceState
            ? `${traceState.opType.toUpperCase()} · STEP ${traceState.stepIdx + 1}/${traceState.steps.length}`
            : 'INTERACTIVE SANDBOX · HEAD → TAIL'
        }
        pointers={activeStep?.pointers || {}}
        highlightedNodeId={activeStep?.highlightedNodeId || null}
        highlightedField={activeStep?.highlightedField || null}
        highlightedArrowFromId={activeStep?.highlightedArrowFromId || null}
        foundNodeId={activeStep?.foundNodeId || null}
        detachedNodeIds={activeStep?.detachedNodeIds || []}
        secondaryHeadId={activeStep?.secondaryHeadId || null}
        stableOrderIds={
          traceState && traceState.stepIdx < traceState.steps.length - 1
            ? traceState.stableOrderIds
            : null
        }
        newNodePlacement={traceState?.placement || 'auto'}
        selectedTarget={selectedTarget}
        onSelectTarget={setSelectedTarget}
        showInspector
        memoryNote={null}
      />

      {traceState?.error && <div className="ll-error-banner">{traceState.error}</div>}

      {activeStep && (
        <div className="ll-trace-card">
          <div className="ll-trace-head">
            <div className="ll-trace-title">
              <span>{activeStep.title}</span>
              <span className="ll-complexity-badge">
                {COMPLEXITY_MAP[traceState.opType] || 'O(n)'}
              </span>
            </div>
            <div className="ll-toolbar-row">
              <button
                type="button"
                className="ll-btn"
                disabled={traceState.stepIdx === 0}
                onClick={() =>
                  setTraceState((p) => (p ? { ...p, isPlaying: false, stepIdx: Math.max(0, p.stepIdx - 1) } : p))
                }
              >
                ◀ Prev
              </button>
              <button
                type="button"
                className="ll-btn ll-btn-accent"
                onClick={() =>
                  setTraceState((p) => (p ? { ...p, isPlaying: !p.isPlaying } : p))
                }
                disabled={traceState.stepIdx >= traceState.steps.length - 1}
              >
                {traceState.isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <button
                type="button"
                className="ll-btn"
                disabled={traceState.stepIdx >= traceState.steps.length - 1}
                onClick={() =>
                  setTraceState((p) =>
                    p ? { ...p, isPlaying: false, stepIdx: Math.min(p.steps.length - 1, p.stepIdx + 1) } : p
                  )
                }
              >
                Next ▶
              </button>
              <button
                type="button"
                className="ll-btn"
                disabled={traceState.stepIdx >= traceState.steps.length - 1}
                onClick={() =>
                  setTraceState((p) => (p ? { ...p, isPlaying: false, stepIdx: p.steps.length - 1 } : p))
                }
              >
                Skip to Result ⏭
              </button>
            </div>
          </div>
          <p className="ll-trace-desc">{activeStep.description}</p>
          {activeStep.codeLine && <div className="ll-trace-code">{activeStep.codeLine}</div>}
        </div>
      )}

      <div className="ll-toolbar">
        <div className="ll-toolbar-row">
          <div className="ll-input-group">
            <label htmlFor="ll-touch-val" className="ll-input-label">
              Value
            </label>
            <input
              id="ll-touch-val"
              className="ll-input"
              value={valueInput}
              onChange={(e) => setValueInput(e.target.value)}
              placeholder="99"
            />
          </div>

          <div className="ll-input-group">
            <label htmlFor="ll-touch-pos" className="ll-input-label">
              Pos
            </label>
            <input
              id="ll-touch-pos"
              className="ll-input"
              type="number"
              min="0"
              value={posInput}
              onChange={(e) => setPosInput(e.target.value)}
            />
          </div>

          <div className="ll-preset-group">
            <button
              type="button"
              className="ll-preset-chip"
              onClick={() => applyPreset([], 'Empty List []')}
            >
              Preset: Empty []
            </button>
            <button
              type="button"
              className="ll-preset-chip"
              onClick={() => applyPreset([42], 'Single Node [42]')}
            >
              Preset: Single [42]
            </button>
            <button
              type="button"
              className="ll-preset-chip"
              onClick={() => applyPreset(DEFAULT_VALUES, 'Default [10,25,37,52,68]')}
            >
              Reset Default
            </button>
          </div>
        </div>

        <div className="ll-toolbar-row">
          <button type="button" className="ll-btn ll-btn-primary" onClick={() => handleOp('prepend')}>
            Prepend · O(1)
          </button>
          <button type="button" className="ll-btn ll-btn-primary" onClick={() => handleOp('append')}>
            Append · O(1)
          </button>
          <button type="button" className="ll-btn ll-btn-accent" onClick={() => handleOp('insertAt')}>
            Insert at Pos · O(n)
          </button>
          <button type="button" className="ll-btn ll-btn-danger" onClick={() => handleOp('deleteHead')}>
            Delete Head · O(1)
          </button>
          <button type="button" className="ll-btn ll-btn-danger" onClick={() => handleOp('deleteTail')}>
            Delete Tail · O(n)
          </button>
          <button type="button" className="ll-btn ll-btn-danger" onClick={() => handleOp('deleteAt')}>
            Delete at Pos · O(n)
          </button>
          <button type="button" className="ll-btn" onClick={() => handleOp('search')}>
            Search · O(n)
          </button>
          <button type="button" className="ll-btn" onClick={() => handleOp('traverse')}>
            Traverse · O(n)
          </button>
        </div>

        <div className="ll-section-kicker" style={{ marginBottom: 0 }}>
          OPERATION LOG: {historyLog[0]}
        </div>
      </div>
    </div>
  );
}

