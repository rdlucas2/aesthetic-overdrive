// Key/value storage behind an interface so wrappers (Electron/Capacitor) can swap the backend.
export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

class MemoryStore implements KeyValueStore {
  private data = new Map<string, string>();
  get(key: string) { return this.data.get(key) ?? null; }
  set(key: string, value: string) { this.data.set(key, value); }
  remove(key: string) { this.data.delete(key); }
}

class LocalStorageStore implements KeyValueStore {
  get(key: string) { return localStorage.getItem(key); }
  set(key: string, value: string) { localStorage.setItem(key, value); }
  remove(key: string) { localStorage.removeItem(key); }
}

export function createDefaultStore(): KeyValueStore {
  try {
    const probe = '__ao_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return new LocalStorageStore();
  } catch {
    return new MemoryStore();
  }
}
