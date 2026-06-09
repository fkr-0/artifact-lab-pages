import assert from 'node:assert/strict';
import { ROOM_TYPES } from '../hyperblast-shooter/js/config.js';
import { MultiplayerManager } from '../hyperblast-shooter/js/multiplayer.js';

assert.equal(ROOM_TYPES.COOP, 'coop', 'coop mode should remain available');
assert.equal(ROOM_TYPES.VS, 'vs', 'versus mode should be available');

const manager = new MultiplayerManager('test-lobby', 'Pilot');
assert.equal(manager.roomSettings.type, ROOM_TYPES.PUBLIC, 'default room type should remain public');
assert.equal(manager.roomSettings.matchMode, ROOM_TYPES.COOP, 'default match mode should be coop');

const roomId = manager.createRoom({ type: ROOM_TYPES.VS, matchMode: ROOM_TYPES.VS, friendlyFire: true, maxPlayers: 2 });
assert.ok(roomId.startsWith('room_'), 'createRoom should return a generated room id');
assert.equal(manager.currentRoom, roomId, 'createRoom should store the active room id');
assert.equal(manager.roomSettings.type, ROOM_TYPES.VS, 'VS room type should be stored');
assert.equal(manager.roomSettings.matchMode, ROOM_TYPES.VS, 'VS match mode should be stored');
assert.equal(manager.roomSettings.friendlyFire, true, 'VS mode should allow friendly-fire style settings');

const status = manager.getConnectionStatus();
assert.equal(status.matchMode, ROOM_TYPES.VS, 'connection status should expose match mode');
assert.equal(status.roomType, ROOM_TYPES.VS, 'connection status should expose room type');

console.log('hyperblast multiplayer mode smoke checks passed');
