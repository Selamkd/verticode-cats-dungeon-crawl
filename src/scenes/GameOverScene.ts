import Phaser from 'phaser';
import {
  CAT_OVER_DISPLAY_SCALE,
  getCatFrame,
  getCatSpriteKey,
} from '../helpers/catSpriteConfig';
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
    this.cameras.main.fadeIn(350, 5, 5, 14);

    const spriteKey = getCatSpriteKey(this.result.catIndex);
    const frame = this.result.won ? getCatFrame('down') : getCatFrame('up');

    this.add
      .sprite(GAME_WIDTH / 2, 130, spriteKey, frame)
      .setScale(CAT_OVER_DISPLAY_SCALE)
      .setOrigin(0.5, 0.58);

    this.add
      .text(GAME_WIDTH / 2, 230, this.result.won ? 'DUNGEON CLEARED!' : 'CONSUMED BY DARKNESS', {
        fontFamily: 'Courier New, monospace',
        fontSize: this.result.won ? '28px' : '22px',
        fontStyle: 'bold',
        color: this.result.won ? PAL.gold : PAL.danger,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 292, `Fuses lit: ${this.result.fusesLit} / ${FUSE_POSITIONS.length}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        color: PAL.ui,
      })
      .setOrigin(0.5);

    const minutes = Math.floor(this.result.timeLeft / 60);
    const seconds = this.result.timeLeft % 60;

    this.add
      .text(GAME_WIDTH / 2, 322, `Time left: ${minutes}:${seconds.toString().padStart(2, '0')}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: '#8c859f',
      })
      .setOrigin(0.5);

    const retryButton = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 112, 184, 46, 0x2f294d, 0.9)
      .setStrokeStyle(2, 0xffffff, 0.16)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 112, 'TRY AGAIN', {
        fontFamily: 'Courier New, monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: PAL.accent,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 58, 'Press ENTER or tap to retry', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: '#555266',
      })
      .setOrigin(0.5);

    retryButton.on('pointerdown', () => {
      this.retry();
    });

    this.input.keyboard?.once('keydown-ENTER', () => {
      this.retry();
    });

    this.input.keyboard?.once('keydown-SPACE', () => {
      this.retry();
    });
  }

  private retry() {
    this.cameras.main.fadeOut(300, 5, 5, 14);

    this.time.delayedCall(300, () => {
      this.scene.start('Game', {
        catIndex: this.result.catIndex,
      });
    });
  }
}
