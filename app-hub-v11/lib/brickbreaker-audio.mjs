export function createBrickbreakerAudio(runtime = globalThis) {
  let context = null;
  function ensure() {
    const AudioContext = runtime.AudioContext || runtime.webkitAudioContext;
    if (!AudioContext) return null;
    context ||= new AudioContext();
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
    unlock() { ensure()?.resume?.(); },
    paddle() { blip(320, 0.035, 'triangle', 0.035); },
    brick() { blip(680, 0.045, 'square', 0.03); },
    powerup() { blip(920, 0.08, 'sine', 0.045); },
    lifeLost() { blip(120, 0.16, 'sawtooth', 0.05); },
  };
}
