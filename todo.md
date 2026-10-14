# Sudoku Mobile – Workflow & TODO

> Stack: **React Native + Expo + TypeScript**, state: **Zustand**, lưu trữ: **AsyncStorage**, build: **EAS Build**.
> Đánh dấu `[x]` khi hoàn thành từng mục.
>
> **Trạng thái:** Claude đã viết xong mã nguồn GĐ0–5 (31 unit test pass). Các mục `[ ]` còn lại cần bạn làm trên máy/tài khoản của mình.
> Đã kiểm tra trên máy: test 31/31 pass, tsc + ESLint sạch, build bundle Android OK.
> Bước tiếp theo: nhấp đúp `start.bat` → quét QR bằng Expo Go.

---

## Giai đoạn 0 – Chuẩn bị môi trường
- [ ] Cài Node.js LTS, Git, VS Code
- [ ] Cài app **Expo Go** trên điện thoại (Android/iOS)
- [x] Tạo project: `npx create-expo-app sudoku --template` (chọn template TypeScript)
- [x] Chạy `setup.bat` để cài thư viện (Expo SDK 57, RN 0.86)
- [ ] Chạy thử: nhấp đúp `start.bat`, quét QR bằng Expo Go
- [ ] Khởi tạo Git repo, push lên GitHub
- [x] Cài ESLint + Prettier
- [x] Cài Jest (`jest-expo`) để viết unit test
- [x] Tạo cấu trúc thư mục:
  ```
  src/
    core/        # generator, solver, validator (TS thuần)
    store/       # Zustand store
    components/  # Board, Cell, NumberPad, Toolbar
    screens/     # Home, Game, Settings, Stats
    utils/       # storage, format time, ...
  ```

## Giai đoạn 1 – Logic lõi (src/core)
- [x] Định nghĩa kiểu dữ liệu: `Grid = number[]` (81 ô, 0 = trống), `Difficulty`
- [x] Hàm tiện ích: `row(i)`, `col(i)`, `box(i)`, `peers(i)`
- [x] `isValidMove(grid, index, value)` – kiểm tra hàng/cột/khối
- [x] `solve(grid)` – backtracking (tối ưu bằng bitmask + chọn ô ít ứng viên nhất)
- [x] `countSolutions(grid, limit = 2)` – dừng sớm khi > 1 nghiệm
- [x] `generateFullGrid()` – sinh lưới đầy đủ ngẫu nhiên
- [x] `generatePuzzle(difficulty)` – xóa ô, đảm bảo **duy nhất 1 nghiệm**
  - [x] Dễ ~40 gợi ý, Trung bình ~32, Khó ~27, Chuyên gia ~23
- [x] Unit test cho validator, solver, generator (kiểm tra nghiệm duy nhất)
- [x] Đo thời gian sinh đề trên điện thoại; nếu chậm:
  - [x] Viết script sinh sẵn đề → `assets/puzzles.json`
  - [x] Hàm `transformPuzzle()` – hoán vị số, hàng/cột trong band, band/stack để tạo biến thể

## Giai đoạn 2 – State game (src/store)
- [x] Store Zustand gồm: `puzzle`, `solution`, `board`, `notes`, `selected`, `mistakes`, `history`, `elapsed`, `status`
- [x] Action: `newGame(difficulty)`, `selectCell`, `inputNumber`, `erase`
- [x] Action: `toggleNoteMode`, `toggleNote`
- [x] Action: `undo` (stack lịch sử)
- [x] Action: `hint` (điền 1 ô đúng)
- [x] Tự xóa ghi chú liên quan khi điền số
- [x] Kiểm tra thắng / thua (3 lỗi)
- [x] Unit test cho store

## Giai đoạn 3 – Giao diện chơi được (MVP)
- [x] Component `Board` 9×9, viền đậm phân khối 3×3
- [x] Component `Cell`: số đề (cố định), số người chơi, ghi chú 3×3 nhỏ
- [x] Highlight: ô đang chọn, hàng/cột/khối, các số giống nhau, ô sai (màu đỏ)
- [x] Component `NumberPad` 1–9 (ẩn số đã điền đủ 9 lần)
- [x] `Toolbar`: Undo, Xóa, Ghi chú, Gợi ý
- [x] Header: độ khó, số lỗi (x/3), đồng hồ
- [x] Màn hình `Home`: Tiếp tục, Game mới (chọn độ khó)
- [x] Màn hình kết quả: thắng / thua, thời gian, chơi lại
- [x] Responsive theo kích thước màn hình (dùng `useWindowDimensions`)

## Giai đoạn 4 – Lưu trữ & trải nghiệm
- [x] Lưu game đang chơi vào AsyncStorage (tự lưu sau mỗi nước đi)
- [x] Khôi phục game khi mở lại app
- [x] Tạm dừng đồng hồ khi app vào nền (`AppState`)
- [x] Màn hình `Settings`: bật/tắt highlight, tự kiểm tra lỗi, rung, giao diện sáng/tối
- [x] Âm thanh (expo-audio, bật/tắt trong Cài đặt)
- [x] Rung nhẹ bằng `expo-haptics`
- [x] Dark mode
- [x] Màn hình `Stats`: số ván, tỉ lệ thắng, thời gian tốt nhất theo độ khó

## Giai đoạn 5 – Hoàn thiện
- [x] Animation khi hoàn thành hàng/cột/khối và khi thắng (`react-native-reanimated`)
- [x] Daily challenge (seed theo ngày)
- [x] Icon app + splash screen
- [ ] Đa ngôn ngữ Việt / Anh (tùy chọn)
- [ ] Test trên nhiều thiết bị (màn nhỏ, tablet, Android cũ)
- [x] Sửa bug, tối ưu hiệu năng (`React.memo` cho Cell)

## Giai đoạn 6 – Build & phát hành
- [ ] Cài EAS CLI: `npm i -g eas-cli`, `eas login`
- [x] Cấu hình `app.json`: tên, `android.package`, `ios.bundleIdentifier`, version
- [x] `eas.json` (profile preview → APK, production → AAB) – thay cho `eas build:configure`
- [ ] Build APK test: `eas build -p android --profile preview`
- [ ] Cài APK lên máy thật, test lần cuối
- [x] Viết Chính sách quyền riêng tư (privacy policy)
- [ ] Chuẩn bị ảnh chụp màn hình, mô tả store
- [ ] Tạo tài khoản Google Play Console (~25 USD, 1 lần)
- [ ] Build AAB: `eas build -p android --profile production`
- [ ] Upload lên Play Console, chạy Closed testing theo yêu cầu, rồi phát hành
- [ ] (Tùy chọn) iOS: Apple Developer (~99 USD/năm) → `eas build -p ios` → `eas submit`

## Giai đoạn 7 – Màn chơi & bảng xếp hạng
- [x] 60 màn cố định mỗi độ khó (`assets/levels.json`), màn hình chọn màn
- [x] Giới hạn 3 gợi ý mỗi ván
- [x] Supabase: project `sudoku`, schema + RLS, đăng nhập ẩn danh, khóa trong `.env`
- [x] Bảng xếp hạng theo màn + tổng, hạng hiện ở màn hình kết quả, gửi lại khi mất mạng
- [x] Chế độ Bậc thầy (60 màn khó hơn Chuyên gia), mở khóa khi lọt top 100 ở 1 màn Chuyên gia (`supabase/master.sql`)
- [ ] Chơi thử trên điện thoại: đặt tên → giải 1 màn → xem bảng xếp hạng
- [x] Chống gian lận: máy chủ giữ lời giải, cấp vé khi bắt đầu, kiểm tra bàn cờ + tự tính giờ (`supabase/anticheat.sql`)

## Giai đoạn 8 – Quảng cáo có thưởng (AdMob)
- [x] Xem QC → +1 gợi ý (tối đa +3/ván), chỉ ván ngẫu nhiên + thử thách ngày; màn xếp hạng giữ 3 gợi ý
- [x] Đang dùng quảng cáo THỬ của Google; tự ẩn trên web và Expo Go (xem `ADS.md`)
- [ ] Build development build: `eas build --profile development -p android`, cài lên máy, chạy `start-dev.bat`
- [ ] Tạo tài khoản AdMob, thay App ID + mã Rewarded thật khi phát hành
- [ ] Cập nhật PRIVACY.md (có quảng cáo), khai báo trên store

## Sau phát hành
- [ ] Thu thập phản hồi người dùng
- [ ] Cập nhật OTA bằng `eas update` cho thay đổi JS
- [ ] Cân nhắc: quảng cáo / bản Pro, bảng xếp hạng, đồng bộ đám mây

---

### Ghi chú
- Viết và test xong **Giai đoạn 1** trước khi làm UI – logic đúng thì UI rất nhẹ.
- Commit nhỏ, thường xuyên; mỗi giai đoạn nên có 1 tag/branch.
