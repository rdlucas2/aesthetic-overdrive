import Phaser from 'phaser';
import { config } from '../config';
import { Backdrop } from '../render/Backdrop';
import { saveManager } from '../save/SaveData';
import { TRACKS, STARTER_TRACK } from '../data/tracks';

export const FONT = 'Impact, "Arial Black", sans-serif';
export const MONO = '"Courier New", monospace';

export class TitleScene extends Phaser.Scene {
  private backdrop!: Backdrop;
  private started = false;

  constructor() { super('Title'); }

  create() {
    this.started = false;
    this.backdrop = new Backdrop(this);
    const cx = config.width / 2;

    const title = this.add.text(cx, 120, 'AESTHETIC\nOVERDRIVE', {
      fontFamily: FONT, fontSize: '78px', color: '#ff7be0', align: 'center',
    }).setOrigin(0.5).setDepth(50).setLineSpacing(-8);
    title.setShadow(0, 0, '#00ffe1', 18, true, true);
    title.setStroke('#3a0c63', 6);

    const prompt = this.add.text(cx, 330, 'TAP OR PRESS SPACE TO START', {
      fontFamily: MONO, fontSize: '22px', color: '#00ffe1',
    }).setOrigin(0.5).setDepth(50);
    prompt.setShadow(0, 0, '#00ffe1', 10, true, true);
    this.tweens.add({ targets: prompt, alpha: 0.25, duration: 600, yoyo: true, repeat: -1 });

    this.add.text(cx, 372, 'drag / WASD / arrows to steer  -  auto-fire rides the beat', {
      fontFamily: MONO, fontSize: '14px', color: '#d9b8ff',
    }).setOrigin(0.5).setDepth(50);

    const best = saveManager.current;
    if (best.bestSurvivalSec > 0) {
      this.add.text(cx, 400, `BEST ${fmtTime(best.bestSurvivalSec)}  -  LV ${best.bestLevel}`, {
        fontFamily: MONO, fontSize: '14px', color: '#fff35c',
      }).setOrigin(0.5).setDepth(50);
    }
    if (config.variantId !== 'a') {
      this.add.text(8, config.height - 20, `variant ${config.variantId}`, { fontFamily: MONO, fontSize: '12px', color: '#888' }).setDepth(50);
    }

    const go = () => {
      if (this.started) return;
      this.started = true;
      this.scene.start('Game');
    };
    this.input.once('pointerdown', go);
    this.input.keyboard?.once('keydown-SPACE', go);
    this.input.keyboard?.once('keydown-ENTER', go);
  }

  update(time: number, delta: number) {
    const bpm = TRACKS[STARTER_TRACK].bpm;
    this.backdrop.update(delta / 1000, (time / 1000) * (bpm / 60), bpm, 0);
  }
}

export function fmtTime(sec: number): string {
  const s = Math.floor(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
