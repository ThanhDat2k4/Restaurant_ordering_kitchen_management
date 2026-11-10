import { verifyTableToken } from '../shared/table-jwt.js';
import { AppError } from '../shared/app-error.js';

export function authenticateTable(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Thiếu Table Token');
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyTableToken(token);

    req.table = { maBan: payload.maBan };
    next();
  } catch (err) {
    next(AppError.unauthorized('Table Token không hợp lệ hoặc đã hết hạn', 'INVALID_TABLE_TOKEN'));
  }
}