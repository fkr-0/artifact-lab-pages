// PeerModGroove/src/core/audio.js

export class AudioRuntime {
  constructor() {
    this.context = null;
    this.master = null;
    this.analyser = null;
  }

  createContext() {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    return new AudioContextCtor();
  }

  ensureContext() {
    if (!this.context || this.context.state === 'closed') {
      this.context = this.createContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.8;
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 512;
      this.master.connect(this.analyser);
      this.analyser.connect(this.context.destination);
    }
    return this.context;
  }

  async init() {
    this.ensureContext();
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    return this.context;
  }

  async resume() {
    if (!this.context || this.context.state === 'closed') {
      return this.init();
    }
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    return this.context;
  }

  async suspend() {
    if (this.context && this.context.state === 'running') {
      try { await this.context.suspend(); } catch (_) {}
    }
  }

  async dispose() {
    if (!this.context) return;
    const ctx = this.context;
    const master = this.master;
    const analyser = this.analyser;
    this.context = null;
    this.master = null;
    this.analyser = null;
    try { master?.disconnect?.(); } catch (_) {}
    try { analyser?.disconnect?.(); } catch (_) {}
    if (ctx.state !== 'closed') {
      try { await ctx.close(); } catch (_) {}
    }
  }

  setMasterVolume(value) {
    if (!this.master || !this.context) return;
    this.master.gain.setTargetAtTime(value, this.context.currentTime, 0.01);
  }

  get destination() {
    return this.master;
  }
}
