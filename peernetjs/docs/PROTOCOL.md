# Messaging protocol v1

The new public message layer does not reuse the historical PeerJS hub control protocol. Hub election and mesh membership are transport-private.

## Envelope

```json
{
  "protocol": "peernet/message",
  "version": 1,
  "id": "sender-generated-message-id",
  "topic": "patch/update",
  "sentAt": 1788865200000,
  "payload": {}
}
```

Rules:

- `protocol` and `version` must match exactly.
- `id` is a non-empty sender-generated identifier of at most 160 characters. v1 does not promise global uniqueness or deduplication.
- `topic` is non-empty, contains no whitespace, and is at most 128 characters.
- `sentAt` is sender metadata, not a trusted clock or conflict-resolution authority.
- `payload` is opaque to PeernetJS. Consumers must validate their own topic payload schemas.
- Sender identity comes from transport metadata (`meta.peerId`), not an envelope `from` field. This avoids accidentally trusting a self-asserted sender field.

Required envelope fields must be own properties; inherited prototype values do not satisfy the parser. Malformed and unsupported envelopes produce `protocol-error` and are not forwarded to application handlers.

## Historical wire compatibility

`PeernetLobby` / `PeernetSharedCore` use top-level `type` values such as `join`, `peer-list`, `new-peer`, `peer-left`, `hello`, and `username` for mesh control. Application payloads that reuse those values can collide with control semantics. The v1 envelope intentionally has no top-level `type`, so it traverses the legacy lobby as opaque application data.

This package does not claim protocol compatibility with arbitrary old application messages. Migrate at an adapter boundary and version application topics explicitly when semantics change.
