export const TILE_SIZE = 40;

export const COLS = 20;
export const ROWS = 15;

export const GAME_WIDTH = COLS * TILE_SIZE;
export const GAME_HEIGHT = ROWS * TILE_SIZE;



export type GridPosition = {
  col: number;
  row: number;
};

export function gridToWorld(pos: GridPosition) {
  return {
    x: pos.col * TILE_SIZE + TILE_SIZE / 2,
    y: pos.row * TILE_SIZE + TILE_SIZE / 2,
  };
}