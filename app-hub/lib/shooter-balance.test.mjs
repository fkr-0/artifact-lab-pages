import assert from 'node:assert/strict';
import {
  TURRET_COST,
  advanceStageState,
  createBoss,
  createInitialStageState,
  defeatBoss,
  deployTurret,
  recordStageKill,
  BOOSTER_MODELS,
  SHIP_MODELS,
  WEAPON_TYPES,
  createPlayerShot,
  cycleWeaponType,
  buyBoosterModel,
  buyShipModel,
  buyWeaponUnlock,
} from './shooter-balance.mjs';

const economy = { money: TURRET_COST, turrets: [], score: 0, upgrades: [] };
const nextEconomy = deployTurret(economy, { x: 10, y: 20 }, 1000);
assert.equal(nextEconomy.money, 0, 'deployTurret should charge the exported turret cost');
assert.equal(nextEconomy.turrets.length, 1, 'deployTurret should add one turret when affordable');

const stage = createInitialStageState();
assert.deepEqual(stage, {
  stage: 1,
  stageKills: 0,
  stageGoal: 8,
  bossActive: false,
  bossDefeated: 0,
});

const killState = recordStageKill({ ...stage, stageKills: 7 });
assert.equal(killState.stageKills, 8, 'recordStageKill should increment normal enemy kills');
assert.equal(killState.readyForBoss, true, 'stage should become boss-ready at the goal');

const boss = createBoss({ stage: 2, canvasWidth: 800, canvasHeight: 600 });
assert.equal(boss.boss, true, 'createBoss should create a boss entity');
assert.ok(boss.hp > 20, 'later-stage bosses should have a multi-hit hp pool');
assert.ok(boss.reward > 300, 'later-stage bosses should pay meaningful rewards');

const advanced = advanceStageState({ stage: 2, stageKills: 12, stageGoal: 12, bossActive: true, bossDefeated: 1 });
assert.equal(advanced.stage, 3, 'advanceStageState should move to the next stage');
assert.equal(advanced.stageKills, 0, 'advanceStageState should reset stage kills');
assert.equal(advanced.bossActive, false, 'advanceStageState should clear boss-active state');
assert.equal(advanced.stageGoal, 20, 'advanceStageState should scale the next goal');

const defeated = defeatBoss({ ...stage, bossActive: true });
assert.equal(defeated.stage, 2, 'defeatBoss should advance the stage');
assert.ok(defeated.stageClearBonus > 0, 'defeatBoss should expose an economy bonus');

assert.equal(SHIP_MODELS.interceptor.speedBonus > SHIP_MODELS.guardian.speedBonus, true, 'interceptor should be the speed ship');
assert.equal(BOOSTER_MODELS.afterburner.thrustBonus > 0, true, 'afterburner should improve thrust');
assert.deepEqual(WEAPON_TYPES.map(w => w.id), ['bullet', 'laser', 'beam', 'rocket', 'missile', 'emp']);
assert.equal(cycleWeaponType('bullet'), 'laser');
assert.equal(cycleWeaponType('emp'), 'bullet');

const origin = { x: 20, y: 30 };
const target = { x: 120, y: 40 };
assert.equal(createPlayerShot({ weaponType: 'laser', origin, weaponLevel: 1, target }).kind, 'laser');
assert.equal(createPlayerShot({ weaponType: 'beam', origin, weaponLevel: 2, target }).pierce, true);
assert.equal(createPlayerShot({ weaponType: 'rocket', origin, weaponLevel: 1, target }).splashRadius > 0, true);
assert.equal(createPlayerShot({ weaponType: 'missile', origin, weaponLevel: 1, target }).homing, true);
assert.equal(createPlayerShot({ weaponType: 'emp', origin, weaponLevel: 1, target }).empRadius > 0, true);

const shipPurchase = buyShipModel({ money: 500, ownedShips: ['interceptor'], player: { shipModel: 'interceptor' } }, 'guardian');
assert.equal(shipPurchase.money, 260, 'buyShipModel should subtract guardian cost');
assert.equal(shipPurchase.player.shipModel, 'guardian');
assert.equal(shipPurchase.player.lives, SHIP_MODELS.guardian.hull, 'ship purchase should apply hull');
assert.deepEqual(shipPurchase.ownedShips, ['interceptor', 'guardian']);
const shipEquip = buyShipModel(shipPurchase, 'interceptor');
assert.equal(shipEquip.money, 260, 'equipping an owned ship should not charge again');
assert.equal(shipEquip.player.shipModel, 'interceptor');

const boosterPurchase = buyBoosterModel({ money: 500, ownedBoosters: ['ion'], player: { boosterModel: 'ion' } }, 'warp');
assert.equal(boosterPurchase.money, 320, 'buyBoosterModel should subtract warp cost');
assert.equal(boosterPurchase.player.boosterModel, 'warp');
assert.deepEqual(boosterPurchase.ownedBoosters, ['ion', 'warp']);
const boosterEquip = buyBoosterModel(boosterPurchase, 'ion');
assert.equal(boosterEquip.money, 320, 'equipping an owned booster should not charge again');

const weaponUnlock = buyWeaponUnlock({ money: 500, ownedWeapons: ['bullet'], player: { weaponType: 'bullet' } }, 'rocket');
assert.equal(weaponUnlock.player.weaponType, 'rocket');
assert.ok(weaponUnlock.money < 500);
assert.deepEqual(weaponUnlock.ownedWeapons, ['bullet', 'rocket']);
const weaponEquip = buyWeaponUnlock(weaponUnlock, 'bullet');
assert.equal(weaponEquip.money, weaponUnlock.money, 'equipping an owned weapon should not charge again');
assert.equal(weaponEquip.player.weaponType, 'bullet');

console.log('shooter-balance tests passed');
