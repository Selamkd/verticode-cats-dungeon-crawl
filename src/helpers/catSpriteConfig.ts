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

export const CAT_FRAME_BY_DIRECTION = {
  down: 0,
  up: 1,
  left: 2,
  right: 3,
} as const;

export type SpriteDirection = keyof typeof CAT_FRAME_BY_DIRECTION;

export function getCatFrame(direction: SpriteDirection) {
  return CAT_FRAME_BY_DIRECTION[direction];
}

export function preloadCatSprites(scene: Phaser.Scene, basePath = '/assets/cats/sheets_64') {
  CAT_SPRITES.forEach((key) => {
    scene.load.spritesheet(key, `${basePath}/${key}.png`, {
      frameWidth: 64,
      frameHeight: 64,
    });
  });
}
