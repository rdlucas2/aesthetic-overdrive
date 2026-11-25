export interface PlayerStats {
  maxHp: number;
  moveSpeed: number;
  magnet: number; // px radius (player plane) in which XP gems are pulled in
  damage: number;
  fireSteps: number; // 16th-note steps between shots (4 = quarter note)
  projectiles: number;
  pierce: number;
}
