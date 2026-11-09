export class AppError extends Error {
  constructor(message, status = 400, code = 'BAD_REQUEST') {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.isOperational = true;
  }

  static badRequest(msg, code = 'BAD_REQUEST') { return new AppError(msg, 400, code); }
  static unauthorized(msg = 'Chưa xác thực', code = 'UNAUTHORIZED') { return new AppError(msg, 401, code); }
  static forbidden(msg = 'Không có quyền', code = 'FORBIDDEN') { return new AppError(msg, 403, code); }
  static notFound(msg = 'Không tìm thấy', code = 'NOT_FOUND') { return new AppError(msg, 404, code); }
  static conflict(msg, code = 'CONFLICT') { return new AppError(msg, 409, code); }
}