import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import * as api from '../online/api';
import { isOnlineConfigured } from '../online/supabase';
import { appStorage } from '../utils/storage';

export type PendingScore = api.ScoreInput;

/** Trạng thái gửi kết quả của ván vừa thắng (không lưu xuống máy). */
export interface SubmitState {
  levelId: string;
  status: 'sending' | 'done' | 'queued' | 'noname' | 'offline' | 'unranked' | 'rejected';
  rank?: number;
  total?: number;
  /** Thời gian máy chủ tính (giây) */
  time?: number;
  /** Lý do bị từ chối */
  reason?: string;
}

interface ProfileStore {
  name: string;
  /** Tên đã đồng bộ lên máy chủ */
  syncedName: string | null;
  /** Bài nộp chưa gửi được (mất mạng...) – tự gửi lại sau */
  pending: PendingScore[];
  submit: SubmitState | null;
  /** Đã mở khóa chế độ Bậc thầy (lưu trên máy; máy chủ mới là nơi quyết định) */
  masterUnlocked: boolean;
  masterProgress: { qualified: number; required: number; top: number } | null;
  /** Hỏi máy chủ tiến độ mở khóa Bậc thầy */
  refreshMaster: () => Promise<void>;
  setName: (name: string) => Promise<void>;
  /** Nộp kết quả màn xếp hạng. token = null nghĩa là ván không có vé (không tính xếp hạng). */
  submitScore: (levelId: string, s: Omit<PendingScore, 'levelId' | 'token'> & { token: string | null | undefined }) => Promise<void>;
  /** Gửi các bài nộp đang chờ. Trả về true nếu đã gửi hết. */
  flush: () => Promise<boolean>;
}

export const NAME_MIN = 2;
export const NAME_MAX = 20;
export const cleanName = (s: string) => s.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);

let flushing: Promise<boolean> | null = null;
/** Kết quả máy chủ trả về theo vé – để màn hình kết quả hiển thị */
const results = new Map<string, api.SubmitResult | { rejected: string }>();

/**
 * Lỗi do máy chủ từ chối hẳn (lời giải sai, vé hết hạn, quá nhanh...) – gửi lại cũng vô ích.
 * P0001 = raise exception trong hàm SQL; 23514/22P02/23502 = vi phạm ràng buộc dữ liệu.
 */
function rejection(e: unknown): string | null {
  const err = e as { code?: string; message?: string } | null;
  if (!err?.code) return null;
  if (['P0001', '23514', '22P02', '23502'].includes(err.code)) return err.message ?? 'Bị từ chối';
  return null;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      name: '',
      syncedName: null,
      pending: [],
      submit: null,
      masterUnlocked: false,
      masterProgress: null,

      refreshMaster: async () => {
        if (!isOnlineConfigured) return;
        try {
          const s = await api.fetchMasterStatus();
          set({
            masterUnlocked: get().masterUnlocked || s.unlocked,
            masterProgress: { qualified: s.qualified, required: s.required, top: s.top },
          });
        } catch (e) {
          console.warn('[master] không lấy được tiến độ', e);
        }
      },

      setName: async (raw) => {
        const name = cleanName(raw);
        if (name.length < NAME_MIN) return;
        set({ name });
        await get().flush();
      },

      submitScore: async (levelId, s) => {
        if (!isOnlineConfigured) {
          set({ submit: { levelId, status: 'offline' } });
          return;
        }
        if (!s.token) {
          set({ submit: { levelId, status: 'unranked' } });
          return;
        }
        const item: PendingScore = { ...s, levelId, token: s.token };
        set({ pending: [...get().pending.filter((p) => p.token !== item.token), item] });

        if (!get().name) {
          set({ submit: { levelId, status: 'noname' } });
          return;
        }

        set({ submit: { levelId, status: 'sending' } });
        await get().flush();

        const r = results.get(item.token);
        if (!r) {
          set({ submit: { levelId, status: 'queued' } });
          return;
        }
        if ('rejected' in r) {
          set({ submit: { levelId, status: 'rejected', reason: r.rejected } });
          return;
        }
        try {
          const me = await api.fetchMyLevelRank(levelId);
          set({ submit: { levelId, status: 'done', time: r.time, rank: me?.rank, total: me?.total } });
        } catch {
          set({ submit: { levelId, status: 'done', time: r.time } });
        }
        if (levelId.startsWith('expert-')) void get().refreshMaster();
      },

      flush: () => {
        if (flushing) return flushing;
        const run = (async () => {
          try {
            const { name } = get();
            if (!isOnlineConfigured || !name) return false;
            if (get().syncedName !== name) {
              await api.savePlayerName(name);
              set({ syncedName: name });
            }
            for (const p of [...get().pending]) {
              try {
                results.set(p.token, await api.submitSolution(p));
              } catch (e) {
                const reason = rejection(e);
                if (reason === null) throw e; // lỗi mạng → để lại, gửi sau
                results.set(p.token, { rejected: reason });
                console.warn('[leaderboard] bài nộp bị từ chối:', reason);
              }
              set({ pending: get().pending.filter((x) => x.token !== p.token) });
            }
            return true;
          } catch (e) {
            console.warn('[leaderboard] gửi thất bại', e);
            return false;
          }
        })();
        flushing = run;
        void run.finally(() => {
          if (flushing === run) flushing = null;
        });
        return run;
      },
    }),
    {
      name: 'sudoku-profile',
      storage: appStorage,
      partialize: (s) => ({
        name: s.name,
        syncedName: s.syncedName,
        pending: s.pending,
        masterUnlocked: s.masterUnlocked,
        masterProgress: s.masterProgress,
      }),
      // Bài nộp kiểu cũ (không có vé) không còn hợp lệ → bỏ
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ProfileStore>;
        return {
          ...current,
          name: p.name ?? '',
          syncedName: p.syncedName ?? null,
          masterUnlocked: p.masterUnlocked ?? false,
          masterProgress: p.masterProgress ?? null,
          pending: (p.pending ?? []).filter((x) => typeof x?.token === 'string' && typeof x?.board === 'string'),
        };
      },
    },
  ),
);
