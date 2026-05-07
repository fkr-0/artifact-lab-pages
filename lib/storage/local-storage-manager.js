/**
 * Local Storage Manager
 *
 * A modular local-storage management system providing:
 * - Namespaced storage isolation
 * - Gamestate persistence (save/load/query)
 * - App state management (settings, theme, sound)
 * - User profile data (username, session logs)
 * - Session data tracking
 * - Save slot facility for projects
 * - Query API for UI reviews
 * - Export/import functionality
 * - Indexed metadata for fast lookups
 */

class LocalStorageManager {
  constructor(opts = {}) {
    this.namespace = opts.namespace || 'artifacts';
    this.version = opts.version || '1.0.0';
    this.debug = opts.debug || false;

    // Sub-managers for different concerns
    this.gamestate = new GamestateStorage(this.namespace, this.debug);
    this.appState = new AppStateStorage(this.namespace, this.debug);
    this.profile = new ProfileStorage(this.namespace, this.debug);
    this.sessions = new SessionStorage(this.namespace, this.debug);
    this.slots = new SaveSlotStorage(this.namespace, this.debug);
    this.query = new StorageQuery(this.namespace, this.debug);

    this._initIndex();
  }

  _initIndex() {
    const key = `${this.namespace}:index`;
    let index;
    try {
      index = JSON.parse(localStorage.getItem(key) || '{}');
    } catch (e) {
      this._log('Failed to load index, creating new', e);
      index = {};
    }

    this.index = index;
    this._saveIndex();
  }

  _saveIndex() {
    const key = `${this.namespace}:index`;
    localStorage.setItem(key, JSON.stringify(this.index));
  }

  _log(...args) {
    if (this.debug) console.log('[LocalStorageManager]', ...args);
  }

  /**
   * Get storage usage statistics
   */
  getStats() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.namespace));
    let totalSize = 0;

    keys.forEach(key => {
      totalSize += localStorage.getItem(key).length;
    });

    return {
      namespace: this.namespace,
      totalKeys: keys.length,
      totalBytes: totalSize,
      totalKB: (totalSize / 1024).toFixed(2),
      breakdown: {
        gamestates: keys.filter(k => k.includes(':gamestate:')).length,
        appState: keys.filter(k => k.includes(':app:')).length,
        profile: keys.filter(k => k.includes(':profile:')).length,
        sessions: keys.filter(k => k.includes(':session:')).length,
        slots: keys.filter(k => k.includes(':slot:')).length
      }
    };
  }

  /**
   * Clear all storage in namespace
   */
  clear() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.namespace));
    keys.forEach(key => localStorage.removeItem(key));
    this._initIndex();
  }

  /**
   * Export all data as JSON
   */
  export() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.namespace));
    const data = {
      namespace: this.namespace,
      version: this.version,
      exportedAt: new Date().toISOString(),
      stats: this.getStats(),
      data: {}
    };

    keys.forEach(key => {
      data.data[key] = localStorage.getItem(key);
    });

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from JSON export
   */
  import(jsonString) {
    try {
      const data = JSON.parse(jsonString);

      if (data.namespace !== this.namespace) {
        throw new Error(`Namespace mismatch: expected ${this.namespace}, got ${data.namespace}`);
      }

      Object.entries(data.data || {}).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      this._initIndex();
      this._log('Import completed successfully');
      return true;
    } catch (e) {
      this._log('Import failed', e);
      throw e;
    }
  }
}

/**
 * Gamestate Storage - Save/load/query game states
 */
class GamestateStorage {
  constructor(namespace, debug = false) {
    this.ns = namespace;
    this.debug = debug;
    this.prefix = `${namespace}:gamestate:`;
  }

  _log(...args) {
    if (this.debug) console.log('[GamestateStorage]', ...args);
  }

  /**
   * Save a gamestate
   */
  save(gameId, state, meta = {}) {
    const key = this.prefix + gameId;
    const data = {
      id: gameId,
      state,
      meta: {
        savedAt: new Date().toISOString(),
        version: meta.version || '1.0.0',
        level: meta.level,
        score: meta.score,
        ...meta
      }
    };

    localStorage.setItem(key, JSON.stringify(data));
    this._updateIndex(gameId, data.meta);
    this._log('Saved gamestate:', gameId);
    return data;
  }

  /**
   * Load a gamestate
   */
  load(gameId) {
    const key = this.prefix + gameId;
    try {
      const data = JSON.parse(localStorage.getItem(key));
      this._log('Loaded gamestate:', gameId);
      return data;
    } catch (e) {
      this._log('Failed to load gamestate:', gameId, e);
      return null;
    }
  }

  /**
   * Delete a gamestate
   */
  delete(gameId) {
    const key = this.prefix + gameId;
    localStorage.removeItem(key);
    this._removeFromIndex(gameId);
    this._log('Deleted gamestate:', gameId);
  }

  /**
   * List all gamestates
   */
  list() {
    const indexKey = `${this.ns}:index:gamestate`;
    try {
      return JSON.parse(localStorage.getItem(indexKey) || '[]');
    } catch (e) {
      return [];
    }
  }

  _updateIndex(gameId, meta) {
    const indexKey = `${this.ns}:index:gamestate`;
    let index = JSON.parse(localStorage.getItem(indexKey) || '[]');

    const existing = index.findIndex(g => g.id === gameId);
    const entry = { id: gameId, ...meta };

    if (existing >= 0) {
      index[existing] = entry;
    } else {
      index.unshift(entry);
    }

    localStorage.setItem(indexKey, JSON.stringify(index));
  }

  _removeFromIndex(gameId) {
    const indexKey = `${this.ns}:index:gamestate`;
    let index = JSON.parse(localStorage.getItem(indexKey) || '[]');
    index = index.filter(g => g.id !== gameId);
    localStorage.setItem(indexKey, JSON.stringify(index));
  }
}

/**
 * App State Storage - Settings, theme, sound preferences
 */
class AppStateStorage {
  constructor(namespace, debug = false) {
    this.ns = namespace;
    this.debug = debug;
    this.prefix = `${namespace}:app:`;
  }

  _log(...args) {
    if (this.debug) console.log('[AppStateStorage]', ...args);
  }

  /**
   * Get app setting
   */
  get(key, defaultValue = null) {
    const fullKey = this.prefix + key;
    try {
      return JSON.parse(localStorage.getItem(fullKey)) ?? defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  /**
   * Set app setting
   */
  set(key, value) {
    const fullKey = this.prefix + key;
    localStorage.setItem(fullKey, JSON.stringify(value));
    this._log('Set app state:', key, value);
  }

  /**
   * Get all settings
   */
  getAll() {
    const result = {};
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));

    keys.forEach(fullKey => {
      const key = fullKey.replace(this.prefix, '');
      try {
        result[key] = JSON.parse(localStorage.getItem(fullKey));
      } catch (e) {
        result[key] = localStorage.getItem(fullKey);
      }
    });

    return result;
  }

  /**
   * Clear all app state
   */
  clear() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
    keys.forEach(key => localStorage.removeItem(key));
    this._log('Cleared all app state');
  }
}

/**
 * Profile Storage - User profile data
 */
class ProfileStorage {
  constructor(namespace, debug = false) {
    this.ns = namespace;
    this.debug = debug;
    this.prefix = `${namespace}:profile:`;
  }

  _log(...args) {
    if (this.debug) console.log('[ProfileStorage]', ...args);
  }

  /**
   * Get profile data
   */
  get(key) {
    const fullKey = this.prefix + key;
    try {
      return JSON.parse(localStorage.getItem(fullKey));
    } catch (e) {
      return null;
    }
  }

  /**
   * Set profile data
   */
  set(key, value) {
    const fullKey = this.prefix + key;
    localStorage.setItem(fullKey, JSON.stringify(value));
    this._log('Set profile data:', key);
  }

  /**
   * Get username
   */
  getUsername() {
    return this.get('username') || 'Anonymous';
  }

  /**
   * Set username
   */
  setUsername(username) {
    this.set('username', username);
  }

  /**
   * Get all profile data
   */
  getAll() {
    const result = {};
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));

    keys.forEach(fullKey => {
      const key = fullKey.replace(this.prefix, '');
      try {
        result[key] = JSON.parse(localStorage.getItem(fullKey));
      } catch (e) {
        result[key] = localStorage.getItem(fullKey);
      }
    });

    return result;
  }
}

/**
 * Session Storage - Session data and logs
 */
class SessionStorage {
  constructor(namespace, debug = false) {
    this.ns = namespace;
    this.debug = debug;
    this.prefix = `${namespace}:session:`;
    this.maxSessions = 50;
  }

  _log(...args) {
    if (this.debug) console.log('[SessionStorage]', ...args);
  }

  /**
   * Start a new session
   */
  start(meta = {}) {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const session = {
      id: sessionId,
      startedAt: new Date().toISOString(),
      meta,
      events: []
    };

    this.set(sessionId, session);
    this._updateIndex(session);
    this._log('Started session:', sessionId);
    return sessionId;
  }

  /**
   * End a session
   */
  end(sessionId) {
    const session = this.get(sessionId);
    if (session) {
      session.endedAt = new Date().toISOString();
      this.set(sessionId, session);
      this._log('Ended session:', sessionId);
    }
  }

  /**
   * Log an event to a session
   */
  logEvent(sessionId, event, data = {}) {
    const session = this.get(sessionId);
    if (session) {
      session.events.push({
        timestamp: new Date().toISOString(),
        event,
        data
      });
      this.set(sessionId, session);
    }
  }

  /**
   * Get session data
   */
  get(sessionId) {
    const fullKey = this.prefix + sessionId;
    try {
      return JSON.parse(localStorage.getItem(fullKey));
    } catch (e) {
      return null;
    }
  }

  /**
   * Set session data
   */
  set(sessionId, data) {
    const fullKey = this.prefix + sessionId;
    localStorage.setItem(fullKey, JSON.stringify(data));
  }

  /**
   * List all sessions
   */
  list() {
    const indexKey = `${this.ns}:index:session`;
    try {
      return JSON.parse(localStorage.getItem(indexKey) || '[]');
    } catch (e) {
      return [];
    }
  }

  /**
   * Clean old sessions
   */
  clean() {
    const sessions = this.list();
    if (sessions.length > this.maxSessions) {
      const toRemove = sessions.slice(this.maxSessions);
      toRemove.forEach(s => this.delete(s.id));
    }
  }

  _updateIndex(session) {
    const indexKey = `${this.ns}:index:session`;
    let index = JSON.parse(localStorage.getItem(indexKey) || '[]');

    index.unshift({
      id: session.id,
      startedAt: session.startedAt,
      meta: session.meta
    });

    if (index.length > this.maxSessions) {
      const toRemove = index.slice(this.maxSessions);
      toRemove.forEach(s => localStorage.removeItem(this.prefix + s.id));
      index = index.slice(0, this.maxSessions);
    }

    localStorage.setItem(indexKey, JSON.stringify(index));
  }

  delete(sessionId) {
    localStorage.removeItem(this.prefix + sessionId);
  }
}

/**
 * Save Slot Storage - Project save slots
 */
class SaveSlotStorage {
  constructor(namespace, debug = false) {
    this.ns = namespace;
    this.debug = debug;
    this.prefix = `${namespace}:slot:`;
    this.maxSlots = 10;
  }

  _log(...args) {
    if (this.debug) console.log('[SaveSlotStorage]', ...args);
  }

  /**
   * Save to a slot
   */
  save(slotId, data, meta = {}) {
    if (slotId < 1 || slotId > this.maxSlots) {
      throw new Error(`Slot ID must be between 1 and ${this.maxSlots}`);
    }

    const slot = {
      id: slotId,
      savedAt: new Date().toISOString(),
      data,
      meta
    };

    localStorage.setItem(this.prefix + slotId, JSON.stringify(slot));
    this._log('Saved to slot:', slotId);
    return slot;
  }

  /**
   * Load from a slot
   */
  load(slotId) {
    const key = this.prefix + slotId;
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (e) {
      this._log('Failed to load slot:', slotId, e);
      return null;
    }
  }

  /**
   * Get all slots
   */
  getAll() {
    const slots = {};
    for (let i = 1; i <= this.maxSlots; i++) {
      const slot = this.load(i);
      if (slot) {
        slots[i] = slot;
      }
    }
    return slots;
  }

  /**
   * Clear a slot
   */
  clear(slotId) {
    localStorage.removeItem(this.prefix + slotId);
    this._log('Cleared slot:', slotId);
  }

  /**
   * Clear all slots
   */
  clearAll() {
    for (let i = 1; i <= this.maxSlots; i++) {
      this.clear(i);
    }
  }
}

/**
 * Storage Query - Query API for UI
 */
class StorageQuery {
  constructor(namespace, debug = false) {
    this.ns = namespace;
    this.debug = debug;
  }

  _log(...args) {
    if (this.debug) console.log('[StorageQuery]', ...args);
  }

  /**
   * Query storage by type
   */
  byType(type) {
    const prefix = `${this.ns}:${type}`;
    const results = [];

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(prefix)) {
        try {
          results.push({
            key,
            value: JSON.parse(localStorage.getItem(key)),
            size: localStorage.getItem(key).length
          });
        } catch (e) {
          results.push({
            key,
            value: localStorage.getItem(key),
            size: localStorage.getItem(key).length
          });
        }
      }
    });

    return results;
  }

  /**
   * Search storage by metadata
   */
  search(query) {
    const results = [];
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith(this.ns));

    allKeys.forEach(key => {
      try {
        const value = JSON.parse(localStorage.getItem(key));
        const matches = Object.entries(query).every(([k, v]) => {
          const keys = k.split('.');
          let current = value;
          for (const key of keys) {
            if (current == null) return false;
            current = current[key];
          }
          return current === v;
        });

        if (matches) {
          results.push({ key, value });
        }
      } catch (e) {
        // Skip non-JSON values
      }
    });

    return results;
  }

  /**
   * Get storage size breakdown
   */
  sizeBreakdown() {
    const breakdown = {
      gamestate: 0,
      app: 0,
      profile: 0,
      session: 0,
      slot: 0,
      other: 0
    };

    Object.keys(localStorage).forEach(key => {
      if (!key.startsWith(this.ns)) return;

      const size = localStorage.getItem(key).length;
      const parts = key.split(':');
      const type = parts[1] || 'other';

      if (breakdown.hasOwnProperty(type)) {
        breakdown[type] += size;
      } else {
        breakdown.other += size;
      }
    });

    return breakdown;
  }

  /**
   * Delete entries matching query
   */
  deleteMatching(query) {
    const matches = this.search(query);
    matches.forEach(({ key }) => {
      localStorage.removeItem(key);
    });
    this._log('Deleted', matches.length, 'entries matching query');
    return matches.length;
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LocalStorageManager, GamestateStorage, AppStateStorage, ProfileStorage, SessionStorage, SaveSlotStorage, StorageQuery };
}
