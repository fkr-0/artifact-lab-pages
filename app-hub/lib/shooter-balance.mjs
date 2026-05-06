export const STARTING_MONEY = 200;
export const TURRET_COST = 120;
export const TURRET_LIFE_MS = 12000;
export const TURRET_HEALTH = 3;
export const TURRET_FIRE_COOLDOWN_MS = 420;
export const TURRET_BULLET_SPEED = 9;

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createInitialEconomy() {
  return {
    score: 0,
    money: STARTING_MONEY,
    turrets: [],
    upgrades: [],
  };
}

export function normalizeDifficultySettings(settings = {}) {
  return {
    amount: clamp(Number(settings.amount ?? 2), 1, 5),
    power: clamp(Number(settings.power ?? 2), 1, 5),
  };
}

export function createEnemy({ canvasWidth, canvasHeight, settings, random = Math.random }) {
  const difficulty = normalizeDifficultySettings(settings);
  const powerNoise = 0.75 + random() * 0.5;
  const power = clamp(difficulty.power * powerNoise, 1, 6);
  const size = 16 + power * 5;
  const health = Math.max(1, Math.round(power));
  const speed = 1.6 + random() * 1.6 + difficulty.amount * 0.22 + power * 0.12;

  return {
    id: `enemy-${Date.now()}-${Math.floor(random() * 100000)}`,
    x: canvasWidth + size,
    y: random() * Math.max(1, canvasHeight - 40) + 20,
    vx: -speed,
    size,
    health,
    maxHealth: health,
    power,
    pressure: difficulty.amount,
    reward: calculateEnemyReward({ power, pressure: difficulty.amount, health, size }),
  };
}

export function getSpawnThreshold(settings = {}) {
  const difficulty = normalizeDifficultySettings(settings);
  return Math.round(clamp(84 - difficulty.amount * 12, 18, 72));
}

export function getSpawnBatchSize(settings = {}) {
  const difficulty = normalizeDifficultySettings(settings);
  return Math.max(1, Math.round(difficulty.amount));
}

export function calculateEnemyReward(enemy) {
  const power = Number(enemy.power ?? enemy.maxHealth ?? enemy.health ?? 1);
  const pressure = Number(enemy.pressure ?? 1);
  const health = Number(enemy.maxHealth ?? enemy.health ?? 1);
  return Math.max(5, Math.round(10 + power * 9 + pressure * 4 + health * 3));
}

export function recordEnemyKill(economy, enemy) {
  const reward = calculateEnemyReward(enemy);
  return {
    ...economy,
    score: economy.score + Math.round(reward * 1.5),
    money: economy.money + reward,
  };
}

export function deployTurret(economy, position, now = Date.now()) {
  if (economy.money < TURRET_COST) {
    return economy;
  }

  const turret = {
    id: `turret-${now}-${Math.floor(Math.random() * 100000)}`,
    x: position.x,
    y: position.y,
    placedAt: now,
    lastShotAt: now - TURRET_FIRE_COOLDOWN_MS,
    lifeMs: TURRET_LIFE_MS,
    health: TURRET_HEALTH,
  };

  return {
    ...economy,
    money: economy.money - TURRET_COST,
    turrets: [...(economy.turrets ?? []), turret],
  };
}

export function updateTurrets({ turrets, enemies, now = Date.now(), deltaMs = 16 }) {
  const bullets = [];
  const remainingTurrets = [];

  for (const turret of turrets) {
    const nextTurret = { ...turret, lifeMs: turret.lifeMs - deltaMs };

    for (const enemy of enemies) {
      if (distance(nextTurret, enemy) < enemy.size * 0.75 + 12) {
        nextTurret.health -= 1;
      }
    }

    if (nextTurret.lifeMs <= 0 || nextTurret.health <= 0) {
      continue;
    }

    const target = findNearestEnemy(nextTurret, enemies);
    if (target && now - nextTurret.lastShotAt >= TURRET_FIRE_COOLDOWN_MS) {
      const aim = normalizeVector(target.x - nextTurret.x, target.y - nextTurret.y);
      bullets.push({
        x: nextTurret.x,
        y: nextTurret.y,
        vx: aim.x * TURRET_BULLET_SPEED,
        vy: aim.y * TURRET_BULLET_SPEED,
        time: now,
        source: 'turret',
        damage: 1,
      });
      nextTurret.lastShotAt = now;
    }

    remainingTurrets.push(nextTurret);
  }

  return { turrets: remainingTurrets, bullets };
}

export function findNearestEnemy(origin, enemies) {
  let nearest = null;
  let nearestDistance = Infinity;
  for (const enemy of enemies) {
    const d = distance(origin, enemy);
    if (d < nearestDistance) {
      nearest = enemy;
      nearestDistance = d;
    }
  }
  return nearest;
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function normalizeVector(x, y) {
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
}
