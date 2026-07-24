import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createBrickbreakerAudio } from '../brickbreaker/lib/brickbreaker-audio.mjs';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

class FakeAudioContext {
  constructor() {
    this.state = 'suspended';
    this.currentTime = 0;
    this.destination = {};
    this.resumeCalls = 0;
    this.suspendCalls = 0;
    this.closeCalls = 0;
  }
  async resume() { this.resumeCalls += 1; this.state = 'running'; }
  async suspend() { this.suspendCalls += 1; this.state = 'suspended'; }
  async close() { this.closeCalls += 1; this.state = 'closed'; }
  createOscillator() {
    return {
      type: 'sine',
      frequency: { value: 0 },
      connect() { return this; },
      start() {},
      stop() {},
    };
  }
  createGain() {
    return {
      gain: { value: 0, exponentialRampToValueAtTime() {} },
      connect() { return this; },
    };
  }
}

test('Brickbreaker audio resumes existing contexts and disposes cleanly', async () => {
  const runtime = { AudioContext: FakeAudioContext };
  const audio = createBrickbreakerAudio(runtime);
  const context = await audio.unlock();
  assert.equal(context.resumeCalls, 1);
  await audio.suspend();
  assert.equal(context.suspendCalls, 1);
  await audio.resume();
  assert.equal(context.resumeCalls, 2);
  await audio.dispose();
  assert.equal(context.closeCalls, 1);
  const replacement = await audio.unlock();
  assert.notEqual(replacement, context, 'disposed contexts must not be reused');
});

test('Brickbreaker lifecycle cancels animation, networking, and audio', async () => {
  const html = await read('brickbreaker/index.html');
  assert.match(html, /let animationFrameId = 0/);
  assert.match(html, /cancelAnimationFrame\(animationFrameId\)/);
  assert.match(html, /network\.destroy\?\.\(\)/);
  assert.match(html, /await audio\.dispose\(\)/);
  assert.match(html, /document\.addEventListener\('visibilitychange', handleVisibilityChange\)/);
  assert.doesNotMatch(html, /stopTimer\(\)/, 'Brickbreaker has no timer API; lifecycle must manage its animation frame');
});

test('classic games pause hidden timers and expose accessible status', async () => {
  const [minesweeper, solitaire] = await Promise.all([
    read('minesweeper/index.html'),
    read('solitaire/index.html'),
  ]);
  for (const html of [minesweeper, solitaire]) {
    assert.match(html, /prefers-reduced-motion:\s*reduce/);
    assert.match(html, /visibilitychange/);
    assert.match(html, /pagehide/);
  }
  assert.match(minesweeper, /function loadBestTimes\(\)[\s\S]*Array\.isArray\(parsed\)/);
  assert.match(solitaire, /id="message" aria-live="polite"/);
  assert.match(solitaire, /focusWinButton\(\)/);
});

test('Bomberman and collaborative editors tear down visibility and peer state', async () => {
  const [bomberman, collabEditor, collabLite] = await Promise.all([
    read('app-hub/bomberman.html'),
    read('app-hub/collab-editor.html'),
    read('app-hub/collab-editor-lite.html'),
  ]);

  assert.match(bomberman, /let animationFrameId = 0/);
  assert.match(bomberman, /document\.addEventListener\('visibilitychange', handleVisibilityChange\)/);
  assert.match(bomberman, /window\.addEventListener\('pagehide', .*destroyGame/);
  assert.match(bomberman, /lobby\?\.destroy\?\.\(\)/);
  assert.match(bomberman, /if \(destroyed\) return;/);

  for (const html of [collabEditor, collabLite]) {
    assert.match(html, /clearInterval\(checkPeerReady\)/);
    assert.match(html, /window\.addEventListener\('pagehide'/);
    assert.match(html, /window\.addEventListener\('beforeunload'/);
    assert.match(html, /destroyPeerOnly\(\)/);
  }

  assert.match(collabEditor, /Room ID: \$\{state\.peerId\}/);
  assert.doesNotMatch(collabEditor, /state\.roomId/);
});

test('Sexy Love Chat pauses and tears down floating animation and peer state', async () => {
  const html = await read('sexy_love_chat.html');
  assert.match(html, /let floatAnimationId = 0/);
  assert.match(html, /const emojis = \['💖'/);
  assert.doesNotMatch(html, /document\.createElement\('span'\)/);
  assert.match(html, /window\.addEventListener\('pagehide'/);
  assert.match(html, /window\.addEventListener\('beforeunload'/);
  assert.match(html, /document\.addEventListener\('visibilitychange'/);
  assert.match(html, /cleanupConnectionTimers\(\)/);
  assert.match(html, /stopMusic\(\)/);
});

test('PeerModGroove tears down audio and peer resources', async () => {
  const [app, audio, peernet] = await Promise.all([
    read('PeerModGroove/src/app.js'),
    read('PeerModGroove/src/core/audio.js'),
    read('PeerModGroove/src/core/peernet-stack.js'),
  ]);
  assert.match(app, /if \(\!event\.persisted\) void this\.destroy\(\)/);
  assert.match(app, /if \(this\._destroyed\) return/);
  assert.doesNotMatch(app, /stateManager\.state\.isPlaying/);
  assert.match(app, /this\.isPlaying = Boolean\(this\.isPlaying\)|this\.isPlaying = true;|this\.isPlaying = false;/);
  assert.match(app, /await this\.peernet\.destroy\(\)/);
  assert.match(app, /await this\.runtime\.dispose\(\)/);
  assert.match(app, /this\.transportFailoverTimer && clearInterval\(this\.transportFailoverTimer\)/);
  assert.match(app, /this\.pendingTransportNoteOffTimers\.clear\(\)/);
  assert.match(audio, /async dispose\(\)/);
  assert.match(audio, /ensureContext\(\)/);
  assert.match(audio, /await ctx\.close\(\)/);
  assert.match(peernet, /stopAutosave\?\.\(\)/);
  assert.match(peernet, /this\.core\?\.stop\?\.\(\)/);
  assert.match(peernet, /async reconnect\(profile = \{\}\)/);
  assert.match(peernet, /this\.emit\('status', \{ text: 'offline'/);
});

test('sprite GIF creators stop timers on pagehide and recover failed exports', async () => {
  const [classic, v2] = await Promise.all([
    read('spc/sprite-gif-creator.html'),
    read('spc/sprite-gif-creator-v2.html'),
  ]);

  for (const html of [classic, v2]) {
    assert.match(html, /window\.addEventListener\('pagehide',stop\)/);
    assert.match(html, /document\.addEventListener\('visibilitychange',\(\)=>\{if\(document\.visibilityState==='hidden'\)stop\(\)\}\)/);
    assert.match(html, /try\{const zip=new JSZip\(\)/);
    assert.match(html, /finally\{refs\.downloadZipBtn\.disabled=false\}/);
    assert.match(html, /URL\.revokeObjectURL\(url\)/);
  }
});
