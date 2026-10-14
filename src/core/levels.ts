/**
 * 60 màn chơi cố định cho mỗi độ khó (assets/levels.json).
 * Màn KHÔNG bị xáo trộn để mọi người chơi cùng một đề → bảng xếp hạng công bằng.
 * ⚠️ Không sửa thứ tự / nội dung levels.json sau khi phát hành, nếu không điểm cũ sẽ sai màn.
 */
import levelsJson from '../../assets/levels.json';
import { parseGrid } from './grid';
import { solve } from './solver';
import { DIFFICULTIES, type Difficulty, type Puzzle } from './types';

export const LEVEL_COUNT = 60;

const levels = levelsJson as Record<Difficulty, string[]>;

/** "easy-1" … "expert-60" */
export const levelId = (difficulty: Difficulty, n: number): string => `${difficulty}-${n}`;

export function parseLevelId(id: string): { difficulty: Difficulty; n: number } | null {
  const m = /^([a-z]+)-(\d+)$/.exec(id);
  if (!m) return null;
  const difficulty = m[1] as Difficulty;
  const n = Number(m[2]);
  if (!DIFFICULTIES.includes(difficulty) || n < 1 || n > LEVEL_COUNT) return null;
  return { difficulty, n };
}

export function getLevelPuzzle(difficulty: Difficulty, n: number): Puzzle {
  const s = levels[difficulty]?.[n - 1];
  if (!s) throw new Error(`Không có màn ${levelId(difficulty, n)}`);
  const puzzle = parseGrid(s);
  const solution = solve(puzzle);
  if (!solution) throw new Error(`Màn ${levelId(difficulty, n)} không có lời giải`);
  return { puzzle, solution, difficulty };
}
