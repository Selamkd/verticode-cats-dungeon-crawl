import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../model/const';
import { PAL } from '../model/palette';


type GameSceneData = {
  catIndex?: number;
};

export class GameScene extends Phaser.Scene {
  private catIndex = 0;
  private elapsedText?: Phaser.GameObjects.Text;

  constructor() {
    super('Game');
  }

  init(data: GameSceneData) {
    this.catIndex = data.catIndex ?? 0;
  }

  create() {
    this.cameras.main.setBackgroundColor(PAL.void);

    this.add
      .text(GAME_WIDTH / 2, 80, 'Game Scene', {
        fontFamily: 'Courier New, monospace',
        fontSize: '28px',
        fontStyle: 'bold',
        color: PAL.gold,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 130, `Selected cat index: ${this.catIndex}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        color: PAL.ui,
      })
      .setOrigin(0.5);

    this.elapsedText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Elapsed: 0.00', {
        fontFamily: 'Courier New, monospace',
        fontSize: '16px',
        color: PAL.ui,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 80, 'Press SPACE to end game', {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        color: PAL.accent,
      })
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-SPACE', () => {
      this.scene.start('GameOver', {
        won: true,
        catIndex: this.catIndex,
        fusesLit: 6,
        timeLeft: 54,
      });
    });
  }

update(time: number) {
  const pulse = 1 + Math.sin(time * 0.006) * 0.1;
  this.elapsedText?.setScale(pulse);
}
}