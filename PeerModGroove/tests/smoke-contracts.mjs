import { readFileSync, existsSync } from 'node:fs';

const requiredFiles = [
  'PeerModGroove/index.html',
  'PeerModGroove/style.css',
  'PeerModGroove/src/core/peernet-stack.js',
  'PeerModGroove/src/modules/clean-sampler.js',
  'PeerModGroove/src/modules/clean-synth.js',
  'PeerModGroove/src/modules/ocra-grid.js',
  'PeerModGroove/vendor/peernet/peernet-user-manager.js',
  'PeerModGroove/vendor/peernet/peernet-shared-core.js',
  'PeerModGroove/vendor/peernet/peernet-session-manager.js',
  'PeerModGroove/vendor/peernet/peernet-storage-manager.js'
];

for (const file of requiredFiles) {
  if (!existsSync(file)) throw new Error(`missing required file: ${file}`);
}

const html = readFileSync('PeerModGroove/index.html', 'utf8');
for (const needle of [
  'peernet-shared-core.js',
  'peernet-user-manager.js',
  'peernet-session-manager.js',
  'peernet-storage-manager.js',
  'btnConnectPeer',
  'resizable-mixer'
]) {
  if (!html.includes(needle)) throw new Error(`index.html missing ${needle}`);
}

const app = readFileSync('PeerModGroove/src/app.js', 'utf8');
for (const needle of [
  'PeernetStack',
  'CleanSynthModule',
  'CleanSamplerModule',
  'OcraGridModule',
  'serializeRig',
  'broadcastPacket'
]) {
  if (!app.includes(needle)) throw new Error(`app.js missing ${needle}`);
}

const css = readFileSync('PeerModGroove/style.css', 'utf8');
for (const needle of ['overflow: hidden', 'resize: horizontal', 'text-overflow: ellipsis', '.drop-zone', '.ocra-grid']) {
  if (!css.includes(needle)) throw new Error(`style.css missing ${needle}`);
}

console.log('PeerModGroove contract smoke ok');
