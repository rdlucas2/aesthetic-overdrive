import Phaser from 'phaser';
import { config } from '../config';
import type { UpgradeDef } from '../data/upgrades';
import { FONT, MONO } from './TitleScene';

export interface LevelUpData {
  choices: UpgradeDef[];
  levels: Record<string, number>;
}

export class LevelUpScene extends Phaser.Scene {
  private picked = false;

  constructor() { super('LevelUp'); }

  create(data: LevelUpData) {
    this.picked = false;
    const { width: W, height: H } = config;
    this.add.rectangle(W / 2, H / 2, W, H, 0x05010f, 0.78);

    const head = this.add.text(W / 2, 70, 'LEVEL UP', { fontFamily: FONT, fontSize: '52px', color: '#fff35c' }).setOrigin(0.5);
    head.setShadow(0, 0, '#ff3fa4', 16, true, true);
    this.add.text(W / 2, 112, 'pick one  (tap or press 1-3)', { fontFamily: MONO, fontSize: '14px', color: '#d9b8ff' }).setOrigin(0.5);

    const n = data.choices.length;
    const cw = 250, ch = 230, gap = 24;
    const x0 = W / 2 - ((n * cw + (n - 1) * gap) / 2) + cw / 2;

    data.choices.forEach((up, i) => {
      const x = x0 + i * (cw + gap);
      const y = H / 2 + 40;
      const card = this.add.rectangle(x, y, cw, ch, 0x1a0a3a, 0.95).setStrokeStyle(3, 0xff3fa4).setInteractive({ useHandCursor: true });
      const lv = data.levels[up.id] ?? 0;
      this.add.text(x, y - 80, `[${i + 1}]`, { fontFamily: MONO, fontSize: '16px', color: '#00ffe1' }).setOrigin(0.5);
      this.add.text(x, y - 40, up.name, { fontFamily: FONT, fontSize: '28px', color: '#ff7be0', align: 'center', wordWrap: { width: cw - 20 } }).setOrigin(0.5);
      this.add.text(x, y + 14, up.desc, { fontFamily: MONO, fontSize: '16px', color: '#ffffff', align: 'center', wordWrap: { width: cw - 30 } }).setOrigin(0.5);
      this.add.text(x, y + 84, `LV ${lv} -> ${lv + 1} / ${up.maxLevel}`, { fontFamily: MONO, fontSize: '14px', color: '#fff35c' }).setOrigin(0.5);

      card.on('pointerover', () => card.setStrokeStyle(4, 0x00ffe1));
      card.on('pointerout', () => card.setStrokeStyle(3, 0xff3fa4));
      card.on('pointerdown', () => this.pick(up.id));
      this.input.keyboard?.once(`keydown-${['ONE', 'TWO', 'THREE', 'FOUR'][i]}`, () => this.pick(up.id));
    });
  }

  private pick(id: string) {
    if (this.picked) return;
    this.picked = true;
    this.game.events.emit('upgrade-picked', id);
    this.scene.stop();
  }
}
