import { DIFFICULTIES, type Difficulty } from '../core/types';

export interface DifficultyStats {
  played: number;
  won: number;
  bestTime: number | null; // giây
  totalWinTime: number;
  currentStreak: number;
  bestStreak: number;
}

export type Stats = Record<Difficulty, DifficultyStats>;

export const emptyDifficultyStats = (): DifficultyStats => ({
  played: 0,
  won: 0,
  bestTime: null,
  totalWinTime: 0,
  currentStreak: 0,
  bestStreak: 0,
});

export const emptyStats = (): Stats =>
  Object.fromEntries(DIFFICULTIES.map((d) => [d, emptyDifficultyStats()])) as Stats;

/** Ghi nhận kết quả 1 ván (thắng/thua). Trả về object mới. */
export function recordGame(stats: Stats, difficulty: Difficulty, won: boolean, time: number): Stats {
  const s = { ...(stats[difficulty] ?? emptyDifficultyStats()) };
  s.played += 1;
  if (won) {
    s.won += 1;
    s.totalWinTime += time;
    s.bestTime = s.bestTime === null ? time : Math.min(s.bestTime, time);
    s.currentStreak += 1;
    s.bestStreak = Math.max(s.bestStreak, s.currentStreak);
  } else {
    s.currentStreak = 0;
  }
  return { ...stats, [difficulty]: s };
}

export const winRate = (s: DifficultyStats): number => (s.played ? s.won / s.played : 0);
export const averageTime = (s: DifficultyStats): number | null =>
  s.won ? Math.round(s.totalWinTime / s.won) : null;
