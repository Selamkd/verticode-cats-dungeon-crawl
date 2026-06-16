import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../model/const';
import { PAL } from '../model/palette';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.cameras.main.setBackgroundColor(PAL.void);

    this.add
      .text(GAME_WIDTH / 2, 100, 'VERTICODE CATS', {
        fontFamily: 'Courier New, monospace',
        fontSize: '36px',
        fontStyle: 'bold',
        color: PAL.title,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 142, 'D U N G E O N   C R A W L', {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        color: PAL.accent,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Press ENTER to start', {
        fontFamily: 'Courier New, monospace',
        fontSize: '16px',
        color: PAL.ui,
      })
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-ENTER', () => {
      this.scene.start('Game', {
        catIndex: 0,
      });
    });
  }
}