import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Flame, Trophy, Crown,
  ShieldAlert, Lock, ArrowRight, ArrowUpRight
} from 'lucide-react';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { useProgress } from '../../context/ProgressContext';
import { useUser } from '@clerk/clerk-react';
import BattleTokenCounter from '../../components/Battle/BattleTokenCounter';
import MedalBadge from '../../components/Battle/MedalBadge';
import TacticalRadar from '../../components/Battle/TacticalRadar';
import './BattleLobby.css';

/* ─── Geometric Mode Illustrations (Clean Editorial Line Art) ──────────────── */
function ModeVisual({ variant }) {
  if (variant === 'duel') {
    return (
      <svg className="mode-svg-art" viewBox="0 0 88 52" fill="none" aria-hidden="true">
        <rect x="4" y="8" width="22" height="36" stroke="currentColor" strokeWidth="1.5" />
        <rect x="62" y="8" width="22" height="36" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="44" cy="26" r="10" stroke="#FFE500" strokeWidth="1.5" />
        <path d="M26 26H62M44 10V42" stroke="currentColor" strokeWidth="1.25" strokeDasharray="3 3" />
        <rect x="41" y="23" width="6" height="6" fill="#00F0A0" />
      </svg>
    );
  }
  if (variant === 'duo') {
    return (
      <svg className="mode-svg-art" viewBox="0 0 88 52" fill="none" aria-hidden="true">
        <circle cx="28" cy="26" r="14" stroke="#00F0A0" strokeWidth="1.5" />
        <circle cx="60" cy="26" r="14" stroke="currentColor" strokeWidth="1.5" />
        <path d="M28 26H60" stroke="#00F0A0" strokeWidth="1.5" />
        <circle cx="28" cy="26" r="3" fill="#00F0A0" />
        <circle cx="60" cy="26" r="3" fill="#F5F5F5" />
        <path d="M44 10V42" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
      </svg>
    );
  }
  if (variant === 'squad') {
    return (
      <svg className="mode-svg-art" viewBox="0 0 88 52" fill="none" aria-hidden="true">
        <rect x="6" y="8" width="14" height="14" stroke="#FF6B00" strokeWidth="1.5" />
        <rect x="6" y="30" width="14" height="14" stroke="#FF6B00" strokeWidth="1.5" />
        <rect x="68" y="8" width="14" height="14" stroke="currentColor" strokeWidth="1.5" />
        <rect x="68" y="30" width="14" height="14" stroke="currentColor" strokeWidth="1.5" />
        <path d="M20 15L44 26L20 37M68 15L44 26L68 37" stroke="currentColor" strokeWidth="1.25" />
        <rect x="41" y="23" width="6" height="6" fill="#FFE500" />
      </svg>
    );
  }
  if (variant === 'bg-duel') {
    return (
      <svg className="mode-svg-art" viewBox="0 0 88 52" fill="none" aria-hidden="true">
        <polygon points="44,4 78,26 44,48 10,26" stroke="#FF6B00" strokeWidth="1.5" />
        <circle cx="44" cy="26" r="9" stroke="#FFE500" strokeWidth="1.5" />
        <circle cx="44" cy="26" r="2.5" fill="#FFE500" />
      </svg>
    );
  }
  return (
    <svg className="mode-svg-art" viewBox="0 0 88 52" fill="none" aria-hidden="true">
      <polygon points="44,6 76,26 44,46 12,26" stroke="#FFE500" strokeWidth="1.5" />
      <rect x="33" y="15" width="22" height="22" stroke="#00F0A0" strokeWidth="1.5" />
      <path d="M12 26H76" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
    </svg>
  );
}

/* ─── Mode Definitions ───────────────────────────────────────────────────── */
const NORMAL_MODES = [
  {
    id: '1v1',
    num: '01',
    visual: 'duel',
    title: '1V1 DUEL',
    subtitle: 'SOLO VS SOLO',
    description: 'Pure individual skill. Solve faster. Deal more damage.',
    accentClass: 'mode-accent-yellow',
    players: '2 PLAYERS',
    badge: '+1 BATTLE TOKEN',
    cta: 'FIND MATCH',
    indicator: 'RANKED',
    isPrimary: true,
  },
  {
    id: 'duo',
    num: '02',
    visual: 'duo',
    title: 'DUO MODE',
    subtitle: 'COOPERATIVE',
    description: 'Team up. Solve together. Win together.',
    accentClass: 'mode-accent-green',
    players: '2 PLAYERS',
    badge: 'SHARED REWARD',
    cta: 'FIND MATCH',
    indicator: 'COOPERATIVE',
    isPrimary: false,
  },
  {
    id: '2v2',
    num: '03',
    visual: 'squad',
    title: '2V2 BATTLE',
    subtitle: 'TEAM VS TEAM',
    description: 'Coordinate attacks and dominate the opposing team.',
    accentClass: 'mode-accent-orange',
    players: '4 PLAYERS',
    badge: '+1 BATTLE TOKEN',
    cta: 'FIND MATCH',
    indicator: 'RANKED',
    isPrimary: false,
  },
];

const BATTLE_GROUND_MODES = [
  {
    id: 'bg_1v1',
    num: '01',
    visual: 'bg-duel',
    Icon: Flame,
    title: '1V1 BATTLE GROUND',
    subtitle: 'CHAMPIONSHIP DUEL',
    description: 'Premier elimination duel. Hard/Master problem pool. Winner earns Gold Medal, 500 Coins, 1000 XP.',
    accentClass: 'mode-accent-orange',
    players: '2 WARRIORS',
    badge: 'GOLD / SILVER MEDAL',
    cta: 'ENTER BATTLE GROUND',
    cost: '5 TOKENS',
  },
  {
    id: 'bg_2v2',
    num: '02',
    visual: 'bg-squad',
    Icon: Crown,
    title: '2V2 BATTLE GROUND',
    subtitle: 'ELITE SQUAD WARS',
    description: '4-player high-stakes elimination. Team combos, synchronized coding. Winning squad claims Gold Medals.',
    accentClass: 'mode-accent-yellow',
    players: '4 WARRIORS',
    badge: 'SQUAD MEDALS · 500 COINS',
    cta: 'ENTER BATTLE GROUND',
    cost: '5 TOKENS',
  },
];

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function BattleLobby() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const modesRef = useRef(null);
  const { progress } = useProgress();
  const { user } = useUser();
  const {
    status,
    mode,
    room,
    queueSize,
    isBattleGround,
    tokenError,
    findMatch,
    findBattleGroundMatch,
    cancelSearch,
  } = useMultiplayer();

  const [activeTab, setActiveTab] = useState('normal'); // 'normal' | 'battleground'
  const [selectedMode, setSelectedMode] = useState(null);
  const [hoveredMode, setHoveredMode] = useState(null);

  const userTokens = progress?.battleTokens || 0;
  const maxTokens = 5;
  const winsNeeded = Math.max(0, maxTokens - userTokens);
  const hasEntryTokens = userTokens >= maxTokens;
  const tokenPercent = Math.min(100, (userTokens / maxTokens) * 100);

  // Navigate to arena when match becomes active
  useEffect(() => {
    if (status === 'active' && room) {
      if (room.isBattleGround || isBattleGround) {
        navigate('/battleground/' + room.roomId, { state: { room } });
      } else {
        navigate('/battle/' + room.roomId, { state: { room } });
      }
    }
  }, [status, room, isBattleGround, navigate]);

  const handleQueueBattleGround = (bgModeId) => {
    if (!hasEntryTokens) return;
    findBattleGroundMatch(bgModeId);
  };

  const handleFindMatch = (modeId) => {
    setSelectedMode(modeId);
    findMatch(modeId);
  };

  const handleEnterArena = () => {
    modesRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const displayName = user?.username || user?.fullName || 'Hunter';
  const avatarInitial = displayName[0].toUpperCase();
  const level = progress?.level || 1;
  const rankTier = progress?.rank || 'BRONZE';
  const coins = progress?.coins || 0;
  const xp = progress?.xp || 0;

  return (
    <div className="arena-page">
      {/* Subtle architectural background grid */}
      <div className="arena-bg-grid" aria-hidden="true" />

      <div className="arena-inner">

        {/* ── 01. Editorial Arena Hero ─────────────────────────────────────── */}
        <Motion.header
          className="arena-hero"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Minimal geometric reticle lines in hero backdrop */}
          <div className="arena-hero-geo" aria-hidden="true">
            <span className="geo-ring" />
            <span className="geo-cross-h" />
            <span className="geo-cross-v" />
            <span className="geo-tick geo-tick-tl">+</span>
            <span className="geo-tick geo-tick-tr">+</span>
            <span className="geo-tick geo-tick-bl">+</span>
            <span className="geo-tick geo-tick-br">+</span>
          </div>

          <div className="arena-hero-topbar">
            <div className="arena-eyebrow">
              <span className="arena-eyebrow-slash">/</span>
              <span>CODE2LIVING / COMPETITIVE ZONE</span>
            </div>

            <div className="arena-live-pill">
              <span className="arena-live-dot" />
              <span>LIVE / COMPETITIVE MODE</span>
            </div>
          </div>

          <div className="arena-hero-stage">
            <div className="arena-hero-primary">
              <h1 className="arena-hero-title">
                BATTLE<br />
                <span className="arena-hero-title-accent">ARENA</span>
                <span className="arena-hero-period">.</span>
              </h1>

              <p className="arena-hero-tagline">
                &ldquo;Think faster. Code smarter. Outplay everyone.&rdquo;
              </p>

              <div className="arena-hero-actions">
                <button
                  type="button"
                  className="arena-hero-cta"
                  onClick={handleEnterArena}
                >
                  <span>ENTER THE ARENA</span>
                  <ArrowUpRight size={17} strokeWidth={2.2} className="arena-hero-cta-arrow" />
                </button>

                <div className="arena-hero-indices">
                  <div className="hero-index-cell">
                    <span className="hero-index-val">03</span>
                    <span className="hero-index-lbl">MODES</span>
                  </div>
                  <div className="hero-index-cell">
                    <span className="hero-index-val">05</span>
                    <span className="hero-index-lbl">TOKENS TO APEX</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="arena-hero-radar-col">
              <TacticalRadar
                variant="lobby"
                activeMode={hoveredMode || selectedMode}
              />
            </div>
          </div>
        </Motion.header>

        {/* ── 02. Horizontal Player Profile & Telemetry Strip ──────────────── */}
        <Motion.section
          className="arena-profile-strip"
          aria-label="Player Profile and Statistics"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
        >
          {/* Combatant Identity */}
          <div className="profile-identity-cell">
            <div className="profile-avatar-frame">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt={displayName} className="profile-avatar-img" />
              ) : (
                <span className="profile-avatar-monogram">{avatarInitial}</span>
              )}
              <span className="profile-online-dot" aria-hidden="true" />
            </div>

            <div className="profile-identity-meta">
              <div className="profile-identity-kicker">COMBATANT</div>
              <div className="profile-identity-name">{displayName}</div>
              <div className="profile-identity-tags">
                <span className="profile-tag-rank">RANK #{level}</span>
                <span className="profile-tag-tier">{rankTier}</span>
                <span className="profile-tag-lvl">LVL {level}</span>
              </div>
            </div>
          </div>

          {/* Horizontal Telemetry Metrics */}
          <div className="profile-metrics-grid">
            <div className="profile-metric-cell">
              <span className="profile-metric-lbl">TOTAL COINS</span>
              <span className="profile-metric-val val-yellow">{coins.toLocaleString()}</span>
            </div>
            <div className="profile-metric-cell">
              <span className="profile-metric-lbl">TOTAL XP</span>
              <span className="profile-metric-val">{xp.toLocaleString()}</span>
            </div>
            <div className="profile-metric-cell">
              <span className="profile-metric-lbl">BATTLE TOKENS</span>
              <span className={`profile-metric-val ${hasEntryTokens ? 'val-green' : 'val-orange'}`}>
                {userTokens}<span className="profile-metric-den">/{maxTokens}</span>
              </span>
            </div>
          </div>

          {/* Medals Achievement Ledger */}
          <div className="profile-achievements-cell">
            <span className="profile-metric-lbl">ACHIEVEMENTS</span>
            <div className="profile-medals-row">
              <MedalBadge type="gold" count={progress?.goldMedals || 0} size="sm" showZero />
              <MedalBadge type="silver" count={progress?.silverMedals || 0} size="sm" showZero />
              <MedalBadge type="bronze" count={progress?.bronzeMedals || 0} size="sm" showZero />
            </div>
          </div>
        </Motion.section>

        {/* ── 03. Battle Tokens & Battle Ground Vault Strip ────────────────── */}
        <section className="arena-vault-grid" aria-label="Battle Tokens and Battle Ground Status">
          <div className="vault-token-col">
            <BattleTokenCounter tokens={userTokens} maxTokens={maxTokens} size="md" />
          </div>

          <div className={`vault-bg-preview ${hasEntryTokens ? 'is-unlocked' : 'is-locked'}`}>
            <div className="vault-bg-top">
              <div className="vault-bg-kicker">
                {hasEntryTokens ? (
                  <>
                    <span className="vault-status-dot unlocked" />
                    <span>APEX VAULT // UNLOCKED</span>
                  </>
                ) : (
                  <>
                    <Lock size={12} />
                    <span>APEX VAULT // CLASSIFIED PREVIEW</span>
                  </>
                )}
              </div>
              <span className="vault-bg-ratio">{userTokens}/{maxTokens} TOKENS</span>
            </div>

            <div className="vault-bg-body">
              <div className="vault-bg-title">
                {hasEntryTokens ? 'BATTLE GROUND READY' : 'BATTLE GROUND LOCKED'}
              </div>
              <p className="vault-bg-copy">
                {hasEntryTokens
                  ? '5 Battle Tokens charged. Enter championship 1V1 or 2V2 elimination for Gold Medals, 500 Coins & 1000 XP.'
                  : `${winsNeeded} more Normal PvP win${winsNeeded !== 1 ? 's' : ''} required to unlock high-stakes championship elimination.`}
              </p>
              <div className="vault-bg-stakes-row">
                <span className="vault-stake-chip">HARD POOL</span>
                <span className="vault-stake-chip">+500 COINS</span>
                <span className="vault-stake-chip">+1000 XP</span>
                <span className="vault-stake-chip">GOLD MEDAL</span>
              </div>
            </div>

            <div className="vault-bg-footer">
              <div className="vault-bg-meter">
                <div className="vault-bg-meter-track">
                  <div className="vault-bg-meter-fill" style={{ width: `${tokenPercent}%` }} />
                </div>
                <span className="vault-bg-meter-pct">{Math.round(tokenPercent)}% CHARGED</span>
              </div>

              <button
                type="button"
                className={`vault-bg-action ${hasEntryTokens ? 'ready' : ''}`}
                onClick={() => {
                  setActiveTab('battleground');
                  modesRef.current?.scrollIntoView({
                    behavior: prefersReducedMotion ? 'auto' : 'smooth',
                    block: 'start',
                  });
                }}
              >
                <span>{hasEntryTokens ? 'ENTER BATTLE GROUND' : 'PREVIEW STAKES'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* Token Error Alert */}
        {tokenError && (
          <Motion.div
            className="arena-token-error"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ShieldAlert size={15} />
            <span>{tokenError}</span>
          </Motion.div>
        )}

        {/* ── 04. Mode Switch Tabs & Combat Modes Section ──────────────────── */}
        <div id="arena-modes-section" ref={modesRef} className="arena-modes-anchor">
          {status === 'idle' && (
            <div className="arena-tabs" role="tablist" aria-label="Arena Queue Types">
              <button
                type="button"
                id="tab-normal"
                role="tab"
                aria-selected={activeTab === 'normal'}
                className={`arena-tab ${activeTab === 'normal' ? 'active' : ''}`}
                onClick={() => setActiveTab('normal')}
              >
                <span className="arena-tab-index">01</span>
                <span>NORMAL PvP</span>
                <span className="arena-tab-pill">EARN TOKENS</span>
              </button>
              <button
                type="button"
                id="tab-battleground"
                role="tab"
                aria-selected={activeTab === 'battleground'}
                className={`arena-tab arena-tab-bg ${activeTab === 'battleground' ? 'active' : ''} ${hasEntryTokens ? 'tab-unlocked' : 'tab-locked'}`}
                onClick={() => setActiveTab('battleground')}
              >
                <span className="arena-tab-index">02</span>
                <span>BATTLE GROUND</span>
                <span className="arena-tab-pill pill-bg">
                  {hasEntryTokens ? 'READY' : `${userTokens}/${maxTokens} LOCKED`}
                </span>
              </button>
            </div>
          )}

          {/* ── Content Area ───────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">

            {/* Normal PvP Modes — Asymmetric Editorial Gaming Panels */}
            {status === 'idle' && activeTab === 'normal' && (
              <Motion.div
                key="normal"
                className="mode-section"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mode-section-header">
                  <div className="mode-section-title-wrap">
                    <span className="mode-section-kicker">SELECT ENGAGEMENT</span>
                    <span className="mode-section-label">CHOOSE YOUR BATTLE MODE</span>
                  </div>
                  <span className="mode-section-count">03 MODES ACTIVE</span>
                </div>

                <div className="mode-grid-asymmetric">
                  {NORMAL_MODES.map((card, i) => (
                    <Motion.button
                      key={card.id}
                      type="button"
                      id={`mode-card-${card.id}`}
                      className={`mode-panel ${card.accentClass} ${card.isPrimary ? 'mode-panel-primary' : ''} ${selectedMode === card.id ? 'mode-panel-selected' : ''}`}
                      onClick={() => handleFindMatch(card.id)}
                      onMouseEnter={() => setHoveredMode(card.id)}
                      onMouseLeave={() => setHoveredMode(null)}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={prefersReducedMotion ? { duration: 0 } : { delay: i * 0.06, duration: 0.25 }}
                    >
                      <div className="mode-panel-bg-pattern" aria-hidden="true" />

                      {/* Header row: massive number + angled arrow */}
                      <div className="mode-panel-head">
                        <div className="mode-panel-index-group">
                          <span className="mode-panel-num">{card.num}</span>
                          <span className="mode-panel-subtitle">{card.subtitle}</span>
                        </div>
                        <span className="mode-panel-corner-arrow" aria-hidden="true">
                          <ArrowUpRight size={20} strokeWidth={1.75} />
                        </span>
                      </div>

                      {/* Geometric illustration + Badges */}
                      <div className="mode-panel-visual-row">
                        <div className="mode-panel-art">
                          <ModeVisual variant={card.visual} />
                        </div>
                        <div className="mode-panel-tags">
                          <span className="mode-tag mode-tag-players">{card.players}</span>
                          <span className="mode-tag mode-tag-type">{card.indicator}</span>
                        </div>
                      </div>

                      {/* Oversized heading & description */}
                      <div className="mode-panel-body">
                        <h2 className="mode-panel-title">{card.title}</h2>
                        <p className="mode-panel-desc">{card.description}</p>
                      </div>

                      {/* Footer: reward info & CTA */}
                      <div className="mode-panel-footer">
                        <div className="mode-panel-reward">
                          <span className="mode-reward-lbl">REWARD</span>
                          <span className="mode-reward-val">{card.badge}</span>
                        </div>
                        <span className="mode-panel-cta">
                          <span>{card.cta}</span>
                          <ArrowRight size={15} className="mode-cta-arrow" />
                        </span>
                      </div>
                    </Motion.button>
                  ))}
                </div>
              </Motion.div>
            )}

            {/* Battle Ground Modes */}
            {status === 'idle' && activeTab === 'battleground' && (
              <Motion.div
                key="battleground"
                className="bg-section"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <div className={`bg-tournament-banner ${hasEntryTokens ? 'banner-ready' : 'banner-locked'}`}>
                  <div className="bg-banner-left">
                    <div className="bg-banner-tag">
                      <Trophy size={13} />
                      <span>APEX TOURNAMENT ARENA</span>
                    </div>
                    <h2 className="bg-banner-heading">ENTER THE BATTLE GROUND</h2>
                    <p className="bg-banner-desc">
                      Entry fee: <strong>5 Battle Tokens</strong>. Hard problem pool, sudden death elimination, and permanent Gold / Silver medals for champions.
                    </p>
                  </div>

                  {!hasEntryTokens && (
                    <div className="bg-banner-locked-msg">
                      <Lock size={18} />
                      <div>
                        <div className="bg-lock-title">ENTRY LOCKED</div>
                        <div className="bg-lock-sub">
                          Win {winsNeeded} more PvP battle{winsNeeded !== 1 ? 's' : ''} to unlock
                        </div>
                      </div>
                      <button
                        type="button"
                        className="bg-go-pvp-btn"
                        onClick={() => setActiveTab('normal')}
                      >
                        <span>PLAY NORMAL PvP</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mode-grid-2">
                  {BATTLE_GROUND_MODES.map((card, i) => (
                    <Motion.button
                      key={card.id}
                      type="button"
                      id={`mode-card-${card.id}`}
                      className={`mode-panel ${card.accentClass} bg-mode-card ${!hasEntryTokens ? 'mode-card-disabled' : ''}`}
                      onClick={() => handleQueueBattleGround(card.id)}
                      disabled={!hasEntryTokens}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={prefersReducedMotion ? { duration: 0 } : { delay: i * 0.08, duration: 0.25 }}
                    >
                      <div className="mode-panel-bg-pattern" aria-hidden="true" />

                      <div className="mode-panel-head">
                        <div className="mode-panel-index-group">
                          <span className="mode-panel-num">{card.num}</span>
                          <span className="mode-panel-subtitle">{card.subtitle}</span>
                        </div>
                        <span className="mode-panel-corner-arrow" aria-hidden="true">
                          <card.Icon size={18} strokeWidth={1.75} />
                        </span>
                      </div>

                      <div className="mode-panel-visual-row">
                        <div className="mode-panel-art">
                          <ModeVisual variant={card.visual} />
                        </div>
                        <div className="mode-panel-tags">
                          <span className="mode-tag mode-tag-players">{card.players}</span>
                          <span className="mode-tag mode-tag-cost">{card.cost}</span>
                        </div>
                      </div>

                      <div className="mode-panel-body">
                        <h3 className="mode-panel-title">{card.title}</h3>
                        <p className="mode-panel-desc">{card.description}</p>
                      </div>

                      <div className="mode-panel-footer">
                        <div className="mode-panel-reward">
                          <span className="mode-reward-lbl">STAKES</span>
                          <span className="mode-reward-val">{card.badge}</span>
                        </div>
                        <span className={`mode-panel-cta ${!hasEntryTokens ? 'cta-locked' : 'cta-bg'}`}>
                          {hasEntryTokens ? (
                            <>
                              <span>{card.cta}</span>
                              <ArrowRight size={15} className="mode-cta-arrow" />
                            </>
                          ) : (
                            <>
                              <Lock size={13} />
                              <span>LOCKED</span>
                            </>
                          )}
                        </span>
                      </div>
                    </Motion.button>
                  ))}
                </div>
              </Motion.div>
            )}

            {/* ── Matchmaking Queue ────────────────────────────────────────── */}
            {status === 'searching' && (
              <Motion.div
                key="searching"
                className={`mm-panel ${isBattleGround ? 'mm-panel-bg' : ''}`}
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0 }}
              >
                <div className="mm-radar-wrap">
                  <TacticalRadar
                    variant="searching"
                    activeMode={mode}
                    queueSize={queueSize}
                    requiredPlayers={mode === '2v2' || mode === 'bg_2v2' ? 4 : 2}
                    isBattleGround={isBattleGround}
                  />
                </div>
                <div className="mm-search-tag">
                  {isBattleGround ? 'BATTLE GROUND TOURNAMENT' : 'STANDARD MATCHMAKING'}
                </div>
                <div className="mm-search-title">
                  {isBattleGround
                    ? mode === 'bg_1v1' ? 'SEARCHING FOR DUEL OPPONENT' : 'ASSEMBLING SQUAD TEAMS'
                    : mode === '1v1' ? 'FINDING OPPONENT'
                    : mode === 'duo' ? 'FINDING CO-OP PARTNER'
                    : 'ASSEMBLING TEAMS'}
                </div>
                <div className="mm-slots">
                  {[...Array(mode === '2v2' || mode === 'bg_2v2' ? 4 : 2)].map((_, i) => (
                    <div
                      key={i}
                      className={`mm-slot ${i === 0 ? 'slot-me' : i < queueSize ? 'slot-filled' : 'slot-empty'}`}
                    >
                      {i === 0 ? avatarInitial : i < queueSize ? '?' : '+'}
                    </div>
                  ))}
                </div>
                <div className="mm-queue-count">
                  {queueSize}/{mode === '2v2' || mode === 'bg_2v2' ? 4 : 2} PLAYERS IN QUEUE
                </div>
                <button type="button" className="mm-cancel-btn" onClick={cancelSearch}>
                  Cancel Search
                </button>
              </Motion.div>
            )}

            {/* ── Match Found ──────────────────────────────────────────────── */}
            {status === 'found' && (
              <Motion.div
                key="found"
                className={`mm-panel mm-panel-found ${isBattleGround ? 'mm-panel-bg-found' : ''}`}
                initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 24 }}
              >
                <div className="mm-found-badge">
                  {isBattleGround ? 'BATTLE GROUND MATCH READY' : 'MATCH FOUND'}
                </div>
                <div className="mm-search-title">
                  {isBattleGround ? 'COMMENCING TOURNAMENT' : 'PREPARING ARENA'}
                </div>
                <p className="mm-found-sub">Deducting tokens and establishing secure combat grid...</p>
                <div className="mm-progress-bar">
                  <Motion.div
                    className="mm-progress-fill"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 2, ease: 'easeInOut' }}
                  />
                </div>
              </Motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
