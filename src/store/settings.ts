export type ThemeMode = 'system' | 'light' | 'dark';

export interface Settings {
  theme: ThemeMode;
  /** Tô sáng hàng / cột / khối của ô đang chọn */
  highlightRelated: boolean;
  /** Tô sáng các ô cùng số */
  highlightSame: boolean;
  /** So với lời giải và báo số sai ngay */
  autoCheck: boolean;
  /** Thua khi sai 3 lần (chỉ khi bật autoCheck) */
  mistakeLimit: boolean;
  /** Rung khi nhập số / thắng / sai */
  haptics: boolean;
  /** Hiệu ứng âm thanh */
  sound: boolean;
  showTimer: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  highlightRelated: true,
  highlightSame: true,
  autoCheck: true,
  mistakeLimit: true,
  haptics: true,
  sound: true,
  showTimer: true,
};

export const MAX_MISTAKES = 3;

/** Số gợi ý tối đa mỗi ván */
export const MAX_HINTS = 3;
