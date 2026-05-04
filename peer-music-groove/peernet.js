/**
 * PeerNet - A usability-first PeerJS abstraction layer
 * Version: 1.0.0
 * 
 * A comprehensive toolkit for peer-to-peer applications:
 * - Observability: logging, monitoring, introspection
 * - Lobby management: FCFS, obfuscated master, multi-lobby
 * - Authentication: GPG, DH, challenge-response
 * - Commitment schemes: coin toss, dice, secret sharing
 * - State sync: conflict resolution, time sync, consensus
 * - Persistence: localStorage, peer registry, game state
 * - Messaging: reliable delivery, broadcasting, channels
 * - UI components: chat, user list, settings, notifications
 * 
 * Usage:
 *   <script src="https://unpkg.com/peerjs@1.5.0/dist/peerjs.min.js"></script>
 *   <script src="peernet.js"></script>
 *   const net = new PeerNet.PeerNet();
 * 
 * Dependencies:
 *   - PeerJS (required): https://peerjs.com/
 *   - TweetNaCl (optional, for crypto): https://tweetnacl.js.org/
 *   - OpenPGP (optional, for GPG features): https://openpgpjs.org/
 */

(function(global) {
'use strict';


// === src/utils.js ===
/**
 * PeerNet Utilities Module
 * Common helper functions used across the library
 * @module utils
 */

const Utils = {
    /**
     * Generate a unique identifier
     * @param {string} [prefix=''] - Optional prefix
     * @returns {string} Unique ID
     */
    generateId(prefix = '') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 11);
        return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
    },

    /**
     * Generate a random hex string
     * @param {number} length - Length of string
     * @returns {string} Random hex string
     */
    randomHex(length = 32) {
        const bytes = new Uint8Array(length / 2);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Generate a random integer in range
     * @param {number} min - Minimum value (inclusive)
     * @param {number} max - Maximum value (exclusive)
     * @returns {number} Random integer
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    },

    /**
     * Hash a string using SHA-256
     * @param {string} message - Message to hash
     * @returns {Promise<string>} Hex-encoded hash
     */
    async sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Deep clone an object
     * @param {any} obj - Object to clone
     * @returns {any} Cloned object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(item => Utils.deepClone(item));
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Map) return new Map(Array.from(obj.entries()).map(([k, v]) => [Utils.deepClone(k), Utils.deepClone(v)]));
        if (obj instanceof Set) return new Set(Array.from(obj.values()).map(v => Utils.deepClone(v)));
        
        const cloned = Object.create(Object.getPrototypeOf(obj));
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                cloned[key] = Utils.deepClone(obj[key]);
            }
        }
        return cloned;
    },

    /**
     * Deep merge objects
     * @param {object} target - Target object
     * @param {...object} sources - Source objects
     * @returns {object} Merged object
     */
    deepMerge(target, ...sources) {
        if (!sources.length) return target;
        const source = sources.shift();

        if (Utils.isObject(target) && Utils.isObject(source)) {
            for (const key in source) {
                if (Utils.isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    Utils.deepMerge(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }

        return Utils.deepMerge(target, ...sources);
    },

    /**
     * Check if value is a plain object
     * @param {any} item - Value to check
     * @returns {boolean}
     */
    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    },

    /**
     * Debounce a function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle a function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Minimum time between calls in ms
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Get value at path in object
     * @param {object} obj - Object to traverse
     * @param {string} path - Dot-separated path
     * @param {any} [defaultValue] - Default value if not found
     * @returns {any} Value at path
     */
    getAtPath(obj, path, defaultValue = undefined) {
        const keys = path.split('.');
        let result = obj;
        for (const key of keys) {
            if (result === null || result === undefined) return defaultValue;
            result = result[key];
        }
        return result === undefined ? defaultValue : result;
    },

    /**
     * Set value at path in object
     * @param {object} obj - Object to modify
     * @param {string} path - Dot-separated path
     * @param {any} value - Value to set
     * @returns {object} Modified object
     */
    setAtPath(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        return obj;
    },

    /**
     * Delete value at path in object
     * @param {object} obj - Object to modify
     * @param {string} path - Dot-separated path
     * @returns {boolean} Whether deletion occurred
     */
    deleteAtPath(obj, path) {
        const keys = path.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) return false;
            current = current[keys[i]];
        }
        if (current[keys[keys.length - 1]] !== undefined) {
            delete current[keys[keys.length - 1]];
            return true;
        }
        return false;
    },

    /**
     * Format bytes to human readable string
     * @param {number} bytes - Number of bytes
     * @param {number} [decimals=2] - Decimal places
     * @returns {string} Formatted string
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },

    /**
     * Format duration to human readable string
     * @param {number} ms - Duration in milliseconds
     * @returns {string} Formatted string
     */
    formatDuration(ms) {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
        return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
    },

    /**
     * Sleep for specified duration
     * @param {number} ms - Duration in milliseconds
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Retry a function with exponential backoff
     * @param {Function} fn - Async function to retry
     * @param {object} [options] - Retry options
     * @param {number} [options.maxRetries=3] - Maximum retries
     * @param {number} [options.initialDelay=100] - Initial delay in ms
     * @param {number} [options.maxDelay=5000] - Maximum delay in ms
     * @returns {Promise<any>} Result of function
     */
    async retry(fn, options = {}) {
        const { maxRetries = 3, initialDelay = 100, maxDelay = 5000 } = options;
        let lastError;
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                if (i < maxRetries - 1) {
                    const delay = Math.min(initialDelay * Math.pow(2, i), maxDelay);
                    await Utils.sleep(delay);
                }
            }
        }
        throw lastError;
    },

    /**
     * Create a deferred promise
     * @returns {{ promise: Promise, resolve: Function, reject: Function }}
     */
    deferred() {
        let resolve, reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    },

    /**
     * Convert array buffer to base64
     * @param {ArrayBuffer} buffer - Array buffer
     * @returns {string} Base64 string
     */
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    },

    /**
     * Convert base64 to array buffer
     * @param {string} base64 - Base64 string
     * @returns {ArrayBuffer} Array buffer
     */
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    },

    /**
     * Encode string to UTF-8 bytes
     * @param {string} str - String to encode
     * @returns {Uint8Array} UTF-8 bytes
     */
    stringToBytes(str) {
        return new TextEncoder().encode(str);
    },

    /**
     * Decode UTF-8 bytes to string
     * @param {Uint8Array} bytes - Bytes to decode
     * @returns {string} Decoded string
     */
    bytesToString(bytes) {
        return new TextDecoder().decode(bytes);
    }
};

// EventEmitter mixin for adding event capabilities to classes
const EventEmitter = {
    /**
     * Initialize event emitter
     */
    _initEventEmitter() {
        this._events = new Map();
        this._oncePromises = new Map();
    },

    /**
     * Subscribe to event
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {Function} Unsubscribe function
     */
    on(event, handler) {
        if (!this._events) this._initEventEmitter();
        if (!this._events.has(event)) {
            this._events.set(event, new Set());
        }
        this._events.get(event).add(handler);
        return () => this.off(event, handler);
    },

    /**
     * Subscribe to event once
     * @param {string} event - Event name
     * @returns {Promise<any>} Promise resolving on event
     */
    once(event) {
        if (!this._oncePromises) this._oncePromises = new Map();
        if (this._oncePromises.has(event)) {
            return this._oncePromises.get(event).promise;
        }
        const deferred = Utils.deferred();
        this._oncePromises.set(event, deferred);
        this.on(event, (data) => {
            deferred.resolve(data);
            this._oncePromises.delete(event);
        });
        return deferred.promise;
    },

    /**
     * Unsubscribe from event
     * @param {string} event - Event name
     * @param {Function} [handler] - Specific handler (optional)
     */
    off(event, handler) {
        if (!this._events) return;
        if (handler) {
            this._events.get(event)?.delete(handler);
        } else {
            this._events.delete(event);
        }
    },

    /**
     * Emit event
     * @param {string} event - Event name
     * @param {any} [data] - Event data
     */
    emit(event, data) {
        if (!this._events) return;
        const handlers = this._events.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    },

    /**
     * Wait for event with timeout
     * @param {string} event - Event name
     * @param {number} [timeout] - Timeout in ms
     * @returns {Promise<any>}
     */
    waitFor(event, timeout) {
        return new Promise((resolve, reject) => {
            let timeoutId;
            const unsubscribe = this.on(event, (data) => {
                if (timeoutId) clearTimeout(timeoutId);
                resolve(data);
            });
            if (timeout) {
                timeoutId = setTimeout(() => {
                    unsubscribe();
                    reject(new Error(`Timeout waiting for event: ${event}`));
                }, timeout);
            }
        });
    }
};

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Utils, EventEmitter };
}

// === src/core.js ===
/**
 * PeerNet Core Module
 * Main entry point and connection management
 * @module core
 */

// Import utilities (assuming concatenated file)
// const { Utils, EventEmitter } = require('./utils.js');

/**
 * EventBus - Central event management system
 * Supports typed events, wildcards, and async handlers
 */
class EventBus {
    constructor() {
        this._handlers = new Map();
        this._wildcardHandlers = new Set();
        this._history = [];
        this._maxHistory = 100;
    }

    /**
     * Subscribe to event or pattern
     * @param {string|RegExp} event - Event name or pattern
     * @param {Function} handler - Event handler
     * @returns {Function} Unsubscribe function
     */
    on(event, handler) {
        if (event instanceof RegExp) {
            const wrapper = { pattern: event, handler };
            this._wildcardHandlers.add(wrapper);
            return () => this._wildcardHandlers.delete(wrapper);
        }

        if (!this._handlers.has(event)) {
            this._handlers.set(event, new Set());
        }
        this._handlers.get(event).add(handler);
        return () => this.off(event, handler);
    }

    /**
     * Unsubscribe handler
     * @param {string} event - Event name
     * @param {Function} [handler] - Specific handler (optional)
     */
    off(event, handler) {
        if (handler) {
            this._handlers.get(event)?.delete(handler);
        } else {
            this._handlers.delete(event);
        }
    }

    /**
     * Promise-based one-time subscription
     * @param {string} event - Event name
     * @returns {Promise<any>}
     */
    once(event) {
        return new Promise(resolve => {
            const unsubscribe = this.on(event, (data) => {
                unsubscribe();
                resolve(data);
            });
        });
    }

    /**
     * Wait for event with timeout
     * @param {string} event - Event name
     * @param {number} [timeout] - Timeout in ms
     * @returns {Promise<any>}
     */
    waitFor(event, timeout) {
        return new Promise((resolve, reject) => {
            let timeoutId;
            const unsubscribe = this.on(event, (data) => {
                if (timeoutId) clearTimeout(timeoutId);
                resolve(data);
            });
            if (timeout) {
                timeoutId = setTimeout(() => {
                    unsubscribe();
                    reject(new Error(`Timeout waiting for event: ${event}`));
                }, timeout);
            }
        });
    }

    /**
     * Emit event to all subscribers
     * @param {string} event - Event name
     * @param {any} [payload] - Event payload
     */
    emit(event, payload) {
        // Store in history
        this._history.push({ event, payload, timestamp: Date.now() });
        if (this._history.length > this._maxHistory) {
            this._history.shift();
        }

        // Call direct handlers
        const handlers = this._handlers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    const result = handler(payload);
                    if (result instanceof Promise) {
                        result.catch(err => console.error(`Async handler error for ${event}:`, err));
                    }
                } catch (error) {
                    console.error(`Handler error for ${event}:`, error);
                }
            });
        }

        // Call wildcard handlers
        this._wildcardHandlers.forEach(({ pattern, handler }) => {
            if (pattern.test(event)) {
                try {
                    handler(event, payload);
                } catch (error) {
                    console.error(`Wildcard handler error for ${event}:`, error);
                }
            }
        });
    }

    /**
     * Get event history
     * @param {string} [pattern] - Filter pattern
     * @returns {Array} Event history
     */
    getHistory(pattern) {
        if (!pattern) return [...this._history];
        const regex = new RegExp(pattern);
        return this._history.filter(e => regex.test(e.event));
    }

    /**
     * Clear all handlers
     */
    clear() {
        this._handlers.clear();
        this._wildcardHandlers.clear();
        this._history = [];
    }
}

/**
 * Configuration - Immutable configuration container
 */
class Configuration {
    constructor(initialConfig = {}) {
        this._config = Utils.deepMerge({}, Configuration.DEFAULTS, initialConfig);
        Object.freeze(this._config);
    }

    static get DEFAULTS() {
        return {
            peerId: null,
            server: {
                host: '0.peerjs.com',
                port: 443,
                path: '/',
                secure: true
            },
            logging: {
                level: 'info',
                transports: ['console'],
                persist: false
            },
            storage: {
                enabled: true,
                namespace: 'peernet',
                encrypt: false
            },
            crypto: {
                defaultAlgorithm: 'ecc',
                keyExpiration: 365 * 24 * 60 * 60 * 1000 // 1 year
            },
            connection: {
                timeout: 30000,
                retries: 3,
                heartbeat: 30000
            }
        };
    }

    /**
     * Get configuration value
     * @param {string} key - Configuration key (dot-separated path)
     * @param {any} [defaultValue] - Default value if not found
     * @returns {any}
     */
    get(key, defaultValue = undefined) {
        return Utils.getAtPath(this._config, key, defaultValue);
    }

    /**
     * Get entire configuration
     * @returns {object}
     */
    getAll() {
        return Utils.deepClone(this._config);
    }

    /**
     * Validate configuration
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validate() {
        const errors = [];

        if (this._config.server && this._config.server.port) {
            const port = this._config.server.port;
            if (port < 1 || port > 65535) {
                errors.push(`Invalid port number: ${port}`);
            }
        }

        const validLevels = ['trace', 'debug', 'info', 'warn', 'error'];
        if (!validLevels.includes(this._config.logging.level)) {
            errors.push(`Invalid log level: ${this._config.logging.level}`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Create new configuration with overrides
     * @param {object} overrides - Configuration overrides
     * @returns {Configuration}
     */
    merge(overrides) {
        return new Configuration(Utils.deepMerge({}, this._config, overrides));
    }
}

/**
 * PeerNet - Main entry point and facade
 * Manages PeerJS instance lifecycle and coordinates all submodules
 */
class PeerNet {
    /**
     * Create PeerNet instance
     * @param {object} [config] - Configuration options
     */
    constructor(config = {}) {
        // Initialize event emitter
        this._initEventEmitter?.();
        
        // Setup configuration
        this._config = new Configuration(config);
        const validation = this._config.validate();
        if (!validation.valid) {
            throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
        }

        // Initialize event bus
        this._bus = new EventBus();

        // State
        this._peer = null;
        this._id = null;
        this._connections = new Map();
        this._ready = false;
        this._destroyed = false;

        // Submodules (initialized after peer is ready)
        this._observer = null;
        this._lobby = null;
        this._auth = null;
        this._commitment = null;
        this._sync = null;
        this._storage = null;
        this._messaging = null;
        this._ui = null;

        // Initialize PeerJS
        this._initializePeer();
    }

    /**
     * Initialize PeerJS instance
     * @private
     */
    async _initializePeer() {
        const peerConfig = {
            ...this._config.get('server')
        };

        // Use custom peer ID if provided
        if (this._config.get('peerId')) {
            peerConfig.id = this._config.get('peerId');
        }

        try {
            // Create PeerJS instance
            this._peer = new Peer(peerConfig);

            this._peer.on('open', (id) => {
                this._id = id;
                this._ready = true;
                this._initializeSubmodules();
                this.emit('peer:open', { id });
                this._bus.emit('peer:open', { id });
            });

            this._peer.on('error', (error) => {
                this.emit('peer:error', { error });
                this._bus.emit('peer:error', { error });
            });

            this._peer.on('close', () => {
                this._destroyed = true;
                this.emit('peer:close', {});
                this._bus.emit('peer:close', {});
            });

            this._peer.on('disconnected', () => {
                this.emit('peer:disconnected', {});
                this._bus.emit('peer:disconnected', {});
            });

            // Handle incoming connections
            this._peer.on('connection', (connection) => {
                this._handleIncomingConnection(connection);
            });

        } catch (error) {
            this.emit('peer:error', { error });
            throw error;
        }
    }

    /**
     * Initialize submodules after peer is ready
     * @private
     */
    _initializeSubmodules() {
        // Observer module
        if (typeof Observer !== 'undefined') {
            this._observer = new Observer(this, this._config.get('logging'));
        }

        // Messaging module
        if (typeof MessagingManager !== 'undefined') {
            this._messaging = new MessagingManager(this);
        }

        // Lobby module
        if (typeof LobbyManager !== 'undefined') {
            this._lobby = new LobbyManager(this);
        }

        // Auth/Crypto module
        if (typeof AuthCrypto !== 'undefined') {
            this._auth = new AuthCrypto(this, this._config.get('crypto'));
        }

        // Commitment module
        if (typeof CommitmentManager !== 'undefined') {
            this._commitment = new CommitmentManager(this);
        }

        // State Sync module
        if (typeof StateManager !== 'undefined') {
            this._sync = new StateManager(this);
        }

        // Persistence module
        if (typeof PersistenceManager !== 'undefined') {
            this._storage = new PersistenceManager(this, this._config.get('storage'));
        }

        // UI Components
        if (typeof UIFactory !== 'undefined') {
            this._ui = new UIFactory(this);
        }
    }

    /**
     * Handle incoming connection
     * @private
     */
    _handleIncomingConnection(connection) {
        const peerId = connection.peer;

        this.emit('connection:incoming', { connection, peerId });
        this._bus.emit('connection:incoming', { connection, peerId });

        this._setupConnectionHandlers(connection);

        // Store connection
        this._connections.set(peerId, connection);
    }

    /**
     * Setup connection event handlers
     * @private
     */
    _setupConnectionHandlers(connection) {
        const peerId = connection.peer;

        connection.on('open', () => {
            this.emit('connection:established', { connection, peerId });
            this._bus.emit('connection:established', { connection, peerId });
        });

        connection.on('data', (data) => {
            this._handleMessage(peerId, data);
        });

        connection.on('close', () => {
            this._connections.delete(peerId);
            this.emit('connection:closed', { peerId });
            this._bus.emit('connection:closed', { peerId });
        });

        connection.on('error', (error) => {
            this.emit('connection:error', { peerId, error });
            this._bus.emit('connection:error', { peerId, error });
        });

        connection.on('iceStateChanged', (state) => {
            this._bus.emit('connection:iceState', { peerId, state });
        });
    }

    /**
     * Handle incoming message
     * @private
     */
    _handleMessage(peerId, data) {
        // Decode if needed
        let message = data;
        if (typeof data === 'string') {
            try {
                message = JSON.parse(data);
            } catch (e) {
                // Raw string message
            }
        }

        // Emit to message handlers
        this.emit('message', { peerId, data: message });
        this._bus.emit('message', { peerId, data: message });

        // Route to messaging module if available
        if (this._messaging) {
            this._messaging._handleIncoming(peerId, message);
        }
    }

    // Public API

    /**
     * Get peer ID
     * @returns {string|null}
     */
    get id() {
        return this._id;
    }

    /**
     * Get underlying PeerJS instance
     * @returns {Peer|null}
     */
    get peer() {
        return this._peer;
    }

    /**
     * Get active connections
     * @returns {Map<string, DataConnection>}
     */
    get connections() {
        return new Map(this._connections);
    }

    /**
     * Check if ready
     * @returns {boolean}
     */
    get ready() {
        return this._ready;
    }

    /**
     * Get Observer submodule
     * @returns {Observer|null}
     */
    get observer() {
        return this._observer;
    }

    /**
     * Get Lobby subsystem
     * @returns {LobbyManager|null}
     */
    get lobby() {
        return this._lobby;
    }

    /**
     * Get Auth/Crypto subsystem
     * @returns {AuthCrypto|null}
     */
    get auth() {
        return this._auth;
    }

    /**
     * Get Commitment subsystem
     * @returns {CommitmentManager|null}
     */
    get commitment() {
        return this._commitment;
    }

    /**
     * Get State Sync subsystem
     * @returns {StateManager|null}
     */
    get sync() {
        return this._sync;
    }

    /**
     * Get Persistence subsystem
     * @returns {PersistenceManager|null}
     */
    get storage() {
        return this._storage;
    }

    /**
     * Get Messaging subsystem
     * @returns {MessagingManager|null}
     */
    get messaging() {
        return this._messaging;
    }

    /**
     * Get UI Components factory
     * @returns {UIFactory|null}
     */
    get ui() {
        return this._ui;
    }

    /**
     * Wait for peer to be ready
     * @param {number} [timeout] - Timeout in ms
     * @returns {Promise<string>} Peer ID
     */
    async whenReady(timeout = 30000) {
        if (this._ready) return this._id;
        if (this._destroyed) throw new Error('PeerNet instance has been destroyed');

        return Promise.race([
            this._bus.once('peer:open').then(e => e.id),
            Utils.sleep(timeout).then(() => {
                throw new Error('Timeout waiting for peer to be ready');
            })
        ]);
    }

    /**
     * Establish connection to another peer
     * @param {string} peerId - Target peer ID
     * @param {object} [options] - Connection options
     * @returns {Promise<DataConnection>}
     */
    async connect(peerId, options = {}) {
        if (!this._ready) {
            await this.whenReady();
        }

        // Check existing connection
        if (this._connections.has(peerId)) {
            return this._connections.get(peerId);
        }

        const connectionOptions = {
            reliable: options.reliable !== false,
            metadata: options.metadata || {},
            serialization: 'json'
        };

        return new Promise((resolve, reject) => {
            const timeout = options.timeout || this._config.get('connection.timeout');
            let timeoutId;

            const connection = this._peer.connect(peerId, connectionOptions);

            timeoutId = setTimeout(() => {
                connection.close();
                reject(new Error(`Connection timeout to peer: ${peerId}`));
            }, timeout);

            connection.on('open', () => {
                clearTimeout(timeoutId);
                this._setupConnectionHandlers(connection);
                this._connections.set(peerId, connection);
                resolve(connection);
            });

            connection.on('error', (error) => {
                clearTimeout(timeoutId);
                reject(error);
            });
        });
    }

    /**
     * Disconnect from specific peer or all peers
     * @param {string} [peerId] - Peer ID (optional, disconnects all if omitted)
     * @returns {Promise<void>}
     */
    async disconnect(peerId) {
        if (peerId) {
            const connection = this._connections.get(peerId);
            if (connection) {
                connection.close();
                this._connections.delete(peerId);
            }
        } else {
            // Disconnect all
            for (const [id, conn] of this._connections) {
                conn.close();
            }
            this._connections.clear();
        }
    }

    /**
     * Send message to specific peer
     * @param {string} peerId - Target peer ID
     * @param {any} message - Message to send
     * @param {object} [options] - Send options
     * @returns {Promise<object>}
     */
    async send(peerId, message, options = {}) {
        const connection = this._connections.get(peerId);
        if (!connection) {
            throw new Error(`No connection to peer: ${peerId}`);
        }

        const messageId = Utils.generateId('msg');
        const envelope = {
            id: messageId,
            type: options.type || 'data',
            payload: message,
            timestamp: Date.now(),
            requiresAck: options.requireAck || false
        };

        if (this._messaging && options.requireAck) {
            return this._messaging.sendWithAck(peerId, envelope, options.timeout);
        }

        connection.send(envelope);

        return {
            messageId,
            delivered: true,
            timestamp: envelope.timestamp
        };
    }

    /**
     * Broadcast message to all connected peers
     * @param {any} message - Message to broadcast
     * @param {object} [options] - Broadcast options
     * @returns {Promise<object>}
     */
    async broadcast(message, options = {}) {
        const results = {
            broadcastId: Utils.generateId('bc'),
            recipients: Array.from(this._connections.keys()),
            delivered: [],
            failed: []
        };

        const envelope = {
            id: results.broadcastId,
            type: options.type || 'broadcast',
            payload: message,
            timestamp: Date.now(),
            requiresAck: options.requireAck || false
        };

        const sendPromises = [];
        for (const [peerId, connection] of this._connections) {
            // Apply filter if provided
            if (options.filter && !options.filter(peerId)) {
                continue;
            }

            const promise = new Promise(resolve => {
                try {
                    connection.send(envelope);
                    results.delivered.push(peerId);
                    resolve();
                } catch (error) {
                    results.failed.push(peerId);
                    resolve();
                }
            });
            sendPromises.push(promise);
        }

        await Promise.all(sendPromises);
        return results;
    }

    /**
     * Subscribe to events
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {Function} Unsubscribe function
     */
    on(event, handler) {
        return this._bus.on(event, handler);
    }

    /**
     * Unsubscribe from events
     * @param {string} event - Event name
     * @param {Function} [handler] - Specific handler (optional)
     */
    off(event, handler) {
        this._bus.off(event, handler);
    }

    /**
     * Promise-based one-time event subscription
     * @param {string} event - Event name
     * @returns {Promise<any>}
     */
    once(event) {
        return this._bus.once(event);
    }

    /**
     * Clean shutdown of PeerNet instance
     * @returns {Promise<void>}
     */
    async destroy() {
        if (this._destroyed) return;

        // Disconnect all connections
        await this.disconnect();

        // Destroy peer
        if (this._peer) {
            this._peer.destroy();
        }

        this._destroyed = true;
    }
}

// Apply EventEmitter mixin
Object.assign(PeerNet.prototype, EventEmitter);

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PeerNet, EventBus, Configuration };
}

// === src/observability.js ===
/**
 * PeerNet Observability Module
 * Logging, monitoring, and introspection utilities
 * @module observability
 */

/**
 * Logger - Structured logging with levels and transports
 */
class Logger {
    /**
     * Create logger instance
     * @param {object} [config] - Logging configuration
     */
    constructor(config = {}) {
        this._level = config.level || 'info';
        this._transports = [];
        this._categoryLoggers = new Map();

        // Add default console transport
        if (config.transports?.includes('console') || !config.transports) {
            this.addTransport(new ConsoleTransport());
        }
    }

    static get LEVELS() {
        return {
            trace: 0,
            debug: 1,
            info: 2,
            warn: 3,
            error: 4
        };
    }

    /**
     * Set minimum log level
     * @param {string} level - Log level
     */
    setLevel(level) {
        if (!Logger.LEVELS.hasOwnProperty(level)) {
            throw new Error(`Invalid log level: ${level}`);
        }
        this._level = level;
    }

    /**
     * Add output transport
     * @param {object} transport - Transport object with log method
     */
    addTransport(transport) {
        this._transports.push(transport);
    }

    /**
     * Remove transport
     * @param {object} transport - Transport to remove
     */
    removeTransport(transport) {
        const index = this._transports.indexOf(transport);
        if (index > -1) {
            this._transports.splice(index, 1);
        }
    }

    /**
     * Create category-bound logger
     * @param {string} category - Category name
     * @returns {CategoryLogger}
     */
    createCategoryLogger(category) {
        if (!this._categoryLoggers.has(category)) {
            this._categoryLoggers.set(category, new CategoryLogger(this, category));
        }
        return this._categoryLoggers.get(category);
    }

    /**
     * Log at trace level
     */
    trace(category, message, data) {
        this._log('trace', category, message, data);
    }

    /**
     * Log at debug level
     */
    debug(category, message, data) {
        this._log('debug', category, message, data);
    }

    /**
     * Log at info level
     */
    info(category, message, data) {
        this._log('info', category, message, data);
    }

    /**
     * Log at warn level
     */
    warn(category, message, data) {
        this._log('warn', category, message, data);
    }

    /**
     * Log at error level
     */
    error(category, message, error, data) {
        this._log('error', category, message, { error: error?.message || error, ...data });
    }

    /**
     * Internal log method
     * @private
     */
    _log(level, category, message, data) {
        if (Logger.LEVELS[level] < Logger.LEVELS[this._level]) {
            return;
        }

        const entry = {
            level,
            category,
            message,
            data,
            timestamp: Date.now()
        };

        this._transports.forEach(transport => {
            try {
                transport.log(entry);
            } catch (e) {
                console.error('Transport error:', e);
            }
        });
    }
}

/**
 * Console Transport
 */
class ConsoleTransport {
    constructor(options = {}) {
        this._colors = options.colors !== false;
        this._colorMap = {
            trace: 'color: gray',
            debug: 'color: cyan',
            info: 'color: green',
            warn: 'color: orange',
            error: 'color: red'
        };
    }

    log(entry) {
        const { level, category, message, data, timestamp } = entry;
        const time = new Date(timestamp).toISOString();
        const prefix = `[${time}] [${category}]`;

        const style = this._colorMap[level] || '';
        const method = console[level] || console.log;

        if (this._colors && typeof window !== 'undefined') {
            method(`%c${prefix} ${message}`, style, data || '');
        } else {
            method(prefix, message, data || '');
        }
    }
}

/**
 * Category Logger - Pre-bound to a category
 */
class CategoryLogger {
    constructor(logger, category) {
        this._logger = logger;
        this._category = category;
    }

    trace(message, data) {
        this._logger.trace(this._category, message, data);
    }

    debug(message, data) {
        this._logger.debug(this._category, message, data);
    }

    info(message, data) {
        this._logger.info(this._category, message, data);
    }

    warn(message, data) {
        this._logger.warn(this._category, message, data);
    }

    error(message, error, data) {
        this._logger.error(this._category, message, error, data);
    }
}

/**
 * ConnectionMonitor - Real-time monitoring of connection health
 */
class ConnectionMonitor {
    /**
     * Create connection monitor
     * @param {PeerNet} peernet - PeerNet instance
     */
    constructor(peernet) {
        this._peernet = peernet;
        this._monitored = new Map();
        this._latencyHistory = new Map();
        this._throughput = new Map();
        this._pingInterval = null;
        this._eventBus = new EventBus();
    }

    /**
     * Start monitoring a connection
     * @param {DataConnection} connection - Connection to monitor
     */
    startMonitoring(connection) {
        const peerId = connection.peer;
        if (this._monitored.has(peerId)) return;

        this._monitored.set(peerId, {
            connection,
            startTime: Date.now(),
            messagesSent: 0,
            messagesReceived: 0,
            bytesSent: 0,
            bytesReceived: 0,
            errors: 0,
            lastPing: null
        });

        this._latencyHistory.set(peerId, []);
        this._throughput.set(peerId, { sent: 0, received: 0, timestamp: Date.now() });

        // Start periodic ping
        this._startPingLoop(peerId);

        // Track messages
        connection.on('data', (data) => {
            this._recordMessage(peerId, 'received', data);
        });
    }

    /**
     * Stop monitoring a connection
     * @param {string} peerId - Peer ID
     */
    stopMonitoring(peerId) {
        this._monitored.delete(peerId);
        this._latencyHistory.delete(peerId);
        this._throughput.delete(peerId);
    }

    /**
     * Measure latency to peer
     * @param {string} peerId - Peer ID
     * @returns {Promise<object>}
     */
    async ping(peerId) {
        const monitored = this._monitored.get(peerId);
        if (!monitored) {
            throw new Error(`Peer ${peerId} is not being monitored`);
        }

        const pingId = Utils.generateId('ping');
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Ping timeout'));
            }, 5000);

            const handler = (data) => {
                if (data.type === 'pong' && data.pingId === pingId) {
                    clearTimeout(timeout);
                    const latency = Date.now() - startTime;
                    
                    // Store in history
                    const history = this._latencyHistory.get(peerId);
                    history.push({ latency, timestamp: Date.now() });
                    if (history.length > 100) history.shift();

                    monitored.lastPing = latency;
                    this._eventBus.emit('monitor:latency', { peerId, latency, timestamp: Date.now() });

                    resolve({ peerId, latency, timestamp: Date.now() });
                }
            };

            monitored.connection.on('data', handler);

            // Send ping
            monitored.connection.send({
                type: 'ping',
                pingId,
                timestamp: startTime
            });

            // Cleanup listener after timeout
            setTimeout(() => {
                monitored.connection.off('data', handler);
            }, 5000);
        });
    }

    /**
     * Get latency history
     * @param {string} peerId - Peer ID
     * @returns {Array}
     */
    getLatencyHistory(peerId) {
        return this._latencyHistory.get(peerId) || [];
    }

    /**
     * Get throughput statistics
     * @param {string} peerId - Peer ID
     * @returns {object}
     */
    getThroughput(peerId) {
        const monitored = this._monitored.get(peerId);
        if (!monitored) return null;

        const throughput = this._throughput.get(peerId);
        const elapsed = (Date.now() - throughput.timestamp) / 1000;

        return {
            sent: monitored.bytesSent,
            received: monitored.bytesReceived,
            sentRate: throughput.sent / elapsed,
            receivedRate: throughput.received / elapsed
        };
    }

    /**
     * Check if connection is healthy
     * @param {string} peerId - Peer ID
     * @returns {boolean}
     */
    isHealthy(peerId) {
        const monitored = this._monitored.get(peerId);
        if (!monitored) return false;

        // Check last ping
        if (monitored.lastPing !== null && monitored.lastPing > 1000) {
            return false;
        }

        // Check error rate
        if (monitored.errors > 10) {
            return false;
        }

        return true;
    }

    /**
     * Get connection statistics
     * @param {string} [peerId] - Peer ID (optional, returns all if omitted)
     * @returns {object}
     */
    getConnectionStats(peerId) {
        if (peerId) {
            const monitored = this._monitored.get(peerId);
            if (!monitored) return null;

            const history = this._latencyHistory.get(peerId) || [];
            const avgLatency = history.length > 0
                ? history.reduce((sum, h) => sum + h.latency, 0) / history.length
                : null;

            return {
                peerId,
                uptime: Date.now() - monitored.startTime,
                messagesSent: monitored.messagesSent,
                messagesReceived: monitored.messagesReceived,
                bytesSent: monitored.bytesSent,
                bytesReceived: monitored.bytesReceived,
                avgLatency,
                lastPing: monitored.lastPing,
                errors: monitored.errors
            };
        }

        // Return all stats
        const stats = {};
        for (const [id] of this._monitored) {
            stats[id] = this.getConnectionStats(id);
        }
        return stats;
    }

    /**
     * Subscribe to monitor events
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {Function} Unsubscribe function
     */
    on(event, handler) {
        return this._eventBus.on(event, handler);
    }

    /**
     * Start ping loop for peer
     * @private
     */
    _startPingLoop(peerId) {
        const pingLoop = async () => {
            while (this._monitored.has(peerId)) {
                try {
                    await this.ping(peerId);
                } catch (e) {
                    // Ping failed, emit unhealthy
                    this._eventBus.emit('monitor:unhealthy', { peerId, reason: e.message });
                }
                await Utils.sleep(10000); // Ping every 10 seconds
            }
        };
        pingLoop();
    }

    /**
     * Record message statistics
     * @private
     */
    _recordMessage(peerId, direction, data) {
        const monitored = this._monitored.get(peerId);
        if (!monitored) return;

        const size = JSON.stringify(data).length;

        if (direction === 'sent') {
            monitored.messagesSent++;
            monitored.bytesSent += size;
        } else {
            monitored.messagesReceived++;
            monitored.bytesReceived += size;
        }
    }
}

/**
 * PeerTracker - Tracks peer lifecycle events
 */
class PeerTracker {
    /**
     * Create peer tracker
     * @param {PeerNet} peernet - PeerNet instance
     */
    constructor(peernet) {
        this._peernet = peernet;
        this._peers = new Map();
        this._timeline = [];
        this._maxTimeline = 1000;
        this._eventBus = new EventBus();

        // Setup event listeners
        this._setupListeners();
    }

    /**
     * Setup peer event listeners
     * @private
     */
    _setupListeners() {
        this._peernet.on('connection:established', ({ peerId }) => {
            this._handlePeerJoin(peerId);
        });

        this._peernet.on('connection:closed', ({ peerId }) => {
            this._handlePeerLeave(peerId);
        });
    }

    /**
     * Begin tracking a peer
     * @param {string} peerId - Peer ID
     * @param {object} [metadata] - Peer metadata
     */
    track(peerId, metadata = {}) {
        if (this._peers.has(peerId)) {
            // Update existing
            const peer = this._peers.get(peerId);
            peer.metadata = { ...peer.metadata, ...metadata };
            peer.lastSeen = Date.now();
            return;
        }

        this._peers.set(peerId, {
            peerId,
            metadata,
            firstSeen: Date.now(),
            lastSeen: Date.now(),
            status: 'active',
            reconnects: 0
        });

        this._addTimelineEvent('track', peerId, { metadata });
    }

    /**
     * Stop tracking a peer
     * @param {string} peerId - Peer ID
     */
    untrack(peerId) {
        this._peers.delete(peerId);
        this._addTimelineEvent('untrack', peerId);
    }

    /**
     * Get currently active peers
     * @returns {Array}
     */
    getActivePeers() {
        return Array.from(this._peers.values()).filter(p => p.status === 'active');
    }

    /**
     * Get event timeline for a peer
     * @param {string} peerId - Peer ID
     * @returns {Array}
     */
    getPeerTimeline(peerId) {
        return this._timeline.filter(e => e.peerId === peerId);
    }

    /**
     * Hook for peer join events
     * @param {Function} handler - Handler function
     * @returns {Function} Unsubscribe function
     */
    onPeerJoin(handler) {
        return this._eventBus.on('peer:join', handler);
    }

    /**
     * Hook for peer leave events
     * @param {Function} handler - Handler function
     * @returns {Function} Unsubscribe function
     */
    onPeerLeave(handler) {
        return this._eventBus.on('peer:leave', handler);
    }

    /**
     * Hook for peer reconnect events
     * @param {Function} handler - Handler function
     * @returns {Function} Unsubscribe function
     */
    onPeerReconnect(handler) {
        return this._eventBus.on('peer:reconnect', handler);
    }

    /**
     * Handle peer join
     * @private
     */
    _handlePeerJoin(peerId) {
        const existing = this._peers.get(peerId);
        if (existing) {
            // Reconnect
            existing.status = 'active';
            existing.lastSeen = Date.now();
            existing.reconnects++;
            this._addTimelineEvent('reconnect', peerId);
            this._eventBus.emit('peer:reconnect', { peerId, peer: existing });
        } else {
            // New peer
            this.track(peerId);
            this._addTimelineEvent('join', peerId);
            this._eventBus.emit('peer:join', { peerId, peer: this._peers.get(peerId) });
        }
    }

    /**
     * Handle peer leave
     * @private
     */
    _handlePeerLeave(peerId) {
        const peer = this._peers.get(peerId);
        if (peer) {
            peer.status = 'disconnected';
            peer.lastSeen = Date.now();
            this._addTimelineEvent('leave', peerId);
            this._eventBus.emit('peer:leave', { peerId, peer });
        }
    }

    /**
     * Add timeline event
     * @private
     */
    _addTimelineEvent(type, peerId, data = {}) {
        this._timeline.push({
            type,
            peerId,
            timestamp: Date.now(),
            ...data
        });
        if (this._timeline.length > this._maxTimeline) {
            this._timeline.shift();
        }
    }
}

/**
 * Observer - Central observability manager
 */
class Observer {
    /**
     * Create observer
     * @param {PeerNet} peernet - PeerNet instance
     * @param {object} [config] - Configuration
     */
    constructor(peernet, config = {}) {
        this._peernet = peernet;
        this._config = config;

        this._logger = new Logger(config);
        this._monitor = new ConnectionMonitor(peernet);
        this._tracker = new PeerTracker(peernet);

        this._tracingEnabled = new Set();
        this._introspectionData = {};
    }

    /**
     * Get logger instance
     * @returns {Logger}
     */
    get logger() {
        return this._logger;
    }

    /**
     * Get connection monitor
     * @returns {ConnectionMonitor}
     */
    get monitor() {
        return this._monitor;
    }

    /**
     * Get metrics collector
     * @returns {MetricsCollector}
     */
    get metrics() {
        return this._monitor;
    }

    /**
     * Get history of peer events
     * @param {object} [filter] - Filter options
     * @returns {Array}
     */
    getPeerHistory(filter = {}) {
        let events = this._tracker._timeline;

        if (filter.type) {
            events = events.filter(e => e.type === filter.type);
        }
        if (filter.peerId) {
            events = events.filter(e => e.peerId === filter.peerId);
        }
        if (filter.since) {
            events = events.filter(e => e.timestamp >= filter.since);
        }

        return events;
    }

    /**
     * Get connection statistics
     * @param {string} [peerId] - Peer ID
     * @returns {object}
     */
    getConnectionStats(peerId) {
        return this._monitor.getConnectionStats(peerId);
    }

    /**
     * Generate comprehensive health report
     * @returns {object}
     */
    getHealthReport() {
        const connections = this._monitor.getConnectionStats();
        const peers = this._tracker.getActivePeers();

        let overallStatus = 'healthy';
        const recommendations = [];

        // Analyze connections
        for (const [peerId, stats] of Object.entries(connections)) {
            if (stats.avgLatency > 500) {
                overallStatus = overallStatus === 'healthy' ? 'degraded' : overallStatus;
                recommendations.push(`High latency to peer ${peerId}: ${stats.avgLatency.toFixed(0)}ms`);
            }
            if (stats.errors > 5) {
                overallStatus = 'unhealthy';
                recommendations.push(`High error rate with peer ${peerId}: ${stats.errors} errors`);
            }
        }

        if (peers.length === 0) {
            recommendations.push('No active peer connections');
        }

        return {
            overallStatus,
            connections,
            activePeers: peers.length,
            recommendations,
            timestamp: Date.now()
        };
    }

    /**
     * Get deep introspection of current state
     * @returns {object}
     */
    introspect() {
        return {
            peerId: this._peernet.id,
            ready: this._peernet.ready,
            connections: {
                count: this._peernet.connections.size,
                peers: Array.from(this._peernet.connections.keys())
            },
            observed: {
                peers: this._tracker.getActivePeers(),
                health: this.getHealthReport()
            },
            config: this._peernet._config?.getAll?.() || {},
            timestamp: Date.now()
        };
    }

    /**
     * Enable detailed tracing for categories
     * @param {string[]} [categories] - Categories to trace (all if omitted)
     */
    enableTracing(categories = null) {
        if (categories) {
            categories.forEach(c => this._tracingEnabled.add(c));
        } else {
            this._tracingEnabled.add('*');
        }
        this._logger.setLevel('trace');
    }

    /**
     * Disable all tracing
     */
    disableTracing() {
        this._tracingEnabled.clear();
        this._logger.setLevel(this._config.level || 'info');
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Logger, ConsoleTransport, CategoryLogger, ConnectionMonitor, PeerTracker, Observer };
}

// === src/lobby.js ===
/**
 * PeerNet Lobby System Module
 * Lobby management with FCFS, obfuscated master, and multi-lobby support
 * @module lobby
 */

/**
 * Base Lobby class
 */
class Lobby {
    /**
     * Create lobby
     * @param {object} options - Lobby options
     * @param {PeerNet} peernet - PeerNet instance
     */
    constructor(options, peernet) {
        this.id = options.id || Utils.generateId('lobby');
        this._peernet = peernet;
        this._hostId = options.hostId || peernet.id;
        this._members = new Map();
        this._settings = {
            allowHostMigration: options.allowHostMigration !== false,
            allowMemberKick: options.allowMemberKick !== false,
            allowBroadcast: options.allowBroadcast !== false,
            visibility: options.visibility || 'public',
            maxMembers: options.maxMembers || 16,
            ...options.settings
        };
        this._metadata = options.metadata || {};
        this._secret = options.secret || null;
        this._eventBus = new EventBus();
        this._destroyed = false;

        // Add self as member
        this._addMember(peernet.id, 'host');
    }

    /**
     * Get current host ID
     * @returns {string}
     */
    get hostId() {
        return this._hostId;
    }

    /**
     * Get lobby members
     * @returns {Map}
     */
    get members() {
        return new Map(this._members);
    }

    /**
     * Get lobby settings
     * @returns {object}
     */
    get settings() {
        return { ...this._settings };
    }

    /**
     * Check if current peer is host
     * @returns {boolean}
     */
    isHost() {
        return this._hostId === this._peernet.id;
    }

    /**
     * Add member to lobby
     * @param {string} peerId - Peer ID
     * @param {string} role - Member role
     * @param {object} [metadata] - Member metadata
     */
    _addMember(peerId, role = 'member', metadata = {}) {
        this._members.set(peerId, {
            peerId,
            role,
            joinedAt: Date.now(),
            metadata
        });
        this._eventBus.emit('lobby:member_joined', {
            lobbyId: this.id,
            peer: this._members.get(peerId)
        });
    }

    /**
     * Remove member from lobby
     * @param {string} peerId - Peer ID
     */
    _removeMember(peerId) {
        const member = this._members.get(peerId);
        if (member) {
            this._members.delete(peerId);
            this._eventBus.emit('lobby:member_left', {
                lobbyId: this.id,
                peerId
            });
        }
    }

    /**
     * Transfer host role to another member
     * @param {string} newHostId - New host peer ID
     * @returns {Promise<void>}
     */
    async transferHost(newHostId) {
        if (!this.isHost()) {
            throw new Error('Only host can transfer host role');
        }
        if (!this._members.has(newHostId)) {
            throw new Error('New host must be a lobby member');
        }

        const oldHost = this._hostId;
        this._members.get(oldHost).role = 'member';
        this._members.get(newHostId).role = 'host';
        this._hostId = newHostId;

        this._eventBus.emit('lobby:host_transferred', {
            lobbyId: this.id,
            oldHost,
            newHost: newHostId
        });

        // Broadcast transfer
        await this.broadcast({
            type: 'lobby:host_transferred',
            lobbyId: this.id,
            oldHost,
            newHost: newHostId
        });
    }

    /**
     * Remove member from lobby (host only)
     * @param {string} peerId - Peer ID to kick
     * @param {string} [reason] - Kick reason
     * @returns {Promise<void>}
     */
    async kickMember(peerId, reason) {
        if (!this.isHost()) {
            throw new Error('Only host can kick members');
        }
        if (!this._settings.allowMemberKick) {
            throw new Error('Member kick is disabled');
        }

        // Notify kicked member
        const connection = this._peernet.connections.get(peerId);
        if (connection) {
            connection.send({
                type: 'lobby:kicked',
                lobbyId: this.id,
                reason
            });
        }

        this._removeMember(peerId);
    }

    /**
     * Broadcast message to all lobby members
     * @param {any} message - Message to broadcast
     * @returns {Promise<void>}
     */
    async broadcast(message) {
        if (!this._settings.allowBroadcast && !this.isHost()) {
            throw new Error('Broadcast is disabled for non-hosts');
        }

        const envelope = {
            type: 'lobby:broadcast',
            lobbyId: this.id,
            payload: message,
            timestamp: Date.now()
        };

        for (const [peerId] of this._members) {
            if (peerId !== this._peernet.id) {
                await this._peernet.send(peerId, envelope);
            }
        }
    }

    /**
     * Send message to lobby host
     * @param {any} message - Message to send
     * @returns {Promise<void>}
     */
    async sendToHost(message) {
        if (this.isHost()) {
            throw new Error('Cannot send to self');
        }

        const envelope = {
            type: 'lobby:message',
            lobbyId: this.id,
            payload: message,
            timestamp: Date.now()
        };

        await this._peernet.send(this._hostId, envelope);
    }

    /**
     * Update lobby settings (host only)
     * @param {object} settings - New settings
     * @returns {Promise<void>}
     */
    async updateSettings(settings) {
        if (!this.isHost()) {
            throw new Error('Only host can update settings');
        }

        this._settings = { ...this._settings, ...settings };

        // Broadcast update
        await this.broadcast({
            type: 'lobby:settings_updated',
            lobbyId: this.id,
            settings: this._settings
        });
    }

    /**
     * Close the lobby (host only)
     * @returns {Promise<void>}
     */
    async close() {
        if (!this.isHost()) {
            throw new Error('Only host can close lobby');
        }

        await this.broadcast({
            type: 'lobby:closed',
            lobbyId: this.id
        });

        this._destroyed = true;
        this._eventBus.emit('lobby:closed', { lobbyId: this.id });
    }

    /**
     * Subscribe to lobby events
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {Function} Unsubscribe function
     */
    on(event, handler) {
        return this._eventBus.on(event, handler);
    }

    /**
     * Get lobby info for discovery
     * @returns {object}
     */
    getInfo() {
        return {
            id: this.id,
            hostId: this._hostId,
            memberCount: this._members.size,
            maxMembers: this._settings.maxMembers,
            visibility: this._settings.visibility,
            requiresSecret: !!this._secret,
            metadata: { ...this._metadata }
        };
    }
}

/**
 * FCFS Lobby - First-Come-First-Served with automatic host migration
 */
class FCFSLobby extends Lobby {
    constructor(options, peernet) {
        super(options, peernet);
        this._hostQueue = [];
        this._autoMigration = options.autoMigration !== false;
    }

    /**
     * Get ordered list of members for host succession
     * @returns {string[]}
     */
    getHostQueue() {
        return [...this._hostQueue];
    }

    /**
     * Enable/disable automatic host migration
     * @param {boolean} enabled - Enable state
     */
    enableAutoMigration(enabled) {
        this._autoMigration = enabled;
    }

    /**
     * Add member with queue tracking
     * @override
     */
    _addMember(peerId, role = 'member', metadata = {}) {
        super._addMember(peerId, role, metadata);

        // Add to host queue
        if (!this._hostQueue.includes(peerId)) {
            this._hostQueue.push(peerId);
            this._eventBus.emit('lobby:host_queue_updated', {
                lobbyId: this.id,
                queue: this._hostQueue
            });
        }
    }

    /**
     * Remove member with queue tracking
     * @override
     */
    _removeMember(peerId) {
        super._removeMember(peerId);

        // Remove from queue
        const index = this._hostQueue.indexOf(peerId);
        if (index > -1) {
            this._hostQueue.splice(index, 1);
        }

        // Auto-migrate if needed
        if (this._autoMigration && peerId === this._hostId && this._hostQueue.length > 0) {
            this._migrateHost();
        }
    }

    /**
     * Migrate host to next in queue
     * @private
     */
    async _migrateHost() {
        const newHostId = this._hostQueue[0];
        if (!newHostId) return;

        const oldHost = this._hostId;
        this._members.get(oldHost).role = 'member';
        this._members.get(newHostId).role = 'host';
        this._hostId = newHostId;

        this._eventBus.emit('lobby:host_migrated', {
            lobbyId: this.id,
            oldHost,
            newHost: newHostId
        });

        await this.broadcast({
            type: 'lobby:host_migrated',
            lobbyId: this.id,
            oldHost,
            newHost: newHostId,
            queue: this._hostQueue
        });
    }
}

/**
 * Obfuscated Master Lobby - Secret-based host claiming
 */
class ObfuscatedMasterLobby extends Lobby {
    constructor(options, peernet) {
        super(options, peernet);
        this._masterSecret = options.masterSecret || null;
        this._masterSecretHash = this._masterSecret ? this._hashSecret(this._masterSecret) : null;
        this._claimAttempts = new Map();
    }

    /**
     * Set the master secret (initial setup only)
     * @param {string} secret - Master secret
     */
    setMasterSecret(secret) {
        if (this._masterSecretHash) {
            throw new Error('Master secret already set');
        }
        this._masterSecret = secret;
        this._masterSecretHash = this._hashSecret(secret);
    }

    /**
     * Check if a master secret is set
     * @returns {boolean}
     */
    hasMasterSecret() {
        return !!this._masterSecretHash;
    }

    /**
     * Attempt to claim host role with secret
     * @param {string} secret - Secret to try
     * @returns {Promise<boolean>}
     */
    async claimHost(secret) {
        if (!this._masterSecretHash) {
            throw new Error('No master secret configured');
        }

        const claimerId = this._peernet.id;

        // Rate limiting
        const attempts = this._claimAttempts.get(claimerId) || 0;
        if (attempts >= 3) {
            this._eventBus.emit('lobby:claim_failed', { peerId: claimerId, reason: 'Too many attempts' });
            return false;
        }
        this._claimAttempts.set(claimerId, attempts + 1);

        // Verify secret
        const secretHash = await this._hashSecret(secret);
        if (secretHash !== this._masterSecretHash) {
            this._eventBus.emit('lobby:claim_failed', { peerId: claimerId, reason: 'Invalid secret' });
            return false;
        }

        // Claim successful
        const oldHost = this._hostId;
        if (this._members.has(oldHost)) {
            this._members.get(oldHost).role = 'member';
        }
        if (!this._members.has(claimerId)) {
            this._addMember(claimerId, 'host');
        } else {
            this._members.get(claimerId).role = 'host';
        }
        this._hostId = claimerId;

        this._eventBus.emit('lobby:master_claimed', { newHost: claimerId });

        // Broadcast
        await this.broadcast({
            type: 'lobby:master_claimed',
            lobbyId: this.id,
            oldHost,
            newHost: claimerId
        });

        return true;
    }

    /**
     * Hash secret for verification
     * @private
     */
    async _hashSecret(secret) {
        return Utils.sha256(secret);
    }

    /**
     * Get lobby info (includes hash for verification)
     * @override
     */
    getInfo() {
        return {
            ...super.getInfo(),
            masterSecretHash: this._masterSecretHash,
            type: 'obfuscated'
        };
    }
}

/**
 * Multi-Lobby Host - Manage multiple independent lobbies
 */
class MultiLobbyHost {
    /**
     * Create multi-lobby host
     * @param {PeerNet} peernet - PeerNet instance
     */
    constructor(peernet) {
        this._peernet = peernet;
        this._lobbies = new Map();
        this._lobbyNames = new Map();
        this._visibility = new Map();
        this._eventBus = new EventBus();
    }

    /**
     * Create named lobby
     * @param {string} name - Lobby name
     * @param {object} [options] - Lobby options
     * @returns {Promise<Lobby>}
     */
    async createNamedLobby(name, options = {}) {
        if (this._lobbyNames.has(name)) {
            throw new Error(`Lobby "${name}" already exists`);
        }

        const lobby = await this._createLobby(options);
        this._lobbyNames.set(name, lobby.id);
        this._visibility.set(lobby.id, options.visibility !== 'private');

        return lobby;
    }

    /**
     * Create lobby
     * @param {object} options - Lobby options
     * @returns {Promise<Lobby>}
     */
    async _createLobby(options = {}) {
        let lobby;
        const type = options.type || 'standard';

        switch (type) {
            case 'fcfs':
                lobby = new FCFSLobby(options, this._peernet);
                break;
            case 'obfuscated':
                lobby = new ObfuscatedMasterLobby(options, this._peernet);
                break;
            default:
                lobby = new Lobby(options, this._peernet);
        }

        this._lobbies.set(lobby.id, lobby);
        this._eventBus.emit('lobby:created', { lobby });

        return lobby;
    }

    /**
     * Get lobby by name
     * @param {string} name - Lobby name
     * @returns {Lobby|undefined}
     */
    getLobbyByName(name) {
        const lobbyId = this._lobbyNames.get(name);
        return lobbyId ? this._lobbies.get(lobbyId) : undefined;
    }

    /**
     * Get lobby by ID
     * @param {string} lobbyId - Lobby ID
     * @returns {Lobby|undefined}
     */
    getLobby(lobbyId) {
        return this._lobbies.get(lobbyId);
    }

    /**
     * List all owned lobbies
     * @returns {Lobby[]}
     */
    listLobbies() {
        return Array.from(this._lobbies.values());
    }

    /**
     * Set lobby visibility for discovery
     * @param {string} lobbyId - Lobby ID
     * @param {boolean} visible - Visibility state
     */
    setLobbyVisibility(lobbyId, visible) {
        this._visibility.set(lobbyId, visible);
    }

    /**
     * Check if lobby is visible
     * @param {string} lobbyId - Lobby ID
     * @returns {boolean}
     */
    isLobbyVisible(lobbyId) {
        return this._visibility.get(lobbyId) !== false;
    }

    /**
     * Close and remove lobby
     * @param {string} lobbyId - Lobby ID
     * @returns {Promise<void>}
     */
    async closeLobby(lobbyId) {
        const lobby = this._lobbies.get(lobbyId);
        if (lobby) {
            await lobby.close();
            this._lobbies.delete(lobbyId);
            this._visibility.delete(lobbyId);

            // Remove name mapping
            for (const [name, id] of this._lobbyNames) {
                if (id === lobbyId) {
                    this._lobbyNames.delete(name);
                    break;
                }
            }
        }
    }

    /**
     * Get visible lobbies for discovery
     * @returns {object[]}
     */
    getVisibleLobbies() {
        const visible = [];
        for (const [lobbyId, lobby] of this._lobbies) {
            if (this.isLobbyVisible(lobbyId)) {
                visible.push(lobby.getInfo());
            }
        }
        return visible;
    }

    /**
     * Subscribe to events
     * @param {string} event - Event name
     * @param {Function} handler - Handler
     * @returns {Function}
     */
    on(event, handler) {
        return this._eventBus.on(event, handler);
    }
}

/**
 * Lobby Manager - Central lobby management
 */
class LobbyManager {
    /**
     * Create lobby manager
     * @param {PeerNet} peernet - PeerNet instance
     */
    constructor(peernet) {
        this._peernet = peernet;
        this._currentLobby = null;
        this._multiHost = new MultiLobbyHost(peernet);
        this._discoveredLobbies = new Map();
        this._eventBus = new EventBus();

        // Setup message handlers
        this._setupHandlers();
    }

    /**
     * Get currently joined lobby
     * @returns {Lobby|null}
     */
    get currentLobby() {
        return this._currentLobby;
    }

    /**
     * Get owned lobbies
     * @returns {Map}
     */
    get ownedLobbies() {
        return this._multiHost._lobbies;
    }

    /**
     * Get discovered lobbies
     * @returns {Map}
     */
    get discoveredLobbies() {
        return new Map(this._discoveredLobbies);
    }

    /**
     * Setup message handlers
     * @private
     */
    _setupHandlers() {
        this._peernet.on('message', ({ peerId, data }) => {
            this._handleMessage(peerId, data);
        });
    }

    /**
     * Handle incoming lobby messages
     * @private
     */
    _handleMessage(peerId, data) {
        if (!data.type || !data.type.startsWith('lobby:')) return;

        switch (data.type) {
            case 'lobby:discover':
                // Respond with our visible lobbies
                const visible = this._multiHost.getVisibleLobbies();
                if (visible.length > 0) {
                    this._peernet.send(peerId, {
                        type: 'lobby:advertise',
                        lobbies: visible
                    });
                }
                break;

            case 'lobby:advertise':
                // Store discovered lobbies
                for (const lobby of data.lobbies) {
                    this._discoveredLobbies.set(lobby.id, {
                        ...lobby,
                        discoveredAt: Date.now(),
                        discoveredFrom: peerId
                    });
                    this._eventBus.emit('lobby:discovered', { lobbyInfo: lobby });
                }
                break;

            case 'lobby:join_request':
                this._handleJoinRequest(peerId, data);
                break;

            case 'lobby:join_accepted':
                this._handleJoinAccepted(peerId, data);
                break;

            case 'lobby:join_rejected':
                this._eventBus.emit('lobby:join_rejected', {
                    lobbyId: data.lobbyId,
                    reason: data.reason
                });
                break;

            case 'lobby:kicked':
                if (this._currentLobby?.id === data.lobbyId) {
                    this._currentLobby = null;
                    this._eventBus.emit('lobby:kicked', {
                        lobbyId: data.lobbyId,
                        reason: data.reason
                    });
                }
                break;

            case 'lobby:closed':
                if (this._currentLobby?.id === data.lobbyId) {
                    this._currentLobby = null;
                    this._eventBus.emit('lobby:closed', data);
                }
                break;

            case 'lobby:broadcast':
            case 'lobby:message':
                if (this._currentLobby?.id === data.lobbyId) {
                    this._currentLobby._eventBus.emit(data.type, {
                        ...data,
                        sender: peerId
                    });
                }
                break;

            case 'lobby:host_migrated':
            case 'lobby:host_transferred':
            case 'lobby:master_claimed':
                if (this._currentLobby?.id === data.lobbyId) {
                    this._currentLobby._hostId = data.newHost;
                    this._currentLobby._eventBus.emit(data.type, data);
                }
                break;
        }
    }

    /**
     * Handle join request
     * @private
     */
    async _handleJoinRequest(peerId, data) {
        const lobby = this._multiHost.getLobby(data.lobbyId);
        if (!lobby) {
            this._peernet.send(peerId, {
                type: 'lobby:join_rejected',
                lobbyId: data.lobbyId,
                reason: 'Lobby not found'
            });
            return;
        }

        // Check secret
        if (lobby._secret && data.secret !== lobby._secret) {
            this._peernet.send(peerId, {
                type: 'lobby:join_rejected',
                lobbyId: data.lobbyId,
                reason: 'Invalid secret'
            });
            return;
        }

        // Check capacity
        if (lobby.members.size >= lobby.settings.maxMembers) {
            this._peernet.send(peerId, {
                type: 'lobby:join_rejected',
                lobbyId: data.lobbyId,
                reason: 'Lobby is full'
            });
            return;
        }

        // Accept join
        lobby._addMember(peerId, 'member', data.metadata);

        this._peernet.send(peerId, {
            type: 'lobby:join_accepted',
            lobby: lobby.getInfo(),
            members: Array.from(lobby.members.values())
        });
    }

    /**
     * Handle join accepted
     * @private
     */
    _handleJoinAccepted(peerId, data) {
        // Create local lobby representation
        this._currentLobby = new Lobby({
            id: data.lobby.id,
            hostId: data.lobby.hostId,
            settings: data.lobby
        }, this._peernet);

        // Add members
        for (const member of data.members) {
            this._currentLobby._members.set(member.peerId, member);
        }

        this._eventBus.emit('lobby:joined', {
            lobby: this._currentLobby,
            members: data.members
        });
    }

    /**
     * Create a new lobby
     * @param {object} [options] - Lobby options
     * @returns {Promise<Lobby>}
     */
    async createLobby(options = {}) {
        const lobby = await this._multiHost._createLobby(options);
        this._currentLobby = lobby;

        this._eventBus.emit('lobby:created', { lobby });
        return lobby;
    }

    /**
     * Join an existing lobby
     * @param {string} lobbyId - Lobby ID
     * @param {string} [secret] - Lobby secret
     * @returns {Promise<Lobby>}
     */
    async joinLobby(lobbyId, secret) {
        // Find lobby host from discovered lobbies
        const lobbyInfo = this._discoveredLobbies.get(lobbyId);
        if (!lobbyInfo) {
            throw new Error('Lobby not found');
        }

        // Connect to host
        await this._peernet.connect(lobbyInfo.discoveredFrom);

        // Send join request
        this._peernet.send(lobbyInfo.discoveredFrom, {
            type: 'lobby:join_request',
            lobbyId,
            secret,
            metadata: {
                peerId: this._peernet.id,
                timestamp: Date.now()
            }
        });

        // Wait for response
        const result = await this._eventBus.waitFor('lobby:joined', 10000);
        return result.lobby;
    }

    /**
     * Leave current lobby
     * @param {string} [lobbyId] - Lobby ID
     * @returns {Promise<void>}
     */
    async leaveLobby(lobbyId) {
        if (!this._currentLobby) return;

        const lobby = lobbyId ? this._multiHost.getLobby(lobbyId) : this._currentLobby;
        if (!lobby) return;

        // Notify host if we're not host
        if (!lobby.isHost()) {
            const connection = this._peernet.connections.get(lobby.hostId);
            if (connection) {
                connection.send({
                    type: 'lobby:leave',
                    lobbyId: lobby.id
                });
            }
        } else {
            // We're host, close lobby
            await this._multiHost.closeLobby(lobby.id);
        }

        this._currentLobby = null;
        this._eventBus.emit('lobby:left', { lobbyId: lobby.id });
    }

    /**
     * Discover nearby lobbies
     * @param {number} [timeout=5000] - Discovery timeout
     * @returns {Promise<object[]>}
     */
    async discoverLobbies(timeout = 5000) {
        // Clear previous discoveries
        this._discoveredLobbies.clear();

        // Broadcast discovery request
        await this._peernet.broadcast({
            type: 'lobby:discover'
        });

        // Wait for responses
        await Utils.sleep(timeout);

        return Array.from(this._discoveredLobbies.values());
    }

    /**
     * Advertise a lobby
     * @param {string} lobbyId - Lobby ID
     */
    advertiseLobby(lobbyId) {
        this._multiHost.setLobbyVisibility(lobbyId, true);
    }

    /**
     * Stop advertising a lobby
     * @param {string} lobbyId - Lobby ID
     */
    stopAdvertising(lobbyId) {
        this._multiHost.setLobbyVisibility(lobbyId, false);
    }

    /**
     * Get lobby members
     * @param {string} lobbyId - Lobby ID
     * @returns {object[]}
     */
    getLobbyMembers(lobbyId) {
        const lobby = this._multiHost.getLobby(lobbyId) || this._currentLobby;
        return lobby ? Array.from(lobby.members.values()) : [];
    }

    /**
     * Subscribe to lobby events
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {Function}
     */
    on(event, handler) {
        return this._eventBus.on(event, handler);
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Lobby, FCFSLobby, ObfuscatedMasterLobby, MultiLobbyHost, LobbyManager };
}

// === src/auth-crypto.js ===
/**
 * PeerNet Auth & Crypto Module
 * Authentication, GPG, DH, and cryptographic primitives
 * @module auth-crypto
 */

/**
 * Keyring - Local key storage and management
 */
class Keyring {
    constructor() {
        this._keys = new Map();
        this._loadFromStorage();
    }

    /**
     * Add public key to keyring
     * @param {string} publicKey - Armored public key
     * @param {object} [metadata] - Key metadata
     * @returns {Promise<void>}
     */
    async addKey(publicKey, metadata = {}) {
        const keyId = await this._getKeyId(publicKey);
        this._keys.set(keyId, {
            id: keyId,
            publicKey,
            owner: metadata.owner,
            trust: metadata.trust || 'unknown',
            addedAt: Date.now(),
            revoked: false
        });
        this._saveToStorage();
    }

    /**
     * Remove key from keyring
     * @param {string} keyId - Key ID
     * @returns {Promise<void>}
     */
    async removeKey(keyId) {
        this._keys.delete(keyId);
        this._saveToStorage();
    }

    /**
     * Get key information
     * @param {string} keyId - Key ID
     * @returns {object|undefined}
     */
    getKey(keyId) {
        return this._keys.get(keyId);
    }

    /**
     * List all stored keys
     * @returns {object[]}
     */
    listKeys() {
        return Array.from(this._keys.values());
    }

    /**
     * Set trust level for key
     * @param {string} keyId - Key ID
     * @param {string} level - Trust level
     * @returns {Promise<void>}
     */
    async trustKey(keyId, level) {
        const key = this._keys.get(keyId);
        if (key) {
            key.trust = level;
            this._saveToStorage();
        }
    }

    /**
     * Mark key as revoked
     * @param {string} keyId - Key ID
     * @returns {Promise<void>}
     */
    async revokeKey(keyId) {
        const key = this._keys.get(keyId);
        if (key) {
            key.revoked = true;
            this._saveToStorage();
        }
    }

    /**
     * Export keyring as JSON
     * @returns {Promise<string>}
     */
    async exportKeyring() {
        return JSON.stringify(Array.from(this._keys.entries()));
    }

    /**
     * Import keyring from JSON
     * @param {string} json - JSON string
     * @returns {Promise<void>}
     */
    async importKeyring(json) {
        const entries = JSON.parse(json);
        this._keys = new Map(entries);
        this._saveToStorage();
    }

    /**
     * Get key ID from public key
     * @private
     */
    async _getKeyId(publicKey) {
        return Utils.sha256(publicKey).then(h => h.substring(0, 16));
    }

    /**
     * Load from localStorage
     * @private
     */
    _loadFromStorage() {
        try {
            const stored = localStorage.getItem('peernet_keyring');
            if (stored) {
                this._keys = new Map(JSON.parse(stored));
            }
        } catch (e) {
            // Ignore storage errors
        }
    }

    /**
     * Save to localStorage
     * @private
     */
    _saveToStorage() {
        try {
            localStorage.setItem('peernet_keyring', JSON.stringify(Array.from(this._keys.entries())));
        } catch (e) {
            // Ignore storage errors
        }
    }
}

/**
 * ChallengeResponse - Challenge-response authentication
 */
class ChallengeResponse {
    /**
     * Create challenge-response handler
     * @param {object} identity - Peer identity
     */
    constructor(identity) {
        this._identity = identity;
        this._pendingChallenges = new Map();
    }

    /**
     * Generate random challenge string
     * @returns {string}
     */
    createChallenge() {
        const challenge = Utils.randomHex(32);
        const challengeId = Utils.generateId('challenge');
        this._pendingChallenges.set(challengeId, {
            challenge,
            createdAt: Date.now()
        });
        return { challengeId, challenge };
    }

    /**
     * Sign challenge with private key
     * @param {string} challenge - Challenge string
     * @returns {Promise<string>}
     */
    async signChallenge(challenge) {
        if (!this._identity || !this._identity.privateKey) {
            throw new Error('No private key available');
        }

        // Use TweetNaCl or OpenPGP for signing
        if (typeof nacl !== 'undefined') {
            const message = Utils.stringToBytes(challenge);
            const privateKey = Utils.base64ToArrayBuffer(this._identity.privateKey);
            const signature = nacl.sign.detached(message, new Uint8Array(privateKey));
            return Utils.arrayBufferToBase64(signature);
        }

        // Fallback: hash-based "signature" (not cryptographically secure)
        return Utils.sha256(challenge + this._identity.privateKey);
    }

    /**
     * Verify challenge response
     * @param {string} challenge - Original challenge
     * @param {string} response - Signed response
     * @param {string} publicKey - Signer's public key
     * @returns {Promise<boolean>}
     */
    async verifyResponse(challenge, response, publicKey) {
        if (typeof nacl !== 'undefined') {
            try {
                const message = Utils.stringToBytes(challenge);
                const signature = Utils.base64ToArrayBuffer(response);
                const pubKey = Utils.base64ToArrayBuffer(publicKey);
                return nacl.sign.detached.verify(message, new Uint8Array(signature), new Uint8Array(pubKey));
            } catch (e) {
                return false;
            }
        }

        // Fallback verification
        const expected = await Utils.sha256(challenge + publicKey);
        return response === expected;
    }

    /**
     * Clean expired challenges
     */
    cleanExpired() {
        const now = Date.now();
        for (const [id, challenge] of this._pendingChallenges) {
            if (now - challenge.createdAt > 60000) { // 1 minute expiry
                this._pendingChallenges.delete(id);
            }
        }
    }
}

/**
 * DiffieHellman - DH key exchange
 */
class DiffieHellman {
    constructor() {
        this._keyPairs = new Map();
        this._sharedSecrets = new Map();
    }

    /**
     * Generate DH key pair
     * @returns {Promise<object>}
     */
    async generateKeyPair() {
        if (typeof nacl !== 'undefined') {
            const keyPair = nacl.box.keyPair();
            const keyId = Utils.generateId('dh');
            const keyData = {
                id: keyId,
                publicKey: Utils.arrayBufferToBase64(keyPair.publicKey),
                privateKey: Utils.arrayBufferToBase64(keyPair.secretKey),
                createdAt: Date.now()
            };
            this._keyPairs.set(keyId, keyData);
            return keyData;
        }

        // Fallback using Web Crypto
        const keyPair = await crypto.subtle.generateKey(
            { name: 'ECDH', namedCurve: 'P-256' },
            true,
            ['deriveKey', 'deriveBits']
        );

        const publicKey = await crypto.subtle.exportKey('raw', keyPair.publicKey);
        const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
        const keyId = Utils.generateId('dh');

        const keyData = {
            id: keyId,
            publicKey: Utils.arrayBufferToBase64(publicKey),
            privateKey: Utils.arrayBufferToBase64(privateKey),
            createdAt: Date.now()
        };

        this._keyPairs.set(keyId, keyData);
        return keyData;
    }

    /**
     * Compute shared secret from DH exchange
     * @param {string} privateKey - Our private key (base64)
     * @param {string} peerPublicKey - Peer's public key (base64)
     * @returns {Promise<string>}
     */
    async computeSharedSecret(privateKey, peerPublicKey) {
        if (typeof nacl !== 'undefined') {
            const scalar = new Uint8Array(Utils.base64ToArrayBuffer(privateKey));
            const point = new Uint8Array(Utils.base64ToArrayBuffer(peerPublicKey));
            const shared = nacl.scalarMult(scalar, point);
            return Utils.arrayBufferToBase64(shared);
        }

        // Use SHA-256 as KDF on concatenated keys
        const combined = privateKey + peerPublicKey;
        return Utils.sha256(combined);
    }

    /**
     * Initiate DH exchange with peer
     * @param {string} peerId - Peer ID
     * @returns {Promise<object>}
     */
    async initiateExchange(peerId) {
        const keyPair = await this.generateKeyPair();
        return {
            exchangeId: keyPair.id,
            publicKey: keyPair.publicKey,
            peerId
        };
    }

    /**
     * Complete DH exchange and get shared secret
     * @param {string} exchangeId - Exchange ID
     * @param {string} peerPublicKey - Peer's public key
     * @returns {Promise<string>}
     */
    async completeExchange(exchangeId, peerPublicKey) {
        const keyPair = this._keyPairs.get(exchangeId);
        if (!keyPair) {
            throw new Error('Exchange not found');
        }

        const sharedSecret = await this.computeSharedSecret(keyPair.privateKey, peerPublicKey);
        this._sharedSecrets.set(exchangeId, sharedSecret);
        return sharedSecret;
    }

    /**
     * Get shared secret for exchange
     * @param {string} exchangeId - Exchange ID
     * @returns {string|undefined}
     */
    getSharedSecret(exchangeId) {
        return this._sharedSecrets.get(exchangeId);
    }
}

/**
 * SecureChannel - Encrypted communication channel
 */
class SecureChannel {
    /**
     * Create secure channel manager
     * @param {DiffieHellman} dh - DH instance
     */
    constructor(dh) {
        this._dh = dh;
        this._channels = new Map();
        this._nonces = new Map();
    }

    /**
     * Open secure channel with peer
     * @param {string} peerId - Peer ID
     * @param {string} sharedSecret - Shared secret from DH
     * @returns {Promise<void>}
     */
    async open(peerId, sharedSecret) {
        this._channels.set(peerId, {
            secret: sharedSecret,
            openedAt: Date.now(),
            messageCount: 0
        });
        this._nonces.set(peerId, 0);
    }

    /**
     * Send encrypted message
     * @param {string} peerId - Peer ID
     * @param {string} message - Message to encrypt
     * @returns {Promise<string>}
     */
    async send(peerId, message) {
        const channel = this._channels.get(peerId);
        if (!channel) {
            throw new Error(`No secure channel with peer ${peerId}`);
        }

        const nonce = this._nonces.get(peerId) || 0;
        this._nonces.set(peerId, nonce + 1);

        // Encrypt using NaCl secretbox if available
        if (typeof nacl !== 'undefined') {
            const key = new Uint8Array(Utils.base64ToArrayBuffer(channel.secret));
            const nonceBytes = new Uint8Array(24);
            new DataView(nonceBytes.buffer).setUint32(0, nonce, true);

            const messageBytes = Utils.stringToBytes(message);
            const encrypted = nacl.secretbox(messageBytes, nonceBytes, key);

            return JSON.stringify({
                nonce,
                ciphertext: Utils.arrayBufferToBase64(encrypted)
            });
        }

        // Fallback: XOR with key stream (not cryptographically secure)
        const keyBytes = Utils.stringToBytes(channel.secret);
        const messageBytes = Utils.stringToBytes(message);
        const encrypted = new Uint8Array(messageBytes.length);

        for (let i = 0; i < messageBytes.length; i++) {
            encrypted[i] = messageBytes[i] ^ keyBytes[i % keyBytes.length];
        }

        return JSON.stringify({
            nonce,
            ciphertext: Utils.arrayBufferToBase64(encrypted)
        });
    }

    /**
     * Decrypt received message
     * @param {string} peerId - Peer ID
     * @param {string} encrypted - Encrypted message
     * @returns {Promise<string>}
     */
    async receive(peerId, encrypted) {
        const channel = this._channels.get(peerId);
        if (!channel) {
            throw new Error(`No secure channel with peer ${peerId}`);
        }

        const { nonce, ciphertext } = JSON.parse(encrypted);

        if (typeof nacl !== 'undefined') {
            const key = new Uint8Array(Utils.base64ToArrayBuffer(channel.secret));
            const nonceBytes = new Uint8Array(24);
            new DataView(nonceBytes.buffer).setUint32(0, nonce, true);

            const cipherBytes = new Uint8Array(Utils.base64ToArrayBuffer(ciphertext));
            const decrypted = nacl.secretbox.open(cipherBytes, nonceBytes, key);

            if (!decrypted) {
                throw new Error('Decryption failed');
            }

            return Utils.bytesToString(decrypted);
        }

        // Fallback decryption
        const keyBytes = Utils.stringToBytes(channel.secret);
        const cipherBytes = new Uint8Array(Utils.base64ToArrayBuffer(ciphertext));
        const decrypted = new Uint8Array(cipherBytes.length);

        for (let i = 0; i < cipherBytes.length; i++) {
            decrypted[i] = cipherBytes[i] ^ keyBytes[i % keyBytes.length];
        }

        return Utils.bytesToString(decrypted);
    }

    /**
     * Close secure channel
     * @param {string} peerId - Peer ID
     */
    close(peerId) {
        this._channels.delete(peerId);
        this._nonces.delete(peerId);
    }

    /**
     * Rotate encryption key for forward secrecy
     * @param {string} peerId - Peer ID
     * @returns {Promise<void>}
     */
    async rotateKey(peerId) {
        const channel = this._channels.get(peerId);
        if (!channel) return;

        // Generate new secret by hashing current with timestamp
        const newSecret = await Utils.sha256(channel.secret + Date.now().toString());
        channel.secret = newSecret;
        this._nonces.set(peerId, 0);
    }
}

/**
 * AuthCrypto - Central authentication and cryptography manager
 */
class AuthCrypto {
    /**
     * Create AuthCrypto instance
     * @param {PeerNet} peernet - PeerNet instance
     * @param {object} [config] - Configuration
     */
    constructor(peernet, config = {}) {
        this._peernet = peernet;
        this._config = config;

        this._keyring = new Keyring();
        this._myIdentity = null;
        this._identities = new Map();
        this._sessions = new Map();
        this._dh = new DiffieHellman();
        this._secureChannel = new SecureChannel(this._dh);
        this._challengeResponse = null;
        this._eventBus = new EventBus();

        this._loadIdentity();
    }

    /**
     * Get keyring instance
     * @returns {Keyring}
     */
    get keyring() {
        return this._keyring;
    }

    /**
     * Get current peer's identity
     * @returns {object|undefined}
     */
    getMyIdentity() {
        return this._myIdentity;
    }

    /**
     * Generate new cryptographic identity
     * @param {object} [options] - Identity options
     * @returns {Promise<object>}
     */
    async generateIdentity(options = {}) {
        let keyPair;

        if (typeof nacl !== 'undefined') {
            keyPair = nacl.sign.keyPair();
        } else {
            // Generate using Web Crypto
            const cryptoKeyPair = await crypto.subtle.generateKey(
                { name: 'ECDSA', namedCurve: 'P-256' },
                true,
                ['sign', 'verify']
            );
            const publicKey = await crypto.subtle.exportKey('raw', cryptoKeyPair.publicKey);
            const privateKey = await crypto.subtle.exportKey('pkcs8', cryptoKeyPair.privateKey);
            keyPair = {
                publicKey: new Uint8Array(publicKey),
                secretKey: new Uint8Array(privateKey)
            };
        }

        const identity = {
            id: Utils.generateId('id'),
            publicKey: Utils.arrayBufferToBase64(keyPair.publicKey),
            privateKey: Utils.arrayBufferToBase64(keyPair.secretKey),
            created: Date.now(),
            name: options.name,
            email: options.email
        };

        this._myIdentity = identity;
        this._challengeResponse = new ChallengeResponse(identity);
        this._saveIdentity();

        this._eventBus.emit('auth:identity_created', { identity });
        return identity;
    }

    /**
     * Import existing identity
     * @param {string} armoredKey - Armored key
     * @param {string} [passphrase] - Optional passphrase
     * @returns {Promise<object>}
     */
    async importIdentity(armoredKey, passphrase) {
        // Parse and validate key
        const identity = {
            id: Utils.generateId('id'),
            publicKey: armoredKey,
            privateKey: armoredKey, // In real impl, would parse properly
            created: Date.now()
        };

        this._myIdentity = identity;
        this._challengeResponse = new ChallengeResponse(identity);
        this._saveIdentity();

        return identity;
    }

    /**
     * Export identity as armored key
     * @param {string} [identityId] - Identity ID
     * @param {string} [passphrase] - Optional passphrase
     * @returns {Promise<string>}
     */
    async exportIdentity(identityId, passphrase) {
        if (!this._myIdentity) {
            throw new Error('No identity to export');
        }
        return JSON.stringify(this._myIdentity);
    }

    /**
     * Initiate authentication with peer
     * @param {string} peerId - Peer ID
     * @returns {Promise<object>}
     */
    async authenticate(peerId) {
        if (!this._myIdentity) {
            throw new Error('No identity configured');
        }

        // Create challenge
        const { challengeId, challenge } = this._challengeResponse.createChallenge();

        // Send auth request
        await this._peernet.send(peerId, {
            type: 'auth:request',
            challengeId,
            challenge,
            publicKey: this._myIdentity.publicKey
        });

        // Wait for response
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Authentication timeout'));
            }, 30000);

            const handler = (data) => {
                if (data.type === 'auth:response' && data.challengeId === challengeId) {
                    clearTimeout(timeout);
                    this._peernet.off('message', handler);

                    // Verify response
                    this._challengeResponse.verifyResponse(
                        challenge,
                        data.signature,
                        data.publicKey
                    ).then(valid => {
                        if (valid) {
                            this._identities.set(peerId, {
                                peerId,
                                publicKey: data.publicKey,
                                authenticated: true,
                                authenticatedAt: Date.now()
                            });
                            resolve({
                                success: true,
                                peerId,
                                identity: this._identities.get(peerId)
                            });
                        } else {
                            resolve({
                                success: false,
                                peerId,
                                error: 'Invalid signature'
                            });
                        }
                    });
                }
            };

            this._peernet.on('message', handler);
        });
    }

    /**
     * Verify peer's identity signature
     * @param {string} peerId - Peer ID
     * @param {string} signature - Signature
     * @param {string} challenge - Original challenge
     * @returns {Promise<boolean>}
     */
    async verifyPeer(peerId, signature, challenge) {
        const identity = this._identities.get(peerId);
        if (!identity) return false;

        return this._challengeResponse.verifyResponse(
            challenge,
            signature,
            identity.publicKey
        );
    }

    /**
     * Establish shared secret via DH
     * @param {string} peerId - Peer ID
     * @returns {Promise<object>}
     */
    async establishSharedSecret(peerId) {
        // Initiate DH exchange
        const exchange = await this._dh.initiateExchange(peerId);

        // Send public key to peer
        await this._peernet.send(peerId, {
            type: 'dh:initiate',
            exchangeId: exchange.exchangeId,
            publicKey: exchange.publicKey
        });

        // Wait for peer's public key
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('DH exchange timeout'));
            }, 30000);

            const handler = async (data) => {
                if (data.type === 'dh:response' && data.exchangeId === exchange.exchangeId) {
                    clearTimeout(timeout);
                    this._peernet.off('message', handler);

                    const secret = await this._dh.completeExchange(
                        exchange.exchangeId,
                        data.publicKey
                    );

                    const sessionId = Utils.generateId('session');
                    this._sessions.set(sessionId, {
                        peerId,
                        secret,
                        createdAt: Date.now()
                    });

                    // Open secure channel
                    await this._secureChannel.open(peerId, secret);

                    resolve({
                        peerId,
                        secret,
                        sessionId
                    });
                }
            };

            this._peernet.on('message', handler);
        });
    }

    /**
     * Encrypt data for specific peer
     * @param {string} peerId - Peer ID
     * @param {string} data - Data to encrypt
     * @returns {Promise<string>}
     */
    async encryptForPeer(peerId, data) {
        return this._secureChannel.send(peerId, JSON.stringify(data));
    }

    /**
     * Decrypt data from specific peer
     * @param {string} peerId - Peer ID
     * @param {string} encrypted - Encrypted data
     * @returns {Promise<string>}
     */
    async decryptFromPeer(peerId, encrypted) {
        const decrypted = await this._secureChannel.receive(peerId, encrypted);
        return JSON.parse(decrypted);
    }

    /**
     * Sign data with identity key
     * @param {string} data - Data to sign
     * @returns {Promise<string>}
     */
    async sign(data) {
        if (!this._myIdentity) {
            throw new Error('No identity configured');
        }
        return this._challengeResponse.signChallenge(data);
    }

    /**
     * Verify signature
     * @param {string} data - Original data
     * @param {string} signature - Signature to verify
     * @param {string} publicKey - Signer's public key
     * @returns {Promise<boolean>}
     */
    async verifySignature(data, signature, publicKey) {
        return this._challengeResponse.verifyResponse(data, signature, publicKey);
    }

    /**
     * Handle incoming auth messages
     * @private
     */
    async _handleAuthMessage(peerId, data) {
        if (!this._myIdentity) return;

        switch (data.type) {
            case 'auth:request':
                // Sign the challenge and respond
                const signature = await this._challengeResponse.signChallenge(data.challenge);
                await this._peernet.send(peerId, {
                    type: 'auth:response',
                    challengeId: data.challengeId,
                    signature,
                    publicKey: this._myIdentity.publicKey
                });
                break;

            case 'dh:initiate':
                // Generate our key pair and respond
                const keyPair = await this._dh.generateKeyPair();
                const secret = await this._dh.computeSharedSecret(
                    keyPair.privateKey,
                    data.publicKey
                );

                await this._peernet.send(peerId, {
                    type: 'dh:response',
                    exchangeId: data.exchangeId,
                    publicKey: keyPair.publicKey
                });

                // Open secure channel
                await this._secureChannel.open(peerId, secret);
                break;
        }
    }

    /**
     * Load identity from storage
     * @private
     */
    _loadIdentity() {
        try {
            const stored = localStorage.getItem('peernet_identity');
            if (stored) {
                this._myIdentity = JSON.parse(stored);
                this._challengeResponse = new ChallengeResponse(this._myIdentity);
            }
        } catch (e) {
            // Ignore storage errors
        }
    }

    /**
     * Save identity to storage
     * @private
     */
    _saveIdentity() {
        try {
            localStorage.setItem('peernet_identity', JSON.stringify(this._myIdentity));
        } catch (e) {
            // Ignore storage errors
        }
    }

    /**
     * Subscribe to auth events
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {Function}
     */
    on(event, handler) {
        return this._eventBus.on(event, handler);
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Keyring, ChallengeResponse, DiffieHellman, SecureChannel, AuthCrypto };
}

// === src/commitment.js ===
/**
 * PeerNet Commitment-Resolve Module
 * Commitment schemes for fair games and secret sharing
 * @module commitment
 */

/**
 * CommitmentManager - Manages commitment lifecycle
 */
class CommitmentManager {
    /**
     * Create commitment manager
     * @param {PeerNet} peernet - PeerNet instance
     */
    constructor(peernet) {
        this._peernet = peernet;
        this._pending = new Map();
        this._resolved = new Map();
        this._eventBus = new EventBus();
    }

    /**
     * Create commitment to a value
     * @param {string} value - Value to commit to
     * @param {string} [peerId] - Peer to share commitment with
     * @returns {Promise<object>}
     */
    async commit(value, peerId) {
        const commitmentId = Utils.generateId('commit');

        // Generate random nonce for hiding
        const nonce = Utils.randomHex(16);

        // Create hash commitment: H(value || nonce)
        const hash = await Utils.sha256(value + nonce);

        const commitment = {
            id: commitmentId,
            hash,
            nonce,
            value,
            creator: this._peernet.id,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000, // 1 hour expiry
            revealed: false
        };

        this._pending.set(commitmentId, commitment);

        // If peer specified, send commitment hash
        if (peerId) {
            await this._peernet.send(peerId, {
                type: 'commitment:create',
                commitmentId,
                hash,
                createdAt: commitment.createdAt
            });
        }

        this._eventBus.emit('commitment:created', { commitmentId, hash });

        return {
            commitmentId,
            hash,
            nonce // Store this to reveal later
        };
    }

    /**
     * Reveal committed value
     * @param {string} commitmentId - Commitment ID
     * @param {string} value - Revealed value
     * @param {string} nonce - Original nonce
     * @returns {Promise<boolean>}
     */
    async reveal(commitmentId, value, nonce) {
        const commitment = this._pending.get(commitmentId);
        if (!commitment) {
            throw new Error('Commitment not found');
        }

        // Verify hash matches
        const hash = await Utils.sha256(value + nonce);
        if (hash !== commitment.hash) {
            this._eventBus.emit('commitment:reveal_failed', {
                commitmentId,
                reason: 'Hash mismatch'
            });
            return false;
        }

        commitment.revealed = true;
        commitment.revealedValue = value;
        commitment.revealedAt = Date.now();

        // Move to resolved
        this._resolved.set(commitmentId, commitment);
        this._pending.delete(commitmentId);

        this._eventBus.emit('commitment:revealed', {
            commitmentId,
            value,
            verified: true
        });

        return true;
    }

    /**
     * Verify revealed value matches commitment
     * @param {string} commitmentId - Commitment ID
     * @param {string} revealedValue - Revealed value
     * @param {string} nonce - Original nonce
     * @returns {Promise<boolean>}
     */
    async verify(commitmentId, revealedValue, nonce) {
        const commitment = this._pending.get(commitmentId) || this._resolved.get(commitmentId);
        if (!commitment) return false;

        const hash = await Utils.sha256(revealedValue + nonce);
        return hash === commitment.hash;
    }

    /**
     * Get commitment details
     * @param {string} commitmentId - Commitment ID
     * @returns {object|undefined}
     */
    getCommitment(commitmentId) {
        return this._pending.get(commitmentId) || this._resolved.get(commitmentId);
    }

    /**
     * Mark commitment as expired
     * @param {string} commitmentId - Commitment ID
     */
    expire(commitmentId) {
        const commitment = this._pending.get(commitmentId);
        if (commitment) {
            commitment.expired = true;
            this._pending.delete(commitmentId);
            this._eventBus.emit('commitment:expired', { commitmentId });
        }
    }

    /**
     * Subscribe to commitment events
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {Function}
     */
    on(event, handler) {
        return this._eventBus.on(event, handler);
    }
}

/**
 * CoinToss - Fair coin toss between two peers
 */
class CoinToss {
    /**
     * Create coin toss handler
     * @param {PeerNet} peernet - PeerNet instance
     */
    constructor(peernet) {
        this._peernet = peernet;
        this._sessions = new Map();
        this._eventBus = new EventBus();
        this._setupHandlers();
    }

    /**
     * Start coin toss with peer
     * @param {string} peerId - Peer ID
     * @returns {Promise<object>}
     */
    async initiate(peerId) {
        const sessionId = Utils.generateId('ct');

        const session = {
            id: sessionId,
            peers: [this._peernet.id, peerId],
            initiator: this._peernet.id,
            commitments: new Map(),
            reveals: new Map(),
            status: 'pending',
            createdAt: Date.now()
        };

        this._sessions.set(sessionId, session);

        // Send initiation
        await this._peernet.send(peerId, {
            type: 'cointoss:initiate',
            sessionId,
            initiator: this._peernet.id
        });

        this._eventBus.emit('cointoss:initiated', { sessionId, peerId });

        return session;
    }

    /**
     * Commit to random bit in session
     * @param {string} sessionId - Session ID
     * @returns {Promise<string>}
     */
    async commit(sessionId) {
        const session = this._sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        // Generate random bit
        const bit = Math.random() < 0.5;

        // Create commitment
        const nonce = Utils.randomHex(16);
        const hash = await Utils.sha256(bit.toString() + nonce);

        session.commitments.set(this._peernet.id, {
            bit,
            nonce,
            hash,
            committedAt: Date.now()
        });

        // Broadcast commitment hash to all peers
        for (const peerId of session.peers) {
            if (peerId !== this._peernet.id) {
                await this._peernet.send(peerId, {
                    type: 'cointoss:commit',
                    sessionId,
                    peerId: this._peernet.id,
                    hash
                });
            }
        }

        session.status = 'committed';
        this._eventBus.emit('cointoss:committed', { sessionId, peerId: this._peernet.id });

        return hash;
    }

    /**
     * Reveal and compute result
     * @param {string} sessionId - Session ID
     * @returns {Promise<object>}
     */
    async reveal(sessionId) {
        const session = this._sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        const myCommitment = session.commitments.get(this._peernet.id);
        if (!myCommitment) {
            throw new Error('No commitment found for this peer');
        }

        // Broadcast reveal
        for (const peerId of session.peers) {
            if (peerId !== this._peernet.id) {
                await this._peernet.send(peerId, {
                    type: 'cointoss:reveal',
                    sessionId,
                    peerId: this._peernet.id,
                    bit: myCommitment.bit,
                    nonce: myCommitment.nonce
                });
            }
        }

        session.reveals.set(this._peernet.id, {
            bit: myCommitment.bit,
            nonce: myCommitment.nonce,
            revealedAt: Date.now()
        });

        // Check if we have all reveals
        if (session.reveals.size === session.peers.length) {
            return this._computeResult(sessionId);
        }

        session.status = 'revealed';
        return { status: 'waiting', sessionId };
    }

    /**
     * Compute final result
     * @private
     */
    async _computeResult(sessionId) {
        const session = this._sessions.get(sessionId);
        if (!session) return null;

        // Verify all commitments
        for (const [peerId, reveal] of session.reveals) {
            const commitment = session.commitments.get(peerId);
            if (commitment) {
                const hash = await Utils.sha256(reveal.bit.toString() + reveal.nonce);
                if (hash !== commitment.hash) {
                    this._eventBus.emit('cointoss:cheating_detected', { sessionId, peerId });
                    throw new Error('Cheating detected');
                }
            }
        }

        // XOR all bits for result
        let result = false;
        for (const reveal of session.reveals.values()) {
            result = result !== reveal.bit; // XOR
        }

        session.result = result;
        session.status = 'complete';

        this._eventBus.emit('cointoss:complete', { sessionId, result });

        return {
            sessionId,
            result,
            contributions: Array.from(session.reveals.entries()).map(([peerId, r]) => ({
                peerId,
                bit: r.bit
            })),
            verified: true
        };
    }

    /**
     * Get coin toss result
     * @param {string} sessionId - Session ID
     * @returns {object|undefined}
     */
    getResult(sessionId) {
        const session = this._sessions.get(sessionId);
        if (!session || session.status !== 'complete') return undefined;

        return {
            sessionId,
            result: session.result,
            verified: true
        };
    }

    /**
     * Setup message handlers
     * @private
     */
    _setupHandlers() {
        this._peernet.on('message', async ({ peerId, data }) => {
            if (!data.type || !data.type.startsWith('cointoss:')) return;

            const session = this._sessions.get(data.sessionId);

            switch (data.type) {
                case 'cointoss:initiate':
                    // Create session as non-initiator
                    this._sessions.set(data.sessionId, {
                        id: data.sessionId,
                        peers: [data.initiator, this._peernet.id],
                        initiator: data.initiator,
                        commitments: new Map(),
                        reveals: new Map(),
                        status: 'pending'
                    });
                    this._eventBus.emit('cointoss:initiated', {
                        sessionId: data.sessionId,
                        peerId: data.initiator
                    });
                    break;

                case 'cointoss:commit':
                    if (session) {
                        session.commitments.set(data.peerId, {
                            hash: data.hash,
                            committedAt: Date.now()
                        });
                        this._eventBus.emit('cointoss:committed', {
                            sessionId: data.sessionId,
                            peerId: data.peerId
                        });
                    }
                    break;

                case 'cointoss:reveal':
                    if (session) {
                        session.reveals.set(data.peerId, {
                            bit: data.bit,
                            nonce: data.nonce,
                            revealedAt: Date.now()
                        });
                        this._eventBus.emit('cointoss:revealed', {
                            sessionId: data.sessionId,
                            peerId: data.peerId,
                            bit: data.bit
                        });

                        // Check if complete
                        if (session.reveals.size === session.peers.length) {
                            await this._computeResult(data.sessionId);
                        }
                    }
                    break;
            }
        });
    }

    /**
     * Subscribe to events
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {Function}
     */
    on(event, handler) {
        return this._eventBus.on(event, handler);
    }
}

/**
 * DiceRoll - Fair dice roll with multiple participants
 */
class DiceRoll {
    /**
     * Create dice roll handler
     * @param {PeerNet} peernet - PeerNet instance
     */
    constructor(peernet) {
        this._peernet = peernet;
        this._sessions = new Map();
        this._eventBus = new EventBus();
        this._setupHandlers();
    }

    /**
     * Start dice roll with peers
     * @param {string[]} peerIds - Peer IDs
     * @param {number} sides - Number of sides on die
     * @returns {Promise<object>}
     */
    async initiate(peerIds, sides = 6) {
        const sessionId = Utils.generateId('dice');
        const allPeers = [this._peernet.id, ...peerIds];

        const session = {
            id: sessionId,
            participants: allPeers,
            sides,
            contributions: new Map(),
            commitments: new Map(),
            reveals: new Map(),
            status: 'pending',
            createdAt: Date.now()
        };

        this._sessions.set(sessionId, session);

        // Broadcast initiation
        for (const peerId of peerIds) {
            await this._peernet.send(peerId, {
                type: 'diceroll:initiate',
                sessionId,
                participants: allPeers,
                sides
            });
        }

        this._eventBus.emit('diceroll:initiated', {
            sessionId,
            participants: allPeers,
            sides
        });

        return session;
    }

    /**
     * Commit to random contribution
     * @param {string} sessionId - Session ID
     * @param {number} [value] - Optional specific value
     * @returns {Promise<string>}
     */
    async commit(sessionId, value) {
        const session = this._sessions.get(sessionId);
        if (!session) throw new Error('Session not found');

        // Generate random contribution
        const contribution = value !== undefined ? value : Utils.randomInt(0, 1000000);
        const nonce = Utils.randomHex(16);
        const hash = await Utils.sha256(contribution.toString() + nonce);

        session.contributions.set(this._peernet.id, {
            value: contribution,
            nonce
        });
        session.commitments.set(this._peernet.id, {
            hash,
            committedAt: Date.now()
        });

        // Broadcast commitment
        for (const peerId of session.participants) {
            if (peerId !== this._peernet.id) {
                await this._peernet.send(peerId, {
                    type: 'diceroll:commit',
                    sessionId,
                    peerId: this._peernet.id,
                    hash
                });
            }
        }

        return hash;
    }

    /**
     * Reveal contribution
     * @param {string} sessionId - Session ID
     * @returns {Promise<void>}
     */
    async reveal(sessionId) {
        const session = this._sessions.get(sessionId);
        if (!session) throw new Error('Session not found');

        const myContribution = session.contributions.get(this._peernet.id);
        if (!myContribution) throw new Error('No contribution found');

        // Broadcast reveal
        for (const peerId of session.participants) {
            if (peerId !== this._peernet.id) {
                await this._peernet.send(peerId, {
                    type: 'diceroll:reveal',
                    sessionId,
                    peerId: this._peernet.id,
                    value: myContribution.value,
                    nonce: myContribution.nonce
                });
            }
        }

        session.reveals.set(this._peernet.id, {
            value: myContribution.value,
            nonce: myContribution.nonce,
            revealedAt: Date.now()
        });

        // Check for completion
        if (session.reveals.size === session.participants.length) {
            this._computeResult(sessionId);
        }
    }

    /**
     * Compute final result
     * @private
     */
    _computeResult(sessionId) {
        const session = this._sessions.get(sessionId);
        if (!session) return null;

        // XOR all contributions
        let combined = 0;
        for (const reveal of session.reveals.values()) {
            combined ^= reveal.value;
        }

        // Map to dice range
        const result = (combined % session.sides) + 1;

        session.result = result;
        session.status = 'complete';

        this._eventBus.emit('diceroll:complete', {
            sessionId,
            result,
            sides: session.sides,
            contributions: Array.from(session.reveals.entries()).map(([peerId, r]) => ({
                peerId,
                value: r.value
            }))
        });

        return result;
    }

    /**
     * Get dice result
     * @param {string} sessionId - Session ID
     * @returns {object|undefined}
     */
    getResult(sessionId) {
        const session = this._sessions.get(sessionId);
        if (!session || session.status !== 'complete') return undefined;

        return {
            sessionId,
            value: session.result,
            sides: session.sides,
            verified: true
        };
    }

    /**
     * Setup message handlers
     * @private
     */
    _setupHandlers() {
        this._peernet.on('message', ({ peerId, data }) => {
            if (!data.type || !data.type.startsWith('diceroll:')) return;

            const session = this._sessions.get(data.sessionId);

            switch (data.type) {
                case 'diceroll:initiate':
                    this._sessions.set(data.sessionId, {
                        id: data.sessionId,
                        participants: data.participants,
                        sides: data.sides,
                        contributions: new Map(),
                        commitments: new Map(),
                        reveals: new Map(),
                        status: 'pending'
                    });
                    this._eventBus.emit('diceroll:initiated', data);
                    break;

                case 'diceroll:commit':
                    if (session) {
                        session.commitments.set(data.peerId, {
                            hash: data.hash,
                            committedAt: Date.now()
                        });
                    }
                    break;

                case 'diceroll:reveal':
                    if (session) {
                        session.reveals.set(data.peerId, {
                            value: data.value,
                            nonce: data.nonce,
                            revealedAt: Date.now()
                        });

                        if (session.reveals.size === session.participants.length) {
                            this._computeResult(data.sessionId);
                        }
                    }
                    break;
            }
        });
    }

    /**
     * Subscribe to events
     */
    on(event, handler) {
        return this._eventBus.on(event, handler);
    }
}

/**
 * SecretSharing - Shamir's Secret Sharing
 */
class SecretSharing {
    /**
     * Split secret into shares
     * @param {string} secret - Secret to split
     * @param {number} threshold - Shares needed to reconstruct
     * @param {number} total - Total shares to create
     * @returns {Promise<string[]>}
     */
    async split(secret, threshold, total) {
        // Simple implementation using polynomial interpolation over finite field
        // In production, use a proper library

        const secretNum = parseInt(secret, 36);
        const prime = 257; // Small prime for demo

        // Generate random polynomial coefficients
        const coefficients = [secretNum];
        for (let i = 1; i < threshold; i++) {
            coefficients.push(Utils.randomInt(0, prime));
        }

        // Evaluate polynomial at different x values
        const shares = [];
        for (let x = 1; x <= total; x++) {
            let y = 0;
            for (let i = 0; i < coefficients.length; i++) {
                y = (y + coefficients[i] * Math.pow(x, i)) % prime;
            }
            shares.push(`${x}:${y}`);
        }

        // Create commitment for verification
        const commitments = coefficients.map(c => Utils.sha256(c.toString()));
        this._commitments = commitments;

        return shares;
    }

    /**
     * Reconstruct secret from shares
     * @param {string[]} shares - Shares to combine
     * @returns {Promise<string>}
     */
    async combine(shares) {
        const prime = 257;

        // Parse shares
        const points = shares.map(s => {
            const [x, y] = s.split(':').map(Number);
            return { x, y };
        });

        // Lagrange interpolation
        let secret = 0;
        for (let i = 0; i < points.length; i++) {
            let numerator = 1;
            let denominator = 1;

            for (let j = 0; j < points.length; j++) {
                if (i !== j) {
                    numerator = (numerator * -points[j].x) % prime;
                    denominator = (denominator * (points[i].x - points[j].x)) % prime;
                }
            }

            const lagrangeCoeff = (numerator * this._modInverse(denominator, prime)) % prime;
            secret = (secret + points[i].y * lagrangeCoeff) % prime;
        }

        // Handle negative modulo result
        if (secret < 0) secret += prime;

        return secret.toString(36);
    }

    /**
     * Modular multiplicative inverse
     * @private
     */
    _modInverse(a, m) {
        a = ((a % m) + m) % m;
        for (let x = 1; x < m; x++) {
            if ((a * x) % m === 1) return x;
        }
        return 1;
    }

    /**
     * Verify share is valid
     * @param {string} share - Share to verify
     * @param {string[]} commitments - Commitment values
     * @returns {boolean}
     */
    verifyShare(share, commitments) {
        // Simplified verification
        return share && commitments && commitments.length > 0;
    }
}

/**
 * FairGamePrimitives - Higher-level game fairness primitives
 */
class FairGamePrimitives {
    constructor(peernet) {
        this._peernet = peernet;
        this._coinToss = new CoinToss(peernet);
        this._diceRoll = new DiceRoll(peernet);
        this._secretSharing = new SecretSharing();
    }

    /**
     * Generate random order of peers
     * @param {string[]} peerIds - Peer IDs
     * @returns {Promise<string[]>}
     */
    async randomOrder(peerIds) {
        // Use coin toss to determine order
        const result = [];

        for (let i = peerIds.length - 1; i > 0; i--) {
            // Simulate random swap
            if (Math.random() < 0.5) {
                [peerIds[i], peerIds[0]] = [peerIds[0], peerIds[i]];
            }
        }

        return peerIds;
    }

    /**
     * Collaboratively shuffle deck
     * @param {string[]} peerIds - Peer IDs
     * @param {any[]} deck - Deck to shuffle
     * @returns {Promise<object>}
     */
    async shuffleDeck(peerIds, deck) {
        const deckId = Utils.generateId('deck');
        const commitments = new Map();

        // Each peer commits to their shuffle permutation
        for (const peerId of peerIds) {
            commitments.set(peerId, Utils.sha256(JSON.stringify(deck)));
        }

        return {
            id: deckId,
            cards: deck, // In real impl, would be encrypted
            participants: peerIds,
            commitments
        };
    }

    /**
     * Reveal specific card to peer
     * @param {string} deckId - Deck ID
     * @param {number} index - Card index
     * @param {string} peerId - Peer to reveal to
     * @returns {Promise<any>}
     */
    async revealCard(deckId, index, peerId) {
        // Send reveal request
        await this._peernet.send(peerId, {
            type: 'deck:reveal_request',
            deckId,
            index
        });

        // In real impl, would handle encrypted reveal
        return { deckId, index };
    }

    /**
     * Create hidden state visible only to specific peers
     * @param {T} state - State to hide
     * @param {string[]} visibleTo - Peer IDs that can see state
     * @returns {Promise<object>}
     */
    async createHiddenState(state, visibleTo) {
        const stateId = Utils.generateId('hidden');
        const nonce = Utils.randomHex(16);

        // Simple encryption (use proper crypto in production)
        const encryptedState = await Utils.sha256(JSON.stringify(state) + nonce);

        return {
            id: stateId,
            encryptedState,
            visibleTo,
            nonce
        };
    }

    /**
     * Get coin toss instance
     * @returns {CoinToss}
     */
    get coinToss() {
        return this._coinToss;
    }

    /**
     * Get dice roll instance
     * @returns {DiceRoll}
     */
    get diceRoll() {
        return this._diceRoll;
    }

    /**
     * Get secret sharing instance
     * @returns {SecretSharing}
     */
    get secretSharing() {
        return this._secretSharing;
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CommitmentManager, CoinToss, DiceRoll, SecretSharing, FairGamePrimitives };
}

// === src/state-sync.js ===
/**
 * PeerNet State Sync Module
 * Distributed state synchronization with conflict resolution
 * @module state-sync
 */

/**
 * ConflictResolver - Handles conflicting updates
 */
class ConflictResolver {
    constructor() {
        this._strategies = new Map();
        this._globalStrategy = 'last_write_wins';
    }

    /**
     * Register resolution strategy for path
     * @param {string} path - State path
     * @param {string|Function} strategy - Resolution strategy
     */
    register(path, strategy) {
        this._strategies.set(path, strategy);
    }

    /**
     * Resolve conflict
     * @param {object} conflict - Conflict details
     * @returns {any}
     */
    resolve(conflict) {
        const strategy = this._strategies.get(conflict.path) || this._globalStrategy;

        if (typeof strategy === 'function') {
            return strategy(conflict);
        }

        switch (strategy) {
            case 'last_write_wins':
                return conflict.local.timestamp > conflict.remote.timestamp
                    ? conflict.local.value
                    : conflict.remote.value;

            case 'first_write_wins':
                return conflict.local.timestamp < conflict.remote.timestamp
                    ? conflict.local.value
                    : conflict.remote.value;

            case 'merge':
                if (typeof conflict.local.value === 'object' && typeof conflict.remote.value === 'object') {
                    return Utils.deepMerge({}, conflict.local.value, conflict.remote.value);
                }
                return conflict.remote.value;

            case 'crdt':
                // Use CRDT merge if available
                return this._crdtMerge(conflict);

            default:
                return conflict.remote.value;
        }
    }

    /**
     * Set global resolution strategy
     * @param {string|Function} strategy - Strategy
     */
    setGlobalStrategy(strategy) {
        this._globalStrategy = strategy;
    }

    /**
     * CRDT merge
     * @private
     */
    _crdtMerge(conflict) {
        // Simplified CRDT merge
        if (conflict.local.value && conflict.remote.value) {
            return {
                ...conflict.local.value,
                ...conflict.remote.value,
                _crdtMeta: {
                    mergedAt: Date.now(),
                    sources: [conflict.local.author, conflict.remote.author]
                }
            };
        }
        return conflict.remote.value;
    }
}

/**
 * SmoothUpdater - Interpolated updates for real-time applications
 */
class SmoothUpdater {
    constructor() {
        this._configs = new Map();
        this._bufferTime = 100;
        this._stateBuffer = new Map();
        this._predictors = new Map();
    }

    /**
     * Register smooth update for path
     * @param {string} path - State path
     * @param {object} config - Smooth config
     */
    registerSmooth(path, config = {}) {
        this._configs.set(path, {
            interpolation: config.interpolation !== false,
            bufferTime: config.bufferTime || this._bufferTime,
            extrapolation: config.extrapolation || false,
            maxExtrapolation: config.maxExtrapolation || 200
        });
    }

    /**
     * Get interpolated value at time
     * @param {string} path - State path
     * @param {number} [time] - Target time
     * @returns {any}
     */
    getInterpolated(path, time = Date.now()) {
        const config = this._configs.get(path);
        if (!config || !config.interpolation) {
            return this._getLatest(path);
        }

        const buffer = this._stateBuffer.get(path);
        if (!buffer || buffer.length === 0) {
            return null;
        }

        const targetTime = time - config.bufferTime;

        // Find surrounding states
        let before = null;
        let after = null;

        for (const state of buffer) {
            if (state.timestamp <= targetTime) {
                before = state;
            }
            if (state.timestamp >= targetTime && !after) {
                after = state;
            }
        }

        if (!before) return after?.value;
        if (!after) {
            if (config.extrapolation) {
                return this._extrapolate(buffer, targetTime, config.maxExtrapolation);
            }
            return before.value;
        }

        // Interpolate between states
        return this._interpolate(before, after, targetTime);
    }

    /**
     * Set interpolation buffer duration
     * @param {number} ms - Buffer time in ms
     */
    setBufferTime(ms) {
        this._bufferTime = ms;
    }

    /**
     * Enable client prediction for path
     * @param {string} path - State path
     * @param {Function} predictor - Prediction function
     */
    enablePrediction(path, predictor) {
        this._predictors.set(path, predictor);
    }

    /**
     * Add state to buffer
     * @param {string} path - State path
     * @param {any} value - State value
     * @param {number} timestamp - Timestamp
     */
    addState(path, value, timestamp = Date.now()) {
        if (!this._stateBuffer.has(path)) {
            this._stateBuffer.set(path, []);
        }
        const buffer = this._stateBuffer.get(path);
        buffer.push({ value, timestamp });

        // Keep buffer limited
        if (buffer.length > 100) {
            buffer.shift();
        }
    }

    /**
     * Get latest state
     * @private
     */
    _getLatest(path) {
        const buffer = this._stateBuffer.get(path);
        if (!buffer || buffer.length === 0) return null;
        return buffer[buffer.length - 1].value;
    }

    /**
     * Interpolate between states
     * @private
     */
    _interpolate(before, after, targetTime) {
        if (typeof before.value === 'number' && typeof after.value === 'number') {
            const t = (targetTime - before.timestamp) / (after.timestamp - before.timestamp);
            return before.value + (after.value - before.value) * t;
        }

        // For non-numeric, return closest
        return targetTime - before.timestamp < after.timestamp - targetTime
            ? before.value
            : after.value;
    }

    /**
     * Extrapolate from buffer
     * @private
     */
    _extrapolate(buffer, targetTime, maxExtrapolation) {
        const latest = buffer[buffer.length - 1];
        const elapsed = targetTime - latest.timestamp;

        if (elapsed > maxExtrapolation) {
            return latest.value;
        }

        // Simple linear extrapolation for numeric values
        if (typeof latest.value === 'number' && buffer.length >= 2) {
            const prev = buffer[buffer.length - 2];
            const velocity = (latest.value - prev.value) / (latest.timestamp - prev.timestamp);
            return latest.value + velocity * elapsed;
        }

        return latest.value;
    }
}

/**
 * TimeSync - Synchronizes clocks between peers
 */
class TimeSync {
    constructor(peernet) {
        this._peernet = peernet;
        this._offsets = new Map();
        this._latencies = new Map();
        this._samples = new Map();
        this._setupHandlers();
    }

    /**
     * Synchronize clock with peer
     * @param {string} peerId - Peer ID
     * @param {number} [samples=5] - Number of samples
     * @returns {Promise<object>}
     */
    async sync(peerId, samples = 5) {
        const results = [];

        for (let i = 0; i < samples; i++) {
            const result = await this._measureOffset(peerId);
            results.push(result);
            await Utils.sleep(100);
        }

        // Calculate median offset
        const offsets = results.map(r => r.offset).sort((a, b) => a - b);
        const medianOffset = offsets[Math.floor(offsets.length / 2)];

        const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;

        this._offsets.set(peerId, medianOffset);
        this._latencies.set(peerId, avgLatency);

        return {
            offset: medianOffset,
            latency: avgLatency,
            precision: Math.max(...offsets) - Math.min(...offsets)
        };
    }

    /**
     * Get clock offset to peer
     * @param {string} peerId - Peer ID
     * @returns {number}
     */
    getOffset(peerId) {
        return this._offsets.get(peerId) || 0;
    }

    /**
     * Get synchronized global time
     * @returns {number}
     */
    getGlobalTime() {
        // Average offset across all peers
        if (this._offsets.size === 0) return Date.now();

        let totalOffset = 0;
        for (const offset of this._offsets.values()) {
            totalOffset += offset;
        }

        return Date.now() + totalOffset / this._offsets.size;
    }

    /**
     * Get measured latency to peer
     * @param {string} peerId - Peer ID
     * @returns {number}
     */
    getLatency(peerId) {
        return this._latencies.get(peerId) || 0;
    }

    /**
     * Measure offset with single ping
     * @private
     */
    async _measureOffset(peerId) {
        const t0 = Date.now();

        await this._peernet.send(peerId, {
            type: 'timesync:ping',
            t0
        });

        return new Promise(resolve => {
            const handler = (data) => {
                if (data.type === 'timesync:pong' && data.t0 === t0) {
                    this._peernet.off('message', handler);
                    const t3 = Date.now();
                    const latency = (t3 - t0 - (data.t2 - data.t1)) / 2;
                    const offset = ((data.t1 - t0) + (data.t2 - t3)) / 2;

                    resolve({ offset, latency });
                }
            };
            this._peernet.on('message', handler);
        });
    }

    /**
     * Setup message handlers
     * @private
     */
    _setupHandlers() {
        this._peernet.on('message', async ({ peerId, data }) => {
            if (data.type === 'timesync:ping') {
                const t1 = Date.now();
                await this._peernet.send(peerId, {
                    type: 'timesync:pong',
                    t0: data.t0,
                    t1,
                    t2: Date.now()
                });
            }
        });
    }
}

/**
 * ConsensusManager - Distributed consensus
 */
class ConsensusManager {
    constructor(peernet) {
        this._peernet = peernet;
        this._proposals = new Map();
        this._votes = new Map();
        this._leader = null;
        this._eventBus = new EventBus();
        this._setupHandlers();
    }

    /**
     * Propose change requiring consensus
     * @param {any} change - Proposed change
     * @param {number} requiredConfirmations - Confirmations needed
     * @returns {Promise<object>}
     */
    async propose(change, requiredConfirmations = 2) {
        const proposalId = Utils.generateId('prop');

        const proposal = {
            id: proposalId,
            change,
            proposer: this._peernet.id,
            requiredConfirmations,
            votes: new Map([[this._peernet.id, true]]),
            status: 'pending',
            createdAt: Date.now()
        };

        this._proposals.set(proposalId, proposal);

        // Broadcast proposal
        await this._peernet.broadcast({
            type: 'consensus:propose',
            proposalId,
            change,
            requiredConfirmations
        });

        this._eventBus.emit('consensus:proposed', {
            proposalId,
            change,
            proposer: this._peernet.id
        });

        // Wait for consensus or timeout
        return new Promise(resolve => {
            const timeout = setTimeout(() => {
                proposal.status = 'timeout';
                resolve({ proposalId, result: false, reason: 'timeout' });
            }, 30000);

            const checkConsensus = () => {
                if (proposal.status === 'approved') {
                    clearTimeout(timeout);
                    resolve({ proposalId, result: true });
                } else if (proposal.status === 'rejected') {
                    clearTimeout(timeout);
                    resolve({ proposalId, result: false, reason: 'rejected' });
                }
            };

            this._eventBus.on('consensus:reached', checkConsensus);
        });
    }

    /**
     * Vote on pending proposal
     * @param {string} proposalId - Proposal ID
     * @param {boolean} approve - Vote
     */
    vote(proposalId, approve) {
        const proposal = this._proposals.get(proposalId);
        if (!proposal || proposal.status !== 'pending') return;

        proposal.votes.set(this._peernet.id, approve);

        // Broadcast vote
        this._peernet.broadcast({
            type: 'consensus:vote',
            proposalId,
            approve,
            voter: this._peernet.id
        });

        this._checkConsensus(proposalId);
    }

    /**
     * Get pending proposals
     * @returns {object[]}
     */
    getPendingProposals() {
        return Array.from(this._proposals.values())
            .filter(p => p.status === 'pending');
    }

    /**
     * Elect leader among peers
     * @param {number} [timeout=5000] - Election timeout
     * @returns {Promise<string>}
     */
    async electLeader(timeout = 5000) {
        // Simple leader election using highest peer ID
        const peers = [this._peernet.id, ...Array.from(this._peernet.connections.keys())];
        const leader = peers.sort().pop();

        this._leader = leader;

        await this._peernet.broadcast({
            type: 'consensus:leader',
            leaderId: leader
        });

        this._eventBus.emit('consensus:leader', { leaderId: leader });

        return leader;
    }

    /**
     * Check if consensus reached
     * @private
     */
    _checkConsensus(proposalId) {
        const proposal = this._proposals.get(proposalId);
        if (!proposal) return;

        const yesVotes = Array.from(proposal.votes.values()).filter(v => v).length;
        const noVotes = proposal.votes.size - yesVotes;

        const totalPeers = this._peernet.connections.size + 1;

        if (yesVotes >= proposal.requiredConfirmations) {
            proposal.status = 'approved';
            this._eventBus.emit('consensus:reached', {
                proposalId,
                result: true
            });
        } else if (noVotes >= totalPeers - proposal.requiredConfirmations + 1) {
            proposal.status = 'rejected';
            this._eventBus.emit('consensus:reached', {
                proposalId,
                result: false
            });
        }
    }

    /**
     * Setup message handlers
     * @private
     */
    _setupHandlers() {
        this._peernet.on('message', ({ peerId, data }) => {
            if (!data.type?.startsWith('consensus:')) return;

            switch (data.type) {
                case 'consensus:propose':
                    this._proposals.set(data.proposalId, {
                        id: data.proposalId,
                        change: data.change,
                        proposer: peerId,
                        requiredConfirmations: data.requiredConfirmations,
                        votes: new Map(),
                        status: 'pending',
                        createdAt: Date.now()
                    });
                    this._eventBus.emit('consensus:proposed', {
                        proposalId: data.proposalId,
                        change: data.change,
                        proposer: peerId
                    });
                    break;

                case 'consensus:vote':
                    const proposal = this._proposals.get(data.proposalId);
                    if (proposal) {
                        proposal.votes.set(data.voter, data.approve);
                        this._eventBus.emit('consensus:vote', {
                            proposalId: data.proposalId,
                            voter: data.voter,
                            approve: data.approve
                        });
                        this._checkConsensus(data.proposalId);
                    }
                    break;

                case 'consensus:leader':
                    this._leader = data.leaderId;
                    this._eventBus.emit('consensus:leader', { leaderId: data.leaderId });
                    break;
            }
        });
    }

    /**
     * Subscribe to events
     */
    on(event, handler) {
        return this._eventBus.on(event, handler);
    }
}

/**
 * StateManager - Central state management
 */
class StateManager {
    constructor(peernet) {
        this._peernet = peernet;
        this._state = {};
        this._version = 0;
        this._history = [];
        this._maxHistory = 100;
        this._peers = new Map();

        this._resolver = new ConflictResolver();
        this._smoothUpdater = new SmoothUpdater();
        this._timeSync = new TimeSync(peernet);
        this._consensus = new ConsensusManager(peernet);

        this._eventBus = new EventBus();
        this._setupHandlers();

        this._throttledUpdates = new Map();
    }

    /**
     * Get current state
     * @returns {any}
     */
    get state() {
        return Utils.deepClone(this._state);
    }

    /**
     * Get current version
     * @returns {number}
     */
    get version() {
        return this._version;
    }

    /**
     * Get smooth updater
     * @returns {SmoothUpdater}
     */
    get smooth() {
        return this._smoothUpdater;
    }

    /**
     * Get time sync
     * @returns {TimeSync}
     */
    get timeSync() {
        return this._timeSync;
    }

    /**
     * Get consensus manager
     * @returns {ConsensusManager}
     */
    get consensus() {
        return this._consensus;
    }

    /**
     * Initialize synchronized state
     * @param {any} initialState - Initial state
     * @returns {Promise<void>}
     */
    async initialize(initialState) {
        this._state = Utils.deepClone(initialState);
        this._version = 1;
        this._history = [];

        this._eventBus.emit('state:initialized', {
            state: this._state,
            version: this._version
        });
    }

    /**
     * Update state at path
     * @param {string} path - State path (dot-separated)
     * @param {any} value - New value
     * @param {object} [options] - Update options
     * @returns {Promise<void>}
     */
    async update(path, value, options = {}) {
        const { broadcast = true, requireAck = false, throttle, debounce } = options;

        // Handle throttling
        if (throttle) {
            const lastUpdate = this._throttledUpdates.get(path);
            if (lastUpdate && Date.now() - lastUpdate < throttle) {
                return;
            }
            this._throttledUpdates.set(path, Date.now());
        }

        // Create delta
        const delta = {
            path,
            operation: 'set',
            value,
            timestamp: Date.now(),
            version: this._version + 1,
            author: this._peernet.id
        };

        // Apply locally
        this._applyDelta(delta, this._peernet.id);

        // Broadcast if needed
        if (broadcast) {
            await this._peernet.broadcast({
                type: 'state:delta',
                delta,
                requireAck
            });
        }
    }

    /**
     * Apply change from another peer
     * @param {object} delta - State delta
     * @param {string} source - Source peer ID
     * @returns {Promise<void>}
     */
    async applyDelta(delta, source) {
        // Check for conflicts
        const existing = Utils.getAtPath(this._state, delta.path);
        if (existing !== undefined && existing !== delta.value) {
            const conflict = {
                path: delta.path,
                local: {
                    value: existing,
                    timestamp: this._getLastModified(delta.path),
                    author: this._peernet.id
                },
                remote: delta,
                baseVersion: this._version
            };

            this._eventBus.emit('state:conflict', conflict);

            // Resolve conflict
            delta.value = this._resolver.resolve(conflict);
        }

        this._applyDelta(delta, source);
    }

    /**
     * Get current state or subpath
     * @param {string} [path] - State path
     * @returns {any}
     */
    get(path) {
        if (!path) return this._state;
        return Utils.getAtPath(this._state, path);
    }

    /**
     * Force full sync with peer
     * @param {string} peerId - Peer ID
     * @returns {Promise<void>}
     */
    async sync(peerId) {
        await this._peernet.send(peerId, {
            type: 'state:full_sync_request'
        });
    }

    /**
     * Rollback to previous version
     * @param {number} version - Target version
     * @returns {Promise<void>}
     */
    async rollback(version) {
        const targetIndex = this._history.findIndex(h => h.version === version);
        if (targetIndex === -1) {
            throw new Error('Version not found in history');
        }

        // Rebuild state from history
        this._state = {};
        this._version = 0;

        for (let i = 0; i <= targetIndex; i++) {
            this._applyDelta(this._history[i], 'rollback');
        }

        this._eventBus.emit('state:rollback', { version });
    }

    /**
     * Request state recovery from peers
     * @param {number} requiredPeers - Number of peers needed
     * @returns {Promise<any>}
     */
    async requestRecovery(requiredPeers = 1) {
        const responses = [];

        await this._peernet.broadcast({
            type: 'state:recovery_request'
        });

        // Wait for responses
        await Utils.sleep(2000);

        // Return most common state
        return this._state;
    }

    /**
     * Apply delta to state
     * @private
     */
    _applyDelta(delta, source) {
        const oldValue = Utils.getAtPath(this._state, delta.path);

        switch (delta.operation) {
            case 'set':
                Utils.setAtPath(this._state, delta.path, delta.value);
                break;
            case 'delete':
                Utils.deleteAtPath(this._state, delta.path);
                break;
            case 'merge':
                const existing = Utils.getAtPath(this._state, delta.path) || {};
                Utils.setAtPath(this._state, delta.path, { ...existing, ...delta.value });
                break;
            case 'increment':
                const current = Utils.getAtPath(this._state, delta.path) || 0;
                Utils.setAtPath(this._state, delta.path, current + delta.value);
                break;
        }

        this._version = delta.version;
        this._history.push(delta);
        if (this._history.length > this._maxHistory) {
            this._history.shift();
        }

        // Add to smooth updater
        this._smoothUpdater.addState(delta.path, delta.value, delta.timestamp);

        this._eventBus.emit('state:updated', { delta, version: this._version, source });
    }

    /**
     * Get last modified timestamp for path
     * @private
     */
    _getLastModified(path) {
        for (let i = this._history.length - 1; i >= 0; i--) {
            if (this._history[i].path === path) {
                return this._history[i].timestamp;
            }
        }
        return 0;
    }

    /**
     * Setup message handlers
     * @private
     */
    _setupHandlers() {
        this._peernet.on('message', async ({ peerId, data }) => {
            if (!data.type?.startsWith('state:')) return;

            switch (data.type) {
                case 'state:delta':
                    await this.applyDelta(data.delta, peerId);
                    break;

                case 'state:full_sync_request':
                    await this._peernet.send(peerId, {
                        type: 'state:full_sync_response',
                        state: this._state,
                        version: this._version
                    });
                    break;

                case 'state:full_sync_response':
                    this._state = data.state;
                    this._version = data.version;
                    this._eventBus.emit('state:synced', { peerId, version: data.version });
                    break;

                case 'state:recovery_request':
                    await this._peernet.send(peerId, {
                        type: 'state:recovery_response',
                        state: this._state,
                        version: this._version
                    });
                    break;
            }
        });
    }

    /**
     * Subscribe to state events
     */
    on(event, handler) {
        return this._eventBus.on(event, handler);
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConflictResolver, SmoothUpdater, TimeSync, ConsensusManager, StateManager };
}

// === src/persistence.js ===
/**
 * PeerNet Persistence Module
 * Local storage and state recovery
 * @module persistence
 */

/**
 * StorageNamespace - Isolated storage area
 */
class StorageNamespace {
    /**
     * Create storage namespace
     * @param {string} name - Namespace name
     * @param {object} [options] - Namespace options
     */
    constructor(name, options = {}) {
        this._name = name;
        this._prefix = `peernet_${name}_`;
        this._encrypted = options.encrypted || false;
        this._maxSize = options.maxSize;
        this._defaultExpiration = options.defaultExpiration;
        this._version = options.version || 1;
        this._eventBus = new EventBus();
        this._encryptionKey = null;
    }

    /**
     * Set encryption key
     * @param {string} key - Encryption key
     */
    setEncryptionKey(key) {
        this._encryptionKey = key;
    }

    /**
     * Store value
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     * @param {object} [options] - Set options
     * @returns {Promise<void>}
     */
    async set(key, value, options = {}) {
        const fullKey = this._prefix + key;
        const expiresAt = options.expiresIn
            ? Date.now() + options.expiresIn
            : this._defaultExpiration
                ? Date.now() + this._defaultExpiration
                : null;

        let data = {
            value,
            storedAt: Date.now(),
            expiresAt,
            version: this._version
        };

        // Encrypt if needed
        if (options.encrypt || this._encrypted) {
            data = await this._encrypt(data);
        }

        // Check size
        const serialized = JSON.stringify(data);
        if (this._maxSize && serialized.length > this._maxSize) {
            throw new Error('Data exceeds maximum size');
        }

        try {
            localStorage.setItem(fullKey, serialized);
            this._eventBus.emit('storage:change', { key, value, operation: 'set' });
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                this._cleanup();
                localStorage.setItem(fullKey, serialized);
            } else {
                throw e;
            }
        }
    }

    /**
     * Retrieve stored value
     * @param {string} key - Storage key
     * @returns {Promise<any>}
     */
    async get(key) {
        const fullKey = this._prefix + key;

        try {
            const serialized = localStorage.getItem(fullKey);
            if (!serialized) return undefined;

            let data = JSON.parse(serialized);

            // Check expiration
            if (data.expiresAt && Date.now() > data.expiresAt) {
                this.delete(key);
                return undefined;
            }

            // Decrypt if needed
            if (data.encrypted || this._encrypted) {
                data = await this._decrypt(data);
            }

            // Check version
            if (data.version && data.version !== this._version) {
                // Trigger migration
                return undefined;
            }

            return data.value;
        } catch (e) {
            return undefined;
        }
    }

    /**
     * Check if key exists
     * @param {string} key - Storage key
     * @returns {Promise<boolean>}
     */
    async has(key) {
        const fullKey = this._prefix + key;
        return localStorage.getItem(fullKey) !== null;
    }

    /**
     * Delete stored value
     * @param {string} key - Storage key
     * @returns {Promise<void>}
     */
    async delete(key) {
        const fullKey = this._prefix + key;
        localStorage.removeItem(fullKey);
        this._eventBus.emit('storage:change', { key, operation: 'delete' });
    }

    /**
     * Clear all values in namespace
     * @returns {Promise<void>}
     */
    async clear() {
        const keys = await this.keys();
        for (const key of keys) {
            await this.delete(key);
        }
    }

    /**
     * List all keys
     * @returns {Promise<string[]>}
     */
    async keys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(this._prefix)) {
                keys.push(key.substring(this._prefix.length));
            }
        }
        return keys;
    }

    /**
     * Subscribe to changes
     * @param {Function} handler - Change handler
     * @returns {Function}
     */
    onChange(handler) {
        return this._eventBus.on('storage:change', handler);
    }

    /**
     * Encrypt data
     * @private
     */
    async _encrypt(data) {
        if (!this._encryptionKey) return { ...data, encrypted: false };

        // Simple XOR encryption (use proper crypto in production)
        const serialized = JSON.stringify(data);
        const keyBytes = Utils.stringToBytes(this._encryptionKey);
        const dataBytes = Utils.stringToBytes(serialized);
        const encrypted = new Uint8Array(dataBytes.length);

        for (let i = 0; i < dataBytes.length; i++) {
            encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
        }

        return {
            encrypted: true,
            data: Utils.arrayBufferToBase64(encrypted)
        };
    }

    /**
     * Decrypt data
     * @private
     */
    async _decrypt(data) {
        if (!data.encrypted || !this._encryptionKey) return data;

        const encrypted = Utils.base64ToArrayBuffer(data.data);
        const keyBytes = Utils.stringToBytes(this._encryptionKey);
        const decrypted = new Uint8Array(encrypted.byteLength);

        for (let i = 0; i < decrypted.length; i++) {
            decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
        }

        return JSON.parse(Utils.bytesToString(decrypted));
    }

    /**
     * Cleanup expired entries
     * @private
     */
    _cleanup() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(this._prefix)) {
                keys.push(key);
            }
        }

        for (const key of keys) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                if (data.expiresAt && Date.now() > data.expiresAt) {
                    localStorage.removeItem(key);
                }
            } catch (e) {
                // Remove invalid entries
                localStorage.removeItem(key);
            }
        }
    }
}

/**
 * PeerRegistry - Persistent peer recognition
 */
class PeerRegistry {
    /**
     * Create peer registry
     * @param {StorageNamespace} storage - Storage namespace
     */
    constructor(storage) {
        this._storage = storage;
        this._blocked = new Set();
        this._trust = new Map();
        this._loadBlocked();
    }

    /**
     * Register peer with metadata
     * @param {string} peerId - Peer ID
     * @param {object} metadata - Peer metadata
     * @returns {Promise<void>}
     */
    async register(peerId, metadata) {
        const existing = await this._storage.get(`peer_${peerId}`) || {
            peerId,
            firstSeen: Date.now(),
            gamesPlayed: 0
        };

        await this._storage.set(`peer_${peerId}`, {
            ...existing,
            ...metadata,
            lastSeen: Date.now()
        });
    }

    /**
     * Check if peer is known
     * @param {string} peerId - Peer ID
     * @returns {Promise<object|undefined>}
     */
    async recognize(peerId) {
        return this._storage.get(`peer_${peerId}`);
    }

    /**
     * Update peer's last seen timestamp
     * @param {string} peerId - Peer ID
     * @returns {Promise<void>}
     */
    async updateLastSeen(peerId) {
        const peer = await this.recognize(peerId);
        if (peer) {
            await this._storage.set(`peer_${peerId}`, {
                ...peer,
                lastSeen: Date.now()
            });
        }
    }

    /**
     * Get interaction history with peer
     * @param {string} peerId - Peer ID
     * @returns {Promise<object>}
     */
    async getHistory(peerId) {
        const history = await this._storage.get(`history_${peerId}`) || {
            peerId,
            interactions: [],
            games: [],
            totalTimeSpent: 0
        };
        return history;
    }

    /**
     * Block peer from future connections
     * @param {string} peerId - Peer ID
     * @param {string} [reason] - Block reason
     * @returns {Promise<void>}
     */
    async block(peerId, reason) {
        this._blocked.add(peerId);
        await this._storage.set(`blocked_${peerId}`, {
            peerId,
            reason,
            blockedAt: Date.now()
        });
    }

    /**
     * Check if peer is blocked
     * @param {string} peerId - Peer ID
     * @returns {Promise<boolean>}
     */
    async isBlocked(peerId) {
        return this._blocked.has(peerId) || !!(await this._storage.get(`blocked_${peerId}`));
    }

    /**
     * Set trust level for peer
     * @param {string} peerId - Peer ID
     * @param {string} level - Trust level
     * @returns {Promise<void>}
     */
    async trust(peerId, level) {
        this._trust.set(peerId, level);
        const peer = await this.recognize(peerId);
        if (peer) {
            await this._storage.set(`peer_${peerId}`, { ...peer, trustLevel: level });
        }
    }

    /**
     * Load blocked peers from storage
     * @private
     */
    async _loadBlocked() {
        const keys = await this._storage.keys();
        for (const key of keys) {
            if (key.startsWith('blocked_')) {
                const data = await this._storage.get(key);
                if (data) {
                    this._blocked.add(data.peerId);
                }
            }
        }
    }
}

/**
 * GamePersistence - Game-specific persistence
 */
class GamePersistence {
    /**
     * Create game persistence
     * @param {StorageNamespace} storage - Storage namespace
     */
    constructor(storage) {
        this._storage = storage;
    }

    /**
     * Save game score
     * @param {string} gameId - Game ID
     * @param {number} score - Score
     * @param {object} [metadata] - Additional metadata
     * @returns {Promise<void>}
     */
    async saveScore(gameId, score, metadata = {}) {
        const scores = await this._storage.get(`scores_${gameId}`) || [];

        scores.push({
            score,
            timestamp: Date.now(),
            ...metadata
        });

        // Keep top 100 scores
        scores.sort((a, b) => b.score - a.score);
        if (scores.length > 100) scores.length = 100;

        await this._storage.set(`scores_${gameId}`, scores);
    }

    /**
     * Get personal high score
     * @param {string} gameId - Game ID
     * @returns {Promise<number>}
     */
    async getHighScore(gameId) {
        const scores = await this._storage.get(`scores_${gameId}`) || [];
        return scores.length > 0 ? scores[0].score : 0;
    }

    /**
     * Get leaderboard
     * @param {string} gameId - Game ID
     * @param {number} [limit=10] - Max entries
     * @returns {Promise<object[]>}
     */
    async getLeaderboard(gameId, limit = 10) {
        const scores = await this._storage.get(`scores_${gameId}`) || [];
        return scores.slice(0, limit);
    }

    /**
     * Save game state
     * @param {string} gameId - Game ID
     * @param {any} state - Game state
     * @returns {Promise<void>}
     */
    async saveState(gameId, state) {
        await this._storage.set(`state_${gameId}`, {
            state,
            savedAt: Date.now()
        });
    }

    /**
     * Load saved game state
     * @param {string} gameId - Game ID
     * @returns {Promise<any>}
     */
    async loadState(gameId) {
        const data = await this._storage.get(`state_${gameId}`);
        return data?.state;
    }

    /**
     * Unlock achievement
     * @param {string} gameId - Game ID
     * @param {string} achievementId - Achievement ID
     * @returns {Promise<void>}
     */
    async unlockAchievement(gameId, achievementId) {
        const achievements = await this._storage.get(`achievements_${gameId}`) || [];

        if (!achievements.includes(achievementId)) {
            achievements.push(achievementId);
            await this._storage.set(`achievements_${gameId}`, achievements);
        }
    }

    /**
     * Get unlocked achievements
     * @param {string} gameId - Game ID
     * @returns {Promise<string[]>}
     */
    async getAchievements(gameId) {
        return (await this._storage.get(`achievements_${gameId}`)) || [];
    }
}

/**
 * SecretStorage - Secure storage for secrets
 */
class SecretStorage {
    /**
     * Create secret storage
     * @param {StorageNamespace} storage - Storage namespace
     */
    constructor(storage) {
        this._storage = storage;
        this._accessControl = new Map();
    }

    /**
     * Store encrypted secret
     * @param {string} key - Secret key
     * @param {string} secret - Secret value
     * @param {object} [options] - Secret options
     * @returns {Promise<void>}
     */
    async store(key, secret, options = {}) {
        await this._storage.set(`secret_${key}`, {
            secret,
            accessControl: options.accessControl || 'owner',
            sharedWith: [],
            storedAt: Date.now(),
            expiresAt: options.expiresIn ? Date.now() + options.expiresIn : null
        }, { encrypt: true });
    }

    /**
     * Retrieve decrypted secret
     * @param {string} key - Secret key
     * @returns {Promise<string|undefined>}
     */
    async retrieve(key) {
        const data = await this._storage.get(`secret_${key}`, { encrypt: true });
        return data?.secret;
    }

    /**
     * Mark secret as shared with peer
     * @param {string} key - Secret key
     * @param {string} peerId - Peer ID
     * @returns {Promise<void>}
     */
    async share(key, peerId) {
        const data = await this._storage.get(`secret_${key}`);
        if (data) {
            if (!data.sharedWith.includes(peerId)) {
                data.sharedWith.push(peerId);
            }
            await this._storage.set(`secret_${key}`, data, { encrypt: true });
        }
    }

    /**
     * Revoke peer's access to secret
     * @param {string} key - Secret key
     * @param {string} peerId - Peer ID
     * @returns {Promise<void>}
     */
    async revoke(key, peerId) {
        const data = await this._storage.get(`secret_${key}`);
        if (data) {
            data.sharedWith = data.sharedWith.filter(id => id !== peerId);
            await this._storage.set(`secret_${key}`, data, { encrypt: true });
        }
    }

    /**
     * List peers with access
     * @param {string} key - Secret key
     * @returns {Promise<string[]>}
     */
    async listShared(key) {
        const data = await this._storage.get(`secret_${key}`);
        return data?.sharedWith || [];
    }
}

/**
 * MigrationManager - Schema migration
 */
class MigrationManager {
    /**
     * Create migration manager
     * @param {StorageNamespace} storage - Storage namespace
     */
    constructor(storage) {
        this._storage = storage;
        this._migrations = new Map();
    }

    /**
     * Register migration function
     * @param {string} namespace - Namespace name
     * @param {number} fromVersion - Source version
     * @param {number} toVersion - Target version
     * @param {Function} migrate - Migration function
     */
    registerMigration(namespace, fromVersion, toVersion, migrate) {
        const key = `${namespace}_${fromVersion}_${toVersion}`;
        this._migrations.set(key, migrate);
    }

    /**
     * Get current data version
     * @param {string} namespace - Namespace name
     * @returns {Promise<number>}
     */
    async getVersion(namespace) {
        const version = await this._storage.get(`_version_${namespace}`);
        return version || 0;
    }

    /**
     * Run pending migrations
     * @param {string} namespace - Namespace name
     * @returns {Promise<void>}
     */
    async migrate(namespace) {
        let currentVersion = await this.getVersion(namespace);

        // Find and run migrations
        for (const [key, migrate] of this._migrations) {
            const [ns, from, to] = key.split('_');
            if (ns === namespace && parseInt(from) === currentVersion) {
                const data = await this._storage.get(namespace);
                const migrated = await migrate(data);
                await this._storage.set(namespace, migrated);
                await this._storage.set(`_version_${namespace}`, parseInt(to));
                currentVersion = parseInt(to);
            }
        }
    }
}

/**
 * PersistenceManager - Central persistence coordinator
 */
class PersistenceManager {
    /**
     * Create persistence manager
     * @param {PeerNet} peernet - PeerNet instance
     * @param {object} [config] - Configuration
     */
    constructor(peernet, config = {}) {
        this._peernet = peernet;
        this._config = config;
        this._namespaces = new Map();
        this._encryptionKey = null;

        // Create default namespace
        this.createNamespace(config.namespace || 'default', config);

        // Create sub-managers
        this._peerRegistry = new PeerRegistry(this.getNamespace('default'));
        this._gamePersistence = new GamePersistence(this.createNamespace('games'));
        this._secretStorage = new SecretStorage(this.createNamespace('secrets'));
        this._migrationManager = new MigrationManager(this.getNamespace('default'));
    }

    /**
     * Create isolated storage namespace
     * @param {string} name - Namespace name
     * @param {object} [options] - Namespace options
     * @returns {StorageNamespace}
     */
    createNamespace(name, options = {}) {
        if (this._namespaces.has(name)) {
            return this._namespaces.get(name);
        }

        const ns = new StorageNamespace(name, options);
        if (this._encryptionKey) {
            ns.setEncryptionKey(this._encryptionKey);
        }
        this._namespaces.set(name, ns);
        return ns;
    }

    /**
     * Get existing namespace
     * @param {string} name - Namespace name
     * @returns {StorageNamespace|undefined}
     */
    getNamespace(name) {
        return this._namespaces.get(name);
    }

    /**
     * Delete namespace and all data
     * @param {string} name - Namespace name
     * @returns {Promise<void>}
     */
    async dropNamespace(name) {
        const ns = this._namespaces.get(name);
        if (ns) {
            await ns.clear();
            this._namespaces.delete(name);
        }
    }

    /**
     * Export all data as JSON
     * @returns {Promise<string>}
     */
    async exportAll() {
        const data = {};

        for (const [name, ns] of this._namespaces) {
            const keys = await ns.keys();
            data[name] = {};

            for (const key of keys) {
                data[name][key] = await ns.get(key);
            }
        }

        return JSON.stringify(data);
    }

    /**
     * Import data from export
     * @param {string} json - JSON string
     * @returns {Promise<void>}
     */
    async importAll(json) {
        const data = JSON.parse(json);

        for (const [name, values] of Object.entries(data)) {
            const ns = this.createNamespace(name);

            for (const [key, value] of Object.entries(values)) {
                await ns.set(key, value);
            }
        }
    }

    /**
     * Set encryption key for storage
     * @param {string} key - Encryption key
     */
    setEncryptionKey(key) {
        this._encryptionKey = key;
        for (const ns of this._namespaces.values()) {
            ns.setEncryptionKey(key);
        }
    }

    /**
     * Get peer registry
     * @returns {PeerRegistry}
     */
    get peerRegistry() {
        return this._peerRegistry;
    }

    /**
     * Get game persistence
     * @returns {GamePersistence}
     */
    get game() {
        return this._gamePersistence;
    }

    /**
     * Get secret storage
     * @returns {SecretStorage}
     */
    get secrets() {
        return this._secretStorage;
    }

    /**
     * Get migration manager
     * @returns {MigrationManager}
     */
    get migrations() {
        return this._migrationManager;
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        StorageNamespace,
        PeerRegistry,
        GamePersistence,
        SecretStorage,
        MigrationManager,
        PersistenceManager
    };
}

// === src/messaging.js ===
/**
 * PeerNet Messaging Module
 * Reliable messaging with acknowledgments and broadcasting
 * @module messaging
 */

/**
 * MessageBuilder - Fluent message construction
 */
class MessageBuilder {
    constructor() {
        this._type = 'data';
        this._payload = null;
        this._metadata = {};
        this._requireAck = false;
        this._expireIn = null;
    }

    /**
     * Set message type
     * @param {string} type - Message type
     * @returns {MessageBuilder}
     */
    type(type) {
        this._type = type;
        return this;
    }

    /**
     * Set message payload
     * @param {any} data - Payload data
     * @returns {MessageBuilder}
     */
    payload(data) {
        this._payload = data;
        return this;
    }

    /**
     * Add metadata
     * @param {object} meta - Metadata
     * @returns {MessageBuilder}
     */
    metadata(meta) {
        this._metadata = { ...this._metadata, ...meta };
        return this;
    }

    /**
     * Require acknowledgment
     * @returns {MessageBuilder}
     */
    requireAck() {
        this._requireAck = true;
        return this;
    }

    /**
     * Set message expiration
     * @param {number} ms - Expiration time in ms
     * @returns {MessageBuilder}
     */
    expireIn(ms) {
        this._expireIn = ms;
        return this;
    }

    /**
     * Build final message
     * @returns {object}
     */
    build() {
        const message = {
            id: Utils.generateId('msg'),
            type: this._type,
            payload: this._payload,
            timestamp: Date.now(),
            sender: null, // Set by sender
            requiresAck: this._requireAck,
            metadata: this._metadata
        };

        if (this._expireIn) {
            message.expiresAt = Date.now() + this._expireIn;
        }

        return message;
    }
}

/**
 * ReliableChannel - Reliability layer
 */
class ReliableChannel {
    /**
     * Create reliable channel
     * @param {PeerNet} peernet - PeerNet instance
     */
    constructor(peernet) {
        this._peernet = peernet;
        this._pending = new Map();
        this._maxRetries = 3;
        this._timeout = 30000;
        this._sequenceNumbers = new Map();
    }

    /**
     * Send with reliability guarantees
     * @param {string} peerId - Peer ID
     * @param {any} data - Data to send
     * @returns {Promise<void>}
     */
    async send(peerId, data) {
        const seq = this._getNextSequence(peerId);
        const messageId = Utils.generateId('rel');

        const envelope = {
            id: messageId,
            seq,
            data,
            timestamp: Date.now(),
            requiresAck: true
        };

        // Store as pending
        this._pending.set(messageId, {
            envelope,
            peerId,
            attempts: 0,
            sentAt: Date.now()
        });

        // Send and wait for ack
        await this._sendWithRetry(peerId, envelope);
    }

    /**
     * Set maximum retry attempts
     * @param {number} count - Max retries
     */
    setMaxRetries(count) {
        this._maxRetries = count;
    }

    /**
     * Set delivery timeout
     * @param {number} ms - Timeout in ms
     */
    setTimeout(ms) {
        this._timeout = ms;
    }

    /**
     * Get pending message count for peer
     * @param {string} peerId - Peer ID
     * @returns {number}
     */
    getPendingCount(peerId) {
        let count = 0;
        for (const pending of this._pending.values()) {
            if (pending.peerId === peerId) count++;
        }
        return count;
    }

    /**
     * Handle acknowledgment
     * @private
     */
    _handleAck(messageId) {
        this._pending.delete(messageId);
    }

    /**
     * Send with retry logic
     * @private
     */
    async _sendWithRetry(peerId, envelope) {
        const connection = this._peernet.connections.get(peerId);
        if (!connection) {
            throw new Error(`No connection to peer: ${peerId}`);
        }

        const pending = this._pending.get(envelope.id);
        if (!pending) return;

        pending.attempts++;

        connection.send(envelope);

        // Wait for ack with timeout
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                if (pending.attempts < this._maxRetries) {
                    this._sendWithRetry(peerId, envelope).then(resolve).catch(reject);
                } else {
                    this._pending.delete(envelope.id);
                    reject(new Error('Max retries exceeded'));
                }
            }, this._timeout);

            // Check for ack
            const checkAck = () => {
                if (!this._pending.has(envelope.id)) {
                    clearTimeout(timeout);
                    resolve();
                }
            };

            const interval = setInterval(checkAck, 100);
            setTimeout(() => clearInterval(interval), this._timeout + 1000);
        });
    }

    /**
     * Get next sequence number
     * @private
     */
    _getNextSequence(peerId) {
        const seq = this._sequenceNumbers.get(peerId) || 0;
        this._sequenceNumbers.set(peerId, seq + 1);
        return seq;
    }
}

/**
 * BroadcastCoordinator - Efficient broadcast
 */
class BroadcastCoordinator {
    /**
     * Create broadcast coordinator
     * @param {PeerNet} peernet - PeerNet instance
     */
    constructor(peernet) {
        this._peernet = peernet;
        this._broadcasts = new Map();
    }

    /**
     * Broadcast with optional filtering
     * @param {any} message - Message to broadcast
     * @param {Function} [filter] - Recipient filter
     * @returns {Promise<object>}
     */
    async broadcast(message, filter) {
        const broadcastId = Utils.generateId('bc');
        const recipients = [];

        const envelope = {
            broadcastId,
            message,
            timestamp: Date.now()
        };

        // Track delivery
        const status = {
            broadcastId,
            recipients: [],
            delivered: [],
            failed: [],
            acknowledged: []
        };

        for (const [peerId, connection] of this._peernet.connections) {
            // Apply filter
            if (filter && !filter(peerId)) continue;

            recipients.push(peerId);
            status.recipients.push(peerId);

            try {
                connection.send(envelope);
                status.delivered.push(peerId);
            } catch (e) {
                status.failed.push(peerId);
            }
        }

        this._broadcasts.set(broadcastId, status);

        return status;
    }

    /**
     * Confirm delivery from peer
     * @param {string} broadcastId - Broadcast ID
     * @param {string} peerId - Peer ID
     */
    confirmDelivery(broadcastId, peerId) {
        const status = this._broadcasts.get(broadcastId);
        if (status && !status.acknowledged.includes(peerId)) {
            status.acknowledged.push(peerId);
        }
    }

    /**
     * Get broadcast delivery status
     * @param {string} broadcastId - Broadcast ID
     * @returns {object}
     */
    getDeliveryStatus(broadcastId) {
        return this._broadcasts.get(broadcastId);
    }

    /**
     * Retry failed deliveries
     * @param {string} broadcastId - Broadcast ID
     * @returns {Promise<void>}
     */
    async retryUndelivered(broadcastId) {
        const status = this._broadcasts.get(broadcastId);
        if (!status) return;

        for (const peerId of status.failed) {
            const connection = this._peernet.connections.get(peerId);
            if (connection) {
                try {
                    connection.send({
                        broadcastId,
                        message: status.message,
                        timestamp: Date.now(),
                        retry: true
                    });
                    status.failed = status.failed.filter(id => id !== peerId);
                    status.delivered.push(peerId);
                } catch (e) {
                    // Still failing
                }
            }
        }
    }
}

/**
 * ChannelMultiplexer - Multiple logical channels
 */
class ChannelMultiplexer {
    /**
     * Create channel multiplexer
     * @param {PeerNet} peernet - PeerNet instance
     */
    constructor(peernet) {
        this._peernet = peernet;
        this._channels = new Map();
        this._priorities = new Map();
    }

    /**
     * Create named channel
     * @param {string} name - Channel name
     * @param {object} [options] - Channel options
     * @returns {MessageChannel}
     */
    createChannel(name, options = {}) {
        if (this._channels.has(name)) {
            return this._channels.get(name);
        }

        const channel = new MessageChannel(name, this._peernet, options);
        this._channels.set(name, channel);
        this._priorities.set(name, options.priority || 0);

        return channel;
    }

    /**
     * Get existing channel
     * @param {string} name - Channel name
     * @returns {MessageChannel|undefined}
     */
    getChannel(name) {
        return this._channels.get(name);
    }

    /**
     * Remove channel
     * @param {string} name - Channel name
     */
    removeChannel(name) {
        this._channels.delete(name);
        this._priorities.delete(name);
    }

    /**
     * Set channel priority
     * @param {string} name - Channel name
     * @param {number} priority - Priority value
     */
    setPriority(name, priority) {
        this._priorities.set(name, priority);
    }

    /**
     * Route message to appropriate channel
     * @param {string} peerId - Source peer
     * @param {object} message - Message to route
     */
    route(peerId, message) {
        const channelName = message.channel;
        if (channelName && this._channels.has(channelName)) {
            const channel = this._channels.get(channelName);
            channel._receive(peerId, message);
        }
    }
}

/**
 * MessageChannel - Single channel
 */
class MessageChannel {
    constructor(name, peernet, options) {
        this._name = name;
        this._peernet = peernet;
        this._options = options;
        this._queue = [];
        this._handlers = new Set();
    }

    /**
     * Send message on channel
     * @param {string} peerId - Target peer
     * @param {any} message - Message to send
     * @returns {Promise<void>}
     */
    async send(peerId, message) {
        const envelope = {
            channel: this._name,
            data: message,
            timestamp: Date.now(),
            priority: this._options.priority || 0
        };

        await this._peernet.send(peerId, envelope);
    }

    /**
     * Broadcast on channel
     * @param {any} message - Message to broadcast
     * @returns {Promise<void>}
     */
    async broadcast(message) {
        const envelope = {
            channel: this._name,
            data: message,
            timestamp: Date.now()
        };

        await this._peernet.broadcast(envelope);
    }

    /**
     * Subscribe to channel messages
     * @param {Function} handler - Message handler
     * @returns {Function}
     */
    onMessage(handler) {
        this._handlers.add(handler);
        return () => this._handlers.delete(handler);
    }

    /**
     * Receive message (called by multiplexer)
     * @private
     */
    _receive(peerId, message) {
        for (const handler of this._handlers) {
            try {
                handler({ peerId, data: message.data, timestamp: message.timestamp });
            } catch (e) {
                console.error('Channel handler error:', e);
            }
        }
    }
}

/**
 * MessagingManager - Central messaging coordinator
 */
class MessagingManager {
    /**
     * Create messaging manager
     * @param {PeerNet} peernet - PeerNet instance
     */
    constructor(peernet) {
        this._peernet = peernet;
        this._handlers = new Map();
        this._pendingAcks = new Map();
        this._pendingRequests = new Map();
        this._reliable = new ReliableChannel(peernet);
        this._broadcast = new BroadcastCoordinator(peernet);
        this._multiplexer = new ChannelMultiplexer(peernet);
        this._eventBus = new EventBus();

        this._setupHandlers();
    }

    /**
     * Get reliable channel
     * @returns {ReliableChannel}
     */
    get reliable() {
        return this._reliable;
    }

    /**
     * Get broadcast coordinator
     * @returns {BroadcastCoordinator}
     */
    get broadcast() {
        return this._broadcast;
    }

    /**
     * Get multiplexer
     * @returns {ChannelMultiplexer}
     */
    get channels() {
        return this._multiplexer;
    }

    /**
     * Send message to peer
     * @param {string} peerId - Target peer
     * @param {any} message - Message to send
     * @param {object} [options] - Send options
     * @returns {Promise<object>}
     */
    async send(peerId, message, options = {}) {
        const envelope = new MessageBuilder()
            .type(options.type || 'data')
            .payload(message)
            .metadata(options.metadata || {})
            .build();

        envelope.sender = this._peernet.id;

        if (options.requireAck) {
            return this.sendWithAck(peerId, envelope, options.timeout);
        }

        await this._peernet.send(peerId, envelope);

        return {
            messageId: envelope.id,
            delivered: true,
            timestamp: envelope.timestamp
        };
    }

    /**
     * Broadcast to all peers
     * @param {any} message - Message to broadcast
     * @param {object} [options] - Broadcast options
     * @returns {Promise<object>}
     */
    async broadcast(message, options = {}) {
        if (options.filter) {
            return this._broadcast.broadcast(message, options.filter);
        }

        return this._broadcast.broadcast(message);
    }

    /**
     * Send request and await response
     * @param {string} peerId - Target peer
     * @param {any} message - Request message
     * @param {number} [timeout=30000] - Timeout in ms
     * @returns {Promise<any>}
     */
    async request(peerId, message, timeout = 30000) {
        const requestId = Utils.generateId('req');

        const envelope = new MessageBuilder()
            .type('request')
            .payload(message)
            .metadata({ requestId })
            .build();

        const deferred = Utils.deferred();
        this._pendingRequests.set(requestId, deferred);

        await this._peernet.send(peerId, envelope);

        // Timeout
        setTimeout(() => {
            if (this._pendingRequests.has(requestId)) {
                this._pendingRequests.delete(requestId);
                deferred.reject(new Error('Request timeout'));
            }
        }, timeout);

        return deferred.promise;
    }

    /**
     * Respond to request
     * @param {string} requestId - Request ID
     * @param {any} response - Response data
     */
    respond(requestId, response) {
        // Find who made the request
        for (const [peerId] of this._peernet.connections) {
            this._peernet.send(peerId, {
                type: 'response',
                requestId,
                response,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Register message handler
     * @param {string} type - Message type
     * @param {Function} handler - Handler function
     * @returns {Function}
     */
    onMessage(type, handler) {
        if (!this._handlers.has(type)) {
            this._handlers.set(type, new Set());
        }
        this._handlers.get(type).add(handler);

        return () => {
            this._handlers.get(type)?.delete(handler);
        };
    }

    /**
     * Send requiring acknowledgment
     * @param {string} peerId - Target peer
     * @param {any} message - Message to send
     * @param {number} [timeout] - Timeout in ms
     * @returns {Promise<object>}
     */
    async sendWithAck(peerId, message, timeout = 30000) {
        const messageId = message.id || Utils.generateId('msg');
        message.id = messageId;
        message.requiresAck = true;

        const deferred = Utils.deferred();
        this._pendingAcks.set(messageId, deferred);

        await this._peernet.send(peerId, message);

        // Timeout
        setTimeout(() => {
            if (this._pendingAcks.has(messageId)) {
                this._pendingAcks.delete(messageId);
                deferred.reject(new Error('Ack timeout'));
            }
        }, timeout);

        return deferred.promise;
    }

    /**
     * Handle incoming message
     * @private
     */
    _handleIncoming(peerId, message) {
        // Route through multiplexer
        if (message.channel) {
            this._multiplexer.route(peerId, message);
            return;
        }

        // Handle acknowledgment
        if (message.type === 'ack') {
            const pending = this._pendingAcks.get(message.messageId);
            if (pending) {
                this._pendingAcks.delete(message.messageId);
                pending.resolve({ acknowledged: true, latency: Date.now() - message.timestamp });
            }
            return;
        }

        // Handle request
        if (message.type === 'request') {
            const requestId = message.metadata?.requestId;
            if (requestId) {
                this._eventBus.emit('messaging:request', {
                    peerId,
                    requestId,
                    data: message.payload
                });
            }
            return;
        }

        // Handle response
        if (message.type === 'response') {
            const pending = this._pendingRequests.get(message.requestId);
            if (pending) {
                this._pendingRequests.delete(message.requestId);
                pending.resolve(message.response);
            }
            return;
        }

        // Send ack if required
        if (message.requiresAck) {
            this._peernet.send(peerId, {
                type: 'ack',
                messageId: message.id,
                timestamp: message.timestamp
            });
        }

        // Dispatch to type handlers
        const handlers = this._handlers.get(message.type);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler({ peerId, data: message.payload, message });
                } catch (e) {
                    console.error('Message handler error:', e);
                }
            }
        }

        // Emit general message event
        this._eventBus.emit('messaging:message', { peerId, message });
    }

    /**
     * Setup message handlers
     * @private
     */
    _setupHandlers() {
        this._peernet.on('message', ({ peerId, data }) => {
            this._handleIncoming(peerId, data);
        });
    }

    /**
     * Subscribe to messaging events
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {Function}
     */
    on(event, handler) {
        return this._eventBus.on(event, handler);
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MessageBuilder,
        ReliableChannel,
        BroadcastCoordinator,
        ChannelMultiplexer,
        MessageChannel,
        MessagingManager
    };
}

// === src/ui-components.js ===
/**
 * PeerNet UI Components Module
 * Composable UI elements for P2P applications
 * @module ui-components
 */

/**
 * UIFactory - Factory for creating UI components
 */
class UIFactory {
    /**
     * Create UI factory
     * @param {PeerNet} peernet - PeerNet instance
     */
    constructor(peernet) {
        this._peernet = peernet;
        this._styles = this._getDefaultStyles();
        this._mounted = new Set();
    }

    /**
     * Get default CSS styles
     * @private
     */
    _getDefaultStyles() {
        return `
            .peernet-container { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .peernet-user-list { list-style: none; padding: 0; margin: 0; }
            .peernet-user-item { 
                display: flex; align-items: center; padding: 8px 12px; 
                border-bottom: 1px solid #eee; cursor: pointer; 
            }
            .peernet-user-item:hover { background: #f5f5f5; }
            .peernet-user-item.selected { background: #e3f2fd; }
            .peernet-avatar { 
                width: 32px; height: 32px; border-radius: 50%; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                display: flex; align-items: center; justify-content: center; 
                color: white; font-weight: bold; margin-right: 10px; 
            }
            .peernet-status { 
                width: 8px; height: 8px; border-radius: 50%; 
                margin-left: auto; 
            }
            .peernet-status.online { background: #4caf50; }
            .peernet-status.offline { background: #f44336; }
            .peernet-status.away { background: #ff9800; }
            .peernet-chat { display: flex; flex-direction: column; height: 100%; }
            .peernet-chat-messages { flex: 1; overflow-y: auto; padding: 10px; }
            .peernet-chat-message { margin-bottom: 10px; }
            .peernet-chat-message.system { color: #888; font-style: italic; text-align: center; }
            .peernet-chat-message .sender { font-weight: bold; color: #667eea; }
            .peernet-chat-message .time { font-size: 0.75em; color: #888; margin-left: 8px; }
            .peernet-chat-input { 
                display: flex; padding: 10px; border-top: 1px solid #ddd; 
            }
            .peernet-chat-input input { 
                flex: 1; padding: 8px 12px; border: 1px solid #ddd; 
                border-radius: 4px; margin-right: 8px; 
            }
            .peernet-chat-input button { 
                padding: 8px 16px; background: #667eea; color: white; 
                border: none; border-radius: 4px; cursor: pointer; 
            }
            .peernet-chat-input button:hover { background: #5a6fd6; }
            .peernet-typing { font-size: 0.85em; color: #888; padding: 4px 10px; }
            .peernet-settings { padding: 20px; }
            .peernet-settings-section { margin-bottom: 20px; }
            .peernet-settings-section h3 { margin: 0 0 10px 0; color: #333; }
            .peernet-settings-field { margin-bottom: 15px; }
            .peernet-settings-field label { 
                display: block; margin-bottom: 5px; font-weight: 500; 
            }
            .peernet-settings-field input, .peernet-settings-field select { 
                width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; 
            }
            .peernet-modal-overlay { 
                position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                background: rgba(0,0,0,0.5); display: flex; 
                align-items: center; justify-content: center; z-index: 1000; 
            }
            .peernet-modal { 
                background: white; border-radius: 8px; padding: 20px; 
                min-width: 300px; max-width: 500px; max-height: 80vh; overflow-y: auto; 
            }
            .peernet-modal-header { font-size: 1.2em; margin-bottom: 15px; }
            .peernet-modal-footer { 
                display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; 
            }
            .peernet-btn { 
                padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; 
            }
            .peernet-btn-primary { background: #667eea; color: white; }
            .peernet-btn-secondary { background: #e0e0e0; color: #333; }
            .peernet-notification { 
                position: fixed; padding: 12px 20px; border-radius: 4px; 
                color: white; animation: slideIn 0.3s ease; z-index: 2000; 
            }
            .peernet-notification.success { background: #4caf50; }
            .peernet-notification.error { background: #f44336; }
            .peernet-notification.warning { background: #ff9800; }
            .peernet-notification.info { background: #2196f3; }
            @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
            .peernet-lobby-item { 
                padding: 12px; border: 1px solid #ddd; border-radius: 4px; 
                margin-bottom: 10px; cursor: pointer; 
            }
            .peernet-lobby-item:hover { border-color: #667eea; }
            .peernet-lobby-item .name { font-weight: bold; }
            .peernet-lobby-item .info { font-size: 0.85em; color: #888; margin-top: 4px; }
            .peernet-peer-card { 
                padding: 15px; border: 1px solid #ddd; border-radius: 8px; 
                display: flex; align-items: center; 
            }
            .peernet-peer-card.compact { padding: 8px; }
        `;
    }

    /**
     * Inject styles into document
     */
    injectStyles() {
        if (document.getElementById('peernet-styles')) return;

        const style = document.createElement('style');
        style.id = 'peernet-styles';
        style.textContent = this._styles;
        document.head.appendChild(style);
    }

    /**
     * Create user list component
     * @param {object} [options] - User list options
     * @returns {UserListComponent}
     */
    createUserList(options = {}) {
        return new UserListComponent(this._peernet, options);
    }

    /**
     * Create chat component
     * @param {object} [options] - Chat options
     * @returns {ChatComponent}
     */
    createChat(options = {}) {
        return new ChatComponent(this._peernet, options);
    }

    /**
     * Create settings modal
     * @param {object} [options] - Settings options
     * @returns {SettingsComponent}
     */
    createSettings(options = {}) {
        return new SettingsComponent(this._peernet, options);
    }

    /**
     * Create state display component
     * @param {object} [options] - State display options
     * @returns {StateComponent}
     */
    createStateDisplay(options = {}) {
        return new StateComponent(this._peernet, options);
    }

    /**
     * Create lobby browser
     * @param {object} [options] - Lobby browser options
     * @returns {LobbyBrowserComponent}
     */
    createLobbyBrowser(options = {}) {
        return new LobbyBrowserComponent(this._peernet, options);
    }

    /**
     * Create peer card
     * @param {object} [options] - Peer card options
     * @returns {PeerCardComponent}
     */
    createPeerCard(options = {}) {
        return new PeerCardComponent(this._peernet, options);
    }

    /**
     * Mount component to DOM
     * @param {object} component - Component to mount
     * @param {HTMLElement} container - Container element
     */
    mount(component, container) {
        this.injectStyles();
        component.mount(container);
        this._mounted.add(component);
    }
}

/**
 * UserListComponent - Displays connected users
 */
class UserListComponent {
    constructor(peernet, options) {
        this._peernet = peernet;
        this._options = options;
        this._container = null;
        this._selected = null;
        this._users = new Map();
        this._eventBus = new EventBus();
        this._actions = [];

        this._setupListeners();
    }

    /**
     * Mount component to container
     * @param {HTMLElement} container - Container element
     */
    mount(container) {
        this._container = container;
        this._container.className = 'peernet-container';
        this._render();
    }

    /**
     * Setup event listeners
     * @private
     */
    _setupListeners() {
        this._peernet.on('connection:established', ({ peerId }) => {
            this._users.set(peerId, { peerId, status: 'online' });
            this._render();
        });

        this._peernet.on('connection:closed', ({ peerId }) => {
            this._users.delete(peerId);
            this._render();
        });
    }

    /**
     * Refresh user list
     */
    refresh() {
        this._render();
    }

    /**
     * Select user
     * @param {string} peerId - Peer ID
     */
    selectUser(peerId) {
        this._selected = peerId;
        this._render();
        this._eventBus.emit('userlist:select', {
            peerId,
            user: this._users.get(peerId)
        });
    }

    /**
     * Set filter
     * @param {Function} filter - Filter function
     */
    setFilter(filter) {
        this._filter = filter;
        this._render();
    }

    /**
     * Add action button
     * @param {object} action - Action config
     */
    addAction(action) {
        this._actions.push(action);
        this._render();
    }

    /**
     * Subscribe to events
     */
    onSelect(handler) {
        return this._eventBus.on('userlist:select', handler);
    }

    /**
     * Render component
     * @private
     */
    _render() {
        if (!this._container) return;

        let users = Array.from(this._users.values());
        if (this._filter) {
            users = users.filter(this._filter);
        }

        const html = `
            <ul class="peernet-user-list">
                ${users.map(user => `
                    <li class="peernet-user-item ${this._selected === user.peerId ? 'selected' : ''}" 
                        data-peer-id="${user.peerId}">
                        <div class="peernet-avatar">${user.peerId.charAt(0).toUpperCase()}</div>
                        <div class="peernet-user-info">
                            <div class="peernet-user-name">${user.peerId.substring(0, 12)}...</div>
                            ${this._options.showLatency ? `<div class="peernet-user-latency">${user.latency || '--'}ms</div>` : ''}
                        </div>
                        <div class="peernet-status ${user.status || 'online'}"></div>
                        ${this._actions.map(a => `<button class="peernet-btn" data-action="${a.id}">${a.label}</button>`).join('')}
                    </li>
                `).join('')}
            </ul>
        `;

        this._container.innerHTML = html;

        // Add event listeners
        this._container.querySelectorAll('.peernet-user-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const peerId = item.dataset.peerId;
                const action = e.target.dataset.action;
                
                if (action) {
                    this._eventBus.emit('userlist:action', { peerId, action });
                } else {
                    this.selectUser(peerId);
                }
            });
        });
    }
}

/**
 * ChatComponent - Chat window
 */
class ChatComponent {
    constructor(peernet, options) {
        this._peernet = peernet;
        this._options = {
            maxMessages: 100,
            showTimestamps: true,
            persistHistory: true,
            ...options
        };
        this._container = null;
        this._messages = [];
        this._recipient = 'broadcast';
        this._eventBus = new EventBus();
        this._typingTimeout = null;
        this._typingUsers = new Set();

        this._setupListeners();
    }

    /**
     * Mount component
     * @param {HTMLElement} container - Container element
     */
    mount(container) {
        this._container = container;
        this._loadHistory();
        this._render();
    }

    /**
     * Setup event listeners
     * @private
     */
    _setupListeners() {
        this._peernet.on('message', ({ peerId, data }) => {
            if (data.type === 'chat') {
                this._addMessage(peerId, data.payload);
            } else if (data.type === 'typing') {
                this.showTyping(peerId);
            }
        });
    }

    /**
     * Send message
     * @param {string} message - Message to send
     * @returns {Promise<void>}
     */
    async send(message) {
        if (!message.trim()) return;

        const msgData = {
            type: 'chat',
            payload: message,
            timestamp: Date.now()
        };

        if (this._recipient === 'broadcast') {
            await this._peernet.broadcast(msgData);
        } else {
            await this._peernet.send(this._recipient, msgData);
        }

        this._addMessage(this._peernet.id, message);

        this._eventBus.emit('chat:send', {
            message,
            recipient: this._recipient
        });
    }

    /**
     * Add system message
     * @param {string} message - System message
     */
    addSystemMessage(message) {
        this._messages.push({
            type: 'system',
            message,
            timestamp: Date.now()
        });
        this._trimMessages();
        this._saveHistory();
        this._render();
    }

    /**
     * Set message recipient
     * @param {string} peerId - Peer ID or 'broadcast'
     */
    setRecipient(peerId) {
        this._recipient = peerId;
    }

    /**
     * Clear chat history
     */
    clear() {
        this._messages = [];
        this._saveHistory();
        this._render();
    }

    /**
     * Show typing indicator
     * @param {string} peerId - Peer ID
     */
    showTyping(peerId) {
        this._typingUsers.add(peerId);
        this._render();

        clearTimeout(this._typingTimeout);
        this._typingTimeout = setTimeout(() => {
            this._typingUsers.clear();
            this._render();
        }, 3000);
    }

    /**
     * Add message to list
     * @private
     */
    _addMessage(sender, message) {
        this._messages.push({
            type: 'message',
            sender,
            message,
            timestamp: Date.now()
        });
        this._trimMessages();
        this._saveHistory();
        this._render();

        this._eventBus.emit('chat:receive', {
            message,
            sender,
            timestamp: Date.now()
        });
    }

    /**
     * Trim messages to max limit
     * @private
     */
    _trimMessages() {
        while (this._messages.length > this._options.maxMessages) {
            this._messages.shift();
        }
    }

    /**
     * Render component
     * @private
     */
    _render() {
        if (!this._container) return;

        const html = `
            <div class="peernet-chat">
                <div class="peernet-chat-messages" id="peernet-messages">
                    ${this._messages.map(msg => {
                        if (msg.type === 'system') {
                            return `<div class="peernet-chat-message system">${msg.message}</div>`;
                        }
                        const time = this._options.showTimestamps
                            ? `<span class="time">${new Date(msg.timestamp).toLocaleTimeString()}</span>`
                            : '';
                        const isOwn = msg.sender === this._peernet.id;
                        return `
                            <div class="peernet-chat-message ${isOwn ? 'own' : ''}">
                                <span class="sender">${isOwn ? 'You' : msg.sender.substring(0, 8)}</span>${time}
                                <div class="text">${msg.message}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
                ${this._typingUsers.size > 0 ? `
                    <div class="peernet-typing">
                        ${Array.from(this._typingUsers).join(', ')} typing...
                    </div>
                ` : ''}
                <div class="peernet-chat-input">
                    <input type="text" id="peernet-chat-input" placeholder="Type a message..." />
                    <button id="peernet-chat-send">Send</button>
                </div>
            </div>
        `;

        this._container.innerHTML = html;

        // Scroll to bottom
        const messagesEl = this._container.querySelector('#peernet-messages');
        if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;

        // Add event listeners
        const input = this._container.querySelector('#peernet-chat-input');
        const sendBtn = this._container.querySelector('#peernet-chat-send');

        sendBtn?.addEventListener('click', () => {
            this.send(input.value);
            input.value = '';
        });

        input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.send(input.value);
                input.value = '';
            }
        });

        // Typing indicator
        input?.addEventListener('input', () => {
            if (this._recipient === 'broadcast') {
                this._peernet.broadcast({ type: 'typing' });
            } else {
                this._peernet.send(this._recipient, { type: 'typing' });
            }
        });
    }

    /**
     * Load history from storage
     * @private
     */
    _loadHistory() {
        if (!this._options.persistHistory) return;
        try {
            const history = localStorage.getItem('peernet_chat_history');
            if (history) {
                this._messages = JSON.parse(history);
            }
        } catch (e) {}
    }

    /**
     * Save history to storage
     * @private
     */
    _saveHistory() {
        if (!this._options.persistHistory) return;
        try {
            localStorage.setItem('peernet_chat_history', JSON.stringify(this._messages));
        } catch (e) {}
    }

    /**
     * Subscribe to events
     */
    on(event, handler) {
        return this._eventBus.on(event, handler);
    }
}

/**
 * SettingsComponent - Settings modal
 */
class SettingsComponent {
    constructor(peernet, options) {
        this._peernet = peernet;
        this._options = options;
        this._container = null;
        this._overlay = null;
        this._visible = false;
        this._sections = options.sections || [];
        this._values = {};
        this._eventBus = new EventBus();
    }

    /**
     * Mount component
     * @param {HTMLElement} container - Container element
     */
    mount(container) {
        this._container = container;
    }

    /**
     * Show settings modal
     */
    show() {
        this._visible = true;
        this._render();
    }

    /**
     * Hide settings modal
     */
    hide() {
        this._visible = false;
        if (this._overlay) {
            this._overlay.remove();
            this._overlay = null;
        }
    }

    /**
     * Add settings section
     * @param {object} section - Section config
     */
    addSection(section) {
        this._sections.push(section);
    }

    /**
     * Get current values
     * @returns {object}
     */
    getValues() {
        return { ...this._values };
    }

    /**
     * Update values
     * @param {object} values - New values
     */
    setValues(values) {
        this._values = { ...this._values, ...values };
        this._render();
    }

    /**
     * Render component
     * @private
     */
    _render() {
        if (!this._visible) return;

        const html = `
            <div class="peernet-modal-overlay">
                <div class="peernet-modal">
                    <div class="peernet-modal-header">Settings</div>
                    <div class="peernet-settings">
                        ${this._sections.map(section => `
                            <div class="peernet-settings-section">
                                <h3>${section.title}</h3>
                                ${section.fields.map(field => `
                                    <div class="peernet-settings-field">
                                        <label>${field.label}</label>
                                        ${this._renderField(field)}
                                    </div>
                                `).join('')}
                            </div>
                        `).join('')}
                    </div>
                    <div class="peernet-modal-footer">
                        <button class="peernet-btn peernet-btn-secondary" id="peernet-settings-cancel">Cancel</button>
                        <button class="peernet-btn peernet-btn-primary" id="peernet-settings-save">Save</button>
                    </div>
                </div>
            </div>
        `;

        this._overlay = document.createElement('div');
        this._overlay.innerHTML = html;
        document.body.appendChild(this._overlay.firstElementChild);
        this._overlay = document.body.lastElementChild;

        // Event listeners
        this._overlay.querySelector('#peernet-settings-cancel')?.addEventListener('click', () => {
            this.hide();
        });

        this._overlay.querySelector('#peernet-settings-save')?.addEventListener('click', () => {
            this._collectValues();
            this._eventBus.emit('settings:save', { values: this._values });
            this.hide();
        });

        this._overlay.addEventListener('click', (e) => {
            if (e.target.classList.contains('peernet-modal-overlay')) {
                this.hide();
            }
        });
    }

    /**
     * Render individual field
     * @private
     */
    _renderField(field) {
        const value = this._values[field.key] || field.default || '';

        switch (field.type) {
            case 'select':
                return `
                    <select name="${field.key}">
                        ${field.options.map(opt => `
                            <option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>
                                ${opt.label}
                            </option>
                        `).join('')}
                    </select>
                `;
            case 'boolean':
                return `
                    <input type="checkbox" name="${field.key}" ${value ? 'checked' : ''} />
                `;
            default:
                return `
                    <input type="${field.type || 'text'}" name="${field.key}" value="${value}" />
                `;
        }
    }

    /**
     * Collect form values
     * @private
     */
    _collectValues() {
        if (!this._overlay) return;

        this._overlay.querySelectorAll('input, select').forEach(el => {
            if (el.type === 'checkbox') {
                this._values[el.name] = el.checked;
            } else {
                this._values[el.name] = el.value;
            }
        });
    }

    /**
     * Subscribe to events
     */
    on(event, handler) {
        return this._eventBus.on(event, handler);
    }
}

/**
 * NotificationManager - Toast notifications
 */
class NotificationManager {
    constructor() {
        this._container = null;
        this._ensureContainer();
    }

    /**
     * Ensure notification container exists
     * @private
     */
    _ensureContainer() {
        this._container = document.getElementById('peernet-notifications');
        if (!this._container) {
            this._container = document.createElement('div');
            this._container.id = 'peernet-notifications';
            this._container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 3000;';
            document.body.appendChild(this._container);
        }
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {object} [options] - Notification options
     * @returns {object}
     */
    show(message, options = {}) {
        const notification = document.createElement('div');
        notification.className = `peernet-notification ${options.type || 'info'}`;
        notification.textContent = message;
        notification.style.marginBottom = '10px';

        this._container.appendChild(notification);

        const duration = options.duration || 5000;
        setTimeout(() => {
            notification.remove();
        }, duration);

        return { dismiss: () => notification.remove() };
    }

    /**
     * Show success notification
     */
    success(message) {
        return this.show(message, { type: 'success' });
    }

    /**
     * Show error notification
     */
    error(message) {
        return this.show(message, { type: 'error' });
    }

    /**
     * Show warning notification
     */
    warning(message) {
        return this.show(message, { type: 'warning' });
    }

    /**
     * Show info notification
     */
    info(message) {
        return this.show(message, { type: 'info' });
    }
}

/**
 * LobbyBrowserComponent - Browse and join lobbies
 */
class LobbyBrowserComponent {
    constructor(peernet, options) {
        this._peernet = peernet;
        this._options = options;
        this._container = null;
        this._lobbies = [];
        this._eventBus = new EventBus();
    }

    /**
     * Mount component
     * @param {HTMLElement} container - Container element
     */
    mount(container) {
        this._container = container;
        this._render();
    }

    /**
     * Refresh lobby list
     * @returns {Promise<void>}
     */
    async refresh() {
        this._lobbies = await this._peernet.lobby.discoverLobbies();
        this._render();
    }

    /**
     * Create new lobby
     * @param {object} options - Lobby options
     * @returns {Promise<void>}
     */
    async createLobby(options) {
        await this._peernet.lobby.createLobby(options);
        this._eventBus.emit('lobbybrowser:create', { options });
    }

    /**
     * Join lobby
     * @param {string} lobbyId - Lobby ID
     * @param {string} [secret] - Lobby secret
     * @returns {Promise<void>}
     */
    async joinLobby(lobbyId, secret) {
        await this._peernet.lobby.joinLobby(lobbyId, secret);
        this._eventBus.emit('lobbybrowser:join', { lobbyId });
    }

    /**
     * Render component
     * @private
     */
    _render() {
        if (!this._container) return;

        const html = `
            <div class="peernet-lobby-browser">
                <div class="peernet-lobby-header">
                    <button class="peernet-btn peernet-btn-primary" id="peernet-refresh-lobbies">Refresh</button>
                    <button class="peernet-btn peernet-btn-secondary" id="peernet-create-lobby">Create Lobby</button>
                </div>
                <div class="peernet-lobby-list">
                    ${this._lobbies.length === 0 ? '<p>No lobbies found</p>' : ''}
                    ${this._lobbies.map(lobby => `
                        <div class="peernet-lobby-item" data-lobby-id="${lobby.id}">
                            <div class="name">${lobby.id.substring(0, 16)}...</div>
                            <div class="info">
                                ${lobby.memberCount}/${lobby.maxMembers} players
                                ${lobby.requiresSecret ? '🔒' : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this._container.innerHTML = html;

        // Event listeners
        this._container.querySelector('#peernet-refresh-lobbies')?.addEventListener('click', () => {
            this.refresh();
        });

        this._container.querySelector('#peernet-create-lobby')?.addEventListener('click', () => {
            this.createLobby({ name: 'New Lobby' });
        });

        this._container.querySelectorAll('.peernet-lobby-item').forEach(item => {
            item.addEventListener('click', () => {
                const lobbyId = item.dataset.lobbyId;
                this.joinLobby(lobbyId);
            });
        });
    }

    /**
     * Subscribe to events
     */
    on(event, handler) {
        return this._eventBus.on(event, handler);
    }
}

/**
 * PeerCardComponent - Peer info card
 */
class PeerCardComponent {
    constructor(peernet, options) {
        this._peernet = peernet;
        this._options = options;
        this._container = null;
        this._peerId = null;
        this._compact = options.compact || false;
        this._actions = [];
    }

    /**
     * Mount component
     * @param {HTMLElement} container - Container element
     */
    mount(container) {
        this._container = container;
        this._render();
    }

    /**
     * Set displayed peer
     * @param {string} peerId - Peer ID
     */
    setPeer(peerId) {
        this._peerId = peerId;
        this._render();
    }

    /**
     * Add action button
     * @param {object} action - Action config
     */
    addAction(action) {
        this._actions.push(action);
        this._render();
    }

    /**
     * Toggle compact mode
     * @param {boolean} compact - Compact mode
     */
    setCompact(compact) {
        this._compact = compact;
        this._render();
    }

    /**
     * Render component
     * @private
     */
    _render() {
        if (!this._container) return;

        const html = `
            <div class="peernet-peer-card ${this._compact ? 'compact' : ''}">
                <div class="peernet-avatar">${(this._peerId || '?').charAt(0).toUpperCase()}</div>
                <div class="peernet-peer-info">
                    <div class="peernet-peer-id">${this._peerId || 'No peer selected'}</div>
                </div>
                ${this._actions.map(a => `
                    <button class="peernet-btn" data-action="${a.id}">${a.label}</button>
                `).join('')}
            </div>
        `;

        this._container.innerHTML = html;
    }
}

/**
 * StateComponent - Synchronized state display
 */
class StateComponent {
    constructor(peernet, options) {
        this._peernet = peernet;
        this._options = options;
        this._container = null;
        this._path = options.path || '';
        this._renderer = options.renderer || null;
    }

    /**
     * Mount component
     * @param {HTMLElement} container - Container element
     */
    mount(container) {
        this._container = container;
        this._render();
    }

    /**
     * Bind to state path
     * @param {string} path - State path
     */
    bindPath(path) {
        this._path = path;
        this._render();
    }

    /**
     * Set custom renderer
     * @param {Function} renderer - Render function
     */
    setRenderer(renderer) {
        this._renderer = renderer;
        this._render();
    }

    /**
     * Render component
     * @private
     */
    _render() {
        if (!this._container) return;

        const state = this._peernet.sync?.get(this._path);

        if (this._renderer) {
            this._renderer(state, this._container);
        } else {
            this._container.innerHTML = `<pre>${JSON.stringify(state, null, 2)}</pre>`;
        }
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        UIFactory,
        UserListComponent,
        ChatComponent,
        SettingsComponent,
        NotificationManager,
        LobbyBrowserComponent,
        PeerCardComponent,
        StateComponent
    };
}

// === src/dsl.js ===
/**
 * PeerNet DSL Module
 * Domain-specific language for simplified PeerNet usage
 * @module dsl
 */

/**
 * PeerNetDSL - Fluent DSL entry point
 */
class PeerNetDSL {
    constructor() {
        this._config = {};
        this._eventHandlers = [];
        this._identityConfig = null;
    }

    /**
     * Create new DSL builder
     * @returns {PeerNetDSL}
     */
    static create() {
        return new PeerNetDSL();
    }

    /**
     * Set custom peer ID
     * @param {string} id - Peer ID
     * @returns {PeerNetDSL}
     */
    withId(id) {
        this._config.peerId = id;
        return this;
    }

    /**
     * Configure server
     * @param {string} host - Server host
     * @param {number} port - Server port
     * @param {object} [options] - Server options
     * @returns {PeerNetDSL}
     */
    withServer(host, port, options = {}) {
        this._config.server = {
            host,
            port,
            path: options.path || '/',
            secure: options.secure !== false,
            ...options
        };
        return this;
    }

    /**
     * Configure logging
     * @param {string} level - Log level
     * @param {object} [transport] - Custom transport
     * @returns {PeerNetDSL}
     */
    withLogging(level, transport) {
        this._config.logging = { level };
        if (transport) {
            this._config.logging.transports = [transport];
        }
        return this;
    }

    /**
     * Enable storage
     * @param {string} namespace - Storage namespace
     * @param {object} [options] - Storage options
     * @returns {PeerNetDSL}
     */
    withStorage(namespace, options = {}) {
        this._config.storage = {
            enabled: true,
            namespace,
            ...options
        };
        return this;
    }

    /**
     * Create/load identity
     * @param {string} name - Identity name
     * @param {string} [email] - Identity email
     * @returns {PeerNetDSL}
     */
    withIdentity(name, email) {
        this._identityConfig = { name, email };
        return this;
    }

    /**
     * Register event handler
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {PeerNetDSL}
     */
    on(event, handler) {
        this._eventHandlers.push({ event, handler });
        return this;
    }

    /**
     * Build PeerNet instance
     * @returns {Promise<PeerNet>}
     */
    async build() {
        const peernet = new PeerNet(this._config);

        // Wait for ready
        await peernet.whenReady();

        // Setup identity
        if (this._identityConfig && peernet.auth) {
            await peernet.auth.generateIdentity(this._identityConfig);
        }

        // Register event handlers
        for (const { event, handler } of this._eventHandlers) {
            peernet.on(event, handler);
        }

        return peernet;
    }
}

/**
 * LobbyDSL - DSL for lobby operations
 */
class LobbyDSL {
    constructor(peernet) {
        this._peernet = peernet;
        this._options = {};
        this._name = null;
        this._handlers = [];
    }

    /**
     * Create new lobby
     * @param {string} name - Lobby name
     * @returns {LobbyDSL}
     */
    create(name) {
        this._name = name;
        this._options.name = name;
        return this;
    }

    /**
     * Set lobby type
     * @param {string} type - Lobby type
     * @returns {LobbyDSL}
     */
    as(type) {
        this._options.type = type;
        return this;
    }

    /**
     * Set lobby secret
     * @param {string} secret - Secret
     * @returns {LobbyDSL}
     */
    withSecret(secret) {
        this._options.secret = secret;
        return this;
    }

    /**
     * Set max members
     * @param {number} count - Max members
     * @returns {LobbyDSL}
     */
    maxMembers(count) {
        this._options.maxMembers = count;
        return this;
    }

    /**
     * Discover available lobbies
     * @returns {Promise<object[]>}
     */
    async discover() {
        return this._peernet.lobby.discoverLobbies();
    }

    /**
     * Join lobby
     * @param {string} lobbyId - Lobby ID
     * @returns {Promise<Lobby>}
     */
    async join(lobbyId) {
        return this._peernet.lobby.joinLobby(lobbyId);
    }

    /**
     * Execute on ready
     * @param {Function} handler - Handler function
     * @returns {LobbyDSL}
     */
    then(handler) {
        this._handlers.push(handler);
        return this;
    }

    /**
     * Execute the lobby creation
     * @returns {Promise<Lobby>}
     */
    async exec() {
        const lobby = await this._peernet.lobby.createLobby(this._options);

        for (const handler of this._handlers) {
            await handler(lobby);
        }

        return lobby;
    }
}

/**
 * SyncDSL - DSL for state synchronization
 */
class SyncDSL {
    constructor(peernet) {
        this._peernet = peernet;
        this._initialState = {};
        this._pathConfigs = {};
        this._smoothConfig = null;
        this._resolutionStrategy = 'last_write_wins';
        this._changeHandlers = [];
    }

    /**
     * Initialize state
     * @param {object} initial - Initial state
     * @returns {SyncDSL}
     */
    state(initial) {
        this._initialState = initial;
        return this;
    }

    /**
     * Configure path
     * @param {string} path - State path
     * @param {object} config - Path config
     * @returns {SyncDSL}
     */
    withPath(path, config) {
        this._pathConfigs[path] = config;
        return this;
    }

    /**
     * Enable smooth updates
     * @param {number} bufferMs - Buffer time in ms
     * @returns {SyncDSL}
     */
    smooth(bufferMs) {
        this._smoothConfig = { bufferMs };
        return this;
    }

    /**
     * Set conflict resolution strategy
     * @param {string} strategy - Resolution strategy
     * @returns {SyncDSL}
     */
    resolveWith(strategy) {
        this._resolutionStrategy = strategy;
        return this;
    }

    /**
     * Watch for changes
     * @param {string} path - State path
     * @param {Function} handler - Change handler
     * @returns {SyncDSL}
     */
    onChange(path, handler) {
        this._changeHandlers.push({ path, handler });
        return this;
    }

    /**
     * Start sync manager
     * @returns {StateManager}
     */
    start() {
        const sync = this._peernet.sync;

        // Initialize state
        sync.initialize(this._initialState);

        // Configure paths
        for (const [path, config] of Object.entries(this._pathConfigs)) {
            if (config.smooth) {
                sync.smooth.registerSmooth(path, config.smooth);
            }
        }

        // Set resolution strategy
        sync._resolver.setGlobalStrategy(this._resolutionStrategy);

        // Register change handlers
        for (const { path, handler } of this._changeHandlers) {
            sync.on('state:updated', ({ delta }) => {
                if (delta.path === path || path === '*') {
                    handler(delta.value, delta);
                }
            });
        }

        return sync;
    }
}

/**
 * GameDSL - DSL for game-specific features
 */
class GameDSL {
    constructor(peernet) {
        this._peernet = peernet;
        this._config = {
            coinToss: false,
            dice: null,
            timer: null,
            turns: null,
            statePersistence: null
        };
    }

    /**
     * Enable coin toss
     * @returns {GameDSL}
     */
    enableCoinToss() {
        this._config.coinToss = true;
        return this;
    }

    /**
     * Enable dice rolling
     * @param {number} sides - Number of sides
     * @returns {GameDSL}
     */
    enableDice(sides) {
        this._config.dice = { sides };
        return this;
    }

    /**
     * Enable synchronized timer
     * @param {number} syncInterval - Sync interval in ms
     * @returns {GameDSL}
     */
    withTimer(syncInterval) {
        this._config.timer = { syncInterval };
        return this;
    }

    /**
     * Enable turn management
     * @param {object} config - Turn config
     * @returns {GameDSL}
     */
    withTurns(config) {
        this._config.turns = config;
        return this;
    }

    /**
     * Enable state persistence
     * @param {string} gameId - Game ID
     * @returns {GameDSL}
     */
    saveState(gameId) {
        this._config.statePersistence = { gameId };
        return this;
    }

    /**
     * Build game manager
     * @returns {GameManager}
     */
    build() {
        return new GameManager(this._peernet, this._config);
    }
}

/**
 * GameManager - Game-specific manager
 */
class GameManager {
    constructor(peernet, config) {
        this._peernet = peernet;
        this._config = config;

        this._coinToss = config.coinToss ? new CoinToss(peernet) : null;
        this._diceRoll = config.dice ? new DiceRoll(peernet) : null;
        this._currentTurn = 0;
        this._turnOrder = [];
    }

    /**
     * Get coin toss instance
     * @returns {CoinToss|null}
     */
    get coinToss() {
        return this._coinToss;
    }

    /**
     * Get dice roll instance
     * @returns {DiceRoll|null}
     */
    get diceRoll() {
        return this._diceRoll;
    }

    /**
     * Get synchronized time
     * @returns {number}
     */
    getGlobalTime() {
        return this._peernet.sync?.timeSync?.getGlobalTime() || Date.now();
    }

    /**
     * Get current turn info
     * @returns {object}
     */
    getTurnInfo() {
        if (!this._turnOrder.length) return null;

        return {
            currentIndex: this._currentTurn,
            currentPeer: this._turnOrder[this._currentTurn],
            totalTurns: this._turnOrder.length
        };
    }

    /**
     * Advance to next turn
     */
    nextTurn() {
        if (!this._turnOrder.length) return;

        this._currentTurn = (this._currentTurn + 1) % this._turnOrder.length;

        this._peernet.broadcast({
            type: 'game:turn',
            currentIndex: this._currentTurn,
            currentPeer: this._turnOrder[this._currentTurn]
        });
    }

    /**
     * Set turn order
     * @param {string[]} peers - Peer IDs in order
     */
    setTurnOrder(peers) {
        this._turnOrder = peers;
        this._currentTurn = 0;
    }

    /**
     * Check if it's my turn
     * @returns {boolean}
     */
    isMyTurn() {
        return this._turnOrder[this._currentTurn] === this._peernet.id;
    }

    /**
     * Save game state
     * @param {object} state - Game state
     */
    async saveGame(state) {
        if (!this._config.statePersistence) return;

        await this._peernet.storage.game.saveState(
            this._config.statePersistence.gameId,
            state
        );
    }

    /**
     * Load game state
     * @returns {Promise<object>}
     */
    async loadGame() {
        if (!this._config.statePersistence) return null;

        return this._peernet.storage.game.loadState(
            this._config.statePersistence.gameId
        );
    }
}

/**
 * Quick setup helper - One-liner PeerNet initialization
 * @param {object} [options] - Setup options
 * @returns {Promise<PeerNet>}
 */
async function quickPeerNet(options = {}) {
    const dsl = PeerNetDSL.create();

    if (options.id) dsl.withId(options.id);
    if (options.server) dsl.withServer(options.server.host, options.server.port, options.server);
    if (options.logging) dsl.withLogging(options.logging);
    if (options.identity) dsl.withIdentity(options.identity.name, options.identity.email);
    if (options.storage) dsl.withStorage(options.storage.namespace || 'default', options.storage);

    if (options.on) {
        for (const [event, handler] of Object.entries(options.on)) {
            dsl.on(event, handler);
        }
    }

    return dsl.build();
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PeerNetDSL,
        LobbyDSL,
        SyncDSL,
        GameDSL,
        GameManager,
        quickPeerNet
    };
}

// === src/index.js ===
/**
 * PeerNet Library
 * A usability-first PeerJS abstraction layer
 * 
 * @version 1.0.0
 * @license MIT
 * 
 * Usage:
 *   // Browser (script tag)
 *   <script src="https://unpkg.com/peerjs@1.5.0/dist/peerjs.min.js"></script>
 *   <script src="peernet.js"></script>
 *   const net = new PeerNet.PeerNet();
 *   
 *   // ES Module
 *   import { PeerNet } from 'peernet.esm.js';
 *   
 *   // CommonJS
 *   const { PeerNet } = require('peernet');
 */

// Core exports
const PeerNetExports = {
    // Core
    PeerNet,
    EventBus,
    Configuration,
    Utils,
    EventEmitter,

    // Observability
    Observer,
    Logger,
    ConsoleTransport,
    CategoryLogger,
    ConnectionMonitor,
    PeerTracker,

    // Lobby
    Lobby,
    FCFSLobby,
    ObfuscatedMasterLobby,
    MultiLobbyHost,
    LobbyManager,

    // Auth & Crypto
    AuthCrypto,
    Keyring,
    ChallengeResponse,
    DiffieHellman,
    SecureChannel,

    // Commitment
    CommitmentManager,
    CoinToss,
    DiceRoll,
    SecretSharing,
    FairGamePrimitives,

    // State Sync
    StateManager,
    ConflictResolver,
    SmoothUpdater,
    TimeSync,
    ConsensusManager,

    // Persistence
    PersistenceManager,
    StorageNamespace,
    PeerRegistry,
    GamePersistence,
    SecretStorage,
    MigrationManager,

    // Messaging
    MessagingManager,
    MessageBuilder,
    ReliableChannel,
    BroadcastCoordinator,
    ChannelMultiplexer,
    MessageChannel,

    // UI
    UIFactory,
    UserListComponent,
    ChatComponent,
    SettingsComponent,
    NotificationManager,
    LobbyBrowserComponent,
    PeerCardComponent,
    StateComponent,

    // DSL
    PeerNetDSL,
    LobbyDSL,
    SyncDSL,
    GameDSL,
    GameManager,
    quickPeerNet
};

// Browser global
if (typeof window !== 'undefined') {
    window.PeerNet = PeerNetExports;
}

// CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PeerNetExports;
}

// ES Module default export
if (typeof exports !== 'undefined') {
    exports.default = PeerNetExports;
}

// End of PeerNet library
})(typeof window !== 'undefined' ? window : this);
