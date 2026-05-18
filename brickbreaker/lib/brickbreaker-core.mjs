export const POWERUPS = Object.freeze({
  MULTIBALL: 'multiball',
  LASER: 'laser',
  CATCH: 'catch',
  SLOW: 'slow',
  WIDE: 'wide',
  EXTRA_LIFE: 'extra-life',
});

export function createLevel(index = 0) {
  const rows = Math.min(5 + Math.floor(index / 2), 9);
  const cols = 12;
  const bricks = [];
  const palette = [POWERUPS.MULTIBALL, POWERUPS.LASER, POWERUPS.CATCH, POWERUPS.SLOW, POWERUPS.WIDE, POWERUPS.EXTRA_LIFE];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const armored = index > 2 && (row + col + index) % 7 === 0;
      bricks.push({
        id: `l${index}-r${row}-c${col}`,
        x: 44 + col * 58,
        y: 64 + row * 26,
        w: 50,
        h: 18,
        hp: armored ? 2 : 1,
        maxHp: armored ? 2 : 1,
        powerup: (row + col + index) % 11 === 0 ? palette[(row + index) % palette.length] : null,
      });
    }
  }
  return { index, rows, cols, bricks };
}

export function makeCoopPlayers(playerIds = ['p1'], width = 760, height = 560) {
  const ids = [...new Set(playerIds.length ? playerIds : ['p1'])];
  const gap = 10;
  const laneWidth = Math.max(90, Math.min(150, (width - gap * (ids.length + 1)) / ids.length));
  return Object.fromEntries(ids.map((id, slot) => [id, {
    id,
    slot,
    x: gap + slot * (laneWidth + gap),
    y: height - 42,
    w: laneWidth,
    h: 14,
    laser: 0,
    catch: 0,
    slow: 0,
    color: colorForId(id),
  }]));
}

export function createInitialState({ width = 760, height = 560, levelIndex = 0, players = ['p1'] } = {}) {
  const playerIds = [...new Set(players.length ? players : ['p1'])].sort();
  return {
    width,
    height,
    levelIndex,
    score: 0,
    lives: 3,
    tick: 0,
    status: 'ready',
    mode: 'strict-coop',
    authority: {
      hostId: electHost(playerIds),
      checksum: '',
      lastSnapshotTick: 0,
    },
    particles: [],
    players: makeCoopPlayers(playerIds, width, height),
    balls: [{ id: 'b1', x: width / 2, y: height - 64, vx: 4, vy: -5, r: 7, stuckTo: playerIds[0] || 'p1' }],
    shots: [],
    drops: [],
    bricks: createLevel(levelIndex).bricks,
  };
}

export function electHost(playerIds = []) {
  return [...new Set(playerIds)].sort()[0] || null;
}

export function createSnapshot(state, { hostId = state.authority?.hostId || electHost(Object.keys(state.players)) } = {}) {
  const snapshot = sanitizeState({
    width: state.width,
    height: state.height,
    levelIndex: state.levelIndex,
    score: state.score,
    lives: state.lives,
    tick: state.tick,
    status: state.status,
    mode: state.mode,
    authority: {
      hostId,
      lastSnapshotTick: state.tick,
    },
    players: state.players,
    balls: state.balls,
    shots: state.shots,
    drops: state.drops,
    bricks: state.bricks,
    particles: state.particles || [],
  });
  snapshot.checksum = stableHash(snapshot);
  return snapshot;
}

export function applySnapshot(state, snapshot) {
  const restored = structuredCloneCompat(snapshot);
  const checksum = restored.checksum;
  delete restored.checksum;
  Object.assign(state, restored, {
    authority: {
      ...(restored.authority || {}),
      checksum,
      lastSnapshotTick: restored.tick ?? 0,
    },
  });
  return state;
}

export function hashState(state) {
  return createSnapshot(state, { hostId: state.authority?.hostId }).checksum;
}

export function syncCoopPlayers(state, playerIds) {
  const ids = [...new Set(playerIds.length ? playerIds : Object.keys(state.players))].sort();
  const previous = state.players;
  state.players = makeCoopPlayers(ids, state.width, state.height);
  state.authority = {
    ...(state.authority || {}),
    hostId: electHost(ids),
  };
  for (const [id, player] of Object.entries(state.players)) {
    if (previous[id]) Object.assign(player, {
      x: clamp(previous[id].x, 0, state.width - player.w),
      laser: previous[id].laser,
      catch: previous[id].catch,
      slow: previous[id].slow,
    });
  }
  for (const ball of state.balls) {
    if (ball.stuckTo && !state.players[ball.stuckTo]) ball.stuckTo = Object.keys(state.players)[0];
  }
  return state;
}

export function applyInput(state, playerId, input) {
  const player = state.players[playerId];
  if (!player) return state;
  if (Number.isFinite(input.x)) player.x = clamp(input.x - player.w / 2, 0, state.width - player.w);
  if (Number.isFinite(input.dx)) player.x = clamp(player.x + input.dx, 0, state.width - player.w);
  if (input.launch) {
    for (const ball of state.balls) {
      if (ball.stuckTo === playerId) {
        ball.stuckTo = null;
        ball.vx = input.vx ?? ball.vx;
        ball.vy = -Math.abs(input.vy ?? 5);
      }
    }
  }
  if (input.fire && player.laser > 0) {
    state.shots.push({ id: `s${state.tick}-${playerId}-l`, x: player.x + 18, y: player.y, vy: -9, color: player.color });
    state.shots.push({ id: `s${state.tick}-${playerId}-r`, x: player.x + player.w - 18, y: player.y, vy: -9, color: player.color });
    player.laser -= 1;
  }
  return state;
}

export function activatePowerup(state, playerId, type) {
  const player = state.players[playerId] || Object.values(state.players)[0];
  if (!player) return state;
  if (type === POWERUPS.MULTIBALL) {
    const clones = state.balls.slice(0, 3).flatMap((ball, idx) => [
      { ...ball, id: `${ball.id}-m${state.tick}-${idx}a`, stuckTo: null, vx: -Math.abs(ball.vx || 4), vy: -Math.abs(ball.vy || 5) },
      { ...ball, id: `${ball.id}-m${state.tick}-${idx}b`, stuckTo: null, vx: Math.abs(ball.vx || 4), vy: -Math.abs(ball.vy || 5) },
    ]);
    state.balls.push(...clones);
  }
  if (type === POWERUPS.LASER) player.laser += 12;
  if (type === POWERUPS.CATCH) player.catch += 12;
  if (type === POWERUPS.SLOW) player.slow += 10;
  if (type === POWERUPS.WIDE) player.w = Math.min(player.w + 36, 180);
  if (type === POWERUPS.EXTRA_LIFE) state.lives += 1;
  return state;
}

export function stepState(state) {
  state.tick += 1;
  const slowFactor = Object.values(state.players).some((p) => p.slow > 0) ? 0.65 : 1;
  for (const player of Object.values(state.players)) {
    if (player.catch > 0) player.catch -= 1 / 60;
    if (player.slow > 0) player.slow -= 1 / 60;
  }

  for (const shot of state.shots) shot.y += shot.vy;
  state.shots = state.shots.filter((shot) => shot.y > -20);

  for (const shot of state.shots) {
    const brick = state.bricks.find((candidate) => overlapsPointRect(shot.x, shot.y, candidate));
    if (brick) {
      brick.hp -= 1;
      shot.y = -999;
      if (brick.hp <= 0) destroyBrick(state, brick, null);
      spawnParticles(state, shot.x, shot.y, shot.color || '#ff6688', 4);
    }
  }
  state.shots = state.shots.filter((shot) => shot.y > -20);

  for (const ball of state.balls) {
    if (ball.stuckTo && state.players[ball.stuckTo]) {
      const p = state.players[ball.stuckTo];
      ball.x = p.x + p.w / 2;
      ball.y = p.y - ball.r - 1;
      continue;
    }
    ball.x += ball.vx * slowFactor;
    ball.y += ball.vy * slowFactor;
    if (ball.x < ball.r || ball.x > state.width - ball.r) ball.vx *= -1;
    if (ball.y < ball.r) ball.vy = Math.abs(ball.vy);

    const paddle = Object.values(state.players).find((p) => overlapsCircleRect(ball, p) && ball.vy > 0);
    if (paddle) {
      const hit = ((ball.x - paddle.x) / paddle.w) - 0.5;
      ball.vx = hit * 9;
      ball.vy = -Math.max(4.5, Math.abs(ball.vy));
      if (paddle.catch > 0) ball.stuckTo = paddle.id;
    }

    const brick = state.bricks.find((candidate) => overlapsCircleRect(ball, candidate));
    if (brick) {
      brick.hp -= 1;
      ball.vy *= -1;
      if (brick.hp <= 0) destroyBrick(state, brick, paddle?.id || null);
      spawnParticles(state, ball.x, ball.y, '#69e2ff', 6);
    }
  }

  state.balls = state.balls.filter((ball) => ball.y < state.height + 40);
  if (state.balls.length === 0) {
    state.lives -= 1;
    if (state.lives <= 0) state.status = 'game-over';
    else state.balls.push({ id: `b${state.tick}`, x: state.width / 2, y: state.height - 64, vx: 4, vy: -5, r: 7, stuckTo: Object.keys(state.players)[0] });
  }
  if (state.bricks.length === 0) {
    const nextLevel = createInitialState({ width: state.width, height: state.height, levelIndex: state.levelIndex + 1, players: Object.keys(state.players) });
    Object.assign(state, nextLevel, { score: state.score, lives: state.lives, status: 'ready' });
  }
  updateParticles(state);
  if (state.authority) state.authority.checksum = hashState(state);
  return state;
}

function destroyBrick(state, brick, playerId) {
  state.score += brick.maxHp * 100;
  state.bricks = state.bricks.filter((candidate) => candidate.id !== brick.id);
  if (brick.powerup) state.drops.push({ id: `d-${brick.id}`, x: brick.x + brick.w / 2, y: brick.y, type: brick.powerup, playerId });
}

function overlapsCircleRect(circle, rect) {
  const cx = clamp(circle.x, rect.x, rect.x + rect.w);
  const cy = clamp(circle.y, rect.y, rect.y + rect.h);
  const dx = circle.x - cx;
  const dy = circle.y - cy;
  return dx * dx + dy * dy <= circle.r * circle.r;
}

function overlapsPointRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function colorForId(id) {
  const palette = ['#69e2ff', '#ff7ad9', '#a8ff60', '#ffd166', '#b392ff', '#ff8f66'];
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}

function spawnParticles(state, x, y, color, count) {
  state.particles ||= [];
  for (let i = 0; i < count; i += 1) {
    state.particles.push({
      x,
      y,
      vx: Math.cos((Math.PI * 2 * i) / count) * (1.2 + (i % 3)),
      vy: Math.sin((Math.PI * 2 * i) / count) * (1.2 + (i % 3)),
      life: 24,
      color,
    });
  }
}

function updateParticles(state) {
  state.particles ||= [];
  for (const particle of state.particles) {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.03;
    particle.life -= 1;
  }
  state.particles = state.particles.filter((particle) => particle.life > 0);
}

function sanitizeState(value) {
  return JSON.parse(JSON.stringify(value));
}

function structuredCloneCompat(value) {
  return typeof structuredClone === 'function' ? structuredClone(value) : sanitizeState(value);
}

function stableHash(value) {
  const json = JSON.stringify(sortKeys(value));
  let hash = 2166136261;
  for (let i = 0; i < json.length; i += 1) {
    hash ^= json.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortKeys(value[key])]));
}
