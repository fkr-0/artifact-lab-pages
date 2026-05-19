import { GAME_CONFIG, ROOM_TYPES } from './config.js';

export class MultiplayerManager {
  constructor(lobbyId, username) {
    this.lobbyId = lobbyId;
    this.username = username;
    this.lobby = null;
    this.connected = false;
    this.playerColor = this.getRandomColor();
    this.currentRoom = null;
    this.roomMembers = new Map();
    this.isHost = false;
    this.roomSettings = {
      type: ROOM_TYPES.PUBLIC,
      maxPlayers: 4,
      friendlyFire: false,
      allowSpectators: true,
      difficulty: 2
    };
  }

  getRandomColor() {
    const colors = ['#0cf', '#f0f', '#ff0', '#0f0', '#f60', '#f00', '#0ff', '#f80'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  async connect(PeernetLobby, storageKey = 'shooter-lobby', debug = false) {
    try {
      this.lobby = new PeernetLobby(this.lobbyId, {
        storageKey,
        debug
      });

      this.setupEventHandlers();

      await this.lobby.connect(this.username);
      this.connected = true;

      return { success: true, message: 'Connected to lobby' };
    } catch (error) {
      console.error('Failed to connect to lobby:', error);
      return { success: false, error: error.message };
    }
  }

  setupEventHandlers() {
    if (!this.lobby) return;

    this.lobby.addEventListener('status', (e) => {
      console.log('Lobby status:', e.detail);
      this.onStatusChange(e.detail);
    });

    this.lobby.addEventListener('peers', (e) => {
      this.onPeersUpdate(e.detail);
    });

    this.lobby.addEventListener('data', (e) => {
      this.onDataReceived(e.detail);
    });
  }

  onStatusChange(status) {
    console.log('Multiplayer status changed:', status);
    // Could trigger UI updates here
  }

  onPeersUpdate(peers) {
    // Handle peer list updates
    console.log('Peers updated:', peers);
  }

  onDataReceived({ from, data }) {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'game-state':
        this.handleGameStateUpdate(from, data.payload);
        break;
      case 'player-join':
        this.handlePlayerJoin(from, data.payload);
        break;
      case 'player-leave':
        this.handlePlayerLeave(from, data.payload);
        break;
      case 'room-invite':
        this.handleRoomInvite(from, data.payload);
        break;
      case 'chat-message':
        this.handleChatMessage(from, data.payload);
        break;
      case 'game-invite':
        this.handleGameInvite(from, data.payload);
        break;
    }
  }

  handleGameStateUpdate(from, payload) {
    // Update remote player state
    console.log('Game state update from:', from, payload);
  }

  handlePlayerJoin(from, payload) {
    console.log('Player joined:', from, payload);
    this.roomMembers.set(from, {
      username: payload.username,
      color: payload.color,
      ready: false,
      joinedAt: Date.now()
    });
  }

  handlePlayerLeave(from, payload) {
    console.log('Player left:', from, payload);
    this.roomMembers.delete(from);
  }

  handleRoomInvite(from, payload) {
    console.log('Room invite from:', from, payload);
    // Could show notification to user
  }

  handleChatMessage(from, payload) {
    console.log('Chat message from:', from, payload);
    // Could display in chat UI
  }

  handleGameInvite(from, payload) {
    console.log('Game invite from:', from, payload);
    // Could show invite dialog
  }

  broadcast(message) {
    if (!this.lobby || !this.connected) return false;

    try {
      this.lobby.broadcast(message);
      return true;
    } catch (error) {
      console.error('Failed to broadcast:', error);
      return false;
    }
  }

  sendToPeer(peerId, message) {
    if (!this.lobby || !this.connected) return false;

    try {
      this.lobby.send?.(peerId, message);
      return true;
    } catch (error) {
      console.error('Failed to send to peer:', error);
      return false;
    }
  }

  createRoom(settings) {
    this.roomSettings = { ...this.roomSettings, ...settings };
    this.currentRoom = this.generateRoomId();
    this.isHost = true;

    const roomMessage = {
      type: 'room-create',
      payload: {
        roomId: this.currentRoom,
        host: this.username,
        settings: this.roomSettings,
        createdAt: Date.now()
      }
    };

    this.broadcast(roomMessage);
    return this.currentRoom;
  }

  joinRoom(roomId) {
    if (this.currentRoom) {
      this.leaveRoom();
    }

    this.currentRoom = roomId;
    this.isHost = false;

    const joinMessage = {
      type: 'room-join',
      payload: {
        roomId,
        username: this.username,
        color: this.playerColor,
        joinedAt: Date.now()
      }
    };

    this.broadcast(joinMessage);
    return true;
  }

  leaveRoom() {
    if (!this.currentRoom) return false;

    const leaveMessage = {
      type: 'room-leave',
      payload: {
        roomId: this.currentRoom,
        username: this.username,
        leftAt: Date.now()
      }
    };

    this.broadcast(leaveMessage);
    this.currentRoom = null;
    this.isHost = false;
    this.roomMembers.clear();
    return true;
  }

  invitePlayer(peerId) {
    if (!this.currentRoom || !this.isHost) return false;

    const inviteMessage = {
      type: 'room-invite',
      payload: {
        roomId: this.currentRoom,
        host: this.username,
        settings: this.roomSettings
      }
    };

    return this.sendToPeer(peerId, inviteMessage);
  }

  sendGameState(gameState) {
    const stateMessage = {
      type: 'game-state',
      payload: {
        player: {
          x: gameState.player.x,
          y: gameState.player.y,
          lives: gameState.player.lives
        },
        score: gameState.score,
        stage: gameState.stage,
        stageKills: gameState.stageKills,
        timestamp: Date.now()
      }
    };

    return this.broadcast(stateMessage);
  }

  sendChatMessage(message) {
    const chatMessage = {
      type: 'chat-message',
      payload: {
        username: this.username,
        message,
        timestamp: Date.now()
      }
    };

    return this.broadcast(chatMessage);
  }

  findPublicRooms() {
    const searchMessage = {
      type: 'room-search',
      payload: {
        type: ROOM_TYPES.PUBLIC,
        requester: this.username,
        timestamp: Date.now()
      }
    };

    this.broadcast(searchMessage);
  }

  setPlayerReady(peerId, ready) {
    if (peerId === this.username || !this.isHost) return false;

    const readyMessage = {
      type: 'player-ready',
      payload: {
        peerId,
        ready,
        updatedBy: this.username,
        timestamp: Date.now()
      }
    };

    return this.broadcast(readyMessage);
  }

  startGame() {
    if (!this.isHost || !this.currentRoom) return false;

    const allReady = Array.from(this.roomMembers.values()).every(member => member.ready);

    if (!allReady) {
      return { success: false, message: 'Not all players are ready' };
    }

    const startMessage = {
      type: 'game-start',
      payload: {
        roomId: this.currentRoom,
        seed: Math.random(),
        settings: this.roomSettings,
        startedAt: Date.now()
      }
    };

    this.broadcast(startMessage);
    return { success: true, message: 'Game started' };
  }

  generateRoomId() {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getRoomMembers() {
    return Array.from(this.roomMembers.entries()).map(([peerId, member]) => ({
      peerId,
      ...member
    }));
  }

  getConnectionStatus() {
    return {
      connected: this.connected,
      username: this.username,
      color: this.playerColor,
      currentRoom: this.currentRoom,
      isHost: this.isHost,
      memberCount: this.roomMembers.size,
      maxPlayers: this.roomSettings.maxPlayers
    };
  }

  disconnect() {
    if (this.currentRoom) {
      this.leaveRoom();
    }

    if (this.lobby) {
      this.lobby.destroy?.();
      this.lobby = null;
    }

    this.connected = false;
    this.roomMembers.clear();
  }
}

export function createMultiplayerManager(lobbyId, username) {
  return new MultiplayerManager(lobbyId, username);
}
