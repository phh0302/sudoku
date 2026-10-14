import { CELLS, countClues, emptyGrid } from './grid';
import { solvableByIntermediate, solvableBySingles } from './logical';
import { shuffle, type Rng } from './random';
import { countSolutions, solve } from './solver';
import type { Difficulty, Grid, Puzzle } from './types';

/** Số ô gợi ý mục tiêu cho mỗi độ khó. */
export const CLUE_TARGET: Record<Difficulty, number> = {
  easy: 40,
  medium: 33,
  hard: 28,
  expert: 24,
  master: 22,
};

/** Số gợi ý tối đa chấp nhận cho đề Bậc thầy */
export const MASTER_MAX_CLUES = 24;

/** Sinh một lưới đầy đủ hợp lệ ngẫu nhiên. */
export function generateFullGrid(rng: Rng = Math.random): Grid {
  const g = solve(emptyGrid(), rng);
  if (!g) throw new Error('Không sinh được lưới'); // không bao giờ xảy ra
  return g;
}

/**
 * Sinh đề theo độ khó:
 * 1. Sinh lưới đầy đủ.
 * 2. Xóa dần ô (theo cặp đối xứng tâm cho đẹp), sau mỗi lần xóa kiểm tra đề còn duy nhất 1 nghiệm.
 *    Với Dễ/Trung bình còn yêu cầu giải được chỉ bằng single (không cần đoán).
 * 3. Dừng khi đạt số gợi ý mục tiêu (hoặc không xóa thêm được).
 */
export function generatePuzzle(difficulty: Difficulty, rng: Rng = Math.random): Puzzle {
  // Chuyên gia: phải cần kỹ thuật cao hơn single và ≤ 26 gợi ý (thử lại tối đa 30 lần).
  if (difficulty === 'expert') {
    const bad = (p: Puzzle) => solvableBySingles(p.puzzle) || countClues(p.puzzle) > 26;
    let p = carve(difficulty, rng);
    for (let i = 0; i < 30 && bad(p); i++) p = carve(difficulty, rng);
    return p;
  }
  // Bậc thầy: không giải được bằng kỹ thuật trung cấp (cần X-Wing, chuỗi, đoán…) và ≤ 24 gợi ý.
  if (difficulty === 'master') {
    const bad = (p: Puzzle) =>
      countClues(p.puzzle) > MASTER_MAX_CLUES || solvableByIntermediate(p.puzzle);
    let p = carve(difficulty, rng);
    for (let i = 0; i < 200 && bad(p); i++) p = carve(difficulty, rng);
    return p;
  }
  return carve(difficulty, rng);
}

function carve(difficulty: Difficulty, rng: Rng): Puzzle {
  const solution = generateFullGrid(rng);
  const puzzle = solution.slice();
  const target = CLUE_TARGET[difficulty];
  const needSingles = difficulty === 'easy' || difficulty === 'medium';

  let clues = CELLS;
  for (const idx of shuffle([...Array(CELLS).keys()], rng)) {
    if (clues <= target) break;
    // Bậc thầy xóa từng ô (không đối xứng) để xuống được ít gợi ý hơn
    const mirror = CELLS - 1 - idx;
    const cells = difficulty === 'master' || idx === mirror ? [idx] : [idx, mirror];
    if (cells.some((c) => puzzle[c] === 0)) continue;
    if (clues - cells.length < target - 1) continue;

    const backup = cells.map((c) => puzzle[c]);
    cells.forEach((c) => (puzzle[c] = 0));
    const ok =
      countSolutions(puzzle, 2) === 1 && (!needSingles || solvableBySingles(puzzle));
    if (ok) clues -= cells.length;
    else cells.forEach((c, k) => (puzzle[c] = backup[k]));
  }

  return { puzzle, solution, difficulty };
}
