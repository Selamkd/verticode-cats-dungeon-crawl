import Phaser from 'phaser';

import { hexToNum } from '../helpers/color';
import { CATS } from '../model/cats';
import { ROWS, COLS, TILE_SIZE, gridToWorld, GAME_WIDTH, GAME_HEIGHT } from '../model/const';
import { FUSE_POSITIONS, DUNGEON, PLAYER_START } from '../model/dungeon';
import { PAL } from '../model/palette';

type GameSceneData = {
  catIndex?: number;
};

export class GameScene extends Phaser.Scene {
  private catIndex = 0;
  private dungeonLayer?: Phaser.GameObjects.Container;

  constructor() {
    super('Game');
  }

  init(data: GameSceneData) {
    this.catIndex = data.catIndex ?? 0;
  }

  create() {
    this.cameras.main.setBackgroundColor(PAL.void);

    this.buildDungeon();
    this.buildFuses();
    this.buildPlayer();
    this.buildDebugUI();

    this.input.keyboard?.once('keydown-SPACE', () => {
      this.scene.start('GameOver', {
        won: true,
        catIndex: this.catIndex,
        fusesLit: FUSE_POSITIONS.length,
        timeLeft: 54,
      });
    });
  }

  private buildDungeon() {
    this.dungeonLayer = this.add.container(0, 0);

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const isWall = DUNGEON[row][col] === 1;

        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;

        const tile = this.add.image(x, y, isWall ? 'wall' : 'floor');

        this.dungeonLayer.add(tile);
      }
    }
  }

  private buildFuses() {
    FUSE_POSITIONS.forEach((position: any, index: number) => {
      const { x, y } = gridToWorld(position);

      this.add.image(x, y, 'fuseOff').setDepth(5);

      this.add
        .text(x, y - 22, String(index + 1), {
          fontFamily: 'Courier New, monospace',
          fontSize: '14px',
          fontStyle: 'bold',
          color: PAL.gold,
          stroke: '#000',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(6);
    });
  }

  private buildPlayer() {
    const { x, y } = gridToWorld(PLAYER_START);
    const cat = CATS[this.catIndex] ?? CATS[0];

    this.add.circle(x, y, 6, hexToNum(cat.eye), 0.15).setDepth(9);

    this.add.image(x, y, `cat_${this.catIndex}_down_0`).setDepth(10);
  }

  private buildDebugUI() {
    this.add
      .rectangle(GAME_WIDTH / 2, 16, GAME_WIDTH - 20, 28, 0x0a0a14, 0.85)
      .setStrokeStyle(1, hexToNum(PAL.accent), 0.3)
      .setDepth(20);

    this.add
      .text(GAME_WIDTH / 2, 16, 'Texture pass complete  ·  SPACE: Game Over test', {
        fontFamily: 'Courier New, monospace',
        fontSize: '13px',
        color: PAL.ui,
      })
      .setOrigin(0.5)
      .setDepth(21);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 16, 'Next: real menu cat selection', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: '#555266',
      })
      .setOrigin(0.5)
      .setDepth(21);
  }
}