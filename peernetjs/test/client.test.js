import assert from 'node:assert/strict';
import test from 'node:test';

import { PeernetClient, PeernetClientState, parseEnvelope } from '../src/index.js';
import { InMemoryNetwork } from '../src/testing/index.js';

function makeClient(network, peerId, start = 1000) {
  let now = start;
  let id = 0;
  const client = new PeernetClient({
    transport: network.createTransport(peerId),
    now: () => now++,
    idFactory: () => `${peerId}-msg-${++id}`,
  });
  return client;
}

test('clients exchange validated application envelopes without exposing transport connections', async () => {
  const network = new InMemoryNetwork();
  const alpha = makeClient(network, 'alpha');
  const beta = makeClient(network, 'beta');
  const received = [];
  beta.on('message:patch/update', (message) => received.push(message));

  assert.equal(await alpha.start(), true);
  assert.equal(await beta.start(), true);
  assert.equal(alpha.state, PeernetClientState.ONLINE);
  assert.equal(beta.state, PeernetClientState.ONLINE);

  assert.equal(alpha.send('beta', 'patch/update', { gain: 0.5 }), true);
  assert.equal(received.length, 1);
  assert.equal(received[0].from, 'alpha');
  assert.equal(received[0].topic, 'patch/update');
  assert.deepEqual(received[0].payload, { gain: 0.5 });
  assert.equal(received[0].envelope.id, 'alpha-msg-1');

  assert.equal(beta.broadcast('presence/update', { name: 'Beta' }), 1);
  await alpha.destroy();
  await beta.destroy();
});

test('invalid or foreign envelopes are dropped at the protocol boundary', async () => {
  const network = new InMemoryNetwork();
  const alphaTransport = network.createTransport('alpha');
  const beta = makeClient(network, 'beta');
  const errors = [];
  const messages = [];
  beta.on('protocol-error', (entry) => errors.push(entry));
  beta.on('message', (entry) => messages.push(entry));

  alphaTransport.start();
  await beta.start();
  assert.equal(alphaTransport.send('beta', { type: 'join', payload: { injected: true } }), true);
  assert.equal(alphaTransport.send('beta', { protocol: 'peernet/message', version: 99, id: 'x', topic: 'probe', sentAt: 1, payload: {} }), true);

  assert.equal(errors.length, 2);
  assert.equal(messages.length, 0);
  assert.match(errors[0].error, /unsupported protocol/);
  assert.match(errors[1].error, /unsupported protocol version/);

  alphaTransport.stop();
  await beta.destroy();
});

test('protocol parser rejects inherited envelope fields', () => {
  const inherited = Object.create({ protocol: 'peernet/message', version: 1, id: 'x', topic: 'probe', sentAt: 1 });
  inherited.payload = {};
  const parsed = parseEnvelope(inherited);
  assert.equal(parsed.ok, false);
  assert.match(parsed.error, /own properties/);
});

test('partition and recovery produce deterministic reconnect lifecycle', async () => {
  const network = new InMemoryNetwork();
  const alpha = makeClient(network, 'alpha');
  const states = [];
  alpha.on('state', ({ state }) => states.push(state));

  await alpha.start();
  assert.equal(network.partition('alpha', 'simulated link loss'), true);
  assert.equal(alpha.state, PeernetClientState.RECONNECTING);
  assert.equal(alpha.send('missing', 'probe', {}), false);
  assert.equal(network.recover('alpha'), true);
  assert.equal(alpha.state, PeernetClientState.ONLINE);
  assert.deepEqual(states.filter((state) => [PeernetClientState.STARTING, PeernetClientState.ONLINE, PeernetClientState.RECONNECTING].includes(state)), [
    PeernetClientState.STARTING,
    PeernetClientState.ONLINE,
    PeernetClientState.RECONNECTING,
    PeernetClientState.ONLINE,
  ]);
  await alpha.destroy();
});

test('start failure degrades to offline without claiming connectivity', async () => {
  const transport = {
    start: () => false,
    stop: () => {},
    subscribe: () => () => {},
    onHealth(handler) { handler(this.health()); return () => {}; },
    broadcast: () => 0,
    send: () => false,
    health: () => ({ state: 'offline', connected: false, lastError: 'signalling unavailable' }),
  };
  const client = new PeernetClient({ transport });
  assert.equal(await client.start(), false);
  assert.equal(client.state, PeernetClientState.OFFLINE);
  assert.equal(client.health().connected, false);
  assert.match(client.health().lastError, /signalling unavailable/);
  await client.destroy();
});

test('send fails closed when a transport violates the boolean delivery contract', async () => {
  const network = new InMemoryNetwork();
  const base = network.createTransport('alpha');
  const transport = Object.create(base);
  transport.send = () => undefined;
  const client = new PeernetClient({ transport, idFactory: () => 'msg-1' });
  await client.start();
  assert.equal(client.send('beta', 'probe', {}), false);
  await client.destroy();
});
