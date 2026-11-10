import { AppError } from '../shared/app-error.js';

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('Chưa xác thực'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden('Bạn không có quyền thực hiện thao tác này', 'ROLE_NOT_ALLOWED'));
    }
    next();
  };
}