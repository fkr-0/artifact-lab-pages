export function flightInputVector(keys = {}) {
  const up = keys.moveUp || keys.ArrowUp || keys.KeyW;
  const down = keys.moveDown || keys.ArrowDown || keys.KeyS;
  const left = keys.moveLeft || keys.ArrowLeft || keys.KeyA;
  const right = keys.moveRight || keys.ArrowRight || keys.KeyD;
  const vertical = (down ? 1 : 0) - (up ? 1 : 0);
  const horizontal = (right ? 1 : 0) - (left ? 1 : 0);
  const length = Math.hypot(horizontal, vertical);

  if (!length) return { x: 0, y: 0, active: false };

  return {
    x: horizontal / length,
    y: vertical / length,
    active: true,
  };
}

function numberOr(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function damp(value, factor, frameScale) {
  return value * Math.pow(factor, frameScale);
}

export function applyPlayerFlight({
  player,
  keys = {},
  bounds,
  config,
  ship = {},
  booster = {},
  deltaMs = 16.6667,
}) {
  if (!player) throw new TypeError('applyPlayerFlight requires a player');
  if (!bounds || !config) throw new TypeError('applyPlayerFlight requires bounds and config');

  const frameScale = clamp(numberOr(deltaMs, 16.6667), 0, numberOr(config.MAX_DELTA_MS, 50)) / 16.6667;
  const minX = numberOr(config.PLAYER_MIN_X, numberOr(config.PLAYER_INITIAL_X, 50) * 0.48);
  const minY = numberOr(config.PLAYER_MIN_Y, 20);
  const maxX = Math.min(
    numberOr(bounds.width, 800) * numberOr(config.PLAYER_MAX_X_RATIO, 0.42),
    numberOr(bounds.width, 800) - minX,
  );
  const maxY = numberOr(bounds.height, 500) - minY;

  player.vx = numberOr(player.vx, 0);
  player.vy = numberOr(player.vy, 0);
  player.x = numberOr(player.x, numberOr(config.PLAYER_INITIAL_X, 50));
  player.y = numberOr(player.y, numberOr(bounds.height, 500) / 2);
  player.tilt = numberOr(player.tilt, 0);
  player.throttle = numberOr(player.throttle, 0);

  const input = flightInputVector(keys);
  const thrust = numberOr(config.BASE_THRUST, 0.8)
    + (numberOr(player.boostLevel, 1) - 1) * numberOr(config.THRUST_PER_BOOST_LEVEL, 0.18)
    + numberOr(booster.thrustBonus, 0)
    + numberOr(ship.speedBonus, 0);
  const lateralThrust = thrust * numberOr(config.PLAYER_LATERAL_THRUST_RATIO, 0.68);

  player.vx += input.x * lateralThrust * frameScale;
  player.vy += input.y * thrust * frameScale;

  const maxHorizontalSpeed = numberOr(config.PLAYER_MAX_LATERAL_SPEED, 5.25)
    + Math.max(0, numberOr(ship.speedBonus, 0)) * 0.8;
  const maxVerticalSpeed = numberOr(config.PLAYER_MAX_VERTICAL_SPEED, 8.25)
    + Math.max(0, numberOr(booster.thrustBonus, 0)) * 0.6;

  player.vx = clamp(player.vx, -maxHorizontalSpeed, maxHorizontalSpeed);
  player.vy = clamp(player.vy, -maxVerticalSpeed, maxVerticalSpeed);

  const drag = input.active
    ? numberOr(config.PLAYER_FLIGHT_DRAG, numberOr(config.PLAYER_FRICTION, 0.9))
    : numberOr(config.PLAYER_IDLE_DRAG, 0.82);
  player.vx = damp(player.vx, drag, frameScale);
  player.vy = damp(player.vy, drag, frameScale);

  player.x += player.vx * frameScale;
  player.y += player.vy * frameScale;

  if (player.x < minX) {
    player.x = minX;
    if (player.vx < 0) player.vx = 0;
  } else if (player.x > maxX) {
    player.x = maxX;
    if (player.vx > 0) player.vx = 0;
  }

  if (player.y < minY) {
    player.y = minY;
    if (player.vy < 0) player.vy = 0;
  } else if (player.y > maxY) {
    player.y = maxY;
    if (player.vy > 0) player.vy = 0;
  }

  const maxTilt = numberOr(config.PLAYER_MAX_TILT, 0.55);
  const targetTilt = input.active
    ? clamp((input.y * 0.75) - (input.x * 0.25), -maxTilt, maxTilt)
    : 0;
  const tiltResponse = numberOr(config.PLAYER_TILT_RESPONSE, 0.24);
  player.tilt += (targetTilt - player.tilt) * clamp(tiltResponse * frameScale, 0, 1);

  const speedRatio = clamp(Math.hypot(player.vx / maxHorizontalSpeed, player.vy / maxVerticalSpeed), 0, 1);
  const targetThrottle = input.active ? 0.45 + speedRatio * 0.55 : speedRatio * 0.35;
  player.throttle += (targetThrottle - player.throttle) * clamp(0.25 * frameScale, 0, 1);

  return player;
}
