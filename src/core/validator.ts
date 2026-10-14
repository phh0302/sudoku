import { CELLS, PEERS } from './grid';
import type { Grid } from './types';

/** Có thể đặt `value` vào ô `index` mà không trùng hàng/cột/khối không? */
export function isValidMove(grid: Grid, index: number, value: number): boolean {
  if (value < 1 || value > 9) return false;
  for (const p of PEERS[index]) if (grid[p] === value) return false;
  return true;
}

/** Mảng boolean: ô i có trùng giá trị với một ô hàng xóm không. */
export function findConflicts(grid: Grid): boolean[] {
  const out = new Array<boolean>(CELLS).fill(false);
  for (let i = 0; i < CELLS; i++) {
    const v = grid[i];
    if (!v) continue;
    for (const p of PEERS[i]) {
      if (grid[p] === v) {
        out[i] = true;
        break;
      }
    }
  }
  return out;
}

/** Các ô đã điền không mâu thuẫn nhau (ô trống được bỏ qua). */
export const isValidGrid = (grid: Grid): boolean =>
  grid.length === CELLS && grid.every((v) => v >= 0 && v <= 9) && !findConflicts(grid).some(Boolean);

/** Bàn cờ đã điền đủ và hợp lệ. */
export const isComplete = (grid: Grid): boolean => !grid.includes(0) && isValidGrid(grid);
