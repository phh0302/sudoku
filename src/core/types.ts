/** Bàn cờ 81 ô theo thứ tự hàng (row-major). 0 = ô trống, 1–9 = giá trị. */
export type Grid = number[];

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master';

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert', 'master'];

/** Độ khó cần mở khóa (lọt top 100 ở 1 màn Chuyên gia bất kỳ) */
export const LOCKED_DIFFICULTY: Difficulty = 'master';

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Dễ',
  medium: 'Trung bình',
  hard: 'Khó',
  expert: 'Chuyên gia',
  master: 'Bậc thầy',
};

export interface Puzzle {
  puzzle: Grid;
  solution: Grid;
  difficulty: Difficulty;
}
