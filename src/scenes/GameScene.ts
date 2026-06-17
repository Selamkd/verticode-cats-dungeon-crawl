import Phaser from 'phaser';

import { hexToNum } from '../helpers/color';
import type { CatDirection } from '../helpers/drawCatOnCanvas';
import { CATS } from '../model/cats';
import { sfx } from '../systems/SFX';
import {
  gridToWorld,
  GAME_WIDTH,
  GAME_HEIGHT,
  ROWS,
  COLS,
  TILE_SIZE,
} from '../model/const';
import type { GridPosition } from '../model/const';
import {
  PLAYER_START,
  FUSE_POSITIONS,
  isInsideDungeon,
  isWallAt,
  DUNGEON,
} from '../model/dungeon';
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

  private fuseSequence: number[] = [];
  private nextFuseIdx = 0;
  private litFuses = new Set<number>();

  private gameTime = 120;
  private gameActive = false;
  private gameWon = false;
  private timerEvent?: Phaser.Time.TimerEvent;

  private timerText?: Phaser.GameObjects.Text;
  private fuseCountText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;
  private centerText?: Phaser.GameObjects.Text;

  private darknessTexture?: Phaser.Textures.CanvasTexture;
  private darknessImage?: Phaser.GameObjects.Image;
  private fogWisps: Phaser.GameObjects.Image[] = [];
  private heldTouchDirection?: MoveDirection;
private mobileLayer?: Phaser.GameObjects.Container;


 
  private darkLevel = 0;
  private darkPulse = 0;

  constructor() {
    super('Game');
  }

  init(data: GameSceneData) {
    this.catIndex = data.catIndex ?? 0;

    this.fuseSprites = [];
    this.torches = [];
    this.fogWisps = [];

    this.darknessTexture = undefined;
    this.darknessImage = undefined;
    this.darkLevel = 0;
    this.darkPulse = 0;

    this.playerCol = PLAYER_START.col;
    this.playerRow = PLAYER_START.row;
    this.playerDir = 'down';
    this.walkFrame = 0;
    this.isMoving = false;

    this.fuseSequence = Phaser.Utils.Array.Shuffle(
      [...Array(FUSE_POSITIONS.length).keys()],
    );

    this.nextFuseIdx = 0;
    this.litFuses = new Set<number>();

    this.gameTime = 120;
    this.gameActive = false;
    this.gameWon = false;
    this.timerEvent = undefined;
  }

  create() {
    this.cameras.main.setBackgroundColor(PAL.void);
    this.cameras.main.fadeIn(400, 5, 5, 14);

    this.buildDungeon();
    this.buildFuses();
    this.buildPlayer();
    this.buildDust();
    this.buildDarkness();
    this.buildFogWisps();
    this.buildUI();

    this.cursors = this.input.keyboard?.createCursorKeys();

    this.input.keyboard?.on('keydown-SPACE', () => {
        sfx.resume();
        this.tryActivateFuse();
    });

    this.time.delayedCall(600, () => {
      this.showSequence();
    });
  }

  update(time: number, delta: number) {
    this.handleMovementInput();

    if (this.gameActive) {
      this.darkLevel = Math.min(1, this.darkLevel + delta * 0.00003);
      this.darkPulse = Math.sin(time * 0.002) * 0.03;
    }

    this.renderDarkness(time);
    this.updateLitFuseGlow(time);
  }

  private wasdKeys?: {
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
  E: Phaser.Input.Keyboard.Key;
};

  private handleMovementInput() {
    if (!this.gameActive) return;
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
    sfx.step();
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

  private showSequence() {
    this.statusText?.setText('MEMORISE!');

    let delay = 0;

    this.fuseSequence.forEach((fuseIndex, sequencePosition) => {
      this.time.delayedCall(delay, () => {
        const fuse = this.fuseSprites[fuseIndex];
        if (!fuse) return;
        sfx.seq();
        fuse.numText.setText(String(sequencePosition + 1));

        this.tweens.add({
          targets: fuse.numText,
          alpha: 1,
          scale: 1.3,
          duration: 200,
        });

        this.tweens.add({
          targets: fuse.spr,
          scale: 1.3,
          duration: 200,
          yoyo: true,
        });
      });

      delay += 600;
    });

    this.time.delayedCall(delay + 2000, () => {
      this.fuseSprites.forEach((fuse) => {
        this.tweens.add({
          targets: fuse.numText,
          alpha: 0,
          duration: 500,
        });
      });
    });

    this.time.delayedCall(delay + 3000, () => {
      this.showCenterText('GO!', PAL.gold, 800);
      this.gameActive = true;
      this.statusText?.setText('');
      this.startTimer();
    });
  }

  private tryActivateFuse() {
    if (!this.gameActive) return;

    const targetFuseIndex = this.fuseSequence[this.nextFuseIdx];
    const adjacentFuse = this.findAdjacentUnlitFuse();

    if (!adjacentFuse) return;

    if (adjacentFuse.index === targetFuseIndex) {
      this.handleCorrectFuse(adjacentFuse.fuse, adjacentFuse.index);
    } else {
      this.handleWrongFuse();
    }
  }

  private buildDarkness() {
    const textureKey = 'darknessCanvas';

    if (this.textures.exists(textureKey)) {
      this.textures.remove(textureKey);
    }

    this.darknessTexture = this.textures.createCanvas(
      textureKey,
      GAME_WIDTH,
      GAME_HEIGHT,
    ) as Phaser.Textures.CanvasTexture;

    this.darknessImage = this.add
      .image(0, 0, textureKey)
      .setOrigin(0, 0)
      .setDepth(50);
  }

  private buildFogWisps() {
    for (let i = 0; i < 16; i++) {
      const textureKey = Math.random() > 0.5 ? 'light120' : 'light200';

      const wisp = this.add
        .image(Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT, textureKey)
        .setTint(0x050510)
        .setAlpha(0.04 + Math.random() * 0.07)
        .setScale(1.2 + Math.random() * 2.2, 0.35 + Math.random() * 0.8)
        .setRotation(Math.random() * Math.PI)
        .setDepth(51);

      this.tweens.add({
        targets: wisp,
        x: wisp.x + Phaser.Math.Between(-80, 80),
        y: wisp.y + Phaser.Math.Between(-40, 40),
        rotation: wisp.rotation + Phaser.Math.FloatBetween(-0.4, 0.4),
        alpha: 0.03 + Math.random() * 0.08,
        duration: 5000 + Math.random() * 5000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onRepeat: () => {
          if (Math.random() > 0.65) {
            wisp.x = Math.random() * GAME_WIDTH;
            wisp.y = Math.random() * GAME_HEIGHT;
          }
        },
      });

      this.fogWisps.push(wisp);
    }
  }

  private eraseLightHole(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
  ) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.35, 'rgba(255,255,255,0.9)');
    gradient.addColorStop(0.65, 'rgba(255,255,255,0.35)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderDarkness(time: number) {
    if (!this.darknessTexture || !this.playerSprite) return;

    const ctx = this.darknessTexture.context;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.globalCompositeOperation = 'source-over';

    const baseAlpha = Phaser.Math.Clamp(
      0.62 + this.darkLevel * 0.22 + this.darkPulse,
      0,
      0.88,
    );

    ctx.fillStyle = `rgba(5, 5, 16, ${baseAlpha})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const elapsed = (120 - this.gameTime) / 120;
    const spread = Phaser.Math.Clamp(
      0.14 + elapsed * 0.86 + this.darkLevel * 0.45,
      0,
      1,
    );

    const frontY = GAME_HEIGHT * spread;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';

    for (let col = 0; col < COLS; col++) {
      const x = col * TILE_SIZE;

      const wobble =
        Math.sin(time * 0.0015 + col * 0.9) * 18 +
        Math.sin(time * 0.0025 + col * 1.7) * 10;

      const height = Phaser.Math.Clamp(frontY + wobble, 0, GAME_HEIGHT);

      ctx.fillRect(x, 0, TILE_SIZE + 2, height);
    }

    ctx.globalCompositeOperation = 'destination-out';

    const playerLightRadius = Math.max(45, 100 - this.darkLevel * 45);

    this.eraseLightHole(
      ctx,
      this.playerSprite.x,
      this.playerSprite.y,
      playerLightRadius,
    );

    this.fuseSprites.forEach((fuse) => {
      if (!this.gameActive) {
        this.eraseLightHole(ctx, fuse.spr.x, fuse.spr.y, 42);
        return;
      }

      if (fuse.lit) {
        this.eraseLightHole(ctx, fuse.spr.x, fuse.spr.y, 64);
      }
    });

    this.torches.forEach((torch) => {
      this.eraseLightHole(ctx, torch.x, torch.y, 42);
    });

    ctx.globalCompositeOperation = 'source-over';

    this.darknessTexture.refresh();
  }

  private findAdjacentUnlitFuse():
    | {
        fuse: FuseSprite;
        index: number;
      }
    | undefined {
    for (let index = 0; index < this.fuseSprites.length; index++) {
      const fuse = this.fuseSprites[index];

      if (!fuse || fuse.lit) continue;

      const dx = Math.abs(fuse.pos.col - this.playerCol);
      const dy = Math.abs(fuse.pos.row - this.playerRow);

      if (dx + dy <= 1) {
        return {
          fuse,
          index,
        };
      }
    }

    return undefined;
  }

  private handleCorrectFuse(fuse: FuseSprite, fuseIndex: number) {
    sfx.fuseOk();
    fuse.lit = true;

    this.litFuses.add(fuseIndex);
    this.nextFuseIdx++;

    this.darkLevel = Math.max(0, this.darkLevel - 0.12);

    fuse.spr.setTexture('fuseLit');

    this.tweens.add({
      targets: fuse.glowCircle,
      radius: 60,
      alpha: 0.3,
      duration: 400,
      ease: 'Quad.easeOut',
    });

    this.tweens.add({
      targets: fuse.spr,
      scale: 1.4,
      duration: 150,
      yoyo: true,
    });

    this.spawnFuseParticles(fuse.spr.x, fuse.spr.y);
    this.updateFuseCount();

    this.showCenterText(`${this.nextFuseIdx}/${FUSE_POSITIONS.length}`, PAL.gold, 500);

    if (this.nextFuseIdx >= FUSE_POSITIONS.length) {
      this.time.delayedCall(600, () => {
        this.endGame(true);
      });
    }
  }

  private handleWrongFuse() {
    sfx.fuseFail();
    this.darkLevel = Math.min(1, this.darkLevel + 0.15);

    this.cameras.main.shake(300, 0.015);

    const flash = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xff0000, 0.25)
      .setDepth(55);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        flash.destroy();
      },
    });

    this.showCenterText('WRONG!', PAL.danger, 600);

    this.statusText?.setText('Wrong order!');

    this.time.delayedCall(1500, () => {
      if (this.gameActive) {
        this.statusText?.setText('');
      }
    });
  }

  private spawnFuseParticles(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      const particle = this.add
        .image(x, y, 'particle')
        .setDepth(55)
        .setScale(0.5 + Math.random());

      this.tweens.add({
        targets: particle,
        x: particle.x + Phaser.Math.Between(-50, 50),
        y: particle.y + Phaser.Math.Between(-50, 50),
        alpha: 0,
        scale: 0,
        duration: 600 + Math.random() * 400,
        onComplete: () => {
          particle.destroy();
        },
      });
    }
  }

  private startTimer() {
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      repeat: this.gameTime - 1,
      callback: () => {
        this.gameTime--;

        const minutes = Math.floor(this.gameTime / 60);
        const seconds = this.gameTime % 60;

        this.timerText?.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);

        if (this.gameTime <= 30) {
            sfx.tick();
          this.timerText?.setColor(PAL.danger);

          this.tweens.add({
            targets: this.timerText,
            scale: 1.15,
            duration: 100,
            yoyo: true,
          });
        }

        if (this.gameTime <= 0) {
          this.endGame(false);
        }
      },
    });
  }

  private endGame(won: boolean) {
    if (!this.gameActive && this.gameWon === won) return;

    this.gameActive = false;
    this.gameWon = won;

    this.timerEvent?.remove(false);

    if (won) {
      sfx.win();
      this.showCenterText('DUNGEON CLEARED!', PAL.gold, 1500);
    } else {
      sfx.lose();
      this.showCenterText('DARKNESS WINS', PAL.danger, 1500);
    }

    this.time.delayedCall(2500, () => {
      this.cameras.main.fadeOut(600, 5, 5, 14);

      this.time.delayedCall(600, () => {
        this.scene.start('GameOver', {
          won,
          catIndex: this.catIndex,
          fusesLit: this.nextFuseIdx,
          timeLeft: this.gameTime,
        });
      });
    });
  }

  private showCenterText(text: string, color: string, duration: number) {
    if (!this.centerText) return;

    this.centerText.setText(text).setColor(color).setAlpha(1).setScale(0.5);

    this.tweens.add({
      targets: this.centerText,
      scale: 1.2,
      duration: duration * 0.3,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: this.centerText,
          alpha: 0,
          scale: 1.5,
          duration: duration * 0.7,
        });
      },
    });
  }

  private updateFuseCount() {
    this.fuseCountText?.setText(`Fuses: ${this.nextFuseIdx}/${FUSE_POSITIONS.length}`);
  }

  private updateLitFuseGlow(time: number) {
    this.fuseSprites.forEach((fuse) => {
      if (!fuse.lit) return;

      fuse.glowCircle.setRadius(55 + Math.sin(time * 0.003) * 5);
      fuse.glowCircle.setAlpha(0.15 + Math.sin(time * 0.004) * 0.05);
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

    FUSE_POSITIONS.forEach((position:GridPosition, index) => {
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

    this.timerText = this.add
      .text(GAME_WIDTH / 2, 16, '2:00', {
        fontFamily: 'Courier New, monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        color: PAL.ui,
      })
      .setOrigin(0.5);

    this.fuseCountText = this.add
      .text(20, 16, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: PAL.gold,
      })
      .setOrigin(0, 0.5);

    this.statusText = this.add
      .text(GAME_WIDTH - 20, 16, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: PAL.accent,
      })
      .setOrigin(1, 0.5);

    this.centerText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#fff',
        stroke: '#000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(70)
      .setAlpha(0);

    this.uiContainer.add([
      bar,
      this.timerText,
      this.fuseCountText,
      this.statusText,
    ]);

    this.updateFuseCount();
  }
}