const REQUIRED_METHODS = Object.freeze([
  'start',
  'stop',
  'subscribe',
  'onHealth',
  'send',
  'broadcast',
  'health',
]);

function invariant(condition, message) {
  if (!condition) throw new Error(`Peernet transport conformance: ${message}`);
}

export function assertTransportShape(transport) {
  invariant(transport && typeof transport === 'object', 'transport must be an object');
  for (const method of REQUIRED_METHODS) {
    invariant(typeof transport[method] === 'function', `${method}() is required`);
  }
  return true;
}

/**
 * Reusable deterministic contract harness for transport implementations.
 * createPair() must return { left, right, leftId, rightId }.
 * Optional partition/recover callbacks qualify resilience semantics.
 */
export async function runTransportConformance({ createPair }) {
  if (typeof createPair !== 'function') throw new TypeError('createPair must be a function');
  const fixture = await createPair();
  const { left, right, leftId, rightId, partition, recover } = fixture || {};
  assertTransportShape(left);
  assertTransportShape(right);
  invariant(leftId && rightId, 'fixture must provide leftId and rightId');

  const received = [];
  const leftHealth = [];
  const unsubscribeMessage = right.subscribe((message, meta) => received.push({ message, meta }));
  const unsubscribeHealth = left.onHealth((health) => leftHealth.push(health));

  try {
    invariant((await Promise.resolve(left.start())) !== false, 'left.start() failed');
    invariant((await Promise.resolve(right.start())) !== false, 'right.start() failed');
    invariant(Boolean(left.health()?.connected), 'left must report connected after start');
    invariant(Boolean(right.health()?.connected), 'right must report connected after start');

    const direct = { probe: 'direct', sequence: 1 };
    invariant(left.send(rightId, direct) !== false, 'send() must report direct delivery attempt');
    invariant(received.length === 1, 'direct message was not delivered exactly once');
    invariant(received[0].meta?.peerId === leftId, 'direct message peerId metadata is wrong');
    invariant(received[0].message?.probe === 'direct', 'direct message payload was altered');

    const broadcastBefore = received.length;
    const delivered = left.broadcast({ probe: 'broadcast', sequence: 2 });
    invariant(delivered !== false && delivered !== 0, 'broadcast() must report at least one delivery');
    invariant(received.length === broadcastBefore + 1, 'broadcast was not delivered exactly once');

    if (typeof partition === 'function' && typeof recover === 'function') {
      await Promise.resolve(partition(leftId));
      invariant(!left.health()?.connected, 'partitioned transport must not report connected');
      invariant(left.send(rightId, { probe: 'partitioned' }) === false, 'send during partition must fail closed');
      await Promise.resolve(recover(leftId));
      invariant(Boolean(left.health()?.connected), 'recovered transport must report connected');
      invariant(left.send(rightId, { probe: 'recovered' }) !== false, 'send after recovery must work');
    }

    return {
      directMessages: 1,
      broadcastMessages: 1,
      resilienceQualified: typeof partition === 'function' && typeof recover === 'function',
      observedHealthEvents: leftHealth.length,
    };
  } finally {
    unsubscribeMessage?.();
    unsubscribeHealth?.();
    await Promise.resolve(right.stop());
    await Promise.resolve(left.stop());
  }
}
