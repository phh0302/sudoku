import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Difficulty } from '../core/types';
import { appStorage } from '../utils/storage';
import { emptyStats, recordGame, type Stats } from './stats';

interface RecordExtra {
  dailyKey?: string;
  levelId?: string;
}

interface StatsStore {
  stats: Stats;
  /** dateKey → thời gian hoàn thành (giây) */
  dailyCompleted: Record<string, number>;
  /** levelId → thời gian tốt nhất (giây) trên máy này */
  levelBest: Record<string, number>;
  record: (difficulty: Difficulty, won: boolean, time: number, extra?: RecordExtra) => void;
  reset: () => void;
}

export const useStatsStore = create<StatsStore>()(
  persist(
    (set) => ({
      stats: emptyStats(),
      dailyCompleted: {},
      levelBest: {},
      record: (difficulty, won, time, extra = {}) =>
        set((s) => {
          const next: Partial<StatsStore> = { stats: recordGame(s.stats, difficulty, won, time) };
          if (won && extra.dailyKey) next.dailyCompleted = { ...s.dailyCompleted, [extra.dailyKey]: time };
          if (won && extra.levelId) {
            const prev = s.levelBest[extra.levelId];
            if (prev === undefined || time < prev) next.levelBest = { ...s.levelBest, [extra.levelId]: time };
          }
          return next;
        }),
      reset: () => set({ stats: emptyStats(), dailyCompleted: {}, levelBest: {} }),
    }),
    {
      name: 'sudoku-stats',
      storage: appStorage,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<StatsStore>;
        return {
          ...current,
          stats: { ...emptyStats(), ...(p.stats ?? {}) },
          dailyCompleted: p.dailyCompleted ?? {},
          levelBest: p.levelBest ?? {},
        };
      },
    },
  ),
);
