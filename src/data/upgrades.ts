import type { PlayerStats } from './stats';

export interface UpgradeDef {
  id: string;
  name: string;
  desc: string;
  maxLevel: number;
  apply: (stats: PlayerStats) => void; // applied once per level taken
}

export const UPGRADES: UpgradeDef[] = [
  { id: 'dmg', name: 'Bass Boost', desc: '+30% shot damage', maxLevel: 5, apply: (s) => { s.damage *= 1.3; } },
  { id: 'rate', name: 'Double Time', desc: 'Fire a 16th-step faster', maxLevel: 3, apply: (s) => { s.fireSteps = Math.max(1, s.fireSteps - 1); } },
  { id: 'multi', name: 'Harmonic Split', desc: '+1 projectile', maxLevel: 4, apply: (s) => { s.projectiles += 1; } },
  { id: 'pierce', name: 'Reverb', desc: 'Shots pierce +1 enemy', maxLevel: 3, apply: (s) => { s.pierce += 1; } },
  { id: 'magnet', name: 'Tractor Beam', desc: '+70px XP pickup range', maxLevel: 4, apply: (s) => { s.magnet += 70; } },
  { id: 'hp', name: 'Neon Plating', desc: '+25 max HP and heal 25', maxLevel: 4, apply: (s) => { s.maxHp += 25; } },
  { id: 'move', name: 'Turbo Drift', desc: '+15% move speed', maxLevel: 3, apply: (s) => { s.moveSpeed *= 1.15; } },
];
