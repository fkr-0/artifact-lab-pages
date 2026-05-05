// PeerModGroove/src/app.js

import { AudioRuntime } from './core/audio.js';
import { PatchBay } from './core/patchbay.js';
import { PortType } from './core/contracts.js';
import { PeernetStack } from './core/peernet-stack.js';
import { ClockModule } from './modules/clock.js';
import { PianoRollModule } from './modules/piano-roll.js';
import { BasicSynthModule } from './modules/basic-synth.js';
import { CleanSynthModule } from './modules/clean-synth.js';
import { CleanSamplerModule } from './modules/clean-sampler.js';
import { OcraGridModule } from './modules/ocra-grid.js';
import { FieldRecorderModule } from './modules/field-recorder.js';
import { MixerModule } from './modules/mixer.js';
import { PeerBridgeModule } from './modules/peer-bridge.js';

const moduleFactories = {
  clock: () => new ClockModule(),
  pianoroll: () => new PianoRollModule(),
  synth: () => new BasicSynthModule(),
  cleansynth: () => new CleanSynthModule(),
  sampler: () => new CleanSamplerModule(),
  ocra: () => new OcraGridModule(),
  field: () => new FieldRecorderModule(),
  peer: () => new PeerBridgeModule()
};

class PeerModGrooveApp {
  constructor() {
    this.runtime = new AudioRuntime();
    this.patchBay = new PatchBay();
    this.modulesEl = document.querySelector('#modules');
    this.routesEl = document.querySelector('#routes');
    this.logEl = document.querySelector('#eventLog');
    this.statusEl = document.querySelector('#audioStatus');
    this.mixerStripEl = document.querySelector('#mixerStrip');
    this.clock = null;
    this.mixer = null;
    this.peernet = new PeernetStack({
      namespace: 'peermodgroove',
      capture: () => this.serializeRig(),
      apply: payload => this.applyRig(payload)
    });
  }

  async init() {
    this.createStarfield();
    this.bindChrome();
    this.patchBay.addEventListener('packet', e => this.logPacket(e.detail));
    this.patchBay.addEventListener('route:add', () => this.renderRoutes());
    this.bindPeernetStack();
    this.bindV10SequencerBridge();
    await this.bootstrapDefaultRig();
  }

  createStarfield() {
    const root = document.querySelector('#starfield');
    root.innerHTML = Array.from({ length: 120 }, (_, i) => {
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const s = 1 + Math.random() * 2;
      const d = 1.5 + Math.random() * 4;
      return `<i style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;animation-duration:${d}s"></i>`;
    }).join('');
  }

  bindChrome() {
    document.querySelector('#btnBootAudio').addEventListener('click', async () => {
      await this.runtime.init();
      this.statusEl.textContent = `audio: ${this.runtime.context.state}`;
      await this.startAudioModules();
    });

    document.querySelector('#btnStart').addEventListener('click', async () => {
      await this.runtime.init();
      await this.startAudioModules();
      this.clock?.start(this.runtime.context);
    });

    document.querySelector('#btnStop').addEventListener('click', () => {
      this.clock?.stop();
    });

    document.querySelector('#btnConnectPeer').addEventListener('click', () => {
      const username = document.querySelector('#pilotName').value || 'pilot';
      this.peernet.start({ username });
    });

    document.querySelector('#btnSaveSnapshot').addEventListener('click', () => {
      const snap = this.peernet.snapshot('Manual PeerModGroove Snapshot');
      if (snap) this.logText(`storage snapshot: ${snap.title}`);
    });

    document.querySelector('#btnCreateSession').addEventListener('click', () => {
      const session = this.peernet.createSession('PeerModGroove Rig Session');
      if (session) this.logText(`session created: ${session.title}`);
    });

    document.querySelector('#addModule').addEventListener('change', async e => {
      const factory = moduleFactories[e.target.value];
      e.target.value = '';
      if (!factory) return;
      const module = factory();
      await this.addModule(module, { autoConnectAudio: true });
      this.autopatch(module);
    });
  }

  async bootstrapDefaultRig() {
    this.mixer = new MixerModule(this.runtime, { id: 'main-mixer' });
    this.clock = new ClockModule({ id: 'main-clock' });
    const piano = new PianoRollModule({ id: 'main-pianoroll' });
    const synth = new CleanSynthModule({ id: 'main-synth', title: 'Main Clean Synth' });
    const ocra = new OcraGridModule({ id: 'main-ocra' });
    const sampler = new CleanSamplerModule({ id: 'main-sampler' });
    const field = new FieldRecorderModule({ id: 'field-recorder' });
    const peer = new PeerBridgeModule({ id: 'peer-bridge' });

    for (const module of [this.mixer, this.clock, piano, ocra, synth, sampler, field, peer]) {
      await this.addModule(module, { autoConnectAudio: true });
    }

    this.patchBay.connect({ moduleId: this.clock.id, outputId: 'clock' }, { moduleId: piano.id, inputId: 'clock' });
    this.patchBay.connect({ moduleId: piano.id, outputId: 'midi' }, { moduleId: synth.id, inputId: 'midi' });
    this.patchBay.connect({ moduleId: this.clock.id, outputId: 'clock' }, { moduleId: ocra.id, inputId: 'clock' });
    this.patchBay.connect({ moduleId: ocra.id, outputId: 'midi' }, { moduleId: synth.id, inputId: 'midi' });
    this.patchBay.connect({ moduleId: ocra.id, outputId: 'midi' }, { moduleId: sampler.id, inputId: 'midi' });
    this.patchBay.connect({ moduleId: piano.id, outputId: 'midi' }, { moduleId: peer.id, inputId: 'midi' });
    this.patchBay.connect({ moduleId: peer.id, outputId: 'midi' }, { moduleId: synth.id, inputId: 'midi' });
    this.renderRoutes();
  }

  bindPeernetStack() {
    this.peernet.addEventListener('status', e => {
      document.querySelector('#peerStatus').textContent = e.detail.text;
    });
    this.peernet.addEventListener('presence', e => {
      document.querySelector('#peerCount').textContent = `${e.detail.length} peers`;
    });
    this.peernet.addEventListener('storage', e => {
      document.querySelector('#storageStatus').textContent = `last save: ${new Date(e.detail.createdAt).toLocaleTimeString()}`;
    });
    this.peernet.addEventListener('packet', e => {
      const packet = e.detail?.packet;
      if (packet) this.logText(`remote packet: ${packet.kind}/${packet.type}`);
    });
  }

  bindV10SequencerBridge() {
    const params = new URLSearchParams(location.search);
    this.externalSeqId = params.get('seq') || '';
    if (!this.externalSeqId || !window.PeernetLobby) return;

    import('../vendor/peernet-lib.js').then(({ PeernetLobby }) => {
      this.v10SequencerLobby = new PeernetLobby('v10-app-hub-main', { storageKey: 'pmg-v10-seq', debug: false });
      this.v10SequencerLobby.addEventListener('status', e => this.logText(`v10 sequencer lobby: ${e.detail.text}`));
      this.v10SequencerLobby.addEventListener('data', e => this.handleV10SequencerData(e.detail?.data));
      this.v10SequencerLobby.connect(`PMG-${Math.floor(Math.random() * 9000 + 1000)}`).then(() => {
        this.logText(`listening for v10 sequencer: ${this.externalSeqId}`);
        this.v10SequencerLobby.broadcast({ type: 'seq:request', payload: { docId: this.externalSeqId }, app: 'peermodgroove' });
      });
    }).catch(err => this.logText(`v10 sequencer bridge unavailable: ${err.message}`));
  }

  handleV10SequencerData(data) {
    if (!data || !data.payload || data.payload.docId !== this.externalSeqId) return;
    if (data.type === 'transport:start') this.handleTransportStart(data.payload);
    if (data.type === 'transport:stop') this.handleTransportStop(data.payload);
    if (data.type === 'transport:tick') this.consumeSequencerTick(data.payload);
    if (data.type === 'seq:state') this.logText(`v10 sequencer state received: v${data.payload.state?.version ?? 0}`);
    if (data.type === 'seq:op') this.logText(`v10 sequencer op: ${data.payload.op?.kind || 'unknown'}`);
  }

  handleTransportStart(payload) {
    if (!payload || payload.docId !== this.externalSeqId) return;
    this.externalTransport = payload;
    this.logText(`v10 shared clock start: ${payload.bpm || 120} bpm`);
  }

  handleTransportStop(payload) {
    if (!payload || payload.docId !== this.externalSeqId) return;
    this.externalTransport = null;
    this.logText('v10 shared clock stopped');
  }

  async consumeSequencerTick(payload) {
    await this.runtime.init();
    await this.startAudioModules();
    const active = payload.active || [];
    for (const hit of active) {
      const packet = {
        kind: 'midi',
        type: 'note-on',
        note: hit.note || 'C3',
        velocity: hit.velocity ?? 0.85,
        channel: 'v10-sequencer',
        at: this.runtime.context?.currentTime || null,
        dueAt: payload.dueAt || Date.now(),
        transportStep: payload.step
      };
      this.patchBay.dispatchPacket('v10-sequencer', 'midi', packet);
      window.setTimeout(() => {
        this.patchBay.dispatchPacket('v10-sequencer', 'midi', { ...packet, type: 'note-off', velocity: 0 });
      }, Math.max(40, Math.min(140, (payload.tickMs || 120) * 0.45)));
    }
    if (active.length) this.logText(`v10 seq step ${payload.step}: ${active.map(x => x.name || x.note).join(', ')}`);
  }

  async addModule(module, { autoConnectAudio = false } = {}) {
    this.patchBay.addModule(module);
    const card = document.createElement('article');
    card.className = `module-card kind-${module.kind}`;
    card.dataset.moduleId = module.id;
    card.innerHTML = '<button class="remove" title="remove module">×</button><div class="mount"></div>';
    this.modulesEl.appendChild(card);
    module.mount(card.querySelector('.mount'));
    card.querySelector('.remove').addEventListener('click', () => this.removeModule(module.id));

    if (this.runtime.context) await module.start(this.runtime.context);
    if (autoConnectAudio && module.outputs.some(p => p.type === PortType.AUDIO) && module !== this.mixer) {
      if (this.runtime.context) module.connectAudio(this.runtime.destination);
      this.addMixerStrip(module);
    }
  }

  async startAudioModules() {
    for (const module of this.patchBay.modules.values()) {
      await module.start?.(this.runtime.context);
      if (module.outputs?.some(p => p.type === PortType.AUDIO) && module !== this.mixer) {
        module.disconnectAudio?.();
        module.connectAudio(this.runtime.destination);
      }
    }
  }

  removeModule(moduleId) {
    document.querySelector(`[data-module-id="${moduleId}"]`)?.remove();
    document.querySelector(`[data-strip-id="${moduleId}"]`)?.remove();
    this.patchBay.removeModule(moduleId);
    this.renderRoutes();
  }

  autopatch(module) {
    if (module.inputs.some(p => p.type === PortType.MIDI)) {
      const piano = [...this.patchBay.modules.values()].find(m => m.kind === 'midi-generator');
      if (piano) this.patchBay.connect({ moduleId: piano.id, outputId: 'midi' }, { moduleId: module.id, inputId: 'midi' });
    }
    if (module.inputs.some(p => p.type === PortType.CLOCK)) {
      if (this.clock) this.patchBay.connect({ moduleId: this.clock.id, outputId: 'clock' }, { moduleId: module.id, inputId: 'clock' });
    }
  }

  addMixerStrip(module) {
    if (this.mixerStripEl.querySelector(`[data-strip-id="${module.id}"]`)) return;
    const strip = document.createElement('div');
    strip.className = 'strip';
    strip.dataset.stripId = module.id;
    strip.innerHTML = `
      <strong title="${module.title}">${module.title}</strong>
      <small>${module.kind}</small>
      <input type="range" min="0" max="100" value="70">
    `;
    const slider = strip.querySelector('input');
    slider.addEventListener('input', () => {
      if (module.output?.gain) module.output.gain.value = Number(slider.value) / 100;
    });
    this.mixerStripEl.appendChild(strip);
  }

  renderRoutes() {
    this.routesEl.innerHTML = this.patchBay.routes.map(route => `
      <li><code>${route.from.moduleId}:${route.from.outputId}</code> → <code>${route.to.moduleId}:${route.to.inputId}</code></li>
    `).join('') || '<li class="dim">no routes yet</li>';
  }

  logPacket({ from, outputId, packet }) {
    this.peernet.broadcastPacket(packet, outputId);
    const row = document.createElement('div');
    row.className = `packet ${packet.kind}`;
    row.textContent = `${from}:${outputId} :: ${packet.kind}/${packet.type}${packet.note ? ` ${packet.note}` : ''}`;
    this.logEl.prepend(row);
    while (this.logEl.children.length > 30) this.logEl.lastChild.remove();
  }

  logText(text) {
    const row = document.createElement('div');
    row.className = 'packet control';
    row.textContent = text;
    this.logEl.prepend(row);
    while (this.logEl.children.length > 30) this.logEl.lastChild.remove();
  }

  serializeRig() {
    return {
      version: 1,
      modules: [...this.patchBay.modules.values()].map(module => module.serialize?.() || { id: module.id, kind: module.kind, title: module.title }),
      routes: this.patchBay.routes
    };
  }

  applyRig(payload) {
    this.logText(`restore requested: ${payload?.modules?.length || 0} modules`);
  }

  logText(text) {
    const row = document.createElement('div');
    row.className = 'packet control';
    row.textContent = text;
    this.logEl.prepend(row);
    while (this.logEl.children.length > 30) this.logEl.lastChild.remove();
  }

  logText(text) {
    const row = document.createElement('div');
    row.className = 'packet control';
    row.textContent = text;
    this.logEl.prepend(row);
    while (this.logEl.children.length > 30) this.logEl.lastChild.remove();
  }

