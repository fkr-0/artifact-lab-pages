/**
 * Secret Storage API
 *
 * Provides encryption and secure storage capabilities:
 * - Symmetric encryption for local saves
 * - Password-protected state sharing via peernet
 * - Secure key derivation
 * - Encryption utilities for sensitive data
 */

class SecretStorage {
  constructor(opts = {}) {
    this.namespace = opts.namespace || 'artifacts-secret';
    this.debug = opts.debug || false;
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.saltLength = 16;
    this.ivLength = 12;
  }

  _log(...args) {
    if (this.debug) console.log('[SecretStorage]', ...args);
  }

  /**
   * Generate a cryptographic key from a password
   */
  async deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.algorithm, length: this.keyLength },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate a random salt
   */
  generateSalt() {
    return crypto.getRandomValues(new Uint8Array(this.saltLength));
  }

  /**
   * Generate a random IV
   */
  generateIV() {
    return crypto.getRandomValues(new Uint8Array(this.ivLength));
  }

  /**
   * Encrypt data with a password
   */
  async encrypt(data, password) {
    try {
      const salt = this.generateSalt();
      const iv = this.generateIV();
      const key = await this.deriveKey(password, salt);

      const encoder = new TextEncoder();
      const plaintext = encoder.encode(JSON.stringify(data));

      const ciphertext = await crypto.subtle.encrypt(
        { name: this.algorithm, iv: iv },
        key,
        plaintext
      );

      const result = {
        algorithm: this.algorithm,
        salt: Array.from(salt),
        iv: Array.from(iv),
        ciphertext: Array.from(new Uint8Array(ciphertext))
      };

      this._log('Data encrypted successfully');
      return result;
    } catch (e) {
      this._log('Encryption failed', e);
      throw new Error('Encryption failed: ' + e.message);
    }
  }

  /**
   * Decrypt data with a password
   */
  async decrypt(encryptedData, password) {
    try {
      const salt = new Uint8Array(encryptedData.salt);
      const iv = new Uint8Array(encryptedData.iv);
      const ciphertext = new Uint8Array(encryptedData.ciphertext);

      const key = await this.deriveKey(password, salt);

      const plaintext = await crypto.subtle.decrypt(
        { name: this.algorithm, iv: iv },
        key,
        ciphertext
      );

      const decoder = new TextDecoder();
      const data = JSON.parse(decoder.decode(plaintext));

      this._log('Data decrypted successfully');
      return data;
    } catch (e) {
      this._log('Decryption failed', e);
      throw new Error('Decryption failed: ' + e.message);
    }
  }

  /**
   * Encrypt and store data
   */
  async encryptAndStore(key, data, password) {
    const encrypted = await this.encrypt(data, password);
    const storageKey = `${this.namespace}:${key}`;
    localStorage.setItem(storageKey, JSON.stringify(encrypted));
    this._log('Encrypted data stored:', key);
    return encrypted;
  }

  /**
   * Retrieve and decrypt data
   */
  async retrieveAndDecrypt(key, password) {
    const storageKey = `${this.namespace}:${key}`;
    const encryptedJson = localStorage.getItem(storageKey);

    if (!encryptedJson) {
      throw new Error('No encrypted data found for key: ' + key);
    }

    const encrypted = JSON.parse(encryptedJson);
    return this.decrypt(encrypted, password);
  }

  /**
   * Create a shareable encrypted payload for peernet distribution
   */
  async createShareablePayload(data, password, meta = {}) {
    const encrypted = await this.encrypt(data, password);

    return {
      version: '1.0',
      type: 'encrypted-save',
      meta: {
        createdAt: new Date().toISOString(),
        ...meta
      },
      encrypted
    };
  }

  /**
   * Decrypt a shareable payload received from peernet
   */
  async decryptShareablePayload(payload, password) {
    if (payload.type !== 'encrypted-save') {
      throw new Error('Invalid payload type');
    }

    return this.decrypt(payload.encrypted, password);
  }

  /**
   * Generate a random password
   */
  generatePassword(length = 16) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);

    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars[array[i] % chars.length];
    }

    return password;
  }

  /**
   * Hash a password for verification (WARNING: Not for production auth)
   */
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password, hash) {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }

  /**
   * Clear all encrypted storage
   */
  clear() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.namespace));
    keys.forEach(key => localStorage.removeItem(key));
    this._log('Cleared all encrypted storage');
  }

  /**
   * List all encrypted storage keys
   */
  listKeys() {
    return Object.keys(localStorage)
      .filter(k => k.startsWith(this.namespace))
      .map(k => k.replace(this.namespace + ':', ''));
  }
}

/**
 * Secure Save Slot - Encrypted save slots
 */
class SecureSaveSlot {
  constructor(opts = {}) {
    this.secretStorage = new SecretStorage(opts);
    this.namespace = opts.namespace || 'artifacts-slot';
    this.maxSlots = opts.maxSlots || 10;
  }

  /**
   * Save encrypted data to a slot
   */
  async save(slotId, data, password, meta = {}) {
    if (slotId < 1 || slotId > this.maxSlots) {
      throw new Error(`Slot ID must be between 1 and ${this.maxSlots}`);
    }

    const payload = await this.secretStorage.createShareablePayload(data, password, {
      slotId,
      ...meta
    });

    const key = `${this.namespace}:${slotId}`;
    localStorage.setItem(key, JSON.stringify(payload));

    return {
      slotId,
      savedAt: payload.meta.createdAt,
      meta: payload.meta
    };
  }

  /**
   * Load and decrypt data from a slot
   */
  async load(slotId, password) {
    const key = `${this.namespace}:${slotId}`;
    const payloadJson = localStorage.getItem(key);

    if (!payloadJson) {
      throw new Error(`No save found in slot ${slotId}`);
    }

    const payload = JSON.parse(payloadJson);
    return this.secretStorage.decryptShareablePayload(payload, password);
  }

  /**
   * Check if a slot has data (without decrypting)
   */
  hasData(slotId) {
    const key = `${this.namespace}:${slotId}`;
    return localStorage.getItem(key) !== null;
  }

  /**
   * Get slot metadata (without decrypting)
   */
  getMeta(slotId) {
    const key = `${this.namespace}:${slotId}`;
    const payloadJson = localStorage.getItem(key);

    if (!payloadJson) return null;

    try {
      const payload = JSON.parse(payloadJson);
      return {
        slotId,
        createdAt: payload.meta.createdAt,
        ...payload.meta
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * List all slots with metadata
   */
  listAll() {
    const slots = [];
    for (let i = 1; i <= this.maxSlots; i++) {
      const meta = this.getMeta(i);
      if (meta) {
        slots.push(meta);
      }
    }
    return slots;
  }

  /**
   * Clear a slot
   */
  clear(slotId) {
    const key = `${this.namespace}:${slotId}`;
    localStorage.removeItem(key);
  }

  /**
   * Clear all slots
   */
  clearAll() {
    for (let i = 1; i <= this.maxSlots; i++) {
      this.clear(i);
    }
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SecretStorage, SecureSaveSlot };
}
