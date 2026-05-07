/**
 * Floating Panels API
 *
 * A clean, bug-free floating panel system with:
 * - Fixed sticky mouse bug (proper pointer capture handling)
 * - Resizable panels
 * - Dock/undock functionality
 * - Tabbed interface for docked panels
 * - Minimize/maximize support
 * - Proper z-index management
 * - Panel persistence
 */

class FloatingPanelManager {
  constructor(opts = {}) {
    this.panels = new Map();
    this.dockedPanels = [];
    this.activePanelId = null;
    this.zIndexCounter = 1000;
    this.defaultWidth = opts.defaultWidth || 400;
    this.defaultHeight = opts.defaultHeight || 300;
    this.minWidth = opts.minWidth || 200;
    this.minHeight = opts.minHeight || 150;

    this.dockContainer = opts.dockContainer || this.createDefaultDock();
    this.onPanelChange = opts.onPanelChange || (() => {});

    this._setupGlobalListeners();
  }

  createDefaultDock() {
    let dock = document.getElementById('floating-panels-dock');
    if (!dock) {
      dock = document.createElement('div');
      dock.id = 'floating-panels-dock';
      dock.className = 'floating-panels-dock';
      document.body.appendChild(dock);
    }
    return dock;
  }

  _setupGlobalListeners() {
    // Handle pointer capture release on window
    window.addEventListener('pointerup', () => {
      // Release any dragging state
      document.querySelectorAll('.floating-panel.dragging').forEach(panel => {
        panel.classList.remove('dragging');
      });
    });

    // Handle window resize for docked panels
    window.addEventListener('resize', () => {
      this.panels.forEach((panel, id) => {
        if (panel.docked) {
          this._adjustDockedPanel(panel);
        }
      });
    });
  }

  /**
   * Create a new floating panel
   */
  create(opts = {}) {
    const id = opts.id || 'panel-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);

    const panel = {
      id,
      title: opts.title || 'Panel',
      content: opts.content || '',
      width: opts.width || this.defaultWidth,
      height: opts.height || this.defaultHeight,
      x: opts.x ?? 100 + (this.panels.size * 30),
      y: opts.y ?? 100 + (this.panels.size * 30),
      minWidth: opts.minWidth || this.minWidth,
      minHeight: opts.minHeight || this.minHeight,
      docked: opts.docked || false,
      minimized: opts.minimized || false,
      maximized: opts.maximized || false,
      element: null,
      resizeHandle: null,
      dockButton: null,
      undockButton: null
    };

    this.panels.set(id, panel);
    this._renderPanel(panel);

    if (panel.docked) {
      this.dockPanel(id);
    }

    this.onPanelChange('create', panel);
    return id;
  }

  /**
   * Render a panel's DOM element
   */
  _renderPanel(panel) {
    const el = document.createElement('div');
    el.className = 'floating-panel';
    el.id = 'panel-' + panel.id;
    el.dataset.panelId = panel.id;

    el.innerHTML = `
      <div class="floating-panel-header">
        <div class="floating-panel-title">${panel.title}</div>
        <div class="floating-panel-controls">
          <button class="panel-btn panel-dock-btn" title="Dock">⬇</button>
          <button class="panel-btn panel-minimize-btn" title="Minimize">−</button>
          <button class="panel-btn panel-maximize-btn" title="Maximize">□</button>
          <button class="panel-btn panel-close-btn" title="Close">×</button>
        </div>
      </div>
      <div class="floating-panel-content">${panel.content}</div>
      <div class="floating-panel-resize-handle"></div>
    `;

    document.body.appendChild(el);
    panel.element = el;

    // Setup controls
    this._setupPanelControls(panel);
    this._setupPanelDrag(panel);
    this._setupPanelResize(panel);

    // Apply initial state
    this._applyPanelState(panel);
  }

  /**
   * Setup panel control buttons
   */
  _setupPanelControls(panel) {
    const el = panel.element;

    panel.closeButton = el.querySelector('.panel-close-btn');
    panel.dockButton = el.querySelector('.panel-dock-btn');
    panel.minimizeButton = el.querySelector('.panel-minimize-btn');
    panel.maximizeButton = el.querySelector('.panel-maximize-btn');
    panel.resizeHandle = el.querySelector('.floating-panel-resize-handle');

    panel.closeButton.addEventListener('click', () => this.close(panel.id));

    panel.dockButton.addEventListener('click', () => {
      if (panel.docked) {
        this.undockPanel(panel.id);
      } else {
        this.dockPanel(panel.id);
      }
    });

    panel.minimizeButton.addEventListener('click', () => {
      this.toggleMinimize(panel.id);
    });

    panel.maximizeButton.addEventListener('click', () => {
      this.toggleMaximize(panel.id);
    });

    // Focus panel on mousedown
    el.addEventListener('mousedown', () => {
      this.focusPanel(panel.id);
    });
  }

  /**
   * Setup panel dragging - FIXED sticky mouse bug
   */
  _setupPanelDrag(panel) {
    const el = panel.element;
    const header = el.querySelector('.floating-panel-header');

    let dragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let pointerId = null;

    header.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.floating-panel-controls')) return;

      dragging = true;
      pointerId = e.pointerId;

      dragOffsetX = e.clientX - el.offsetLeft;
      dragOffsetY = e.clientY - el.offsetTop;

      el.classList.add('dragging');
      el.style.cursor = 'grabbing';
      header.style.cursor = 'grabbing';

      el.setPointerCapture(pointerId);
      e.preventDefault();
    });

    el.addEventListener('pointermove', (e) => {
      if (!dragging || e.pointerId !== pointerId) return;

      const newX = e.clientX - dragOffsetX;
      const newY = e.clientY - dragOffsetY;

      // Constrain to viewport
      const maxX = window.innerWidth - el.offsetWidth;
      const maxY = window.innerHeight - el.offsetHeight;

      el.style.left = Math.max(0, Math.min(maxX, newX)) + 'px';
      el.style.top = Math.max(0, Math.min(maxY, newY)) + 'px';
      el.style.right = 'auto';
      el.style.bottom = 'auto';

      // Update panel position
      panel.x = parseFloat(el.style.left);
      panel.y = parseFloat(el.style.top);
    });

    el.addEventListener('pointerup', (e) => {
      if (!dragging || e.pointerId !== pointerId) return;

      dragging = false;

      el.classList.remove('dragging');
      el.style.cursor = '';
      header.style.cursor = '';

      // IMPORTANT: Release pointer capture to fix sticky mouse bug
      el.releasePointerCapture(pointerId);
      pointerId = null;

      e.preventDefault();
    });

    // Also handle pointercancel for robustness
    el.addEventListener('pointercancel', (e) => {
      if (!dragging || e.pointerId !== pointerId) return;

      dragging = false;

      el.classList.remove('dragging');
      el.style.cursor = '';
      header.style.cursor = '';

      el.releasePointerCapture(pointerId);
      pointerId = null;
    });
  }

  /**
   * Setup panel resizing
   */
  _setupPanelResize(panel) {
    const el = panel.element;
    const handle = panel.resizeHandle;

    let resizing = false;
    let resizeStartX = 0;
    let resizeStartY = 0;
    let startWidth = 0;
    let startHeight = 0;
    let pointerId = null;

    handle.addEventListener('pointerdown', (e) => {
      resizing = true;
      pointerId = e.pointerId;

      resizeStartX = e.clientX;
      resizeStartY = e.clientY;
      startWidth = el.offsetWidth;
      startHeight = el.offsetHeight;

      el.classList.add('resizing');
      el.setPointerCapture(pointerId);
      e.preventDefault();
      e.stopPropagation();
    });

    el.addEventListener('pointermove', (e) => {
      if (!resizing || e.pointerId !== pointerId) return;

      const deltaX = e.clientX - resizeStartX;
      const deltaY = e.clientY - resizeStartY;

      const newWidth = Math.max(panel.minWidth, startWidth + deltaX);
      const newHeight = Math.max(panel.minHeight, startHeight + deltaY);

      el.style.width = newWidth + 'px';
      el.style.height = newHeight + 'px';

      panel.width = newWidth;
      panel.height = newHeight;
    });

    el.addEventListener('pointerup', (e) => {
      if (!resizing || e.pointerId !== pointerId) return;

      resizing = false;
      el.classList.remove('resizing');
      el.releasePointerCapture(pointerId);
      pointerId = null;
    });

    el.addEventListener('pointercancel', (e) => {
      if (!resizing || e.pointerId !== pointerId) return;

      resizing = false;
      el.classList.remove('resizing');
      el.releasePointerCapture(pointerId);
      pointerId = null;
    });
  }

  /**
   * Apply panel state to DOM
   */
  _applyPanelState(panel) {
    const el = panel.element;

    if (panel.docked) {
      el.classList.add('docked');
      el.style.left = '';
      el.style.top = '';
      el.style.width = '';
      el.style.height = '';
    } else {
      el.classList.remove('docked');
      el.style.left = panel.x + 'px';
      el.style.top = panel.y + 'px';
      el.style.width = panel.width + 'px';
      el.style.height = panel.height + 'px';
    }

    if (panel.minimized) {
      el.classList.add('minimized');
    } else {
      el.classList.remove('minimized');
    }

    if (panel.maximized) {
      el.classList.add('maximized');
    } else {
      el.classList.remove('maximized');
    }

    // Update dock button
    if (panel.dockButton) {
      panel.dockButton.textContent = panel.docked ? '⬆' : '⬇';
      panel.dockButton.title = panel.docked ? 'Undock' : 'Dock';
    }

    this._updateZIndex(panel);
  }

  /**
   * Update panel z-index
   */
  _updateZIndex(panel) {
    if (panel.element) {
      panel.element.style.zIndex = ++this.zIndexCounter;
    }
  }

  /**
   * Focus a panel (bring to front)
   */
  focusPanel(id) {
    const panel = this.panels.get(id);
    if (!panel) return;

    this.activePanelId = id;
    this._updateZIndex(panel);
    this.onPanelChange('focus', panel);
  }

  /**
   * Dock a panel (make it a tab in the dock)
   */
  dockPanel(id) {
    const panel = this.panels.get(id);
    if (!panel || panel.docked) return;

    panel.docked = true;
    this.dockedPanels.push(id);

    // Create tab for this panel
    this._createDockTab(panel);

    // Move panel to dock container
    this.dockContainer.appendChild(panel.element);

    this._applyPanelState(panel);
    this.onPanelChange('dock', panel);
  }

  /**
   * Undock a panel (make it floating)
   */
  undockPanel(id) {
    const panel = this.panels.get(id);
    if (!panel || !panel.docked) return;

    panel.docked = false;

    // Remove from docked panels list
    const idx = this.dockedPanels.indexOf(id);
    if (idx >= 0) {
      this.dockedPanels.splice(idx, 1);
    }

    // Remove tab
    const tab = document.querySelector(`.dock-tab[data-panel-id="${id}"]`);
    if (tab) tab.remove();

    // Move panel back to body
    document.body.appendChild(panel.element);

    // Show panel and apply state
    panel.element.style.display = '';
    this._applyPanelState(panel);
    this.focusPanel(id);

    this.onPanelChange('undock', panel);
  }

  /**
   * Create a dock tab for a panel
   */
  _createDockTab(panel) {
    const tab = document.createElement('div');
    tab.className = 'dock-tab';
    tab.dataset.panelId = panel.id;
    tab.innerHTML = `
      <span class="dock-tab-title">${panel.title}</span>
      <button class="dock-tab-close">×</button>
    `;

    tab.addEventListener('click', (e) => {
      if (!e.target.classList.contains('dock-tab-close')) {
        this.showDockedPanel(panel.id);
      }
    });

    tab.querySelector('.dock-tab-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.close(panel.id);
    });

    this.dockContainer.querySelector('.dock-tabs').appendChild(tab);
  }

  /**
   * Show a specific docked panel
   */
  showDockedPanel(id) {
    const panel = this.panels.get(id);
    if (!panel || !panel.docked) return;

    // Hide all docked panels
    this.dockedPanels.forEach(dockedId => {
      const p = this.panels.get(dockedId);
      if (p && p.element) {
        p.element.style.display = dockedId === id ? '' : 'none';
      }
    });

    // Update active tab
    this.dockContainer.querySelectorAll('.dock-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.panelId === id);
    });

    this.activePanelId = id;
    this.onPanelChange('show', panel);
  }

  /**
   * Toggle panel minimize
   */
  toggleMinimize(id) {
    const panel = this.panels.get(id);
    if (!panel) return;

    panel.minimized = !panel.minimized;

    if (panel.maximized && panel.minimized) {
      panel.maximized = false;
    }

    this._applyPanelState(panel);
    this.onPanelChange('minimize', panel);
  }

  /**
   * Toggle panel maximize
   */
  toggleMaximize(id) {
    const panel = this.panels.get(id);
    if (!panel || panel.docked) return;

    panel.maximized = !panel.maximized;

    if (panel.minimized && panel.maximized) {
      panel.minimized = false;
    }

    this._applyPanelState(panel);
    this.onPanelChange('maximize', panel);
  }

  /**
   * Update panel content
   */
  updateContent(id, content) {
    const panel = this.panels.get(id);
    if (!panel) return;

    panel.content = content;
    const contentEl = panel.element?.querySelector('.floating-panel-content');
    if (contentEl) {
      contentEl.innerHTML = content;
    }
  }

  /**
   * Update panel title
   */
  updateTitle(id, title) {
    const panel = this.panels.get(id);
    if (!panel) return;

    panel.title = title;
    const titleEl = panel.element?.querySelector('.floating-panel-title');
    if (titleEl) {
      titleEl.textContent = title;
    }

    // Update tab title if docked
    const tab = this.dockContainer.querySelector(`.dock-tab[data-panel-id="${id}"] .dock-tab-title`);
    if (tab) {
      tab.textContent = title;
    }
  }

  /**
   * Close a panel
   */
  close(id) {
    const panel = this.panels.get(id);
    if (!panel) return;

    if (panel.docked) {
      this.undockPanel(id);
    }

    // Clean up iframes to stop games and release resources
    const iframe = panel.element?.querySelector('iframe');
    if (iframe) {
      iframe.src = 'about:blank';
      // Wait a tick for the iframe to unload
      setTimeout(() => {
        panel.element?.remove();
      }, 10);
    } else {
      panel.element?.remove();
    }

    // Remove tab if exists
    const tab = this.dockContainer.querySelector(`.dock-tab[data-panel-id="${id}"]`);
    if (tab) tab.remove();

    this.panels.delete(id);
    this.onPanelChange('close', { id });
  }

  /**
   * Get panel state
   */
  getPanel(id) {
    return this.panels.get(id);
  }

  /**
   * Get all panels
   */
  getAllPanels() {
    return Array.from(this.panels.values());
  }

  /**
   * Clear all panels
   */
  clear() {
    Array.from(this.panels.keys()).forEach(id => this.close(id));
  }
}

// CSS for the floating panels system
const FLOATING_PANELS_CSS = `
.floating-panels-dock {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 400px;
  background: var(--bg-secondary, #12121f);
  border-top: 2px solid var(--fg-primary, #00ffff);
  display: none;
  flex-direction: column;
  z-index: 900;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.5);
}
.floating-panels-dock.visible {
  display: flex;
}
.floating-panels-dock.empty {
  display: none;
}

.dock-tabs {
  display: flex;
  background: rgba(0,0,0,0.3);
  border-bottom: 1px solid var(--grid-color, rgba(0,255,255,0.08));
  overflow-x: auto;
  flex-shrink: 0;
}

.dock-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(0,0,0,0.2);
  border-right: 1px solid var(--grid-color, rgba(0,255,255,0.08));
  cursor: pointer;
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.75rem;
  color: var(--fg-secondary, #0088ff);
  white-space: nowrap;
  transition: all 0.2s;
}
.dock-tab:hover {
  background: rgba(0,255,255,0.1);
  color: var(--fg-primary, #00ffff);
}
.dock-tab.active {
  background: var(--fg-primary, #00ffff);
  color: var(--bg-primary, #0a0a12);
}

.dock-tab-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  opacity: 0.7;
}
.dock-tab-close:hover {
  opacity: 1;
}

.floating-panel {
  position: fixed;
  background: var(--bg-secondary, #12121f);
  border: 1px solid var(--fg-primary, #00ffff);
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Share Tech Mono', monospace;
  color: var(--fg-primary, #00ffff);
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.floating-panel.dragging {
  opacity: 0.9;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
}

.floating-panel.resizing {
  user-select: none;
}

.floating-panel.docked {
  position: static !important;
  border: none;
  border-radius: 0;
  box-shadow: none;
  flex: 1;
  height: auto !important;
}

.floating-panel.minimized {
  height: auto !important;
}
.floating-panel.minimized .floating-panel-content {
  display: none;
}
.floating-panel.minimized .floating-panel-resize-handle {
  display: none;
}

.floating-panel.maximized {
  left: 0 !important;
  top: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  border-radius: 0;
}

.floating-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: rgba(0,255,255,0.08);
  border-bottom: 1px solid var(--grid-color, rgba(0,255,255,0.08));
  cursor: grab;
  flex-shrink: 0;
}
.floating-panel-header:active {
  cursor: grabbing;
}

.floating-panel-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: var(--accent, #ff0066);
}

.floating-panel-controls {
  display: flex;
  gap: 0.25rem;
}

.panel-btn {
  background: none;
  border: 1px solid var(--grid-color, rgba(0,255,255,0.15));
  color: var(--fg-primary, #00ffff);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  font-size: 0.9rem;
  line-height: 1;
  transition: all 0.15s;
}
.panel-btn:hover {
  background: rgba(0,255,255,0.15);
  border-color: var(--fg-primary, #00ffff);
}

.floating-panel-content {
  flex: 1;
  overflow: auto;
  padding: 0.75rem;
}

.floating-panel-resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 50%, var(--fg-primary, #00ffff) 50%);
  opacity: 0.3;
}
.floating-panel-resize-handle:hover {
  opacity: 0.6;
}
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = FLOATING_PANELS_CSS;
  document.head.appendChild(style);
}

// Export for browser
if (typeof window !== 'undefined') {
  window.FloatingPanelManager = FloatingPanelManager;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FloatingPanelManager, FLOATING_PANELS_CSS };
}
