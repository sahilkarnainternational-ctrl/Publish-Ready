function hasStorage(storage: Storage | undefined): storage is Storage {
  return typeof storage !== 'undefined' && storage != null;
}

export function safeLocalStorageGet(key: string): string | null {
  try {
    if (typeof window === 'undefined' || !hasStorage(window.localStorage)) return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeLocalStorageSet(key: string, value: string): void {
  try {
    if (typeof window === 'undefined' || !hasStorage(window.localStorage)) return;
    window.localStorage.setItem(key, value);
  } catch {
    /* quota / private mode */
  }
}

export function safeLocalStorageRemove(key: string): void {
  try {
    if (typeof window === 'undefined' || !hasStorage(window.localStorage)) return;
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function safeSessionStorageGet(key: string): string | null {
  try {
    if (typeof window === 'undefined' || !hasStorage(window.sessionStorage)) return null;
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSessionStorageSet(key: string, value: string): void {
  try {
    if (typeof window === 'undefined' || !hasStorage(window.sessionStorage)) return;
    window.sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function safeSessionStorageRemove(key: string): void {
  try {
    if (typeof window === 'undefined' || !hasStorage(window.sessionStorage)) return;
    window.sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
