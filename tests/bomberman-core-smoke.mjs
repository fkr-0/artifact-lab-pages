import assert from 'node:assert/strict';
import {
  BOMB_FUSE_TICKS,
  createGame,
  dropBomb,
  movePlayer,
  tickGame,
} from '../app-hub/lib/bomberman-core.mjs';

const game = createGame({ players: 4, random: () => 0.99 });
assert.equal(game.players.length, 4, 'classic local game supports four players');
assert.equal(game.width, game.height, 'field is square');
assert.equal(game.players[0].bombLimit, 1, 'players start with one simultaneous bomb');
assert.equal(game.players[0].blastRange, 2, 'players start with short cross explosions');

const blocked = movePlayer(game, 0, { dx: -1, dy: 0 });
assert.equal(blocked.players[0].x, game.players[0].x, 'players cannot walk through the border wall');

let withBomb = dropBomb(game, 0);
assert.equal(withBomb.bombs.length, 1, 'dropping a bomb places one bomb');
assert.equal(withBomb.bombs[0].ownerId, 0, 'bomb tracks owner for simultaneous bomb limits');
assert.equal(withBomb.bombs[0].fuse, BOMB_FUSE_TICKS, 'bomb starts with default fuse');

const limitHeld = dropBomb(withBomb, 0);
assert.equal(limitHeld.bombs.length, 1, 'one-bomb limit prevents a second active bomb');

withBomb.players[0].bombLimit = 2;
const afterMove = movePlayer(withBomb, 0, { dx: 1, dy: 0 });
const upgradedBombs = dropBomb(afterMove, 0);
assert.equal(upgradedBombs.bombs.length, 2, 'bomb-limit upgrade allows more simultaneous bombs on different tiles');

let beforeExplosion = upgradedBombs;
for (let i = 0; i < BOMB_FUSE_TICKS - 1; i += 1) {
  beforeExplosion = tickGame(beforeExplosion, { random: () => 0.99 });
}
assert.equal(beforeExplosion.explosions.length, 0, 'bomb does not explode before fuse expires');

const exploded = tickGame(beforeExplosion, { random: () => 0.99 });
assert.ok(exploded.explosions.length > 0, 'expired bomb creates explosions');
assert.ok(exploded.explosions.some((cell) => cell.x === withBomb.bombs[0].x && cell.y === withBomb.bombs[0].y), 'explosion includes bomb center');
assert.ok(exploded.explosions.some((cell) => cell.x > withBomb.bombs[0].x), 'explosion extends horizontally as a cross arm');
assert.ok(exploded.explosions.some((cell) => cell.y > withBomb.bombs[0].y), 'explosion extends vertically as a cross arm');

const rangeGame = createGame({ players: 2, random: () => 0.99 });
rangeGame.players[0].blastRange = 4;
let rangeBomb = dropBomb(rangeGame, 0);
for (let i = 0; i < BOMB_FUSE_TICKS; i += 1) {
  rangeBomb = tickGame(rangeBomb, { random: () => 0.99 });
}
const maxHorizontalReach = Math.max(...rangeBomb.explosions.map((cell) => Math.abs(cell.x - rangeGame.players[0].x)));
assert.equal(maxHorizontalReach, 4, 'blast-range upgrade lengthens explosion cross arms');

const upgradeGame = createGame({ players: 2, random: () => 0 });
const breakable = upgradeGame.blocks.find((block) => block.type === 'breakable');
upgradeGame.bombs = [{ x: breakable.x - 1, y: breakable.y, ownerId: 0, fuse: 1, range: 2 }];
const upgraded = tickGame(upgradeGame, { random: () => 0 });
assert.ok(upgraded.upgrades.length >= 1, 'destroyed breakable blocks can drop upgrades');
assert.ok(['bomb-limit', 'blast-range'].includes(upgraded.upgrades[0].type), 'upgrade type is one of the two classic upgrade axes');

console.log('bomberman core smoke checks passed');
