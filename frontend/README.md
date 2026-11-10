# Frontend - Dolphin

Ứng dụng React+Vite cho nền tảng hỗ trợ học tập với AI.

## 🚀 Cách chạy Frontend Local

### Yêu cầu

- Node.js 16+ (khuyến nghị 18+)
- npm 8+ hoặc yarn

### Bước 1: Cài đặt dependencies

```bash
cd frontend
npm install
```

### Bước 2: Chạy development server

```bash
npm run dev
```

- Mở browser vào: http://localhost:5173
- App sẽ auto-reload khi bạn edit file

### Bước 3: Build production

```bash
npm run build
```

- Tạo thư mục `dist/` với code tối ưu hóa
- Sẵn sàng để deploy

### Bước 4: Serve static build (local testing)

```bash
npx http-server dist -p 5173 -c-1
```

- Chạy server tĩnh tại port 5173
- Mở: http://localhost:5173

## 🏗️ Cấu trúc thư mục

```
frontend/
├── src/
│   ├── features/                 # Các tính năng chính
│   │   ├── auth/                # Đăng nhập/đăng ký
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   ├── chat/                # Chat với AI
│   │   ├── documents/           # Quản lý tài liệu
│   │   ├── interactions/        # Lịch sử tương tác
│   │   └── notes/               # Ghi chú
│   ├── pages/                   # Các trang chính
│   │   ├── AuthPage.jsx
│   │   ├── HomePage.jsx
│   │   └── InteractionPage.jsx
│   ├── App.jsx                  # Component chính
│   ├── main.jsx                 # Entry point
│   ├── index.css               # Global styles
│   └── assets/                 # Hình ảnh, icon
├── package.json
├── vite.config.js
└── README.md
```

## 🔗 Kết nối Backend

Frontend đọc URL của backend từ biến môi trường `VITE_API_URL` (xem `src/api/axiosClient.js`).

1. Sao chép file mẫu: `cp .env.example .env`
2. Đặt giá trị trong `.env`:
   ```
   VITE_API_URL=http://localhost:8000/api
   ```
3. Khi deploy (ví dụ Vercel), đặt cùng biến này trong phần Environment Variables
   với URL backend của bạn, kết thúc bằng `/api`.
4. Client API cho quiz được sinh bằng orval từ backend đang chạy:
   ```
   npm run generate:api
   ```
   (đọc `ORVAL_INPUT`, mặc định `http://localhost:8000/openapi.json`)

## 📦 Linting & Formatting

```bash
# Kiểm tra linting
npm run lint

# Fix linting issues
npm run lint -- --fix
```

## 🐳 Chạy với Docker

```bash
# Build frontend trong Docker (nếu có Dockerfile riêng)
docker build -t dolphin-frontend .

# Chạy container
docker run -p 5173:80 dolphin-frontend
```

## ⚠️ Vấn đề thường gặp

### 1. Màn hình trắng khi mở

- Kiểm tra Browser Console (F12) để xem lỗi
- Đảm bảo backend API đang chạy
- Clear cache: Ctrl+Shift+Delete rồi refresh

### 2. Port 5173 đang được dùng

```bash
# Chạy ở port khác
npm run dev -- --port 5174
```

### 3. Dependencies lỗi

```bash
# Xóa node_modules và cài lại
rm -r node_modules
npm install
```

## 🧪 Testing & Development

### Một lệnh để chạy toàn bộ quy trình

```bash
npm install && npm run build && npx http-server dist -p 5173 -c-1
```

## 📝 Commit & GitHub

Khi commit lên GitHub:

1. Tạo branch riêng từ `frontend-main`
2. Commit từng cụm nhỏ theo tính năng
3. Mở Pull Request để team review
4. Merge sau khi được approve

Ví dụ:

```bash
git checkout ui-a-integration
# Sửa code...
git add .
git commit -m "feat(FE): update login form UI"
git push origin ui-a-integration
# Mở PR trên GitHub
```

## 🎨 Stack công nghệ

- **React 18+** - UI library
- **Vite** - Build tool & dev server
- **React Router** - Client-side routing (HashRouter)
- **CSS** - Styling (vanilla CSS)

## 📞 Liên hệ

Nếu gặp vấn đề, hãy:

1. Kiểm tra terminal log chi tiết
2. Xem Browser Console (F12)
3. Hỏi trên Slack hoặc tạo Issue trên GitHub

---

**Last updated:** April 13, 2026
**Branch:** ui-a-integration
