import Phaser from 'phaser';

import {
  CAT_SPRITE_DISPLAY_SCALE,
  SpriteDirection as CatDirection,
  getCatFrame,
  getCatSpriteKey,
} from '../helpers/catSpriteConfig';
import { hexToNum } from '../helpers/color';
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
  lit: boolean;
  ownerFuse: number;
  flame: Phaser.GameObjects.Arc;
  glow: Phaser.GameObjects.Arc;
};

type MoveDirection = {
  dx: number;
  dy: number;
  direction: CatDirection;
};

export class GameScene extends Phaser.Scene {
  private catIndex = 0;

  private dungeonLayer?: Phaser.GameObjects.Container;
  private uiContainer?: Phaser.GameObjects.Container;
  private mobileLayer?: Phaser.GameObjects.Container;
  private instructionsLayer?: Phaser.GameObjects.Container;

  private fuseSprites: FuseSprite[] = [];
  private torches: Torch[] = [];

  private playerSprite?: Phaser.GameObjects.Sprite;
  private playerGlow?: Phaser.GameObjects.Arc;
  private playerShadow?: Phaser.GameObjects.Ellipse;

  private playerCol = PLAYER_START.col;
  private playerRow = PLAYER_START.row;
  private playerDir: CatDirection = 'down';
  private isMoving = false;

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys?: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
  };

  private heldTouchDirection?: MoveDirection;

  private fuseSequence: number[] = [];
  private nextFuseIdx = 0;
  private litFuses = new Set<number>();

  private gameTime = 120;
  private gameActive = false;
  private gameWon = false;
  private awaitingStart = false;
  private timerEvent?: Phaser.Time.TimerEvent;

  private timerText?: Phaser.GameObjects.Text;
  private fuseCountText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;
  private centerText?: Phaser.GameObjects.Text;

  private darknessTexture?: Phaser.Textures.CanvasTexture;

  private fogWisps: Phaser.GameObjects.Image[] = [];

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

    this.darkLevel = 0;
    this.darkPulse = 0;

    this.playerCol = PLAYER_START.col;
    this.playerRow = PLAYER_START.row;
    this.playerDir = 'down';
    this.isMoving = false;
    this.heldTouchDirection = undefined;

    this.fuseSequence = Phaser.Utils.Array.Shuffle(
      [...Array(FUSE_POSITIONS.length).keys()],
    );

    this.nextFuseIdx = 0;
    this.litFuses = new Set<number>();

    this.gameTime = 120;
    this.gameActive = false;
    this.gameWon = false;
    this.awaitingStart = false;
    this.timerEvent = undefined;
  }

  create() {
    this.cameras.main.setBackgroundColor(PAL.void);
    this.cameras.main.fadeIn(400, 5, 5, 14);
    this.input.addPointer(4);

    this.buildDungeon();
    this.buildFuses();
    this.buildPlayer();
    this.buildDust();
    this.buildDarkness();
    this.buildFogWisps();
    this.buildUI();
    this.buildMobileControls();

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasdKeys = this.input.keyboard?.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      E: Phaser.Input.Keyboard.KeyCodes.E,
    }) as GameScene['wasdKeys'];

    this.input.keyboard?.on('keydown-SPACE', () => {
      sfx.resume();
      if (this.awaitingStart) {
        this.beginGame();
        return;
      }
      this.tryActivateFuse();
    });

    this.input.keyboard?.on('keydown-E', () => {
      sfx.resume();
      this.tryActivateFuse();
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      sfx.resume();
      if (this.awaitingStart) {
        this.beginGame();
      }
    });

    this.showInstructions();
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

  private showInstructions() {
    this.awaitingStart = true;

    const layer = this.add.container(0, 0).setDepth(90);

    const backdrop = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x05050e, 0.82)
      .setInteractive();

    const panel = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 470, 380, 0x0c0c18, 0.97)
      .setStrokeStyle(2, hexToNum(PAL.accent), 0.5);

    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 150, 'THE DARKNESS IS SPREADING', {
        fontFamily: 'Courier New, monospace',
        fontSize: '20px',
        fontStyle: 'bold',
        color: PAL.gold,
        align: 'center',
      })
      .setOrigin(0.5);

    const goal = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 - 96,
        'Smoke is pouring in from every corner of the dungeon.\nMemorise the order the fuses light up, then relight\nthem in that exact order to hold back the dark.',
        {
          fontFamily: 'Georgia, serif',
          fontSize: '13px',
          fontStyle: 'italic',
          color: '#b8b0ca',
          align: 'center',
          lineSpacing: 5,
        },
      )
      .setOrigin(0.5);

    const controls = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 - 6,
        'MOVE   Arrow Keys  /  W A S D\nLIGHT FUSE   Space  /  E   (stand next to it)\nMOBILE   On-screen pad  +  ACT button',
        {
          fontFamily: 'Courier New, monospace',
          fontSize: '13px',
          color: PAL.ui,
          align: 'center',
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5);

    const warn = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 78,
        'Each correct fuse beats the darkness back.\nA wrong fuse feeds it. You have 2 minutes.',
        {
          fontFamily: 'Georgia, serif',
          fontSize: '12px',
          fontStyle: 'italic',
          color: '#7a7290',
          align: 'center',
          lineSpacing: 4,
        },
      )
      .setOrigin(0.5);

    const beginBg = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 142, 200, 46, hexToNum(PAL.accent), 0.92)
      .setStrokeStyle(2, 0xffffff, 0.25)
      .setInteractive({ useHandCursor: true });

    const beginText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 142, 'BEGIN  ▸', {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#fff',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: beginBg,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    layer.add([backdrop, panel, title, goal, controls, warn, beginBg, beginText]);

    backdrop.on('pointerdown', () => this.beginGame());
    beginBg.on('pointerdown', () => this.beginGame());

    this.instructionsLayer = layer;
  }

  private beginGame() {
    if (!this.awaitingStart) return;
    this.awaitingStart = false;
    sfx.resume();

    const layer = this.instructionsLayer;
    if (layer) {
      this.tweens.add({
        targets: layer,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          layer.destroy();
          this.instructionsLayer = undefined;
        },
      });
    }

    this.time.delayedCall(320, () => {
      this.showSequence();
    });
  }

  private handleMovementInput() {
    if (!this.gameActive) return;
    if (this.isMoving) return;

    if (this.cursors?.left.isDown || this.wasdKeys?.A.isDown) {
      this.movePlayer(-1, 0, 'left');
    } else if (this.cursors?.right.isDown || this.wasdKeys?.D.isDown) {
      this.movePlayer(1, 0, 'right');
    } else if (this.cursors?.up.isDown || this.wasdKeys?.W.isDown) {
      this.movePlayer(0, -1, 'up');
    } else if (this.cursors?.down.isDown || this.wasdKeys?.S.isDown) {
      this.movePlayer(0, 1, 'down');
    } else if (this.heldTouchDirection) {
      this.movePlayer(
        this.heldTouchDirection.dx,
        this.heldTouchDirection.dy,
        this.heldTouchDirection.direction,
      );
    }
  }

  private movePlayer(dx: number, dy: number, direction: CatDirection) {
    if (!this.playerSprite || !this.playerGlow || !this.playerShadow) return;

    this.playerDir = direction;
    this.playerSprite.setFrame(getCatFrame(this.playerDir));

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

    const sprite = this.playerSprite;
    const glow = this.playerGlow;
    const shadow = this.playerShadow;
    const fromX = sprite.x;
    const fromY = sprite.y;

    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 150,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        const t = tween.getValue();
        if(!t) return;
        const x = Phaser.Math.Linear(fromX, target.x, t);
        const y = Phaser.Math.Linear(fromY, target.y, t);
        const hop = Math.sin(t * Math.PI);

        sprite.setPosition(x, y - hop * 9);
        sprite.setScale(
          CAT_SPRITE_DISPLAY_SCALE * (1 - hop * 0.05),
          CAT_SPRITE_DISPLAY_SCALE * (1 + hop * 0.08),
        );

        glow.setPosition(x, y);
        shadow.setPosition(x, y + 11);
        shadow.setScale(1 - hop * 0.3);
      },
      onComplete: () => {
        sprite.setPosition(target.x, target.y);
        sprite.setScale(CAT_SPRITE_DISPLAY_SCALE);
        glow.setPosition(target.x, target.y);
        shadow.setPosition(target.x, target.y + 11);
        shadow.setScale(1);
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
    const targetFuse = this.fuseSprites[targetFuseIndex];

    if (targetFuse && !targetFuse.lit && this.isAdjacentToPlayer(targetFuse.pos)) {
      this.handleCorrectFuse(targetFuse, targetFuseIndex);
      return;
    }

    const adjacentFuse = this.findAdjacentUnlitFuse();
    if (!adjacentFuse) return;

    this.handleWrongFuse();
  }

  private isAdjacentToPlayer(pos: GridPosition): boolean {
    const dx = Math.abs(pos.col - this.playerCol);
    const dy = Math.abs(pos.row - this.playerRow);
    return dx + dy <= 1;
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

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, textureKey).setDepth(50);
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
      0.5 + this.darkLevel * 0.22 + this.darkPulse,
      0,
      0.82,
    );

    ctx.fillStyle = `rgba(5, 5, 16, ${baseAlpha})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const elapsed = (120 - this.gameTime) / 120;
    const creep = Phaser.Math.Clamp(
      0.05 + elapsed * 0.92 + this.darkLevel * 0.35,
      0,
      1,
    );

    this.paintEncroachingDark(ctx, time, creep);

    ctx.globalCompositeOperation = 'destination-out';

    const playerLightRadius = Math.max(58, 120 - this.darkLevel * 48);

    this.eraseLightHole(
      ctx,
      this.playerSprite.x,
      this.playerSprite.y,
      playerLightRadius,
    );

    this.fuseSprites.forEach((fuse) => {
      if (!this.gameActive) {
        this.eraseLightHole(ctx, fuse.spr.x, fuse.spr.y, 52);
        return;
      }

      if (fuse.lit) {
        this.eraseLightHole(ctx, fuse.spr.x, fuse.spr.y, 88);
      }
    });

    this.torches.forEach((torch) => {
      if (torch.lit) {
        this.eraseLightHole(ctx, torch.x, torch.y, torch.radius);
      }
    });

    ctx.globalCompositeOperation = 'source-over';
    this.darknessTexture.refresh();
  }

  private paintEncroachingDark(
    ctx: CanvasRenderingContext2D,
    time: number,
    creep: number,
  ) {
    const depthV = GAME_HEIGHT * 0.55 * creep;
    const depthH = GAME_WIDTH * 0.55 * creep;

    const hazeV = Math.min(GAME_HEIGHT, depthV * 1.6);
    const hazeH = Math.min(GAME_WIDTH, depthH * 1.6);

    const haze = (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      rx: number,
      ry: number,
      rw: number,
      rh: number,
    ) => {
      const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
      gradient.addColorStop(0, 'rgba(3, 3, 10, 0.92)');
      gradient.addColorStop(1, 'rgba(3, 3, 10, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(rx, ry, rw, rh);
    };

    haze(0, 0, 0, hazeV, 0, 0, GAME_WIDTH, hazeV);
    haze(0, GAME_HEIGHT, 0, GAME_HEIGHT - hazeV, 0, GAME_HEIGHT - hazeV, GAME_WIDTH, hazeV);
    haze(0, 0, hazeH, 0, 0, 0, hazeH, GAME_HEIGHT);
    haze(GAME_WIDTH, 0, GAME_WIDTH - hazeH, 0, GAME_WIDTH - hazeH, 0, hazeH, GAME_HEIGHT);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';

    for (let col = 0; col < COLS; col++) {
      const x = col * TILE_SIZE;
      const wobble =
        Math.sin(time * 0.0015 + col * 0.9) * 16 +
        Math.sin(time * 0.0027 + col * 1.7) * 9;

      const topHeight = Phaser.Math.Clamp(depthV + wobble, 0, GAME_HEIGHT);
      ctx.fillRect(x, 0, TILE_SIZE + 2, topHeight);

      const bottomHeight = Phaser.Math.Clamp(depthV - wobble, 0, GAME_HEIGHT);
      ctx.fillRect(x, GAME_HEIGHT - bottomHeight, TILE_SIZE + 2, bottomHeight);
    }

    for (let row = 0; row < ROWS; row++) {
      const y = row * TILE_SIZE;
      const wobble =
        Math.sin(time * 0.0016 + row * 1.1) * 16 +
        Math.sin(time * 0.0031 + row * 1.9) * 9;

      const leftWidth = Phaser.Math.Clamp(depthH + wobble, 0, GAME_WIDTH);
      ctx.fillRect(0, y, leftWidth, TILE_SIZE + 2);

      const rightWidth = Phaser.Math.Clamp(depthH - wobble, 0, GAME_WIDTH);
      ctx.fillRect(GAME_WIDTH - rightWidth, y, rightWidth, TILE_SIZE + 2);
    }
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

      if (this.isAdjacentToPlayer(fuse.pos)) {
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
    this.darkLevel = Math.max(0, this.darkLevel - 0.16);

    fuse.spr.setTexture('fuseLit');

    this.tweens.add({
      targets: fuse.glowCircle,
      radius: 80,
      alpha: 0.4,
      duration: 400,
      ease: 'Quad.easeOut',
    });

    this.tweens.add({
      targets: fuse.spr,
      scale: 1.5,
      duration: 150,
      yoyo: true,
    });

    this.spawnFuseParticles(fuse.spr.x, fuse.spr.y);
    this.igniteSection(fuseIndex);
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
    this.heldTouchDirection = undefined;

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

      fuse.glowCircle.setRadius(70 + Math.sin(time * 0.003) * 6);
      fuse.glowCircle.setAlpha(0.2 + Math.sin(time * 0.004) * 0.06);
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
    const torchSections = [
      { col: 2, row: 0, owner: 0 },
      { col: 2, row: 2, owner: 0 },
      { col: 17, row: 0, owner: 1 },
      { col: 17, row: 2, owner: 1 },
      { col: 1, row: 6, owner: 2 },
      { col: 0, row: 7, owner: 2 },
      { col: 18, row: 6, owner: 3 },
      { col: 19, row: 7, owner: 3 },
      { col: 2, row: 12, owner: 4 },
      { col: 2, row: 14, owner: 4 },
      { col: 17, row: 12, owner: 5 },
      { col: 17, row: 14, owner: 5 },
    ];

    torchSections.forEach((pos) => {
      if (DUNGEON[pos.row]?.[pos.col] !== 1) return;

      const x = pos.col * TILE_SIZE + TILE_SIZE / 2;
      const y = pos.row * TILE_SIZE + TILE_SIZE / 2;

      const glow = this.add.circle(x, y, 44, 0xff8a2a, 0).setDepth(3);
      const flame = this.add.circle(x, y - 4, 3, 0x4a2f16, 0.5).setDepth(4);

      this.dungeonLayer?.add([glow, flame]);

      this.tweens.add({
        targets: flame,
        alpha: 0.28,
        duration: 1200 + Math.random() * 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.torches.push({
        x,
        y,
        radius: 72,
        lit: false,
        ownerFuse: pos.owner,
        flame,
        glow,
      });
    });
  }

  private igniteSection(fuseIndex: number) {
    const sectionTorches = this.torches.filter(
      (torch) => torch.ownerFuse === fuseIndex && !torch.lit,
    );

    sectionTorches.forEach((torch, i) => {
      this.time.delayedCall(130 * i, () => {
        this.igniteTorch(torch);
      });
    });
  }

  private igniteTorch(torch: Torch) {
    if (torch.lit) return;
    torch.lit = true;

    this.tweens.killTweensOf(torch.flame);
    torch.flame.setFillStyle(0xff9a33).setAlpha(0.9);

    this.tweens.add({
      targets: torch.flame,
      radius: 6,
      duration: 220,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: torch.flame,
          alpha: 0.55,
          scaleX: 0.75,
          scaleY: 1.35,
          duration: 260 + Math.random() * 160,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      },
    });

    this.tweens.add({
      targets: torch.glow,
      alpha: 0.28,
      duration: 450,
      ease: 'Quad.easeOut',
    });

    this.spawnFuseParticles(torch.x, torch.y - 4);
  }

  private buildFuses() {
    this.fuseSprites = [];

    FUSE_POSITIONS.forEach((position: GridPosition, index) => {
      const { x, y } = gridToWorld(position);

      const glowCircle = this.add
        .circle(x, y, 0, hexToNum(PAL.fuseGlow), 0)
        .setDepth(4);

      const spr = this.add.image(x, y, 'fuseOff').setDepth(5);

      const numText = this.add
        .text(x, y - 24, '', {
          fontFamily: 'Courier New, monospace',
          fontSize: '18px',
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
    const spriteKey = getCatSpriteKey(this.catIndex);

    this.playerShadow = this.add
      .ellipse(x, y + 11, 26, 9, 0x000000, 0.35)
      .setDepth(8);

    this.playerGlow = this.add
      .circle(x, y, 6, hexToNum(cat.eye), 0.15)
      .setDepth(9);

    this.playerSprite = this.add
      .sprite(x, y, spriteKey, getCatFrame('down'))
      .setDepth(10)
      .setScale(CAT_SPRITE_DISPLAY_SCALE)
      .setOrigin(0.5, 0.58);
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

  private buildMobileControls() {
    const shouldShow = this.sys.game.device.input.touch;
    this.mobileLayer = this.add.container(0, 0).setDepth(80).setVisible(shouldShow);

    const left = this.createTouchButton(62, GAME_HEIGHT - 82, '◀');
    const right = this.createTouchButton(154, GAME_HEIGHT - 82, '▶');
    const up = this.createTouchButton(108, GAME_HEIGHT - 128, '▲');
    const down = this.createTouchButton(108, GAME_HEIGHT - 36, '▼');
    const act = this.createTouchButton(GAME_WIDTH - 70, GAME_HEIGHT - 70, 'ACT', 74, 56);

    this.bindMoveButton(left, { dx: -1, dy: 0, direction: 'left' });
    this.bindMoveButton(right, { dx: 1, dy: 0, direction: 'right' });
    this.bindMoveButton(up, { dx: 0, dy: -1, direction: 'up' });
    this.bindMoveButton(down, { dx: 0, dy: 1, direction: 'down' });

    act.zone.on('pointerdown', () => {
      sfx.resume();
      this.tryActivateFuse();
    });

    this.input.on('pointerup', () => {
      this.heldTouchDirection = undefined;
    });

    this.input.on('pointerupoutside', () => {
      this.heldTouchDirection = undefined;
    });
  }

  private createTouchButton(x: number, y: number, label: string, width = 58, height = 46) {
    const bg = this.add
      .rectangle(x, y, width, height, 0x2f294d, 0.62)
      .setStrokeStyle(2, hexToNum(PAL.accent), 0.45);

    const text = this.add
      .text(x, y, label, {
        fontFamily: 'Courier New, monospace',
        fontSize: label === 'ACT' ? '13px' : '18px',
        fontStyle: 'bold',
        color: '#cfc8ff',
      })
      .setOrigin(0.5);

    const zone = this.add
      .zone(x, y, width, height)
      .setInteractive({ useHandCursor: true });

    this.mobileLayer?.add([bg, text, zone]);

    zone.on('pointerover', () => {
      bg.setFillStyle(0x4a3f73, 0.82);
    });

    zone.on('pointerout', () => {
      bg.setFillStyle(0x2f294d, 0.62);
      this.heldTouchDirection = undefined;
    });

    zone.on('pointerup', () => {
      bg.setFillStyle(0x2f294d, 0.62);
      this.heldTouchDirection = undefined;
    });

    zone.on('pointerdown', () => {
      bg.setFillStyle(0x6b5ca0, 0.9);
    });

    return { bg, text, zone };
  }

  private bindMoveButton(
    button: {
      bg: Phaser.GameObjects.Rectangle;
      text: Phaser.GameObjects.Text;
      zone: Phaser.GameObjects.Zone;
    },
    move: MoveDirection,
  ) {
    button.zone.on('pointerdown', () => {
      sfx.resume();
      this.heldTouchDirection = move;
      if (!this.isMoving) {
        this.movePlayer(move.dx, move.dy, move.direction);
      }
    });
  }
}