import assert from 'node:assert/strict';
import {
  STARTING_MONEY,
  TURRET_COST,
  createInitialEconomy,
  createEnemy,
  calculateEnemyReward,
  deployTurret,
  updateTurrets,
  recordEnemyKill,
} from '../app-hub/lib/shooter-balance.mjs';

const baseEconomy = createInitialEconomy();
assert.equal(STARTING_MONEY, 200, 'v10 joining players start with 200 base money');
assert.equal(baseEconomy.score, 0, 'score starts at zero');
assert.equal(baseEconomy.money, 200, 'money starts at default base money');
assert.deepEqual(baseEconomy.upgrades, [], 'upgrade inventory scaffold exists for future shipyard/collectibles');

const weakSoloEnemy = createEnemy({
  canvasWidth: 1000,
  canvasHeight: 500,
  settings: { amount: 1, power: 1 },
  random: () => 0.5,
});
const strongCrowdEnemy = createEnemy({
  canvasWidth: 1000,
  canvasHeight: 500,
  settings: { amount: 5, power: 5 },
  random: () => 0.5,
});
assert.ok(strongCrowdEnemy.health > weakSoloEnemy.health, 'average power raises enemy health');
assert.ok(
  calculateEnemyReward(strongCrowdEnemy) > calculateEnemyReward(weakSoloEnemy),
  'stronger and more numerous enemy pressure pays more money per kill',
);

const paidEconomy = recordEnemyKill(baseEconomy, strongCrowdEnemy);
assert.ok(paidEconomy.score > baseEconomy.score, 'destroying enemies adds score');
assert.ok(paidEconomy.money > baseEconomy.money, 'destroying enemies pays money');

const afterDeploy = deployTurret(paidEconomy, { x: 80, y: 120 }, 1000);
assert.equal(afterDeploy.money, paidEconomy.money - TURRET_COST, 'turret deployment costs money');
assert.equal(afterDeploy.turrets.length, 1, 'deployment creates one turret');
assert.equal(afterDeploy.turrets[0].x, 80, 'turret drops at the player x position');
assert.equal(afterDeploy.turrets[0].y, 120, 'turret drops at the player y position');
assert.ok(afterDeploy.turrets[0].lifeMs > 0, 'turret has finite decay lifetime');
assert.ok(afterDeploy.turrets[0].health > 0, 'turret can decay through collisions');

const tooPoor = deployTurret({ ...baseEconomy, money: TURRET_COST - 1, turrets: [] }, { x: 1, y: 2 }, 1000);
assert.equal(tooPoor.money, TURRET_COST - 1, 'failed turret deployment does not spend money');
assert.equal(tooPoor.turrets.length, 0, 'failed turret deployment creates no turret');

const aimed = updateTurrets({
  turrets: [afterDeploy.turrets[0]],
  enemies: [{ id: 'target', x: 180, y: 120, health: 3, size: 24 }],
  now: 1300,
  deltaMs: 300,
});
assert.equal(aimed.bullets.length, 1, 'ready turret auto-fires at enemies');
assert.ok(aimed.bullets[0].vx > 0, 'turret shot points toward enemy x');
assert.ok(Math.abs(aimed.bullets[0].vy) < 0.0001, 'turret shot is precisely aimed at enemy y');
assert.ok(aimed.turrets[0].lifeMs < afterDeploy.turrets[0].lifeMs, 'turret lifetime decays over time');

const collided = updateTurrets({
  turrets: [{ ...afterDeploy.turrets[0], x: 180, y: 120, health: 1 }],
  enemies: [{ id: 'target', x: 180, y: 120, health: 3, size: 24 }],
  now: 1300,
  deltaMs: 300,
});
assert.equal(collided.turrets.length, 0, 'collisions consume turret health and remove spent turret');

console.log('shooter economy smoke checks passed');
