import { boxOf, CELLS, colOf, rowOf } from './grid';
import { shuffle, type Rng } from './random';
import type { Grid } from './types';

const ALL = 0x3fe; // bit 1..9

function popcount(n: number): number {
  let c = 0;
  while (n) {
    n &= n - 1;
    c++;
  }
  return c;
}

function digitsOf(mask: number): number[] {
  const out: number[] = [];
  for (let d = 1; d <= 9; d++) if (mask & (1 << d)) out.push(d);
  return out;
}

interface State {
  g: Grid;
  rows: number[];
  cols: number[];
  boxes: number[];
}

/** Dựng bitmask; trả về null nếu đề tự mâu thuẫn. */
function init(grid: Grid): State | null {
  if (grid.length !== CELLS) return null;
  const s: State = {
    g: grid.slice(),
    rows: new Array(9).fill(0),
    cols: new Array(9).fill(0),
    boxes: new Array(9).fill(0),
  };
  for (let i = 0; i < CELLS; i++) {
    const v = s.g[i];
    if (!v) continue;
    if (v < 1 || v > 9) return null;
    const bit = 1 << v;
    const r = rowOf(i);
    const c = colOf(i);
    const b = boxOf(i);
    if ((s.rows[r] | s.cols[c] | s.boxes[b]) & bit) return null;
    s.rows[r] |= bit;
    s.cols[c] |= bit;
    s.boxes[b] |= bit;
  }
  return s;
}

/**
 * Backtracking + chọn ô ít ứng viên nhất (MRV).
 * `visit` được gọi với mỗi nghiệm tìm thấy; trả về true để dừng tìm kiếm.
 */
function dfs(s: State, visit: (g: Grid) => boolean, rng?: Rng): boolean {
  let best = -1;
  let bestMask = 0;
  let bestCount = 10;
  for (let i = 0; i < CELLS; i++) {
    if (s.g[i]) continue;
    const mask = ALL & ~(s.rows[rowOf(i)] | s.cols[colOf(i)] | s.boxes[boxOf(i)]);
    const cnt = popcount(mask);
    if (cnt === 0) return false; // ngõ cụt
    if (cnt < bestCount) {
      best = i;
      bestMask = mask;
      bestCount = cnt;
      if (cnt === 1) break;
    }
  }
  if (best === -1) return visit(s.g);

  const r = rowOf(best);
  const c = colOf(best);
  const b = boxOf(best);
  const digits = rng ? shuffle(digitsOf(bestMask), rng) : digitsOf(bestMask);
  for (const d of digits) {
    const bit = 1 << d;
    s.g[best] = d;
    s.rows[r] |= bit;
    s.cols[c] |= bit;
    s.boxes[b] |= bit;
    if (dfs(s, visit, rng)) return true;
    s.rows[r] &= ~bit;
    s.cols[c] &= ~bit;
    s.boxes[b] &= ~bit;
  }
  s.g[best] = 0;
  return false;
}

/** Giải đề. Trả về lời giải đầu tiên hoặc null nếu vô nghiệm. */
export function solve(grid: Grid, rng?: Rng): Grid | null {
  const s = init(grid);
  if (!s) return null;
  let result: Grid | null = null;
  dfs(
    s,
    (g) => {
      result = g.slice();
      return true;
    },
    rng,
  );
  return result;
}

/** Đếm số nghiệm, dừng sớm khi đạt `limit` (mặc định 2 – đủ để kiểm tra nghiệm duy nhất). */
export function countSolutions(grid: Grid, limit = 2): number {
  const s = init(grid);
  if (!s) return 0;
  let count = 0;
  dfs(s, () => ++count >= limit);
  return count;
}

export const hasUniqueSolution = (grid: Grid): boolean => countSolutions(grid, 2) === 1;
