import { motion as Motion, useReducedMotion } from 'framer-motion';
import { Zap, Lock, Unlock } from 'lucide-react';
import './BattleTokenCounter.css';

export default function BattleTokenCounter({ tokens = 0, maxTokens = 5, size = 'md', showLabel = true }) {
  const prefersReducedMotion = useReducedMotion();
  const current = Math.min(Math.max(0, tokens), maxTokens);
  const isFullyCharged = tokens >= maxTokens;

  return (
    <div className={`btc-container size-${size} ${isFullyCharged ? 'fully-charged' : ''}`}>
      {showLabel && (
        <div className="btc-header">
          <div className="btc-title">
            <Zap size={size === 'sm' ? 12 : 13} className="btc-icon" fill="currentColor" />
            <span>BATTLE TOKENS</span>
          </div>
          <div className="btc-header-right">
            <span className={`btc-state-pill ${isFullyCharged ? 'is-unlocked' : 'is-locked'}`}>
              {isFullyCharged ? <Unlock size={10} /> : <Lock size={10} />}
              <span>{isFullyCharged ? 'CHARGED' : 'LOCKED'}</span>
            </span>
            <div className="btc-count">
              <span className="btc-current">{tokens}</span>
              <span className="btc-max">/{maxTokens}</span>
            </div>
          </div>
        </div>
      )}

      <div className="btc-body">
        <div
          className="btc-pips-row"
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={maxTokens}
          aria-label="Battle Tokens Progress"
        >
          {[...Array(maxTokens)].map((_, i) => {
            const filled = i < current;
            return (
              <Motion.div
                key={i}
                className={`btc-pip ${filled ? 'filled' : 'empty'}`}
                initial={prefersReducedMotion ? false : { scaleY: 0.4, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={prefersReducedMotion ? { duration: 0 } : { delay: i * 0.05, duration: 0.2 }}
              >
                <span className="btc-pip-index">0{i + 1}</span>
                {filled && !prefersReducedMotion && (
                  <Motion.div
                    className="btc-pip-inner"
                    animate={{ opacity: [0.65, 1, 0.65] }}
                    transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.25 }}
                  />
                )}
              </Motion.div>
            );
          })}
        </div>

        <p className="btc-explain">
          {isFullyCharged
            ? 'All 5 token slots are full. Championship entry is ready.'
            : 'Earn +1 token for every Normal PvP win to charge championship entry.'}
        </p>
      </div>

      <div className="btc-footer">
        <div className="btc-progress-track">
          <Motion.div
            className="btc-progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${(current / maxTokens) * 100}%` }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <span className="btc-footer-note">
          {isFullyCharged ? '5 / 5 READY' : `${current} / ${maxTokens} STORED`}
        </span>
      </div>
    </div>
  );
}
