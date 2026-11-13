import test from 'node:test';
import assert from 'node:assert/strict';
import { getProblemHint } from '../data/hints.js';

test('Item 1: Hint Scroll (hint_scroll) - Retrieves problem-specific hint and guards consumption', () => {
  // Test case A: Known question with valid hint
  const hintExisting = getProblemHint('p-arr-1-2');
  assert.ok(hintExisting && hintExisting.length > 0, 'Hint for p-arr-1-2 must exist');
  assert.match(hintExisting, /last|index|length/i, 'Hint content must be relevant to the problem');

  // Test case B: Question with custom hint in problem object
  const customProblem = { id: 'custom-1', hint: 'Look at the adjacent pointers' };
  const customHint = getProblemHint('custom-1', customProblem);
  assert.equal(customHint, 'Look at the adjacent pointers');

  // Test case C: Unknown question without hint
  const noHint = getProblemHint('unknown-problem-xyz-999', { title: 'Unknown' });
  assert.equal(noHint, null, 'Must return null if no hint is available');

  // Guard verification: When hint is null, consumption MUST NOT proceed
  let consumed = false;
  function handleHintScrollUsage(problemId, problemObj) {
    const text = getProblemHint(problemId, problemObj);
    if (!text) return { success: false, reason: 'no_hint_available' };
    consumed = true;
    return { success: true, hint: text };
  }

  const failedAttempt = handleHintScrollUsage('unknown-problem-xyz-999', { title: 'Unknown' });
  assert.equal(failedAttempt.success, false);
  assert.equal(consumed, false, 'Scroll must not be consumed when hint is unavailable');

  const successAttempt = handleHintScrollUsage('p-arr-1-2', null);
  assert.equal(successAttempt.success, true);
  assert.equal(consumed, true, 'Scroll is consumed only when hint is successfully retrieved');
});

test('Item 2: Retry Shield (retry_shield) - Completely negates player HP damage on failure', () => {
  let playerHP = 100;
  let activeBuffs = { retry_shield: true };
  let combatLog = [];

  function evaluateDamage(failedTestRatio, enemyAttack = 20) {
    let damage = Math.floor(failedTestRatio * enemyAttack);
    if (activeBuffs.retry_shield) {
      damage = 0;
      activeBuffs.retry_shield = false; // consumed on damage block
      combatLog.push('BLOCKED BY RETRY SHIELD');
    }
    playerHP -= damage;
    return damage;
  }

  // 1. First failure blocked by shield
  const dmgTaken1 = evaluateDamage(0.75, 20);
  assert.equal(dmgTaken1, 0, 'Damage must be 0 when retry shield is active');
  assert.equal(playerHP, 100, 'Player HP must remain at 100');
  assert.equal(activeBuffs.retry_shield, false, 'Shield buff must be consumed after blocking');
  assert.equal(combatLog[0], 'BLOCKED BY RETRY SHIELD');

  // 2. Second failure without shield takes normal damage
  const dmgTaken2 = evaluateDamage(0.75, 20);
  assert.equal(dmgTaken2, 15, 'Damage must be taken after shield has been consumed');
  assert.equal(playerHP, 85);
});

test('Item 3: Focus Charm (focus_charm) - Zeroes attempt penalty in scoring formula', () => {
  // Scoring formula: attempt_multiplier = Math.max(0.50, 1.0 - (effectiveAttempts - 1) * 0.10)
  function calculateScore(attempts, focusCharmActive = false) {
    const effectiveAttempts = (focusCharmActive || attempts === 1) ? 1 : Math.max(1, attempts);
    const correctness = 1.0;
    const efficiency = 1.0;
    const quality = 1.0;
    const baseScore = (0.60 * correctness) + (0.25 * efficiency) + (0.15 * quality);
    const attemptMultiplier = Math.max(0.50, 1.0 - (effectiveAttempts - 1) * 0.10);
    return baseScore * attemptMultiplier;
  }

  // Without focus charm on attempt 5: penalty is applied (4 * 0.10 = -0.40)
  const scoreWithPenalty = calculateScore(5, false);
  assert.equal(scoreWithPenalty, 0.60, 'Attempt 5 without focus charm should have 0.60 multiplier');

  // With focus charm on attempt 5: effective attempts is 1, penalty is completely removed
  const scoreWithFocusCharm = calculateScore(5, true);
  assert.equal(scoreWithFocusCharm, 1.0, 'Focus charm removes attempt penalty and restores score to 1.0');
});

test('Item 4: Lightning Flask (lightning_flask) - Multiplies coins awarded by 2x', () => {
  function awardCoins(baseCoins = 20, lightningFlaskActive = false) {
    const multiplier = lightningFlaskActive ? 2 : 1;
    return baseCoins * multiplier;
  }

  assert.equal(awardCoins(20, false), 20, 'Normal solve awards 20 coins');
  assert.equal(awardCoins(20, true), 40, 'Lightning Flask doubles solve reward to 40 coins');
});

test('Item 5: XP Tome (xp_tome) - Boosts XP gain by +50%', () => {
  function calculateXP(baseXP = 50, xpTomeActive = false) {
    const xpBoostMod = xpTomeActive ? 1.5 : 1.0;
    return Math.round(baseXP * xpBoostMod);
  }

  assert.equal(calculateXP(50, false), 50, 'Standard solve grants 50 base XP');
  assert.equal(calculateXP(50, true), 75, 'XP Tome boosts 50 base XP by 50% to 75 XP');
  assert.equal(calculateXP(100, true), 150, 'XP Tome boosts 100 base XP to 150 XP');
});

test('Item 6: Shadow Veil (shadow_veil) - Reduces incoming damage by 50%', () => {
  let activeBuffs = { shadow_veil: true };

  function evaluateDamage(rawDamage) {
    let damage = rawDamage;
    if (activeBuffs.shadow_veil) {
      damage = Math.floor(damage * 0.5);
      activeBuffs.shadow_veil = false; // consumed after mitigating damage
    }
    return damage;
  }

  const dampenedDamage = evaluateDamage(20);
  assert.equal(dampenedDamage, 10, 'Shadow veil cuts 20 damage in half to 10');
  assert.equal(activeBuffs.shadow_veil, false, 'Shadow veil buff is consumed after dampening hit');

  const unmitigatedDamage = evaluateDamage(20);
  assert.equal(unmitigatedDamage, 20, 'Next damage without shadow veil is unmitigated');
});

test('Duplicate Activation Prevention: guards against stacking already-active buffs', () => {
  const activeItems = {
    retry_shield: true,
    lightning_flask: false,
    focus_charm: false,
  };

  function canActivate(slug) {
    if (activeItems[slug]) {
      return { allowed: false, reason: 'already_active' };
    }
    return { allowed: true };
  }

  assert.equal(canActivate('retry_shield').allowed, false, 'Cannot re-activate retry shield while already active');
  assert.equal(canActivate('lightning_flask').allowed, true, 'Can activate lightning flask when inactive');
});
