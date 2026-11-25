import { createDefaultStore, type KeyValueStore } from '../platform/storage';

// v1 has no meta-progression, but the layer exists so unlocks can bolt on later.
export interface SaveData {
  version: 1;
  bestSurvivalSec: number;
  bestLevel: number;
  unlocks: string[]; // reserved: cars, tracks, starter weapons
}

const KEY = 'aesthetic-overdrive/save';
const defaults = (): SaveData => ({ version: 1, bestSurvivalSec: 0, bestLevel: 0, unlocks: [] });

export class SaveManager {
  private data: SaveData;
  constructor(private store: KeyValueStore = createDefaultStore()) {
    this.data = this.load();
  }

  get current(): Readonly<SaveData> { return this.data; }

  recordRun(survivalSec: number, level: number): boolean {
    const newBest = survivalSec > this.data.bestSurvivalSec;
    this.data.bestSurvivalSec = Math.max(this.data.bestSurvivalSec, survivalSec);
    this.data.bestLevel = Math.max(this.data.bestLevel, level);
    this.save();
    return newBest;
  }

  private load(): SaveData {
    try {
      const raw = this.store.get(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SaveData>;
        if (parsed.version === 1) return { ...defaults(), ...parsed } as SaveData;
      }
    } catch { /* corrupt save: fall through to defaults */ }
    return defaults();
  }

  private save() {
    try { this.store.set(KEY, JSON.stringify(this.data)); } catch { /* ignore */ }
  }
}

export const saveManager = new SaveManager();
