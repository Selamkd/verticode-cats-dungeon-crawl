import Phaser from 'phaser';
import { sfx } from '../systems/SFX';

import {
  CAT_MENU_DISPLAY_SCALE,
  CAT_SPRITES,
  getCatSpriteKey,
} from '../helpers/catSpriteConfig';
import { hexToNum } from '../helpers/color';
import { CatDefinition, CATS } from '../model/cats';
import { GAME_WIDTH, GAME_HEIGHT } from '../model/const';
import { PAL } from '../model/palette';

type CatCard = {
  card: Phaser.GameObjects.Rectangle;
  portrait: Phaser.GameObjects.Sprite;
  nameText: Phaser.GameObjects.Text;
  descText: Phaser.GameObjects.Text;
  index: number;
};

export class MenuScene extends Phaser.Scene {
  private selectedCat = 0;
  private catCards: CatCard[] = [];

  private detailNameText?: Phaser.GameObjects.Text;
  private detailStoryText?: Phaser.GameObjects.Text;
  private detailAbilityText?: Phaser.GameObjects.Text;
  private selectedPreview?: Phaser.GameObjects.Sprite;
  private previewBaseY = 370;

  constructor() {
    super('Menu');
  }

  create() {
    this.cameras.main.setBackgroundColor(PAL.void);

    this.buildDust();
    this.buildTitle();
    this.buildCatCards();
    this.buildDetailsPanel();
    this.buildStartButton();
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
        .setAlpha(0.15 + Math.random() * 0.2);

      this.tweens.add({
        targets: dust,
        y: dust.y + 60 + Math.random() * 80,
        x: dust.x + Phaser.Math.Between(-30, 30),
        alpha: 0,
        duration: 4000 + Math.random() * 4000,
        repeat: -1,
        onRepeat: () => {
          dust.x = Math.random() * GAME_WIDTH;
          dust.y = Math.random() * GAME_HEIGHT;
          dust.alpha = 0.15 + Math.random() * 0.2;
        },
      });
    }
  }

  private buildTitle() {
    const titleY = 60;

    this.add
      .text(GAME_WIDTH / 2, titleY, 'VERTICODE CATS', {
        fontFamily: 'Courier New, monospace',
        fontSize: '34px',
        fontStyle: 'bold',
        color: PAL.title,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, titleY + 38, 'D U N G E O N   C R A W L', {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        color: PAL.accent,
      })
      .setOrigin(0.5);

    const themeTag = this.add
      .text(GAME_WIDTH / 2, titleY + 62, "— it's spreading —", {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        fontStyle: 'italic',
        color: '#665588',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: themeTag,
      alpha: 0.4,
      duration: 2000,
      yoyo: true,
      repeat: -1,
    });

    this.add
      .text(GAME_WIDTH / 2, 142, 'Choose your cat', {
        fontFamily: 'Courier New, monospace',
        fontSize: '16px',
        color: PAL.ui,
      })
      .setOrigin(0.5);
  }

  private buildCatCards() {
    this.catCards = [];

    const count = Math.min(CATS.length, CAT_SPRITES.length);
    const startX = GAME_WIDTH / 2 - ((count - 1) * 86) / 2;

    CATS.slice(0, count).forEach((cat: CatDefinition, index: number) => {
      const x = startX + index * 86;
      const y = 230;

      const card = this.add
        .rectangle(x, y, 74, 98, hexToNum(PAL.wallMid), 0.6)
        .setStrokeStyle(2, hexToNum(PAL.accent), 0.3)
        .setInteractive({ useHandCursor: true });

      const portrait = this.add
        .sprite(x, y - 18, getCatSpriteKey(index), 0)
        .setScale(CAT_MENU_DISPLAY_SCALE)
        .setOrigin(0.5, 0.58);

      const nameText = this.add
        .text(x, y + 30, cat.name, {
          fontFamily: 'Courier New, monospace',
          fontSize: '10px',
          color: PAL.ui,
        })
        .setOrigin(0.5);

      const descText = this.add
        .text(x, y + 43, cat.desc, {
          fontFamily: 'Georgia, serif',
          fontSize: '8px',
          fontStyle: 'italic',
          color: '#888',
        })
        .setOrigin(0.5);

      card.on('pointerdown', () => {
        sfx.resume();
        sfx.select();
        this.selectCat(index);
      });

      card.on('pointerover', () => {
        if (index !== this.selectedCat) {
          card.setFillStyle(hexToNum(PAL.wallHi), 0.7);
        }
      });

      card.on('pointerout', () => {
        if (index !== this.selectedCat) {
          card.setFillStyle(hexToNum(PAL.wallMid), 0.6);
        }
      });

      this.catCards.push({
        card,
        portrait,
        nameText,
        descText,
        index,
      });
    });
  }

  private buildDetailsPanel() {
    this.add
      .rectangle(GAME_WIDTH / 2, 372, 640, 132, 0x0a0a14, 0.82)
      .setStrokeStyle(1, hexToNum(PAL.accent), 0.25);

    this.selectedPreview = this.add
      .sprite(GAME_WIDTH / 2 - 260, this.previewBaseY, getCatSpriteKey(0), 0)
      .setScale(1.15)
      .setOrigin(0.5, 0.58);

    this.tweens.add({
      targets: this.selectedPreview,
      y: this.previewBaseY + 7,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.detailNameText = this.add
      .text(GAME_WIDTH / 2 + 30, 324, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '15px',
        fontStyle: 'bold',
        color: PAL.gold,
      })
      .setOrigin(0.5);

    this.detailStoryText = this.add
      .text(GAME_WIDTH / 2 + 30, 360, '', {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        fontStyle: 'italic',
        color: '#a8a0ba',
        align: 'center',
        wordWrap: {
          width: 480,
        },
        lineSpacing: 4,
      })
      .setOrigin(0.5);

    this.detailAbilityText = this.add
      .text(GAME_WIDTH / 2 + 30, 420, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: PAL.accent,
        align: 'center',
        wordWrap: {
          width: 480,
        },
      })
      .setOrigin(0.5);
  }

  private buildStartButton() {
    const startButton = this.add
      .rectangle(GAME_WIDTH / 2, 510, 190, 48, hexToNum(PAL.accent), 0.9)
      .setStrokeStyle(2, 0xffffff, 0.2)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(GAME_WIDTH / 2, 510, 'ENTER THE DUNGEON', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#fff',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: startButton,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    startButton.on('pointerdown', () => {
      this.startGame();
    });
  }

  private buildControlsText() {
    this.add
      .text(GAME_WIDTH / 2, 560, 'Arrow keys to choose  ·  Enter or Space to start  ·  Tap cards on mobile', {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: '#555266',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 16, 'verticode ©', {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: '#332e44',
      })
      .setOrigin(0.5);
  }

  private selectCat(index: number) {
    const count = Math.min(CATS.length, CAT_SPRITES.length);
    this.selectedCat = Phaser.Math.Clamp(index, 0, count - 1);

    this.catCards.forEach((cardData) => {
      const selected = cardData.index === this.selectedCat;

      cardData.card.setStrokeStyle(
        selected ? 3 : 2,
        selected ? hexToNum(PAL.gold) : hexToNum(PAL.accent),
        selected ? 1 : 0.3,
      );

      cardData.card.setFillStyle(
        hexToNum(selected ? PAL.wallHi : PAL.wallMid),
        selected ? 0.9 : 0.6,
      );

      cardData.portrait.setScale(selected ? CAT_MENU_DISPLAY_SCALE * 1.12 : CAT_MENU_DISPLAY_SCALE);
      cardData.nameText.setColor(selected ? PAL.gold : PAL.ui);
    });

    const cat = CATS[this.selectedCat];

    this.selectedPreview?.setTexture(getCatSpriteKey(this.selectedCat));
    this.selectedPreview?.setFrame(0);

    if (this.selectedPreview) {
      this.selectedPreview.setScale(1.15);
      this.tweens.add({
        targets: this.selectedPreview,
        scaleX: 1.32,
        scaleY: 1.32,
        duration: 160,
        yoyo: true,
        ease: 'Back.easeOut',
      });
    }

    this.detailNameText?.setText(`${cat.name}  ·  ${cat.desc}`);
    this.detailStoryText?.setText(cat.backstory);
    this.detailAbilityText?.setText(
      `Future ability: ${cat.ability.name} — ${cat.ability.summary}`,
    );
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