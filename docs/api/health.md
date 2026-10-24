# GET /api/health

Kiểm tra Express đang phục vụ HTTP. Chưa kiểm tra kết nối database.

- URL mặc định: `http://localhost:5000/api/health`.
- Không cần request body hoặc xác thực.
- Thành công: HTTP `200`, `Content-Type: application/json`.

```json
{
  "success": true,
  "message": "Restaurant API is running",
  "timestamp": "2026-10-23T12:00:00.000Z"
}
```

`timestamp` phía trên chỉ là ví dụ; response thực tế sử dụng thời gian UTC dạng ISO tại thời điểm xử lý request.

CORS cho phép origin trong `FRONTEND_ORIGIN`, mặc định `http://localhost:5173`. Đây là cấu hình cho trình duyệt, không phải cơ chế xác thực API. Frontend hiển thị lỗi khi request thất bại, response không thành công, dữ liệu sai cấu trúc hoặc quá 8 giây.
