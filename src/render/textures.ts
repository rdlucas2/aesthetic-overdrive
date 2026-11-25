import Phaser from 'phaser';

// All sprites are drawn procedurally (no external art assets).
export function generateTextures(scene: Phaser.Scene) {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const bake = (key: string, w: number, h: number) => {
    g.generateTexture(key, w, h);
    g.clear();
  };

  // Player car, seen from behind (own design: pink wedge, red taillights, cyan accents)
  g.fillStyle(0x120022, 1);
  g.fillRect(8, 54, 22, 16);
  g.fillRect(98, 54, 22, 16);
  g.lineStyle(2, 0x00ffe1, 1);
  g.strokeRect(8, 54, 22, 16);
  g.strokeRect(98, 54, 22, 16);
  g.fillStyle(0xff3fa4, 1);
  g.fillPoints([{ x: 4, y: 52 }, { x: 124, y: 52 }, { x: 112, y: 26 }, { x: 16, y: 26 }], true);
  g.fillStyle(0x8a2cff, 1);
  g.fillPoints([{ x: 30, y: 28 }, { x: 98, y: 28 }, { x: 88, y: 6 }, { x: 40, y: 6 }], true);
  g.fillStyle(0x1a0a3a, 1);
  g.fillPoints([{ x: 38, y: 26 }, { x: 90, y: 26 }, { x: 83, y: 10 }, { x: 45, y: 10 }], true);
  g.lineStyle(2, 0x00ffe1, 0.9);
  g.strokePoints([{ x: 38, y: 26 }, { x: 90, y: 26 }, { x: 83, y: 10 }, { x: 45, y: 10 }], true);
  g.fillStyle(0x2a0a4a, 1);
  g.fillRect(6, 50, 116, 8);
  g.fillStyle(0xff2244, 1);
  g.fillRect(10, 34, 30, 9);
  g.fillRect(88, 34, 30, 9);
  g.fillStyle(0xffd0d8, 1);
  g.fillRect(14, 37, 22, 3);
  g.fillRect(92, 37, 22, 3);
  g.fillStyle(0x00ffe1, 1);
  g.fillRect(4, 49, 120, 2);
  bake('car', 128, 72);

  // Bullet: cyan streak with white core
  g.fillStyle(0x00ffe1, 0.45);
  g.fillRoundedRect(0, 0, 16, 44, 8);
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(5, 4, 6, 36, 3);
  bake('bullet', 16, 44);

  // Loading spinner: ring of fading dots
  const cx = 48;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const r = 5 + (i / 8) * 7;
    g.fillStyle(i % 2 ? 0xff3fa4 : 0x00ffe1, 0.25 + (i / 8) * 0.75);
    g.fillCircle(cx + Math.cos(a) * 34, cx + Math.sin(a) * 34, r);
  }
  g.lineStyle(2, 0xffffff, 0.35);
  g.strokeCircle(cx, cx, 34);
  bake('spinner', 96, 96);

  // XP gem
  g.fillStyle(0xfff35c, 1);
  g.fillPoints([{ x: 12, y: 0 }, { x: 24, y: 12 }, { x: 12, y: 24 }, { x: 0, y: 12 }], true);
  g.fillStyle(0xffffff, 0.8);
  g.fillPoints([{ x: 12, y: 4 }, { x: 18, y: 12 }, { x: 12, y: 12 }, { x: 6, y: 12 }], true);
  bake('gem', 24, 24);

  // Soft glow (particles / underglow)
  for (let i = 16; i > 0; i--) {
    g.fillStyle(0xffffff, 0.06);
    g.fillCircle(16, 16, i);
  }
  bake('glow', 32, 32);

  g.destroy();
}
