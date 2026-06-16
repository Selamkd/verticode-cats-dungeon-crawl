import Phaser from 'phaser';
import { PAL } from '../model/palette';
import { GAME_HEIGHT, GAME_WIDTH } from '../model/const';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.cameras.main.setBackgroundColor(PAL.void);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Booting dungeon...', {
        fontFamily: 'Courier New, monospace',
        fontSize: '18px',
        color: PAL.ui,
      })
      .setOrigin(0.5);

    this.time.delayedCall(600, () => {
      this.scene.start('Menu');
    });
  }
}