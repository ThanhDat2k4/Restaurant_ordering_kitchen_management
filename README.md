# Hệ Thống Quản Lý Đặt Món Và Vận Hành Bếp Nhà Hàng

Restaurant Ordering and Kitchen Management System — bộ khung SCRUM-69 cho nhóm 5 thành viên.

## Công nghệ và phạm vi

- Frontend: React + Vite + JavaScript.
- Backend: Node.js + Express, giao tiếp qua REST API.
- SCRUM-69 gồm bộ khung, API health và trang kiểm tra kết nối local.
- PostgreSQL + Prisma triển khai ở SCRUM-70. Các chức năng nhà hàng triển khai ở các task sau.

## Yêu cầu

- Node.js 24 LTS, npm đi kèm Node.js, Git.
- VS Code hoặc trình soạn thảo tương đương.
- Trình duyệt hiện đại, chẳng hạn Chrome hoặc Edge.

Kiểm tra bằng PowerShell:

```powershell
node -v
npm -v
git --version
```

File `.nvmrc` ghi phiên bản major Node.js của dự án; trên Windows có thể dùng `nvm install 24` và `nvm use 24` nếu đã cài nvm-windows.

## Cài đặt lần đầu

```powershell
git clone https://github.com/ThanhDat2k4/Restaurant_ordering_kitchen_management.git
cd Restaurant_ordering_kitchen_management
```

Trước khi SCRUM-69 được merge, chuyển sang nhánh chứa bộ khung:

```powershell
git switch feature/SCRUM-69-project-setup
```

Sau khi merge, dùng nhánh `main` để bắt đầu task mới.

Cài đúng các phiên bản trong lockfile, chạy từ thư mục gốc repository:

```powershell
cd backend
npm ci
Copy-Item .env.example .env
cd ../frontend
npm ci
Copy-Item .env.example .env
cd ..
```

Chỉ sao chép `.env.example` khi chưa có `.env`, tránh ghi đè cấu hình riêng. Với cấu hình mặc định, ứng dụng cũng chạy được khi chưa tạo `.env`.

## Chạy local bằng hai terminal

Terminal 1 — Backend, từ thư mục gốc repository:

```powershell
cd backend
npm run dev
```

Backend: http://localhost:5000. API health: http://localhost:5000/api/health.
Lệnh `npm start` chạy Backend bằng Node.js mà không tự khởi động lại khi sửa file.

Terminal 2 — Frontend, từ thư mục gốc repository:

```powershell
cd frontend
npm run dev
```

Mở http://localhost:5173. Khi kết nối thành công, trang hiển thị **Restaurant API is running** màu xanh. Dừng mỗi tiến trình bằng `Ctrl+C` tại terminal tương ứng.

Đây là môi trường local. Chưa có deployment hoặc chức năng xác thực.

## Cấu hình môi trường

| File | Biến | Mặc định | Ý nghĩa |
| --- | --- | --- | --- |
| `backend/.env` | `PORT` | `5000` | Cổng HTTP Backend |
| `backend/.env` | `NODE_ENV` | `development` trong file mẫu | Tên môi trường |
| `backend/.env` | `FRONTEND_ORIGIN` | `http://localhost:5173` | Origin được cho phép qua CORS |
| `frontend/.env` | `VITE_API_BASE_URL` | `http://localhost:5000` | Địa chỉ gốc Backend, không thêm `/api` |

Khi đổi cổng Backend, cập nhật cả `PORT` và `VITE_API_BASE_URL`. Khi đổi địa chỉ hoặc cổng Frontend, cập nhật `FRONTEND_ORIGIN` tương ứng. Vite cố định cổng 5173 với `strictPort` để tránh tự đổi cổng làm lệch CORS. Nếu muốn dùng cổng khác, sửa `frontend/vite.config.js` hoặc chạy `npm run dev -- --port 5174` và cập nhật CORS.

Khởi động lại các dev server sau khi sửa `.env`. Các biến `VITE_*` được gửi xuống trình duyệt; chỉ dùng cho cấu hình công khai. Không đưa mật khẩu, API key hoặc connection string vào đó.

## Cấu trúc

```text
frontend/
  src/
    api/             # Hàm gọi REST API
    components/      # Thành phần giao diện dùng chung
    hooks/
    layouts/
    pages/
      customer/
      waiter/
      kitchen/
      manager/
    App.jsx
    main.jsx
backend/
  src/
    app.js           # Express server và health endpoint
    routes/
    controllers/
    services/
    middlewares/
docs/
  uml/
  api/
  testing/
```

Các thư mục chưa có mã nguồn chứa `.gitkeep` để Git lưu lại cấu trúc.

## Kiểm tra

Từ thư mục gốc, khi Backend đang chạy:

```powershell
$response = Invoke-WebRequest -Uri http://localhost:5000/api/health -UseBasicParsing
$response.StatusCode
$response.Content
```

Kết quả mong đợi: HTTP `200`, `success: true`, `message: "Restaurant API is running"` và `timestamp` dạng ISO tại thời điểm gọi API.

Kiểm tra Frontend:

```powershell
cd frontend
npm run lint
npm run build
```

Build tạo thư mục `frontend/dist`, được bỏ qua bởi Git. Có thể xem build bằng `npm run preview -- --port 5173` sau khi đã dừng Frontend dev server; Backend vẫn cần chạy.

Checklist kiểm thử thủ công nằm tại [docs/testing/SCRUM-69.md](docs/testing/SCRUM-69.md); hợp đồng API tại [docs/api/health.md](docs/api/health.md).

## Xử lý lỗi thường gặp

| Triệu chứng | Cách xử lý |
| --- | --- |
| `npm` hoặc `node` không được nhận diện | Cài Node.js 24 LTS, mở lại terminal và kiểm tra phiên bản |
| PowerShell chặn `npm.ps1` | Dùng `npm.cmd` thay cho `npm` trong các lệnh trên |
| Cổng 5000 hoặc 5173 đang được dùng | Dừng server cũ ở terminal đã chạy nó, hoặc đổi cổng và đồng bộ cấu hình môi trường |
| Frontend báo không kết nối được Backend | Kiểm tra API health, cổng, `VITE_API_BASE_URL` và `FRONTEND_ORIGIN`, rồi khởi động lại server và tải lại trang |
| Lỗi CORS | Mở đúng `http://localhost:5173`; `127.0.0.1` và `localhost` là hai origin khác nhau |
| Không cài được dependencies | Kiểm tra mạng, truy cập npm registry và phiên bản Node.js; dùng `npm ci` trong đúng thư mục có lockfile |

## Quy tắc Git cho nhóm

- Nhánh chính: `main`.
- Nhánh tính năng: `feature/SCRUM-XX-ten-task`.
- Nhánh sửa lỗi: `fix/SCRUM-XX-ten-loi`.
- Commit: `feat(SCRUM-XX): mô tả` hoặc `fix(SCRUM-XX): mô tả`.
- Đồng bộ `main` trước khi tạo nhánh mới; bảo toàn thay đổi đang làm trước khi chuyển nhánh.
- Đưa code vào `main` qua Pull Request; cần ít nhất một thành viên khác review và chạy thử.
- Commit `package-lock.json` của cả hai ứng dụng; bỏ qua `node_modules`, `dist` và `.env`.

Ví dụ bắt đầu SCRUM-70 sau khi SCRUM-69 đã merge:

```powershell
git switch main
git pull origin main
git switch -c feature/SCRUM-70-database
```

Trước khi commit, kiểm tra `git status`, `git diff` và các file sắp đưa vào Git. Nội dung Pull Request gợi ý cho SCRUM-69 nằm tại [docs/SCRUM-69-PR.md](docs/SCRUM-69-PR.md).

Chỉ chuyển SCRUM-69 sang Done khi đã kiểm chứng trên máy thành viên khác, Pull Request được review và merge. Không đánh dấu các bước này hoàn tất chỉ dựa trên việc chạy local.
