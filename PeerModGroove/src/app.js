// PeerModGroove/src/app.js

import { AudioRuntime } from './core/audio.js';
import { PatchBay } from './core/patchbay.js';
import { PortType } from './core/contracts.js';
import { ClockModule } from './modules/clock.js';
import { PianoRollModule } from './modules/piano-roll.js';
import { BasicSynthModule } from './modules/basic-synth.js';
import { FieldRecorderModule } from './modules/field-recorder.js';
import { MixerModule } from './modules/mixer.js';
import { PeerBridgeModule } from './modules/peer-bridge.js';

const moduleFactories = {
  clock: () => new ClockModule(),
  pianoroll: () => new PianoRollModule(),
  synth: () => new BasicSynthModule(),
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
  }

  async init() {
    this.createStarfield();
    this.bindChrome();
    this.patchBay.addEventListener('packet', e => this.logPacket(e.detail));
    this.patchBay.addEventListener('route:add', () => this.renderRoutes());
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
    const synth = new BasicSynthModule({ id: 'main-synth' });
    const field = new FieldRecorderModule({ id: 'field-recorder' });
    const peer = new PeerBridgeModule({ id: 'peer-bridge' });

    for (const module of [this.mixer, this.clock, piano, synth, field, peer]) {
      await this.addModule(module, { autoConnectAudio: true });
    }

    this.patchBay.connect({ moduleId: this.clock.id, outputId: 'clock' }, { moduleId: piano.id, inputId: 'clock' });
    this.patchBay.connect({ moduleId: piano.id, outputId: 'midi' }, { moduleId: synth.id, inputId: 'midi' });
    this.patchBay.connect({ moduleId: piano.id, outputId: 'midi' }, { moduleId: peer.id, inputId: 'midi' });
    this.patchBay.connect({ moduleId: peer.id, outputId: 'midi' }, { moduleId: synth.id, inputId: 'midi' });
    this.renderRoutes();
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
      <strong>${module.title}</strong>
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
    const row = document.createElement('div');
    row.className = `packet ${packet.kind}`;
    row.textContent = `${from}:${outputId} :: ${packet.kind}/${packet.type}${packet.note ? ` ${packet.note}` : ''}`;
    this.logEl.prepend(row);
    while (this.logEl.children.length > 30) this.logEl.lastChild.remove();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.peerModGroove = new PeerModGrooveApp();
  window.peerModGroove.init();
});
