import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const bridge = await readFile('app-hub-v11/lib/artifact-observer-bridge.js', 'utf8');
const hub = await readFile('app-hub-v11/index.html', 'utf8');
const minesweeper = await readFile('minesweeper/index.html', 'utf8');
const solitaire = await readFile('solitaire/index.html', 'utf8');
const sprite = await readFile('spc/sprite-gif-creator.html', 'utf8');

assert.match(bridge, /export function createArtifactObserverBridge/, 'generic observer bridge should export createArtifactObserverBridge');
assert.match(bridge, /new BroadcastChannel\(`artifact-observer:\$\{artifactId\}`\)/, 'observer bridge should provide same-origin BroadcastChannel mirroring');
assert.match(bridge, /runtime\.parent\.postMessage\(\{[\s\S]*type: ["\']artifact-observer-snapshot["\']/, 'host apps should post snapshots to the parent hub');
assert.match(bridge, /readOnlyOverlay/, 'observer bridge should mark observer windows read-only');
assert.match(bridge, /applySnapshot\(snapshot\)/, 'observer bridge should apply incoming snapshots');

assert.match(bridge, /getSemanticSnapshot/, 'observer bridge should accept optional semantic snapshot hooks');
assert.match(bridge, /semantic:\s*getSemanticSnapshot\?\.\(\)/, 'published snapshots should include compact semantic state when available');
assert.match(bridge, /snapshot\.semantic/, 'observer status/render path should preserve semantic snapshot payloads');
assert.match(minesweeper, /function getMinesweeperObserverState\(\)/, 'Minesweeper should expose a semantic observer state function');
assert.match(minesweeper, /cells:\s*game\.cells\.map/, 'Minesweeper semantic observer state should include compact cell state');
assert.match(minesweeper, /getSemanticSnapshot:\s*getMinesweeperObserverState/, 'Minesweeper should pass semantic state hook into the generic observer bridge');

assert.match(bridge, /let sequence = 0/, 'observer snapshots should carry a monotonically increasing sequence');
assert.match(bridge, /sequence: \+\+sequence/, 'published snapshots should increment sequence numbers');
assert.match(bridge, /snapshotAgeMs/, 'observer bridge should expose last snapshot age metadata');
assert.match(bridge, /artifactObserverStatus/, 'observer bridge should render visible observer status metadata');
assert.match(bridge, /lastSnapshotAt/, 'observer bridge should track the last applied snapshot timestamp');

assert.match(hub, /id="observerStatusPanel"/, 'hub should show observer status metadata in the Lobby / Chat panel');
assert.match(hub, /renderObserverStatus\(\)/, 'hub should render observer status after snapshot updates');
assert.match(hub, /last snapshot/, 'hub observer status should include last snapshot age copy');
assert.match(hub, /snapshot\.sequence/, 'hub should display observer snapshot sequence metadata');

assert.match(hub, /const OBSERVER_STALE_AFTER_MS = 10000/, 'hub should define a stale observer threshold');
assert.match(hub, /observer-stale/, 'hub should render a stale observer status class');
assert.match(hub, /stale snapshot/, 'hub observer status should warn when the latest snapshot is stale');
assert.match(hub, /setInterval\(renderObserverStatus, 1000\)/, 'hub should refresh observer status age even when no new snapshots arrive');
assert.match(hub, /clearInterval\(observerStatusTimer\)/, 'hub should clean up observer status interval on page unload');

for (const [name, html, id, selector] of [
  ['minesweeper', minesweeper, 'minesweeper', 'main.window'],
  ['solitaire', solitaire, 'solitaire', 'main.app'],
  ['sprite gif creator', sprite, 'sprite-gif-creator', '.app'],
]) {
  assert.match(html, /artifact-observer-bridge\.js/, `${name} should import the generic observer bridge`);
  assert.ok(html.includes(`artifactId: '${id}'`) || html.includes(`artifactId: "${id}"`), `${name} should publish snapshots under its artifact id`);
  assert.ok(html.includes(`snapshotSelector: '${selector}'`) || html.includes(`snapshotSelector: "${selector}"`), `${name} should snapshot its app root`);
}

assert.match(hub, /message:artifact-observer-snapshot/, 'hub should receive peer observer snapshots');
assert.match(hub, /window\.addEventListener\("message"[\s\S]*artifact-observer-snapshot/, 'hub should receive iframe observer snapshots');
assert.match(hub, /forwardArtifactObserverSnapshot/, 'hub should forward observer snapshots to open app iframes');
assert.match(hub, /minesweeper/, 'hub observe menu should include Minesweeper as a generic observable app');
assert.match(hub, /solitaire/, 'hub observe menu should include Solitaire as a generic observable app');
assert.match(hub, /sprite-gif-creator/, 'hub observe menu should include Sprite GIF Creator as a generic observable app');

console.log('non-peer observer bridge contract OK');
