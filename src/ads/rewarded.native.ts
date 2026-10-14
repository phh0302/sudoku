/**
 * Quảng cáo có thưởng (Google AdMob) – bản cho Android / iOS.
 *
 * - Đang phát triển (__DEV__) hoặc chưa khai báo mã thật → luôn dùng QUẢNG CÁO THỬ của Google (TestIds).
 * - Mã thật đặt trong .env: EXPO_PUBLIC_ADMOB_REWARDED_ANDROID / EXPO_PUBLIC_ADMOB_REWARDED_IOS (xem ADS.md).
 * - Expo Go không có module AdMob → tự tắt (nút xem quảng cáo bị ẩn), không làm crash app.
 * - Chỉ xin quảng cáo KHÔNG cá nhân hóa → chưa cần hộp xin phép theo dõi (ATT) / GDPR.
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import type * as AdsLib from 'react-native-google-mobile-ads';

type Ads = typeof AdsLib;

const IN_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const LOAD_TIMEOUT_MS = 15000;

let lib: Ads | null | undefined;

/** Nạp thư viện AdMob khi cần (không nạp trong Expo Go). */
function ads(): Ads | null {
  if (lib !== undefined) return lib;
  if (IN_EXPO_GO) return (lib = null);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    lib = require('react-native-google-mobile-ads') as Ads;
  } catch {
    lib = null;
  }
  return lib;
}

function rewardedUnitId(m: Ads): string {
  const real =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS
      : process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID;
  return __DEV__ || !real ? m.TestIds.REWARDED : real;
}

let initPromise: Promise<unknown> | null = null;

/** Khởi tạo AdMob (gọi 1 lần lúc mở app; gọi nhiều lần cũng không sao). */
export function initAds(): void {
  const m = ads();
  if (!m || initPromise) return;
  initPromise = m.default().initialize().catch(() => {});
}

/** Thiết bị này có xem được quảng cáo có thưởng không. */
export const isRewardedSupported = (): boolean => ads() !== null;

/**
 * Tải và hiện 1 quảng cáo có thưởng.
 * Trả về true nếu người chơi xem đủ để nhận thưởng, false nếu đóng sớm / lỗi / không có quảng cáo.
 */
export function showRewardedAd(): Promise<boolean> {
  const m = ads();
  if (!m) return Promise.resolve(false);
  initAds();

  return new Promise<boolean>((resolve) => {
    const ad = m.RewardedAd.createForAdRequest(rewardedUnitId(m), {
      requestNonPersonalizedAdsOnly: true,
    });
    let earned = false;
    let finished = false;
    const unsubs: (() => void)[] = [];
    const finish = (result: boolean) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      unsubs.forEach((u) => u());
      resolve(result);
    };
    // Không tải được quảng cáo trong 15 giây → bỏ qua
    const timer = setTimeout(() => finish(false), LOAD_TIMEOUT_MS);

    unsubs.push(
      ad.addAdEventListener(m.RewardedAdEventType.LOADED, () => {
        clearTimeout(timer);
        ad.show().catch(() => finish(false));
      }),
      ad.addAdEventListener(m.RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      }),
      ad.addAdEventListener(m.AdEventType.CLOSED, () => finish(earned)),
      ad.addAdEventListener(m.AdEventType.ERROR, () => finish(false)),
    );
    ad.load();
  });
}
