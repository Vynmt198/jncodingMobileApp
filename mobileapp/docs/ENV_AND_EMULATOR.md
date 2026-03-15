# Cấu hình .env và chạy trên Emulator

## Đăng ký / Đăng nhập thất bại

- **Kiểm tra backend:** Đảm bảo server backend (be_webhoclaptrinh) đang chạy và lắng nghe đúng cổng (ví dụ 3000).
- **Trên Android Emulator:** `localhost` trong app là máy ảo, không trỏ tới máy bạn. Trong file `.env` đặt:
  ```env
  API_BASE_URL=http://10.0.2.2:3000/api
  ```
  (`10.0.2.2` là địa chỉ của host từ trong Android emulator.)
- **Trên thiết bị thật / cùng mạng:** Dùng IP máy tính (ví dụ `192.168.1.x:3000/api`) trong `API_BASE_URL`.
- App gửi đăng ký với `fullName`, `name` (cùng giá trị), `email`, `password`. Nếu backend trả lỗi (email trùng, validation...), nội dung lỗi sẽ hiển thị trên màn hình đăng ký.
