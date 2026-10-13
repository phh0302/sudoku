import bankJson from '../../assets/puzzles.json';
import { generatePuzzle } from './generator';
import { parseGrid } from './grid';
import { mulberry32, randInt, seedFromString, type Rng } from './random';
import { solve } from './solver';
import { transformPuzzle } from './transform';
import type { Difficulty, Puzzle } from './types';

const bank = bankJson as Partial<Record<Difficulty, string[]>>;

/** Lấy 1 đề: chọn từ kho đề sinh sẵn + biến đổi ngẫu nhiên (tức thì). Kho rỗng thì sinh trực tiếp. */
export function getPuzzle(difficulty: Difficulty, rng: Rng = Math.random): Puzzle {
  const list = bank[difficulty] ?? [];
  if (list.length === 0) return generatePuzzle(difficulty, rng);
  const puzzle = parseGrid(list[randInt(rng, list.length)]);
  const solution = solve(puzzle);
  if (!solution) return generatePuzzle(difficulty, rng);
  return transformPuzzle({ puzzle, solution, difficulty }, rng);
}

/** Độ khó daily theo thứ trong tuần (CN → T7). */
const DAILY_DIFFICULTY: Difficulty[] = ['hard', 'easy', 'medium', 'medium', 'hard', 'medium', 'expert'];

/** "YYYY-MM-DD" theo giờ địa phương. */
export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Đề thử thách hằng ngày: cùng ngày → cùng đề trên mọi máy. */
export function getDailyPuzzle(date: Date = new Date()): Puzzle & { key: string } {
  const key = dateKey(date);
  const rng = mulberry32(seedFromString(`sudoku-daily-${key}`));
  return { ...getPuzzle(DAILY_DIFFICULTY[date.getDay()], rng), key };
}
