import { useMemo, useState } from 'react';
import PointerNodeDiagram from '../../../../components/Visualizer/PointerNodeDiagram';
import {
  createLinkedList,
  deriveChain,
  traceDeleteTail,
  traceFastSlow,
  traceInsertAt,
  traceReverse,
  traceSearch,
  traceTraverse,
} from '../../../../utils/linkedListModel';
import './LinkedListStyles.css';

const CONCEPTS = [
  { id: 'A', label: 'A. Node Structure' },
  { id: 'B', label: 'B. HEAD & TAIL' },
  { id: 'C', label: 'C. Traversal' },
  { id: 'D', label: 'D. Insertion' },
  { id: 'E', label: 'E. Deletion' },
  { id: 'F', label: 'F. Searching' },
  { id: 'G', label: 'G. Reversing' },
  { id: 'H', label: 'H. Fast & Slow' },
  { id: 'I', label: 'I. Complexity' },
];

const COMPLEXITY_ROWS = [
  { op: 'Access by index (get)', time: 'O(n)', space: 'O(1)', note: 'Must walk pointer-by-pointer from HEAD; no arr[i] offset math.' },
  { op: 'Search value (find)', time: 'O(n)', space: 'O(1)', note: 'Linear scan checking curr.data until match or NULL.' },
  { op: 'Prepend (insert at head)', time: 'O(1)', space: 'O(1)', note: 'Only updates newNode.next and HEAD — never shifts nodes.' },
  { op: 'Append (with TAIL pointer)', time: 'O(1)', space: 'O(1)', note: 'tail.next = newNode; tail = newNode directly.' },
  { op: 'Append (without TAIL)', time: 'O(n)', space: 'O(1)', note: 'Must traverse from HEAD to reach the last node first.' },
  { op: 'Insert at middle position', time: 'O(n)', space: 'O(1)', note: 'O(n) to reach predecessor at index - 1, then O(1) pointer rewire.' },
  { op: 'Delete Head', time: 'O(1)', space: 'O(1)', note: 'HEAD = HEAD.next skips the first node immediately.' },
  { op: 'Delete Tail (Singly Linked)', time: 'O(n)', space: 'O(1)', note: 'Why O(n)? Singly linked nodes lack a .prev pointer, so we traverse from HEAD to find the second-last node!' },
  { op: 'Delete at middle position', time: 'O(n)', space: 'O(1)', note: 'Traverse to predecessor, then curr.next = curr.next.next.' },
  { op: 'Reverse List (Iterative)', time: 'O(n)', space: 'O(1)', note: 'Touches each node once using three pointers: prev, curr, nextNode.' },
];

function ConceptMiniStepper({ traceResult, label, keepOrderDuringSteps = false }) {
  const [stepIdx, setStepIdx] = useState(0);
  const safeIdx = Math.min(stepIdx, Math.max(0, traceResult.steps.length - 1));
  const step = traceResult.steps[safeIdx];
  const initialIds = useMemo(() => deriveChain(traceResult.steps[0].model).map((n) => n.id), [traceResult]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      <PointerNodeDiagram
        model={step.model}
        label={`${label} · STEP ${safeIdx + 1}/${traceResult.steps.length}`}
        pointers={step.pointers}
        highlightedNodeId={step.highlightedNodeId}
        highlightedField={step.highlightedField}
        highlightedArrowFromId={step.highlightedArrowFromId}
        foundNodeId={step.foundNodeId}
        detachedNodeIds={step.detachedNodeIds}
        secondaryHeadId={step.secondaryHeadId}
        stableOrderIds={keepOrderDuringSteps ? initialIds : null}
        isReversedHighlight={step.isReversedHighlight}
        showInspector={false}
        compact
        memoryNote={null}
      />
      <div className="ll-trace-card" style={{ boxShadow: '2px 2px 0px #000' }}>
        <div className="ll-trace-head">
          <strong style={{ fontSize: '0.85rem' }}>{step.title}</strong>
          <div className="ll-toolbar-row">
            <button
              type="button"
              className="ll-btn"
              disabled={safeIdx === 0}
              onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
            >
              ◀ Prev
            </button>
            <button
              type="button"
              className="ll-btn"
              disabled={safeIdx >= traceResult.steps.length - 1}
              onClick={() => setStepIdx((i) => Math.min(traceResult.steps.length - 1, i + 1))}
            >
              Next ▶
            </button>
            <button type="button" className="ll-btn" onClick={() => setStepIdx(0)}>
              Reset
            </button>
          </div>
        </div>
        <p className="ll-trace-desc" style={{ fontSize: '0.82rem' }}>{step.description}</p>
        {step.codeLine && <div className="ll-trace-code">{step.codeLine}</div>}
      </div>
    </div>
  );
}

export default function LinkedListUnderstandStage() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [focusPart, setFocusPart] = useState('both'); // For Concept A
  const [evenCycleList, setEvenCycleList] = useState(false); // For Concept H

  const singleNodeModel = useMemo(() => createLinkedList([42, 99], true), []);
  const traversalTrace = useMemo(() => traceTraverse(createLinkedList([10, 25, 37], true)), []);
  const insertTrace = useMemo(() => traceInsertAt(createLinkedList([10, 30, 40], true), 20, 1), []);
  const deleteTailTrace = useMemo(() => traceDeleteTail(createLinkedList([10, 25, 37], true)), []);
  const searchTrace = useMemo(() => traceSearch(createLinkedList([10, 25, 37, 52], true), 37), []);
  const reverseTrace = useMemo(() => traceReverse(createLinkedList([10, 25, 37], true)), []);
  const fastSlowTrace = useMemo(
    () =>
      traceFastSlow(
        createLinkedList(evenCycleList ? [1, 2, 3, 4] : [1, 2, 3, 4, 5], true)
      ),
    [evenCycleList]
  );

  const showSection = (id) => activeTab === 'ALL' || activeTab === id;

  return (
    <div className="ll-understand-wrap">
      <div className="ll-concept-nav" role="tablist" aria-label="Linked List Concepts">
        <button
          type="button"
          className={`ll-concept-tab ${activeTab === 'ALL' ? 'active' : ''}`}
          onClick={() => setActiveTab('ALL')}
        >
          View All (A–I)
        </button>
        {CONCEPTS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`ll-concept-tab ${activeTab === c.id ? 'active' : ''}`}
            onClick={() => setActiveTab(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* A. NODE STRUCTURE */}
      {showSection('A') && (
        <section className="ll-concept-card">
          <div className="ll-concept-card-head">
            <h3 className="ll-concept-card-title">A. Node Structure (DATA + NEXT)</h3>
            <span className="ll-complexity-badge">O(1) per node</span>
          </div>
          <p className="ll-trace-desc">
            A Linked List has no contiguous block like an array. Its building block is a <strong>Node</strong> containing two fields: <code>data</code> (the stored value) and <code>next</code> (a reference to the next Node object, or <code>null</code>).
          </p>
          <div className="ll-toolbar-row">
            <button type="button" className="ll-btn" onClick={() => setFocusPart('data')}>
              Highlight DATA Field
            </button>
            <button type="button" className="ll-btn" onClick={() => setFocusPart('next')}>
              Highlight NEXT Field
            </button>
            <button type="button" className="ll-btn" onClick={() => setFocusPart('both')}>
              Reset Highlight
            </button>
          </div>
          <PointerNodeDiagram
            model={singleNodeModel}
            highlightedNodeId={singleNodeModel.headId}
            highlightedField={focusPart}
            showInspector={false}
            compact
            memoryNote={null}
          />
          <pre className="ll-code-block">{`class Node {
  constructor(data) {
    this.data = data;  // Stored value
    this.next = null;  // Reference to next Node (or null)
  }
}
const n1 = new Node(42);
const n2 = new Node(99);
n1.next = n2;`}</pre>
        </section>
      )}

      {/* B. HEAD AND TAIL POINTERS */}
      {showSection('B') && (
        <section className="ll-concept-card">
          <div className="ll-concept-card-head">
            <h3 className="ll-concept-card-title">B. HEAD and TAIL Pointers</h3>
            <span className="ll-complexity-badge">O(1) references</span>
          </div>
          <p className="ll-trace-desc">
            <strong>HEAD</strong> holds the entry address of node 0. <strong>TAIL</strong> holds the address of the last node (whose <code>next</code> is <code>null</code>). If you reassign <code>this.head = newNode</code> before saving <code>newNode.next = this.head</code>, you sever the entire chain!
          </p>
          <div className="ll-callout">
            <strong>Golden Rule:</strong> Always connect the new node’s outgoing <code>.next</code> pointer <em>before</em> moving <code>HEAD</code> or cutting existing links.
          </div>
          <pre className="ll-code-block">{`class LinkedList {
  constructor() {
    this.head = null;  // Empty list -> HEAD is null
    this.tail = null;  // TAIL also null when empty
  }
}`}</pre>
        </section>
      )}

      {/* C. TRAVERSAL */}
      {showSection('C') && (
        <section className="ll-concept-card">
          <div className="ll-concept-card-head">
            <h3 className="ll-concept-card-title">C. Traversal (curr = curr.next)</h3>
            <span className="ll-complexity-badge">O(n) time · O(1) space</span>
          </div>
          <p className="ll-trace-desc">
            To visit every node, start a temporary pointer <code>curr</code> at <code>HEAD</code> so you never lose <code>HEAD</code>, and advance via <code>curr = curr.next</code> until <code>curr === null</code>.
          </p>
          <ConceptMiniStepper traceResult={traversalTrace} label="TRAVERSAL DRY RUN" />
          <div className="ll-concept-split">
            <pre className="ll-code-block">{`function traverse(head) {
  let curr = head;
  while (curr !== null) {
    console.log(curr.data);
    curr = curr.next;
  }
}`}</pre>
            <table className="ll-dry-run-table">
              <thead>
                <tr><th>Step</th><th>curr Node</th><th>curr.data</th><th>Next Step</th></tr>
              </thead>
              <tbody>
                <tr><td>1</td><td>0x100</td><td>10</td><td>curr = 0x240</td></tr>
                <tr><td>2</td><td>0x240</td><td>25</td><td>curr = 0x3A0</td></tr>
                <tr><td>3</td><td>0x3A0</td><td>37</td><td>curr = NULL (stop)</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* D. INSERTION */}
      {showSection('D') && (
        <section className="ll-concept-card">
          <div className="ll-concept-card-head">
            <h3 className="ll-concept-card-title">D. Insertion (Head, Middle & Tail)</h3>
            <span className="ll-complexity-badge">Head/Tail O(1) · Middle O(n)</span>
          </div>
          <p className="ll-trace-desc">
            Insertion does not shift array elements — it only rewires two pointers. When inserting at position <code>pos</code>, first traverse to the predecessor at <code>pos - 1</code>, wire <code>newNode.next = curr.next</code>, then point <code>curr.next = newNode</code>.
          </p>
          <ConceptMiniStepper traceResult={insertTrace} label="INSERT AT POSITION 1" keepOrderDuringSteps />
          <pre className="ll-code-block">{`// Insert at position k (k > 0)
let curr = head;
for (let i = 0; i < k - 1; i++) curr = curr.next;
const newNode = new Node(val);
newNode.next = curr.next;  // 1. Protect remainder of list first!
curr.next = newNode;       // 2. Link predecessor to newNode`}</pre>
        </section>
      )}

      {/* E. DELETION */}
      {showSection('E') && (
        <section className="ll-concept-card">
          <div className="ll-concept-card-head">
            <h3 className="ll-concept-card-title">E. Deletion (Why Delete Tail is O(n) in Singly Linked List)</h3>
            <span className="ll-complexity-badge">Head O(1) · Middle/Tail O(n)</span>
          </div>
          <p className="ll-trace-desc">
            Deleting <code>HEAD</code> is <code>O(1)</code> (<code>head = head.next</code>). Deleting <code>TAIL</code> in a singly linked list is <strong>O(n)</strong> even when you store a <code>TAIL</code> pointer — because nodes have no backward link, so we must walk from <code>HEAD</code> to find the second-last node and set its <code>.next = null</code>.
          </p>
          <ConceptMiniStepper traceResult={deleteTailTrace} label="DELETE TAIL O(N)" keepOrderDuringSteps />
        </section>
      )}

      {/* F. SEARCHING */}
      {showSection('F') && (
        <section className="ll-concept-card">
          <div className="ll-concept-card-head">
            <h3 className="ll-concept-card-title">F. Searching (Sequential Pointer Chase)</h3>
            <span className="ll-complexity-badge">O(n) time · O(1) space</span>
          </div>
          <p className="ll-trace-desc">
            Binary search does not work efficiently on linked lists because finding the midpoint takes O(n) traversal. Searching walks sequentially from <code>HEAD</code> checking each <code>curr.data === target</code>.
          </p>
          <ConceptMiniStepper traceResult={searchTrace} label="SEARCH TARGET = 37" />
        </section>
      )}

      {/* G. REVERSING */}
      {showSection('G') && (
        <section className="ll-concept-card">
          <div className="ll-concept-card-head">
            <h3 className="ll-concept-card-title">G. Reversing a Linked List (prev, curr, nextNode)</h3>
            <span className="ll-complexity-badge">O(n) time · O(1) space</span>
          </div>
          <p className="ll-trace-desc">
            Reversing changes direction of every link in place using three pointers: save <code>nextNode = curr.next</code> before overwriting <code>curr.next = prev</code>, then advance <code>prev = curr</code> and <code>curr = nextNode</code>.
          </p>
          <ConceptMiniStepper traceResult={reverseTrace} label="IN-PLACE REVERSAL" keepOrderDuringSteps />
          <div className="ll-concept-split">
            <pre className="ll-code-block">{`function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    const nextNode = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextNode;
  }
  return prev; // new HEAD
}`}</pre>
            <table className="ll-dry-run-table">
              <thead>
                <tr><th>Iter</th><th>prev</th><th>curr</th><th>curr.next becomes</th></tr>
              </thead>
              <tbody>
                <tr><td>1</td><td>NULL</td><td>10</td><td>10.next → NULL</td></tr>
                <tr><td>2</td><td>10</td><td>25</td><td>25.next → 10</td></tr>
                <tr><td>3</td><td>25</td><td>37</td><td>37.next → 25 (prev=37 = new HEAD)</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* H. FAST & SLOW POINTERS */}
      {showSection('H') && (
        <section className="ll-concept-card">
          <div className="ll-concept-card-head">
            <h3 className="ll-concept-card-title">H. Fast & Slow Pointers (Tortoise & Hare)</h3>
            <span className="ll-complexity-badge">O(n) time · O(1) space</span>
          </div>
          <p className="ll-trace-desc">
            Move <code>slow</code> by <strong>1 step</strong> and <code>fast</code> by <strong>2 steps</strong>. When <code>fast</code> reaches the end (<code>fast === null || fast.next === null</code>), <code>slow</code> stands right at the middle (returning the second middle on even lengths). In cyclic lists, <code>fast</code> laps and meets <code>slow</code> (Floyd’s Cycle Detection).
          </p>
          <div className="ll-toolbar-row">
            <button
              type="button"
              className={`ll-btn ${!evenCycleList ? 'll-btn-primary' : ''}`}
              onClick={() => setEvenCycleList(false)}
            >
              Odd Length [1,2,3,4,5]
            </button>
            <button
              type="button"
              className={`ll-btn ${evenCycleList ? 'll-btn-primary' : ''}`}
              onClick={() => setEvenCycleList(true)}
            >
              Even Length [1,2,3,4]
            </button>
          </div>
          <ConceptMiniStepper traceResult={fastSlowTrace} label="FAST (2X) & SLOW (1X)" />
        </section>
      )}

      {/* I. COMPLEXITY TABLE */}
      {showSection('I') && (
        <section className="ll-concept-card">
          <div className="ll-concept-card-head">
            <h3 className="ll-concept-card-title">I. Complexity Analysis Reference</h3>
            <span className="ll-complexity-badge">Time & Space</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="ll-dry-run-table">
              <thead>
                <tr>
                  <th>Operation</th>
                  <th>Time</th>
                  <th>Space</th>
                  <th>Why?</th>
                </tr>
              </thead>
              <tbody>
                {COMPLEXITY_ROWS.map((row) => (
                  <tr
                    key={row.op}
                    className={row.op.includes('Delete Tail') ? 'll-row-highlight' : ''}
                  >
                    <td>{row.op}</td>
                    <td>{row.time}</td>
                    <td>{row.space}</td>
                    <td style={{ fontFamily: 'inherit' }}>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

