import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  GOBLIN_COOLDOWN_MS,
  playGoblinReaction,
  playGoblinLaugh,
  stopGoblinVoice,
  resetGoblinAudioState,
  isSoundMuted,
  setSoundMuted,
} from './goblinEffects.js';

function createStorageMock(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

test('Authentic Goblin reference asset (goblin-laugh.mp3) is installed with valid MPEG audio data', () => {
  const testDir = path.dirname(fileURLToPath(import.meta.url));
  const mp3Path = path.resolve(testDir, '..', '..', 'public', 'sounds', 'goblin-laugh.mp3');
  assert.equal(fs.existsSync(mp3Path), true);

  const buf = fs.readFileSync(mp3Path);
  assert.equal(buf.length, 119536);

  // Valid ID3 tag or MPEG frame sync
  const hasId3 = buf.toString('ascii', 0, 3) === 'ID3';
  const hasFrameSync = buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0;
  assert.ok(hasId3 || hasFrameSync, 'Expected valid MP3 header');
});

test('goblinEffects enforces 2.5s cooldown, prevents overlapping clips, and stops cleanly on mute or navigation', () => {
  const createdAudios = [];
  globalThis.window = globalThis;
  globalThis.localStorage = createStorageMock();
  globalThis.Audio = class MockAudio {
    constructor(src) {
      this.src = src;
      this.volume = 1;
      this.currentTime = 0;
      this.playCount = 0;
      this.pauseCount = 0;
      createdAudios.push(this);
    }
    load() {}
    play() {
      this.playCount += 1;
      return Promise.resolve();
    }
    pause() {
      this.pauseCount += 1;
    }
  };

  resetGoblinAudioState();
  assert.equal(GOBLIN_COOLDOWN_MS, 2500);

  // First trigger plays authentic MP3
  const played1 = playGoblinLaugh(0.68, { now: 5000 });
  assert.equal(played1, true);
  assert.equal(createdAudios[0].src, '/sounds/goblin-laugh.mp3');
  assert.equal(createdAudios[0].playCount, 1);
  assert.equal(createdAudios[0].volume, 0.68);

  // Repeated trigger inside 2.5s cooldown is suppressed cleanly
  const cooledDown = playGoblinLaugh(0.68, { now: 6500 });
  assert.equal(cooledDown, false);
  assert.equal(createdAudios[0].playCount, 1);

  // Trigger after >= 2.5s cooldown stops earlier instance before playing new clip
  const played2 = playGoblinReaction('error', { now: 8000, volume: 0.68 });
  assert.equal(played2, true);
  assert.equal(createdAudios[0].pauseCount, 1);
  assert.equal(createdAudios[0].playCount, 2);

  // Route navigation cleanup immediately pauses active clip
  stopGoblinVoice();
  assert.equal(createdAudios[0].pauseCount, 2);

  // Unknown reaction clip does not fabricate unrelated audio
  const unknownAttempt = playGoblinReaction('nonexistent', { now: 12000 });
  assert.equal(unknownAttempt, false);

  // Mute stops & blocks audio
  setSoundMuted(true);
  assert.equal(isSoundMuted(), true);
  const mutedAttempt = playGoblinLaugh(0.68, { now: 15000, force: true });
  assert.equal(mutedAttempt, false);

  delete globalThis.Audio;
});
