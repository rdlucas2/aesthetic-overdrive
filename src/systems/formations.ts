import { config } from '../config';
import type { FormationKind } from '../data/tracks';

export interface SpawnPoint { bx: number; by: number }

const W = config.width;
const MIN_Y = config.playerMinY - 20;
const MAX_Y = config.playerMaxY + 10;
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Returns base positions (player-plane coordinates) for a formation. */
export function makeFormation(kind: FormationKind, count = 1): SpawnPoint[] {
  const out: SpawnPoint[] = [];
  const xAt = (i: number, n: number) => 90 + ((W - 180) * (n === 1 ? 0.5 : i / (n - 1)));
  switch (kind) {
    case 'single':
      out.push({ bx: rand(90, W - 90), by: rand(MIN_Y, MAX_Y) });
      break;
    case 'line': {
      const by = rand(MIN_Y, MAX_Y);
      const x0 = rand(160, W - 160 - count * 80);
      for (let i = 0; i < count; i++) out.push({ bx: x0 + i * 90, by });
      break;
    }
    case 'arc': {
      const mid = (MIN_Y + MAX_Y) / 2;
      const flip = Math.random() < 0.5 ? 1 : -1;
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0.5 : i / (count - 1);
        out.push({ bx: xAt(i, count), by: mid + flip * (Math.sin(t * Math.PI) - 0.5) * (MAX_Y - MIN_Y) });
      }
      break;
    }
    case 'wall': {
      const gap = Math.floor(rand(0, count));
      const by = rand(MIN_Y + 20, MAX_Y - 20);
      for (let i = 0; i < count; i++) if (i !== gap) out.push({ bx: xAt(i, count), by });
      break;
    }
  }
  return out;
}
