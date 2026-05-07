/* peernet-session-router.js
 * Multi-app session routing: directs session.state to app-specific handlers.
 */
(function(global){
  'use strict';

  function Router(){
    this.routes = {};
  }

  Router.prototype.register = function(app, handler){
    this.routes[app] = handler;
  };

  Router.prototype.apply = function(session){
    if(!session || !session.app) return;
    var handler = this.routes[session.app];
    if(handler) handler(session.state, session);
  };

  global.PeernetSessionRouter = Router;
})(window);
