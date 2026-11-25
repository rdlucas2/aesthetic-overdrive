import type { PlayerStats } from './stats';

export interface WeaponDef {
  id: string;
  name: string;
  texture: string;
  bulletTravelBeats: number; // beats for a bullet to reach the horizon
  bulletRadius: number;
  base: Pick<PlayerStats, 'damage' | 'fireSteps' | 'projectiles' | 'pierce'>;
}

export const WEAPONS: Record<string, WeaponDef> = {
  pulse: {
    id: 'pulse',
    name: 'Synth Pulse',
    texture: 'bullet',
    bulletTravelBeats: 1.5,
    bulletRadius: 20,
    base: { damage: 1, fireSteps: 4, projectiles: 1, pierce: 0 },
  },
};
export const STARTER_WEAPON = 'pulse';
