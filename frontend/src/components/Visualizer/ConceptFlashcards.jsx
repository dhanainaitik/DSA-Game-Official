import { Fragment, useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUp,
  Box,
  ChevronLeft,
  ChevronRight,
  Compass,
  Cpu,
  Database,
  GitBranch,
  Hash,
  Layers,
  Link2,
  ListTree,
  Lock,
  Network,
  RefreshCw,
  Route,
  Ruler,
  Scan,
  Scissors,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Type,
  Waves,
  Zap,
} from 'lucide-react';
import './ConceptFlashcards.css';

const ICON_MAP = {
  arrowRight: ArrowRight,
  arrowUp: ArrowUp,
  box: Box,
  compass: Compass,
  cpu: Cpu,
  database: Database,
  gitBranch: GitBranch,
  hash: Hash,
  layers: Layers,
  link: Link2,
  listTree: ListTree,
  lock: Lock,
  network: Network,
  refresh: RefreshCw,
  route: Route,
  ruler: Ruler,
  scan: Scan,
  scissors: Scissors,
  search: Search,
  share2: Share2,
  shield: ShieldCheck,
  sparkles: Sparkles,
  type: Type,
  waves: Waves,
  zap: Zap,
};

function renderMiniTreeSvg(visual) {
  return (
    <svg width="176" height="74" viewBox="0 0 176 74" aria-hidden="true">
      <line x1="88" y1="18" x2="48" y2="54" stroke="#111111" strokeWidth="1.75" />
      <line x1="88" y1="18" x2="128" y2="54" stroke="#111111" strokeWidth="1.75" />
      <rect x="66" y="4" width="44" height="22" rx="6" fill="#ffffff" stroke="#111111" strokeWidth="1.6" />
      <text x="88" y="18" textAnchor="middle" fontSize="10" fontWeight="700" fontFamily="monospace" fill="#111111">
        {visual.root}
      </text>
      <rect
        x="24"
        y="44"
        width="48"
        height="22"
        rx="6"
        fill={visual.highlightLeaves ? '#FEF08A' : '#FFFFFF'}
        stroke="#111111"
        strokeWidth="1.6"
      />
      <text x="48" y="58" textAnchor="middle" fontSize="10" fontWeight="700" fontFamily="monospace" fill="#111111">
        {visual.left}
      </text>
      <rect
        x="104"
        y="44"
        width="48"
        height="22"
        rx="6"
        fill={visual.highlightLeaves ? '#FEF08A' : '#FFFFFF'}
        stroke="#111111"
        strokeWidth="1.6"
      />
      <text x="128" y="58" textAnchor="middle" fontSize="10" fontWeight="700" fontFamily="monospace" fill="#111111">
        {visual.right}
      </text>
    </svg>
  );
}

function renderMiniGraphSvg() {
  const nodes = [
    { id: 'A', x: 40, y: 18, fill: '#FEF08A' },
    { id: 'B', x: 136, y: 18, fill: '#FFFFFF' },
    { id: 'C', x: 40, y: 56, fill: '#FFFFFF' },
    { id: 'D', x: 136, y: 56, fill: '#CFFAFE' },
  ];
  const edges = [
    [40, 18, 136, 18],
    [40, 18, 40, 56],
    [136, 18, 136, 56],
    [40, 56, 136, 56],
  ];
  return (
    <svg width="176" height="74" viewBox="0 0 176 74" aria-hidden="true">
      {edges.map(([x1, y1, x2, y2], idx) => (
        <line key={idx} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111111" strokeWidth="1.75" />
      ))}
      {nodes.map((n) => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r="12" fill={n.fill} stroke="#111111" strokeWidth="1.75" />
          <text
            x={n.x}
            y={n.y + 3.5}
            textAnchor="middle"
            fontSize="10.5"
            fontWeight="800"
            fontFamily="monospace"
            fill="#111111"
          >
            {n.id}
          </text>
        </g>
      ))}
    </svg>
  );
}

function renderVisual(visual, takeaway) {
  if (!visual) return null;

  return (
    <div className="cf-visual-box">
      {visual.badges && (
        <div className="cf-badges-row">
          {visual.badges.map((b) => (
            <span key={b} className="cf-stat-badge">
              {b}
            </span>
          ))}
        </div>
      )}

      {visual.type === 'cells' && (
        <div
          className="cf-cells-row"
          style={{ gridTemplateColumns: `repeat(${visual.items.length}, minmax(0, 1fr))` }}
        >
          {visual.items.map((item, idx) => (
            <div key={`${item.top}-${idx}`} className={`cf-cell-item ${item.highlight ? 'is-hot' : ''}`}>
              <span className="cf-cell-val">{item.val}</span>
              <span className="cf-cell-top">{item.top}</span>
            </div>
          ))}
        </div>
      )}

      {visual.type === 'indexGrid' && (
        <div
          className="cf-index-grid"
          style={{ gridTemplateColumns: `42px repeat(${visual.cols.length}, minmax(0, 1fr))` }}
        >
          <span className="cf-grid-head">{visual.rowALabel}</span>
          {visual.cols.map((col, idx) => (
            <span key={`a-${idx}`} className={`cf-grid-pill ${col.hot ? 'is-hot' : ''}`}>
              {col.a}
            </span>
          ))}
          <span className="cf-grid-head">{visual.rowBLabel}</span>
          {visual.cols.map((col, idx) => (
            <span key={`b-${idx}`} className={`cf-grid-pill ${col.hot ? 'is-hot' : ''}`}>
              {col.b}
            </span>
          ))}
        </div>
      )}

      {visual.type === 'chain' && (
        <div className="cf-chain-row" data-tone={visual.tone || 'mint'}>
          {visual.nodes.map((node, idx) => (
            <Fragment key={`${node.top}-${idx}`}>
              <div className={`cf-chain-node ${node.highlight ? 'is-hot' : ''}`}>
                <span className="cf-chain-top">{node.top}</span>
                <span className="cf-chain-val">{node.val}</span>
              </div>
              {idx < visual.nodes.length - 1 && (
                <span className="cf-chain-arrow" aria-hidden="true">
                  →
                </span>
              )}
            </Fragment>
          ))}
        </div>
      )}

      {visual.type === 'metrics' && (
        <div className="cf-metrics-pair">
          {visual.items.map((m) => (
            <div
              key={m.label}
              className={`cf-metric-chip ${
                m.tone === 'good' ? 'is-good' : m.tone === 'warn' ? 'is-warn' : ''
              }`}
            >
              <span className="cf-metric-label">{m.label}</span>
              <span className="cf-metric-val">{m.val}</span>
              <span className="cf-metric-sub">{m.sub}</span>
            </div>
          ))}
        </div>
      )}

      {visual.type === 'stackMini' && (
        <div className="cf-stack-col">
          {visual.frames.map((frame) => (
            <div key={frame.label} className={`cf-stack-frame ${frame.hot ? 'is-hot' : ''}`}>
              <span>{frame.label}</span>
              {frame.note && <span className="cf-stack-note">{frame.note}</span>}
            </div>
          ))}
        </div>
      )}

      {visual.type === 'treeMini' && <div className="cf-mini-svg-wrap">{renderMiniTreeSvg(visual)}</div>}

      {visual.type === 'graphMini' && <div className="cf-mini-svg-wrap">{renderMiniGraphSvg()}</div>}

      {(visual.caption || takeaway) && (
        <div className="cf-mini-caption">{visual.caption || takeaway}</div>
      )}
    </div>
  );
}

export default function ConceptFlashcards({
  topic = '',
  cards = [],
  accentColor = '#7c3aed',
  intervalMs = 5500,
}) {
  const [navState, setNavState] = useState({ topicKey: topic, idx: 0, dir: 'next', tick: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // Sync reduced-motion OS preference cleanly
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Derive active index directly against current `topic` so topic switches NEVER show stale indices
  const safeIdx =
    cards.length > 0 && navState.topicKey === topic ? navState.idx % cards.length : 0;
  const direction = navState.topicKey === topic ? navState.dir : 'next';

  useEffect(() => {
    if (cards.length <= 1 || isPaused || prefersReducedMotion) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setNavState((prev) => {
        const current = prev.topicKey === topic ? prev.idx % cards.length : 0;
        return {
          topicKey: topic,
          idx: (current + 1) % cards.length,
          dir: 'next',
          tick: prev.tick,
        };
      });
    }, intervalMs);

    return () => clearTimeout(timer);
  }, [topic, safeIdx, navState.tick, isPaused, prefersReducedMotion, cards.length, intervalMs]);

  if (!cards.length) return null;

  const card = cards[safeIdx];
  const TopicIcon = ICON_MAP[card.icon] || Layers;

  const goPrev = () => {
    setNavState((prev) => ({
      topicKey: topic,
      idx: (safeIdx - 1 + cards.length) % cards.length,
      dir: 'prev',
      tick: prev.tick + 1,
    }));
  };

  const goNext = () => {
    setNavState((prev) => ({
      topicKey: topic,
      idx: (safeIdx + 1) % cards.length,
      dir: 'next',
      tick: prev.tick + 1,
    }));
  };

  const goToIndex = (targetIdx) => {
    if (targetIdx === safeIdx) return;
    setNavState((prev) => ({
      topicKey: topic,
      idx: targetIdx,
      dir: targetIdx < safeIdx ? 'prev' : 'next',
      tick: prev.tick + 1,
    }));
  };

  return (
    <aside
      className="cf-root"
      style={{ '--cf-accent': accentColor }}
      aria-label="Topic Concept Flashcards"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsPaused(false);
        }
      }}
    >
      <div className="cf-stage">
        <div className="cf-float-wrap">
          <article
            key={`${topic}-${card.id}`}
            className={`cf-card ${direction === 'prev' ? 'dir-prev' : ''}`}
            data-tint={card.tint || 'cream'}
            aria-live="polite"
          >
            <header className="cf-card-top">
              <div className="cf-top-left">
                <span className="cf-icon-chip" aria-hidden="true">
                  <TopicIcon size={13} strokeWidth={2.4} />
                </span>
                <span className="cf-topic-pill">{card.topicLabel}</span>
              </div>
              <div className="cf-top-right">
                <span className="cf-sparkle" aria-hidden="true">
                  <Sparkles size={12} strokeWidth={2.3} />
                </span>
                <span className="cf-card-badge">
                  {safeIdx + 1}/{cards.length}
                </span>
              </div>
            </header>

            <div className="cf-card-body">
              <div className="cf-title-row">
                <h3 className="cf-title">{card.title}</h3>
                <span className="cf-pause-pill" aria-hidden="true">
                  PAUSED
                </span>
              </div>

              <p className="cf-copy">{card.content}</p>

              {renderVisual(card.visual, card.takeaway)}
            </div>
          </article>
        </div>
      </div>

      <div className="cf-controls">
        <button
          type="button"
          className="cf-nav-btn"
          onClick={goPrev}
          aria-label="Previous concept flashcard"
          title="Previous card"
        >
          <ChevronLeft size={14} strokeWidth={2.5} />
        </button>

        <div className="cf-dots" role="tablist" aria-label="Choose concept flashcard">
          {cards.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={idx === safeIdx}
              aria-label={`Card ${idx + 1}: ${item.title}`}
              className={`cf-dot ${idx === safeIdx ? 'active' : ''}`}
              onClick={() => goToIndex(idx)}
            />
          ))}
        </div>

        <button
          type="button"
          className="cf-nav-btn"
          onClick={goNext}
          aria-label="Next concept flashcard"
          title="Next card"
        >
          <ChevronRight size={14} strokeWidth={2.5} />
        </button>
      </div>
    </aside>
  );
}

