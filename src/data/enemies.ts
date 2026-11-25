export interface EnemyDef {
  id: string;
  texture: string;
  hp: number;
  radius: number; // px at the player plane
  travelBeats: number; // beats from horizon to player (lands on the beat)
  xp: number;
  contactDamage: number;
  spriteScale: number;
}

export const ENEMIES: Record<string, EnemyDef> = {
  spinner: {
    id: 'spinner',
    texture: 'spinner',
    hp: 2,
    radius: 46,
    travelBeats: 8,
    xp: 1,
    contactDamage: 12,
    spriteScale: 1,
  },
};
