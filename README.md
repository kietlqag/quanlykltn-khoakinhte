# Hệ thống Quản lý Đăng ký BCTT/KLTN - Khoa Kinh tế

Ứng dụng web hỗ trợ quản lý toàn bộ quy trình đăng ký, xét duyệt, chấm điểm và thống kê đề tài **BCTT/KLTN** cho 3 nhóm người dùng:

- `SV` (Sinh viên)
- `GV` (Giảng viên)
- `TBM` (Trưởng bộ môn)

Dự án dùng **React + Vite + Firebase (Firestore/Storage)**, có script nhập dữ liệu từ `Data.xlsx` vào Firestore để khởi tạo nhanh môi trường.

## 1. Tính năng chính

### Sinh viên (`SV`)
- Đăng nhập theo tài khoản trong collection `users`
- Đăng ký đề tài BCTT/KLTN
- Theo dõi trạng thái xét duyệt
- Nộp file báo cáo/đính kèm minh chứng
- Xem tiến độ, kết quả và thông tin phản hồi

### Giảng viên (`GV`)
- Quản lý danh sách sinh viên hướng dẫn
- Duyệt/từ chối đề tài
- Chấm điểm, nhận xét phản biện
- Tham gia hội đồng (chủ tịch/thư ký/thành viên)
- Gửi/nhận đề tài gợi ý

### Trưởng bộ môn (`TBM`)
- Duyệt quota hướng dẫn giảng viên
- Phân công giảng viên phản biện
- Phân công hội đồng
- Tạo đợt đăng ký (đợt BCTT/KLTN)
- Xem trang thống kê tổng hợp

## 2. Công nghệ sử dụng

- **Frontend:** React 18, React Router, Vite 6, Tailwind CSS 4
- **Backend as a Service:** Firebase Firestore + Firebase Storage
- **Data tools:** Node.js scripts + `xlsx` để import/migrate dữ liệu
- **Triển khai:** Vercel (SPA rewrite đã cấu hình trong `vercel.json`)

## 3. Yêu cầu môi trường

- Node.js `>= 20` (khuyến nghị dùng Node LTS mới)
- npm `>= 10`
- Firebase project đã bật:
  - Firestore Database (Native mode)
  - Storage

## 4. Cài đặt và chạy local

### Bước 1: Cài dependencies

```bash
npm install
```

### Bước 2: Tạo file `.env`

Tạo `.env` ở thư mục gốc và cấu hình:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=...
```

Lưu ý:
- Biến môi trường phía client với Vite bắt buộc bắt đầu bằng `VITE_`.
- Tuyệt đối không commit key thực tế lên repo public.

### Bước 3: Chạy ứng dụng

```bash
npm run dev
```

Mặc định Vite chạy tại `http://localhost:5173`.

### Bước 4: Build production

```bash
npm run build
```

## 5. Cấu trúc thư mục chính

```text
src/
  app/
    components/      # UI components
    contexts/        # AuthContext, DataContext
    pages/           # Trang theo vai trò SV/GV/TBM
    routes.tsx       # Phân quyền route
  lib/firebase.ts    # Khởi tạo Firebase app/db/storage
scripts/             # Script import/migrate/reset dữ liệu
docs/                # Tài liệu nghiệp vụ + biểu mẫu
```

## 6. Khởi tạo dữ liệu từ Excel vào Firestore

### 6.1 Chuẩn bị service account key

- Tạo service account key JSON từ Firebase Console
- Đặt file tại:

```text
secrets/serviceAccountKey.json
```

Hoặc dùng biến môi trường:

```bash
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

### 6.2 Các lệnh import

Liệt kê sheet trong file Excel:

```bash
npm run import:sheet -- --xlsx "Data.xlsx" --list-sheets --dry-run
```

Import toàn bộ sheet:

```bash
npm run import:sheet -- --xlsx "Data.xlsx"
```

Import một số sheet:

```bash
npm run import:sheet -- --xlsx "Data.xlsx" --sheet-name "DATA,QUOTA,DOT,TENDETAI,TRANGTHAIDETAI"
```

Import với tiền tố collection (phục vụ môi trường staging/prod):

```bash
npm run import:sheet -- --xlsx "Data.xlsx" --collection-prefix "stg_"
```

### 6.3 Đồng bộ users

Script import sẽ tự đồng bộ từ sheet `DATA` sang collection `users` để phục vụ đăng nhập.

## 7. Các lệnh script hữu ích

```bash
npm run build:clean-data      # Tạo Data.clean.xlsx (lọc/rà dữ liệu)
npm run build:test-data       # Tạo Data.test.xlsx cho dữ liệu test
npm run reset:data            # Xóa dữ liệu Firestore (giữ lại collection users)
npm run migrate:users-ms      # Migrate user ID theo trường ms
npm run migrate:mirror-ids    # Đồng bộ các field liên quan ID/user mapping
```

## 8. Firestore/Storage rules

- Firestore rules: `firestore.rules`
- Storage rules: `storage.rules`

Đẩy rules/indexes lên Firebase:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## 9. Deploy Vercel

1. Import repo vào Vercel.
2. Thêm đầy đủ biến môi trường `VITE_*` trong **Project Settings > Environment Variables**.
3. Redeploy sau khi cập nhật env.

`vercel.json` đã có SPA rewrite cho React Router.

## 10. Tài liệu nghiệp vụ tham khảo

- Chi tiết luồng nghiệp vụ + mapping collection: `docs/FIREBASE_BUSINESS_WORKFLOW.md`
- Mẫu biên bản hội đồng: `docs/sample-bien-ban-hoi-dong.pdf`

## 11. Ghi chú bảo mật

Hiện tại project đang dùng luồng đăng nhập đọc trực tiếp từ collection `users` (có trường password). Khi triển khai thực tế, nên:

- Chuyển sang Firebase Authentication
- Không lưu mật khẩu plaintext trong Firestore
- Tăng cường rule theo role/owner chi tiết hơn

---

Nếu cần, có thể mở rộng README này thêm phần:
- tài khoản demo theo vai trò,
- checklist kiểm thử,
- quy trình release cho nhóm đồ án.
