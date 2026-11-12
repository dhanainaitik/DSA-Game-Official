/**
 * Goblin Character Audio & Defeat Effects
 * Uses the user-supplied authentic Goblin reference clip (~3.7s) with strict single-voice
 * playback management, 2.5s cooldown between reactions, and clean navigation cleanup.
 */

const GOBLIN_SOUND_PATH = '/sounds/goblin-laugh.mp3';
const GOBLIN_REACTION_CLIPS = {
  laugh: GOBLIN_SOUND_PATH,
  incorrect: GOBLIN_SOUND_PATH,
  error: GOBLIN_SOUND_PATH,
};
const GOBLIN_VOLUME = 0.68; // Balanced conversational gain for -5.2 dBFS source peak
const VIBRATION_PATTERN = [100, 50, 150, 50, 200];

// Single-voice playback & cooldown state
let preloadedAudio = null;
let currentAudioInstance = null;
let activeProceduralCleanup = null;
let lastTriggerTime = 0;
export const GOBLIN_COOLDOWN_MS = 2500; // 2.5s cooldown prevents repetitive audio bursts

/**
 * Resolve effective playback volume in [0, 1], respecting saved user preference when set.
 */
function resolveVolume(explicitVolume = GOBLIN_VOLUME) {
  let vol = explicitVolume;
  if (typeof window !== 'undefined') {
    try {
      const savedVol = localStorage.getItem('codo_sound_volume');
      if (savedVol !== null && savedVol !== '') {
        const parsed = Number(savedVol);
        if (Number.isFinite(parsed)) {
          vol = parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
  }
  return Math.max(0, Math.min(1, Number.isFinite(vol) ? vol : GOBLIN_VOLUME));
}

/**
 * Check if the user has muted sounds
 */
export function isSoundMuted() {
  if (typeof window === 'undefined') return true;
  try {
    return (
      localStorage.getItem('codo_sound_muted') === 'true' ||
      localStorage.getItem('codo-sound-muted') === 'true' ||
      localStorage.getItem('sound_muted') === 'true'
    );
  } catch {
    return false;
  }
}

/**
 * Set user sound mute preference (stops active voice immediately when muted)
 */
export function setSoundMuted(muted) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('codo_sound_muted', muted ? 'true' : 'false');
    if (muted) {
      stopGoblinVoice();
    }
  } catch {
    // ignore
  }
}

/**
 * Immediately stop any currently playing Goblin audio (HTML5 or Web Audio fallback)
 */
export function stopGoblinVoice() {
  if (currentAudioInstance) {
    try {
      currentAudioInstance.onended = null;
      currentAudioInstance.onerror = null;
      currentAudioInstance.pause();
      currentAudioInstance.currentTime = 0;
    } catch {
      // ignore
    }
    currentAudioInstance = null;
  }

  if (activeProceduralCleanup) {
    try {
      activeProceduralCleanup();
    } catch {
      // ignore
    }
    activeProceduralCleanup = null;
  }
}

/**
 * Reset internal trigger timing and cached element (for tests or hard reset)
 */
export function resetGoblinAudioState() {
  stopGoblinVoice();
  preloadedAudio = null;
  lastTriggerTime = 0;
}

/**
 * Preload the authentic Goblin reference audio to minimize playback delay
 */
export function preloadGoblinAudio() {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
  if (!preloadedAudio) {
    try {
      preloadedAudio = new Audio(GOBLIN_SOUND_PATH);
      preloadedAudio.preload = 'auto';
      preloadedAudio.volume = resolveVolume(GOBLIN_VOLUME);
      preloadedAudio.load();
    } catch (e) {
      console.warn('Goblin audio preload failed:', e);
    }
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    preloadGoblinAudio();
  } else {
    window.addEventListener('DOMContentLoaded', preloadGoblinAudio, { once: true });
  }
  window.addEventListener('pagehide', stopGoblinVoice);
}

/**
 * Play device haptic vibration where supported
 */
export function triggerFailureVibration(pattern = VIBRATION_PATTERN) {
  if (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  ) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore
    }
  }
}

/**
 * Clean, dry Web Audio fallback strictly used only if HTML5 Audio is blocked by browser policy.
 * Zero delay, zero reverb, zero distortion.
 */
function playProceduralFallback(volume = GOBLIN_VOLUME) {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (typeof ctx.resume === 'function' && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const safeVol = resolveVolume(volume);
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(safeVol * 0.65, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const warmthFilter = ctx.createBiquadFilter();
    warmthFilter.type = 'lowpass';
    warmthFilter.frequency.setValueAtTime(1850, ctx.currentTime);
    warmthFilter.Q.setValueAtTime(0.7, ctx.currentTime);
    warmthFilter.connect(masterGain);

    const syllables = [
      { t: 0.03, dur: 0.13, pitch: 210, endPitch: 245, amp: 0.55 },
      { t: 0.20, dur: 0.14, pitch: 225, endPitch: 265, amp: 0.68 },
      { t: 0.39, dur: 0.16, pitch: 242, endPitch: 278, amp: 0.75 },
      { t: 0.60, dur: 0.28, pitch: 246, endPitch: 185, amp: 0.60 },
    ];

    const activeOscillators = [];

    syllables.forEach((s) => {
      const startTime = ctx.currentTime + s.t;
      const primaryOsc = ctx.createOscillator();
      const chestOsc = ctx.createOscillator();
      const syllableGain = ctx.createGain();
      const chestGain = ctx.createGain();

      primaryOsc.type = 'triangle';
      primaryOsc.frequency.setValueAtTime(s.pitch, startTime);
      primaryOsc.frequency.exponentialRampToValueAtTime(
        Math.max(120, s.endPitch),
        startTime + s.dur
      );

      chestOsc.type = 'sine';
      chestOsc.frequency.setValueAtTime(s.pitch, startTime);
      chestOsc.frequency.exponentialRampToValueAtTime(
        Math.max(120, s.endPitch),
        startTime + s.dur
      );
      chestGain.gain.setValueAtTime(0.35, startTime);

      syllableGain.gain.setValueAtTime(0.0001, startTime);
      syllableGain.gain.linearRampToValueAtTime(s.amp * 0.45, startTime + s.dur * 0.25);
      syllableGain.gain.exponentialRampToValueAtTime(0.0001, startTime + s.dur);

      primaryOsc.connect(syllableGain);
      chestOsc.connect(chestGain);
      chestGain.connect(syllableGain);
      syllableGain.connect(warmthFilter);

      primaryOsc.start(startTime);
      chestOsc.start(startTime);
      primaryOsc.stop(startTime + s.dur + 0.01);
      chestOsc.stop(startTime + s.dur + 0.01);

      activeOscillators.push(primaryOsc, chestOsc);
    });

    let closed = false;
    const cleanupTimer = setTimeout(() => {
      if (closed) return;
      closed = true;
      activeProceduralCleanup = null;
      ctx.close?.().catch(() => {});
    }, 1050);

    activeProceduralCleanup = () => {
      if (closed) return;
      closed = true;
      clearTimeout(cleanupTimer);
      try {
        masterGain.gain.cancelScheduledValues(ctx.currentTime);
        masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.02);
      } catch {
        // ignore teardown ramp errors
      }
      activeOscillators.forEach((osc) => {
        try {
          osc.stop(ctx.currentTime + 0.025);
        } catch {
          // already stopped
        }
      });
      setTimeout(() => {
        ctx.close?.().catch(() => {});
      }, 35);
    };
  } catch (err) {
    console.warn('Procedural goblin fallback failed:', err);
  }
}

/**
 * Play a Goblin voice reaction clip respecting mute, single-voice playback, and 2.5s cooldown.
 */
export function playGoblinReaction(reactionType = 'laugh', options = {}) {
  if (isSoundMuted()) return false;

  const clipPath = GOBLIN_REACTION_CLIPS[reactionType];
  if (!clipPath) return false;

  const { now = Date.now(), force = false, volume = GOBLIN_VOLUME } = options;
  if (!force && now - lastTriggerTime < GOBLIN_COOLDOWN_MS) {
    return false;
  }
  lastTriggerTime = now;

  // Prevent overlap: halt any active clip cleanly before starting the new clip
  stopGoblinVoice();

  const effectiveVol = resolveVolume(volume);

  try {
    const canReusePreloaded = preloadedAudio && preloadedAudio.src?.endsWith(clipPath);
    const audio = canReusePreloaded ? preloadedAudio : new Audio(clipPath);
    if (clipPath === GOBLIN_SOUND_PATH) {
      preloadedAudio = audio;
    }
    audio.volume = effectiveVol;
    audio.currentTime = 0;
    currentAudioInstance = audio;

    audio.onended = () => {
      if (currentAudioInstance === audio) {
        currentAudioInstance = null;
      }
    };

    audio.onerror = () => {
      if (currentAudioInstance === audio) {
        currentAudioInstance = null;
      }
      playProceduralFallback(effectiveVol);
    };

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        if (currentAudioInstance === audio) {
          currentAudioInstance = null;
        }
        playProceduralFallback(effectiveVol);
      });
    }
    return true;
  } catch {
    playProceduralFallback(effectiveVol);
    return true;
  }
}

/**
 * Convenience alias for Goblin failure/mistake laugh reaction.
 */
export function playGoblinLaugh(volume = GOBLIN_VOLUME, options = {}) {
  return playGoblinReaction('laugh', { ...options, volume });
}

/**
 * Trigger Screen Shake effect using GSAP if present, or Web Animations API fallback
 */
export function triggerScreenShakeEffect(targetSelector = '.battle-arena') {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const target =
    document.querySelector(targetSelector) ||
    document.querySelector('.battle-arena') ||
    document.querySelector('.bg-arena') ||
    document.querySelector('.mp-arena') ||
    document.querySelector('.page-content');

  if (!target) return;

  if (window.gsap) {
    window.gsap.fromTo(
      target,
      { x: -6 },
      {
        x: 6,
        duration: 0.05,
        repeat: 5,
        yoyo: true,
        onComplete: () => window.gsap.set(target, { x: 0 }),
      }
    );
  } else if (typeof target.animate === 'function') {
    target.animate(
      [
        { transform: 'translateX(0px)' },
        { transform: 'translateX(-6px)' },
        { transform: 'translateX(6px)' },
        { transform: 'translateX(-6px)' },
        { transform: 'translateX(6px)' },
        { transform: 'translateX(0px)' },
      ],
      { duration: 300, easing: 'ease-in-out' }
    );
  }
}

/**
 * Combined Goblin Defeat Sequence:
 * 1. Screen shake animation
 * 2. Device haptic vibration
 * 3. Authentic Goblin laugh clip (with 2.5s cooldown & anti-overlap)
 */
export function triggerGoblinDefeatEffects(options = {}) {
  const {
    targetSelector = '.battle-arena',
    customScreenShake = null,
    volume = GOBLIN_VOLUME,
    vibrationPattern = VIBRATION_PATTERN,
    reactionType = 'laugh',
  } = options;

  if (typeof customScreenShake === 'function') {
    try {
      customScreenShake();
    } catch {
      triggerScreenShakeEffect(targetSelector);
    }
  } else {
    triggerScreenShakeEffect(targetSelector);
  }

  triggerFailureVibration(vibrationPattern);
  playGoblinReaction(reactionType, { volume });
}
