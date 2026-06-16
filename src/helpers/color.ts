export function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}