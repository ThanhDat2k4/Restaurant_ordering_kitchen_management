import { verifyAccessToken } from '../shared/jwt.js';
import { query } from '../db/tx.js';
import { AppError } from '../shared/AppError.js';

// Verify JWT + check session chưa bị thu hồi (F.1.2 — logout có hiệu lực ngay)
export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Thiếu token xác thực');
    }

    const token = header.slice(7).trim();
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw AppError.unauthorized('Token không hợp lệ hoặc đã hết hạn', 'INVALID_TOKEN');
    }

    // Check session still alive (cheap query dùng primary key)
    const { rows: [session] } = await query(
      `SELECT da_thu_hoi FROM phien_dang_nhap WHERE ma_phien = $1`,
      [payload.sid]
    );
    if (!session || session.da_thu_hoi) {
      throw AppError.unauthorized(
        'Phiên đã hết hiệu lực, vui lòng đăng nhập lại',
        'SESSION_REVOKED'
      );
    }

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