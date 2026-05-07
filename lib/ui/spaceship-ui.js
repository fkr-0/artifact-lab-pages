/**
 * Spaceship UI Library
 *
 * A comprehensive UI library extracted from v9 portal featuring:
 * - 8 cyberpunk themes (default, synthwave, cyberpunk, retro8bit, midnight, vaporwave, neon-rust, matrix)
 * - Floating menus/drawers system
 * - Settings panel with theme switching
 * - Sound effects integration
 * - Artifact launcher (tab/fullscreen/new window modes)
 * - Modal/toast/notification system
 * - Responsive grid layouts
 * - Draggable components
 * - Context menus
 */

class SpaceshipUI {
  constructor(opts = {}) {
    this.version = '1.0.0';
    this.debug = opts.debug || false;
    this.currentTheme = opts.defaultTheme || 'default';
    this.soundEnabled = opts.soundEnabled !== false;
    this.soundVolume = opts.soundVolume ?? 0.3;
    this.soundTheme = opts.soundTheme || 'retro';
    this.container = opts.container || document.body;

    // Audio context for sound effects
    this.audioContext = null;

    // Event callbacks
    this.onThemeChange = opts.onThemeChange || (() => {});
    this.onSoundChange = opts.onSoundChange || (() => {});

    this._init();
  }

  _init() {
    // Load saved settings
    this._loadSettings();

    // Apply initial theme
    this.setTheme(this.currentTheme, false);

    // Initialize audio on first interaction
    this._initAudio();
  }

  _log(...args) {
    if (this.debug) console.log('[SpaceshipUI]', ...args);
  }

  _loadSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem('spaceship-ui-settings') || '{}');
      this.currentTheme = settings.theme || this.currentTheme;
      this.soundEnabled = settings.soundEnabled !== undefined ? settings.soundEnabled : this.soundEnabled;
      this.soundVolume = settings.volume ?? this.soundVolume;
      this.soundTheme = settings.soundTheme || this.soundTheme;
    } catch (e) {
      this._log('Failed to load settings', e);
    }
  }

  _saveSettings() {
    const settings = {
      theme: this.currentTheme,
      soundEnabled: this.soundEnabled,
      volume: this.soundVolume,
      soundTheme: this.soundTheme
    };
    localStorage.setItem('spaceship-ui-settings', JSON.stringify(settings));
  }

  _initAudio() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // ============================================
  // THEME SYSTEM
  // ============================================

  getThemes() {
    return [
      { id: 'default', name: 'NEXUS', primary: '#00ffff', secondary: '#0088ff' },
      { id: 'synthwave', name: 'Synthwave', primary: '#ff00ff', secondary: '#ffaa00' },
      { id: 'cyberpunk', name: 'Cyberpunk', primary: '#f0e68c', secondary: '#ff0080' },
      { id: 'retro8bit', name: 'Retro 8-Bit', primary: '#33ff00', secondary: '#ffb000' },
      { id: 'midnight', name: 'Midnight', primary: '#87ceeb', secondary: '#ffd700' },
      { id: 'vaporwave', name: 'Vaporwave', primary: '#ff71ce', secondary: '#01cdfe' },
      { id: 'neon-rust', name: 'Neon Rust', primary: '#ff8c00', secondary: '#ff4500' },
      { id: 'matrix', name: 'Matrix', primary: '#00ff41', secondary: '#39ff14' }
    ];
  }

  setTheme(themeId, save = true) {
    if (!this.getThemes().find(t => t.id === themeId)) {
      this._log('Invalid theme:', themeId);
      return;
    }

    this.currentTheme = themeId;
    this.container.setAttribute('data-theme', themeId);

    if (save) {
      this._saveSettings();
      this.onThemeChange(themeId);
      this.playSound('success');
    }

    this._log('Theme set to:', themeId);
  }

  getCurrentTheme() {
    return this.getThemes().find(t => t.id === this.currentTheme);
  }

  // ============================================
  // SOUND SYSTEM
  // ============================================

  getSoundThemes() {
    return ['retro', 'soft', 'glitch'];
  }

  playSound(type = 'click', force = false) {
    if (!force && !this.soundEnabled) return;

    this._initAudio();

    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const sets = {
      retro: {
        click: [880, 'square'],
        success: [1320, 'triangle'],
        join: [660, 'sawtooth'],
        leave: [220, 'sine'],
        chat: [980, 'triangle'],
        ping: [1500, 'square'],
        error: [220, 'sawtooth'],
        notification: [1100, 'sine']
      },
      soft: {
        click: [420, 'sine'],
        success: [720, 'triangle'],
        join: [540, 'triangle'],
        leave: [260, 'sine'],
        chat: [620, 'sine'],
        ping: [840, 'triangle'],
        error: [260, 'triangle'],
        notification: [660, 'sine']
      },
      glitch: {
        click: [1200, 'square'],
        success: [2100, 'sawtooth'],
        join: [180, 'square'],
        leave: [90, 'sine'],
        chat: [1660, 'square'],
        ping: [2600, 'sawtooth'],
        error: [150, 'sawtooth'],
        notification: [1900, 'square']
      }
    };

    const def = (sets[this.soundTheme] || sets.retro)[type] || sets.retro.click;
    const now = ctx.currentTime;
    osc.frequency.value = def[0];
    osc.type = def[1];
    gain.gain.setValueAtTime(Math.max(0.001, this.soundVolume), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
    this._saveSettings();
    this.onSoundChange({ enabled });
    this.playSound('success', true);
  }

  setSoundVolume(volume) {
    this.soundVolume = Math.max(0, Math.min(1, parseFloat(volume) || 0));
    this._saveSettings();
    this.onSoundChange({ volume: this.soundVolume });
  }

  setSoundTheme(theme) {
    if (!this.getSoundThemes().includes(theme)) return;
    this.soundTheme = theme;
    this._saveSettings();
    this.playSound('success', true);
    this.onSoundChange({ soundTheme: theme });
  }

  // ============================================
  // SETTINGS PANEL
  // ============================================

  createSettingsPanel(opts = {}) {
    const panel = document.createElement('div');
    panel.className = 'spaceship-settings-panel';
    panel.innerHTML = `
      <div class="settings-backdrop"></div>
      <div class="settings-drawer">
        <div class="settings-drawer-hdr">
          <span class="settings-drawer-title">SYSTEM SETTINGS</span>
          <button class="settings-close" aria-label="Close settings">×</button>
        </div>
        <div class="settings-body">
          <div>
            <div class="settings-sect-title">THEME</div>
            <div class="theme-grid">
              ${this.getThemes().map(t => `
                <div class="theme-btn ${t.id === this.currentTheme ? 'active' : ''}" data-theme="${t.id}" title="${t.name}">
                  <span class="theme-btn-label">${t.name}</span>
                </div>
              `).join('')}
            </div>
          </div>
          <div>
            <div class="settings-sect-title">SOUND</div>
            <div class="setting-row">
              <span>Enable UI sounds</span>
              <div class="toggle-sw ${this.soundEnabled ? 'on' : ''}" data-setting="soundEnabled"></div>
            </div>
            <div class="setting-row">
              <span>Volume</span>
              <input type="range" class="sound-range" min="0" max="1" step="0.01" value="${this.soundVolume}" data-setting="volume">
            </div>
            <div class="setting-row">
              <span>Sound theme</span>
              <select class="sound-select" data-setting="soundTheme">
                ${this.getSoundThemes().map(t => `
                  <option value="${t}" ${t === this.soundTheme ? 'selected' : ''}>${t}</option>
                `).join('')}
              </select>
            </div>
            <div class="setting-row">
              <span>Test sound</span>
              <button class="mini-btn" data-action="testSound">Test</button>
            </div>
          </div>
          ${opts.extraSections || ''}
        </div>
      </div>
    `;

    // Event handlers
    const backdrop = panel.querySelector('.settings-backdrop');
    const drawer = panel.querySelector('.settings-drawer');
    const closeBtn = panel.querySelector('.settings-close');

    const close = () => {
      panel.classList.remove('open');
      setTimeout(() => panel.remove(), 300);
    };

    const open = () => {
      document.body.appendChild(panel);
      setTimeout(() => panel.classList.add('open'), 10);
    };

    backdrop.addEventListener('click', close);
    closeBtn.addEventListener('click', close);

    // Theme buttons
    panel.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        this.setTheme(theme);
        panel.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === theme));
      });
    });

    // Sound settings
    panel.querySelectorAll('[data-setting]').forEach(el => {
      const setting = el.dataset.setting;
      el.addEventListener('change', () => {
        if (setting === 'soundEnabled') {
          this.setSoundEnabled(!this.soundEnabled);
          el.classList.toggle('on', this.soundEnabled);
        } else if (setting === 'volume') {
          this.setSoundVolume(el.value);
        } else if (setting === 'soundTheme') {
          this.setSoundTheme(el.value);
        }
      });
    });

    // Test sound button
    panel.querySelector('[data-action="testSound"]')?.addEventListener('click', () => {
      this.playSound('click', true);
    });

    // Custom settings callback
    if (opts.onSettingsReady) {
      opts.onSettingsReady(panel);
    }

    panel.open = open;
    panel.close = close;

    return panel;
  }

  // ============================================
  // FLOATING MENUS
  // ============================================

  createContextMenu(opts = {}) {
    const menu = document.createElement('div');
    menu.className = 'spaceship-context-menu';
    menu.innerHTML = (opts.items || []).map(item => `
      <div class="context-menu-item" data-action="${item.action}">
        ${item.icon ? `<span>${item.icon}</span>` : ''}
        <span>${item.label}</span>
      </div>
    `).join('');

    menu.addEventListener('click', (e) => {
      const item = e.target.closest('.context-menu-item');
      if (item) {
        const action = item.dataset.action;
        const callback = opts.items.find(i => i.action === action)?.callback;
        if (callback) callback();
        menu.remove();
      }
    });

    menu.showAt = (x, y) => {
      menu.style.left = x + 'px';
      menu.style.top = y + 'px';
      menu.style.display = 'block';

      const close = () => {
        menu.remove();
        document.removeEventListener('click', close);
        document.removeEventListener('contextmenu', close);
      };

      setTimeout(() => {
        document.addEventListener('click', close);
        document.addEventListener('contextmenu', close);
      }, 10);
    };

    return menu;
  }

  // ============================================
  // ARTIFACT LAUNCHER
  // ============================================

  launchArtifact(url, opts = {}) {
    const mode = opts.mode || 'tab'; // tab, fullscreen, window

    if (mode === 'fullscreen') {
      window.open(url, '_blank', 'fullscreen=yes');
    } else if (mode === 'window') {
      const width = opts.width || 800;
      const height = opts.height || 600;
      const left = opts.left || (screen.width - width) / 2;
      const top = opts.top || (screen.height - height) / 2;
      window.open(url, '_blank', `width=${width},height=${height},left=${left},top=${top}`);
    } else {
      window.open(url, '_blank');
    }

    this.playSound('success');
  }

  // ============================================
  // MODALS
  // ============================================

  createModal(opts = {}) {
    const modal = document.createElement('div');
    modal.className = 'spaceship-modal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        ${opts.title ? `<div class="modal-header"><h3>${opts.title}</h3></div>` : ''}
        <div class="modal-body">${opts.content || ''}</div>
        ${opts.footer !== false ? `
          <div class="modal-footer">
            <button class="modal-btn modal-btn-cancel">Cancel</button>
            <button class="modal-btn modal-btn-confirm">Confirm</button>
          </div>
        ` : ''}
      </div>
    `;

    const backdrop = modal.querySelector('.modal-backdrop');
    const confirmBtn = modal.querySelector('.modal-btn-confirm');
    const cancelBtn = modal.querySelector('.modal-btn-cancel');

    const close = () => {
      modal.classList.remove('open');
      setTimeout(() => modal.remove(), 300);
    };

    const open = () => {
      document.body.appendChild(modal);
      setTimeout(() => modal.classList.add('open'), 10);
    };

    backdrop.addEventListener('click', close);
    cancelBtn.addEventListener('click', () => {
      if (opts.onCancel) opts.onCancel();
      close();
    });
    confirmBtn.addEventListener('click', () => {
      if (opts.onConfirm) opts.onConfirm();
      close();
    });

    modal.open = open;
    modal.close = close;

    return modal;
  }

  // ============================================
  // TOAST NOTIFICATIONS
  // ============================================

  showToast(message, opts = {}) {
    const toast = document.createElement('div');
    toast.className = 'spaceship-toast';
    if (opts.type) toast.classList.add(`toast-${opts.type}`);
    toast.innerHTML = `
      <span class="toast-message">${message}</span>
      ${opts.dismissible !== false ? '<button class="toast-close">×</button>' : ''}
    `;

    const close = () => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    };

    toast.querySelector('.toast-close')?.addEventListener('click', close);

    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);

    if (opts.duration) {
      setTimeout(close, opts.duration);
    }

    this.playSound('notification');
    return toast;
  }

  // ============================================
  // DRAGGABLE
  // ============================================

  makeDraggable(element, opts = {}) {
    const handle = opts.handle || element;
    let isDragging = false;
    let startX, startY, initialX, initialY;

    const startDrag = (e) => {
      if (e.button !== 0) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialX = element.offsetLeft;
      initialY = element.offsetTop;
      element.style.position = 'fixed';
      e.preventDefault();
    };

    const drag = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      element.style.left = (initialX + dx) + 'px';
      element.style.top = (initialY + dy) + 'px';
    };

    const endDrag = () => {
      isDragging = false;
    };

    handle.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);

    return () => {
      handle.removeEventListener('mousedown', startDrag);
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', endDrag);
    };
  }
}

// ============================================
// CSS STYLES
// ============================================

const SPACESHIP_UI_CSS = `
.spaceship-ui-container {
  --bg-primary: #0a0a12;
  --bg-secondary: #12121f;
  --fg-primary: #00ffff;
  --fg-secondary: #0088ff;
  --accent: #ff0066;
  --accent-secondary: #ff0080;
  --glow-primary: rgba(0,255,255,0.5);
  --glow-secondary: rgba(0,136,255,0.4);
  --grid-color: rgba(0,255,255,0.08);
  font-family: 'Share Tech Mono', 'Courier New', monospace;
  transition: background 0.4s ease, color 0.3s ease;
}

.spaceship-ui-container[data-theme='synthwave'] {
  --bg-primary: #1a0a2e; --bg-secondary: #2d1b4e;
  --fg-primary: #ff00ff; --fg-secondary: #00ffff;
  --accent: #ff6ec7; --accent-secondary: #ffaa00;
  --glow-primary: rgba(255,0,255,0.6); --glow-secondary: rgba(255,170,0,0.5);
  --grid-color: rgba(255,0,255,0.12);
}

.spaceship-ui-container[data-theme='cyberpunk'] {
  --bg-primary: #0d0d0d; --bg-secondary: #1a1a1a;
  --fg-primary: #f0e68c; --fg-secondary: #ff0080;
  --accent: #00ff41; --accent-secondary: #ff073a;
  --glow-primary: rgba(240,230,140,0.6); --glow-secondary: rgba(255,0,128,0.5);
  --grid-color: rgba(240,230,140,0.06);
}

.spaceship-ui-container[data-theme='retro8bit'] {
  --bg-primary: #0f0f0f; --bg-secondary: #1a1a0a;
  --fg-primary: #33ff00; --fg-secondary: #ffb000;
  --accent: #00ff88; --accent-secondary: #ff4444;
  --glow-primary: rgba(51,255,0,0.5); --glow-secondary: rgba(255,176,0,0.5);
  --grid-color: rgba(51,255,0,0.1);
}

.spaceship-ui-container[data-theme='midnight'] {
  --bg-primary: #0a1628; --bg-secondary: #0f2140;
  --fg-primary: #87ceeb; --fg-secondary: #c0c0c0;
  --accent: #4169e1; --accent-secondary: #ffd700;
  --glow-primary: rgba(135,206,235,0.5); --glow-secondary: rgba(192,192,192,0.4);
  --grid-color: rgba(135,206,235,0.08);
}

.spaceship-ui-container[data-theme='vaporwave'] {
  --bg-primary: #1a0a20; --bg-secondary: #2d1536;
  --fg-primary: #ff71ce; --fg-secondary: #01cdfe;
  --accent: #b967ff; --accent-secondary: #05ffa1;
  --glow-primary: rgba(255,113,206,0.5); --glow-secondary: rgba(1,205,254,0.5);
  --grid-color: rgba(185,103,255,0.1);
}

.spaceship-ui-container[data-theme='neon-rust'] {
  --bg-primary: #0e0a04; --bg-secondary: #1c1408;
  --fg-primary: #ff8c00; --fg-secondary: #ff4500;
  --accent: #ffd700; --accent-secondary: #ff6347;
  --glow-primary: rgba(255,140,0,0.6); --glow-secondary: rgba(255,69,0,0.5);
  --grid-color: rgba(255,140,0,0.08);
}

.spaceship-ui-container[data-theme='matrix'] {
  --bg-primary: #000300; --bg-secondary: #001200;
  --fg-primary: #00ff41; --fg-secondary: #008f11;
  --accent: #00ff41; --accent-secondary: #39ff14;
  --glow-primary: rgba(0,255,65,0.6); --glow-secondary: rgba(0,143,17,0.5);
  --grid-color: rgba(0,255,65,0.06);
}

/* Settings Panel */
.settings-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 1400;
  background: rgba(0,0,0,0.5);
}
.settings-backdrop.open {
  display: block;
}

.settings-drawer {
  position: fixed;
  top: 0;
  right: -420px;
  width: 400px;
  height: 100vh;
  background: var(--bg-secondary);
  border-left: 1px solid var(--fg-primary);
  z-index: 1500;
  transition: right 0.3s ease;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-shadow: -10px 0 40px rgba(0,0,0,0.6);
}
.settings-drawer.open {
  right: 0;
}

.settings-drawer-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--fg-primary);
  flex-shrink: 0;
}

.settings-drawer-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.85rem;
  color: var(--fg-primary);
  letter-spacing: 0.12em;
}

.settings-close {
  background: none;
  border: 1px solid rgba(255,0,102,0.3);
  color: var(--accent-secondary);
  padding: 0.2rem 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
  border-radius: 3px;
  line-height: 1;
}

.settings-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.settings-sect-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--accent);
  margin-bottom: 0.6rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--fg-primary);
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.theme-btn {
  aspect-ratio: 1;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid rgba(255,255,255,0.1);
  transition: all 0.15s;
  position: relative;
  overflow: hidden;
}
.theme-btn:hover {
  transform: scale(1.08);
  border-color: rgba(255,255,255,0.4);
}
.theme-btn.active {
  border-color: var(--fg-primary);
  box-shadow: 0 0 12px var(--glow-primary);
}

.theme-btn-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.6);
  font-size: 0.45rem;
  font-family: 'Orbitron', sans-serif;
  text-align: center;
  padding: 0.15rem 0;
  color: #fff;
  letter-spacing: 0.05em;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--grid-color);
  font-size: 0.75rem;
}

.toggle-sw {
  width: 36px;
  height: 18px;
  border-radius: 9px;
  background: var(--bg-primary);
  border: 1px solid var(--fg-primary);
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  flex-shrink: 0;
}
.toggle-sw::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--fg-primary);
  transition: all 0.2s;
}
.toggle-sw.on {
  background: var(--accent);
  border-color: var(--accent);
}
.toggle-sw.on::after {
  left: 20px;
  background: #fff;
  box-shadow: 0 0 6px var(--accent);
}

.sound-select, .sound-range {
  width: 120px;
  background: var(--bg-primary);
  color: var(--fg-primary);
  border: 1px solid var(--fg-primary);
  border-radius: 4px;
  padding: 0.25rem;
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.7rem;
}

.mini-btn {
  border: 1px solid var(--fg-primary);
  background: var(--bg-primary);
  color: var(--fg-primary);
  border-radius: 4px;
  padding: 0.3rem 0.45rem;
  cursor: pointer;
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.68rem;
}
.mini-btn:hover {
  background: var(--fg-primary);
  color: var(--bg-primary);
}

/* Context Menu */
.spaceship-context-menu {
  position: fixed;
  min-width: 150px;
  z-index: 10000;
  display: none;
  background: var(--bg-secondary);
  border: 1px solid var(--fg-primary);
  box-shadow: 0 0 20px var(--glow-primary);
  color: var(--fg-primary);
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.75rem;
  border-radius: 6px;
  overflow: hidden;
}

.context-menu-item {
  padding: 0.55rem 0.7rem;
  cursor: pointer;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.context-menu-item:hover {
  background: var(--fg-primary);
  color: var(--bg-primary);
}

/* Modal */
.spaceship-modal {
  position: fixed;
  inset: 0;
  z-index: 1600;
  display: none;
}
.spaceship-modal.open {
  display: block;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.6);
}

.modal-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-secondary);
  border: 1px solid var(--fg-primary);
  box-shadow: 0 0 30px var(--glow-primary);
  border-radius: 8px;
  min-width: 300px;
  max-width: 500px;
}

.modal-header {
  padding: 1rem;
  border-bottom: 1px solid var(--fg-primary);
}
.modal-header h3 {
  margin: 0;
  color: var(--fg-primary);
  font-family: 'Orbitron', sans-serif;
  font-size: 1rem;
}

.modal-body {
  padding: 1rem;
  color: var(--fg-primary);
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid var(--fg-primary);
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.modal-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--fg-primary);
  background: var(--bg-primary);
  color: var(--fg-primary);
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Share Tech Mono', monospace;
}
.modal-btn:hover {
  background: var(--fg-primary);
  color: var(--bg-primary);
}

/* Toast */
.spaceship-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1700;
  background: var(--bg-secondary);
  border: 1px solid var(--fg-primary);
  box-shadow: 0 0 20px var(--glow-primary);
  border-radius: 6px;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transform: translateX(120%);
  transition: transform 0.3s ease;
}
.spaceship-toast.show {
  transform: translateX(0);
}

.toast-message {
  color: var(--fg-primary);
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.85rem;
}

.toast-close {
  background: none;
  border: none;
  color: var(--fg-primary);
  cursor: pointer;
  font-size: 1.2rem;
}
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = SPACESHIP_UI_CSS;
  document.head.appendChild(style);
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SpaceshipUI, SPACESHIP_UI_CSS };
}

// Auto-export FloatingPanelManager if available
if (typeof window !== 'undefined' && !window.FloatingPanelManager) {
  // Floating panels will be loaded separately
  window.SPACESHIP_UI_LOADED = true;
}
