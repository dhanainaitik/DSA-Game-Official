import { useMemo, useState } from 'react';
import PointerNodeDiagram from '../../../../components/Visualizer/PointerNodeDiagram';
import { createLinkedList } from '../../../../utils/linkedListModel';
import './LinkedListStyles.css';

const SEE_TAKEAWAYS = [
  {
    title: '01 · Non-Contiguous Heap Nodes',
    text: 'Notice the addresses (0x100, 0x240, 0x3A0, 0x1E0, 0x4C0). Nodes can live anywhere in memory — only their pointers stitch them into order.',
  },
  {
    title: '02 · Two Fields Per Node',
    text: 'Every node stores DATA (the payload, like 25) alongside NEXT (the address of the following node, like 0x3A0).',
  },
  {
    title: '03 · HEAD Entry Register',
    text: 'HEAD is the sole doorway into the list. Lose HEAD without saving it first and the entire chain becomes unreachable.',
  },
  {
    title: '04 · TAIL & NULL Termination',
    text: 'The final node is TAIL, whose NEXT pointer stores NULL (0x000 sentinel) so traversal loops know exactly when to stop.',
  },
  {
    title: '05 · Sequential Access Only',
    text: 'There is no O(1) index math like arr[i]. Reaching node 37 requires starting at HEAD and following each NEXT reference step-by-step.',
  },
];

export default function LinkedListSeeStage() {
  const model = useMemo(() => createLinkedList([10, 25, 37, 52, 68], true), []);
  const [selectedTarget, setSelectedTarget] = useState(() => ({
    type: 'node',
    nodeId: model.headId,
    field: 'both',
  }));

  return (
    <div className="ll-stage-wrap">
      <div className="ll-banner-bar">
        <div>
          <div className="ll-banner-title">MEMORY ANATOMY INSPECTOR</div>
          <div className="ll-banner-sub">
            Click any <strong>DATA</strong> cell, <strong>NEXT</strong> pointer cell,{' '}
            <strong>HEAD</strong> box, or <strong>NULL</strong> terminator to see how links work.
          </div>
        </div>
        <button
          type="button"
          className="ll-btn"
          onClick={() => setSelectedTarget({ type: 'head' })}
        >
          Inspect HEAD
        </button>
      </div>

      <PointerNodeDiagram
        model={model}
        label="SINGLY LINKED LIST — 5 NODES (HEAD → TAIL)"
        selectedTarget={selectedTarget}
        onSelectTarget={setSelectedTarget}
        showInspector
      />

      <div className="ll-takeaways-card">
        <div className="ll-section-kicker">MEMORY OVERVIEW — WHAT YOU ARE SEEING</div>
        <div className="ll-takeaways-grid">
          {SEE_TAKEAWAYS.map((item) => (
            <div key={item.title} className="ll-takeaway-item">
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

