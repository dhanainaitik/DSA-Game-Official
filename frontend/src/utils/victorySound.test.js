import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  VICTORY_SOUND_PATH,
  VICTORY_SOUND_DURATION_MS,
  playVictoryCrowdCheer,
  stopVictoryCrowdCheer,
  preloadVictorySound,
  resetVictoryAudioState,
  isSoundMuted,
  setSoundMuted,
} from './victorySound.js';

function createStorageMock() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
}

test('Victory audio asset (submission-success.mp3) is present in public/sounds with valid MPEG data', () => {
  const testDir = path.dirname(fileURLToPath(import.meta.url));
  const mp3Path = path.resolve(testDir, '..', '..', 'public', 'sounds', 'submission-success.mp3');
  
  assert.equal(fs.existsSync(mp3Path), true, 'File must exist in public/sounds');
  const stats = fs.statSync(mp3Path);
  assert.ok(stats.size > 100000, `File size (${stats.size} bytes) must be substantial for authentic crowd cheer`);

  const buffer = fs.readFileSync(mp3Path);
  assert.equal(buffer[0], 0xFF, 'First byte must be MPEG frame sync 0xFF');
  assert.equal((buffer[1] & 0xE0), 0xE0, 'Second byte high 3 bits must be 0xE0');
});

test('playVictoryCrowdCheer initializes Audio with non-looping, standard speed, and 3.5s duration', (t, done) => {
  const createdAudios = [];
  globalThis.window = globalThis;
  globalThis.localStorage = createStorageMock();

  class MockAudio {
    constructor(src) {
      this.src = src;
      this.loop = true; // default before setup
      this.playbackRate = 1.0;
      this.volume = 1.0;
      this.currentTime = 5.0;
      this.playCount = 0;
      this.pauseCount = 0;
      createdAudios.push(this);
    }
    play() {
      this.playCount++;
      return Promise.resolve();
    }
    pause() {
      this.pauseCount++;
    }
    load() {}
  }

  globalThis.Audio = MockAudio;
  resetVictoryAudioState();

  assert.equal(VICTORY_SOUND_PATH, '/sounds/submission-success.mp3');
  assert.equal(VICTORY_SOUND_DURATION_MS, 3500);

  // Play audio
  const played = playVictoryCrowdCheer({ durationMs: 100 });
  assert.equal(played, true);
  assert.equal(createdAudios.length, 1);

  const audio = createdAudios[0];
  assert.equal(audio.src, '/sounds/submission-success.mp3');
  assert.equal(audio.loop, false, 'Audio must not loop');
  assert.equal(audio.playbackRate, 1.0, 'Playback rate must be standard speed');
  assert.equal(audio.currentTime, 0, 'Current time must start at 0');
  assert.equal(audio.playCount, 1, 'Audio play must be invoked exactly once');

  // Verify that after durationMs (100ms in test), stop is called automatically
  setTimeout(() => {
    assert.equal(audio.pauseCount, 1, 'Audio must be paused after duration cut');
    assert.equal(audio.currentTime, 0, 'Audio position must reset to 0');
    delete globalThis.Audio;
    delete globalThis.window;
    delete globalThis.localStorage;
    done();
  }, 150);
});

test('Mute preferences prevent victory crowd cheer playback', () => {
  globalThis.window = globalThis;
  globalThis.localStorage = createStorageMock();
  globalThis.Audio = class MockAudio {
    play() { return Promise.resolve(); }
    pause() {}
    load() {}
  };

  resetVictoryAudioState();

  // When muted
  setSoundMuted(true);
  assert.equal(isSoundMuted(), true);

  const played = playVictoryCrowdCheer();
  assert.equal(played, false, 'Must not play when user has muted sound');

  // When unmuted
  setSoundMuted(false);
  assert.equal(isSoundMuted(), false);
  const playedUnmuted = playVictoryCrowdCheer({ durationMs: 50 });
  assert.equal(playedUnmuted, true, 'Must play when unmuted');

  stopVictoryCrowdCheer();
  delete globalThis.Audio;
  delete globalThis.window;
  delete globalThis.localStorage;
});

test('Preload initializes audio asset without playing', () => {
  let loaded = false;
  let played = false;
  globalThis.window = globalThis;
  globalThis.localStorage = createStorageMock();
  globalThis.Audio = class MockAudio {
    constructor(src) {
      this.src = src;
    }
    load() {
      loaded = true;
    }
    play() {
      played = true;
      return Promise.resolve();
    }
  };

  resetVictoryAudioState();
  preloadVictorySound();

  assert.equal(loaded, true, 'Preload must call load()');
  assert.equal(played, false, 'Preload must never call play()');

  delete globalThis.Audio;
  delete globalThis.window;
  delete globalThis.localStorage;
});

