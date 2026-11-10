import './TacticalRadar.css';

const LOBBY_CONTACTS = {
  default: [
    { id: 'c1', x: 26, y: 31, label: 'OP-74 // LVL 09', tone: 'green',  delay: '0.1s' },
    { id: 'c2', x: 74, y: 28, label: 'OP-19 // 1V1',    tone: 'green',  delay: '0.8s', lock: true },
    { id: 'c3', x: 72, y: 69, label: 'SQ-04 // 2V2',    tone: 'green',  delay: '1.5s' },
    { id: 'c4', x: 30, y: 71, label: 'DUO-2 // CO-OP',  tone: 'yellow', delay: '2.1s' },
    { id: 'c5', x: 52, y: 21, label: 'SCAN // SECTOR',  tone: 'green',  delay: '2.7s' },
  ],
  '1v1': [
    { id: 'd1', x: 34, y: 38, label: 'YOU // READY',      tone: 'yellow', delay: '0s' },
    { id: 'd2', x: 70, y: 62, label: 'RIVAL // DETECTED', tone: 'green',  delay: '0.8s', lock: true },
  ],
  duo: [
    { id: 'u1', x: 34, y: 44, label: 'ALLY-A // SYNCED', tone: 'green',  delay: '0s', lock: true },
    { id: 'u2', x: 66, y: 44, label: 'ALLY-B // CO-OP',  tone: 'green',  delay: '0.6s', lock: true },
    { id: 'u3', x: 50, y: 74, label: 'TARGET // GRID',   tone: 'yellow', delay: '1.4s' },
  ],
  '2v2': [
    { id: 's1', x: 26, y: 34, label: 'ALPHA-1', tone: 'orange', delay: '0.2s', lock: true },
    { id: 's2', x: 26, y: 66, label: 'ALPHA-2', tone: 'orange', delay: '0.6s', lock: true },
    { id: 's3', x: 74, y: 34, label: 'OMEGA-1', tone: 'green',  delay: '1.2s' },
    { id: 's4', x: 74, y: 66, label: 'OMEGA-2', tone: 'green',  delay: '1.8s' },
  ],
};

// Precomputed 120 perimeter degree ticks and 12 radial spokes with ring nodes
const PERIMETER_TICKS = Array.from({ length: 120 }, (_, i) => i * 3);
const RADIAL_SPOKES = Array.from({ length: 12 }, (_, i) => i * 30);
const CONCENTRIC_RADII = [10, 20, 30, 40];

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

  const contacts = variant === 'searching'
    ? Array.from({ length: requiredPlayers }, (_, i) => {
        const angle = ((i / requiredPlayers) * Math.PI * 2) - Math.PI / 4;
        const radius = 28;
        const x = Math.round(50 + Math.cos(angle) * radius);
        const y = Math.round(50 + Math.sin(angle) * radius);
        const locked = i === 0 || i < queueSize;
        return {
          id: `slot-${i}`,
          x,
          y,
          label: i === 0 ? 'SELF // LOCKED' : locked ? `OP-${i + 1} // SYNCED` : `SLOT-0${i + 1} // SCAN`,
          tone: i === 0 ? 'yellow' : locked ? (isBattleGround ? 'orange' : 'green') : 'muted',
          delay: `${i * 0.4}s`,
          lock: locked,
        };
      })
    : (LOBBY_CONTACTS[normalizedMode] || LOBBY_CONTACTS.default);

  const radarAccentClass =
    isBattleGround || normalizedMode === '2v2'
      ? 'radar-tone-orange'
      : normalizedMode === '1v1'
        ? 'radar-tone-yellow'
        : 'radar-tone-green';

  return (
    <div
      className={`tactical-radar-shell variant-${variant} ${radarAccentClass}`}
      role="region"
      aria-label="Live Competitive Matchmaking Radar"
    >
      {/* Top Telemetry Header */}
      <div className="tr-topbar">
        <span className="tr-status">
          <span className="tr-status-dot" />
          <span>
            {variant === 'searching'
              ? `LOCKING TARGETS · ${queueSize}/${requiredPlayers}`
              : normalizedMode
                ? `MODE LOCK // ${normalizedMode.toUpperCase()}`
                : 'SECTOR SCAN // ACTIVE'}
          </span>
        </span>
        <span className="tr-freq">
          {isBattleGround ? 'APEX-FREQ 5.0G' : 'NET 18MS'}
        </span>
      </div>

      {/* Circular Radar Canvas */}
      <div className="tr-scope-wrap">
        <div className="tr-scope">
          {/* Vector Radar Grid matching dark green radial scope */}
          <svg className="tr-grid-svg" viewBox="0 0 100 100" aria-hidden="true">
            {/* Outer graduated perimeter ticks */}
            {PERIMETER_TICKS.map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const isMajor = deg % 30 === 0;
              const rInner = isMajor ? 43.2 : 44.8;
              const rOuter = 47.4;
              return (
                <line
                  key={`t-${deg}`}
                  x1={50 + Math.cos(rad) * rInner}
                  y1={50 + Math.sin(rad) * rInner}
                  x2={50 + Math.cos(rad) * rOuter}
                  y2={50 + Math.sin(rad) * rOuter}
                  stroke="currentColor"
                  strokeWidth={isMajor ? '0.45' : '0.26'}
                  opacity={isMajor ? '0.7' : '0.42'}
                />
              );
            })}

            {/* Concentric range rings */}
            {CONCENTRIC_RADII.map((r) => (
              <circle
                key={`r-${r}`}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke="currentColor"
                strokeWidth="0.34"
                opacity="0.52"
              />
            ))}

            {/* 12 Radial spokes + bright intersection nodes */}
            {RADIAL_SPOKES.map((deg) => {
              const rad = (deg * Math.PI) / 180;
              return (
                <g key={`s-${deg}`}>
                  <line
                    x1="50"
                    y1="50"
                    x2={50 + Math.cos(rad) * 40}
                    y2={50 + Math.sin(rad) * 40}
                    stroke="currentColor"
                    strokeWidth="0.28"
                    opacity="0.45"
                  />
                  {CONCENTRIC_RADII.slice(1).map((r) => (
                    <circle
                      key={`n-${deg}-${r}`}
                      cx={50 + Math.cos(rad) * r}
                      cy={50 + Math.sin(rad) * r}
                      r="0.55"
                      fill="currentColor"
                      opacity="0.72"
                    />
                  ))}
                </g>
              );
            })}
          </svg>

          {/* Rotating Conic Sweep + Luminous Leading Beam */}
          <div className="tr-sweep-rotator" aria-hidden="true">
            <div className="tr-sweep-cone" />
            <div className="tr-sweep-beam" />
          </div>

          {/* Squad / Co-op Vector Lines */}
          {normalizedMode === 'duo' && (
            <svg className="tr-vector-overlay" viewBox="0 0 100 100" aria-hidden="true">
              <line x1="34" y1="44" x2="66" y2="44" stroke="#00F0A0" strokeWidth="0.65" strokeDasharray="2 2" />
            </svg>
          )}
          {normalizedMode === '2v2' && (
            <svg className="tr-vector-overlay" viewBox="0 0 100 100" aria-hidden="true">
              <line x1="26" y1="34" x2="26" y2="66" stroke="#FF6B00" strokeWidth="0.65" />
              <line x1="74" y1="34" x2="74" y2="66" stroke="#00F0A0" strokeWidth="0.65" />
              <line x1="26" y1="50" x2="74" y2="50" stroke="#777777" strokeWidth="0.45" strokeDasharray="2 2" />
            </svg>
          )}
          {normalizedMode === '1v1' && (
            <svg className="tr-vector-overlay" viewBox="0 0 100 100" aria-hidden="true">
              <line x1="34" y1="38" x2="70" y2="62" stroke="#FFE500" strokeWidth="0.6" strokeDasharray="2 2" />
            </svg>
          )}

          {/* Glowing Opponent / Teammate Detection Blips */}
          {contacts.map((blip) => (
            <div
              key={blip.id}
              className={`tr-blip tone-${blip.tone} ${blip.lock ? 'is-locked' : ''}`}
              style={{ left: `${blip.x}%`, top: `${blip.y}%`, '--blip-delay': blip.delay }}
            >
              <span className="tr-blip-pulse" aria-hidden="true" />
              <span className="tr-blip-core" aria-hidden="true" />
              {blip.lock && <span className="tr-blip-bracket" aria-hidden="true" />}
              <span className="tr-blip-tag">{blip.label}</span>
            </div>
          ))}

          {/* Center Emitter Hub */}
          <span className="tr-center-hub" aria-hidden="true" />
        </div>
      </div>

      {/* Bottom Signal Coordinates Bar */}
      <div className="tr-footer">
        <span className="tr-footer-metric">
          SIGNALS: <strong>{contacts.length}</strong> ACTIVE
        </span>
        <span className="tr-footer-coords">
          {normalizedMode ? `TARGET LOCK: ${normalizedMode.toUpperCase()}` : 'SWEEP: 360° LIVE'}
        </span>
      </div>
    </div>
  );
}
