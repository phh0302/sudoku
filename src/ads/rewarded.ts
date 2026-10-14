/**
 * Bản web: AdMob không chạy trên trình duyệt → tắt quảng cáo có thưởng.
 * (Android / iOS dùng file rewarded.native.ts)
 */
export function initAds(): void {}

export const isRewardedSupported = (): boolean => false;

export function showRewardedAd(): Promise<boolean> {
  return Promise.resolve(false);
}
