import { AppError } from '../shared/AppError.js';

// Dùng sau authenticate — check user có 1 trong các role được phép
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('Chưa xác thực'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `Chỉ ${allowedRoles.join(', ')} được thực hiện`,
          'ROLE_NOT_ALLOWED'
        )
      );
    }
    next();
  };
}