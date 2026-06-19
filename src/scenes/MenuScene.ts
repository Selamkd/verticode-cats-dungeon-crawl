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
  index: number;
};

export class MenuScene extends Phaser.Scene {
  private selectedCat = 0;
  private catCards: CatCard[] = [];

  private detailNameText?: Phaser.GameObjects.Text;
  private detailStoryText?: Phaser.GameObjects.Text;
  private detailAbilityText?: Phaser.GameObjects.Text;
  private selectedPreview?: Phaser.GameObjects.Sprite;
  private previewBaseY = 422;

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
        .setAlpha(0.12 + Math.random() * 0.16);

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
          dust.alpha = 0.12 + Math.random() * 0.16;
        },
      });
    }
  }

  private buildTitle() {
    this.add
      .text(GAME_WIDTH / 2, 48, 'VERTICODE CATS  ·  DUNGEON CRAWL', {
        fontFamily: 'Courier New, monospace',
        fontSize: '28px',
        fontStyle: 'bold',
        color: PAL.title,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 82, "IT'S SPREADING", {
        fontFamily: 'Courier New, monospace',
        fontSize: '17px',
        fontStyle: 'bold',
        color: PAL.danger,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 110, 'Choose the cat who wandered too far from the safe room.', {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        fontStyle: 'italic',
        color: '#8f7181',
      })
      .setOrigin(0.5);
  }

  private buildCatCards() {
    this.catCards = [];

    const count = Math.min(CATS.length, CAT_SPRITES.length);
    const rows = count > 4 ? [4, count - 4] : [count];
    let catIndex = 0;

    rows.forEach((rowCount, rowIndex) => {
      const startX = GAME_WIDTH / 2 - ((rowCount - 1) * 124) / 2;
      const y = rowIndex === 0 ? 180 : 286;

      for (let rowPosition = 0; rowPosition < rowCount; rowPosition++) {
        const cat = CATS[catIndex] as CatDefinition;
        const index = catIndex;
        const x = startX + rowPosition * 124;

        const card = this.add
          .rectangle(x, y, 90, 92, hexToNum(PAL.wallDark), 0.68)
          .setStrokeStyle(2, hexToNum(PAL.wallMid), 0.34)
          .setInteractive({ useHandCursor: true });

        const portrait = this.add
          .sprite(x, y - 14, getCatSpriteKey(index), 0)
          .setScale(CAT_MENU_DISPLAY_SCALE)
          .setOrigin(0.5, 0.58);

        const nameText = this.add
          .text(x, y + 32, cat.name, {
            fontFamily: 'Courier New, monospace',
            fontSize: cat.name.length > 10 ? '9px' : '10px',
            fontStyle: 'bold',
            color: PAL.ui,
            align: 'center',
            wordWrap: {
              width: 82,
            },
          })
          .setOrigin(0.5);

        card.on('pointerdown', () => {
          sfx.resume();
          sfx.select();
          this.selectCat(index);
        });

        card.on('pointerover', () => {
          if (index !== this.selectedCat) {
            card.setFillStyle(hexToNum(PAL.wallMid), 0.54);
          }
        });

        card.on('pointerout', () => {
          if (index !== this.selectedCat) {
            card.setFillStyle(hexToNum(PAL.wallDark), 0.68);
          }
        });

        this.catCards.push({
          card,
          portrait,
          nameText,
          index,
        });

        catIndex++;
      }
    });
  }

  private buildDetailsPanel() {
    this.add
      .rectangle(GAME_WIDTH / 2, 426, 660, 154, 0x0a0a14, 0.86)
      .setStrokeStyle(1, hexToNum(PAL.wallMid), 0.46);

    this.selectedPreview = this.add
      .sprite(GAME_WIDTH / 2 - 260, this.previewBaseY, getCatSpriteKey(0), 0)
      .setScale(1.05)
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
      .text(GAME_WIDTH / 2 + 38, 360, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '15px',
        fontStyle: 'bold',
        color: PAL.title,
        align: 'center',
        wordWrap: {
          width: 470,
        },
      })
      .setOrigin(0.5);

    this.detailStoryText = this.add
      .text(GAME_WIDTH / 2 + 38, 402, '', {
        fontFamily: 'Georgia, serif',
        fontSize: '11px',
        fontStyle: 'italic',
        color: '#b8a5b0',
        align: 'center',
        wordWrap: {
          width: 470,
        },
        lineSpacing: 3,
      })
      .setOrigin(0.5);

    this.detailAbilityText = this.add
      .text(GAME_WIDTH / 2 + 38, 468, '', {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: PAL.accent,
        align: 'center',
        wordWrap: {
          width: 470,
        },
        lineSpacing: 3,
      })
      .setOrigin(0.5);
  }

  private buildStartButton() {
    const startButton = this.add
      .rectangle(GAME_WIDTH / 2, 536, 204, 48, hexToNum(PAL.accent), 0.88)
      .setStrokeStyle(2, 0xffffff, 0.18)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(GAME_WIDTH / 2, 536, 'ENTER THE DUNGEON', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: PAL.title,
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
      .text(GAME_WIDTH / 2, 580, 'Arrow keys to choose  ·  Enter or Space to start  ·  Tap cards on mobile', {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: '#555266',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 10, 'abilities are currently recharging in the basement', {
        fontFamily: 'Courier New, monospace',
        fontSize: '9px',
        color: '#3c3446',
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
        hexToNum(PAL.wallMid),
        selected ? 0.92 : 0.34,
      );

      cardData.card.setFillStyle(
        hexToNum(selected ? PAL.wallHi : PAL.wallDark),
        selected ? 0.76 : 0.68,
      );

      cardData.portrait.setScale(selected ? CAT_MENU_DISPLAY_SCALE * 1.12 : CAT_MENU_DISPLAY_SCALE);
      cardData.nameText.setColor(selected ? PAL.title : PAL.ui);
    });

    const cat = CATS[this.selectedCat];

    this.selectedPreview?.setTexture(getCatSpriteKey(this.selectedCat));
    this.selectedPreview?.setFrame(0);

    if (this.selectedPreview) {
      this.selectedPreview.setScale(1.05);
      this.tweens.add({
        targets: this.selectedPreview,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 160,
        yoyo: true,
        ease: 'Back.easeOut',
      });
    }

    this.detailNameText?.setText(`${cat.name}  ·  ${cat.desc}`);
    this.detailStoryText?.setText(cat.backstory);
    this.detailAbilityText?.setText(
      `ABILITY PREVIEW: ${cat.ability.name}\n${cat.ability.summary}\nStatus: recharging...... ·`,
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