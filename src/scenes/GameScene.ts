import Phaser from 'phaser';


import { hexToNum } from '../helpers/color';
import type { CatDirection } from '../helpers/drawCatOnCanvas';
import { CATS } from '../model/cats';
import { GridPosition, gridToWorld, ROWS, COLS, TILE_SIZE, GAME_WIDTH, GAME_HEIGHT } from '../model/const';
import { PLAYER_START, FUSE_POSITIONS, isInsideDungeon, isWallAt, DUNGEON } from '../model/dungeon';
import { PAL } from '../model/palette';

type GameSceneData = {
  catIndex?: number;
};

type FuseSprite = {
  spr: Phaser.GameObjects.Image;
  numText: Phaser.GameObjects.Text;
  glowCircle: Phaser.GameObjects.Arc;
  pos: GridPosition;
  seqIndex: number;
  lit: boolean;
};

type Torch = {
  x: number;
  y: number;
  radius: number;
};

export class GameScene extends Phaser.Scene {
  private catIndex = 0;

  private dungeonLayer?: Phaser.GameObjects.Container;
  private uiContainer?: Phaser.GameObjects.Container;

  private fuseSprites: FuseSprite[] = [];
  private torches: Torch[] = [];

  private playerSprite?: Phaser.GameObjects.Image;
  private playerGlow?: Phaser.GameObjects.Arc;

  private playerCol = PLAYER_START.col;
  private playerRow = PLAYER_START.row;
  private playerDir: CatDirection = 'down';
  private walkFrame = 0;
  private isMoving = false;

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('Game');
  }

  init(data: GameSceneData) {
    this.catIndex = data.catIndex ?? 0;

    this.fuseSprites = [];
    this.torches = [];

    this.playerCol = PLAYER_START.col;
    this.playerRow = PLAYER_START.row;
    this.playerDir = 'down';
    this.walkFrame = 0;
    this.isMoving = false;
  }

  create() {
    this.cameras.main.setBackgroundColor(PAL.void);
    this.cameras.main.fadeIn(400, 5, 5, 14);

    this.buildDungeon();
    this.buildFuses();
    this.buildPlayer();
    this.buildDust();
    this.buildUI();

    this.cursors = this.input.keyboard?.createCursorKeys();

    this.input.keyboard?.once('keydown-G', () => {
      this.scene.start('GameOver', {
        won: true,
        catIndex: this.catIndex,
        fusesLit: FUSE_POSITIONS.length,
        timeLeft: 54,
      });
    });
  }

  update() {
    this.handleMovementInput();
  }

  private handleMovementInput() {
    if (!this.cursors) return;
    if (this.isMoving) return;

    if (this.cursors.left.isDown) {
      this.movePlayer(-1, 0, 'left');
    } else if (this.cursors.right.isDown) {
      this.movePlayer(1, 0, 'right');
    } else if (this.cursors.up.isDown) {
      this.movePlayer(0, -1, 'up');
    } else if (this.cursors.down.isDown) {
      this.movePlayer(0, 1, 'down');
    }
  }

  private movePlayer(dx: number, dy: number, direction: CatDirection) {
    if (!this.playerSprite || !this.playerGlow) return;

    this.playerDir = direction;

    const nextCol = this.playerCol + dx;
    const nextRow = this.playerRow + dy;

    if (!isInsideDungeon(nextCol, nextRow)) return;
    if (isWallAt(nextCol, nextRow)) return;

    this.isMoving = true;

    this.playerCol = nextCol;
    this.playerRow = nextRow;

    const target = gridToWorld({
      col: nextCol,
      row: nextRow,
    });

    this.walkFrame = (this.walkFrame + 1) % 3;

    this.playerSprite.setTexture(
      `cat_${this.catIndex}_${this.playerDir}_${this.walkFrame}`,
    );

    this.tweens.add({
      targets: [this.playerSprite, this.playerGlow],
      x: target.x,
      y: target.y,
      duration: 140,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.isMoving = false;
      },
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

    this.buildTorches();
  }

  private buildTorches() {
    const torchPositions = [
      { col: 5, row: 1 },
      { col: 14, row: 1 },
      { col: 0, row: 5 },
      { col: 19, row: 5 },
      { col: 0, row: 10 },
      { col: 19, row: 10 },
      { col: 5, row: 13 },
      { col: 14, row: 13 },
      { col: 9, row: 7 },
      { col: 10, row: 7 },
    ];

    torchPositions.forEach((pos) => {
      if (DUNGEON[pos.row]?.[pos.col] !== 1) return;

      const x = pos.col * TILE_SIZE + TILE_SIZE / 2;
      const y = pos.row * TILE_SIZE + TILE_SIZE / 2;

      const flame = this.add.circle(x, y - 4, 4, 0xff8822, 0.7);

      this.dungeonLayer?.add(flame);

      this.tweens.add({
        targets: flame,
        alpha: 0.3,
        scaleX: 0.7,
        scaleY: 1.3,
        duration: 300 + Math.random() * 200,
        yoyo: true,
        repeat: -1,
      });

      this.torches.push({
        x,
        y,
        radius: 50,
      });
    });
  }

  private buildFuses() {
    this.fuseSprites = [];

    FUSE_POSITIONS.forEach((position:GridPosition, index:number) => {
      const { x, y } = gridToWorld(position);

      const glowCircle = this.add
        .circle(x, y, 0, hexToNum(PAL.fuseGlow), 0)
        .setDepth(4);

      const spr = this.add.image(x, y, 'fuseOff').setDepth(5);

      const numText = this.add
        .text(x, y - 22, '', {
          fontFamily: 'Courier New, monospace',
          fontSize: '16px',
          fontStyle: 'bold',
          color: PAL.gold,
          stroke: '#000',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(6)
        .setAlpha(0);

      this.fuseSprites.push({
        spr,
        numText,
        glowCircle,
        pos: position,
        seqIndex: index,
        lit: false,
      });
    });
  }

  private buildPlayer() {
    const { x, y } = gridToWorld({
      col: this.playerCol,
      row: this.playerRow,
    });

    const cat = CATS[this.catIndex] ?? CATS[0];

    this.playerGlow = this.add
      .circle(x, y, 6, hexToNum(cat.eye), 0.15)
      .setDepth(9);

    this.playerSprite = this.add
      .image(x, y, `cat_${this.catIndex}_down_0`)
      .setDepth(10);
  }

  private buildDust() {
    for (let i = 0; i < 20; i++) {
      const dust = this.add
        .image(Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT, 'dust')
        .setAlpha(0)
        .setDepth(45);

      this.tweens.add({
        targets: dust,
        alpha: {
          from: 0,
          to: 0.2,
        },
        y: dust.y - 30 - Math.random() * 40,
        duration: 3000 + Math.random() * 3000,
        repeat: -1,
        yoyo: true,
        onRepeat: () => {
          dust.x = Math.random() * GAME_WIDTH;
          dust.y = Math.random() * GAME_HEIGHT;
        },
      });
    }
  }

  private buildUI() {
    this.uiContainer = this.add.container(0, 0).setDepth(60);

    const bar = this.add
      .rectangle(GAME_WIDTH / 2, 16, GAME_WIDTH - 20, 28, 0x0a0a14, 0.85)
      .setStrokeStyle(1, hexToNum(PAL.accent), 0.3);

    const timerText = this.add
      .text(GAME_WIDTH / 2, 16, '2:00', {
        fontFamily: 'Courier New, monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        color: PAL.ui,
      })
      .setOrigin(0.5);

    const fuseCountText = this.add
      .text(20, 16, `Fuses: 0/${FUSE_POSITIONS.length}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: PAL.gold,
      })
      .setOrigin(0, 0.5);

    const statusText = this.add
      .text(GAME_WIDTH - 20, 16, 'Arrow keys to move  ·  G: Game Over test', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: PAL.accent,
      })
      .setOrigin(1, 0.5);

    this.uiContainer.add([bar, timerText, fuseCountText, statusText]);
  }
}