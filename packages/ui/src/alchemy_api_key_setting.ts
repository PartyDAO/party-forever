const STORAGE_KEY = "ALCHEMY_API_KEY";

/**
 * Get the Alchemy API key from localStorage, or null if not set.
 * Callers should fall back to their env var if this returns null.
 */
export const getAlchemyApiKeyFromStorage = (): string | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored?.trim()) return stored.trim();
  } catch {
    // Ignore storage errors
  }
  return null;
};

export const setAlchemyApiKeyInStorage = (key: string): void => {
  try {
    localStorage.setItem(STORAGE_KEY, key.trim());
  } catch {
    // Ignore storage errors
  }
};

export const clearAlchemyApiKeyInStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
};
