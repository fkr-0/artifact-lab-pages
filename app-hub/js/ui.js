import { GAME_CONFIG, STAGE_THEMES, PLAYER_LEVELS, ROOM_TYPES } from './config.js';

export class UIManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.notifications = [];
    this.panels = new Map();
    this.activeMenu = null;
    this.settings = this.loadSettings();
  }

  loadSettings() {
    const saved = localStorage.getItem('shooter-settings');
    return saved ? JSON.parse(saved) : this.getDefaultSettings();
  }

  getDefaultSettings() {
    return {
      playerName: 'Pilot',
      difficulty: 2,
      enableMusic: true,
      enableSound: true,
      enableParticles: true,
      showFPS: false,
      autoMultiplayer: true,
      preferredRoomType: ROOM_TYPES.PUBLIC,
      maxPlayers: 4,
      controlScheme: 'wasd'
    };
  }

  saveSettings() {
    localStorage.setItem('shooter-settings', JSON.stringify(this.settings));
  }

  showNotification(text, duration = GAME_CONFIG.NOTIFICATION_DURATION) {
    const notif = document.getElementById('notification');
    if (notif) {
      notif.textContent = text;
      notif.classList.add('visible');
      setTimeout(() => notif.classList.remove('visible'), duration);
    }
  }

  showStoryMessages(messages, containerId = 'storyMessages', panelId = 'storyPanel') {
    if (!messages.length) return;

    const panel = document.getElementById(panelId);
    const list = document.getElementById(containerId);

    if (panel && list) {
      panel.style.display = 'block';

      messages.forEach(msg => {
        const formattedMessage = this.formatStoryMessage(msg);
        list.innerHTML = formattedMessage + list.innerHTML;
      });

      // Clear existing timeout and set new one
      if (this.storyHideTimer) {
        clearTimeout(this.storyHideTimer);
      }

      this.storyHideTimer = setTimeout(() => {
        panel.style.display = 'none';
      }, GAME_CONFIG.STORY_MESSAGE_DURATION);
    }
  }

  formatStoryMessage(message) {
    const speakerStyle = message.speakerColor
      ? `color: ${message.speakerColor}`
      : 'color: #8cf';

    const roleText = message.role
      ? `<span style="opacity: 0.6; font-size: 11px;">[${message.role}]</span>`
      : '';

    return `
      <div style="opacity: 0.92; margin: 2px 0;">
        <span style="opacity: 0.45; ${speakerStyle}">${message.speakerName}&gt;</span>
        ${roleText}
        <span style="margin-left: 4px;">${message.text}</span>
      </div>
    `;
  }

  showAchievement(achievement) {
    const achievementPanel = document.getElementById('achievementPanel');
    if (achievementPanel && achievement) {
      const achievementHTML = `
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,140,0,0.1)); border: 2px solid rgba(255,215,0,0.3); border-radius: 8px; margin-bottom: 8px;">
          <div style="font-size: 24px;">🏆</div>
          <div style="flex: 1;">
            <div style="color: #ffd700; font-weight: bold; font-size: 14px;">${achievement.name}</div>
            <div style="color: #fff; font-size: 12px; opacity: 0.8;">${achievement.description}</div>
            <div style="color: #8f8; font-size: 11px;">+${achievement.xp} XP</div>
          </div>
        </div>
      `;

      achievementPanel.innerHTML = achievementHTML + achievementPanel.innerHTML;
      achievementPanel.style.display = 'block';

      setTimeout(() => {
        achievementPanel.style.display = 'none';
      }, 4000);
    }
  }

  createSetupMenu() {
    const setupMenu = document.createElement('div');
    setupMenu.id = 'setupMenu';
    setupMenu.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 8, 16, 0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      font-family: 'Share Tech Mono', monospace;
    `;

    setupMenu.innerHTML = `
      <div style="background: rgba(0, 20, 40, 0.9); border: 2px solid #0cf; border-radius: 12px; padding: 30px; max-width: 500px; width: 90%; box-shadow: 0 0 30px rgba(0,255,255,0.2);">
        <h1 style="color: #0cf; text-align: center; margin-bottom: 30px; text-shadow: 0 0 10px rgba(0,255,255,0.5);">HYPERBLAST SHOOTER</h1>

        <div class="setup-section" style="margin-bottom: 24px;">
          <label style="color: #0cf; font-size: 14px; display: block; margin-bottom: 8px;">PILOT NAME</label>
          <input type="text" id="setupPlayerName" value="${this.settings.playerName}"
                 style="width: 100%; padding: 10px; background: rgba(0,0,0,0.5); border: 1px solid #0cf; color: #fff; border-radius: 6px; font-family: inherit;">
        </div>

        <div class="setup-section" style="margin-bottom: 24px;">
          <label style="color: #0cf; font-size: 14px; display: block; margin-bottom: 8px;">
            DIFFICULTY: <strong id="setupDifficultyValue">${this.settings.difficulty}</strong>
          </label>
          <input type="range" id="setupDifficulty" min="1" max="5" step="1" value="${this.settings.difficulty}"
                 style="width: 100%; height: 6px; border-radius: 3px; background: #036;">
          <div style="color: #888; font-size: 11px; margin-top: 4px;">Higher difficulty = more enemies, better rewards</div>
        </div>

        <div class="setup-section" style="margin-bottom: 24px;">
          <label style="color: #0cf; font-size: 14px; display: block; margin-bottom: 8px;">CONTROL SCHEME</label>
          <select id="setupControls" style="width: 100%; padding: 10px; background: rgba(0,0,0,0.5); border: 1px solid #0cf; color: #fff; border-radius: 6px; font-family: inherit;">
            <option value="wasd" ${this.settings.controlScheme === 'wasd' ? 'selected' : ''}>WASD + Space</option>
            <option value="arrows" ${this.settings.controlScheme === 'arrows' ? 'selected' : ''}>Arrow Keys + Space</option>
            <option value="ijkl" ${this.settings.controlScheme === 'ijkl' ? 'selected' : ''}>IJKL + Space</option>
          </select>
        </div>

        <div class="setup-section" style="margin-bottom: 24px;">
          <label style="color: #0cf; font-size: 14px; display: block; margin-bottom: 12px;">MULTIPLAYER SETTINGS</label>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <label style="display: flex; align-items: center; gap: 6px; color: #8cf; font-size: 13px;">
              <input type="checkbox" id="setupAutoMultiplayer" ${this.settings.autoMultiplayer ? 'checked' : ''}>
              Auto-connect
            </label>
            <label style="display: flex; align-items: center; gap: 6px; color: #8cf; font-size: 13px;">
              <input type="checkbox" id="setupEnableMusic" ${this.settings.enableMusic ? 'checked' : ''}>
              Music
            </label>
            <label style="display: flex; align-items: center; gap: 6px; color: #8cf; font-size: 13px;">
              <input type="checkbox" id="setupEnableSound" ${this.settings.enableSound ? 'checked' : ''}>
              Sound Effects
            </label>
            <label style="display: flex; align-items: center; gap: 6px; color: #8cf; font-size: 13px;">
              <input type="checkbox" id="setupShowFPS" ${this.settings.showFPS ? 'checked' : ''}>
              Show FPS
            </label>
          </div>
        </div>

        <div class="setup-section" style="margin-bottom: 24px;">
          <label style="color: #0cf; font-size: 14px; display: block; margin-bottom: 8px;">ROOM TYPE</label>
          <select id="setupRoomType" style="width: 100%; padding: 10px; background: rgba(0,0,0,0.5); border: 1px solid #0cf; color: #fff; border-radius: 6px; font-family: inherit;">
            <option value="public" ${this.settings.preferredRoomType === 'public' ? 'selected' : ''}>Public Room</option>
            <option value="private" ${this.settings.preferredRoomType === 'private' ? 'selected' : ''}>Private Room</option>
            <option value="coop" ${this.settings.preferredRoomType === 'coop' ? 'selected' : ''}>Co-op Mode</option>
            <option value="ranked" ${this.settings.preferredRoomType === 'ranked' ? 'selected' : ''}>Ranked Match</option>
          </select>
        </div>

        <div style="display: flex; gap: 12px; margin-top: 30px;">
          <button id="setupStart" style="flex: 1; padding: 14px; background: linear-gradient(135deg, #0cf, #08a); border: none; border-radius: 8px; color: #000; font-weight: bold; font-size: 16px; cursor: pointer; transition: transform 0.1s, box-shadow 0.1s;">
            START MISSION
          </button>
          <button id="setupMultiplayer" style="flex: 1; padding: 14px; background: linear-gradient(135deg, #f0f, #a0f); border: none; border-radius: 8px; color: #000; font-weight: bold; font-size: 16px; cursor: pointer; transition: transform 0.1s, box-shadow 0.1s;">
            MULTIPLAYER
          </button>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
          <div style="margin-bottom: 8px;">Controls: Move | Space: Shoot | Q: Weapon | T: Deploy Turret</div>
          <div>Press <strong style="color: #0cf;">ESC</strong> during game for settings</div>
        </div>
      </div>
    `;

    this.attachSetupMenuHandlers(setupMenu);
    return setupMenu;
  }

  attachSetupMenuHandlers(menu) {
    const difficultySlider = menu.querySelector('#setupDifficulty');
    const difficultyValue = menu.querySelector('#setupDifficultyValue');
    const playerNameInput = menu.querySelector('#setupPlayerName');
    const startButton = menu.querySelector('#setupStart');
    const multiplayerButton = menu.querySelector('#setupMultiplayer');

    // Difficulty slider update
    if (difficultySlider && difficultyValue) {
      difficultySlider.addEventListener('input', () => {
        difficultyValue.textContent = difficultySlider.value;
      });
    }

    // Button hover effects
    [startButton, multiplayerButton].forEach(button => {
      if (button) {
        button.addEventListener('mouseenter', () => {
          button.style.transform = 'scale(1.05)';
          button.style.boxShadow = '0 0 20px rgba(255,255,255,0.3)';
        });

        button.addEventListener('mouseleave', () => {
          button.style.transform = 'scale(1)';
          button.style.boxShadow = 'none';
        });
      }
    });
  }

  showSetupMenu() {
    let menu = document.getElementById('setupMenu');
    if (!menu) {
      menu = this.createSetupMenu();
      document.body.appendChild(menu);
    }
    menu.style.display = 'flex';
    return menu;
  }

  hideSetupMenu() {
    const menu = document.getElementById('setupMenu');
    if (menu) {
      this.saveSettingsFromMenu(menu);
      menu.style.display = 'none';
    }
  }

  saveSettingsFromMenu(menu) {
    const playerName = menu.querySelector('#setupPlayerName');
    const difficulty = menu.querySelector('#setupDifficulty');
    const controls = menu.querySelector('#setupControls');
    const autoMultiplayer = menu.querySelector('#setupAutoMultiplayer');
    const enableMusic = menu.querySelector('#setupEnableMusic');
    const enableSound = menu.querySelector('#setupEnableSound');
    const showFPS = menu.querySelector('#setupShowFPS');
    const roomType = menu.querySelector('#setupRoomType');

    this.settings.playerName = playerName?.value || 'Pilot';
    this.settings.difficulty = parseInt(difficulty?.value) || 2;
    this.settings.controlScheme = controls?.value || 'wasd';
    this.settings.autoMultiplayer = autoMultiplayer?.checked || false;
    this.settings.enableMusic = enableMusic?.checked !== false;
    this.settings.enableSound = enableSound?.checked !== false;
    this.settings.showFPS = showFPS?.checked || false;
    this.settings.preferredRoomType = roomType?.value || 'public';

    this.saveSettings();
  }

  getSettings() {
    return { ...this.settings };
  }

  createPauseMenu() {
    const pauseMenu = document.createElement('div');
    pauseMenu.id = 'pauseMenu';
    pauseMenu.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 8, 16, 0.9);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 500;
      font-family: 'Share Tech Mono', monospace;
    `;

    pauseMenu.innerHTML = `
      <div style="background: rgba(0, 20, 40, 0.95); border: 2px solid #0cf; border-radius: 12px; padding: 30px; min-width: 300px;">
        <h2 style="color: #0cf; text-align: center; margin-bottom: 24px;">PAUSED</h2>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          <button id="pauseResume" style="padding: 12px; background: rgba(0,255,255,0.1); border: 1px solid #0cf; color: #0cf; border-radius: 6px; cursor: pointer; font-family: inherit;">
            RESUME
          </button>
          <button id="pauseSettings" style="padding: 12px; background: rgba(0,255,255,0.1); border: 1px solid #0cf; color: #0cf; border-radius: 6px; cursor: pointer; font-family: inherit;">
            SETTINGS
          </button>
          <button id="pauseRestart" style="padding: 12px; background: rgba(255,100,100,0.1); border: 1px solid #f64; color: #f64; border-radius: 6px; cursor: pointer; font-family: inherit;">
            RESTART
          </button>
          <button id="pauseQuit" style="padding: 12px; background: rgba(255,100,100,0.1); border: 1px solid #f64; color: #f64; border-radius: 6px; cursor: pointer; font-family: inherit;">
            QUIT TO MENU
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(pauseMenu);
    return pauseMenu;
  }

  showPauseMenu() {
    let menu = document.getElementById('pauseMenu');
    if (!menu) {
      menu = this.createPauseMenu();
    }
    menu.style.display = 'flex';
    return menu;
  }

  hidePauseMenu() {
    const menu = document.getElementById('pauseMenu');
    if (menu) {
      menu.style.display = 'none';
    }
  }

  updateHUD(gameState) {
    const hudElements = {
      score: document.getElementById('score'),
      money: document.getElementById('money'),
      lives: document.getElementById('lives'),
      stage: document.getElementById('stage'),
      environmentName: document.getElementById('environmentName'),
      stageKills: document.getElementById('stageKills'),
      stageGoal: document.getElementById('stageGoal'),
      bossStatus: document.getElementById('bossStatus'),
      weaponLevel: document.getElementById('weaponLevel'),
      boostLevel: document.getElementById('boostLevel'),
      shipModel: document.getElementById('shipModel'),
      weaponType: document.getElementById('weaponType'),
      turretCount: document.getElementById('turretCount')
    };

    if (hudElements.score) hudElements.score.textContent = gameState.score;
    if (hudElements.money) hudElements.money.textContent = Math.floor(gameState.money);
    if (hudElements.lives) hudElements.lives.textContent = gameState.player.lives;
    if (hudElements.stage) hudElements.stage.textContent = gameState.stage;

    const theme = STAGE_THEMES[(gameState.stage - 1) % STAGE_THEMES.length];
    if (hudElements.environmentName) hudElements.environmentName.textContent = theme.name;
    if (hudElements.stageKills) hudElements.stageKills.textContent = gameState.stageKills;
    if (hudElements.stageGoal) hudElements.stageGoal.textContent = gameState.stageGoal;
    if (hudElements.bossStatus) hudElements.bossStatus.textContent = gameState.bossActive ? 'ACTIVE' : 'none';
    if (hudElements.weaponLevel) hudElements.weaponLevel.textContent = gameState.player.weaponLevel;
    if (hudElements.boostLevel) hudElements.boostLevel.textContent = gameState.player.boostLevel;
    if (hudElements.shipModel) hudElements.shipModel.textContent = gameState.player.shipModel;
    if (hudElements.weaponType) hudElements.weaponType.textContent = gameState.player.weaponType;
    if (hudElements.turretCount) hudElements.turretCount.textContent = gameState.turrets.length;
  }

  showGameOverScreen(finalScore) {
    const gameOverScreen = document.getElementById('gameOverScreen');
    const finalScoreElement = document.getElementById('finalScore');

    if (gameOverScreen) {
      gameOverScreen.classList.add('visible');
    }

    if (finalScoreElement) {
      finalScoreElement.textContent = finalScore;
    }
  }

  hideGameOverScreen() {
    const gameOverScreen = document.getElementById('gameOverScreen');
    if (gameOverScreen) {
      gameOverScreen.classList.remove('visible');
    }
  }
}

export function createUIManager(canvas) {
  return new UIManager(canvas);
}
