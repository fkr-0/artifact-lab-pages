# Public API

The new API is intentionally small. Application code should depend on `PeernetClient` plus a transport, not on PeerJS connection objects or hub-election messages.

## PeernetClient

```js
import { PeernetClient, PeerJsHubTransport } from '@peernet/peernetjs';

const transport = new PeerJsHubTransport({
  lobbyId: 'studio-v1',
  username: 'pilot',
  Peer,
});
const client = new PeernetClient({ transport });

client.on('message:patch/update', ({ from, payload }) => {
  console.log(from, payload);
});

await client.start();
client.broadcast('presence/update', { name: 'pilot' });
client.send('peer-id', 'patch/update', { gain: 0.5 });
```

### Lifecycle

`PeernetClientState` is `idle | starting | online | reconnecting | offline | stopping | stopped | destroyed`. `PeerJsHubTransport.stop()` reports transport state `stopped`; a later `start()` constructs a fresh lobby instance.

Transport role (for example PeerJS hub/client) is metadata in `client.health().transport`; it is not a second application lifecycle.

### Events

- `status` / `state`: lifecycle transition details.
- `health`: composite client + transport health.
- `message`: every valid Peernet application envelope.
- `message:<topic>`: a valid envelope for one topic.
- `protocol-error`: malformed, foreign, or unsupported envelopes. They are not delivered to application handlers.
- `error`: a transport start/reconnect exception.

`on()` returns an unsubscribe function. `send()` returns a delivery-attempt boolean and fails closed unless the transport explicitly returns `true`. `broadcast()` returns the transport's delivered-peer count when available.

## Transport contract

A transport must implement:

```text
start()                         -> boolean | Promise<boolean>
stop()                          -> void | Promise<void>
restart()?                      -> boolean | Promise<boolean>
subscribe(handler)              -> unsubscribe()
onHealth(handler)               -> unsubscribe()
send(peerId, envelope)          -> boolean
broadcast(envelope)             -> number | boolean
health()                        -> object
```

`subscribe(handler)` calls `handler(envelope, { peerId, ...metadata })`. The transport is responsible for discovery, connection ownership, retry policy, and mapping remote identity to `peerId`.

`PeerJsHubTransport` is the production browser adapter. It wraps the existing `PeernetLobby`, which currently owns fixed-ID hub election, mesh expansion, and bounded reconnect logic. This containment is deliberate: applications can migrate to the stable transport contract while the PeerJS implementation evolves internally.

Transport authors can import `assertTransportShape` and `runTransportConformance` from `@peernet/peernetjs/testing`. The harness verifies start/health, direct sender metadata, broadcast, stop, and—when fixture callbacks are supplied—partition failure and recovery.

## Legacy exports

The flat files remain compatibility entrypoints under `./legacy/*`. They are not the recommended API for new code. In particular, `PeernetSharedCore` remains a browser-global script and its application/control messages share one historical top-level `type` namespace.
