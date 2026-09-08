import assert from 'node:assert/strict';
import test from 'node:test';

import {
  InMemoryNetwork,
  assertTransportShape,
  runTransportConformance,
} from '../src/testing/index.js';

test('transport shape rejects partial adapters', () => {
  assert.throws(
    () => assertTransportShape({ start() {} }),
    /stop\(\) is required/,
  );
});

test('in-memory transport satisfies delivery and resilience conformance', async () => {
  const network = new InMemoryNetwork();
  const result = await runTransportConformance({
    createPair: () => ({
      left: network.createTransport('left'),
      right: network.createTransport('right'),
      leftId: 'left',
      rightId: 'right',
      partition: (peerId) => network.partition(peerId, 'conformance partition'),
      recover: (peerId) => network.recover(peerId),
    }),
  });

  assert.deepEqual(
    {
      directMessages: result.directMessages,
      broadcastMessages: result.broadcastMessages,
      resilienceQualified: result.resilienceQualified,
    },
    { directMessages: 1, broadcastMessages: 1, resilienceQualified: true },
  );
  assert.ok(result.observedHealthEvents >= 3);
});
