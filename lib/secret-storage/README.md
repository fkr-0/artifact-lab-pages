# Secret Storage API

Encryption and secure storage capabilities for the Artifacts project.

## Features

- **Symmetric Encryption**: AES-GCM encryption for sensitive data
- **Password Protection**: Secure key derivation with PBKDF2
- **Shareable Payloads**: Create encrypted payloads for peernet distribution
- **Secure Save Slots**: Encrypted save slots with metadata

## Usage

```javascript
import { SecretStorage, SecureSaveSlot } from './lib/secret-storage/secret-storage.js';

// Basic encryption
const secret = new SecretStorage();

// Encrypt data with password
const encrypted = await secret.encrypt(
  { sensitive: 'data' },
  'my-password'
);

// Decrypt data
const decrypted = await secret.decrypt(encrypted, 'my-password');

// Encrypt and store
await secret.encryptAndStore('key', data, 'password');

// Retrieve and decrypt
const data = await secret.retrieveAndDecrypt('key', 'password');

// Create shareable payload for peernet
const payload = await secret.createShareablePayload(
  data,
  'password',
  { type: 'save-game' }
);

// Decrypt received payload
const received = await secret.decryptShareablePayload(payload, 'password');

// Secure Save Slots
const slots = new SecureSaveSlot();

// Save encrypted slot
await slots.save(1, { progress: 0.8 }, 'password', {
  name: 'Main Save',
  level: 5
});

// Load encrypted slot
const slot = await slots.load(1, 'password');

// List slots (metadata only, no decryption needed)
const allSlots = slots.listAll();
```

## Security Notes

- Uses AES-GCM with 256-bit keys
- PBKDF2 with 100,000 iterations for key derivation
- Random salt and IV for each encryption
- **Warning**: This is client-side encryption suitable for casual use. For production applications handling truly sensitive data, consider additional security measures.

## API

### SecretStorage

**Options:**
- `namespace`: Storage namespace (default: 'artifacts-secret')
- `algorithm`: Encryption algorithm (default: 'AES-GCM')
- `keyLength`: Key length in bits (default: 256)
- `debug`: Enable debug logging (default: false)

**Methods:**
- `encrypt(data, password)`: Encrypt data with password
- `decrypt(encryptedData, password)`: Decrypt data with password
- `encryptAndStore(key, data, password)`: Encrypt and store data
- `retrieveAndDecrypt(key, password)`: Retrieve and decrypt data
- `createShareablePayload(data, password, meta)`: Create shareable payload
- `decryptShareablePayload(payload, password)`: Decrypt shareable payload
- `generatePassword(length)`: Generate random password
- `hashPassword(password)`: Hash password for verification
- `verifyPassword(password, hash)`: Verify password against hash
- `clear()`: Clear all encrypted storage
- `listKeys()`: List all encrypted storage keys

### SecureSaveSlot

**Options:**
- `namespace`: Storage namespace (default: 'artifacts-slot')
- `maxSlots`: Maximum number of slots (default: 10)

**Methods:**
- `save(slotId, data, password, meta)`: Save encrypted data to slot
- `load(slotId, password)`: Load and decrypt data from slot
- `hasData(slotId)`: Check if slot has data
- `getMeta(slotId)`: Get slot metadata (no decryption)
- `listAll()`: List all slots with metadata
- `clear(slotId)`: Clear a slot
- `clearAll()`: Clear all slots
