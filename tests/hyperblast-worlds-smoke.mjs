import assert from 'node:assert/strict';
import {
  WORLD_NODES,
  WORLD_ROUTES,
  applyQuestUnlocks,
  canVisitWorld,
  createWorldProgress,
  findWorld,
  mergeWorldProgress,
  routeUnlockHint,
  visitWorld,
} from '../hyperblast-shooter/js/worlds.js';

assert.equal(WORLD_NODES.length, 5, 'world map should expose the five core sectors from story docs');
assert.deepEqual(
  WORLD_NODES.map((world) => world.id),
  ['neon-drift', 'ember-belt', 'verdant-ion-reef', 'violet-singularity', 'frozen-relay'],
  'world ids should be stable for save data and tests'
);
assert.deepEqual(WORLD_ROUTES.map((route) => route.id), [
  'route-neon-ember',
  'route-ember-reef',
  'route-reef-violet',
  'route-violet-frozen',
]);

const progress = createWorldProgress();
assert.equal(progress.currentWorldId, 'neon-drift');
assert.equal(canVisitWorld(progress, 'ember-belt'), true, 'Ember should be reachable as the first route');
assert.equal(canVisitWorld(progress, 'verdant-ion-reef'), false, 'Verdant should start locked behind Ember intel');
assert.equal(routeUnlockHint('verdant-ion-reef'), 'requires heat-haze-signal');
assert.equal(findWorld('ember-belt').stage, 2);

const blocked = visitWorld(progress, 'verdant-ion-reef');
assert.equal(blocked.visited, false);
assert.equal(blocked.progress.currentWorldId, 'neon-drift');

const ember = visitWorld(progress, 'ember-belt');
assert.equal(ember.visited, true);
assert.equal(ember.progress.currentWorldId, 'ember-belt');
assert.equal(progress.currentWorldId, 'neon-drift', 'visitWorld should return immutable progress changes');

const unlockedReef = applyQuestUnlocks(progress, { unlockedIntelIds: ['heat-haze-signal'] });
assert.equal(canVisitWorld(unlockedReef, 'verdant-ion-reef'), true);
assert.ok(unlockedReef.unlockedRouteIds.includes('route-ember-reef'));
assert.equal(visitWorld(unlockedReef, 'verdant-ion-reef').visited, true);

const merged = mergeWorldProgress({ discoveredWorldIds: ['frozen-relay'], unlockedRouteIds: ['route-violet-frozen'] });
assert.equal(canVisitWorld(merged, 'neon-drift'), true, 'merge should preserve starting world');
assert.equal(canVisitWorld(merged, 'frozen-relay'), true, 'merge should keep saved discoveries');

console.log('hyperblast world map smoke checks passed');
