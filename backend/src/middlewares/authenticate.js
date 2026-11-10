import { verifyAccessToken } from '../shared/jwt.js';
import { query } from '../database/with-tx.js';
import { AppError } from '../shared/app-error.js';

export async function authenticate(req, res, next) {
  try {
    // 1. Lấy token từ header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Thiếu token xác thực (Bearer)');
    }
    const token = authHeader.split(' ')[1];

    // 2. Verify JWT
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      throw AppError.unauthorized('Token không hợp lệ hoặc đã hết hạn', 'INVALID_TOKEN');
    }

    // 3. Check DB xem session có bị thu hồi chưa (chống logout rồi vẫn dùng token cũ)
    const { rows } = await query(
      'SELECT da_thu_hoi FROM phien_dang_nhap WHERE ma_phien = $1',
      [payload.sid]
    );
    
    if (!rows[0] || rows[0].da_thu_hoi) {
      throw AppError.unauthorized('Phiên đăng nhập đã hết hiệu lực', 'SESSION_REVOKED');
    }

    // 4. Gắn user vào request
    req.user = {
      userId: payload.sub,
      role: payload.role,
      sid: payload.sid,
    };
    
    next();
  } catch (err) {
    next(err);
  }
}