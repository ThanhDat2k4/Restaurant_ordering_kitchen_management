// Lớp lỗi nghiệp vụ — dùng để throw lỗi có status code
export class AppError extends Error {
  constructor(message, status = 400, code = 'BAD_REQUEST') {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.isOperational = true; // Lỗi do nghiệp vụ, không phải bug
  }

  static badRequest(message, code = 'BAD_REQUEST') {
    return new AppError(message, 400, code);
  }
  static unauthorized(message = 'Chưa xác thực', code = 'UNAUTHORIZED') {
    return new AppError(message, 401, code);
  }
  static forbidden(message = 'Không có quyền', code = 'FORBIDDEN') {
    return new AppError(message, 403, code);
  }
  static notFound(message = 'Không tìm thấy', code = 'NOT_FOUND') {
    return new AppError(message, 404, code);
  }
  static conflict(message, code = 'CONFLICT') {
    return new AppError(message, 409, code);
  }
}