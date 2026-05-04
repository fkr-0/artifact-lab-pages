/* peernet-app-loader.js
 * Session-aware app loader: bridges session state <-> v9 app deck.
 * Additive: wraps existing openApp logic if present.
 */
(function(global){
  'use strict';

  function AppLoader(opts){
    opts = opts || {};
    this.sessionManager = opts.sessionManager || null;
    this.applyState = opts.applyState || function(){};
    this.captureState = opts.captureState || function(){ return {}; };
    this.listeners = {};
  }

  AppLoader.prototype.on = function(ev, fn){
    (this.listeners[ev] = this.listeners[ev] || []).push(fn);
  };

  AppLoader.prototype.emit = function(ev, data){
    (this.listeners[ev]||[]).forEach(fn=>{try{fn(data);}catch(e){}});
  };

  AppLoader.prototype.bind = function(){
    if(!this.sessionManager) return;

    this.sessionManager.on('session:join', s=>{
      if(s && s.state) this.applyState(s.state);
      this.emit('session:applied', s);
    });

    this.sessionManager.on('session:remote-update', s=>{
      if(s && s.state) this.applyState(s.state);
      this.emit('session:applied', s);
    });
  };

  AppLoader.prototype.wrapOpenApp = function(){
    if(!global.openApp) return;
    const original = global.openApp;
    const self = this;

    global.openApp = function(){
      const res = original.apply(this, arguments);

      if(self.sessionManager){
        const active = self.sessionManager.getActiveSession && self.sessionManager.getActiveSession();
        if(active){
          active.state = self.captureState();
          self.sessionManager.updateActiveState(active.state);
        }
      }

      return res;
    };
  };

  global.PeernetAppLoader = AppLoader;
})(window);
