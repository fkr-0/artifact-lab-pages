/**
 * GROOVE STATION - P2P Collaborative Music Studio
 * Plain JavaScript, Client-Side Only
 * Uses Web Audio API and PeerJS for P2P sync
 * Version 3.0 - Advanced Arps, FM Synth, Wavetable, More Effects
 */

(function() {
  'use strict';

  // ============================================
  // USER COLORS PALETTE
  // ============================================
  const USER_COLORS = [
    '#00ffff', '#ff00ff', '#00ff88', '#ff3366',
    '#ffaa00', '#ff6ec7', '#01cdfe', '#b967ff',
    '#05ffa1', '#f0e68c', '#33ff00', '#ff71ce'
  ];

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  const Utils = {
    generateId: (prefix = '') => {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 9);
      return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
    },

    clamp: (value, min, max) => Math.min(Math.max(value, min), max),

    map: (value, inMin, inMax, outMin, outMax) => {
      return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    },

    debounce: (func, wait) => {
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

    deepClone: (obj) => JSON.parse(JSON.stringify(obj)),

    formatTime: () => {
      const now = new Date();
      return now.toLocaleTimeString('en-US', { hour12: false });
    },

    getUserColor: (index) => USER_COLORS[index % USER_COLORS.length],

    midiToFreq: (midi) => 440 * Math.pow(2, (midi - 69) / 12),

    freqToMidi: (freq) => Math.round(69 + 12 * Math.log2(freq / 440)),

    noteToMidi: (note) => {
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const octave = parseInt(note.slice(-1));
      const pitch = note.slice(0, -1);
      const noteIndex = notes.indexOf(pitch);
      if (noteIndex === -1) return 60;
      return (octave + 1) * 12 + noteIndex;
    },

    midiToNote: (midi) => {
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const octave = Math.floor(midi / 12) - 1;
      const note = notes[midi % 12];
      return `${note}${octave}`;
    },

    // Scale patterns for arpeggiator
    scales: {
      major: [0, 2, 4, 5, 7, 9, 11],
      minor: [0, 2, 3, 5, 7, 8, 10],
      pentatonic: [0, 2, 4, 7, 9],
      blues: [0, 3, 5, 6, 7, 10],
      chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      dorian: [0, 2, 3, 5, 7, 9, 10],
      mixolydian: [0, 2, 4, 5, 7, 9, 10],
      phrygian: [0, 1, 3, 5, 7, 8, 10]
    },

    getScaleNotes(rootNote, scaleName) {
      const rootMidi = this.noteToMidi(rootNote);
      const scale = this.scales[scaleName] || this.scales.major;
      const notes = [];
      // Get 3 octaves of the scale
      for (let octave = 0; octave < 3; octave++) {
        for (const interval of scale) {
          notes.push(this.midiToNote(rootMidi + interval + (octave * 12)));
        }
      }
      return notes;
    }
  };

  // ============================================
  // AUDIO ENGINE
  // ============================================
  class AudioEngine {
    constructor() {
      this.context = null;
      this.masterGain = null;
      this.analyser = null;
      this.limiter = null;
      this.compressor = null;
      this.effectsChain = [];
      this.isPlaying = false;
      this.bpm = 120;
      this.currentBeat = 0;
      this.schedulerInterval = null;
      this.nextNoteTime = 0;
      this.scheduleAheadTime = 0.1;
      this.lookAhead = 25;
      this._handlers = new Map();
    }

    async init() {
      if (this.context) {
        if (this.context.state === 'suspended') {
          await this.context.resume();
        }
        return;
      }

      this.context = new (window.AudioContext || window.webkitAudioContext)();

      // Master compressor
      this.compressor = this.context.createDynamicsCompressor();
      this.compressor.threshold.value = -12;
      this.compressor.knee.value = 30;
      this.compressor.ratio.value = 4;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;

      // Limiter
      this.limiter = this.context.createDynamicsCompressor();
      this.limiter.threshold.value = -3;
      this.limiter.knee.value = 0;
      this.limiter.ratio.value = 20;
      this.limiter.attack.value = 0.001;
      this.limiter.release.value = 0.1;

      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.8;

      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 256;

      // Chain: compressor -> limiter -> master -> analyser -> destination
      this.compressor.connect(this.limiter);
      this.limiter.connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.context.destination);

      // Metronome
      this.metronomeGain = this.context.createGain();
      this.metronomeGain.gain.value = 0.5;
      this.metronomeGain.connect(this.masterGain);
    }

    get currentTime() {
      return this.context ? this.context.currentTime : 0;
    }

    setMasterVolume(value) {
      if (this.masterGain) {
        this.masterGain.gain.setValueAtTime(value, this.context.currentTime);
      }
    }

    setMetronomeVolume(value) {
      if (this.metronomeGain) {
        this.metronomeGain.gain.setValueAtTime(value, this.context.currentTime);
      }
    }

    getAnalyserData() {
      if (!this.analyser) return new Uint8Array(128);
      const data = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(data);
      return data;
    }

    playMetronome(accent = false) {
      if (!this.context) return;

      const osc = this.context.createOscillator();
      const gain = this.context.createGain();

      osc.type = 'sine';
      osc.frequency.value = accent ? 1000 : 800;

      gain.gain.setValueAtTime(0.3, this.context.currentTime);
      gain.gain.setTargetAtTime(0.0001, this.context.currentTime, 0.02);

      osc.connect(gain);
      gain.connect(this.metronomeGain);

      osc.start();
      osc.stop(this.context.currentTime + 0.05);
    }

    createOscillator(type = 'sine', frequency = 440) {
      if (!this.context) return null;
      const osc = this.context.createOscillator();
      osc.type = type;
      osc.frequency.value = frequency;
      return osc;
    }

    createGain(value = 1) {
      if (!this.context) return null;
      const gain = this.context.createGain();
      gain.gain.value = value;
      return gain;
    }

    createFilter(type = 'lowpass', frequency = 1000, Q = 1) {
      if (!this.context) return null;
      const filter = this.context.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = frequency;
      filter.Q.value = Q;
      return filter;
    }

    createBufferSource(buffer) {
      if (!this.context) return null;
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      return source;
    }

    createWaveShaper(curve) {
      if (!this.context) return null;
      const shaper = this.context.createWaveShaper();
      shaper.curve = curve;
      shaper.oversample = '4x';
      return shaper;
    }

    decodeAudioData(arrayBuffer) {
      if (!this.context) return Promise.reject('No context');
      return this.context.decodeAudioData(arrayBuffer);
    }

    getDestination() {
      return this.compressor;
    }

    start() {
      if (this.isPlaying) return;
      this.isPlaying = true;
      this.currentBeat = 0;
      this.nextNoteTime = this.context.currentTime;
      this.scheduler();
    }

    stop() {
      this.isPlaying = false;
      if (this.schedulerInterval) {
        clearInterval(this.schedulerInterval);
        this.schedulerInterval = null;
      }
    }

    scheduler() {
      const schedule = () => {
        while (this.nextNoteTime < this.context.currentTime + this.scheduleAheadTime) {
          this.emit('beat', { beat: this.currentBeat, time: this.nextNoteTime });
          this.nextBeat();
        }
      };

      this.schedulerInterval = setInterval(schedule, this.lookAhead);
    }

    nextBeat() {
      const secondsPerBeat = 60.0 / this.bpm;
      this.nextNoteTime += secondsPerBeat / 4;
      this.currentBeat = (this.currentBeat + 1) % (16 * 4);
    }

    on(event, handler) {
      if (!this._handlers.has(event)) this._handlers.set(event, new Set());
      this._handlers.get(event).add(handler);
    }

    off(event, handler) {
      this._handlers.get(event)?.delete(handler);
    }

    emit(event, data) {
      this._handlers.get(event)?.forEach(handler => handler(data));
    }
  }

  // ============================================
  // ARPEGGIATOR
  // ============================================
  class Arpeggiator {
    constructor(engine, config = {}) {
      this.engine = engine;
      this.enabled = config.enabled ?? false;
      this.mode = config.mode || 'up'; // up, down, updown, random, played, chord
      this.octaves = config.octaves ?? 1;
      this.rate = config.rate ?? 4; // steps per beat (1=quarter, 2=eighth, 4=sixteenth, 8=thirtysecond)
      this.gate = config.gate ?? 0.8; // note length as proportion of step
      this.swing = config.swing ?? 0; // 0-1 swing amount
      this.heldNotes = [];
      this.currentOctave = 0;
      this.direction = 1;
      this.stepIndex = 0;
    }

    setMode(mode) {
      this.mode = mode;
      this.reset();
    }

    setOctaves(octaves) {
      this.octaves = octaves;
    }

    setRate(rate) {
      this.rate = rate;
    }

    setGate(gate) {
      this.gate = gate;
    }

    setSwing(swing) {
      this.swing = swing;
    }

    holdNote(note) {
      const midi = Utils.noteToMidi(note);
      if (!this.heldNotes.includes(midi)) {
        this.heldNotes.push(midi);
        this.heldNotes.sort((a, b) => a - b);
      }
    }

    releaseNote(note) {
      const midi = Utils.noteToMidi(note);
      const index = this.heldNotes.indexOf(midi);
      if (index >= 0) {
        this.heldNotes.splice(index, 1);
      }
    }

    clear() {
      this.heldNotes = [];
      this.reset();
    }

    reset() {
      this.stepIndex = 0;
      this.direction = 1;
      this.currentOctave = 0;
    }

    // Get the note(s) to play at a given beat
    getNotesAtBeat(beat) {
      if (!this.enabled || this.heldNotes.length === 0) return [];

      const stepsPerBeat = this.rate;
      const step = Math.floor(beat * stepsPerBeat / 4);
      const totalNotes = this.heldNotes.length * this.octaves;

      let notes = [];

      switch (this.mode) {
        case 'up':
          notes = this.getUpNotes(step, totalNotes);
          break;
        case 'down':
          notes = this.getDownNotes(step, totalNotes);
          break;
        case 'updown':
          notes = this.getUpDownNotes(step, totalNotes);
          break;
        case 'random':
          notes = this.getRandomNotes();
          break;
        case 'played':
          notes = this.getPlayedNotes(step);
          break;
        case 'chord':
          notes = this.getChordNotes();
          break;
        default:
          notes = this.getUpNotes(step, totalNotes);
      }

      return notes;
    }

    getUpNotes(step, totalNotes) {
      const index = step % totalNotes;
      const noteIndex = index % this.heldNotes.length;
      const octaveOffset = Math.floor(index / this.heldNotes.length);
      return [this.heldNotes[noteIndex] + (octaveOffset * 12)];
    }

    getDownNotes(step, totalNotes) {
      const index = step % totalNotes;
      const noteIndex = (totalNotes - 1 - index) % this.heldNotes.length;
      const octaveOffset = Math.floor((totalNotes - 1 - index) / this.heldNotes.length);
      return [this.heldNotes[noteIndex] + (octaveOffset * 12)];
    }

    getUpDownNotes(step, totalNotes) {
      const cycle = (totalNotes - 1) * 2;
      if (cycle <= 0) return [this.heldNotes[0]];

      const index = step % cycle;
      if (index < totalNotes - 1) {
        return this.getUpNotes(index, totalNotes);
      } else {
        return this.getDownNotes(index - (totalNotes - 1), totalNotes);
      }
    }

    getRandomNotes() {
      if (this.heldNotes.length === 0) return [];
      const randomIndex = Math.floor(Math.random() * this.heldNotes.length);
      const octaveOffset = Math.floor(Math.random() * this.octaves) * 12;
      return [this.heldNotes[randomIndex] + octaveOffset];
    }

    getPlayedNotes(step) {
      const index = step % this.heldNotes.length;
      return [this.heldNotes[index]];
    }

    getChordNotes() {
      // Return all held notes with octave spread
      const notes = [];
      for (let oct = 0; oct < this.octaves; oct++) {
        for (const note of this.heldNotes) {
          notes.push(note + (oct * 12));
        }
      }
      return notes;
    }

    getGateDuration() {
      const secondsPerBeat = 60.0 / this.engine.bpm;
      const stepDuration = secondsPerBeat * 4 / this.rate;
      return stepDuration * this.gate;
    }

    getSwingOffset(step) {
      if (this.swing <= 0) return 0;
      // Apply swing to off-beats
      if (step % 2 === 1) {
        const secondsPerBeat = 60.0 / this.engine.bpm;
        const stepDuration = secondsPerBeat * 4 / this.rate;
        return stepDuration * this.swing * 0.5;
      }
      return 0;
    }

    toJSON() {
      return {
        enabled: this.enabled,
        mode: this.mode,
        octaves: this.octaves,
        rate: this.rate,
        gate: this.gate,
        swing: this.swing
      };
    }

    fromJSON(data) {
      if (!data) return;
      this.enabled = data.enabled ?? false;
      this.mode = data.mode || 'up';
      this.octaves = data.octaves ?? 1;
      this.rate = data.rate ?? 4;
      this.gate = data.gate ?? 0.8;
      this.swing = data.swing ?? 0;
    }
  }

  // ============================================
  // SOUND GENERATORS
  // ============================================

  class SoundGenerator {
    constructor(engine, config = {}) {
      this.engine = engine;
      this.id = config.id || Utils.generateId('mod');
      this.name = config.name || 'Module';
      this.type = 'base';
      this.ownerId = config.ownerId;
      this.ownerColor = config.ownerColor || '#00ffff';
      this.volume = config.volume ?? 0.8;
      this.pan = config.pan ?? 0;
      this.muted = false;
      this.solo = false;
      this.position = config.position || { x: 0, y: 0 };
      this.gainNode = null;
      this.panNode = null;
      this.outputNode = null;
      this.connectedDestination = null;
      this.arpeggiator = new Arpeggiator(engine, config.arpeggiator || {});
      this.init();
    }

    init() {}

    ensureAudioNodes() {
      if (this.outputNode || !this.engine.context) return this.outputNode;
      this.gainNode = this.engine.createGain(this.muted ? 0 : this.volume);
      this.panNode = this.engine.context.createStereoPanner();
      this.panNode.pan.value = this.pan;
      this.gainNode.connect(this.panNode);
      this.outputNode = this.panNode;
      if (this.connectedDestination) this.outputNode.connect(this.connectedDestination);
      return this.outputNode;
    }

    connect(destination) {
      this.connectedDestination = destination;
      const output = this.ensureAudioNodes();
      if (output && destination) {
        try { output.disconnect(); } catch (_) {}
        output.connect(destination);
      }
    }

    disconnect() {
      try { this.outputNode?.disconnect(); } catch (_) {}
    }

    getRigPort() {
      return {
        id: this.id,
        name: this.name,
        type: this.type,
        output: this.outputNode,
        muted: this.muted,
        solo: this.solo,
        volume: this.volume,
        pan: this.pan,
        playNote: (note, time, duration) => this.playNote(note, time, duration),
        stopNote: (note, time) => this.stopNote(note, time),
        connect: (destination) => this.connect(destination),
        disconnect: () => this.disconnect()
      };
    }

    setVolume(value) {
      this.volume = value;
      this.ensureAudioNodes();
      if (this.gainNode) {
        this.gainNode.gain.setValueAtTime(this.muted ? 0 : value, this.engine.context.currentTime);
      }
    }

    setPan(value) {
      this.pan = value;
      this.ensureAudioNodes();
      if (this.panNode) {
        this.panNode.pan.setValueAtTime(value, this.engine.context.currentTime);
      }
    }

    setMuted(muted) {
      this.muted = muted;
      this.ensureAudioNodes();
      if (this.gainNode) {
        this.gainNode.gain.setValueAtTime(muted ? 0 : this.volume, this.engine.context.currentTime);
      }
    }

    playNote(note, time, duration) {}
    stopNote(note) {}
    loadSample(url) {}

    setPosition(x, y) {
      this.position = { x, y };
    }

    toJSON() {
      return {
        id: this.id,
        name: this.name,
        type: this.type,
        ownerId: this.ownerId,
        ownerColor: this.ownerColor,
        volume: this.volume,
        pan: this.pan,
        muted: this.muted,
        solo: this.solo,
        position: this.position,
        arpeggiator: this.arpeggiator.toJSON()
      };
    }
  }

  const SoundModuleCatalog = {
    'field-recorder': { type: 'sampler', name: 'Field Recorder', description: 'Audio capture or imported field sample module' },
    'groove-station': { type: 'rack', name: 'Groove Station', description: 'Drum and one-shot groove module' },
    'synthesizer': { type: 'synth', name: 'Synthesizer', description: 'Basic subtractive synth voice' },
    'peer-music-groove': { type: 'multisynth', name: 'Peer Music Groove', description: 'Collaborative multi-osc synth voice' },
    'wave-synth-modular': { type: 'wavetable', name: 'Wave Synth Modular', description: 'Wavetable oscillator module' },
    'nexus-field-recorder': { type: 'sampler', name: 'NEXUS Field Recorder', description: 'NEXUS-branded field sample module' }
  };

  class RigMixer {
    constructor(engine) {
      this.engine = engine;
      this.modules = new Map();
    }

    get destination() {
      return this.engine.getDestination();
    }

    add(module) {
      module.connect(this.destination);
      this.modules.set(module.id, module);
      return module.getRigPort();
    }

    remove(moduleId) {
      const module = this.modules.get(moduleId);
      if (!module) return false;
      module.disconnect();
      this.modules.delete(moduleId);
      return true;
    }

    getPorts() {
      return Array.from(this.modules.values()).map(module => module.getRigPort());
    }
  }

  // Sampler
  class Sampler extends SoundGenerator {
    constructor(engine, config = {}) {
      super(engine, config);
      this.type = 'sampler';
      this.buffer = null;
      this.sampleUrl = config.sampleUrl || null;
      this.sampleName = config.sampleName || 'No sample';
      this.pitch = config.pitch ?? 0;
      this.activeVoices = new Map();
      this.attack = config.attack ?? 0.001;
      this.release = config.release ?? 0.1;
      this.loop = config.loop ?? false;
      this.startPoint = config.startPoint ?? 0;
      this.endPoint = config.endPoint ?? 1;
    }

    init() {
      this.ensureAudioNodes();
    }

    async loadSample(url) {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        this.buffer = await this.engine.decodeAudioData(arrayBuffer);
        this.sampleUrl = url;
        this.sampleName = url.split('/').pop() || 'Sample';
        return true;
      } catch (error) {
        console.error('Failed to load sample:', error);
        return false;
      }
    }

    async loadFile(file) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        this.buffer = await this.engine.decodeAudioData(arrayBuffer);
        this.sampleUrl = file.name;
        this.sampleName = file.name;
        return true;
      } catch (error) {
        console.error('Failed to load file:', error);
        return false;
      }
    }

    playNote(note, time, duration) {
      if (!this.buffer || this.muted) return;
      this.ensureAudioNodes();

      const ctx = this.engine.context;
      const source = ctx.createBufferSource();
      source.buffer = this.buffer;

      const pitchMultiplier = typeof note === 'string' 
        ? Math.pow(2, (Utils.noteToMidi(note) - 60) / 12)
        : Math.pow(2, this.pitch / 12);
      source.playbackRate.value = pitchMultiplier;

      source.loop = this.loop;
      if (this.loop) {
        source.loopStart = this.startPoint * this.buffer.duration;
        source.loopEnd = this.endPoint * this.buffer.duration;
      }

      const envGain = ctx.createGain();
      envGain.gain.setValueAtTime(0, time);
      envGain.gain.linearRampToValueAtTime(1, time + this.attack);

      source.connect(envGain);
      envGain.connect(this.gainNode);
      source.start(time);

      const noteId = note || Utils.generateId('note');
      this.activeVoices.set(noteId, { source, envGain });
      if (duration) {
        this.stopNote(noteId, time + duration);
      }

      source.onended = () => {
        this.activeVoices.delete(noteId);
      };

      return noteId;
    }

    stopNote(note, time) {
      const voice = this.activeVoices.get(note);
      if (voice) {
        const stopTime = time || this.engine.context.currentTime;
        voice.envGain.gain.cancelScheduledValues(stopTime);
        voice.envGain.gain.setValueAtTime(voice.envGain.gain.value, stopTime);
        voice.envGain.gain.linearRampToValueAtTime(0, stopTime + this.release);
        voice.source.stop(stopTime + this.release + 0.01);
        this.activeVoices.delete(note);
      }
    }

    toJSON() {
      return {
        ...super.toJSON(),
        sampleUrl: this.sampleUrl,
        sampleName: this.sampleName,
        pitch: this.pitch,
        attack: this.attack,
        release: this.release,
        loop: this.loop
      };
    }
  }

  // Rack
  class Rack extends SoundGenerator {
    constructor(engine, config = {}) {
      super(engine, config);
      this.type = 'rack';
      this.pads = config.pads || Array(8).fill(null).map((_, i) => ({
        id: i,
        name: `Pad ${i + 1}`,
        buffer: null,
        sampleUrl: null,
        sampleName: null
      }));
    }

    init() {
      this.ensureAudioNodes();
    }

    async loadPadSample(padIndex, file) {
      if (padIndex < 0 || padIndex >= this.pads.length) return false;

      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = await this.engine.decodeAudioData(arrayBuffer);
        this.pads[padIndex].buffer = buffer;
        this.pads[padIndex].sampleUrl = file.name;
        this.pads[padIndex].sampleName = file.name;
        return true;
      } catch (error) {
        console.error('Failed to load pad sample:', error);
        return false;
      }
    }

    playNote(note, time, duration) {
      if (this.muted) return;
      this.ensureAudioNodes();

      const padIndex = typeof note === 'number' ? note : parseInt(note);
      if (isNaN(padIndex) || padIndex < 0 || padIndex >= this.pads.length) return;

      const pad = this.pads[padIndex];
      if (!pad.buffer) return;

      const source = this.engine.createBufferSource(pad.buffer);
      if (!source) return;

      source.connect(this.gainNode);
      source.start(time);
    }

    toJSON() {
      return {
        ...super.toJSON(),
        pads: this.pads.map(p => ({ name: p.name, sampleUrl: p.sampleUrl, sampleName: p.sampleName }))
      };
    }
  }

  // MultiOsc Synth - Advanced synthesizer with multiple oscillators
  class MultiOscSynth extends SoundGenerator {
    constructor(engine, config = {}) {
      super(engine, config);
      this.type = 'multisynth';
      
      // Oscillator settings
      this.oscillators = config.oscillators || [
        { type: 'sawtooth', detune: 0, volume: 0.5, octave: 0 },
        { type: 'square', detune: 7, volume: 0.3, octave: -1 }
      ];
      
      // Filter
      this.filterType = config.filterType || 'lowpass';
      this.filterFreq = config.filterFreq ?? 2000;
      this.filterQ = config.filterQ ?? 2;
      this.filterEnvAmount = config.filterEnvAmount ?? 0;
      this.filterAttack = config.filterAttack ?? 0.01;
      this.filterDecay = config.filterDecay ?? 0.2;
      this.filterSustain = config.filterSustain ?? 0.3;
      
      // Amp envelope
      this.attack = config.attack ?? 0.01;
      this.decay = config.decay ?? 0.1;
      this.sustain = config.sustain ?? 0.7;
      this.release = config.release ?? 0.3;
      
      // FM synthesis
      this.fmEnabled = config.fmEnabled ?? false;
      this.fmRatio = config.fmRatio ?? 2;
      this.fmAmount = config.fmAmount ?? 100;
      
      // Unison
      this.unison = config.unison ?? 1;
      this.unisonDetune = config.unisonDetune ?? 10;
      
      this.activeVoices = new Map();
    }

    init() {
      this.ensureAudioNodes();
    }

    playNote(note, time, duration) {
      if (this.muted) return;
      this.ensureAudioNodes();

      const ctx = this.engine.context;
      const freq = Utils.midiToFreq(Utils.noteToMidi(note));
      const voiceId = note;

      const voice = {
        oscillators: [],
        gains: [],
        filter: null,
        envGain: null,
        fmOsc: null,
        fmGain: null
      };

      // Create filter
      voice.filter = ctx.createBiquadFilter();
      voice.filter.type = this.filterType;
      voice.filter.frequency.value = this.filterFreq;
      voice.filter.Q.value = this.filterQ;

      // Filter envelope
      if (this.filterEnvAmount > 0) {
        voice.filter.frequency.setValueAtTime(this.filterFreq, time);
        const peakFreq = this.filterFreq + (10000 - this.filterFreq) * this.filterEnvAmount;
        voice.filter.frequency.linearRampToValueAtTime(peakFreq, time + this.filterAttack);
        voice.filter.frequency.linearRampToValueAtTime(
          this.filterFreq + (peakFreq - this.filterFreq) * this.filterSustain,
          time + this.filterAttack + this.filterDecay
        );
      }

      // FM oscillator (carrier-modulator)
      if (this.fmEnabled) {
        voice.fmOsc = ctx.createOscillator();
        voice.fmOsc.type = 'sine';
        voice.fmOsc.frequency.value = freq * this.fmRatio;
        
        voice.fmGain = ctx.createGain();
        voice.fmGain.gain.value = this.fmAmount;
        
        voice.fmOsc.connect(voice.fmGain);
        // The modulation gain fans out into each carrier oscillator's frequency AudioParam below.
      }

      // Create oscillators with unison
      for (const oscConfig of this.oscillators) {
        for (let u = 0; u < this.unison; u++) {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();
          
          osc.type = oscConfig.type;
          
          // Calculate frequency with octave and detune
          let oscFreq = freq * Math.pow(2, oscConfig.octave);
          
          // Unison detune
          if (this.unison > 1) {
            const detuneOffset = ((u / (this.unison - 1)) - 0.5) * 2;
            osc.detune.value = oscConfig.detune + (detuneOffset * this.unisonDetune);
          } else {
            osc.detune.value = oscConfig.detune;
          }
          
          osc.frequency.value = oscFreq;
          oscGain.gain.value = oscConfig.volume / this.unison;
          
          // FM modulation
          if (this.fmEnabled && voice.fmGain) {
            voice.fmGain.connect(osc.frequency);
          }
          
          osc.connect(oscGain);
          oscGain.connect(voice.filter);
          
          voice.oscillators.push(osc);
          voice.gains.push(oscGain);
        }
      }

      // Amp envelope
      voice.envGain = ctx.createGain();
      voice.envGain.gain.setValueAtTime(0, time);
      voice.envGain.gain.linearRampToValueAtTime(1, time + this.attack);
      voice.envGain.gain.linearRampToValueAtTime(this.sustain, time + this.attack + this.decay);

      // Connect chain
      voice.filter.connect(voice.envGain);
      voice.envGain.connect(this.gainNode);

      // Start oscillators
      for (const osc of voice.oscillators) {
        osc.start(time);
      }
      if (voice.fmOsc) {
        voice.fmOsc.start(time);
      }

      this.activeVoices.set(voiceId, voice);
      if (duration) {
        this.stopNote(voiceId, time + duration);
      }
      return voiceId;
    }

    stopNote(note, time) {
      const voice = this.activeVoices.get(note);
      if (!voice) return;

      const ctx = this.engine.context;
      const stopTime = time || ctx.currentTime;

      voice.envGain.gain.cancelScheduledValues(stopTime);
      voice.envGain.gain.setValueAtTime(voice.envGain.gain.value, stopTime);
      voice.envGain.gain.linearRampToValueAtTime(0, stopTime + this.release);

      for (const osc of voice.oscillators) {
        osc.stop(stopTime + this.release + 0.1);
      }
      if (voice.fmOsc) {
        voice.fmOsc.stop(stopTime + this.release + 0.1);
      }

      this.activeVoices.delete(note);
    }

    toJSON() {
      return {
        ...super.toJSON(),
        oscillators: this.oscillators,
        filterType: this.filterType,
        filterFreq: this.filterFreq,
        filterQ: this.filterQ,
        filterEnvAmount: this.filterEnvAmount,
        filterAttack: this.filterAttack,
        filterDecay: this.filterDecay,
        filterSustain: this.filterSustain,
        attack: this.attack,
        decay: this.decay,
        sustain: this.sustain,
        release: this.release,
        fmEnabled: this.fmEnabled,
        fmRatio: this.fmRatio,
        fmAmount: this.fmAmount,
        unison: this.unison,
        unisonDetune: this.unisonDetune
      };
    }
  }

  // Wavetable Synth
  class WavetableSynth extends SoundGenerator {
    constructor(engine, config = {}) {
      super(engine, config);
      this.type = 'wavetable';
      
      this.waveform = config.waveform || 'sine';
      this.wavetablePosition = config.wavetablePosition ?? 0;
      this.detune = config.detune ?? 0;
      
      // Filter
      this.filterType = config.filterType || 'lowpass';
      this.filterFreq = config.filterFreq ?? 3000;
      this.filterQ = config.filterQ ?? 1;
      
      // Envelope
      this.attack = config.attack ?? 0.01;
      this.decay = config.decay ?? 0.1;
      this.sustain = config.sustain ?? 0.7;
      this.release = config.release ?? 0.3;
      
      // LFO modulation
      this.lfoRate = config.lfoRate ?? 0;
      this.lfoDepth = config.lfoDepth ?? 0;
      this.lfoTarget = config.lfoTarget || 'filter'; // filter, pitch, amplitude
      
      this.activeVoices = new Map();
      this.wavetable = null;
    }

    init() {
      this.ensureAudioNodes();
      if (this.engine.context) this.createWavetable();
    }

    createWavetable() {
      const ctx = this.engine.context;
      if (!ctx) return;
      const real = new Float32Array(256);
      const imag = new Float32Array(256);
      
      // Generate different waveforms based on position
      const pos = this.wavetablePosition;
      
      // Base waveform generation
      for (let i = 0; i < 256; i++) {
        const harmonic = i + 1;
        
        if (this.waveform === 'sine') {
          real[i] = i === 0 ? 0 : 0;
          imag[i] = i === 0 ? 1 : 0;
        } else if (this.waveform === 'sawtooth') {
          imag[i] = (1 / harmonic) * (1 - pos * 0.5);
        } else if (this.waveform === 'square') {
          imag[i] = (harmonic % 2 === 1) ? (1 / harmonic) * (1 - pos * 0.3) : 0;
        } else if (this.waveform === 'triangle') {
          imag[i] = (harmonic % 2 === 1) ? (1 / (harmonic * harmonic)) * Math.pow(-1, (harmonic - 1) / 2) : 0;
        } else {
          // Custom morphing waveform
          const saw = 1 / harmonic;
          const square = (harmonic % 2 === 1) ? 1 / harmonic : 0;
          imag[i] = saw * (1 - pos) + square * pos;
        }
      }
      
      try {
        this.wavetable = ctx.createPeriodicWave(real, imag);
      } catch (e) {
        console.warn('Could not create wavetable:', e);
      }
    }

    setWavetablePosition(pos) {
      this.wavetablePosition = pos;
      this.createWavetable();
    }

    playNote(note, time, duration) {
      if (this.muted) return;
      this.ensureAudioNodes();
      if (!this.wavetable) this.createWavetable();

      const ctx = this.engine.context;
      const freq = Utils.midiToFreq(Utils.noteToMidi(note));
      const voiceId = note;

      const voice = {
        osc: null,
        filter: null,
        envGain: null,
        lfo: null,
        lfoGain: null
      };

      // Create oscillator with wavetable
      voice.osc = ctx.createOscillator();
      if (this.wavetable) {
        voice.osc.setPeriodicWave(this.wavetable);
      } else {
        voice.osc.type = 'sine';
      }
      voice.osc.frequency.value = freq;
      voice.osc.detune.value = this.detune;

      // Filter
      voice.filter = ctx.createBiquadFilter();
      voice.filter.type = this.filterType;
      voice.filter.frequency.value = this.filterFreq;
      voice.filter.Q.value = this.filterQ;

      // LFO for modulation
      if (this.lfoRate > 0 && this.lfoDepth > 0) {
        voice.lfo = ctx.createOscillator();
        voice.lfo.type = 'sine';
        voice.lfo.frequency.value = this.lfoRate;
        
        voice.lfoGain = ctx.createGain();
        voice.lfoGain.gain.value = this.lfoDepth;
        
        voice.lfo.connect(voice.lfoGain);
        
        if (this.lfoTarget === 'filter') {
          voice.lfoGain.connect(voice.filter.frequency);
        } else if (this.lfoTarget === 'pitch') {
          voice.lfoGain.connect(voice.osc.frequency);
        }
        
        voice.lfo.start(time);
      }

      // Amp envelope
      voice.envGain = ctx.createGain();
      voice.envGain.gain.setValueAtTime(0, time);
      voice.envGain.gain.linearRampToValueAtTime(1, time + this.attack);
      voice.envGain.gain.linearRampToValueAtTime(this.sustain, time + this.attack + this.decay);

      // Connect
      voice.osc.connect(voice.filter);
      voice.filter.connect(voice.envGain);
      voice.envGain.connect(this.gainNode);

      voice.osc.start(time);

      this.activeVoices.set(voiceId, voice);
      if (duration) {
        this.stopNote(voiceId, time + duration);
      }
      return voiceId;
    }

    stopNote(note, time) {
      const voice = this.activeVoices.get(note);
      if (!voice) return;

      const ctx = this.engine.context;
      const stopTime = time || ctx.currentTime;

      voice.envGain.gain.cancelScheduledValues(stopTime);
      voice.envGain.gain.setValueAtTime(voice.envGain.gain.value, stopTime);
      voice.envGain.gain.linearRampToValueAtTime(0, stopTime + this.release);

      voice.osc.stop(stopTime + this.release + 0.1);
      if (voice.lfo) {
        voice.lfo.stop(stopTime + this.release + 0.1);
      }

      this.activeVoices.delete(note);
    }

    toJSON() {
      return {
        ...super.toJSON(),
        waveform: this.waveform,
        wavetablePosition: this.wavetablePosition,
        detune: this.detune,
        filterType: this.filterType,
        filterFreq: this.filterFreq,
        filterQ: this.filterQ,
        attack: this.attack,
        decay: this.decay,
        sustain: this.sustain,
        release: this.release,
        lfoRate: this.lfoRate,
        lfoDepth: this.lfoDepth,
        lfoTarget: this.lfoTarget
      };
    }
  }

  // BasicSynth (kept for backwards compatibility)
  class BasicSynth extends MultiOscSynth {
    constructor(engine, config = {}) {
      super(engine, { ...config, oscillators: [{ type: config.oscType || 'sawtooth', detune: 0, volume: 1, octave: 0 }] });
      this.type = 'synth';
    }
  }

  // ============================================
  // EFFECTS
  // ============================================

  class Effect {
    constructor(engine, config = {}) {
      this.engine = engine;
      this.id = config.id || Utils.generateId('fx');
      this.type = 'base';
      this.enabled = config.enabled ?? true;
      this.mix = config.mix ?? 0.5;
      this.inputNode = null;
      this.outputNode = null;
      this.wetNode = null;
      this.dryNode = null;
    }

    init() {
      const ctx = this.engine.context;
      this.inputNode = ctx.createGain();
      this.outputNode = ctx.createGain();
      this.wetNode = ctx.createGain();
      this.dryNode = ctx.createGain();
      this.wetNode.gain.value = this.mix;
      this.dryNode.gain.value = 1 - this.mix;

      this.inputNode.connect(this.dryNode);
      this.dryNode.connect(this.outputNode);
    }

    setMix(value) {
      this.mix = value;
      if (this.wetNode) {
        this.wetNode.gain.setValueAtTime(value, this.engine.context.currentTime);
      }
      if (this.dryNode) {
        this.dryNode.gain.setValueAtTime(1 - value, this.engine.context.currentTime);
      }
    }

    setEnabled(enabled) {
      this.enabled = enabled;
    }

    connect(destination) {
      if (this.outputNode && destination) {
        this.outputNode.connect(destination);
      }
    }

    disconnect() {
      if (this.outputNode) {
        this.outputNode.disconnect();
      }
    }

    toJSON() {
      return {
        id: this.id,
        type: this.type,
        enabled: this.enabled,
        mix: this.mix
      };
    }
  }

  class DelayEffect extends Effect {
    constructor(engine, config = {}) {
      super(engine, config);
      this.type = 'delay';
      this.time = config.time ?? 0.3;
      this.feedback = config.feedback ?? 0.4;
      this.delayNode = null;
      this.feedbackNode = null;
      this.init();
    }

    init() {
      super.init();
      const ctx = this.engine.context;

      this.delayNode = ctx.createDelay(5);
      this.delayNode.delayTime.value = this.time;

      this.feedbackNode = ctx.createGain();
      this.feedbackNode.gain.value = this.feedback;

      this.inputNode.connect(this.delayNode);
      this.delayNode.connect(this.wetNode);
      this.delayNode.connect(this.feedbackNode);
      this.feedbackNode.connect(this.delayNode);
      this.wetNode.connect(this.outputNode);
    }

    setTime(value) {
      this.time = value;
      if (this.delayNode) {
        this.delayNode.delayTime.setValueAtTime(value, this.engine.context.currentTime);
      }
    }

    setFeedback(value) {
      this.feedback = value;
      if (this.feedbackNode) {
        this.feedbackNode.gain.setValueAtTime(value, this.engine.context.currentTime);
      }
    }

    toJSON() {
      return { ...super.toJSON(), time: this.time, feedback: this.feedback };
    }
  }

  class DubEcho extends Effect {
    constructor(engine, config = {}) {
      super(engine, config);
      this.type = 'dubecho';
      this.time = config.time ?? 0.375;
      this.feedback = config.feedback ?? 0.7;
      this.hpfFreq = config.hpfFreq ?? 200;
      this.lpfFreq = config.lpfFreq ?? 4000;
      this.pingPong = config.pingPong ?? true;
      this.delayL = null;
      this.delayR = null;
      this.feedbackL = null;
      this.feedbackR = null;
      this.hpf = null;
      this.lpf = null;
      this.init();
    }

    init() {
      super.init();
      const ctx = this.engine.context;

      this.hpf = ctx.createBiquadFilter();
      this.hpf.type = 'highpass';
      this.hpf.frequency.value = this.hpfFreq;

      this.lpf = ctx.createBiquadFilter();
      this.lpf.type = 'lowpass';
      this.lpf.frequency.value = this.lpfFreq;

      this.delayL = ctx.createDelay(5);
      this.delayL.delayTime.value = this.time;
      
      this.delayR = ctx.createDelay(5);
      this.delayR.delayTime.value = this.pingPong ? this.time * 1.5 : this.time;

      this.feedbackL = ctx.createGain();
      this.feedbackL.gain.value = this.feedback;
      
      this.feedbackR = ctx.createGain();
      this.feedbackR.gain.value = this.feedback;

      this.inputNode.connect(this.hpf);
      this.hpf.connect(this.lpf);
      this.lpf.connect(this.wetNode);

      this.delayL.connect(this.feedbackL);
      this.feedbackL.connect(this.delayR);
      this.delayR.connect(this.feedbackR);
      this.feedbackR.connect(this.delayL);

      this.lpf.connect(this.delayL);
      this.delayL.connect(this.wetNode);
      this.delayR.connect(this.wetNode);

      this.wetNode.connect(this.outputNode);
    }

    setTime(value) {
      this.time = value;
      if (this.delayL) {
        this.delayL.delayTime.setValueAtTime(value, this.engine.context.currentTime);
      }
      if (this.delayR) {
        this.delayR.delayTime.setValueAtTime(this.pingPong ? value * 1.5 : value, this.engine.context.currentTime);
      }
    }

    setFeedback(value) {
      this.feedback = value;
      if (this.feedbackL) {
        this.feedbackL.gain.setValueAtTime(value, this.engine.context.currentTime);
      }
      if (this.feedbackR) {
        this.feedbackR.gain.setValueAtTime(value, this.engine.context.currentTime);
      }
    }

    setHPF(value) {
      this.hpfFreq = value;
      if (this.hpf) {
        this.hpf.frequency.setValueAtTime(value, this.engine.context.currentTime);
      }
    }

    setLPF(value) {
      this.lpfFreq = value;
      if (this.lpf) {
        this.lpf.frequency.setValueAtTime(value, this.engine.context.currentTime);
      }
    }

    setPingPong(value) {
      this.pingPong = value;
      if (this.delayR) {
        this.delayR.delayTime.setValueAtTime(value ? this.time * 1.5 : this.time, this.engine.context.currentTime);
      }
    }

    toJSON() {
      return {
        ...super.toJSON(),
        time: this.time,
        feedback: this.feedback,
        hpfFreq: this.hpfFreq,
        lpfFreq: this.lpfFreq,
        pingPong: this.pingPong
      };
    }
  }

  class ReverbEffect extends Effect {
    constructor(engine, config = {}) {
      super(engine, config);
      this.type = 'reverb';
      this.roomSize = config.roomSize ?? 0.5;
      this.decay = config.decay ?? 2;
      this.damping = config.damping ?? 0.5;
      this.preDelay = config.preDelay ?? 0.01;
      this.convolverNode = null;
      this.preDelayNode = null;
      this.init();
    }

    init() {
      super.init();
      const ctx = this.engine.context;

      this.preDelayNode = ctx.createDelay(0.5);
      this.preDelayNode.delayTime.value = this.preDelay;

      this.convolverNode = ctx.createConvolver();
      this.convolverNode.buffer = this.createImpulseResponse();

      this.inputNode.connect(this.preDelayNode);
      this.preDelayNode.connect(this.convolverNode);
      this.convolverNode.connect(this.wetNode);
      this.wetNode.connect(this.outputNode);
    }

    createImpulseResponse() {
      const ctx = this.engine.context;
      const sampleRate = ctx.sampleRate;
      const length = Math.floor(sampleRate * this.decay);
      const impulse = ctx.createBuffer(2, length, sampleRate);

      for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          const decay = Math.exp(-i / (sampleRate * this.decay * (1 - this.damping * 0.5)));
          channelData[i] = (Math.random() * 2 - 1) * decay * this.roomSize;
        }
      }

      return impulse;
    }

    setRoomSize(value) {
      this.roomSize = value;
      this.convolverNode.buffer = this.createImpulseResponse();
    }

    setDecay(value) {
      this.decay = value;
      this.convolverNode.buffer = this.createImpulseResponse();
    }

    setDamping(value) {
      this.damping = value;
      this.convolverNode.buffer = this.createImpulseResponse();
    }

    setPreDelay(value) {
      this.preDelay = value;
      if (this.preDelayNode) {
        this.preDelayNode.delayTime.setValueAtTime(value, this.engine.context.currentTime);
      }
    }

    toJSON() {
      return {
        ...super.toJSON(),
        roomSize: this.roomSize,
        decay: this.decay,
        damping: this.damping,
        preDelay: this.preDelay
      };
    }
  }

  // Phaser Effect
  class PhaserEffect extends Effect {
    constructor(engine, config = {}) {
      super(engine, config);
      this.type = 'phaser';
      this.rate = config.rate ?? 0.5;
      this.depth = config.depth ?? 1000;
      this.feedback = config.feedback ?? 0.7;
      this.stages = config.stages ?? 4;
      this.baseFreq = config.baseFreq ?? 1000;
      
      this.filters = [];
      this.lfo = null;
      this.lfoGain = null;
      this.feedbackGain = null;
      this.init();
    }

    init() {
      super.init();
      const ctx = this.engine.context;

      // Create all-pass filters for phasing
      for (let i = 0; i < this.stages; i++) {
        const filter = ctx.createBiquadFilter();
        filter.type = 'allpass';
        filter.frequency.value = this.baseFreq;
        filter.Q.value = 10;
        this.filters.push(filter);
      }

      // LFO to modulate filter frequencies
      this.lfo = ctx.createOscillator();
      this.lfo.type = 'sine';
      this.lfo.frequency.value = this.rate;

      this.lfoGain = ctx.createGain();
      this.lfoGain.gain.value = this.depth;

      this.feedbackGain = ctx.createGain();
      this.feedbackGain.gain.value = this.feedback;

      // Connect filters in series
      this.inputNode.connect(this.filters[0]);
      for (let i = 0; i < this.filters.length - 1; i++) {
        this.filters[i].connect(this.filters[i + 1]);
      }
      this.filters[this.filters.length - 1].connect(this.wetNode);
      this.filters[this.filters.length - 1].connect(this.feedbackGain);
      this.feedbackGain.connect(this.filters[0]);

      // LFO modulation
      this.lfo.connect(this.lfoGain);
      for (const filter of this.filters) {
        this.lfoGain.connect(filter.frequency);
      }

      this.wetNode.connect(this.outputNode);
      this.lfo.start();
    }

    setRate(value) {
      this.rate = value;
      if (this.lfo) {
        this.lfo.frequency.setValueAtTime(value, this.engine.context.currentTime);
      }
    }

    setDepth(value) {
      this.depth = value;
      if (this.lfoGain) {
        this.lfoGain.gain.setValueAtTime(value, this.engine.context.currentTime);
      }
    }

    setFeedback(value) {
      this.feedback = value;
      if (this.feedbackGain) {
        this.feedbackGain.gain.setValueAtTime(value, this.engine.context.currentTime);
      }
    }

    toJSON() {
      return {
        ...super.toJSON(),
        rate: this.rate,
        depth: this.depth,
        feedback: this.feedback,
        stages: this.stages
      };
    }
  }

  // Chorus Effect
  class ChorusEffect extends Effect {
    constructor(engine, config = {}) {
      super(engine, config);
      this.type = 'chorus';
      this.rate = config.rate ?? 1.5;
      this.depth = config.depth ?? 0.005;
      this.delay = config.delay ?? 0.02;
      this.voices = config.voices ?? 3;
      this.spread = config.spread ?? 0.1;
      
      this.delayLines = [];
      this.lfos = [];
      this.lfoGains = [];
      this.init();
    }

    init() {
      super.init();
      const ctx = this.engine.context;

      for (let i = 0; i < this.voices; i++) {
        const delay = ctx.createDelay(0.1);
        delay.delayTime.value = this.delay + (i * this.spread * 0.01);

        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = this.rate * (1 + i * 0.1);

        const lfoGain = ctx.createGain();
        lfoGain.gain.value = this.depth;

        lfo.connect(lfoGain);
        lfoGain.connect(delay.delayTime);

        this.inputNode.connect(delay);
        delay.connect(this.wetNode);

        this.delayLines.push(delay);
        this.lfos.push(lfo);
        this.lfoGains.push(lfoGain);

        lfo.start();
      }

      this.wetNode.connect(this.outputNode);
    }

    setRate(value) {
      this.rate = value;
      this.lfos.forEach((lfo, i) => {
        lfo.frequency.setValueAtTime(value * (1 + i * 0.1), this.engine.context.currentTime);
      });
    }

    setDepth(value) {
      this.depth = value;
      this.lfoGains.forEach(gain => {
        gain.gain.setValueAtTime(value, this.engine.context.currentTime);
      });
    }

    toJSON() {
      return {
        ...super.toJSON(),
        rate: this.rate,
        depth: this.depth,
        delay: this.delay,
        voices: this.voices
      };
    }
  }

  // Bitcrusher Effect
  class BitcrusherEffect extends Effect {
    constructor(engine, config = {}) {
      super(engine, config);
      this.type = 'bitcrusher';
      this.bits = config.bits ?? 8;
      this.sampleRateReduction = config.sampleRateReduction ?? 1;
      
      this.processor = null;
      this.init();
    }

    init() {
      super.init();
      const ctx = this.engine.context;

      // Use ScriptProcessor for bitcrushing
      const bufferSize = 4096;
      this.processor = ctx.createScriptProcessor(bufferSize, 1, 1);

      let phaser = 0;
      let last = 0;

      this.processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const output = e.outputBuffer.getChannelData(0);
        const step = Math.pow(0.5, this.bits);
        const invStep = 1 / step;

        for (let i = 0; i < bufferSize; i++) {
          // Sample rate reduction
          phaser += this.sampleRateReduction;
          if (phaser >= 1) {
            phaser -= 1;
            // Bit reduction
            last = Math.floor(input[i] * invStep + 0.5) * step;
          }
          output[i] = last;
        }
      };

      this.inputNode.connect(this.processor);
      this.processor.connect(this.wetNode);
      this.wetNode.connect(this.outputNode);
    }

    setBits(value) {
      this.bits = Math.max(1, Math.min(16, value));
    }

    setSampleRateReduction(value) {
      this.sampleRateReduction = Math.max(0.01, Math.min(1, value));
    }

    toJSON() {
      return {
        ...super.toJSON(),
        bits: this.bits,
        sampleRateReduction: this.sampleRateReduction
      };
    }
  }

  // Compressor Effect
  class CompressorEffect extends Effect {
    constructor(engine, config = {}) {
      super(engine, config);
      this.type = 'compressor';
      this.threshold = config.threshold ?? -24;
      this.knee = config.knee ?? 30;
      this.ratio = config.ratio ?? 4;
      this.attack = config.attack ?? 0.003;
      this.release = config.release ?? 0.25;
      this.makeupGain = config.makeupGain ?? 1;
      
      this.compressor = null;
      this.makeupNode = null;
      this.init();
    }

    init() {
      super.init();
      const ctx = this.engine.context;

      this.compressor = ctx.createDynamicsCompressor();
      this.compressor.threshold.value = this.threshold;
      this.compressor.knee.value = this.knee;
      this.compressor.ratio.value = this.ratio;
      this.compressor.attack.value = this.attack;
      this.compressor.release.value = this.release;

      this.makeupNode = ctx.createGain();
      this.makeupNode.gain.value = this.makeupGain;

      this.inputNode.connect(this.compressor);
      this.compressor.connect(this.makeupNode);
      this.makeupNode.connect(this.wetNode);
      this.wetNode.connect(this.outputNode);
    }

    setThreshold(value) {
      this.threshold = value;
      if (this.compressor) {
        this.compressor.threshold.setValueAtTime(value, this.engine.context.currentTime);
      }
    }

    setKnee(value) {
      this.knee = value;
      if (this.compressor) {
        this.compressor.knee.setValueAtTime(value, this.engine.context.currentTime);
      }
    }

    setRatio(value) {
      this.ratio = value;
      if (this.compressor) {
        this.compressor.ratio.setValueAtTime(value, this.engine.context.currentTime);
      }
    }

    setAttack(value) {
      this.attack = value;
      if (this.compressor) {
        this.compressor.attack.setValueAtTime(value, this.engine.context.currentTime);
      }
    }

    setRelease(value) {
      this.release = value;
      if (this.compressor) {
        this.compressor.release.setValueAtTime(value, this.engine.context.currentTime);
      }
    }

    setMakeupGain(value) {
      this.makeupGain = value;
      if (this.makeupNode) {
        this.makeupNode.gain.setValueAtTime(value, this.engine.context.currentTime);
      }
    }

    toJSON() {
      return {
        ...super.toJSON(),
        threshold: this.threshold,
        knee: this.knee,
        ratio: this.ratio,
        attack: this.attack,
        release: this.release,
        makeupGain: this.makeupGain
      };
    }
  }

  // Flanger, Looper, SuperDubFX (from previous version)
  class FlangerEffect extends Effect {
    constructor(engine, config = {}) {
      super(engine, config);
      this.type = 'flanger';
      this.rate = config.rate ?? 0.5;
      this.depth = config.depth ?? 0.005;
      this.feedback = config.feedback ?? 0.5;
      this.delayNode = null;
      this.lfoNode = null;
      this.lfoGain = null;
      this.feedbackGain = null;
      this.init();
    }

    init() {
      super.init();
      const ctx = this.engine.context;

      this.delayNode = ctx.createDelay();
      this.delayNode.delayTime.value = 0.005;

      this.lfoNode = ctx.createOscillator();
      this.lfoNode.type = 'sine';
      this.lfoNode.frequency.value = this.rate;

      this.lfoGain = ctx.createGain();
      this.lfoGain.gain.value = this.depth;

      this.feedbackGain = ctx.createGain();
      this.feedbackGain.gain.value = this.feedback;

      this.lfoNode.connect(this.lfoGain);
      this.lfoGain.connect(this.delayNode.delayTime);

      this.inputNode.connect(this.delayNode);
      this.delayNode.connect(this.wetNode);
      this.delayNode.connect(this.feedbackGain);
      this.feedbackGain.connect(this.delayNode);
      this.wetNode.connect(this.outputNode);

      this.lfoNode.start();
    }

    setRate(value) {
      this.rate = value;
      if (this.lfoNode) {
        this.lfoNode.frequency.setValueAtTime(value, this.engine.context.currentTime);
      }
    }

    setDepth(value) {
      this.depth = value;
      if (this.lfoGain) {
        this.lfoGain.gain.setValueAtTime(value, this.engine.context.currentTime);
      }
    }

    setFeedback(value) {
      this.feedback = value;
      if (this.feedbackGain) {
        this.feedbackGain.gain.setValueAtTime(value, this.engine.context.currentTime);
      }
    }

    toJSON() {
      return { ...super.toJSON(), rate: this.rate, depth: this.depth, feedback: this.feedback };
    }
  }

  class LooperEffect extends Effect {
    constructor(engine, config = {}) {
      super(engine, config);
      this.type = 'looper';
      this.duration = config.duration ?? 4;
      this.isRecording = false;
      this.isOverdubbing = false;
      this.loopBuffer = null;
      this.loopSource = null;
      this.recordingNodes = [];
      this.init();
    }

    init() {
      super.init();
      this.createBuffer();
    }

    createBuffer() {
      const ctx = this.engine.context;
      this.loopBuffer = ctx.createBuffer(2, ctx.sampleRate * this.duration, ctx.sampleRate);
    }

    startRecording(overdub = false) {
      this.isRecording = true;
      this.isOverdubbing = overdub;

      const ctx = this.engine.context;
      const bufferSize = 4096;
      const recorder = ctx.createScriptProcessor(bufferSize, 2, 2);
      let offset = 0;

      recorder.onaudioprocess = (e) => {
        if (!this.isRecording) return;
        const input = e.inputBuffer;
        const output = e.outputBuffer;

        for (let channel = 0; channel < 2; channel++) {
          const inputData = input.getChannelData(channel);
          const outputData = output.getChannelData(channel);
          const loopData = this.loopBuffer.getChannelData(channel);

          for (let i = 0; i < bufferSize; i++) {
            if (offset < loopData.length) {
              if (this.isOverdubbing) {
                loopData[offset] += inputData[i] * 0.5;
              } else {
                loopData[offset] = inputData[i];
              }
              outputData[i] = loopData[offset];
              offset++;
            }
          }
        }
      };

      this.inputNode.connect(recorder);
      recorder.connect(this.wetNode);
      this.recordingNodes.push(recorder);
    }

    stopRecording() {
      this.isRecording = false;
      this.isOverdubbing = false;
      this.recordingNodes.forEach(node => node.disconnect());
      this.recordingNodes = [];
    }

    play() {
      if (!this.loopBuffer) return;

      const ctx = this.engine.context;
      this.loopSource = ctx.createBufferSource();
      this.loopSource.buffer = this.loopBuffer;
      this.loopSource.loop = true;
      this.loopSource.connect(this.wetNode);
      this.loopSource.start();
    }

    stop() {
      if (this.loopSource) {
        this.loopSource.stop();
        this.loopSource = null;
      }
    }

    clear() {
      this.stop();
      this.createBuffer();
    }

    toJSON() {
      return { ...super.toJSON(), duration: this.duration };
    }
  }

  class SuperDubFX extends Effect {
    constructor(engine, config = {}) {
      super(engine, config);
      this.type = 'superdubfx';
      this.feedback = config.feedback ?? 0.7;
      this.filterFreq = config.filterFreq ?? 800;
      this.delayTime = config.delayTime ?? 0.5;
      this.lfoRate = config.lfoRate ?? 0.1;
      this.resonance = config.resonance ?? 5;

      this.delayNode = null;
      this.filterNode = null;
      this.lfoNode = null;
      this.lfoGain = null;
      this.feedbackGain = null;
      this.init();
    }

    init() {
      super.init();
      const ctx = this.engine.context;

      this.delayNode = ctx.createDelay(5);
      this.delayNode.delayTime.value = this.delayTime;

      this.filterNode = ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.value = this.filterFreq;
      this.filterNode.Q.value = this.resonance;

      this.lfoNode = ctx.createOscillator();
      this.lfoNode.type = 'sine';
      this.lfoNode.frequency.value = this.lfoRate;

      this.lfoGain = ctx.createGain();
      this.lfoGain.gain.value = 500;

      this.feedbackGain = ctx.createGain();
      this.feedbackGain.gain.value = this.feedback;

      this.lfoNode.connect(this.lfoGain);
      this.lfoGain.connect(this.filterNode.frequency);

      this.inputNode.connect(this.filterNode);
      this.filterNode.connect(this.delayNode);
      this.delayNode.connect(this.wetNode);
      this.delayNode.connect(this.feedbackGain);
      this.feedbackGain.connect(this.filterNode);
      this.wetNode.connect(this.outputNode);

      this.lfoNode.start();
    }

    setFeedback(value) {
      this.feedback = value;
      if (this.feedbackGain) {
        this.feedbackGain.gain.setValueAtTime(value, this.engine.context.currentTime);
      }
    }

    setFilterFreq(value) {
      this.filterFreq = value;
      if (this.filterNode) {
        this.filterNode.frequency.setValueAtTime(value, this.engine.context.currentTime);
      }
    }

    setDelayTime(value) {
      this.delayTime = value;
      if (this.delayNode) {
        this.delayNode.delayTime.setValueAtTime(value, this.engine.context.currentTime);
      }
    }

    setLfoRate(value) {
      this.lfoRate = value;
      if (this.lfoNode) {
        this.lfoNode.frequency.setValueAtTime(value, this.engine.context.currentTime);
      }
    }

    setResonance(value) {
      this.resonance = value;
      if (this.filterNode) {
        this.filterNode.Q.setValueAtTime(value, this.engine.context.currentTime);
      }
    }

    toJSON() {
      return {
        ...super.toJSON(),
        feedback: this.feedback,
        filterFreq: this.filterFreq,
        delayTime: this.delayTime,
        lfoRate: this.lfoRate,
        resonance: this.resonance
      };
    }
  }

  // ============================================
  // SEQUENCER
  // ============================================
  class Sequencer {
    constructor(config = {}) {
      this.bars = config.bars || 4;
      this.stepsPerBar = 16;
      this.notes = new Map();
      this.currentStep = 0;
      this.isPlaying = false;
    }

    get totalSteps() {
      return this.bars * this.stepsPerBar;
    }

    setBars(bars) {
      this.bars = bars;
    }

    addNote(moduleId, step, pitch, velocity = 1, duration = 1) {
      if (!this.notes.has(moduleId)) {
        this.notes.set(moduleId, []);
      }
      const moduleNotes = this.notes.get(moduleId);
      moduleNotes.push({ step, pitch, velocity, duration });
      return moduleNotes.length - 1;
    }

    removeNote(moduleId, step, pitch) {
      const moduleNotes = this.notes.get(moduleId);
      if (!moduleNotes) return false;

      const index = moduleNotes.findIndex(n => n.step === step && n.pitch === pitch);
      if (index >= 0) {
        moduleNotes.splice(index, 1);
        return true;
      }
      return false;
    }

    toggleNote(moduleId, step, pitch, velocity = 1, duration = 1) {
      const moduleNotes = this.notes.get(moduleId);
      if (!moduleNotes) {
        return this.addNote(moduleId, step, pitch, velocity, duration);
      }

      const existingIndex = moduleNotes.findIndex(n => n.step === step && n.pitch === pitch);
      if (existingIndex >= 0) {
        moduleNotes.splice(existingIndex, 1);
        return -1;
      } else {
        return this.addNote(moduleId, step, pitch, velocity, duration);
      }
    }

    getNotesAtStep(step) {
      const notes = [];
      for (const [moduleId, moduleNotes] of this.notes) {
        for (const note of moduleNotes) {
          if (note.step === step) {
            notes.push({ moduleId, ...note });
          }
        }
      }
      return notes;
    }

    getNotesForModule(moduleId) {
      return this.notes.get(moduleId) || [];
    }

    clearModule(moduleId) {
      this.notes.delete(moduleId);
    }

    clear() {
      this.notes.clear();
    }

    toJSON() {
      const obj = {};
      for (const [moduleId, notes] of this.notes) {
        obj[moduleId] = notes;
      }
      return { bars: this.bars, notes: obj };
    }

    fromJSON(data) {
      this.bars = data.bars || 4;
      this.notes.clear();
      for (const [moduleId, notes] of Object.entries(data.notes || {})) {
        this.notes.set(moduleId, notes);
      }
    }
  }

  // ============================================
  // STATE MANAGER
  // ============================================
  class StateManager {
    constructor() {
      this.state = {
        user: {
          id: Utils.generateId('user'),
          name: 'Producer',
          color: Utils.getUserColor(0)
        },
        lobby: null,
        bpm: 120,
        metronomeVolume: 0.5,
        masterVolume: 0.8,
        isPlaying: false,
        bars: 4,
        modules: new Map(),
        effects: [],
        sequencer: new Sequencer(),
        users: new Map()
      };

      this.listeners = new Map();
      this.loadFromLocalStorage();
    }

    get(path) {
      const keys = path.split('.');
      let result = this.state;
      for (const key of keys) {
        if (result === null || result === undefined) return undefined;
        result = result[key];
      }
      return result;
    }

    set(path, value) {
      const keys = path.split('.');
      let current = this.state;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      this.emit('state:change', { path, value });
      this.saveToLocalStorage();
    }

    subscribe(event, handler) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }
      this.listeners.get(event).add(handler);
      return () => this.listeners.get(event).delete(handler);
    }

    emit(event, data) {
      this.listeners.get(event)?.forEach(handler => handler(data));
    }

    saveToLocalStorage() {
      try {
        const saveState = {
          user: this.state.user,
          bpm: this.state.bpm,
          metronomeVolume: this.state.metronomeVolume,
          masterVolume: this.state.masterVolume,
          bars: this.state.bars,
          modules: Array.from(this.state.modules.entries()).map(([id, mod]) => [id, mod.toJSON()]),
          effects: this.state.effects.map(fx => fx.toJSON()),
          sequencer: this.state.sequencer.toJSON()
        };
        localStorage.setItem('grooveStation', JSON.stringify(saveState));
      } catch (e) {
        console.error('Failed to save state:', e);
      }
    }

    loadFromLocalStorage() {
      try {
        const saved = localStorage.getItem('grooveStation');
        if (saved) {
          const data = JSON.parse(saved);
          this.state.user = data.user || this.state.user;
          this.state.bpm = data.bpm || this.state.bpm;
          this.state.metronomeVolume = data.metronomeVolume || this.state.metronomeVolume;
          this.state.masterVolume = data.masterVolume || this.state.masterVolume;
          this.state.bars = data.bars || this.state.bars;
          this.state.sequencer.fromJSON(data.sequencer || {});
        }
      } catch (e) {
        console.error('Failed to load state:', e);
      }
    }

    exportSession() {
      return {
        version: '3.0',
        timestamp: Date.now(),
        state: {
          user: this.state.user,
          bpm: this.state.bpm,
          metronomeVolume: this.state.metronomeVolume,
          masterVolume: this.state.masterVolume,
          bars: this.state.bars,
          modules: Array.from(this.state.modules.entries()).map(([id, mod]) => [id, mod.toJSON()]),
          effects: this.state.effects.map(fx => fx.toJSON()),
          sequencer: this.state.sequencer.toJSON()
        }
      };
    }

    importSession(data) {
      if (data.state) {
        this.state.bpm = data.state.bpm || 120;
        this.state.metronomeVolume = data.state.metronomeVolume || 0.5;
        this.state.masterVolume = data.state.masterVolume || 0.8;
        this.state.bars = data.state.bars || 4;
        this.state.sequencer.fromJSON(data.state.sequencer || {});
        this.emit('state:restore', data.state);
      }
    }
  }

  // ============================================
  // P2P MANAGER
  // ============================================
  class P2PManager {
    constructor(stateManager) {
      this.stateManager = stateManager;
      this.peer = null;
      this.connections = new Map();
      this.isHost = false;
      this.hostId = null;
      this.lobbyId = null;
      this.lobbyLocked = false;
      this.colorIndex = 0;
      this._handlers = new Map();
    }

    async init() {
      return new Promise((resolve, reject) => {
        this.peer = new Peer(this.stateManager.state.user.id);

        this.peer.on('open', (id) => {
          console.log('P2P connected with ID:', id);
          this.stateManager.set('user.id', id);
          resolve(id);
        });

        this.peer.on('error', (err) => {
          console.error('Peer error:', err);
          reject(err);
        });

        this.peer.on('connection', (conn) => {
          this.handleConnection(conn);
        });

        this.peer.on('disconnected', () => {
          console.log('Peer disconnected');
        });
      });
    }

    handleConnection(conn) {
      conn.on('open', () => {
        this.connections.set(conn.peer, conn);
        console.log('Connected to:', conn.peer);

        if (this.isHost) {
          this.sendTo(conn.peer, {
            type: 'sync:full',
            state: this.stateManager.exportSession(),
            users: this.getUsers()
          });
        }

        this.stateManager.emit('p2p:connected', { peerId: conn.peer });
      });

      conn.on('data', (data) => {
        this.handleMessage(conn.peer, data);
      });

      conn.on('close', () => {
        this.connections.delete(conn.peer);
        this.stateManager.emit('p2p:disconnected', { peerId: conn.peer });
      });
    }

    handleMessage(peerId, data) {
      switch (data.type) {
        case 'sync:full':
          this.stateManager.importSession(data.state);
          if (data.users) {
            for (const user of data.users) {
              this.stateManager.state.users.set(user.id, user);
            }
          }
          this.stateManager.emit('p2p:sync', data);
          break;

        case 'state:change':
          this.stateManager.state[data.path] = data.value;
          this.stateManager.emit('remote:change', data);
          break;

        case 'note:add':
        case 'note:remove':
          this.stateManager.emit('remote:note', data);
          break;

        case 'user:join':
          this.stateManager.state.users.set(data.user.id, data.user);
          if (this.isHost) {
            this.broadcast({ type: 'user:join', user: data.user });
          }
          this.stateManager.emit('p2p:user:join', data.user);
          break;

        case 'user:leave':
          this.stateManager.state.users.delete(data.user.id);
          this.stateManager.emit('p2p:user:leave', data.user);
          break;

        case 'module:add':
        case 'module:remove':
        case 'module:update':
          this.stateManager.emit('remote:module', data);
          break;
      }
    }

    async createLobby(name, bpm, locked = false) {
      this.isHost = true;
      this.lobbyId = Utils.generateId('lobby');
      this.lobbyLocked = locked;
      this.hostId = this.peer.id;

      this.stateManager.state.lobby = {
        id: this.lobbyId,
        name,
        hostId: this.hostId,
        locked,
        createdAt: Date.now()
      };

      this.stateManager.state.users.set(this.peer.id, this.stateManager.state.user);

      return this.lobbyId;
    }

    async joinLobby(hostId, userName) {
      return new Promise((resolve, reject) => {
        const conn = this.peer.connect(hostId);

        conn.on('open', () => {
          this.connections.set(hostId, conn);
          this.hostId = hostId;
          this.isHost = false;

          this.colorIndex = this.connections.size + 1;
          this.stateManager.state.user.color = Utils.getUserColor(this.colorIndex);
          this.stateManager.state.user.name = userName;

          this.sendTo(hostId, {
            type: 'user:join',
            user: this.stateManager.state.user
          });

          resolve(true);
        });

        conn.on('error', (err) => {
          reject(err);
        });

        conn.on('data', (data) => {
          this.handleMessage(hostId, data);
        });

        conn.on('close', () => {
          this.connections.delete(hostId);
        });
      });
    }

    leaveLobby() {
      if (this.isHost) {
        this.broadcast({ type: 'lobby:closed' });
      } else if (this.hostId) {
        this.sendTo(this.hostId, {
          type: 'user:leave',
          user: this.stateManager.state.user
        });
      }

      this.connections.forEach((conn) => {
        conn.close();
      });
      this.connections.clear();
      this.isHost = false;
      this.hostId = null;
      this.lobbyId = null;
      this.stateManager.state.lobby = null;
      this.stateManager.state.users.clear();
    }

    sendTo(peerId, data) {
      const conn = this.connections.get(peerId);
      if (conn && conn.open) {
        conn.send(data);
      }
    }

    broadcast(data) {
      this.connections.forEach((conn) => {
        if (conn.open) {
          conn.send(data);
        }
      });
    }

    broadcastNote(action, moduleId, step, pitch, velocity, duration) {
      this.broadcast({
        type: `note:${action}`,
        userId: this.stateManager.state.user.id,
        moduleId,
        step,
        pitch,
        velocity,
        duration
      });
    }

    broadcastModule(action, module) {
      this.broadcast({
        type: `module:${action}`,
        userId: this.stateManager.state.user.id,
        module: module.toJSON ? module.toJSON() : module
      });
    }

    getUsers() {
      return Array.from(this.stateManager.state.users.values());
    }

    getPeerId() {
      return this.peer ? this.peer.id : null;
    }

    getConnectionCount() {
      return this.connections.size;
    }

    isConnected() {
      return this.peer && !this.peer.disconnected;
    }

    getLobbyInfo() {
      return this.stateManager.state.lobby;
    }
  }

  // ============================================
  // UI CONTROLLER
  // ============================================
  class UIController {
    constructor(audio, state, p2p) {
      this.audio = audio;
      this.state = state;
      this.p2p = p2p;
      this.rigMixer = new RigMixer(audio);

      this.notes = [];
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      for (let octave = 3; octave <= 5; octave++) {
        for (const note of noteNames) {
          this.notes.push(`${note}${octave}`);
        }
      }

      this.selectedModuleId = null;
      this.draggedModule = null;
      this.modulePositions = new Map();

      this.initElements();
      this.bindEvents();
      this.subscribeToState();
    }

    initElements() {
      this.connectionDot = document.getElementById('connectionDot');
      this.connectionStatus = document.getElementById('connectionStatus');
      this.peerCount = document.getElementById('peerCount');
      this.currentTimeDisplay = document.getElementById('currentTime');

      this.lobbySection = document.getElementById('lobbySection');
      this.btnCreateLobby = document.getElementById('btnCreateLobby');
      this.btnJoinLobby = document.getElementById('btnJoinLobby');
      this.btnLeaveLobby = document.getElementById('btnLeaveLobby');

      this.createLobbyModal = document.getElementById('createLobbyModal');
      this.joinLobbyModal = document.getElementById('joinLobbyModal');
      this.addModuleModal = document.getElementById('addModuleModal');

      this.btnPlay = document.getElementById('btnPlay');
      this.btnStop = document.getElementById('btnStop');
      this.bpmDisplay = document.getElementById('bpmDisplay');
      this.beatIndicator = document.getElementById('beatIndicator');
      this.metronomeVolume = document.getElementById('metronomeVolume');
      this.metronomeVolumeValue = document.getElementById('metronomeVolumeValue');
      this.barsSelect = document.getElementById('barsSelect');

      this.moduleList = document.getElementById('moduleList');
      this.moduleSelect = document.getElementById('moduleSelect');
      this.btnAddModule = document.getElementById('btnAddModule');

      this.userList = document.getElementById('userList');

      this.pianoRoll = document.getElementById('pianoRoll');
      this.playhead = document.getElementById('playhead');

      this.mixerChannels = document.getElementById('mixerChannels');

      this.effectsRack = document.getElementById('effectsRack');

      this.btnSaveSession = document.getElementById('btnSaveSession');
      this.btnLoadSession = document.getElementById('btnLoadSession');
      this.btnExportSession = document.getElementById('btnExportSession');
      this.sessionInfo = document.getElementById('sessionInfo');
    }

    bindEvents() {
      this.btnCreateLobby.addEventListener('click', () => this.showModal(this.createLobbyModal));
      this.btnJoinLobby.addEventListener('click', () => this.showModal(this.joinLobbyModal));
      this.btnLeaveLobby.addEventListener('click', () => this.leaveLobby());

      document.getElementById('btnCancelCreate').addEventListener('click', () => this.hideModal(this.createLobbyModal));
      document.getElementById('btnConfirmCreate').addEventListener('click', () => this.createLobby());
      document.getElementById('btnCancelJoin').addEventListener('click', () => this.hideModal(this.joinLobbyModal));
      document.getElementById('btnConfirmJoin').addEventListener('click', () => this.joinLobby());
      document.getElementById('btnCancelModule').addEventListener('click', () => this.hideModal(this.addModuleModal));
      document.getElementById('btnConfirmModule').addEventListener('click', () => this.addModule());

      const lobbyLock = document.getElementById('lobbyLock');
      if (lobbyLock) {
        lobbyLock.addEventListener('click', function() {
          this.classList.toggle('active');
        });
      }

      this.btnPlay.addEventListener('click', () => this.togglePlay());
      this.btnStop.addEventListener('click', () => this.stop());

      document.getElementById('btnBpmDown').addEventListener('click', () => this.adjustBpm(-5));
      document.getElementById('btnBpmUp').addEventListener('click', () => this.adjustBpm(5));

      this.metronomeVolume.addEventListener('input', (e) => {
        const value = e.target.value / 100;
        this.audio.setMetronomeVolume(value);
        this.state.set('metronomeVolume', value);
        this.metronomeVolumeValue.textContent = e.target.value;
      });

      this.barsSelect.addEventListener('change', (e) => {
        this.state.set('bars', parseInt(e.target.value));
        this.state.state.sequencer.setBars(parseInt(e.target.value));
        this.renderPianoRoll();
      });

      this.btnAddModule.addEventListener('click', () => this.showModal(this.addModuleModal));

      document.getElementById('btnClearNotes').addEventListener('click', () => this.clearNotes());
      document.getElementById('btnRandomNotes').addEventListener('click', () => this.randomNotes());

      this.moduleSelect.addEventListener('change', (e) => {
        this.selectModule(e.target.value);
      });

      this.btnSaveSession.addEventListener('click', () => this.saveSession());
      this.btnLoadSession.addEventListener('click', () => this.loadSession());
      this.btnExportSession.addEventListener('click', () => this.exportSession());

      const masterVolumeSlider = document.getElementById('masterVolume');
      if (masterVolumeSlider) {
        masterVolumeSlider.addEventListener('input', (e) => {
          const value = e.target.value / 100;
          this.audio.setMasterVolume(value);
          this.state.set('masterVolume', value);
          const valueDisplay = document.getElementById('masterVolumeValue');
          if (valueDisplay) valueDisplay.textContent = e.target.value;
        });
      }

      // Module type change handler - show/hide sampler options
      const moduleTypeSelect = document.getElementById('moduleType');
      if (moduleTypeSelect) {
        moduleTypeSelect.addEventListener('change', (e) => {
          const samplerOptions = document.getElementById('samplerOptions');
          if (samplerOptions) {
            const selected = e.target.value;
            const resolvedType = SoundModuleCatalog[selected]?.type || selected;
            samplerOptions.style.display = resolvedType === 'sampler' ? 'block' : 'none';
          }
        });
      }

      setInterval(() => {
        if (this.currentTimeDisplay) {
          this.currentTimeDisplay.textContent = Utils.formatTime();
        }
      }, 1000);
    }

    subscribeToState() {
      this.audio.on('beat', ({ beat, time }) => {
        this.onBeat(beat, time);
      });

      this.state.subscribe('state:change', ({ path, value }) => {
        this.onStateChange(path, value);
      });

      this.state.subscribe('p2p:connected', () => this.updateP2PStatus());
      this.state.subscribe('p2p:disconnected', () => this.updateP2PStatus());
      this.state.subscribe('p2p:user:join', () => this.updateUserList());
      this.state.subscribe('p2p:user:leave', () => this.updateUserList());
      this.state.subscribe('remote:note', (data) => this.onRemoteNote(data));
    }

    togglePlay() {
      if (this.audio.isPlaying) {
        this.audio.stop();
        this.btnPlay.classList.remove('playing');
        this.btnPlay.innerHTML = '&#9658;';
        this.state.set('isPlaying', false);
      } else {
        this.audio.init().then(() => {
          this.audio.start();
          this.btnPlay.classList.add('playing');
          this.btnPlay.innerHTML = '&#10074;&#10074;';
          this.state.set('isPlaying', true);
        });
      }
    }

    stop() {
      this.audio.stop();
      this.btnPlay.classList.remove('playing');
      this.btnPlay.innerHTML = '&#9658;';
      this.state.set('isPlaying', false);
      this.updateBeatIndicator(-1);
    }

    adjustBpm(delta) {
      const newBpm = Utils.clamp(this.state.state.bpm + delta, 40, 300);
      this.state.set('bpm', newBpm);
      this.audio.bpm = newBpm;
      this.bpmDisplay.textContent = newBpm;
    }

    onBeat(beat, time) {
      const step = beat % (this.state.state.bars * 16);
      const beatInBar = Math.floor(beat / 4) % 4;

      this.updateBeatIndicator(beatInBar);

      const playheadPos = (step / (this.state.state.bars * 16)) * this.pianoRoll.scrollWidth;
      this.playhead.style.left = `${playheadPos}px`;

      if (beat % 4 === 0) {
        this.audio.playMetronome(beat % 16 === 0);
      }

      const notes = this.state.state.sequencer.getNotesAtStep(step);
      for (const note of notes) {
        const module = this.state.state.modules.get(note.moduleId);
        if (module && !module.muted) {
          // Handle arpeggiator
          if (module.arpeggiator && module.arpeggiator.enabled) {
            module.arpeggiator.holdNote(note.pitch);
            const arpNotes = module.arpeggiator.getNotesAtBeat(beat);
            for (const arpMidi of arpNotes) {
              const arpNote = Utils.midiToNote(arpMidi);
              const gateDuration = module.arpeggiator.getGateDuration();
              module.playNote(arpNote, time, gateDuration);
            }
          } else {
            module.playNote(note.pitch, time);
          }
        }
      }
    }

    updateBeatIndicator(activeIndex) {
      const dots = this.beatIndicator.querySelectorAll('.beat-dot');
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === activeIndex);
      });
    }

    async createLobby() {
      const name = document.getElementById('lobbyName').value || 'Groove Session';
      const bpm = parseInt(document.getElementById('lobbyBpm').value) || 120;
      const locked = document.getElementById('lobbyLock').classList.contains('active');

      try {
        await this.audio.init();
        await this.p2p.init();
        const lobbyId = await this.p2p.createLobby(name, bpm, locked);

        this.state.set('bpm', bpm);
        this.bpmDisplay.textContent = bpm;

        this.updateLobbyUI();
        this.hideModal(this.createLobbyModal);
        this.updateP2PStatus();
      } catch (error) {
        alert('Failed to create lobby: ' + error.message);
      }
    }

    async joinLobby() {
      const hostId = document.getElementById('hostPeerId').value.trim();
      const userName = document.getElementById('userName').value || 'Producer';

      if (!hostId) {
        alert('Please enter host peer ID');
        return;
      }

      try {
        await this.audio.init();
        await this.p2p.init();
        await this.p2p.joinLobby(hostId, userName);

        this.updateLobbyUI();
        this.hideModal(this.joinLobbyModal);
        this.updateP2PStatus();
      } catch (error) {
        alert('Failed to join lobby: ' + error.message);
      }
    }

    leaveLobby() {
      this.p2p.leaveLobby();
      this.updateLobbyUI();
      this.updateP2PStatus();
    }

    updateLobbyUI() {
      const lobby = this.p2p.getLobbyInfo();

      if (lobby) {
        this.lobbySection.innerHTML = `
          <div class="lobby-info">
            <div style="font-size: 0.8rem; color: var(--fg-primary); margin-bottom: 0.25rem;">${lobby.name}</div>
            <div class="lobby-id">ID: ${this.p2p.getPeerId()}</div>
            <div class="lobby-status">
              <span style="color: ${lobby.locked ? 'var(--accent-secondary)' : 'var(--accent)'}">${lobby.locked ? 'LOCKED' : 'OPEN'}</span>
              <span>|</span>
              <span>${this.p2p.isHost ? 'HOST' : 'GUEST'}</span>
            </div>
          </div>
        `;
        this.btnLeaveLobby.style.display = 'block';
        this.btnCreateLobby.style.display = 'none';
        this.btnJoinLobby.style.display = 'none';
        this.sessionInfo.textContent = `Lobby: ${lobby.name}`;
      } else {
        this.lobbySection.innerHTML = '<div style="color: rgba(255,255,255,0.5); font-size: 0.7rem;">No active lobby</div>';
        this.btnLeaveLobby.style.display = 'none';
        this.btnCreateLobby.style.display = 'block';
        this.btnJoinLobby.style.display = 'block';
        this.sessionInfo.textContent = 'No active session';
      }

      this.updateUserList();
    }

    updateUserList() {
      const users = this.p2p.getUsers();
      this.userList.innerHTML = users.map(user => `
        <div class="user-item">
          <div class="user-color" style="background: ${user.color}"></div>
          <div class="user-name">${user.name}</div>
          <div class="user-status">${user.id === this.p2p.getPeerId() ? 'YOU' : ''}</div>
        </div>
      `).join('') || '<div style="color: rgba(255,255,255,0.5); font-size: 0.65rem;">No users connected</div>';
    }

    updateP2PStatus() {
      const connected = this.p2p.isConnected();
      this.connectionDot.classList.toggle('disconnected', !connected);
      this.connectionStatus.textContent = connected ? 'CONNECTED' : 'DISCONNECTED';
      this.peerCount.textContent = this.p2p.getConnectionCount();
    }

    createSoundModule(type, config) {
      const catalogEntry = SoundModuleCatalog[type];
      const resolvedType = catalogEntry?.type || type;
      const resolvedConfig = {
        ...config,
        sourceApp: catalogEntry ? type : config.sourceApp,
        name: config.name || catalogEntry?.name || resolvedType
      };

      switch (resolvedType) {
        case 'sampler': return new Sampler(this.audio, resolvedConfig);
        case 'rack': return new Rack(this.audio, resolvedConfig);
        case 'synth': return new BasicSynth(this.audio, resolvedConfig);
        case 'multisynth': return new MultiOscSynth(this.audio, resolvedConfig);
        case 'wavetable': return new WavetableSynth(this.audio, resolvedConfig);
        default: return null;
      }
    }

    async addModule() {
      await this.audio.init();
      const type = document.getElementById('moduleType').value;
      const catalogEntry = SoundModuleCatalog[type];
      const defaultName = catalogEntry?.name || `${type.charAt(0).toUpperCase() + type.slice(1)}`;
      const name = document.getElementById('moduleName').value || defaultName;

      const config = {
        name,
        ownerId: this.state.state.user.id,
        ownerColor: this.state.state.user.color,
        position: { x: this.state.state.modules.size * 100, y: 0 }
      };

      const module = this.createSoundModule(type, config);

      if (module) {
        this.rigMixer.add(module);
        this.state.state.modules.set(module.id, module);
        this.updateModuleList();
        this.updateMixer();
        this.renderPianoRoll();
        this.p2p.broadcastModule('add', module);
        this.hideModal(this.addModuleModal);
        document.getElementById('moduleName').value = '';
      }
    }

    updateModuleList() {
      const modules = Array.from(this.state.state.modules.values());

      this.moduleList.innerHTML = modules.map(mod => `
        <div class="module-item ${mod.id === this.selectedModuleId ? 'selected' : ''}" 
             data-id="${mod.id}" 
             draggable="true"
             style="border-left: 3px solid ${mod.ownerColor};">
          <div class="module-info" style="flex: 1;">
            <div class="module-name">${mod.name}</div>
            <div class="module-type">${mod.type}</div>
          </div>
          <div style="display: flex; gap: 4px; align-items: center;">
            ${mod.type === 'sampler' ? `<button class="btn btn-small load-sample-btn" data-id="${mod.id}">LOAD</button>` : ''}
            ${mod.arpeggiator ? `<button class="btn btn-small arp-btn ${mod.arpeggiator.enabled ? 'active' : ''}" data-id="${mod.id}">ARP</button>` : ''}
            <button class="btn btn-small delete-module-btn" data-id="${mod.id}">X</button>
          </div>
        </div>
      `).join('') || '<div style="color: rgba(255,255,255,0.5); font-size: 0.65rem; padding: 0.5rem;">No modules</div>';

      this.moduleSelect.innerHTML = '<option value="">Select Module...</option>' +
        modules.map(mod => `<option value="${mod.id}">${mod.name}</option>`).join('');

      this.moduleList.querySelectorAll('.module-item').forEach(item => {
        item.addEventListener('click', (e) => {
          if (!e.target.classList.contains('btn')) {
            this.selectModule(item.dataset.id);
          }
        });

        item.addEventListener('dragstart', (e) => {
          this.draggedModule = item.dataset.id;
          e.dataTransfer.effectAllowed = 'move';
        });

        item.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        });

        item.addEventListener('drop', (e) => {
          e.preventDefault();
          if (this.draggedModule && this.draggedModule !== item.dataset.id) {
            this.reorderModules(this.draggedModule, item.dataset.id);
          }
          this.draggedModule = null;
        });
      });

      this.moduleList.querySelectorAll('.load-sample-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.loadSampleForModule(btn.dataset.id);
        });
      });

      this.moduleList.querySelectorAll('.arp-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleArp(btn.dataset.id);
          btn.classList.toggle('active');
        });
      });

      this.moduleList.querySelectorAll('.delete-module-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteModule(btn.dataset.id);
        });
      });
    }

    reorderModules(fromId, toId) {
      const modules = Array.from(this.state.state.modules.entries());
      const fromIndex = modules.findIndex(([id]) => id === fromId);
      const toIndex = modules.findIndex(([id]) => id === toId);

      if (fromIndex !== -1 && toIndex !== -1) {
        const [removed] = modules.splice(fromIndex, 1);
        modules.splice(toIndex, 0, removed);

        this.state.state.modules = new Map(modules);
        this.updateModuleList();
        this.updateMixer();
      }
    }

    loadSampleForModule(moduleId) {
      const module = this.state.state.modules.get(moduleId);
      if (!module || module.type !== 'sampler') return;

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'audio/*';

      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const success = await module.loadFile(file);
        if (success) {
          this.updateModuleList();
          alert(`Sample "${file.name}" loaded!`);
        } else {
          alert('Failed to load sample');
        }
      };

      input.click();
    }

    toggleArp(moduleId) {
      const module = this.state.state.modules.get(moduleId);
      if (!module || !module.arpeggiator) return;
      
      module.arpeggiator.enabled = !module.arpeggiator.enabled;
    }

    deleteModule(moduleId) {
      if (confirm('Delete this module?')) {
        this.rigMixer.remove(moduleId);
        this.state.state.modules.delete(moduleId);
        this.state.state.sequencer.clearModule(moduleId);
        if (this.selectedModuleId === moduleId) {
          this.selectedModuleId = null;
        }
        this.updateModuleList();
        this.updateMixer();
        this.renderPianoRoll();
        this.p2p.broadcastModule('remove', { id: moduleId, toJSON: () => ({ id: moduleId }) });
      }
    }

    selectModule(moduleId) {
      this.selectedModuleId = moduleId || null;
      this.moduleSelect.value = moduleId || '';
      this.updateModuleList();
      this.renderPianoRoll();
    }

    renderPianoRoll() {
      const bars = this.state.state.bars;
      const steps = bars * 16;
      const notes = this.notes;

      let html = '<div style="display: flex; flex-direction: column;">';

      for (let rowIndex = 0; rowIndex < notes.length; rowIndex++) {
        const note = notes[rowIndex];
        const isBlack = note.includes('#');

        html += `<div style="display: flex; height: 20px;">`;
        html += `<div class="piano-key ${isBlack ? 'black' : 'white'}" style="width: 40px; flex-shrink: 0;">${note}</div>`;

        for (let step = 0; step < steps; step++) {
          const isActive = this.isNoteActive(step, note);
          const color = isActive ? this.getNoteColor(step, note) : 'transparent';

          html += `<div class="note-cell ${isActive ? 'active' : ''}" data-step="${step}" data-note="${note}" style="${color !== 'transparent' ? `background: ${color};` : ''}"></div>`;
        }

        html += `</div>`;
      }

      html += '</div>';
      this.pianoRoll.innerHTML = html;

      this.pianoRoll.querySelectorAll('.note-cell').forEach(cell => {
        cell.addEventListener('click', () => {
          this.toggleNote(
            parseInt(cell.dataset.step),
            cell.dataset.note
          );
        });
      });
    }

    isNoteActive(step, note) {
      if (!this.selectedModuleId) return false;
      const notes = this.state.state.sequencer.getNotesForModule(this.selectedModuleId);
      return notes.some(n => n.step === step && n.pitch === note);
    }

    getNoteColor(step, note) {
      if (!this.selectedModuleId) return 'var(--fg-primary)';
      const module = this.state.state.modules.get(this.selectedModuleId);
      return module?.ownerColor || 'var(--fg-primary)';
    }

    toggleNote(step, note) {
      if (!this.selectedModuleId) {
        alert('Please select a module first');
        return;
      }

      const result = this.state.state.sequencer.toggleNote(this.selectedModuleId, step, note);
      this.p2p.broadcastNote(result === -1 ? 'remove' : 'add', this.selectedModuleId, step, note, 1, 1);
      this.renderPianoRoll();
    }

    clearNotes() {
      if (!this.selectedModuleId) return;
      this.state.state.sequencer.clearModule(this.selectedModuleId);
      this.renderPianoRoll();
    }

    randomNotes() {
      if (!this.selectedModuleId) return;

      this.state.state.sequencer.clearModule(this.selectedModuleId);

      const steps = this.state.state.bars * 16;
      for (let step = 0; step < steps; step++) {
        if (Math.random() < 0.15) {
          const noteIndex = Math.floor(Math.random() * this.notes.length);
          this.state.state.sequencer.addNote(this.selectedModuleId, step, this.notes[noteIndex]);
        }
      }

      this.renderPianoRoll();
    }

    onRemoteNote(data) {
      if (data.userId === this.state.state.user.id) return;

      if (data.type === 'note:add') {
        this.state.state.sequencer.addNote(data.moduleId, data.step, data.pitch, data.velocity, data.duration);
      } else if (data.type === 'note:remove') {
        this.state.state.sequencer.removeNote(data.moduleId, data.step, data.pitch);
      }

      this.renderPianoRoll();
    }

    updateMixer() {
      const modules = Array.from(this.state.state.modules.values());

      let html = '';

      for (const mod of modules) {
        html += `
          <div class="mixer-channel" data-id="${mod.id}">
            <div class="channel-color" style="background: ${mod.ownerColor}"></div>
            <div class="channel-name">${mod.name}</div>
            <div class="vu-meter"><div class="vu-level" id="vu-${mod.id}"></div></div>
            <input type="range" class="fader-vertical channel-fader" value="${mod.volume * 100}" data-module="${mod.id}">
            <span class="fader-value channel-value">${Math.round(mod.volume * 100)}</span>
            <div class="channel-controls">
              <button class="channel-btn mute-btn ${mod.muted ? 'active' : ''}" data-module="${mod.id}">M</button>
              <button class="channel-btn solo solo-btn ${mod.solo ? 'active' : ''}" data-module="${mod.id}">S</button>
            </div>
          </div>
        `;
      }

      html += `
        <div class="mixer-channel master-channel">
          <div class="channel-name">MASTER</div>
          <div class="vu-meter"><div class="vu-level" id="masterVuL"></div></div>
          <input type="range" class="fader-vertical" id="masterVolume" min="0" max="100" value="${this.state.state.masterVolume * 100}">
          <span class="fader-value" id="masterVolumeValue">${Math.round(this.state.state.masterVolume * 100)}</span>
        </div>
      `;

      this.mixerChannels.innerHTML = html;

      this.mixerChannels.querySelectorAll('.channel-fader').forEach(fader => {
        fader.addEventListener('input', (e) => {
          const moduleId = e.target.dataset.module;
          if (moduleId) {
            const mod = this.state.state.modules.get(moduleId);
            if (mod) {
              mod.setVolume(e.target.value / 100);
              e.target.nextElementSibling.textContent = e.target.value;
            }
          }
        });
      });

      this.mixerChannels.querySelectorAll('.mute-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const moduleId = e.target.dataset.module;
          const mod = this.state.state.modules.get(moduleId);
          if (mod) {
            mod.setMuted(!mod.muted);
            e.target.classList.toggle('active', mod.muted);
          }
        });
      });

      this.mixerChannels.querySelectorAll('.solo-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const moduleId = e.target.dataset.module;
          const mod = this.state.state.modules.get(moduleId);
          if (mod) {
            mod.solo = !mod.solo;
            e.target.classList.toggle('active', mod.solo);
          }
        });
      });

      const masterFader = document.getElementById('masterVolume');
      if (masterFader) {
        masterFader.addEventListener('input', (e) => {
          const value = e.target.value / 100;
          this.audio.setMasterVolume(value);
          this.state.set('masterVolume', value);
          document.getElementById('masterVolumeValue').textContent = e.target.value;
        });
      }
    }

    renderEffects() {
      const effects = [
        { type: 'delay', name: 'DELAY', params: ['Time', 'Feedback', 'Mix'] },
        { type: 'dubecho', name: 'DUB ECHO', params: ['Time', 'FB', 'HPF', 'Mix'] },
        { type: 'reverb', name: 'REVERB', params: ['Room', 'Decay', 'Damp', 'Mix'] },
        { type: 'phaser', name: 'PHASER', params: ['Rate', 'Depth', 'FB', 'Mix'] },
        { type: 'chorus', name: 'CHORUS', params: ['Rate', 'Depth', 'Mix'] },
        { type: 'flanger', name: 'FLANGER', params: ['Rate', 'Depth', 'Mix'] },
        { type: 'bitcrusher', name: 'CRUSHER', params: ['Bits', 'Rate', 'Mix'] },
        { type: 'compressor', name: 'COMP', params: ['Thresh', 'Ratio', 'Mix'] },
        { type: 'superdubfx', name: 'SUPER DUB', params: ['Feedback', 'Filter', 'Mix'] },
        { type: 'looper', name: 'LOOPER', params: ['Duration', 'Rec', 'Mix'] }
      ];

      let html = '';

      for (const fx of effects) {
        html += `
          <div class="effect-unit" data-type="${fx.type}">
            <div class="effect-title">${fx.name}</div>
            ${fx.params.map(param => `
              <div class="effect-param">
                <label>${param}</label>
                <input type="range" class="fader effect-fader" min="0" max="100" value="50" data-param="${param.toLowerCase()}" data-effect="${fx.type}">
              </div>
            `).join('')}
            <div class="toggle effect-toggle" data-effect="${fx.type}" style="margin-top: 0.5rem;"></div>
          </div>
        `;
      }

      this.effectsRack.innerHTML = html;

      this.effectsRack.querySelectorAll('.effect-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
          toggle.classList.toggle('active');
          const effectUnit = toggle.closest('.effect-unit');
          if (effectUnit) {
            effectUnit.classList.toggle('active', toggle.classList.contains('active'));
          }
        });
      });

      this.effectsRack.querySelectorAll('.effect-fader').forEach(fader => {
        fader.addEventListener('input', (e) => {
          // Placeholder for effect parameter changes
        });
      });
    }

    saveSession() {
      this.state.saveToLocalStorage();
      alert('Session saved to browser storage!');
    }

    loadSession() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
          const text = await file.text();
          const data = JSON.parse(text);
          this.state.importSession(data);
          this.bpmDisplay.textContent = this.state.state.bpm;
          this.renderPianoRoll();
          alert('Session loaded!');
        } catch (error) {
          alert('Failed to load session: ' + error.message);
        }
      };

      input.click();
    }

    exportSession() {
      const data = this.state.exportSession();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `groove-session-${Date.now()}.json`;
      a.click();

      URL.revokeObjectURL(url);
    }

    showModal(modal) {
      modal.classList.add('active');
    }

    hideModal(modal) {
      modal.classList.remove('active');
    }

    onStateChange(path, value) {
      switch (path) {
        case 'bpm':
          this.bpmDisplay.textContent = value;
          this.audio.bpm = value;
          break;
        case 'bars':
          this.barsSelect.value = value;
          this.renderPianoRoll();
          break;
        case 'masterVolume':
          const masterFader = document.getElementById('masterVolume');
          const masterValue = document.getElementById('masterVolumeValue');
          if (masterFader) masterFader.value = value * 100;
          if (masterValue) masterValue.textContent = Math.round(value * 100);
          break;
      }
    }
  }

  // ============================================
  // APP INITIALIZATION
  // ============================================
  class GrooveStation {
    constructor() {
      this.audioEngine = new AudioEngine();
      this.stateManager = new StateManager();
      this.p2pManager = new P2PManager(this.stateManager);
      this.ui = null;
    }

    async init() {
      this.ui = new UIController(this.audioEngine, this.stateManager, this.p2pManager);

      this.ui.bpmDisplay.textContent = this.stateManager.state.bpm;
      this.ui.barsSelect.value = this.stateManager.state.bars;
      this.ui.metronomeVolume.value = this.stateManager.state.metronomeVolume * 100;
      this.ui.metronomeVolumeValue.textContent = Math.round(this.stateManager.state.metronomeVolume * 100);

      this.ui.renderPianoRoll();
      this.ui.renderEffects();
      this.ui.updateModuleList();
      this.ui.updateLobbyUI();

      console.log('GROOVE STATION v3.0 initialized - Advanced Arps, FM Synth, Wavetable, More Effects');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new GrooveStation().init());
  } else {
    new GrooveStation().init();
  }

})();
