import { BOXES, CELLS, COLS, PEERS, ROWS, UNITS } from './grid';
import type { Grid } from './types';

/**
 * Giải đề chỉ bằng 2 kỹ thuật cơ bản: Naked Single và Hidden Single.
 * Dùng để đảm bảo đề Dễ / Trung bình giải được mà không cần đoán.
 * Trả về true nếu giải xong hoàn toàn.
 */
export function solvableBySingles(grid: Grid): boolean {
  const g = grid.slice();
  const candidates = (i: number): number => {
    let mask = 0x3fe;
    for (const p of PEERS[i]) if (g[p]) mask &= ~(1 << g[p]);
    return mask;
  };

  let progress = true;
  while (progress) {
    progress = false;

    // Naked single: ô chỉ còn đúng 1 ứng viên
    for (let i = 0; i < CELLS; i++) {
      if (g[i]) continue;
      const m = candidates(i);
      if (m === 0) return false;
      if ((m & (m - 1)) === 0) {
        g[i] = Math.log2(m);
        progress = true;
      }
    }

    // Hidden single: chữ số chỉ có 1 vị trí trong một đơn vị
    for (const unit of UNITS) {
      for (let d = 1; d <= 9; d++) {
        let spot = -1;
        let count = 0;
        let placed = false;
        for (const i of unit) {
          if (g[i] === d) {
            placed = true;
            break;
          }
          if (!g[i] && candidates(i) & (1 << d)) {
            spot = i;
            count++;
          }
        }
        if (placed) continue;
        if (count === 0) return false;
        if (count === 1) {
          g[spot] = d;
          progress = true;
        }
      }
    }
  }
  return !g.includes(0);
}

// ---------------------------------------------------------------------------
// Bộ giải logic nâng cao (dùng để chấm độ khó Bậc thầy)
// Kỹ thuật: naked/hidden single, locked candidates (pointing + claiming),
// naked pair/triple, hidden pair. Không đoán (không backtracking).
// ---------------------------------------------------------------------------

const ALL_DIGITS = 0x3fe;
const bitCount = (n: number) => {
  let c = 0;
  while (n) {
    n &= n - 1;
    c++;
  }
  return c;
};

/** Các tổ hợp k phần tử của mảng (k nhỏ). */
function combos<T>(arr: T[], k: number): T[][] {
  const out: T[][] = [];
  const rec = (start: number, cur: T[]) => {
    if (cur.length === k) return void out.push(cur.slice());
    for (let i = start; i < arr.length; i++) {
      cur.push(arr[i]);
      rec(i + 1, cur);
      cur.pop();
    }
  };
  rec(0, []);
  return out;
}

/**
 * Giải bằng các kỹ thuật trung cấp. Trả về true nếu giải xong hoàn toàn mà không cần đoán.
 * Đề Bậc thầy = đề KHÔNG giải được bằng hàm này.
 */
export function solvableByIntermediate(grid: Grid): boolean {
  const g = grid.slice();
  const cand = new Array<number>(CELLS).fill(0);
  for (let i = 0; i < CELLS; i++) {
    if (g[i]) continue;
    let m = ALL_DIGITS;
    for (const p of PEERS[i]) if (g[p]) m &= ~(1 << g[p]);
    cand[i] = m;
  }

  const place = (i: number, d: number) => {
    g[i] = d;
    cand[i] = 0;
    for (const p of PEERS[i]) cand[p] &= ~(1 << d);
  };

  const singles = (): boolean | null => {
    let moved = false;
    for (let i = 0; i < CELLS; i++) {
      if (g[i]) continue;
      if (cand[i] === 0) return null; // mâu thuẫn
      if ((cand[i] & (cand[i] - 1)) === 0) {
        place(i, Math.log2(cand[i]));
        moved = true;
      }
    }
    for (const unit of UNITS) {
      for (let d = 1; d <= 9; d++) {
        const bit = 1 << d;
        if (unit.some((i) => g[i] === d)) continue;
        const spots = unit.filter((i) => !g[i] && cand[i] & bit);
        if (spots.length === 0) return null;
        if (spots.length === 1) {
          place(spots[0], d);
          moved = true;
        }
      }
    }
    return moved;
  };

  const eliminate = (cells: number[], mask: number): boolean => {
    let changed = false;
    for (const i of cells) {
      if (!g[i] && cand[i] & mask) {
        cand[i] &= ~mask;
        changed = true;
      }
    }
    return changed;
  };

  const lockedCandidates = (): boolean => {
    let changed = false;
    // Pointing: trong 1 khối, chữ số chỉ nằm trên 1 hàng/cột → xóa khỏi phần còn lại của hàng/cột
    // Claiming: trong 1 hàng/cột, chữ số chỉ nằm trong 1 khối → xóa khỏi phần còn lại của khối
    const lines = [...ROWS, ...COLS];
    for (let d = 1; d <= 9; d++) {
      const bit = 1 << d;
      for (const box of BOXES) {
        const spots = box.filter((i) => !g[i] && cand[i] & bit);
        if (spots.length < 2) continue;
        for (const line of lines) {
          if (spots.every((i) => line.includes(i))) {
            changed = eliminate(line.filter((i) => !box.includes(i)), bit) || changed;
          }
        }
      }
      for (const line of lines) {
        const spots = line.filter((i) => !g[i] && cand[i] & bit);
        if (spots.length < 2) continue;
        for (const box of BOXES) {
          if (spots.every((i) => box.includes(i))) {
            changed = eliminate(box.filter((i) => !line.includes(i)), bit) || changed;
          }
        }
      }
    }
    return changed;
  };

  const subsets = (): boolean => {
    let changed = false;
    for (const unit of UNITS) {
      const empty = unit.filter((i) => !g[i]);
      // Naked pair / triple
      for (const k of [2, 3]) {
        const pool = empty.filter((i) => bitCount(cand[i]) <= k);
        for (const set of combos(pool, k)) {
          const union = set.reduce((m, i) => m | cand[i], 0);
          if (bitCount(union) === k) {
            changed = eliminate(empty.filter((i) => !set.includes(i)), union) || changed;
          }
        }
      }
      // Hidden pair
      const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => !unit.some((i) => g[i] === d));
      for (const [a, b] of combos(digits, 2)) {
        const sa = empty.filter((i) => cand[i] & (1 << a));
        const sb = empty.filter((i) => cand[i] & (1 << b));
        if (sa.length === 2 && sb.length === 2 && sa[0] === sb[0] && sa[1] === sb[1]) {
          const keep = (1 << a) | (1 << b);
          for (const i of sa) {
            if (cand[i] & ~keep) {
              cand[i] &= keep;
              changed = true;
            }
          }
        }
      }
    }
    return changed;
  };

  for (let guard = 0; guard < 500; guard++) {
    const s = singles();
    if (s === null) return false;
    if (s) continue;
    if (!g.includes(0)) return true;
    if (lockedCandidates()) continue;
    if (subsets()) continue;
    break;
  }
  return !g.includes(0);
}
