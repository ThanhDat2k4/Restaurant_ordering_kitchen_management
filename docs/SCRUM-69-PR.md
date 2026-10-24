# Pull Request dự thảo

**Title:** feat(SCRUM-69): initialize React and Express project

**Base:** `main`

**Head:** `feature/SCRUM-69-project-setup`

## Thay đổi

Repository cần một bộ khung để 5 thành viên clone và chạy trước khi triển khai nghiệp vụ. Thêm Express API `GET /api/health` và trang React hiển thị trạng thái kết nối, với các trạng thái đang tải, thành công và lỗi.

Bổ sung cấu trúc thư mục Frontend/Backend, cấu hình môi trường mẫu, lockfile, quy tắc bỏ qua file local và README cài đặt/chạy bằng hai terminal. PostgreSQL và Prisma dành cho SCRUM-70.

## Validation

Đã kiểm chứng local trên Windows với Node.js 24.14.0 và npm 11.9.0:

- `npm run lint` và `npm run build` trong Frontend: thành công.
- Backend health: HTTP 200, JSON đúng các trường, timestamp ISO hợp lệ; CORS cho origin `http://localhost:5173`.
- Chrome headless: React hiển thị message từ Backend thực tế.
- Chặn request API trong trình duyệt: hiển thị lỗi kết nối; bỏ chặn và tải lại trang: trở lại thành công.
- Viewport 375px: không tràn ngang; đã xem ảnh chụp giao diện desktop.
- Lockfile của cả hai ứng dụng khớp dependencies trong `package.json`.
- Git bỏ qua `.env`, dependencies, build output và công cụ kiểm chứng local; giữ được `.env.example`.

Người review tiếp tục kiểm tra theo `docs/testing/SCRUM-69.md` trên máy riêng. Chưa kiểm chứng bằng một thành viên khác clone repository. Các lần build và chạy Vite trong môi trường agent cần quyền chạy tiến trình ngoài sandbox; sau khi được cấp quyền, các bước kiểm chứng trên đã thành công.

## Trạng thái bàn giao

Đây là nội dung PR dự thảo trong repository, chưa chứng minh đã tạo PR trên GitHub. Chờ commit/push, thành viên khác review và merge; chỉ sau đó cập nhật Jira sang Done.

Commit message gợi ý:

```text
feat(SCRUM-69): initialize React and Express project
```
