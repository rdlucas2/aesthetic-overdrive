import Phaser from 'phaser';
import { config } from './config';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { GameScene } from './scenes/GameScene';
import { LevelUpScene } from './scenes/LevelUpScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: config.width,
  height: config.height,
  backgroundColor: '#05010f',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 2 },
  render: { antialias: true, powerPreference: 'high-performance' },
  scene: [BootScene, TitleScene, GameScene, LevelUpScene],
});
