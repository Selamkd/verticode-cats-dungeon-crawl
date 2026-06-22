import Phaser from 'phaser';
import { sfx } from '../systems/SFX';

import {
  CAT_MENU_DISPLAY_SCALE,
  CAT_SPRITES,
} from '../helpers/catSpriteConfig';
import { hexToNum } from '../helpers/color';
import { CatDefinition, CATS } from '../model/cats';
import { GAME_WIDTH, GAME_HEIGHT } from '../model/const';
import { PAL } from '../model/palette';

type CatCard = {
  card: Phaser.GameObjects.Rectangle;
  portrait: Phaser.GameObjects.Sprite;
  nameText: Phaser.GameObjects.Text;
  index: number;
  glow: Phaser.GameObjects.Rectangle;
};

export class MenuScene extends Phaser.Scene {
  private selectedCat = 0;
  private catCards: CatCard[] = [];
  private modalGroup: Phaser.GameObjects.Container | null = null;
  private modalVisible = false;
  private modalPreview?: Phaser.GameObjects.Sprite;
  private modalNameText?: Phaser.GameObjects.Text;
  private modalDescText?: Phaser.GameObjects.Text;
  private modalStoryText?: Phaser.GameObjects.Text;
  private modalAbilityLabel?: Phaser.GameObjects.Text;
  private modalAbilityText?: Phaser.GameObjects.Text;
  private modalBg?: Phaser.GameObjects.Rectangle;
  private modalInner?: Phaser.GameObjects.Rectangle;
  private modalAbilitySummary?: Phaser.GameObjects.Text;
  private previewBaseY = 0;

  constructor() {
    super('Menu');
  }

  create() {
    this.cameras.main.setBackgroundColor(PAL.void);

    this.buildDust();
    this.buildTitle();
    this.buildCatCards();
    this.buildModal();
    this.buildControlsText();

    this.selectCat(0);

    this.input.keyboard?.on('keydown-LEFT', () => {
      sfx.resume();
      sfx.select();
      this.selectCat(Math.max(0, this.selectedCat - 1));
    });

    this.input.keyboard?.on('keydown-RIGHT', () => {
      sfx.resume();
      sfx.select();
      this.selectCat(Math.min(Math.min(CATS.length, CAT_SPRITES.length) - 1, this.selectedCat + 1));
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      this.startGame();
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      this.startGame();
    });
  }

  private buildDust() {
    for (let i = 0; i < 40; i++) {
      const dust = this.add
        .image(Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT, 'dust')
        .setAlpha(0.1 + Math.random() * 0.14);

      this.tweens.add({
        targets: dust,
        y: dust.y + 50 + Math.random() * 70,
        x: dust.x + Phaser.Math.Between(-20, 20),
        alpha: 0,
        duration: 5000 + Math.random() * 4000,
        repeat: -1,
        onRepeat: () => {
          dust.x = Math.random() * GAME_WIDTH;
          dust.y = Math.random() * GAME_HEIGHT;
          dust.alpha = 0.1 + Math.random() * 0.14;
        },
      });
    }
  }

  private buildTitle() {
    this.add
      .text(GAME_WIDTH / 2, 36, 'VERTICODE CATS', {
        fontFamily: 'Courier New, monospace',
        fontSize: '30px',
        fontStyle: 'bold',
        color: PAL.title,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 64, 'DUNGEON CRAWL', {
        fontFamily: 'Courier New, monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: PAL.ui,
        letterSpacing: 6,
      })
      .setOrigin(0.5);

    this.add
      .rectangle(GAME_WIDTH / 2, 82, 180, 1, hexToNum(PAL.wallMid), 0.5);

    this.add
      .text(GAME_WIDTH / 2, 98, "THE DARKNESS IS SPREADING!!!", {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color: PAL.accent,
      })
      .setOrigin(0.5);
  }

  private buildCatCards() {
    this.catCards = [];

    const count = Math.min(CATS.length, CAT_SPRITES.length);
    const cardW = 48;
    const cardH = 50;
    const gapX = 10;
    const gapY = 10;

    const columns = Math.ceil(count / 1.1);
    const totalWidth = columns * cardW + (columns - 1) * gapX;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardW / 2;
    const startY = 156;
  

    for (let i = 0; i < count; i++) {
      const cat = CATS[i] as CatDefinition;
      const index = i;
      const col = i % columns;
      const row = Math.floor(i / columns);

     const x = startX + col * (cardW + gapX);
     const y = startY + row * (cardH + gapY);

      const glow = this.add
        .rectangle(x, y, cardW + 6, cardH + 6, hexToNum(PAL.accent), 0)
        .setOrigin(0.5);

      const card = this.add
        .rectangle(x, y, cardW, cardH, hexToNum(PAL.wallDark), 0.7)
        .setStrokeStyle(1, hexToNum(PAL.wallMid), 0.3)
        .setInteractive({ useHandCursor: true });

      const portrait = this.add
        .sprite(x, y - 4, cat.spriteKey, 0)
        .setScale(CAT_MENU_DISPLAY_SCALE * 0.55)
        .setOrigin(0.5, 0.58);

      const nameText = this.add
        .text(x, y + 18, cat.name.split(' ')[0], {
          fontFamily: 'Courier New, monospace',
          fontSize: '7px',
          fontStyle: 'bold',
          color: PAL.title,
          align: 'center',
          wordWrap: { width: cardW - 4 },
        })
        .setOrigin(0.5);

this.input.keyboard?.on('keydown-UP', () => {
  sfx.resume();
  sfx.select();

  const count = Math.min(CATS.length, CAT_SPRITES.length);
  const columns = Math.ceil(count / 2);
  this.selectCat(Math.max(0, this.selectedCat - columns));
});

this.input.keyboard?.on('keydown-DOWN', () => {
  sfx.resume();
  sfx.select();

  const count = Math.min(CATS.length, CAT_SPRITES.length);
  const columns = Math.ceil(count / 2);
  this.selectCat(Math.min(count - 1, this.selectedCat + columns));
});this.input.keyboard?.on('keydown-UP', () => {
  sfx.resume();
  sfx.select();

  const count = Math.min(CATS.length, CAT_SPRITES.length);
  const columns = Math.ceil(count / 2);
  this.selectCat(Math.max(0, this.selectedCat - columns));
});

this.input.keyboard?.on('keydown-DOWN', () => {
  sfx.resume();
  sfx.select();

  const count = Math.min(CATS.length, CAT_SPRITES.length);
  const columns = Math.ceil(count / 2);
  this.selectCat(Math.min(count - 1, this.selectedCat + columns));
});


      card.on('pointerdown', () => {
        sfx.resume();
        sfx.select();
        if (this.selectedCat === index && this.modalVisible) {
          this.startGame();
          return;
        }
        this.selectCat(index);
      });

      card.on('pointerover', () => {
        if (index !== this.selectedCat) {
          card.setFillStyle(hexToNum(PAL.wallMid), 0.6);
        }
        this.showModal(index);
      });

      card.on('pointerout', () => {
        if (index !== this.selectedCat) {
          card.setFillStyle(hexToNum(PAL.wallDark), 0.7);
        }
        this.showModal(this.selectedCat);
      });

      this.catCards.push({ card, portrait, nameText, index, glow });
    }
  }

  private getAbilityCountdown(): string {
    const launch = new Date('2025-08-01T00:00:00');
    const now = new Date();
    const diff = launch.getTime() - now.getTime();
    const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    if (days === 0) return 'recharging... any moment now';
    return `recharging... check back in ${days} day${days === 1 ? '' : 's'}`;
  }

  private buildModal() {
    const modalW = 480;
    const modalH = 254;

    const modalX = GAME_WIDTH / 2;
    const modalY = 360;

    this.modalGroup = this.add.container(modalX, modalY);

    this.modalBg = this.add
      .rectangle(0, 0, modalW + 4, modalH + 4, hexToNum(PAL.accent), 0.1)
      .setOrigin(0.5);
    this.modalGroup.add(this.modalBg);

    this.modalInner = this.add
      .rectangle(0, 0, modalW, modalH, hexToNum(PAL.wallDark), 0.94)
      .setStrokeStyle(1, hexToNum(PAL.wallMid), 0.5)
      .setOrigin(0.5);
    this.modalGroup.add(this.modalInner);

    const previewX = -modalW / 2 + 70;
    this.previewBaseY = -14;

    this.modalPreview = this.add
      .sprite(previewX, this.previewBaseY, CATS[0].spriteKey, 0)
      .setScale(1.1)
      .setOrigin(0.5);
    this.modalGroup.add(this.modalPreview);

    this.tweens.add({
      targets: this.modalPreview,
      y: this.previewBaseY + 6,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const divider = this.add
      .rectangle(previewX + 52, -10, 1, modalH - 50, hexToNum(PAL.wallHi), 0.25)
      .setOrigin(0.5);
    this.modalGroup.add(divider);

    const textX = 40;
    const textW = 290;

    this.modalNameText = this.add
      .text(textX, -modalH / 2 + 20, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: PAL.title,
        wordWrap: { width: textW },
      })
      .setOrigin(0.5, 0);
    this.modalGroup.add(this.modalNameText);

    this.modalDescText = this.add
      .text(textX, -modalH / 2 + 40, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '9px',
        color: PAL.fuseLit,
        wordWrap: { width: textW },
      })
      .setOrigin(0.5, 0);
    this.modalGroup.add(this.modalDescText);

    this.modalStoryText = this.add
      .text(textX, -modalH / 2 + 58, '', {
        fontFamily: 'Georgia, serif',
        fontSize: '10px',
        fontStyle: 'italic',
        color: '#9a8e96',
        wordWrap: { width: textW },
        lineSpacing: 3,
      })
      .setOrigin(0.5, 0);
    this.modalGroup.add(this.modalStoryText);

    

    this.modalAbilityLabel = this.add
      .text(textX, -modalH / 2 + 118, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '9px',
        fontStyle: 'italic',
        color: PAL.fuseLit,
        wordWrap: { width: textW },
      })
      .setOrigin(0.5, 0);
    this.modalGroup.add(this.modalAbilityLabel);

    this.modalAbilitySummary = this.add
      .text(textX, -modalH / 2 + 132, '', {
        fontFamily: 'Georgia, serif',
        fontSize: '8px',
        color: PAL.wallHi,
        wordWrap: { width: textW },
        lineSpacing: 2,
      })
      .setOrigin(0.5, 0);
    this.modalGroup.add(this.modalAbilitySummary);

    this.modalAbilityText = this.add
      .text(textX, -modalH / 2 + 162, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '8px',
        color: PAL.title,
        fontStyle: 'italic',
        wordWrap: { width: textW },
      })
      .setOrigin(0.5, 0);
    this.modalGroup.add(this.modalAbilityText);

    const btnW = 180;
    const btnH = 34;
    const btnY = modalH / 2 - 28;

    const startBtn = this.add
      .rectangle(0, btnY, btnW, btnH, hexToNum(PAL.accent), 0.9)
      .setStrokeStyle(1, 0xffffff, 0.1)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.modalGroup.add(startBtn);

    const startLabel = this.add
      .text(0, btnY, 'ENTER THE DUNGEON', {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        fontStyle: 'bold',
        color: PAL.title,
      })
      .setOrigin(0.5);
    this.modalGroup.add(startLabel);

    this.tweens.add({
      targets: [startBtn],
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    startBtn.on('pointerdown', () => {
      this.startGame();
    });

    this.modalGroup.setAlpha(0);
    this.modalGroup.setScale(0.95);
  }

  private showModal(index: number) {
    const count = Math.min(CATS.length, CAT_SPRITES.length);
    const safeIndex = Phaser.Math.Clamp(index, 0, count - 1);
    const cat = CATS[safeIndex];

    this.modalPreview?.setTexture(cat.spriteKey);
    this.modalPreview?.setFrame(0);

    this.modalNameText?.setText(cat.name);
    this.modalDescText?.setText(cat.desc);
    this.modalStoryText?.setText(cat.backstory);
    this.modalAbilityLabel?.setText(`⚡ ${cat.ability.name}`);
    this.modalAbilitySummary?.setText(cat.ability.summary);
    this.modalAbilityText?.setText(this.getAbilityCountdown());

    if (!this.modalVisible) {
      this.modalVisible = true;
      this.tweens.killTweensOf(this.modalGroup!);
      this.tweens.add({
        targets: this.modalGroup,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 180,
        ease: 'Back.easeOut',
      });
    }
  }

  private buildControlsText() {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 22, 'Arrows to browse  ·  Hover to inspect  ·  Enter to descend', {
        fontFamily: 'Courier New, monospace',
        fontSize: '9px',
        color: '#4a4456',
      })
      .setOrigin(0.5);
  }

  private selectCat(index: number) {
    const count = Math.min(CATS.length, CAT_SPRITES.length);
    this.selectedCat = Phaser.Math.Clamp(index, 0, count - 1);

    this.catCards.forEach((cardData) => {
      const selected = cardData.index === this.selectedCat;

      cardData.glow.setFillStyle(
        hexToNum(PAL.accent),
        selected ? 0.18 : 0,
      );

      cardData.card.setStrokeStyle(
        selected ? 1.5 : 1,
        hexToNum(selected ? PAL.floorA : PAL.wallHi),
        selected ? 0.7 : 0.3,
      );

      cardData.card.setFillStyle(
        hexToNum(selected ? PAL.accent : PAL.wallHi),
        selected ? 0.85 : 0.7,
      );

      cardData.portrait.setScale(
        selected ? CAT_MENU_DISPLAY_SCALE * 0.62 : CAT_MENU_DISPLAY_SCALE * 0.55,
      );
      cardData.nameText.setColor(selected ? PAL.title : PAL.ui);
    });

    this.showModal(this.selectedCat);

    if (this.modalPreview) {
      this.tweens.add({
        targets: this.modalPreview,
        scaleX: 1.25,
        scaleY: 1.25,
        duration: 140,
        yoyo: true,
        ease: 'Back.easeOut',
      });
    }
  }

  private startGame() {
    sfx.resume();
    sfx.start();
    this.cameras.main.fadeOut(400, 5, 5, 14);

    this.time.delayedCall(400, () => {
      this.scene.start('Game', {
        catIndex: this.selectedCat,
      });
    });
  }
}