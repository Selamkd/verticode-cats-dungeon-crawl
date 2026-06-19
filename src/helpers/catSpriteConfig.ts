import Phaser from 'phaser';

export const CAT_SPRITES = [
  'cat_0_yuki',
  'cat_1_kika',
  'cat_2_tim',
  'cat_3_rizz_figgy',
  'cat_4_june_joe',
  'cat_5_merin',
  'cat_6_teddy',
] as const;
export type CatSpriteKey = typeof CAT_SPRITES[number];

export type SpriteDirection = 'down' | 'up' | 'left' | 'right';

export const CAT_SPRITE_FRAME_SIZE = 64;
export const CAT_SPRITE_DISPLAY_SCALE = 0.62;
export const CAT_MENU_DISPLAY_SCALE = 0.82;
export const CAT_OVER_DISPLAY_SCALE = 1.35;


export const CAT_FRAME_BY_DIRECTION: Record<SpriteDirection, number> = {
  down: 0,
  up: 1,
  left: 2,
  right: 3,
};

export function getCatFrame(direction: SpriteDirection) {
  return CAT_FRAME_BY_DIRECTION[direction];
}

export function getCatSpriteKey(catIndex: number) {
  return CAT_SPRITES[catIndex] ?? CAT_SPRITES[0];
}

export function preloadCatSprites(scene: Phaser.Scene) {
  CAT_SPRITES.forEach((key) => {
    scene.load.spritesheet(key, `/assets/cats/sheets_64/${key}.png`, {
      frameWidth: CAT_SPRITE_FRAME_SIZE,
      frameHeight: CAT_SPRITE_FRAME_SIZE,
    });
  });
}
