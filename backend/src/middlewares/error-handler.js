import { sendError } from '../shared/response.js';
import { AppError } from '../shared/app-error.js';

export function errorHandler(err, req, res, _next) {
  if (!(err instanceof AppError)) {
    req.log?.error({ err }, 'Unhandled error');
    err = new AppError('Lỗi hệ thống', 500, 'INTERNAL_ERROR');
  }
  sendError(res, err);
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: { code: 'ROUTE_NOT_FOUND', message: `Không có route ${req.method} ${req.path}` },
  });
}