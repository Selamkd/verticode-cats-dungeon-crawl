import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../model/const';
import { PAL } from '../model/palette';
import { FUSE_POSITIONS } from '../model/dungeon';

type GameOverData = {
  won?: boolean;
  catIndex?: number;
  fusesLit?: number;
  timeLeft?: number;
};

export class GameOverScene extends Phaser.Scene {
  private result: Required<GameOverData> = {
    won: false,
    catIndex: 0,
    fusesLit: 0,
    timeLeft: 0,
  };

  constructor() {
    super('GameOver');
  }

  init(data: GameOverData) {
    this.result = {
      won: data.won ?? false,
      catIndex: data.catIndex ?? 0,
      fusesLit: data.fusesLit ?? 0,
      timeLeft: data.timeLeft ?? 0,
    };
  }

  create() {
    this.cameras.main.setBackgroundColor(PAL.void);

    this.add
      .text(GAME_WIDTH / 2, 190, this.result.won ? 'DUNGEON CLEARED!' : 'CONSUMED BY DARKNESS', {
        fontFamily: 'Courier New, monospace',
        fontSize: this.result.won ? '28px' : '22px',
        fontStyle: 'bold',
        color: this.result.won ? PAL.gold : PAL.danger,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 260, `Fuses lit: ${this.result.fusesLit} / ${FUSE_POSITIONS.length}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        color: PAL.ui,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 100, 'Press ENTER to retry', {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        color: PAL.accent,
      })
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-ENTER', () => {
      this.scene.start('Game', {
        catIndex: this.result.catIndex,
      });
    });
  }
}