/**
 * Victory Crowd Cheer Sound Utility
 * Plays authentic crowd cheer (~3.5s cut) exclusively on 100% successful problem submissions.
 */

export const VICTORY_SOUND_PATH = '/sounds/submission-success.mp3';
export const VICTORY_SOUND_DURATION_MS = 3500; // Limit playback to first 3.5 seconds

let preloadedAudio = null;
let currentAudioInstance = null;
let stopTimerId = null;

/**
 * Check if sound is muted via local storage preferences
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
 * Update sound mute preference
 */
export function setSoundMuted(muted) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('codo_sound_muted', muted ? 'true' : 'false');
    if (muted) {
      stopVictoryCrowdCheer();
    }
  } catch {
    // ignore
  }
}

/**
 * Resolve effective volume in [0, 1] respecting user preferences
 */
function resolveVolume(fallbackVolume = 0.75) {
  if (typeof window === 'undefined') return fallbackVolume;
  try {
    const saved = localStorage.getItem('codo_sound_volume');
    if (saved !== null && saved !== '') {
      const parsed = Number(saved);
      if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return fallbackVolume;
}

/**
 * Preload the victory crowd cheer audio to avoid playback delay
 */
export function preloadVictorySound() {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
  try {
    if (!preloadedAudio) {
      preloadedAudio = new Audio(VICTORY_SOUND_PATH);
      preloadedAudio.preload = 'auto';
      preloadedAudio.load();
    }
  } catch {
    // Silent fallback
  }
}

/**
 * Stop any active crowd cheer audio immediately
 */
export function stopVictoryCrowdCheer() {
  if (stopTimerId) {
    clearTimeout(stopTimerId);
    stopTimerId = null;
  }

  if (currentAudioInstance) {
    try {
      currentAudioInstance.pause();
      currentAudioInstance.currentTime = 0;
    } catch {
      // ignore
    }
    currentAudioInstance = null;
  }
}

/**
 * Play the victory crowd cheer sound.
 * Plays only the first 3.5 seconds without pitch/speed alteration or looping.
 *
 * @param {Object} options
 * @param {number} [options.durationMs=3500] Duration in milliseconds before stopping
 * @param {number} [options.volume] Explicit playback volume in [0, 1]
 * @returns {boolean} True if playback started, false otherwise
 */
export function playVictoryCrowdCheer({
  durationMs = VICTORY_SOUND_DURATION_MS,
  volume = null,
} = {}) {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return false;
  if (isSoundMuted()) return false;

  try {
    // Ensure any previously playing victory cheer is cleanly stopped first
    stopVictoryCrowdCheer();

    const audio = new Audio(VICTORY_SOUND_PATH);
    audio.loop = false;
    audio.playbackRate = 1.0;
    if ('preservesPitch' in audio) {
      audio.preservesPitch = true;
    }
    audio.currentTime = 0;
    audio.volume = resolveVolume(volume !== null ? volume : 0.75);

    currentAudioInstance = audio;

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch((err) => {
        // Browser autoplay policy or missing audio device: handle gracefully without crashing
        console.warn('Victory crowd cheer playback was prevented:', err?.message || err);
      });
    }

    // Cut off playback at exactly durationMs (3.5 seconds)
    stopTimerId = setTimeout(() => {
      stopVictoryCrowdCheer();
    }, durationMs);

    return true;
  } catch (err) {
    console.warn('Victory audio initialization error:', err);
    return false;
  }
}

/**
 * Reset internal state (for testing)
 */
export function resetVictoryAudioState() {
  stopVictoryCrowdCheer();
  preloadedAudio = null;
}

