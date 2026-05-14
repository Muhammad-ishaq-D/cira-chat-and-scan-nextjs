/**
 * HIPAA Compliance: Secure Frontend Storage Utility
 * Provides a layer of protection for data stored in localStorage/sessionStorage.
 */

const STORAGE_PREFIX = "cira_sec_";

/**
 * Simple obfuscation for frontend storage to prevent easy plain-text inspection.
 * Note: This is not a replacement for backend encryption, but a HIPAA "best practice" 
 * for local data at rest to mitigate risk from physical device access.
 */
function obfuscate(text: string): string {
  if (!text) return text;
  // Simple base64 + basic character shifting to prevent plain-text discovery
  const encoded = btoa(text);
  return encoded.split('').reverse().join('');
}

function deobfuscate(text: string): string {
  if (!text) return text;
  try {
    const reversed = text.split('').reverse().join('');
    return atob(reversed);
  } catch (e) {
    // If it's not obfuscated (legacy data), return as is
    return text;
  }
}

export const secureStorage = {
  /** Save data with obfuscation */
  set: (key: string, value: any, useSession = false) => {
    const storage = useSession ? sessionStorage : localStorage;
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    storage.setItem(STORAGE_PREFIX + key, obfuscate(stringValue));
  },

  /** Get and deobfuscate data */
  get: (key: string, useSession = false): any => {
    const storage = useSession ? sessionStorage : localStorage;
    const raw = storage.getItem(STORAGE_PREFIX + key);
    if (!raw) {
      // Check for non-prefixed legacy data
      const legacy = storage.getItem(key);
      if (legacy) return legacy;
      return null;
    }
    
    const decrypted = deobfuscate(raw);
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  },

  /** Remove item */
  remove: (key: string, useSession = false) => {
    const storage = useSession ? sessionStorage : localStorage;
    storage.removeItem(STORAGE_PREFIX + key);
    storage.removeItem(key); // Also clear legacy
  },

  /** Clear all Cira related data */
  clear: () => {
    const storages = [localStorage, sessionStorage];
    storages.forEach(s => {
      Object.keys(s).forEach(key => {
        if (key.startsWith("cira_") || key.startsWith(STORAGE_PREFIX)) {
          s.removeItem(key);
        }
      });
    });
  }
};
