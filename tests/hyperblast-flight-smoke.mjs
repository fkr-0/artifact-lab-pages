import assert from 'node:assert/strict';
import {
  applyPlayerFlight,
  flightInputVector,
} from '../hyperblast-shooter/js/flight.js';

const baseConfig = {
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
const baseShip = { speedBonus: 0 };
const baseBooster = { thrustBonus: 0 };
const bounds = { width: 800, height: 500 };

function player(overrides = {}) {
  return {
    x: 50,
    y: 250,
    vx: 0,
    vy: 0,
    tilt: 0,
    boostLevel: 1,
    ...overrides,
  };
}

function step(p, keys, extra = {}) {
  return applyPlayerFlight({
    player: p,
    keys,
    bounds,
    config: baseConfig,
    ship: baseShip,
    booster: baseBooster,
    deltaMs: 16.6667,
    ...extra,
  });
}

assert.deepEqual(flightInputVector({ ArrowUp: true }), { x: 0, y: -1, active: true }, 'up input should produce upward thrust');
{
  const diagonal = flightInputVector({ ArrowDown: true, KeyA: true });
  assert.equal(diagonal.active, true, 'diagonal input should be active');
  assert.ok(Math.abs(diagonal.x + Math.SQRT1_2) < 1e-12, 'diagonal x should be normalized');
  assert.ok(Math.abs(diagonal.y - Math.SQRT1_2) < 1e-12, 'diagonal y should be normalized');
}
assert.deepEqual(flightInputVector({ ArrowUp: true, KeyW: true, ArrowDown: true }), { x: 0, y: 0, active: false }, 'opposing vertical inputs should cancel');

{
  const p = player();
  step(p, { KeyD: true, ArrowUp: true });
  assert.ok(p.x > 50, 'D should move the ship right within the combat lane');
  assert.ok(p.y < 250, 'ArrowUp should move the ship upward');
  assert.ok(p.vx > 0, 'right thrust should build positive horizontal velocity');
  assert.ok(p.vy < 0, 'up thrust should build negative vertical velocity');
  assert.ok(Math.hypot(p.vx / baseConfig.PLAYER_MAX_LATERAL_SPEED, p.vy / baseConfig.PLAYER_MAX_VERTICAL_SPEED) <= 1, 'normalized diagonal thrust should stay within the configured speed envelope');
  assert.ok(p.tilt < 0, 'upward flight should bank the ship nose-up');
}

{
  const p = player({ vx: 4, vy: -5, tilt: -0.3 });
  step(p, {});
  assert.ok(p.x > 50, 'released controls should preserve some horizontal glide');
  assert.ok(p.y < 250, 'released controls should preserve some vertical glide');
  assert.ok(Math.abs(p.vx) < 4, 'idle drag should reduce horizontal velocity');
  assert.ok(Math.abs(p.vy) < 5, 'idle drag should reduce vertical velocity');
  assert.ok(Math.abs(p.tilt) < 0.3, 'bank angle should recover toward neutral when input is released');
}

{
  const p = player({ x: 790, y: 8, vx: 10, vy: -10 });
  step(p, { KeyD: true, ArrowUp: true });
  const maxX = Math.min(bounds.width * baseConfig.PLAYER_MAX_X_RATIO, bounds.width - baseConfig.PLAYER_MIN_X);
  assert.equal(p.x, maxX, 'ship should clamp to the forward combat-lane boundary, not fly through the full enemy field');
  assert.equal(p.y, baseConfig.PLAYER_MIN_Y, 'ship should clamp to the top safe boundary');
  assert.equal(p.vx, 0, 'horizontal velocity should be canceled when clamped at the lane edge');
  assert.equal(p.vy, 0, 'vertical velocity should be canceled when clamped at the top edge');
}

{
  const p = player({ x: 40, y: 250 });
  for (let i = 0; i < 30; i++) step(p, { KeyA: true });
  assert.equal(p.x, baseConfig.PLAYER_MIN_X, 'ship should clamp to the rear combat-lane boundary');
  assert.equal(p.vx, 0, 'rear boundary should stop leftward drift');
}

console.log('hyperblast flight physics smoke checks passed');
