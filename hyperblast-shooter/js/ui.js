import { GAME_CONFIG, STAGE_THEMES, PLAYER_LEVELS, ROOM_TYPES } from './config.js';
import { prependHtml, renderAchievementToast, renderStoryMessage } from './render-safe.js';
import { ACTION_LABELS, ACTION_ORDER, bindingsForControlScheme, keyBindingsSummary, normalizeKeyBindings, rebindKey } from './input.js';

export class UIManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.notifications = [];
    this.panels = new Map();
    this.activeMenu = null;
    this.settings = this.loadSettings();
  }

  loadSettings() {
    const defaults = this.getDefaultSettings();
    try {
      const saved = JSON.parse(localStorage.getItem('shooter-settings') || 'null');
      if (!saved || typeof saved !== 'object') return defaults;
      const merged = { ...defaults, ...saved };
      merged.keyBindings = normalizeKeyBindings(saved.keyBindings || bindingsForControlScheme(merged.controlScheme));
      return merged;
    } catch {
      return defaults;
    }
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
      controlScheme: 'wasd',
      keyBindings: normalizeKeyBindings()
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
        prependHtml(list, this.formatStoryMessage(msg));
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
    return renderStoryMessage(message);
  }

  showAchievement(achievement) {
    const achievementPanel = document.getElementById('achievementPanel');
    if (achievementPanel && achievement) {
      const achievementHTML = renderAchievementToast(achievement);

      prependHtml(achievementPanel, achievementHTML);
      achievementPanel.style.display = 'block';

      setTimeout(() => {
        achievementPanel.style.display = 'none';
      }, 4000);
    }
  }

  renderKeyBindingRows() {
    const summary = keyBindingsSummary(this.settings.keyBindings);
    return ACTION_ORDER.map((action) => `
      <button id="binding-${action}" type="button" data-bind-action="${action}" style="display:flex;justify-content:space-between;gap:12px;align-items:center;padding:8px;border-radius:8px;border:1px solid rgba(0,255,255,.24);background:rgba(0,255,255,.06);color:#dff;cursor:pointer;font-family:inherit">
        <span>${ACTION_LABELS[action]}</span>
        <strong data-binding-label="${action}" style="color:#ff9">${summary[action]}</strong>
      </button>
    `).join('');
  }

  updateKeyBindingButtons(menu) {
    const summary = keyBindingsSummary(this.settings.keyBindings);
    ACTION_ORDER.forEach((action) => {
      const label = menu.querySelector(`[data-binding-label="${action}"]`);
      if (label) label.textContent = summary[action];
    });
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
            <option value="custom" ${this.settings.controlScheme === 'custom' ? 'selected' : ''}>Custom Bindings</option>
          </select>
          <div id="keyBindingGrid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px">
            ${this.renderKeyBindingRows()}
          </div>
          <button id="resetBindings" type="button" style="margin-top:8px;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.06);color:#dff;cursor:pointer;font-family:inherit">Reset Bindings</button>
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
            <option value="vs" ${this.settings.preferredRoomType === 'vs' ? 'selected' : ''}>Versus Mode</option>
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
    const controls = menu.querySelector('#setupControls');
    const resetBindings = menu.querySelector('#resetBindings');
    const startButton = menu.querySelector('#setupStart');
    const multiplayerButton = menu.querySelector('#setupMultiplayer');

    // Difficulty slider update
    if (difficultySlider && difficultyValue) {
      difficultySlider.addEventListener('input', () => {
        difficultyValue.textContent = difficultySlider.value;
      });
    }

    if (controls) {
      controls.addEventListener('change', () => {
        this.settings.controlScheme = controls.value;
        if (controls.value !== 'custom') {
          this.settings.keyBindings = bindingsForControlScheme(controls.value);
          this.updateKeyBindingButtons(menu);
        }
      });
    }

    menu.querySelectorAll('[data-bind-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.getAttribute('data-bind-action');
        const label = button.querySelector('[data-binding-label]');
        if (label) label.textContent = 'Press a key';
        const capture = (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.settings.controlScheme = 'custom';
          this.settings.keyBindings = rebindKey(this.settings.keyBindings, action, event.code);
          if (controls) controls.value = 'custom';
          this.updateKeyBindingButtons(menu);
          window.removeEventListener('keydown', capture, true);
        };
        window.addEventListener('keydown', capture, true);
      });
    });

    if (resetBindings) {
      resetBindings.addEventListener('click', () => {
        this.settings.controlScheme = 'custom';
        this.settings.keyBindings = normalizeKeyBindings();
        if (controls) controls.value = 'custom';
        this.updateKeyBindingButtons(menu);
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
    this.settings.keyBindings = this.settings.controlScheme === 'custom'
      ? normalizeKeyBindings(this.settings.keyBindings)
      : bindingsForControlScheme(this.settings.controlScheme);
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
