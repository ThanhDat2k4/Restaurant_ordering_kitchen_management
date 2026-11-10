import { ZodError } from 'zod';
import { AppError } from '../shared/app-error.js';

export function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({ path: e.path.join('.'), message: e.message }));
        const appErr = AppError.badRequest('Dữ liệu đầu vào không hợp lệ', 'VALIDATION_ERROR');
        appErr.details = details;
        return next(appErr);
      }
      next(err);
    }
  };
}