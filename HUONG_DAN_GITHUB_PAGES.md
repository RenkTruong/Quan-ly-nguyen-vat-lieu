# Hướng dẫn xuất bản lên GitHub Pages cho ứng dụng Quản Lý Nguyên Vật Liệu

## 1. Nguyên nhân vì sao hiện tại trang bị trắng:
Khi kiểm tra trực tiếp đường dẫn `https://renktruong.github.io/Quan-ly-nguyen-vat-lieu/`:
- GitHub Pages hiện đang phục vụ trực tiếp file mã nguồn thô (`/src/main.tsx`).
- Trình duyệt không thể chạy trực tiếp file TypeScript (`.tsx`) mà chưa qua quá trình `npm run build` thành JavaScript thông thường (`.js`).

---

## 2. Cách giải quyết (Chỉ 1 trong 2 cách dưới đây):

### CÁCH 1: Dùng GitHub Actions (Khuyên dùng - tự động 100%)
File tự động build `.github/workflows/deploy.yml` đã được tạo sẵn trong code:
1. Vào repository trên GitHub: **https://github.com/renktruong/Quan-ly-nguyen-vat-lieu**
2. Nhấn vào tab **Settings** (ở thanh trên cùng của repository).
3. Ở menu bên trái, nhấn vào **Pages**.
4. Tại mục **Build and deployment**:
   - Ở ô **Source**: Đổi từ *"Deploy from a branch"* sang **"GitHub Actions"**.
5. Bây giờ, khi bạn đẩy code mới lên (hoặc vào tab **Actions** bấm **Run workflow**), GitHub sẽ tự động cài thư viện, build ra `dist/` và đưa lên trang web.
6. Link chính thức: **https://renktruong.github.io/Quan-ly-nguyen-vat-lieu/**

---

### CÁCH 2: Deploy thủ công từ nhánh `main` hoặc `gh-pages`
Nếu bạn chọn Source là *"Deploy from a branch"*:
1. Mở terminal tại thư mục dự án và chạy:
   ```bash
   npm install
   npm run build
   ```
2. Thư mục `dist/` sẽ được tạo ra chứa file `index.html` và thư mục `assets/` (.js, .css đã được biên dịch).
3. Đưa nội dung bên trong thư mục `dist/` lên nhánh `gh-pages` (hoặc thư mục `/docs` trên nhánh `main`).
