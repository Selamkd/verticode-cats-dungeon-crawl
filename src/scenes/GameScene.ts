import Phaser from 'phaser';

import { hexToNum } from '../helpers/color';
import { GAME_WIDTH, GAME_HEIGHT, ROWS, COLS, TILE_SIZE } from '../model/const';
import { FUSE_POSITIONS, isWallAt, PLAYER_START } from '../model/dungeon';
import { PAL } from '../model/palette';

type GameSceneData = {
  catIndex?: number;
};

export class GameScene extends Phaser.Scene {
  private catIndex = 0;

  constructor() {
    super('Game');
  }

  init(data: GameSceneData) {
    this.catIndex = data.catIndex ?? 0;
  }

  create() {
    this.cameras.main.setBackgroundColor(PAL.void);

    this.drawDebugDungeon();
    this.drawDebugFuses();
    this.drawDebugPlayer();

    this.add
      .text(GAME_WIDTH / 2, 16, `Selected cat index: ${this.catIndex}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        color: PAL.ui,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 24, 'SPACE: Game Over test', {
        fontFamily: 'Courier New, monospace',
        fontSize: '13px',
        color: PAL.accent,
      })
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-SPACE', () => {
      this.scene.start('GameOver', {
        won: true,
        catIndex: this.catIndex,
        fusesLit: FUSE_POSITIONS.length,
        timeLeft: 54,
      });
    });
  }

  private drawDebugDungeon() {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;

        const isWall = isWallAt(col, row);

        this.add
          .rectangle(
            x,
            y,
            TILE_SIZE,
            TILE_SIZE,
            hexToNum(isWall ? PAL.wallMid : PAL.floorA),
          )
          .setStrokeStyle(1, hexToNum('#0e0e18'), 0.7);
      }
    }
  }

  private drawDebugFuses() {
    FUSE_POSITIONS.forEach((pos, index) => {
      const x = pos.col * TILE_SIZE + TILE_SIZE / 2;
      const y = pos.row * TILE_SIZE + TILE_SIZE / 2;

      this.add.circle(x, y, 10, hexToNum(PAL.fuseOff));

      this.add
        .text(x, y - 22, String(index + 1), {
          fontFamily: 'Courier New, monospace',
          fontSize: '12px',
          color: PAL.gold,
        })
        .setOrigin(0.5);
    });
  }

  private drawDebugPlayer() {
    const x = PLAYER_START.col * TILE_SIZE + TILE_SIZE / 2;
    const y = PLAYER_START.row * TILE_SIZE + TILE_SIZE / 2;

    this.add.circle(x, y, 14, hexToNum(PAL.accent));

    this.add
      .text(x, y, 'C', {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);
  }
}