import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { appStorage } from '../utils/storage';
import { DEFAULT_SETTINGS, type Settings } from './settings';

interface SettingsStore {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      update: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      reset: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'sudoku-settings',
      storage: appStorage,
      // Gộp với mặc định để các tùy chọn mới thêm sau này có giá trị
      merge: (persisted, current) => ({
        ...current,
        settings: { ...DEFAULT_SETTINGS, ...((persisted as Partial<SettingsStore>)?.settings ?? {}) },
      }),
    },
  ),
);
