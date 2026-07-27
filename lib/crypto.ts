// Client-side API key encryption
// Uses AES encryption with a device-derived key
// The key is stored encrypted in localStorage, never in plaintext
import CryptoJS from 'crypto-js';

const STORAGE_KEY = 'ielts_h5_encrypted_key';
const SALT = process.env.NEXT_PUBLIC_ENCRYPTION_SALT || 'ielts-h5-salt-2026';

// Derive a device-specific encryption key from browser fingerprint
function getDeviceKey(): string {
  if (typeof window === 'undefined') return SALT;
  const components = [
    navigator.language,
    navigator.hardwareConcurrency?.toString(),
    screen.colorDepth?.toString(),
    new Date().getTimezoneOffset().toString(),
  ];
  return CryptoJS.SHA256(components.join('|') + SALT).toString();
}

// Encrypt API key before storing
export function encryptAndStore(apiKey: string): void {
  if (typeof window === 'undefined') return;
  try {
    const deviceKey = getDeviceKey();
    const encrypted = CryptoJS.AES.encrypt(apiKey, deviceKey).toString();
    localStorage.setItem(STORAGE_KEY, encrypted);
  } catch (e) {
    console.error('Failed to encrypt API key');
  }
}

// Decrypt API key for use
export function getDecryptedKey(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const encrypted = localStorage.getItem(STORAGE_KEY);
    if (!encrypted) return null;
    const deviceKey = getDeviceKey();
    const decrypted = CryptoJS.AES.decrypt(encrypted, deviceKey);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch {
    // If decryption fails (e.g., different device), clear corrupted data
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

// Check if user has configured an API key
export function hasApiKey(): boolean {
  const encrypted = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  return !!encrypted;
}

// Remove stored key
export function removeKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

// Hash key for display (show first + last 4 chars)
export function maskKey(key: string): string {
  if (key.length < 16) return '****';
  return key.substring(0, 6) + '****' + key.substring(key.length - 4);
}
