# Hướng Dẫn Cập Nhật Giao Diện Trên GitHub Pages

## 1. Nguyên nhân vì sao đẩy code lên GitHub nhưng giao diện chưa đổi:
1. **GitHub Pages phục vụ file tĩnh đã biên dịch** (nằm ở thư mục `/docs` hoặc `/dist` qua GitHub Actions), chứ **không** chạy trực tiếp mã nguồn `.tsx`.
2. Nếu bạn chỉ cập nhật code trong `src/` mà chưa build đồng bộ vào thư mục `docs/`, GitHub Pages vẫn đang tải file JS cũ.
3. **Bộ nhớ đệm (Browser Cache)**: Trình duyệt thường lưu cache file CSS/JS cũ.

---

## 2. Giải pháp đã được cấu hình sẵn:
- Đã biên dịch bản mới nhất trực tiếp vào thư mục `/docs/`.
- Đã tạo sẵn file cấu hình tự động `.github/workflows/deploy.yml` (nếu dùng GitHub Actions).
- Đã cập nhật lệnh `"build": "vite build && cp -r dist/* docs/ ..."` trong `package.json` để mỗi lần build là tự động đồng bộ sang `docs/`.

---

## 3. Các bước để giao diện cập nhật ngay lập tức:

### Bước 1: Đẩy toàn bộ thay đổi (bao gồm thư mục `docs/` mới) lên GitHub
Mở terminal trên máy tính của bạn và chạy:
```bash
git add .
git commit -m "Cap nhat giao dien moi va dong bo docs"
git push origin main
```
*(Nếu dùng nhánh `master`, thay `main` bằng `master`)*

### Bước 2: Kiểm tra cài đặt GitHub Pages
1. Vào repository GitHub: **https://github.com/renktruong/Quan-ly-nguyen-vat-lieu**
2. Vào **Settings** > chọn mục **Pages** (ở cột bên trái).
3. Tại phần **Build and deployment**:
   - **Nếu dùng thư mục docs**: Chọn **Deploy from a branch**, Branch chọn **`main`** (hoặc `master`) và thư mục chọn **`/docs`** -> Bấm **Save**.
   - **Hoặc dùng GitHub Actions**: Chọn **GitHub Actions** (hệ thống sẽ tự động chạy file `.github/workflows/deploy.yml` đã được tạo).

### Bước 3: Xem kết quả và Xóa Cache trình duyệt
- Đợi khoảng **1 - 2 phút** để GitHub Pages hoàn tất xuất bản.
- Mở link trang web: **https://renktruong.github.io/Quan-ly-nguyen-vat-lieu/**
- Nhấn **Ctrl + F5** (hoặc **Cmd + Shift + R** trên Mac) để xóa cache trình duyệt và tải giao diện mới nhất!
