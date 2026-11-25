import { config } from '../config';

// Pseudo-3D: an object has a base position (bx, by) on the player plane (z = 1) and a depth z in [0, 1]
// (0 = horizon, 1 = player). Screen position and scale converge on the vanishing point as z -> 0.
const VX = config.width / 2;
const VY = config.horizonY;

export function depthScale(z: number): number {
  return z * z;
}

export function projectX(bx: number, z: number): number {
  return VX + (bx - VX) * depthScale(z);
}

export function projectY(by: number, z: number): number {
  return VY + (by - VY) * depthScale(z);
}
