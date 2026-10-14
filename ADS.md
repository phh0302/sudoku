# Quảng cáo có thưởng (xem QC để nhận thêm gợi ý)

## Luật chơi
- Mỗi ván có **3 gợi ý** miễn phí.
- Hết gợi ý ở **ván ngẫu nhiên / thử thách hôm nay** → nút **"Xem QC +1"** thay cho nút Gợi ý.
  Xem hết quảng cáo = +1 gợi ý, tối đa **+3** mỗi ván.
- **Màn xếp hạng (60 màn)**: không có quảng cáo, giữ đúng 3 gợi ý để bảng xếp hạng công bằng.
- Đồng hồ tạm dừng trong lúc xem quảng cáo (ván không xếp hạng).

## Hiện tại: QUẢNG CÁO THỬ
Đang dùng mã thử của Google (`TestIds.REWARDED`, App ID thử trong `app.json`).
Quảng cáo thử có chữ "Test Ad", bấm vào thoải mái, không bị khóa tài khoản.

## Chạy thử trên điện thoại
Expo Go **không** chạy được quảng cáo (nút sẽ tự ẩn). Cần bản *development build*:

1. Nhấp đúp `_install_ads.bat` (cài `react-native-google-mobile-ads`, `expo-dev-client`, rồi tự kiểm tra – chỉ cần chạy 1 lần).
2. `npm i -g eas-cli` rồi `eas login`.
3. `eas build --profile development -p android` → tải file .apk về máy Android và cài.
4. Nhấp đúp **`start-dev.bat`** (chạy `npx expo start --dev-client`), mở app *Sudoku* vừa cài rồi quét QR.

`start.bat` vẫn dùng cho **Expo Go** như cũ (đã thêm `--go`, vì cài `expo-dev-client` xong thì `expo start` mặc định chuyển sang chế độ development build).

Web (GitHub Pages) không có quảng cáo – nút bị ẩn.

## Khi phát hành thật
1. Tạo tài khoản https://admob.google.com → thêm ứng dụng Android + iOS.
2. Thay `androidAppId` / `iosAppId` trong `app.json` bằng App ID thật (`ca-app-pub-xxx~yyy`).
3. Tạo đơn vị quảng cáo **Rewarded**, ghi mã vào `.env`:
   ```
   EXPO_PUBLIC_ADMOB_REWARDED_ANDROID=ca-app-pub-xxx/yyy
   EXPO_PUBLIC_ADMOB_REWARDED_IOS=ca-app-pub-xxx/zzz
   ```
   (bản dev `__DEV__` vẫn luôn dùng quảng cáo thử – **không bao giờ** bấm quảng cáo thật của chính mình).
4. Cập nhật PRIVACY.md + khai báo "Có quảng cáo" / Data safety trên Google Play và App Store.
5. Hiện chỉ xin quảng cáo không cá nhân hóa. Muốn cá nhân hóa (doanh thu cao hơn) cần thêm hộp đồng ý GDPR (UMP) và ATT trên iOS.
