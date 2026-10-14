import { shuffle, type Rng } from './random';
import type { Grid } from './types';

/** Hoán vị vị trí 0..8 nhưng giữ cấu trúc band/stack (3 nhóm 3). */
function bandPermutation(rng: Rng): number[] {
  const bands = shuffle([0, 1, 2], rng);
  return bands.flatMap((b) => shuffle([0, 1, 2], rng).map((k) => b * 3 + k));
}

export interface Transform {
  digits: number[]; // digits[old] = new, digits[0] = 0
  rows: number[]; // rows[newRow] = oldRow
  cols: number[]; // cols[newCol] = oldCol
  transpose: boolean;
}

export function randomTransform(rng: Rng = Math.random): Transform {
  return {
    digits: [0, ...shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng)],
    rows: bandPermutation(rng),
    cols: bandPermutation(rng),
    transpose: rng() < 0.5,
  };
}

/**
 * Áp dụng phép biến đổi giữ nguyên tính hợp lệ và độ khó:
 * đổi nhãn chữ số, hoán vị hàng trong band, hoán vị band, tương tự với cột, chuyển vị.
 */
export function applyTransform(g: Grid, t: Transform): Grid {
  const out = new Array<number>(81);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      let sr = t.rows[r];
      let sc = t.cols[c];
      if (t.transpose) [sr, sc] = [sc, sr];
      out[r * 9 + c] = t.digits[g[sr * 9 + sc]];
    }
  }
  return out;
}

export function transformPuzzle<T extends { puzzle: Grid; solution: Grid }>(
  p: T,
  rng: Rng = Math.random,
): T {
  const t = randomTransform(rng);
  return { ...p, puzzle: applyTransform(p.puzzle, t), solution: applyTransform(p.solution, t) };
}
