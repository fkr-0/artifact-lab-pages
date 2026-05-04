/* shared-core-adapter.js
 * Optional additive bridge for Peernet Orca. Include after PeerJS and peernet-shared-core.js.
 * It does not replace Orca's existing room/session system.
 */
(function (global) {
  'use strict';
  var core = null;
  var enabledKey = 'orca-shared-peernet-enabled';

  function isEnabled() { return localStorage.getItem(enabledKey) === 'true'; }
  function setEnabled(v) { localStorage.setItem(enabledKey, v ? 'true' : 'false'); }

  function start(opts) {
    opts = opts || {};
    if (core || !global.PeernetSharedCore) return core;
    core = new global.PeernetSharedCore({
      namespace: 'nexus-peernet-global',
      hubId: 'nexus-peernet-global-hub-01',
      username: opts.username || localStorage.getItem('orca-name') || 'Orca-' + Math.random().toString(36).slice(2, 6),
      color: opts.color || '#00f0ff'
    });
    core.on('*', function (event, payload) {
      global.dispatchEvent(new CustomEvent('orca:shared-peernet', { detail: { event: event, payload: payload } }));
    });
    core.start();
    setEnabled(true);
    return core;
  }

  function stop() {
    if (core) core.stop();
    core = null;
    setEnabled(false);
  }

  global.OrcaSharedPeernet = {
    start: start,
    stop: stop,
    get core() { return core; },
    isEnabled: isEnabled,
    setEnabled: setEnabled
  };

  if (isEnabled()) setTimeout(function () { start(); }, 600);
})(window);
