// Global error handler — phải đặt CUỐI CÙNG trong app.js
import { AppError } from '../shared/AppError.js';

export function errorHandler(err, req, res, _next) {
  // Đã được map qua pg-error-map nếu là lỗi DB
  const isAppError = err instanceof AppError;
  const status = isAppError ? err.status : (err.status || 500);
  const code = isAppError ? err.code : 'INTERNAL_SERVER_ERROR';

  // Log lỗi server
  if (status >= 500) {
    req.log?.error({ err, reqId: req.id }, 'Lỗi server');
  } else {
    req.log?.warn({ err: { message: err.message, code }, reqId: req.id }, 'Lỗi client');
  }

  // Không lộ stack trace ở production
  const body = {
    error: {
      code,
      message: err.message || 'Lỗi không xác định',
    },
  };

  if (err.details) body.error.details = err.details;
  if (!req.app.get('env') === 'production' && err.stack) {
    body.error.stack = err.stack.split('\n').slice(0, 5).join('\n');
  }

  res.status(status).json(body);
}

// Middleware 404 — phải đặt TRƯỚC error handler
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Không tìm thấy route: ${req.method} ${req.originalUrl}`,
    },
  });
}