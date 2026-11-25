import Phaser from 'phaser';
import { generateTextures } from '../render/textures';
import { markBootOk } from '../platform/diagnostics';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    generateTextures(this);
    markBootOk();
    this.scene.start('Title');
  }
}
