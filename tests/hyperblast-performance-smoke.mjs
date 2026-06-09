import assert from 'node:assert/strict';
import { applyPlayerFlight } from '../hyperblast-shooter/js/flight.js';

const config = {
  PLAYER_INITIAL_X: 50,
  PLAYER_MIN_X: 24,
  PLAYER_MIN_Y: 20,
  PLAYER_MAX_X_RATIO: 0.42,
  BASE_THRUST: 0.8,
  THRUST_PER_BOOST_LEVEL: 0.18,
  PLAYER_LATERAL_THRUST_RATIO: 0.68,
  PLAYER_MAX_VERTICAL_SPEED: 8.25,
  PLAYER_MAX_LATERAL_SPEED: 5.25,
  PLAYER_FLIGHT_DRAG: 0.9,
  PLAYER_IDLE_DRAG: 0.82,
  PLAYER_TILT_RESPONSE: 0.24,
  PLAYER_MAX_TILT: 0.55,
  MAX_DELTA_MS: 50,
};

const player = {
  x: 50,
  y: 250,
  vx: 0,
  vy: 0,
  tilt: 0,
  throttle: 0,
  boostLevel: 2,
};
const bounds = { width: 1280, height: 720 };
const started = performance.now();
for (let i = 0; i < 5000; i += 1) {
  applyPlayerFlight({
    player,
    keys: {
      moveRight: i % 3 !== 0,
      moveUp: i % 5 !== 0,
      moveLeft: i % 17 === 0,
      moveDown: i % 19 === 0,
    },
    bounds,
    config,
    ship: { speedBonus: 0.4 },
    booster: { thrustBonus: 0.3 },
    deltaMs: 16.6667,
  });
}
const elapsed = performance.now() - started;
assert.ok(Number.isFinite(player.x), 'flight update should keep x finite');
assert.ok(Number.isFinite(player.y), 'flight update should keep y finite');
assert.ok(player.x >= config.PLAYER_MIN_X, 'flight update should preserve left lane bound');
assert.ok(player.x <= bounds.width * config.PLAYER_MAX_X_RATIO, 'flight update should preserve forward lane bound');
assert.ok(player.y >= config.PLAYER_MIN_Y, 'flight update should preserve top bound');
assert.ok(player.y <= bounds.height - config.PLAYER_MIN_Y, 'flight update should preserve bottom bound');
assert.ok(elapsed < 250, `5000 flight updates should stay comfortably under smoke budget, got ${elapsed.toFixed(2)}ms`);

console.log(`hyperblast performance smoke checks passed in ${elapsed.toFixed(2)}ms`);
