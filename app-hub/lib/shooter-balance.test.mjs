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
  ALLY_MODELS,
  SHIELD_MODELS,
  hireAlly,
  deployShield,
  updateAllies,
  updateShields,
  STORY_EVENTS,
  createInitialStoryState,
  updateStoryMode,
  BOSS_ARCHETYPES,
  ELITE_ARCHETYPES,
  createEliteEnemy,
  getBossArchetypeForStage,
  getEliteArchetypeForStage,
  getStageDifficultyBudget,
  simulateDifficultyCurve,
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


const allyHire = hireAlly({ money: 500, allies: [] }, 'wingman', { x: 40, y: 50 }, 1000);
assert.equal(allyHire.money, 320, 'hireAlly should subtract wingman hire cost');
assert.equal(allyHire.allies.length, 1, 'hireAlly should add one ally');
assert.equal(allyHire.allies[0].modelId, 'wingman');

const allyUpdate = updateAllies({
  allies: [{ id: 'a1', modelId: 'wingman', x: 0, y: 0, health: 2, lastShotAt: 0 }],
  player: { x: 100, y: 100 },
  enemies: [{ x: 160, y: 100, size: 20 }],
  enemyProjectiles: [{ x: 42, y: 78, vx: -2, vy: 0 }],
  now: 1000,
  deltaMs: 100,
});
assert.ok(allyUpdate.allies[0].x > 0, 'ally should drift toward formation near player');
assert.equal(allyUpdate.bullets.length, 1, 'ally should shoot at enemies when cooldown allows');
assert.equal(allyUpdate.enemyProjectiles.length, 0, 'ally should catch nearby enemy projectiles');
assert.ok(allyUpdate.allies[0].health < 2, 'catching a projectile should damage ally');

const shieldDeploy = deployShield({ money: 500, shields: [] }, 'bubble', { x: 80, y: 90 }, 2000);
assert.equal(shieldDeploy.money, 350, 'deployShield should subtract bubble shield cost');
assert.equal(shieldDeploy.shields.length, 1, 'deployShield should add a shield');

const shieldUpdate = updateShields({
  shields: shieldDeploy.shields,
  enemyProjectiles: [{ x: 80, y: 90, vx: -2, vy: 0 }],
  now: 2100,
  deltaMs: 100,
});
assert.equal(shieldUpdate.enemyProjectiles.length, 0, 'shield should absorb projectiles inside radius');
assert.ok(shieldUpdate.shields[0].health < SHIELD_MODELS.bubble.health, 'absorbing should damage shield');
assert.equal(ALLY_MODELS.wingman.role, 'escort');
assert.ok(SHIELD_MODELS.bubble.radius > 0);


const initialStory = createInitialStoryState(1000);
let storyResult = updateStoryMode({ story: initialStory, now: 4500, enemyCount: 0, enemyAmount: 2, stage: 1, bossActive: false });
assert.equal(storyResult.messages.length, 1, 'story should emit intro after a few seconds');
assert.equal(storyResult.messages[0].text, 'ok, lets get out of here..');
assert.equal(storyResult.messages[0].speaker, 'internal');

storyResult = updateStoryMode({ story: storyResult.story, now: 5000, enemyCount: 7, enemyAmount: 4, stage: 1, bossActive: false });
assert.equal(storyResult.messages.length, 1, 'story should react to irregular enemy pressure');
assert.equal(storyResult.messages[0].text, 'man whats that?');

const duplicateStory = updateStoryMode({ story: storyResult.story, now: 6000, enemyCount: 9, enemyAmount: 5, stage: 1, bossActive: false });
assert.equal(duplicateStory.messages.length, 0, 'story events should not repeat once seen');
assert.ok(STORY_EVENTS.some(event => event.id === 'pressure-spike'));


assert.deepEqual(BOSS_ARCHETYPES.map(b => b.id), ['blockade-carrier', 'harvester-dreadnought', 'prison-moon-core', 'logistics-oracle']);
assert.deepEqual(ELITE_ARCHETYPES.map(e => e.id), ['scout-pack', 'shieldbreaker', 'interdictor']);
assert.equal(getBossArchetypeForStage(1).id, 'blockade-carrier');
assert.equal(getBossArchetypeForStage(5).id, 'blockade-carrier', 'boss archetypes should cycle across long runs');
assert.equal(getEliteArchetypeForStage(2).id, 'shieldbreaker');

const stageBudgets = [1, 2, 3, 4, 5, 6].map(getStageDifficultyBudget);
for (let i = 1; i < stageBudgets.length; i++) {
  assert.ok(stageBudgets[i].threat > stageBudgets[i - 1].threat, 'stage threat should rise monotonically');
  assert.ok(stageBudgets[i].reward >= stageBudgets[i - 1].reward, 'stage rewards should keep pace with pressure');
}
assert.ok(stageBudgets[5].threat / stageBudgets[0].threat < 4.2, 'difficulty growth should stay bounded, not exponential');
assert.ok(stageBudgets[5].reliefBudget >= 1, 'later stages should include relief budget for shields/allies/repairs');

const elite = createEliteEnemy({ stage: 3, canvasWidth: 800, canvasHeight: 600, random: () => 0.5 });
assert.equal(elite.elite, true);
assert.ok(elite.reward > 40, 'elite should pay enough to support recovery purchases');
assert.ok(elite.health <= 9, 'in-between bosses should remain manageable');

const curve = simulateDifficultyCurve({ stages: 8, startingMoney: 200 });
assert.equal(curve.length, 8);
for (let i = 1; i < curve.length; i++) {
  assert.ok(curve[i].threat > curve[i - 1].threat, 'simulated threat should increase stage to stage');
  assert.ok(curve[i].manageable === true, `stage ${curve[i].stage} should stay manageable`);
}
assert.ok(curve.every(row => row.recoveryPurchases >= 1), 'each stage should afford at least one recovery/defense option');

console.log('shooter-balance tests passed');
