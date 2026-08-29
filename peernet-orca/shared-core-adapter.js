/* shared-core-adapter.js
 * Additive bridge between VAPOR·ORCA and the canonical PeernetSharedCore.
 *
 * Compatibility: OrcaSharedPeernet.start()/stop()/core remain available for
 * older callers. createTransport() exposes the narrow transport contract used
 * by orchestration-core.js without taking ownership of Orca's legacy room flow.
 */
(function (global) {
  'use strict';

  var core = null;
  var enabledKey = 'orca-shared-peernet-enabled';
  var listeners = {};
  var lastOptions = {};
  var boundCore = null;
  var boundPeers = [];
  var adapterReconnectTimer = null;
  var adapterReconnectAttempts = 0;
  var adapterHealthOverride = null;
  var suppressReconnect = false;
  var lastHealth = {
    state: 'idle',
    connected: false,
    role: 'offline',
    peerCount: 0,
    lastError: null
  };

  function storage() {
    return global.localStorage || {
      getItem: function () { return null; },
      setItem: function () {}
    };
  }

  function isEnabled() {
    return storage().getItem(enabledKey) === 'true';
  }

  function setEnabled(value) {
    storage().setItem(enabledKey, value ? 'true' : 'false');
  }

  function safeCall(fn) {
    if (typeof fn !== 'function') return;
    try {
      fn.apply(null, Array.prototype.slice.call(arguments, 1));
    } catch (error) {
      if (global.console && typeof global.console.warn === 'function') {
        global.console.warn('[OrcaSharedPeernet listener]', error);
      }
    }
  }

  function on(event, handler) {
    if (typeof handler !== 'function') return function () {};
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(handler);
    return function () { off(event, handler); };
  }

  function off(event, handler) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(function (entry) { return entry !== handler; });
    if (!listeners[event].length) delete listeners[event];
  }

  function emit(event, payload) {
    (listeners[event] || []).slice().forEach(function (handler) { safeCall(handler, payload); });
    (listeners['*'] || []).slice().forEach(function (handler) { safeCall(handler, event, payload); });
    if (typeof global.dispatchEvent === 'function' && typeof global.CustomEvent === 'function') {
      global.dispatchEvent(
        new global.CustomEvent('orca:shared-peernet', {
          detail: { event: event, payload: payload }
        })
      );
    }
  }

  function readHealth() {
    if (adapterHealthOverride) return Object.assign({}, adapterHealthOverride);
    if (core && typeof core.health === 'function') {
      try {
        return core.health();
      } catch (_) {}
    }
    return Object.assign({}, lastHealth);
  }

  function clearAdapterReconnect(resetAttempts) {
    if (adapterReconnectTimer) clearTimeout(adapterReconnectTimer);
    adapterReconnectTimer = null;
    adapterHealthOverride = null;
    if (resetAttempts) adapterReconnectAttempts = 0;
  }

  function legacyReconnectNeeded(instance) {
    return Boolean(instance && typeof instance.scheduleReconnect !== 'function');
  }

  function adapterReconnectDelay(attempt) {
    var base = Math.max(0, Number(lastOptions.reconnectBaseDelayMs == null ? 750 : lastOptions.reconnectBaseDelayMs));
    var max = Math.max(base, Number(lastOptions.reconnectMaxDelayMs == null ? 12000 : lastOptions.reconnectMaxDelayMs));
    var jitter = Math.max(0, Math.min(1, Number(lastOptions.reconnectJitter == null ? 0.25 : lastOptions.reconnectJitter)));
    var random = typeof lastOptions.random === 'function' ? lastOptions.random : Math.random;
    var exponential = Math.min(max, base * Math.pow(2, Math.max(0, attempt - 1)));
    return Math.round(exponential + exponential * jitter * random());
  }

  function scheduleAdapterReconnect(reason, instance) {
    if (
      suppressReconnect ||
      !core ||
      core !== instance ||
      !instance.started ||
      !legacyReconnectNeeded(instance) ||
      adapterReconnectTimer
    ) return adapterReconnectTimer;

    var attempt = adapterReconnectAttempts + 1;
    var limit = Math.max(0, Number(lastOptions.reconnectMaxAttempts == null ? 8 : lastOptions.reconnectMaxAttempts));
    if (limit && attempt > limit) {
      adapterHealthOverride = Object.assign({}, readHealth(), {
        state: 'offline',
        connected: false,
        role: 'offline',
        reconnectAttempts: adapterReconnectAttempts,
        reconnectLimit: limit,
        nextReconnectAt: null,
        lastError: 'Reconnect limit reached'
      });
      lastHealth = adapterHealthOverride;
      emit('health', adapterHealthOverride);
      emit('degraded', { reason: 'reconnect-limit', health: readHealth() });
      return null;
    }

    var delay = adapterReconnectDelay(attempt);
    var now = typeof lastOptions.now === 'function' ? lastOptions.now() : Date.now();
    adapterHealthOverride = Object.assign({}, readHealth(), {
      state: 'reconnecting',
      connected: false,
      role: 'offline',
      reconnectAttempts: attempt,
      reconnectLimit: limit,
      nextReconnectAt: now + delay,
      lastError: reason || 'Connection lost'
    });
    lastHealth = adapterHealthOverride;
    emit('health', adapterHealthOverride);
    emit('reconnecting', { reason: reason || 'Connection lost', attempt: attempt, delay: delay });

    adapterReconnectTimer = setTimeout(function () {
      adapterReconnectTimer = null;
      adapterReconnectAttempts = attempt;
      adapterHealthOverride = null;
      var options = Object.assign({}, lastOptions);
      suppressReconnect = true;
      try {
        if (core && typeof core.stop === 'function') core.stop();
      } finally {
        suppressReconnect = false;
      }
      core = null;
      boundCore = null;
      boundPeers = [];
      start(options);
    }, delay);
    return adapterReconnectTimer;
  }

  function bindPeerFallback(instance) {
    if (!legacyReconnectNeeded(instance)) return;
    var peer = instance && instance.peer;
    if (!peer || typeof peer.on !== 'function' || boundPeers.indexOf(peer) >= 0) return;
    boundPeers.push(peer);
    function lost(reason) {
      if (
        suppressReconnect ||
        core !== instance ||
        instance.peer !== peer ||
        (instance.state !== 'connected' && instance.state !== 'hosting')
      ) return;
      scheduleAdapterReconnect(reason, instance);
    }
    peer.on('disconnected', function () { lost('Signalling disconnected'); });
    peer.on('close', function () { lost('Peer closed'); });
  }

  function wireCore(instance) {
    if (!instance || instance === boundCore || typeof instance.on !== 'function') return;
    boundCore = instance;
    instance.on('*', function (event, payload) {
      var forwarded = payload;
      if (event === 'health' && payload) {
        lastHealth = payload;
        var hasHubConnection = Boolean(
          instance.isHub ||
          (instance.connections &&
            typeof instance.connections.has === 'function' &&
            instance.connections.has(instance.hubId))
        );
        if (payload.connected && hasHubConnection) clearAdapterReconnect(true);
        if (adapterHealthOverride) forwarded = readHealth();
      }
      if (event === 'open' || event === 'hub:join' || event === 'hub:ready') bindPeerFallback(instance);
      if (
        event === 'peer:leave' &&
        payload &&
        payload.id === instance.hubId &&
        !instance.isHub
      ) scheduleAdapterReconnect('Hub gone', instance);
      emit(event, forwarded);
    });
  }

  function makeCoreOptions(options) {
    options = options || {};
    var out = {
      namespace: options.namespace || 'nexus-peernet-global',
      hubId: options.hubId || 'nexus-peernet-global-hub-01',
      username:
        options.username ||
        storage().getItem('orca-name') ||
        'Orca-' + Math.random().toString(36).slice(2, 6),
      color: options.color || '#00f0ff'
    };
    [
      'Peer',
      'debug',
      'now',
      'random',
      'reconnectBaseDelayMs',
      'reconnectMaxDelayMs',
      'reconnectMaxAttempts',
      'reconnectJitter'
    ].forEach(function (key) {
      if (options[key] !== undefined) out[key] = options[key];
    });
    return out;
  }

  function start(options) {
    options = options || {};
    lastOptions = Object.assign({}, lastOptions, options);
    if (core) {
      if (!core.started && typeof core.start === 'function') core.start();
      setEnabled(true);
      return core;
    }
    if (!global.PeernetSharedCore) {
      lastHealth = {
        state: 'offline',
        connected: false,
        role: 'offline',
        peerCount: 0,
        lastError: 'PeernetSharedCore unavailable'
      };
      emit('health', lastHealth);
      emit('degraded', { reason: 'missing-shared-core', health: readHealth() });
      return null;
    }

    core = new global.PeernetSharedCore(makeCoreOptions(lastOptions));
    wireCore(core);
    var started = core.start();
    bindPeerFallback(core);
    setEnabled(started !== false);
    if (started === false) {
      lastHealth = readHealth();
      emit('degraded', { reason: 'shared-core-start-failed', health: lastHealth });
    }
    return core;
  }

  function stop() {
    clearAdapterReconnect(true);
    suppressReconnect = true;
    try {
      if (core && typeof core.stop === 'function') core.stop();
    } finally {
      suppressReconnect = false;
    }
    core = null;
    boundCore = null;
    boundPeers = [];
    lastHealth = {
      state: 'stopped',
      connected: false,
      role: 'offline',
      peerCount: 0,
      lastError: null
    };
    setEnabled(false);
    emit('health', lastHealth);
  }

  function restart(options) {
    options = Object.assign({}, lastOptions, options || {});
    clearAdapterReconnect(true);
    suppressReconnect = true;
    try {
      if (core && typeof core.stop === 'function') core.stop();
    } finally {
      suppressReconnect = false;
    }
    core = null;
    boundCore = null;
    boundPeers = [];
    return start(options);
  }

  function diagnostics() {
    if (core && typeof core.diagnostics === 'function') return core.diagnostics();
    return readHealth();
  }

  function createTransport(options) {
    options = Object.assign({}, options || {});
    var channel = options.channel || 'orca-orchestration';
    var ownsCore = options.ownsCore === true;

    return {
      start: function () {
        return Boolean(start(options));
      },

      stop: function () {
        if (ownsCore) stop();
      },

      subscribe: function (handler) {
        if (typeof handler !== 'function') return function () {};
        return on('message:' + channel, function (payload) {
          var data = payload && payload.data;
          var envelope = data && data.envelope !== undefined ? data.envelope : data;
          handler(envelope, {
            peerId: (payload && payload.id) || '',
            entry: (payload && payload.entry) || null,
            channel: channel
          });
        });
      },

      onHealth: function (handler) {
        if (typeof handler !== 'function') return function () {};
        var unsubscribe = on('health', handler);
        safeCall(handler, readHealth());
        return unsubscribe;
      },

      broadcast: function (envelope) {
        var instance = start(options);
        if (!instance || typeof instance.broadcast !== 'function') return 0;
        var connectedBefore = instance.connections && typeof instance.connections.size === 'number'
          ? instance.connections.size
          : 0;
        var result = instance.broadcast({
          type: channel,
          envelope: envelope,
          at: Date.now()
        });
        return typeof result === 'number' ? result : result === false ? 0 : connectedBefore;
      },

      send: function (peerId, envelope) {
        var instance = start(options);
        if (!instance || typeof instance.send !== 'function' || !peerId) return false;
        var entry = instance.connections && typeof instance.connections.get === 'function'
          ? instance.connections.get(peerId)
          : null;
        var wasConnected = Boolean(entry && entry.conn && entry.conn.open);
        var result = instance.send(peerId, {
          type: channel,
          envelope: envelope,
          at: Date.now()
        });
        return result === undefined ? wasConnected : result !== false;
      },

      health: readHealth,
      diagnostics: diagnostics,
      get core() { return core; }
    };
  }

  global.OrcaSharedPeernet = {
    start: start,
    stop: stop,
    restart: restart,
    on: on,
    off: off,
    health: readHealth,
    diagnostics: diagnostics,
    createTransport: createTransport,
    get core() { return core; },
    isEnabled: isEnabled,
    setEnabled: setEnabled
  };

  if (isEnabled()) {
    setTimeout(function () { start(); }, 600);
  }
})(typeof window !== 'undefined' ? window : globalThis);
