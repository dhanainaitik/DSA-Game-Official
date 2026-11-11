import './TacticalRadar.css';

// Visual demo signals rendered purely as radar dots (no text/labels inside scope)
const DEMO_SIGNALS = {
  default: [
    { id: 'sig-1', x: 28, y: 31, tone: 'green',  delay: '0.2s', glintDelay: '3.2s', pulse: true },
    { id: 'sig-2', x: 74, y: 27, tone: 'yellow', delay: '0.9s', glintDelay: '0.5s', pulse: true },
    { id: 'sig-3', x: 71, y: 70, tone: 'green',  delay: '1.6s', glintDelay: '1.5s', pulse: false },
    { id: 'sig-4', x: 31, y: 72, tone: 'orange', delay: '2.2s', glintDelay: '2.4s', pulse: true },
    { id: 'sig-5', x: 52, y: 20, tone: 'green',  delay: '2.8s', glintDelay: '0.1s', pulse: false },
  ],
  '1v1': [
    { id: 'd-1', x: 35, y: 38, tone: 'yellow', delay: '0s',   glintDelay: '3.2s', pulse: true },
    { id: 'd-2', x: 69, y: 63, tone: 'green',  delay: '0.9s', glintDelay: '1.4s', pulse: true },
  ],
  duo: [
    { id: 'u-1', x: 34, y: 42, tone: 'green',  delay: '0s',   glintDelay: '3.0s', pulse: true },
    { id: 'u-2', x: 66, y: 42, tone: 'green',  delay: '0.7s', glintDelay: '0.7s', pulse: true },
    { id: 'u-3', x: 50, y: 74, tone: 'yellow', delay: '1.4s', glintDelay: '1.9s', pulse: true },
  ],
  '2v2': [
    { id: 's-1', x: 28, y: 34, tone: 'orange', delay: '0.2s', glintDelay: '3.2s', pulse: true },
    { id: 's-2', x: 28, y: 66, tone: 'orange', delay: '0.8s', glintDelay: '2.5s', pulse: false },
    { id: 's-3', x: 72, y: 34, tone: 'green',  delay: '1.4s', glintDelay: '0.5s', pulse: true },
    { id: 's-4', x: 72, y: 66, tone: 'green',  delay: '2.0s', glintDelay: '1.4s', pulse: false },
  ],
};

const PERIMETER_TICKS = Array.from({ length: 72 }, (_, i) => i * 5);
const RADIAL_SPOKES = Array.from({ length: 8 }, (_, i) => i * 45);
const CONCENTRIC_RADII = [12, 23, 34, 44];

export default function TacticalRadar({
  variant = 'lobby',
  activeMode = null,
  queueSize = 0,
  requiredPlayers = 2,
  isBattleGround = false,
}) {
  const normalizedMode =
    activeMode === 'bg_1v1' ? '1v1'
    : activeMode === 'bg_2v2' ? '2v2'
    : activeMode;

  const isSearching = variant === 'searching';

  const signals = isSearching
    ? Array.from({ length: requiredPlayers }, (_, i) => {
        const angle = ((i / requiredPlayers) * Math.PI * 2) - Math.PI / 4;
        const radius = 29;
        const x = Math.round(50 + Math.cos(angle) * radius);
        const y = Math.round(50 + Math.sin(angle) * radius);
        const matched = i === 0 || i < queueSize;
        const degClockwiseFromTop = ((angle * 180) / Math.PI + 90 + 360) % 360;
        return {
          id: `slot-${i}`,
          x,
          y,
          tone: i === 0 ? 'yellow' : matched ? (isBattleGround ? 'orange' : 'green') : 'muted',
          delay: `${(i * 0.45).toFixed(2)}s`,
          glintDelay: `${((degClockwiseFromTop / 360) * 2.4).toFixed(2)}s`,
          pulse: matched,
        };
      })
    : (DEMO_SIGNALS[normalizedMode] || DEMO_SIGNALS.default);

  const radarAccentClass =
    isBattleGround || normalizedMode === '2v2'
      ? 'radar-tone-orange'
      : normalizedMode === '1v1'
        ? 'radar-tone-yellow'
        : 'radar-tone-green';

  const signalCountLabel = String(signals.length).padStart(2, '0');

  return (
    <div
      className={`tactical-radar-shell variant-${variant} ${radarAccentClass}`}
      role="region"
      aria-label={isSearching ? 'Matchmaking queue radar' : 'Tactical radar visualization'}
    >
      {/* Telemetry Header Outside Radar Scope */}
      <div className="tr-topbar">
        <span className="tr-status">
          <span className="tr-status-dot" />
          <span>
            {isSearching
              ? `MATCHMAKING · ${queueSize}/${requiredPlayers}`
              : normalizedMode
                ? `MODE // ${normalizedMode.toUpperCase()}`
                : 'LIVE SCANNING'}
          </span>
        </span>
        <span className="tr-badge-meta">
          {isSearching ? (isBattleGround ? 'APEX QUEUE' : 'QUEUE ACTIVE') : 'DEMO SCAN'}
        </span>
      </div>

      {/* Pure Visual Circular Radar Scope (Zero Text Labels Inside) */}
      <div className="tr-scope-wrap">
        <div className="tr-outer-ring" aria-hidden="true" />
        <div className="tr-scope">
          <svg className="tr-grid-svg" viewBox="0 0 100 100" aria-hidden="true">
            {PERIMETER_TICKS.map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const isMajor = deg % 30 === 0;
              const rInner = isMajor ? 45.2 : 46.6;
              const rOuter = 48.8;
              return (
                <line
                  key={`t-${deg}`}
                  x1={50 + Math.cos(rad) * rInner}
                  y1={50 + Math.sin(rad) * rInner}
                  x2={50 + Math.cos(rad) * rOuter}
                  y2={50 + Math.sin(rad) * rOuter}
                  stroke="currentColor"
                  strokeWidth={isMajor ? '0.45' : '0.24'}
                  opacity={isMajor ? '0.65' : '0.32'}
                />
              );
            })}

            {CONCENTRIC_RADII.map((r) => (
              <circle
                key={`r-${r}`}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke="currentColor"
                strokeWidth="0.34"
                opacity="0.46"
              />
            ))}

            {RADIAL_SPOKES.map((deg) => {
              const rad = (deg * Math.PI) / 180;
              return (
                <line
                  key={`s-${deg}`}
                  x1="50"
                  y1="50"
                  x2={50 + Math.cos(rad) * 44}
                  y2={50 + Math.sin(rad) * 44}
                  stroke="currentColor"
                  strokeWidth="0.28"
                  opacity="0.36"
                />
              );
            })}
          </svg>

          {/* Continuously Rotating 360-Degree Radar Sweep */}
          <div className="tr-sweep-rotator" aria-hidden="true">
            <div className="tr-sweep-cone" />
            <div className="tr-sweep-beam" />
          </div>

          {/* Visual-Only Glowing Signal Dots */}
          {signals.map((dot) => (
            <span
              key={dot.id}
              className={`tr-blip tone-${dot.tone} ${dot.pulse ? 'has-pulse' : ''}`}
              style={{
                left: `${dot.x}%`,
                top: `${dot.y}%`,
                '--blip-delay': dot.delay,
                '--glint-delay': dot.glintDelay,
              }}
              aria-hidden="true"
            >
              {dot.pulse && <span className="tr-blip-pulse" />}
              <span className="tr-blip-core" />
            </span>
          ))}

          {/* Center Emitter */}
          <span className="tr-center-hub" aria-hidden="true" />
        </div>
      </div>

      {/* Telemetry Footer Outside Radar Scope */}
      <div className="tr-footer">
        <span className="tr-footer-metric">
          <strong>{signalCountLabel}</strong>{' '}
          {isSearching ? 'SLOTS TRACKED' : 'SIGNALS DETECTED'}
        </span>
        <span className="tr-footer-sweep">SWEEP ACTIVE</span>
      </div>
    </div>
  );
}
