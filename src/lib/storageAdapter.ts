/**
 * Storage adapter — lets the app swap persistence backends without touching
 * components. Today only LocalStorageAdapter is wired up. When this tool is
 * installed inside the Opsette parent app, a ParentPostMessageAdapter can be
 * plugged in here and nothing else changes.
 */
export interface StorageAdapter {
  read<T>(key: string, fallback: T): Promise<T>;
  write<T>(key: string, value: T): Promise<void>;
  remove?(key: string): Promise<void>;
}

export class LocalStorageAdapter implements StorageAdapter {
  async read<T>(key: string, fallback: T): Promise<T> {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  async write<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Quota / private-mode — silently ignore; data stays in-memory this session.
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
}

let adapter: StorageAdapter = new LocalStorageAdapter();

export function getStorageAdapter(): StorageAdapter {
  return adapter;
}

export function setStorageAdapter(next: StorageAdapter) {
  adapter = next;
}
