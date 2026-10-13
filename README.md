# Sudoku

Game Sudoku cho điện thoại – React Native + Expo + TypeScript.

## Tính năng
- 4 độ khó (Dễ, Trung bình, Khó, Chuyên gia), mỗi đề **chỉ có đúng 1 nghiệm**
  - Dễ / Trung bình: giải được chỉ bằng kỹ thuật cơ bản (không cần đoán)
  - Chuyên gia: bắt buộc cần kỹ thuật nâng cao
- Kho 600 đề sinh sẵn × biến đổi ngẫu nhiên (hoán vị số/hàng/cột, chuyển vị) → gần như vô hạn đề, mở tức thì
- Thử thách hằng ngày (mọi người cùng 1 đề trong ngày)
- Ghi chú (pencil marks), tự xóa ghi chú khi điền số
- Hoàn tác, xóa, gợi ý, giới hạn 3 lỗi
- Tô sáng hàng/cột/khối và số giống nhau, báo lỗi đỏ
- Hiệu ứng khi hoàn thành hàng/cột/khối và khi thắng
- Đồng hồ, tạm dừng (tự dừng khi thoát app)
- Tự lưu ván đang chơi, cài đặt, thống kê (AsyncStorage)
- Thống kê theo độ khó: số ván, tỉ lệ thắng, thời gian nhanh nhất / trung bình, chuỗi thắng
- Dark mode, rung (haptics), âm thanh
- **60 màn cố định cho mỗi độ khó**, giới hạn 3 gợi ý mỗi ván
- **Bảng xếp hạng toàn cầu** (Supabase): theo từng màn + tổng, chống gian lận phía máy chủ
  (máy chủ giữ lời giải, cấp vé khi bắt đầu, tự tính thời gian)
- **Chế độ Bậc thầy**: 60 màn khó hơn Chuyên gia, mở khóa khi lọt top 100 ở 1 màn Chuyên gia

## Bắt đầu

Yêu cầu: **Node.js LTS** và app **Expo Go** trên điện thoại.

```bat
cd D:\sudoku
setup.bat          :: cài thư viện (chỉ chạy 1 lần)
npm test           :: chạy unit test logic
npx expo start     :: quét QR bằng Expo Go
```

> `setup.bat` cài Expo SDK **mới nhất** để khớp với app Expo Go trên store.

Bảng xếp hạng: tạo project Supabase và điền `.env` theo **[SUPABASE.md](SUPABASE.md)**
(chạy lần lượt `supabase/schema.sql` → `anticheat.sql` → `master.sql`). Không có `.env` thì game vẫn chơi offline.

### Lệnh hữu ích
| Lệnh | Mô tả |
|---|---|
| `npm start` | Chạy dev server |
| `npm test` | Unit test (Jest) |
| `npm run typecheck` | Kiểm tra kiểu TypeScript |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run gen:puzzles` | Sinh lại kho đề `assets/puzzles.json` |

## Cấu trúc

```
App.tsx                 # điều hướng màn hình, chờ nạp dữ liệu đã lưu
src/
  core/                 # logic Sudoku thuần TS (có test)
    grid.ts             #   tiện ích hàng/cột/khối, PEERS
    validator.ts        #   kiểm tra hợp lệ
    solver.ts           #   backtracking + bitmask + MRV, đếm nghiệm
    logical.ts          #   giải bằng naked/hidden single (chấm độ khó)
    generator.ts        #   sinh lưới, đục lỗ giữ nghiệm duy nhất
    transform.ts        #   biến đổi đề giữ độ khó
    puzzles.ts          #   lấy đề từ kho + daily challenge
  store/
    gameLogic.ts        #   reducer thuần cho ván chơi (có test)
    stats.ts            #   tính thống kê (có test)
    gameStore.ts        #   Zustand + persist
    settingsStore.ts
    statsStore.ts
  components/           # Board, Cell, NumberPad, Toolbar, ResultModal, Button
  screens/              # Home, Game, Settings, Stats
  utils/                # format thời gian, haptics, storage
  theme.ts              # bảng màu sáng/tối
scripts/generate-puzzles.ts
```

## Phát hành (Giai đoạn 6)

1. Cài EAS CLI và đăng nhập (cần tài khoản miễn phí tại expo.dev):
   ```bat
   npm i -g eas-cli
   eas login
   eas init
   ```
2. Kiểm tra `app.json`: `android.package` / `ios.bundleIdentifier` đang là `com.phh0302.sudoku` – đổi nếu muốn (**không đổi được sau khi đã lên store**).
3. Build APK để cài thử lên máy:
   ```bat
   eas build -p android --profile preview
   ```
4. Tạo tài khoản Google Play Console (25 USD, một lần), tạo app, điền thông tin, chính sách quyền riêng tư (mẫu: `PRIVACY.md`), ảnh chụp màn hình.
5. Build bản phát hành (AAB) và gửi lên:
   ```bat
   eas build -p android --profile production
   eas submit -p android
   ```
   Tài khoản cá nhân mới cần chạy **Closed testing** (theo yêu cầu hiện hành của Google) trước khi phát hành Production.
6. iOS (tùy chọn): cần Apple Developer (99 USD/năm), rồi `eas build -p ios` và `eas submit -p ios`.
7. Cập nhật nhanh phần JS sau khi phát hành: `eas update`.
