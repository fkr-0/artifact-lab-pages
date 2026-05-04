/* peernet-mini-apps.js
 * Lobby mini-app toolkit: group chat, file exchange, and out-of-band badger verification.
 * Headless; binds to PeernetSharedCore-compatible send/broadcast/on API.
 */
(function(global){
  'use strict';

  function MiniApps(opts){
    opts = opts || {};
    this.core = opts.core || null;
    this.userManager = opts.userManager || null;
    this.listeners = {};
    this.messages = [];
    this.files = [];
    this.verifications = new Map();
  }

  MiniApps.prototype.on = function(ev, fn){ (this.listeners[ev] = this.listeners[ev] || []).push(fn); return this; };
  MiniApps.prototype.emit = function(ev, data){ (this.listeners[ev]||[]).forEach(fn=>{try{fn(data);}catch(e){console.warn('[PeernetMiniApps]', e);}}); };

  MiniApps.prototype.bind = function(core){
    this.core = core || this.core;
    if(!this.core || typeof this.core.on !== 'function') return this;
    this.core.on('message:lobby-chat', p => this.receiveChat(p));
    this.core.on('message:file-offer', p => this.receiveFileOffer(p));
    this.core.on('message:file-chunk', p => this.receiveFileChunk(p));
    this.core.on('message:verify-badger', p => this.receiveBadger(p));
    return this;
  };

  MiniApps.prototype.profile = function(){ return this.userManager ? this.userManager.snapshot().profile : { username:'me', id:'local' }; };

  MiniApps.prototype.sendChat = function(text){
    const msg = { type:'lobby-chat', id:'msg-'+Math.random().toString(36).slice(2), text, from:this.profile(), at:Date.now() };
    this.messages.push(msg);
    if(this.core && this.core.broadcast) this.core.broadcast(msg);
    this.emit('chat', msg);
    return msg;
  };

  MiniApps.prototype.receiveChat = function(payload){
    const msg = payload && payload.data ? payload.data : payload;
    if(!msg || this.messages.some(m=>m.id===msg.id)) return;
    this.messages.push(msg);
    this.emit('chat', msg);
  };

  MiniApps.prototype.offerFile = async function(peerId, file){
    if(!this.core || !this.core.send || !file) return false;
    const fileId = 'file-'+Math.random().toString(36).slice(2);
    const meta = { type:'file-offer', fileId, name:file.name, size:file.size, mime:file.type, from:this.profile(), at:Date.now() };
    this.core.send(peerId, meta);
    const buf = await file.arrayBuffer();
    const chunkSize = 12000;
    for(let off=0, seq=0; off<buf.byteLength; off+=chunkSize, seq++){
      const chunk = Array.from(new Uint8Array(buf.slice(off, off+chunkSize)));
      this.core.send(peerId, { type:'file-chunk', fileId, seq, done: off+chunkSize>=buf.byteLength, chunk });
    }
    this.emit('file:sent', meta);
    return true;
  };

  MiniApps.prototype.receiveFileOffer = function(payload){
    const data = payload.data || payload;
    data.chunks = [];
    data.receivedBytes = 0;
    this.files.push(data);
    this.emit('file:offer', data);
  };

  MiniApps.prototype.receiveFileChunk = function(payload){
    const data = payload.data || payload;
    const file = this.files.find(f=>f.fileId===data.fileId);
    if(!file) return;
    file.chunks[data.seq] = data.chunk;
    file.receivedBytes += (data.chunk || []).length;
    if(data.done){
      const flat = file.chunks.flat();
      const blob = new Blob([new Uint8Array(flat)], { type:file.mime || 'application/octet-stream' });
      file.url = URL.createObjectURL(blob);
      file.done = true;
      this.emit('file:ready', file);
    } else this.emit('file:progress', file);
  };

  MiniApps.prototype.badger = function(peerId){
    const seed = String(peerId || (this.profile().id || this.profile().username || 'local'));
    const animals = ['🦡','🦊','🐙','🦉','🐸','🦝','🐢','🦋','🐝','🦀','🦑','🐺'];
    const colors = ['cyan','magenta','lime','amber','violet','rose','blue','mint'];
    let h = 0; for(let i=0;i<seed.length;i++) h = ((h<<5)-h)+seed.charCodeAt(i)|0;
    const a = animals[Math.abs(h)%animals.length];
    const c = colors[Math.abs(h>>3)%colors.length];
    const n = Math.abs(h).toString(16).slice(0,4).toUpperCase();
    return { icon:a, color:c, code:n, text:a+' '+c+'-'+n };
  };

  MiniApps.prototype.sendBadger = function(peerId){
    if(!this.core || !this.core.send) return;
    const b = this.badger(this.core.myId || this.profile().id);
    this.core.send(peerId, { type:'verify-badger', badger:b, from:this.profile(), at:Date.now() });
    this.emit('verify:sent', { peerId, badger:b });
  };

  MiniApps.prototype.receiveBadger = function(payload){
    const data = payload.data || payload;
    this.verifications.set(payload.id || (data.from && data.from.id), data.badger);
    this.emit('verify:badger', data);
  };

  global.PeernetMiniApps = MiniApps;
})(window);
