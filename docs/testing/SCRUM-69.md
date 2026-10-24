# Checklist kiểm thử SCRUM-69

Thực hiện trên máy người review trước khi merge. Các ô bên dưới để trống có chủ ý, dành cho người nghiệm thu.

- [ ] Clone repository hiện có và checkout nhánh Pull Request.
- [ ] Kiểm tra Node.js 24, npm và Git.
- [ ] Chạy `npm ci` trong `backend` và `frontend` theo README.
- [ ] Chạy Backend ở cổng 5000 và Frontend ở cổng 5173.
- [ ] Gọi `/api/health`: HTTP 200, success true, đúng message và timestamp ISO.
- [ ] Mở Frontend: thấy `Restaurant API is running` màu xanh.
- [ ] Dừng Backend, tải lại Frontend: thấy thông báo lỗi kết nối.
- [ ] Khởi động lại Backend, tải lại Frontend: trạng thái trở lại thành công.
- [ ] Frontend lint và build thành công.
- [ ] Không đưa `.env`, `node_modules`, `dist` hoặc dữ liệu nhạy cảm vào commit.
- [ ] Có lockfile của cả Frontend và Backend.
- [ ] Có ít nhất một thành viên khác review và chạy thử.
- [ ] Pull Request đã merge vào `main` trước khi chuyển Jira sang Done.

Khi review, ghi phiên bản Node.js, hệ điều hành và kết quả vào Pull Request. Trạng thái kiểm chứng của người triển khai sẽ được ghi riêng trong phần validation của bản nháp PR.
