export const STARTING_MONEY = 200;
export const TURRET_COST = 120;
export const TURRET_LIFE_MS = 12000;
export const TURRET_HEALTH = 3;
export const TURRET_FIRE_COOLDOWN_MS = 420;
export const TURRET_BULLET_SPEED = 9;

export const SHIP_MODELS = {
  interceptor: { label: 'Interceptor', speedBonus: 0.35, hull: 2, color: '#0cf', cost: 0, silhouette: 'needle' },
  guardian: { label: 'Guardian', speedBonus: -0.05, hull: 5, color: '#fc0', cost: 240, silhouette: 'bulwark' },
  striker: { label: 'Striker', speedBonus: 0.12, hull: 3, color: '#f66', cost: 190, silhouette: 'fang' },
};

export const BOOSTER_MODELS = {
  ion: { label: 'Ion Bloom', thrustBonus: 0.12, trail: '#0ff', cost: 0 },
  afterburner: { label: 'Afterburner', thrustBonus: 0.3, trail: '#f60', cost: 140 },
  warp: { label: 'Warp Skimmer', thrustBonus: 0.2, trail: '#b0f', cost: 180 },
};

export const WEAPON_TYPES = [
  { id: 'bullet', color: '#0cf', damage: 1, cost: 0, label: 'Pulse Bullets' },
  { id: 'laser', color: '#f44', damage: 2, cost: 120, label: 'Redline Laser' },
  { id: 'beam', color: '#fff', damage: 1.5, cost: 180, label: 'Piercing Beam' },
  { id: 'rocket', color: '#fa0', damage: 4, cost: 220, label: 'Blast Rockets' },
  { id: 'missile', color: '#8f8', damage: 3, cost: 260, label: 'Homing Missiles' },
  { id: 'emp', color: '#bdf', damage: 1, cost: 240, label: 'EMP Nova' },
];

export function buyShipModel(loadoutState, shipId) {
  const model = SHIP_MODELS[shipId];
  if (!model) return loadoutState;
  const ownedShips = loadoutState.ownedShips ?? ['interceptor'];
  const alreadyOwned = ownedShips.includes(shipId);
  if (!alreadyOwned && loadoutState.money < model.cost) return loadoutState;
  return {
    ...loadoutState,
    money: alreadyOwned ? loadoutState.money : loadoutState.money - model.cost,
    ownedShips: alreadyOwned ? ownedShips : [...ownedShips, shipId],
    player: {
      ...loadoutState.player,
      shipModel: shipId,
      lives: model.hull,
    },
  };
}

export function buyBoosterModel(loadoutState, boosterId) {
  const model = BOOSTER_MODELS[boosterId];
  if (!model) return loadoutState;
  const ownedBoosters = loadoutState.ownedBoosters ?? ['ion'];
  const alreadyOwned = ownedBoosters.includes(boosterId);
  if (!alreadyOwned && loadoutState.money < model.cost) return loadoutState;
  return {
    ...loadoutState,
    money: alreadyOwned ? loadoutState.money : loadoutState.money - model.cost,
    ownedBoosters: alreadyOwned ? ownedBoosters : [...ownedBoosters, boosterId],
    player: {
      ...loadoutState.player,
      boosterModel: boosterId,
    },
  };
}

export function buyWeaponUnlock(loadoutState, weaponId) {
  const model = WEAPON_TYPES.find(w => w.id === weaponId);
  if (!model) return loadoutState;
  const ownedWeapons = loadoutState.ownedWeapons ?? ['bullet'];
  const alreadyOwned = ownedWeapons.includes(weaponId);
  if (!alreadyOwned && loadoutState.money < model.cost) return loadoutState;
  return {
    ...loadoutState,
    money: alreadyOwned ? loadoutState.money : loadoutState.money - model.cost,
    ownedWeapons: alreadyOwned ? ownedWeapons : [...ownedWeapons, weaponId],
    player: {
      ...loadoutState.player,
      weaponType: weaponId,
    },
  };
}

export function cycleWeaponType(currentWeapon) {
  const ids = WEAPON_TYPES.map(w => w.id);
  const currentIndex = ids.indexOf(currentWeapon);
  return ids[(currentIndex + 1 + ids.length) % ids.length];
}

export function createPlayerShot({ weaponType = 'bullet', origin, weaponLevel = 1, target }) {
  const aim = normalizeVector((target?.x ?? origin.x + 100) - origin.x, (target?.y ?? origin.y) - origin.y);
  const base = {
    x: origin.x,
    y: origin.y,
    vx: aim.x * (8 + weaponLevel),
    vy: aim.y * (8 + weaponLevel),
    damage: weaponLevel,
    weaponType,
    color: WEAPON_TYPES.find(w => w.id === weaponType)?.color ?? '#0cf',
  };

  switch (weaponType) {
    case 'laser':
      return { ...base, kind: 'laser', width: 14 };
    case 'beam':
      return { ...base, kind: 'beam', pierce: true, width: 18 };
    case 'rocket':
      return { ...base, kind: 'rocket', splashRadius: 40, explosive: true };
    case 'missile':
      return { ...base, kind: 'missile', homing: true, turnRate: 0.08 };
    case 'emp':
      return { ...base, kind: 'emp', empRadius: 80, slowFactor: 0.45 };
    default:
      return { ...base, kind: 'bullet' };
  }
}

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

export function createInitialStageState() {
  return {
    stage: 1,
    stageKills: 0,
    stageGoal: 8,
    bossActive: false,
    bossDefeated: 0,
  };
}

export function advanceStageState(stageState) {
  const nextStage = Number(stageState.stage ?? 1) + 1;
  return {
    ...stageState,
    stage: nextStage,
    stageKills: 0,
    stageGoal: 8 + nextStage * 4,
    bossActive: false,
    bossDefeated: Number(stageState.bossDefeated ?? 0) + 1,
  };
}

export function defeatBoss(stageState) {
  const next = advanceStageState(stageState);
  return {
    ...next,
    stageClearBonus: 100 + next.stage * 25,
  };
}

export function recordStageKill(stageState) {
  const stageKills = Number(stageState.stageKills ?? 0) + 1;
  return {
    ...stageState,
    stageKills,
    readyForBoss: stageKills >= Number(stageState.stageGoal ?? 8),
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

export function createBoss({ stage = 1, canvasWidth, canvasHeight }) {
  const hp = 12 + stage * 8;
  return {
    boss: true,
    x: canvasWidth + 80,
    y: canvasHeight / 2,
    vx: -1.2 - stage * 0.1,
    vy: 1.2 + stage * 0.08,
    size: 46 + stage * 8,
    power: 2 + stage * 0.55,
    hp,
    maxHp: hp,
    reward: 180 + stage * 90,
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
