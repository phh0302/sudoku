import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { getLevelPuzzle, levelId, LEVEL_COUNT } from '../core/levels';
import { getDailyPuzzle, getPuzzle } from '../core/puzzles';
import type { Difficulty } from '../core/types';
import * as api from '../online/api';
import { isOnlineConfigured } from '../online/supabase';
import { feedback } from '../utils/haptics';
import { appStorage } from '../utils/storage';
import { createGame, gameReducer, type GameAction, type GameState } from './gameLogic';
import { useProfileStore } from './profileStore';
import { useSettingsStore } from './settingsStore';
import { useStatsStore } from './statsStore';

interface GameStore {
  game: GameState | null;
  dispatch: (a: GameAction) => void;
  newGame: (difficulty: Difficulty) => void;
  /** Mở thử thách hôm nay (tiếp tục nếu đang chơi dở). */
  openDaily: () => void;
  /** Mở màn n (1..60) của độ khó (tiếp tục nếu đang chơi dở đúng màn đó). */
  openLevel: (difficulty: Difficulty, n: number) => void;
  /** Chơi lại đúng đề hiện tại từ đầu. */
  restart: () => void;
  clear: () => void;
}

type SetFn = (p: Partial<GameStore>) => void;

/**
 * Xin "vé" xếp hạng từ máy chủ ngay khi bắt đầu màn (máy chủ bắt đầu tính giờ).
 * Không lấy được (mất mạng / chưa cấu hình) → ván vẫn chơi được nhưng không tính xếp hạng.
 */
function requestLevelToken(g: GameState, set: SetFn, get: () => GameStore) {
  const apply = (levelToken: string | null) => {
    const cur = get().game;
    if (cur?.id === g.id) set({ game: { ...cur, levelToken } });
  };
  if (!isOnlineConfigured || !g.levelId) return apply(null);
  api.startLevel(g.levelId).then(apply, (e) => {
    console.warn('[leaderboard] không lấy được vé', e);
    apply(null);
  });
}

const hasProgress = (g: GameState | null): g is GameState =>
  !!g && g.status === 'playing' && g.history.length > 0;

/** Bỏ ván đang chơi dở → tính là thua trong thống kê. */
function abandonCurrent(g: GameState | null) {
  if (hasProgress(g)) useStatsStore.getState().record(g.difficulty, false, g.elapsed);
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      game: null,

      dispatch: (a) => {
        const prev = get().game;
        if (!prev) return;
        const { autoCheck, mistakeLimit } = useSettingsStore.getState().settings;
        const next = gameReducer(prev, a, { autoCheck, mistakeLimit });
        if (next === prev) return;
        set({ game: next });

        if (a.type === 'tick' || a.type === 'sync' || a.type === 'select' || a.type === 'move') return;

        // Kết thúc ván → ghi thống kê + rung
        if (prev.status === 'playing' && next.status !== 'playing') {
          const won = next.status === 'won';
          useStatsStore.getState().record(next.difficulty, won, next.elapsed, {
            dailyKey: next.dailyKey,
            levelId: next.levelId,
          });
          feedback(won ? 'win' : 'lose');
          if (won && next.levelId) {
            void useProfileStore.getState().submitScore(next.levelId, {
              token: next.levelToken,
              board: next.board.join(''),
              mistakes: next.mistakes,
              hints: next.hintsUsed,
            });
          }
          return;
        }
        if (next.mistakes > prev.mistakes) feedback('error');
        else if (next.flashId !== prev.flashId) feedback('success');
        else feedback('tap');
      },

      newGame: (difficulty) => {
        abandonCurrent(get().game);
        set({ game: createGame(getPuzzle(difficulty)) });
      },

      openDaily: () => {
        const daily = getDailyPuzzle();
        const cur = get().game;
        if (cur?.mode === 'daily' && cur.dailyKey === daily.key) return; // tiếp tục ván hôm nay
        abandonCurrent(cur);
        set({ game: createGame(daily, { mode: 'daily', dailyKey: daily.key }) });
      },

      openLevel: (difficulty, n) => {
        if (n < 1 || n > LEVEL_COUNT) return;
        const id = levelId(difficulty, n);
        const cur = get().game;
        if (cur?.levelId === id && cur.status === 'playing') return; // tiếp tục
        abandonCurrent(cur);
        const g = createGame(getLevelPuzzle(difficulty, n), { mode: 'level', levelId: id });
        set({ game: g });
        requestLevelToken(g, set, get);
      },

      restart: () => {
        const g = get().game;
        if (!g) return;
        abandonCurrent(g);
        const fresh = createGame(
          { puzzle: g.puzzle, solution: g.solution, difficulty: g.difficulty },
          { mode: g.mode, dailyKey: g.dailyKey, levelId: g.levelId },
        );
        set({ game: fresh });
        if (fresh.levelId) requestLevelToken(fresh, set, get);
      },

      clear: () => set({ game: null }),
    }),
    {
      name: 'sudoku-game',
      storage: appStorage,
      // Không lưu lịch sử undo quá dài để ghi nhanh hơn
      partialize: (s) => ({
        game: s.game ? { ...s.game, history: s.game.history.slice(-50), flash: [] } : null,
      }),
      // Vé đang xin dở khi app bị tắt → coi như không có vé
      merge: (persisted, current) => {
        const g = (persisted as Partial<GameStore> | undefined)?.game ?? null;
        const fixed = g && g.levelId && g.levelToken === undefined ? { ...g, levelToken: null } : g;
        return { ...current, game: fixed };
      },
    },
  ),
);
