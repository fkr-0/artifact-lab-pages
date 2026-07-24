export function createBrickbreakerAudio(runtime = globalThis) {
  let context = null;
  function ensure() {
    const AudioContext = runtime.AudioContext || runtime.webkitAudioContext;
    if (!AudioContext) return null;
    if (!context || context.state === 'closed') {
      context = new AudioContext();
    }
    return context;
  }
  function blip(frequency = 440, duration = 0.04, type = 'sine', gainValue = 0.04) {
    const ctx = ensure();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.value = gainValue;
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    oscillator.stop(ctx.currentTime + duration);
  }
  return {
    async unlock() {
      const ctx = ensure();
      if (ctx && ctx.state === 'suspended') {
        try { await ctx.resume(); } catch (_) {}
      }
      return ctx;
    },
    async resume() {
      if (context && context.state === 'suspended') {
        try { await context.resume(); } catch (_) {}
      }
      return context;
    },
    async suspend() {
      if (context && context.state === 'running') {
        try { await context.suspend(); } catch (_) {}
      }
    },
    async dispose() {
      if (!context) return;
      const ctx = context;
      context = null;
      if (ctx.state !== 'closed') {
        try { await ctx.close(); } catch (_) {}
      }
    },
    paddle() { blip(320, 0.035, 'triangle', 0.035); },
    brick() { blip(680, 0.045, 'square', 0.03); },
    powerup() { blip(920, 0.08, 'sine', 0.045); },
    lifeLost() { blip(120, 0.16, 'sawtooth', 0.05); },
  };
}
