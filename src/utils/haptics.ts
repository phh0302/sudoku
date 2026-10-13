import * as Haptics from 'expo-haptics';

import { useSettingsStore } from '../store/settingsStore';
import { playSound, type SoundKind } from './sound';

export type FeedbackKind = SoundKind;

/** Rung + âm thanh theo loại sự kiện (tôn trọng cài đặt người dùng; lỗi được bỏ qua). */
export function feedback(kind: FeedbackKind): void {
  const { haptics, sound } = useSettingsStore.getState().settings;
  if (sound) playSound(kind);
  if (!haptics) return;

  let p: Promise<void>;
  switch (kind) {
    case 'tap':
      p = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'success':
      p = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'error':
    case 'lose':
      p = Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
    case 'win':
      p = Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
  }
  p.catch(() => {});
}
