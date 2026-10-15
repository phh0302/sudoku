import { finishMockAd, requestMockAd, useMockAdStore } from '../mockAd';

describe('quảng cáo giả lập', () => {
  it('xem đủ → true, đóng sớm → false, đóng màn hình sau mỗi lần', async () => {
    const p1 = requestMockAd();
    expect(useMockAdStore.getState().visible).toBe(true);
    finishMockAd(true);
    await expect(p1).resolves.toBe(true);
    expect(useMockAdStore.getState().visible).toBe(false);

    const p2 = requestMockAd();
    finishMockAd(false);
    await expect(p2).resolves.toBe(false);
  });
  it('không mở chồng 2 quảng cáo', async () => {
    const p1 = requestMockAd();
    await expect(requestMockAd()).resolves.toBe(false);
    finishMockAd(true);
    await expect(p1).resolves.toBe(true);
  });
});
