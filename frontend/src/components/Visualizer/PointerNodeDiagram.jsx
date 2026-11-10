import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './PointerNodeDiagram.css';

function computeVisualOrder(model, secondaryHeadId, detachedNodeIds, stableOrderIds, pointers, newNodePlacement = 'auto') {
  const nodesMap = model?.nodes || {};
  const result = [];
  const seen = new Set();

  const pushChain = (startId) => {
    let cur = startId;
    const guard = new Set();
    while (cur && nodesMap[cur] && !guard.has(cur)) {
      guard.add(cur);
      if (!seen.has(cur)) {
        seen.add(cur);
        result.push(nodesMap[cur]);
      }
      cur = nodesMap[cur].nextId;
    }
  };

  if (Array.isArray(stableOrderIds) && stableOrderIds.length > 0) {
    for (const id of stableOrderIds) {
      if (nodesMap[id] && !seen.has(id)) {
        seen.add(id);
        result.push(nodesMap[id]);
      }
    }
    for (const id of Object.keys(nodesMap)) {
      if (!seen.has(id)) {
        seen.add(id);
        const node = nodesMap[id];
        if (pointers?.newNode === id && pointers?.curr) {
          const currIdx = result.findIndex((n) => n.id === pointers.curr);
          if (currIdx >= 0) {
            result.splice(currIdx + 1, 0, node);
            continue;
          }
        }
        if (pointers?.newNode === id && (newNodePlacement === 'start' || node.nextId === model.headId)) {
          result.unshift(node);
        } else {
          result.push(node);
        }
      }
    }
    return result;
  }

  // Standard pointer-derived ordering
  pushChain(model?.headId);

  if (secondaryHeadId) {
    pushChain(secondaryHeadId);
  }

  // Remaining unlinked / detached nodes (new allocations or nodes pending deletion)
  const detachedSet = new Set(detachedNodeIds || []);
  for (const id of Object.keys(nodesMap)) {
    if (!seen.has(id)) {
      seen.add(id);
      const node = nodesMap[id];
      const isNewAlloc = pointers?.newNode === id || detachedSet.has(id);
      if (isNewAlloc && pointers?.curr) {
        const currIdx = result.findIndex((n) => n.id === pointers.curr);
        if (currIdx >= 0) {
          result.splice(currIdx + 1, 0, node);
          continue;
        }
      }
      if (isNewAlloc && pointers?.newNode === id && (newNodePlacement === 'start' || (model.headId && node.nextId === model.headId))) {
        result.unshift(node);
      } else {
        result.push(node);
      }
    }
  }

  return result;
}

function getRelRect(el, rootRect) {
  const r = el.getBoundingClientRect();
  return {
    left: r.left - rootRect.left,
    right: r.right - rootRect.left,
    top: r.top - rootRect.top,
    bottom: r.bottom - rootRect.top,
    width: r.width,
    height: r.height,
    cx: r.left - rootRect.left + r.width / 2,
    cy: r.top - rootRect.top + r.height / 2,
  };
}

function formatNodeAddr(model, id) {
  if (!id || !model?.nodes?.[id]) return 'NULL';
  return model.nodes[id].address;
}

export default function PointerNodeDiagram({
  model,
  label = 'SINGLY LINKED LIST · MEMORY VIEW',
  pointers = {},
  highlightedNodeId = null,
  highlightedField = null, // 'data' | 'next' | 'both' | null
  highlightedArrowFromId = null,
  foundNodeId = null,
  detachedNodeIds = [],
  secondaryHeadId = null,
  stableOrderIds = null,
  newNodePlacement = 'auto',
  isReversedHighlight = false,
  selectedTarget = null,
  onSelectTarget = null,
  showInspector = true,
  showHeader = true,
  compact = false,
  memoryNote = 'Educational memory model: hex addresses (e.g. 0x100) represent distinct non-contiguous heap locations. JavaScript manages real object references internally.',
}) {
  const trackRef = useRef(null);
  const headRef = useRef(null);
  const nullRef = useRef(null);
  const cardRefs = useRef({});
  const nextCellRefs = useRef({});
  const inlineNullRefs = useRef({});

  const [svgData, setSvgData] = useState({ width: 0, height: 0, paths: [] });
  const [internalSelected, setInternalSelected] = useState(null);

  const activeSelection = selectedTarget !== undefined && onSelectTarget ? selectedTarget : internalSelected;
  const selectTarget = useCallback(
    (target) => {
      if (onSelectTarget) {
        onSelectTarget(target);
      } else {
        setInternalSelected(target);
      }
    },
    [onSelectTarget]
  );

  const visualNodes = useMemo(
    () => computeVisualOrder(model, secondaryHeadId, detachedNodeIds, stableOrderIds, pointers, newNodePlacement),
    [model, secondaryHeadId, detachedNodeIds, stableOrderIds, pointers, newNodePlacement]
  );

  const detachedSet = useMemo(() => new Set(detachedNodeIds || []), [detachedNodeIds]);

  const nodeIndexMap = useMemo(() => {
    const map = {};
    visualNodes.forEach((n, idx) => {
      map[n.id] = idx;
    });
    return map;
  }, [visualNodes]);

  // Identify rightmost active node that links directly to the end NULL termination block
  const rightmostNullConnectorId = useMemo(() => {
    if (visualNodes.length === 0) return null;
    for (let i = visualNodes.length - 1; i >= 0; i--) {
      const n = visualNodes[i];
      if (!detachedSet.has(n.id) && pointers?.removed !== n.id) {
        return n.nextId === null ? n.id : null;
      }
    }
    return null;
  }, [visualNodes, detachedSet, pointers]);

  // Compute SVG arrow paths from real measured DOM positions
  const computeArrows = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const rootRect = track.getBoundingClientRect();
    const paths = [];

    // 1. HEAD -> headId (or NULL)
    if (headRef.current) {
      const hRect = getRelRect(headRef.current, rootRect);
      if (model?.headId && cardRefs.current[model.headId]) {
        const targetIdx = nodeIndexMap[model.headId] ?? 0;
        const tRect = getRelRect(cardRefs.current[model.headId], rootRect);
        const startX = hRect.right;
        const startY = hRect.cy;

        if (targetIdx === 0) {
          const endX = tRect.left - 3;
          const endY = tRect.cy;
          paths.push({
            id: 'arrow-head',
            d: `M ${startX} ${startY} L ${endX} ${endY}`,
            color: '#059669',
            marker: 'arrow-green',
            dashed: false,
            hot: true,
          });
        } else {
          // HEAD jumped over one or more nodes (e.g. mid-deleteHead or reverse finalize)
          const endX = tRect.left + tRect.width * 0.25;
          const endY = tRect.top - 4;
          const arcLift = Math.max(24, Math.min(hRect.top, tRect.top) - 34);
          const ctrlX = (startX + endX) / 2;
          const ctrlY = Math.min(hRect.top, tRect.top) - arcLift;
          paths.push({
            id: 'arrow-head',
            d: `M ${startX} ${hRect.top + 10} Q ${ctrlX} ${ctrlY}, ${endX} ${endY}`,
            color: '#059669',
            marker: 'arrow-green',
            dashed: false,
            hot: true,
          });
        }
      } else if (nullRef.current) {
        const nRect = getRelRect(nullRef.current, rootRect);
        const startX = hRect.right;
        const startY = hRect.cy;
        const endX = nRect.left - 3;
        const endY = nRect.cy;
        paths.push({
          id: 'arrow-head-null',
          d: `M ${startX} ${startY} L ${endX} ${endY}`,
          color: '#059669',
          marker: 'arrow-green',
          dashed: false,
          hot: true,
        });
      }
    }

    // 2. Each node.nextId -> targetNode or NULL
    let backArcCount = 0;
    let forwardSkipCount = 0;

    visualNodes.forEach((node, fromIdx) => {
      const nextEl = nextCellRefs.current[node.id];
      const cardEl = cardRefs.current[node.id];
      if (!nextEl || !cardEl) return;

      const cRect = getRelRect(cardEl, rootRect);
      const nCellRect = getRelRect(nextEl, rootRect);
      const isHot = highlightedArrowFromId === node.id;
      const isReverseEdge = isHot && isReversedHighlight;

      if (node.nextId && cardRefs.current[node.nextId]) {
        const targetIdx = nodeIndexMap[node.nextId];
        const tRect = getRelRect(cardRefs.current[node.nextId], rootRect);

        if (targetIdx === fromIdx + 1) {
          // Clean adjacent rightward pointer arrow
          const startX = cRect.right;
          const startY = cRect.cy;
          const endX = tRect.left - 3;
          const endY = tRect.cy;
          paths.push({
            id: `arrow-${node.id}`,
            d: `M ${startX} ${startY} L ${endX} ${endY}`,
            color: isHot ? '#D97706' : '#111111',
            marker: isHot ? 'arrow-amber' : 'arrow-black',
            dashed: false,
            hot: isHot,
          });
        } else if (targetIdx > fromIdx + 1) {
          // Forward skip arc hopping neatly above intermediate nodes
          forwardSkipCount += 1;
          const startX = nCellRect.cx;
          const startY = cRect.top - 2;
          const endX = tRect.left + tRect.width * 0.28;
          const endY = tRect.top - 4;
          const lift = 28 + forwardSkipCount * 10;
          const ctrlX = (startX + endX) / 2;
          const ctrlY = Math.min(startY, endY) - lift;
          paths.push({
            id: `arrow-${node.id}`,
            d: `M ${startX} ${startY} Q ${ctrlX} ${ctrlY}, ${endX} ${endY}`,
            color: isHot ? '#D97706' : '#0284C7',
            marker: isHot ? 'arrow-amber' : 'arrow-sky',
            dashed: false,
            hot: isHot,
          });
        } else if (targetIdx < fromIdx) {
          // Reversed backward pointer curving underneath nodes into DATA side so inline NULL never collides
          backArcCount += 1;
          const startX = nCellRect.cx;
          const startY = cRect.bottom + 1;
          const endX = tRect.left + tRect.width * 0.25;
          const endY = tRect.bottom + 4;
          const drop = 30 + (backArcCount % 2) * 8;
          const bottomY = Math.max(startY, endY) + drop;
          paths.push({
            id: `arrow-${node.id}`,
            d: `M ${startX} ${startY} C ${startX} ${bottomY}, ${endX} ${bottomY}, ${endX} ${endY}`,
            color: isReverseEdge ? '#EA580C' : '#7C3AED',
            marker: isReverseEdge ? 'arrow-orange' : 'arrow-purple',
            dashed: false,
            hot: isHot || isReverseEdge,
          });
        } else if (targetIdx === fromIdx) {
          // Self loop guard
          const sx = nCellRect.cx;
          const sy = cRect.top;
          paths.push({
            id: `arrow-${node.id}`,
            d: `M ${sx - 10} ${sy} C ${sx - 18} ${sy - 34}, ${sx + 18} ${sy - 34}, ${sx + 10} ${sy - 3}`,
            color: '#EA580C',
            marker: 'arrow-orange',
            dashed: false,
            hot: true,
          });
        }
      } else if (node.nextId === null) {
        if (node.id === rightmostNullConnectorId && nullRef.current) {
          const nullBoxRect = getRelRect(nullRef.current, rootRect);
          const startX = cRect.right;
          const startY = cRect.cy;
          const endX = nullBoxRect.left - 3;
          const endY = nullBoxRect.cy;
          paths.push({
            id: `arrow-${node.id}-null`,
            d: `M ${startX} ${startY} L ${endX} ${endY}`,
            color: isHot ? '#D97706' : '#111111',
            marker: isHot ? 'arrow-amber' : 'arrow-black',
            dashed: false,
            hot: isHot,
          });
        } else if (inlineNullRefs.current[node.id]) {
          const inRect = getRelRect(inlineNullRefs.current[node.id], rootRect);
          const startX = nCellRect.cx;
          const startY = cRect.bottom;
          const endX = inRect.cx;
          const endY = inRect.top - 2;
          paths.push({
            id: `arrow-${node.id}-inline-null`,
            d: `M ${startX} ${startY} L ${endX} ${endY}`,
            color: '#DC2626',
            marker: 'arrow-red',
            dashed: true,
            hot: isHot,
          });
        }
      }
    });

    setSvgData({
      width: track.scrollWidth,
      height: track.scrollHeight,
      paths,
    });
  }, [model, visualNodes, nodeIndexMap, rightmostNullConnectorId, highlightedArrowFromId, isReversedHighlight]);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const rafId = requestAnimationFrame(computeArrows);
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(computeArrows);
    });
    observer.observe(track);
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [computeArrows]);

  // Derive selected node / target details for the Inspector Panel
  const inspectorDetails = useMemo(() => {
    if (!activeSelection) {
      if (highlightedNodeId && model?.nodes?.[highlightedNodeId]) {
        const node = model.nodes[highlightedNodeId];
        const nextTarget = node.nextId ? model.nodes[node.nextId] : null;
        return {
          heading: `ACTIVE NODE · ${node.data}`,
          address: node.address,
          data: String(node.data),
          next: nextTarget ? nextTarget.address : 'NULL',
          pointsTo: nextTarget ? `Node(${nextTarget.data}) at ${nextTarget.address}` : 'NULL (End of List)',
          explain: nextTarget
            ? `Currently inspecting Node(${node.data}) at heap address ${node.address}. Its NEXT field holds ${nextTarget.address}, linking directly to Node(${nextTarget.data}).`
            : `Currently inspecting Node(${node.data}) at ${node.address}. Its NEXT pointer is NULL, signaling the end of the chain.`,
        };
      }
      const headNode = model?.headId ? model.nodes[model.headId] : null;
      return {
        heading: 'CLICK ANY NODE, FIELD, HEAD, OR NULL TO INSPECT',
        address: headNode ? headNode.address : 'NULL',
        data: headNode ? String(headNode.data) : '—',
        next: headNode?.nextId ? formatNodeAddr(model, headNode.nextId) : 'NULL',
        pointsTo: headNode ? `HEAD → Node(${headNode.data})` : 'NULL (Empty List)',
        explain:
          'Select any node DATA cell, NEXT pointer cell, HEAD box, or NULL terminator to inspect its simulated memory address and reference target.',
      };
    }

    if (activeSelection.type === 'head') {
      const headNode = model?.headId ? model.nodes[model.headId] : null;
      return {
        heading: 'HEAD POINTER REGISTER',
        address: 'HEAD Variable',
        data: 'Reference',
        next: headNode ? headNode.address : 'NULL',
        pointsTo: headNode ? `Node(${headNode.data}) at ${headNode.address}` : 'NULL (Empty List)',
        explain:
          'HEAD is an external entry pointer holding only the memory address of the first node. Changing HEAD (like prepend or deleteHead) takes O(1) time without moving any other nodes in memory.',
      };
    }

    if (activeSelection.type === 'null') {
      return {
        heading: 'NULL TERMINATOR',
        address: '0x000 (Sentinel)',
        data: 'Empty Reference',
        next: 'None',
        pointsTo: 'End of Linked List',
        explain:
          'NULL marks the termination boundary of a singly linked list. Loops check `while (curr !== null)` so traversal stops cleanly without dereferencing invalid memory.',
      };
    }

    const node = model?.nodes?.[activeSelection.nodeId];
    if (!node) return null;
    const nextNode = node.nextId ? model.nodes[node.nextId] : null;
    const isFieldNext = activeSelection.field === 'next';

    return {
      heading: isFieldNext
        ? `NODE(${node.data}) · NEXT FIELD`
        : `NODE(${node.data}) · MEMORY BLOCK`,
      address: node.address,
      data: String(node.data),
      next: nextNode ? nextNode.address : 'NULL',
      pointsTo: nextNode ? `Node(${nextNode.data}) at ${nextNode.address}` : 'NULL (End of List)',
      explain: isFieldNext
        ? nextNode
          ? `This NEXT compartment inside ${node.address} stores the reference ${nextNode.address}, linking directly to Node(${nextNode.data}). Reassigning \`.next\` redirects traversal instantly.`
          : `This NEXT compartment inside ${node.address} stores NULL, meaning no node follows it.`
        : `Node stored at simulated address ${node.address}. It keeps two paired fields in one heap object: DATA (${node.data}) and NEXT (${nextNode ? nextNode.address : 'NULL'}).`,
    };
  }, [activeSelection, highlightedNodeId, model]);

  const activePointerEntries = useMemo(() => {
    const list = [
      { key: 'head', label: 'HEAD', val: formatNodeAddr(model, model?.headId) },
      { key: 'tail', label: 'TAIL', val: formatNodeAddr(model, model?.tailId) },
    ];
    if (pointers && typeof pointers === 'object') {
      for (const [k, v] of Object.entries(pointers)) {
        if (v !== undefined) {
          list.push({
            key: k,
            label: k,
            val: v ? formatNodeAddr(model, v) : 'NULL',
            isNull: !v,
          });
        }
      }
    }
    return list;
  }, [model, pointers]);

  return (
    <div className={`pnd-shell ${compact ? 'pnd-compact' : ''}`}>
      {showHeader && (
        <div className="pnd-header">
          <div className="pnd-title-group">
            <span className="pnd-title-tag">{label}</span>
            <span className="pnd-len-badge">{model?.length ?? 0} NODES</span>
          </div>
          <div className="pnd-vars-strip">
            {activePointerEntries.map((item) => (
              <span
                key={item.key}
                data-role={item.key}
                className={`pnd-var-pill ${item.isNull ? 'is-null' : ''}`}
              >
                {item.label} = {item.val}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="pnd-scroll" data-testid="pointer-diagram-scroll">
        <div ref={trackRef} className="pnd-track">
          {/* SVG Overlay for exact pointer arrows */}
          <svg
            className="pnd-arrows-layer"
            width={svgData.width || 1}
            height={svgData.height || 1}
            aria-hidden="true"
          >
            <defs>
              {[
                { id: 'arrow-black', color: '#111111' },
                { id: 'arrow-green', color: '#059669' },
                { id: 'arrow-amber', color: '#D97706' },
                { id: 'arrow-sky', color: '#0284C7' },
                { id: 'arrow-orange', color: '#EA580C' },
                { id: 'arrow-purple', color: '#7C3AED' },
                { id: 'arrow-red', color: '#DC2626' },
              ].map((m) => (
                <marker
                  key={m.id}
                  id={m.id}
                  markerWidth="9"
                  markerHeight="9"
                  refX="7"
                  refY="4.5"
                  orient="auto"
                >
                  <path d="M 0 1 L 8 4.5 L 0 8 z" fill={m.color} />
                </marker>
              ))}
            </defs>
            {svgData.paths.map((p) => (
              <path
                key={p.id}
                d={p.d}
                fill="none"
                stroke={p.color}
                strokeWidth={p.hot ? 2.6 : 2}
                strokeDasharray={p.dashed ? '5 4' : undefined}
                markerEnd={`url(#${p.marker})`}
              />
            ))}
          </svg>

          {/* HEAD Entry Box */}
          <div className="pnd-slot">
            <button
              ref={headRef}
              type="button"
              className={`pnd-head-btn ${activeSelection?.type === 'head' ? 'is-selected' : ''}`}
              onClick={() => selectTarget({ type: 'head' })}
              aria-label="HEAD pointer"
            >
              <span className="pnd-head-label">HEAD</span>
              <span className="pnd-head-addr">{formatNodeAddr(model, model?.headId)}</span>
            </button>
          </div>

          {/* Node Memory Cards */}
          {visualNodes.map((node, idx) => {
            const isHighlighted = highlightedNodeId === node.id;
            const isFound = foundNodeId === node.id;
            const isSelected = activeSelection?.nodeId === node.id;
            const isDetached = detachedSet.has(node.id);
            const isRemoving = pointers?.removed === node.id;

            const topTags = [];
            if (model?.headId === node.id) topTags.push('HEAD');
            if (model?.tailId === node.id) topTags.push('TAIL');

            const bottomTags = [];
            if (pointers) {
              for (const role of ['prev', 'curr', 'nextNode', 'slow', 'fast', 'newNode', 'removed', 'oldHead', 'oldTail']) {
                if (pointers[role] === node.id) {
                  bottomTags.push(role);
                }
              }
            }

            const showInlineNull = node.nextId === null && node.id !== rightmostNullConnectorId;

            return (
              <div
                key={node.id}
                className={`pnd-slot ${isDetached && !isRemoving ? 'is-detached-above' : ''} ${
                  isRemoving ? 'is-removing' : ''
                }`}
              >
                {topTags.length > 0 && (
                  <div className="pnd-tags-above">
                    {topTags.map((tag) => (
                      <span key={tag} className="pnd-ptr-tag" data-role={tag}>
                        {tag} ▼
                      </span>
                    ))}
                  </div>
                )}

                <div
                  ref={(el) => {
                    if (el) cardRefs.current[node.id] = el;
                    else delete cardRefs.current[node.id];
                  }}
                  className={`pnd-node-card ${isHighlighted ? 'is-highlighted' : ''} ${
                    isFound ? 'is-found' : ''
                  } ${isSelected ? 'is-selected' : ''} ${isDetached && !isRemoving ? 'is-detached' : ''} ${
                    isRemoving ? 'is-removing' : ''
                  }`}
                  data-node-id={node.id}
                  data-node-addr={node.address}
                >
                  <div className="pnd-node-top">
                    <span className="pnd-node-addr">{node.address}</span>
                    <span className="pnd-node-idx">
                      {isRemoving ? 'REMOVING' : isDetached ? 'NEW' : `idx ${idx}`}
                    </span>
                  </div>

                  <div className="pnd-node-compartments">
                    <button
                      type="button"
                      className={`pnd-cell pnd-data-cell ${
                        isHighlighted && (highlightedField === 'data' || highlightedField === 'both')
                          ? 'is-cell-hot'
                          : ''
                      }`}
                      onClick={() => selectTarget({ type: 'node', nodeId: node.id, field: 'data' })}
                      aria-label={`Node ${node.data} DATA field at ${node.address}`}
                    >
                      <span className="pnd-cell-kicker">DATA</span>
                      <span className="pnd-data-val">{node.data}</span>
                    </button>

                    <button
                      ref={(el) => {
                        if (el) nextCellRefs.current[node.id] = el;
                        else delete nextCellRefs.current[node.id];
                      }}
                      type="button"
                      className={`pnd-cell pnd-next-cell ${
                        isHighlighted && (highlightedField === 'next' || highlightedField === 'both')
                          ? 'is-cell-hot'
                          : ''
                      }`}
                      onClick={() => selectTarget({ type: 'node', nodeId: node.id, field: 'next' })}
                      aria-label={`Node ${node.data} NEXT pointer`}
                    >
                      <span className="pnd-cell-kicker">NEXT</span>
                      <span className={`pnd-next-val ${node.nextId ? '' : 'is-null-ref'}`}>
                        {formatNodeAddr(model, node.nextId)}
                      </span>
                    </button>
                  </div>
                </div>

                {showInlineNull && (
                  <span
                    ref={(el) => {
                      if (el) inlineNullRefs.current[node.id] = el;
                      else delete inlineNullRefs.current[node.id];
                    }}
                    className="pnd-inline-null-pill"
                  >
                    ⊥ NULL
                  </span>
                )}

                {bottomTags.length > 0 && (
                  <div className="pnd-tags-below">
                    {bottomTags.map((tag) => (
                      <span key={tag} className="pnd-ptr-tag" data-role={tag}>
                        ▲ {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Terminal NULL Block */}
          <div className="pnd-slot">
            <button
              ref={nullRef}
              type="button"
              className={`pnd-null-btn ${activeSelection?.type === 'null' ? 'is-selected' : ''}`}
              onClick={() => selectTarget({ type: 'null' })}
              aria-label="NULL terminator"
            >
              <span className="pnd-null-main">NULL</span>
              <span className="pnd-null-sub">end of list</span>
            </button>
          </div>
        </div>
      </div>

      {showInspector && inspectorDetails && (
        <div className="pnd-inspector">
          <div className="pnd-inspector-top">
            <span className="pnd-inspector-title">SELECTED NODE INSPECTOR · {inspectorDetails.heading}</span>
            <span className="pnd-inspector-hint">Click any node, DATA cell, NEXT cell, HEAD, or NULL</span>
          </div>
          <div className="pnd-inspector-grid">
            <div className="pnd-insp-box">
              <span className="pnd-insp-label">Address</span>
              <span className="pnd-insp-val">{inspectorDetails.address}</span>
            </div>
            <div className="pnd-insp-box">
              <span className="pnd-insp-label">Data</span>
              <span className="pnd-insp-val">{inspectorDetails.data}</span>
            </div>
            <div className="pnd-insp-box">
              <span className="pnd-insp-label">Next</span>
              <span className="pnd-insp-val">{inspectorDetails.next}</span>
            </div>
            <div className="pnd-insp-box">
              <span className="pnd-insp-label">Points to</span>
              <span className="pnd-insp-val">{inspectorDetails.pointsTo}</span>
            </div>
          </div>
          <div className="pnd-insp-explain">{inspectorDetails.explain}</div>
        </div>
      )}

      {memoryNote && <div className="pnd-memory-note">{memoryNote}</div>}
    </div>
  );
}
