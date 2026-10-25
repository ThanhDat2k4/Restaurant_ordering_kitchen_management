import bcrypt from 'bcrypt';
import { withTx, query } from '../../db/tx.js';
import { AppError } from '../../shared/AppError.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '../../shared/jwt.js';
import * as repo from './auth.repository.js';

const BCRYPT_COST = 12;
const MAX_FAILED = 5;               // Số lần sai tối đa trước khi khóa
const LOCK_MINUTES = 15;            // Thời gian khóa (khớp config THOI_GIAN_KHOA_PHUT)
const REFRESH_DAYS = 7;

// Dummy hash để chống timing attack (khi user không tồn tại)
const DUMMY_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyZLLp2VnG8KzK';

// ═══════════════════════════════════════════════════════════
// REGISTER — tạo tài khoản KHACH
// ═══════════════════════════════════════════════════════════
export async function register({ ten_dang_nhap, mat_khau, ho_ten, email, so_dien_thoai }) {
  // Chuẩn hóa empty string → null (để unique index cho phép NULL)
  const emailNorm = email && email.trim() !== '' ? email.trim() : null;
  const sdtNorm = so_dien_thoai && so_dien_thoai.trim() !== '' ? so_dien_thoai.trim() : null;

  // Validate nghiệp vụ: KHACH phải có email hoặc SĐT (khớp trigger fn_kiem_tra_tai_khoan_khach)
  if (!emailNorm && !sdtNorm) {
    throw AppError.badRequest(
      'Tài khoản khách phải có email hoặc số điện thoại',
      'MISSING_CONTACT'
    );
  }

  const passwordHash = await bcrypt.hash(mat_khau, BCRYPT_COST);

  return await withTx({}, async (client) => {
    const role = await repo.getRoleKhach(client);
    if (!role) {
      throw new AppError(
        'Vai trò KHACH chưa được seed — chạy 05_seed_data.sql trước',
        500,
        'SEED_MISSING'
      );
    }

    const { rows: [user] } = await client.query(
      `INSERT INTO tai_khoan
         (ma_vai_tro, ho_ten, ten_dang_nhap, mat_khau_ma_hoa, email, so_dien_thoai)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ma_tai_khoan, ten_dang_nhap, ho_ten, email, so_dien_thoai, ngay_tao`,
      [role.ma_vai_tro, ho_ten, ten_dang_nhap, passwordHash, emailNorm, sdtNorm]
    );

    return {
      id: user.ma_tai_khoan,
      ten_dang_nhap: user.ten_dang_nhap,
      ho_ten: user.ho_ten,
      email: user.email,
      so_dien_thoai: user.so_dien_thoai,
      ngay_tao: user.ngay_tao,
    };
  });
}

// ═══════════════════════════════════════════════════════════
// LOGIN — với lock sau 5 lần sai
// ═══════════════════════════════════════════════════════════
export async function login({ identifier, mat_khau, ip, userAgent }) {
  const user = await repo.findByIdentifier(identifier);

  // Timing attack prevention: nếu user không tồn tại vẫn so sánh bcrypt giả
  if (!user) {
    await bcrypt.compare(mat_khau, DUMMY_HASH);
    throw AppError.unauthorized('Sai thông tin đăng nhập', 'INVALID_CREDENTIALS');
  }

  // Check khóa tạm do sai quá nhiều
  if (user.khoa_den && new Date(user.khoa_den) > new Date()) {
    const mins = Math.ceil((new Date(user.khoa_den) - new Date()) / 60000);
    throw AppError.forbidden(
      `Tài khoản tạm khóa, thử lại sau ${mins} phút`,
      'ACCOUNT_LOCKED'
    );
  }

  // Check trạng thái
  if (user.trang_thai_tai_khoan !== 'HOAT_DONG') {
    throw AppError.forbidden(
      'Tài khoản không hoạt động, liên hệ quản lý',
      'ACCOUNT_INACTIVE'
    );
  }

  // Verify password
  const ok = await bcrypt.compare(mat_khau, user.mat_khau_ma_hoa);

  if (!ok) {
    // Tăng bộ đếm (single UPDATE, không cần transaction)
    const newAttempts = user.so_lan_dang_nhap_sai + 1;
    if (newAttempts >= MAX_FAILED) {
      await query(
        `UPDATE tai_khoan
            SET so_lan_dang_nhap_sai = 0,
                khoa_den = now() + ($2 || ' minutes')::interval
          WHERE ma_tai_khoan = $1`,
        [user.ma_tai_khoan, String(LOCK_MINUTES)]
      );
    } else {
      await query(
        `UPDATE tai_khoan SET so_lan_dang_nhap_sai = $2 WHERE ma_tai_khoan = $1`,
        [user.ma_tai_khoan, newAttempts]
      );
    }
    throw AppError.unauthorized('Sai thông tin đăng nhập', 'INVALID_CREDENTIALS');
  }

  // ─── Success ───
  return await withTx({ userId: user.ma_tai_khoan }, async (client) => {
    // Reset counter + update last login
    await client.query(
      `UPDATE tai_khoan
          SET so_lan_dang_nhap_sai = 0,
              khoa_den = NULL,
              lan_dang_nhap_cuoi = now()
        WHERE ma_tai_khoan = $1`,
      [user.ma_tai_khoan]
    );

    // Create session
    const { rows: [session] } = await client.query(
      `INSERT INTO phien_dang_nhap
         (ma_tai_khoan, refresh_token_hash, thoi_gian_het_han, dia_chi_ip, user_agent)
       VALUES ($1, 'pending', now() + ($4 || ' days')::interval, $2, $3)
       RETURNING ma_phien`,
      [user.ma_tai_khoan, ip || null, (userAgent || '').slice(0, 255), String(REFRESH_DAYS)]
    );

    // Generate tokens
    const accessToken = signAccessToken({
      userId: user.ma_tai_khoan,
      role: user.ten_vai_tro,
      sid: session.ma_phien,
    });
    const refreshToken = signRefreshToken({
      userId: user.ma_tai_khoan,
      sid: session.ma_phien,
    });

    // Update session with hashed refresh token
    await client.query(
      `UPDATE phien_dang_nhap SET refresh_token_hash = $2 WHERE ma_phien = $1`,
      [session.ma_phien, hashToken(refreshToken)]
    );

    // Get stations nếu là DAU_BEP
    const stations =
      user.ten_vai_tro === 'DAU_BEP' ? await repo.getStationsOfUser(user.ma_tai_khoan) : [];

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.ma_tai_khoan,
        ten_dang_nhap: user.ten_dang_nhap,
        ho_ten: user.ho_ten,
        email: user.email,
        role: user.ten_vai_tro,
      },
      stations,
    };
  });
}

// ═══════════════════════════════════════════════════════════
// LOGOUT — revoke session (F.1.2)
// ═══════════════════════════════════════════════════════════
export async function logout({ sid }) {
  await withTx({}, async (client) => {
    await client.query(
      `UPDATE phien_dang_nhap
          SET da_thu_hoi = true, thoi_gian_thu_hoi = now()
        WHERE ma_phien = $1 AND da_thu_hoi = false`,
      [sid]
    );
  });
  return { ok: true };
}

// ═══════════════════════════════════════════════════════════
// ME — lấy thông tin user hiện tại
// ═══════════════════════════════════════════════════════════
export async function me({ userId }) {
  const user = await repo.findById(userId);
  if (!user) throw AppError.notFound('Tài khoản không tồn tại');

  const stations =
    user.ten_vai_tro === 'DAU_BEP' ? await repo.getStationsOfUser(userId) : [];

  return {
    id: user.ma_tai_khoan,
    ten_dang_nhap: user.ten_dang_nhap,
    ho_ten: user.ho_ten,
    email: user.email,
    so_dien_thoai: user.so_dien_thoai,
    role: user.ten_vai_tro,
    trang_thai: user.trang_thai_tai_khoan,
    stations,
  };
}

// ═══════════════════════════════════════════════════════════
// REFRESH — rotate refresh token
// ═══════════════════════════════════════════════════════════
export async function refresh({ refreshToken, ip, userAgent }) {
  if (!refreshToken) {
    throw AppError.unauthorized('Thiếu refresh token', 'MISSING_REFRESH_TOKEN');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw AppError.unauthorized('Refresh token không hợp lệ hoặc đã hết hạn', 'INVALID_REFRESH_TOKEN');
  }

  // Lookup session
  const { rows: [session] } = await query(
    `SELECT ma_phien, ma_tai_khoan, refresh_token_hash, da_thu_hoi, thoi_gian_het_han
       FROM phien_dang_nhap WHERE ma_phien = $1`,
    [payload.sid]
  );
  if (!session) throw AppError.unauthorized('Phiên không tồn tại', 'SESSION_NOT_FOUND');
  if (session.da_thu_hoi) throw AppError.unauthorized('Phiên đã bị thu hồi', 'SESSION_REVOKED');
  if (new Date(session.thoi_gian_het_han) < new Date()) {
    throw AppError.unauthorized('Phiên đã hết hạn', 'SESSION_EXPIRED');
  }
  if (session.refresh_token_hash !== hashToken(refreshToken)) {
    throw AppError.unauthorized('Refresh token không khớp', 'REFRESH_MISMATCH');
  }

  // Rotate
  return await withTx({ userId: session.ma_tai_khoan }, async (client) => {
    // Revoke old
    await client.query(
      `UPDATE phien_dang_nhap SET da_thu_hoi = true, thoi_gian_thu_hoi = now()
        WHERE ma_phien = $1`,
      [session.ma_phien]
    );

    // Get user info (check active)
    const { rows: [user] } = await client.query(
      `SELECT t.ma_tai_khoan, v.ten_vai_tro
         FROM tai_khoan t JOIN vai_tro v ON v.ma_vai_tro = t.ma_vai_tro
        WHERE t.ma_tai_khoan = $1 AND t.trang_thai_tai_khoan = 'HOAT_DONG'`,
      [session.ma_tai_khoan]
    );
    if (!user) throw AppError.unauthorized('Tài khoản không còn hoạt động', 'ACCOUNT_INACTIVE');

    // Create new session
    const { rows: [newSession] } = await client.query(
      `INSERT INTO phien_dang_nhap
         (ma_tai_khoan, refresh_token_hash, thoi_gian_het_han, dia_chi_ip, user_agent)
       VALUES ($1, 'pending', now() + ($4 || ' days')::interval, $2, $3)
       RETURNING ma_phien`,
      [user.ma_tai_khoan, ip || null, (userAgent || '').slice(0, 255), String(REFRESH_DAYS)]
    );

    const accessToken = signAccessToken({
      userId: user.ma_tai_khoan,
      role: user.ten_vai_tro,
      sid: newSession.ma_phien,
    });
    const newRefreshToken = signRefreshToken({
      userId: user.ma_tai_khoan,
      sid: newSession.ma_phien,
    });

    await client.query(
      `UPDATE phien_dang_nhap SET refresh_token_hash = $2 WHERE ma_phien = $1`,
      [newSession.ma_phien, hashToken(newRefreshToken)]
    );

    return { accessToken, refreshToken: newRefreshToken };
  });
}

// ═══════════════════════════════════════════════════════════
// CHANGE PASSWORD
// ═══════════════════════════════════════════════════════════
export async function changePassword({ userId, sid, mat_khau_cu, mat_khau_moi }) {
  const { rows: [user] } = await query(
    `SELECT mat_khau_ma_hoa FROM tai_khoan WHERE ma_tai_khoan = $1`,
    [userId]
  );
  if (!user) throw AppError.notFound('Tài khoản không tồn tại');

  const ok = await bcrypt.compare(mat_khau_cu, user.mat_khau_ma_hoa);
  if (!ok) throw AppError.badRequest('Mật khẩu cũ không đúng', 'WRONG_OLD_PASSWORD');

  if (mat_khau_cu === mat_khau_moi) {
    throw AppError.badRequest('Mật khẩu mới phải khác mật khẩu cũ', 'SAME_PASSWORD');
  }

  const newHash = await bcrypt.hash(mat_khau_moi, BCRYPT_COST);

  await withTx({ userId }, async (client) => {
    await client.query(
      `UPDATE tai_khoan SET mat_khau_ma_hoa = $2 WHERE ma_tai_khoan = $1`,
      [userId, newHash]
    );
    // Revoke tất cả session khác (giữ session hiện tại)
    await client.query(
      `UPDATE phien_dang_nhap
          SET da_thu_hoi = true, thoi_gian_thu_hoi = now()
        WHERE ma_tai_khoan = $1 AND ma_phien <> $2 AND da_thu_hoi = false`,
      [userId, sid]
    );
  });

  return { ok: true };
}