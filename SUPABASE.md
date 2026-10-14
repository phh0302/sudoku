# Kết nối bảng xếp hạng (Supabase)

Bảng xếp hạng lưu trên **Supabase** (gói miễn phí là đủ). Làm 1 lần, khoảng 5 phút.
Chưa làm bước này thì game vẫn chơi bình thường, chỉ tắt bảng xếp hạng.

## 1. Tạo project
1. Vào https://supabase.com → **Start your project** → đăng nhập (GitHub hoặc email).
2. **New project**: đặt tên `sudoku`, đặt mật khẩu database (lưu lại), chọn Region gần nhất (ví dụ **Southeast Asia (Singapore)**) → **Create new project**. Đợi 1–2 phút.

## 2. Tạo bảng dữ liệu
1. Menu trái → **SQL Editor** → **New query**.
2. Mở file `supabase/schema.sql`, copy **toàn bộ** nội dung, dán vào → **Run** (nếu hiện cảnh báo *destructive operation* thì bấm **Run query** – lệnh chỉ xóa policy cũ cùng tên).
3. Mở **New query** khác, dán toàn bộ `supabase/anticheat.sql` → **Run** (file này chứa đề + lời giải 240 màn và các hàm chống gian lận).
4. Thấy `Success. No rows returned` là được.

## 3. Bật đăng nhập ẩn danh
Menu trái → **Authentication** → **Sign In / Providers** (hoặc *Providers*) → bật **Allow anonymous sign-ins** → **Save**.

> Người chơi không cần đăng ký: mỗi máy tự có 1 tài khoản ẩn danh + tên hiển thị.

## 4. Lấy khóa và dán vào app
1. Bấm nút **Connect** (trên cùng) hoặc **Project Settings → API Keys / Data API**.
2. Copy:
   - **Project URL** – dạng `https://abcdxyz.supabase.co`
   - **Publishable key** (`sb_publishable_...`) – hoặc **anon public key** nếu project dùng khóa kiểu cũ.
   ⚠️ Không dùng `service_role` / `secret` key.
3. Trong thư mục `D:\sudoku`, copy file `.env.example` thành `.env` và điền:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://abcdxyz.supabase.co
   EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_xxxxxxxx
   ```
4. Tắt cửa sổ `expo start` và chạy lại `start.bat` (file `.env` chỉ được đọc khi khởi động).

## 5. Kiểm tra
- Mở app → hiện hộp thoại đặt tên → nhập tên.
- Chọn độ khó → giải 1 màn → màn hình kết quả hiện **"Hạng #1 / 1 người chơi"**.
- Trên Supabase: **Table Editor → level_scores** sẽ thấy 1 dòng.

## Cách tính xếp hạng
- **Theo màn:** thời gian giải nhanh nhất (bằng nhau thì ai đạt trước đứng trên). Mỗi người chỉ giữ thành tích tốt nhất.
- **Tổng:** số màn đã giải (nhiều hơn đứng trên), bằng nhau thì tổng thời gian ít hơn đứng trên.
- Chỉ màn chơi (1–60) được tính. Ván ngẫu nhiên và thử thách hằng ngày không tính.
- Mất mạng lúc thắng → kết quả được lưu lại và tự gửi khi có mạng.

## Chống gian lận
- Đề + lời giải nằm trong schema `private`, app không đọc được.
- Bắt đầu màn → app xin "vé" (`start_level`), máy chủ ghi giờ bắt đầu.
- Thắng → app nộp vé + bàn cờ (`submit_solution`). Máy chủ kiểm tra bàn cờ đúng lời giải và **tự tính thời gian** (lúc nộp − lúc cấp vé). Thời gian do app tự khai không được dùng.
- Vé chỉ dùng 1 lần, hết hạn sau 24 giờ; nhanh hơn 0,5 giây/ô trống bị từ chối.
- Vì vậy màn xếp hạng có **đồng hồ không dừng** (tạm dừng chỉ che bàn cờ). Không có mạng lúc bắt đầu màn → ván đó không tính xếp hạng.
- Giới hạn còn lại: không thể ngăn người dùng giải bằng app giải Sudoku khác rồi nhập vào thật nhanh.

## Lưu ý
- Không sửa `assets/levels.json` sau khi đã có người chơi. Nếu buộc phải sửa, chạy lại `anticheat.sql` (sinh lại phần dữ liệu bằng `npx tsx scripts/export-levels-sql.ts`).
- Khóa publishable được phép nằm trong app; dữ liệu được bảo vệ bằng Row Level Security (người chơi chỉ sửa được tên của mình, điểm chỉ ghi qua `submit_solution`).
