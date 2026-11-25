import Phaser from 'phaser';
import { config } from '../config';

const W = config.width;
const H = config.height;
const HZ = config.horizonY;
const CX = W / 2;

function ridge(seed: number, amp: number, baseY: number, width: number, step: number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let x = -60; x <= width + 60; x += step) {
    const n =
      Math.sin(x * 0.011 + seed) * 0.5 +
      Math.sin(x * 0.027 + seed * 2.3) * 0.3 +
      Math.abs(Math.sin(x * 0.006 + seed * 0.7)) * 0.6;
    pts.push({ x, y: baseY - Math.max(0, n) * amp });
  }
  return pts;
}

export class Backdrop {
  private moon: Phaser.GameObjects.Graphics;
  private mountains: Phaser.GameObjects.Graphics;
  private grid: Phaser.GameObjects.Graphics;
  private scroll = 0;

  constructor(scene: Phaser.Scene) {
    const sky = scene.add.graphics().setDepth(0);
    sky.fillGradientStyle(0x03000a, 0x03000a, 0x3a0c63, 0x3a0c63, 1);
    sky.fillRect(0, 0, W, HZ);
    sky.fillGradientStyle(0x14032b, 0x14032b, 0x05010f, 0x05010f, 1);
    sky.fillRect(0, HZ, W, H - HZ);

    // Starfield
    const rng = new Phaser.Math.RandomDataGenerator(['aesthetic']);
    for (let i = 0; i < 180; i++) {
      const y = rng.frac() * HZ;
      const a = 0.25 + rng.frac() * 0.75 * (1 - (y / HZ) * 0.6);
      sky.fillStyle(rng.frac() > 0.85 ? 0xffb3f0 : 0xffffff, a);
      sky.fillRect(rng.frac() * W, y, rng.frac() > 0.9 ? 2 : 1, rng.frac() > 0.9 ? 2 : 1);
    }

    // Moon with retro cut bands, drawn around (0,0) so it can pulse on the beat
    this.moon = scene.add.graphics({ x: CX, y: HZ - 105 }).setDepth(1);
    for (let i = 6; i > 0; i--) {
      this.moon.fillStyle(0xc9a8ff, 0.05);
      this.moon.fillCircle(0, 0, 90 + i * 14);
    }
    this.moon.fillStyle(0xe6d4ff, 1);
    this.moon.fillCircle(0, 0, 90);
    this.moon.fillStyle(0xb48cff, 0.55);
    this.moon.fillCircle(-22, -18, 26);
    this.moon.fillCircle(30, 20, 18);
    this.moon.fillCircle(-38, 34, 12);

    // Wireframe mountains (shifted slightly with steering for parallax)
    this.mountains = scene.add.graphics().setDepth(2);
    const rows = [
      { seed: 1.3, amp: 80, col: 0xb024ff, fill: 0x14032b, a: 0.7 },
      { seed: 4.1, amp: 60, col: 0xff3fa4, fill: 0x0b0120, a: 1 },
    ];
    for (const row of rows) {
      const pts = ridge(row.seed, row.amp, HZ, W + 120, 14);
      const poly = [{ x: pts[0].x, y: HZ }, ...pts, { x: pts[pts.length - 1].x, y: HZ }];
      this.mountains.fillStyle(row.fill, 1);
      this.mountains.fillPoints(poly, true);
      this.mountains.lineStyle(2, row.col, row.a);
      this.mountains.strokePoints(pts, false);
      this.mountains.lineStyle(1, row.col, row.a * 0.35);
      for (let i = 0; i < pts.length; i += 2) {
        this.mountains.lineBetween(pts[i].x, pts[i].y, pts[i].x + (pts[i].x < CX ? 14 : -14), HZ);
      }
    }
    this.mountains.setX(-60);

    // Horizon glow strip
    const glow = scene.add.graphics().setDepth(3);
    glow.fillGradientStyle(0xff3fa4, 0xff3fa4, 0xff3fa4, 0xff3fa4, 0.55, 0.55, 0, 0);
    glow.fillRect(0, HZ - 14, W, 14);

    this.grid = scene.add.graphics().setDepth(4);
  }

  /** beat: fractional beat position (can be negative); steer: player x offset from centre in px. */
  update(dt: number, beat: number, bpm: number, steer: number) {
    const phase = beat < 0 ? 0 : beat - Math.floor(beat);
    const pulse = Math.pow(1 - phase, 3);

    this.moon.setScale(1 + pulse * 0.04);
    this.mountains.x = -60 - steer * 0.04;

    this.scroll = (this.scroll + dt * (bpm / 60) * 0.5) % 1;
    const g = this.grid;
    g.clear();
    const rowsN = 20;
    const h = H - HZ;
    for (let i = 0; i < rowsN; i++) {
      const t = (i + this.scroll) / rowsN;
      const u = Math.pow(t, 2.6);
      const y = HZ + h * u;
      g.lineStyle(4 * u + 1, 0xff3fa4, 0.12 + pulse * 0.2);
      g.lineBetween(0, y, W, y);
      g.lineStyle(1 + u * 1.2, 0xff7be0, 0.45 + pulse * 0.4);
      g.lineBetween(0, y, W, y);
    }
    const spacing = 120;
    const shift = -steer * 0.15;
    for (let k = -12; k <= 12; k++) {
      const bx = CX + k * spacing + shift;
      g.lineStyle(3, 0xb024ff, 0.15 + pulse * 0.15);
      g.lineBetween(CX + k * 8, HZ, bx, H);
      g.lineStyle(1.2, 0xd68bff, 0.6 + pulse * 0.3);
      g.lineBetween(CX + k * 8, HZ, bx, H);
    }
  }
}
