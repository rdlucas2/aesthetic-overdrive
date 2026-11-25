// Every track needs bpm + offset (seconds from audio start to the first beat).
// Spawns are quantized to the beat clock derived from audio time.
export type FormationKind = 'single' | 'line' | 'arc' | 'wall';

export interface SpawnRule {
  kind: FormationKind;
  everyBeats: number;
  count?: number;
}

export interface TrackSection {
  fromBar: number; // 4 beats per bar
  rules: SpawnRule[];
}

export interface TrackDef {
  id: string;
  name: string;
  bpm: number;
  offset: number;
  chords: number[][]; // MIDI notes, one chord per bar (synth backing)
  layers: { bass: number; clap: number; hat: number; hat16: number; arp: number }; // bar at which each layer enters
  sections: TrackSection[]; // chill -> chaos
}

export const TRACKS: Record<string, TrackDef> = {
  neonDrive: {
    id: 'neonDrive',
    name: 'Neon Drive (procedural)',
    bpm: 96,
    offset: 0,
    chords: [
      [57, 60, 64], // Am
      [53, 57, 60], // F
      [60, 64, 67], // C
      [55, 59, 62], // G
    ],
    layers: { bass: 2, clap: 4, hat: 6, hat16: 24, arp: 12 },
    sections: [
      { fromBar: 0, rules: [{ kind: 'single', everyBeats: 2 }] },
      { fromBar: 6, rules: [{ kind: 'single', everyBeats: 1 }] },
      { fromBar: 12, rules: [{ kind: 'line', everyBeats: 2, count: 3 }, { kind: 'single', everyBeats: 1 }] },
      { fromBar: 20, rules: [{ kind: 'arc', everyBeats: 2, count: 5 }, { kind: 'single', everyBeats: 1 }] },
      { fromBar: 30, rules: [{ kind: 'wall', everyBeats: 4, count: 7 }, { kind: 'arc', everyBeats: 2, count: 5 }, { kind: 'single', everyBeats: 0.5 }] },
      { fromBar: 42, rules: [{ kind: 'wall', everyBeats: 2, count: 8 }, { kind: 'line', everyBeats: 1, count: 4 }, { kind: 'single', everyBeats: 0.5 }] },
    ],
  },
};
export const STARTER_TRACK = 'neonDrive';
