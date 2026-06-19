import Phaser from 'phaser';
import {
  CAT_OVER_DISPLAY_SCALE,
  getCatFrame,
} from '../helpers/catSpriteConfig';
import { hexToNum } from '../helpers/color';
import { CATS } from '../model/cats';
import { GAME_WIDTH, GAME_HEIGHT } from '../model/const';
import { PAL } from '../model/palette';
import { FUSE_POSITIONS } from '../model/dungeon';
import { sfx } from '../systems/SFX';

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

    this.buildDust();

    const panelW = 420;
    const panelH = 340;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const accentColor = this.result.won ? PAL.gold : PAL.danger;

    this.add
      .rectangle(cx, cy, panelW + 4, panelH + 4, hexToNum(accentColor), 0.1);

    this.add
      .rectangle(cx, cy, panelW, panelH, hexToNum(PAL.floorA), 0.96)
      .setStrokeStyle(1, hexToNum(PAL.wallMid), 0.5);

    const cat = CATS[this.result.catIndex] ?? CATS[0];
    const frame = this.result.won ? getCatFrame('down') : getCatFrame('up');

    const catY = cy - panelH / 2 + 62;

    const catSprite = this.add
      .sprite(cx, catY, cat.spriteKey, frame)
      .setScale(CAT_OVER_DISPLAY_SCALE)
      .setOrigin(0.5, 0.58);

    if (this.result.won) {
      this.tweens.add({
        targets: catSprite,
        y: catY - 8,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      catSprite.setAlpha(0.8);
      this.tweens.add({
        targets: catSprite,
        angle: { from: -4, to: 4 },
        duration: 2200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    const titleY = catY + 56;

    this.add
      .text(cx, titleY, this.result.won ? 'DUNGEON CLEARED' : 'CONSUMED BY DARKNESS', {
        fontFamily: 'Courier New, monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        color: accentColor,
      })
      .setOrigin(0.5);

    const flavorText = this.result.won
      ? `${cat.name} held the light. The dungeon remembers.`
      : `${cat.name} couldn't outrun the smoke. Not this time. They will trying again and again...`;

    this.add
      .text(cx, titleY + 22, flavorText, {
        fontFamily: 'Georgia, serif',
        fontSize: '10px',
        fontStyle: 'italic',
        color: '#8a7e8a',
      })
      .setOrigin(0.5);

    const dividerY = titleY + 44;
    this.add
      .rectangle(cx, dividerY, panelW - 80, 1, hexToNum(PAL.wallMid), 0.3);

    const statsY = dividerY + 20;

    const minutes = Math.floor(this.result.timeLeft / 60);
    const seconds = this.result.timeLeft % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    this.add
      .text(cx - 80, statsY + 6, 'FUSES LIT', {
        fontFamily: 'Courier New, monospace',
        fontSize: '8px',
        fontStyle: 'bold',
        color: PAL.fuseGlow,
      })
      .setOrigin(0.5, 0);

    this.add
      .text(cx - 80, statsY + 20, `${this.result.fusesLit} / ${FUSE_POSITIONS.length}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: PAL.ui,
      })
      .setOrigin(0.5, 0);

    this.add
      .rectangle(cx, statsY + 14, 1, 30, hexToNum(PAL.wallMid), 0.25);

    this.add
      .text(cx + 80, statsY + 6, 'TIME LEFT', {
        fontFamily: 'Courier New, monospace',
        fontSize: '8px',
        fontStyle: 'bold',
        color: PAL.fuseGlow,
      })
      .setOrigin(0.5, 0);

    this.add
      .text(cx + 80, statsY + 20, timeStr, {
        fontFamily: 'Courier New, monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: PAL.ui,
      })
      .setOrigin(0.5, 0);

    const retryY = cy + panelH / 2 - 62;
    const retryBtn = this.add
      .rectangle(cx, retryY, 180, 36, hexToNum(PAL.accent), 0.9)
      .setStrokeStyle(1, 0xffffff, 0.1)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(cx, retryY, 'TRY AGAIN', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color: PAL.title,
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: retryBtn,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });


  

    retryBtn.on('pointerdown', () => {
      sfx.resume();
      sfx.select();
      this.retry();
    });


    this.input.keyboard?.once('keydown-ENTER', () => {
      sfx.resume();
      this.retry();
    });

    this.input.keyboard?.once('keydown-SPACE', () => {
      sfx.resume();
      this.retry();
    });

    this.input.keyboard?.once('keydown-ESC', () => {
      sfx.resume();
      this.backToMenu();
    });
  }

  private buildDust() {
    for (let i = 0; i < 24; i++) {
      const dust = this.add
        .image(Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT, 'dust')
        .setAlpha(0.08 + Math.random() * 0.1);

      this.tweens.add({
        targets: dust,
        y: dust.y + 40 + Math.random() * 60,
        x: dust.x + Phaser.Math.Between(-20, 20),
        alpha: 0,
        duration: 5000 + Math.random() * 4000,
        repeat: -1,
        onRepeat: () => {
          dust.x = Math.random() * GAME_WIDTH;
          dust.y = Math.random() * GAME_HEIGHT;
          dust.alpha = 0.08 + Math.random() * 0.1;
        },
      });
    }
  }

  private retry() {
    this.cameras.main.fadeOut(300, 5, 5, 14);
    this.time.delayedCall(300, () => {
      this.scene.start('Game', {
        catIndex: this.result.catIndex,
      });
    });
  }

  private backToMenu() {
    this.cameras.main.fadeOut(300, 5, 5, 14);
    this.time.delayedCall(300, () => {
      this.scene.start('Menu');
    });
  }
}