/**
 * Quảng cáo GIẢ LẬP – chỉ dùng trong Expo Go (nơi không có thư viện AdMob).
 * Giúp thử toàn bộ luồng "xem QC → +1 gợi ý" mà không cần build app.
 */
import { create } from 'zustand';

/** Thời gian phải "xem" để nhận thưởng (giây) */
export const MOCK_AD_SECONDS = 5;

interface MockAdState {
  visible: boolean;
  resolve: ((earned: boolean) => void) | null;
}

export const useMockAdStore = create<MockAdState>(() => ({ visible: false, resolve: null }));

/** Mở màn hình quảng cáo giả lập; trả về true nếu xem đủ thời gian. */
export function requestMockAd(): Promise<boolean> {
  const cur = useMockAdStore.getState();
  if (cur.visible) return Promise.resolve(false);
  return new Promise<boolean>((resolve) => {
    useMockAdStore.setState({ visible: true, resolve });
  });
}

/** Đóng quảng cáo giả lập và báo kết quả. */
export function finishMockAd(earned: boolean): void {
  const { resolve } = useMockAdStore.getState();
  useMockAdStore.setState({ visible: false, resolve: null });
  resolve?.(earned);
}
