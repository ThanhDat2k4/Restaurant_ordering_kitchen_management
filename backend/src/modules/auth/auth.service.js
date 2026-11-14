import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { withTx, query } from '../../database/with-tx.js';
import { AppError } from '../../shared/app-error.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../shared/jwt.js';
import * as repo from './auth.repository.js';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function login({ identifier, mat_khau, ip, userAgent }) {
  const user = await repo.findUserByIdentifier(identifier);

  if (!user) {
    throw AppError.unauthorized('Sai tên đăng nhập hoặc mật khẩu', 'INVALID_CREDENTIALS');
  }

  // 1. Kiểm tra khóa tạm
  if (user.khoa_den && new Date(user.khoa_den) > new Date()) {
    throw AppError.forbidden('Tài khoản đang bị khóa tạm thời', 'ACCOUNT_LOCKED');
  }

  // 2. Kiểm tra trạng thái
  if (user.trang_thai_tai_khoan !== 'HOAT_DONG') {
    throw AppError.forbidden('Tài khoản đã bị khóa hoặc ngừng hoạt động', 'ACCOUNT_INACTIVE');
  }

  // 3. So sánh mật khẩu
  const isMatch = await bcrypt.compare(mat_khau, user.mat_khau_ma_hoa);

  if (!isMatch) {
    // Tăng số lần sai (đơn giản hóa, không khóa tự động ở đây để tránh phức tạp cho demo)
    await query(
      'UPDATE tai_khoan SET so_lan_dang_nhap_sai = so_lan_dang_nhap_sai + 1 WHERE ma_tai_khoan = $1',
      [user.ma_tai_khoan]
    );
    throw AppError.unauthorized('Sai tên đăng nhập hoặc mật khẩu', 'INVALID_CREDENTIALS');
  }

  // 4. Đăng nhập thành công -> Tạo session
  return await withTx({ userId: user.ma_tai_khoan }, async (client) => {
    // Reset counter
    await client.query(
      'UPDATE tai_khoan SET so_lan_dang_nhap_sai = 0, khoa_den = NULL, lan_dang_nhap_cuoi = now() WHERE ma_tai_khoan = $1',
      [user.ma_tai_khoan]
    );

    // Tạo session rỗng (chưa có hash refresh token)
    const { rows } = await client.query(
      `INSERT INTO phien_dang_nhap (ma_tai_khoan, refresh_token_hash, thoi_gian_het_han, dia_chi_ip, user_agent)
       VALUES ($1, 'pending', now() + interval '7 days', $2, $3)
       RETURNING ma_phien`,
      [user.ma_tai_khoan, ip || null, (userAgent || '').slice(0, 255)]
    );
    const sid = rows[0].ma_phien;

    // Tạo token
    const accessToken = signAccessToken({ sub: user.ma_tai_khoan, role: user.ten_vai_tro, sid });
    const refreshToken = signRefreshToken({ sub: user.ma_tai_khoan, sid });

    // Update lại session với hash của refresh token
    await client.query(
      'UPDATE phien_dang_nhap SET refresh_token_hash = $1 WHERE ma_phien = $2',
      [hashToken(refreshToken), sid]
    );

    // Lấy danh sách trạm (nếu là đầu bếp)
    const stations = user.ten_vai_tro === 'DAU_BEP' ? await repo.getStations(user.ma_tai_khoan) : [];

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.ma_tai_khoan,
        ten_dang_nhap: user.ten_dang_nhap,
        ho_ten: user.ho_ten,
        role: user.ten_vai_tro,
      },
      stations,
    };
  });
}

export async function logout({ sid }) {
  await withTx({}, async (client) => {
    await client.query(
      'UPDATE phien_dang_nhap SET da_thu_hoi = true, thoi_gian_thu_hoi = now() WHERE ma_phien = $1',
      [sid]
    );
  });
  return { ok: true };
}

export async function getMe(userId) {
  const user = await repo.findUserById(userId);
  if (!user) throw AppError.notFound('Tài khoản không tồn tại');

  const stations = user.ten_vai_tro === 'DAU_BEP' ? await repo.getStations(userId) : [];

  return {
    id: user.ma_tai_khoan,
    ten_dang_nhap: user.ten_dang_nhap,
    ho_ten: user.ho_ten,
    email: user.email,
    so_dien_thoai: user.so_dien_thoai,
    role: user.ten_vai_tro,
    stations,
  };
}

export async function refresh({ refreshToken, ip, userAgent }) {
  if (!refreshToken) throw AppError.unauthorized('Thiếu refresh token', 'MISSING_REFRESH_TOKEN');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw AppError.unauthorized('Refresh token không hợp lệ hoặc hết hạn', 'INVALID_REFRESH_TOKEN');
  }

  const { rows } = await query(
    'SELECT da_thu_hoi, thoi_gian_het_han, refresh_token_hash FROM phien_dang_nhap WHERE ma_phien = $1',
    [payload.sid]
  );
  
  const session = rows[0];
  if (!session || session.da_thu_hoi) {
    throw AppError.unauthorized('Phiên đã bị thu hồi', 'SESSION_REVOKED');
  }
  if (new Date(session.thoi_gian_het_han) < new Date()) {
    throw AppError.unauthorized('Phiên đã hết hạn', 'SESSION_EXPIRED');
  }
  if (session.refresh_token_hash !== hashToken(refreshToken)) {
    throw AppError.unauthorized('Refresh token không khớp', 'REFRESH_MISMATCH');
  }

  // Rotate token (thu hồi cũ, tạo mới)
  return await withTx({}, async (client) => {
    await client.query('UPDATE phien_dang_nhap SET da_thu_hoi = true WHERE ma_phien = $1', [payload.sid]);
    
    // Lấy lại role để tạo access token mới
    const userRes = await client.query('SELECT ma_vai_tro, (SELECT ten_vai_tro FROM vai_tro WHERE ma_vai_tro = ma_vai_tro) as role FROM tai_khoan WHERE ma_tai_khoan = $1', [payload.sub]);
    const role = userRes.rows[0].role;

    const { rows: newRows } = await client.query(
      `INSERT INTO phien_dang_nhap (ma_tai_khoan, refresh_token_hash, thoi_gian_het_han, dia_chi_ip, user_agent)
       VALUES ($1, 'pending', now() + interval '7 days', $2, $3)
       RETURNING ma_phien`,
      [payload.sub, ip || null, (userAgent || '').slice(0, 255)]
    );
    const newSid = newRows[0].ma_phien;

    const newAccessToken = signAccessToken({ sub: payload.sub, role, sid: newSid });
    const newRefreshToken = signRefreshToken({ sub: payload.sub, sid: newSid });

    await client.query('UPDATE phien_dang_nhap SET refresh_token_hash = $1 WHERE ma_phien = $2', [hashToken(newRefreshToken), newSid]);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  });
}

export async function changePassword(userId, matKhauCu, matKhauMoi) {
  const user = await repo.findUserById(userId);
  const isMatch = await bcrypt.compare(matKhauCu, user.mat_khau_ma_hoa);
  if (!isMatch) throw AppError.badRequest('Mật khẩu cũ không đúng');

  const newHash = await bcrypt.hash(matKhauMoi, 12);
  await withTx({ userId }, async (client) => {
    await client.query('UPDATE tai_khoan SET mat_khau_ma_hoa = $1 WHERE ma_tai_khoan = $2', [newHash, userId]);
  });
  return { ok: true };
}

export async function createEmployee(data, adminId) {
  // 1. Băm mật khẩu
  const passwordHash = await bcrypt.hash(data.mat_khau, 12);

  return await withTx({ userId: adminId }, async (client) => {
    // 2. Tìm ID vai trò
    const maVaiTro = await repo.getRoleIdByName(data.ma_vai_tro, client);
    if (!maVaiTro) throw AppError.badRequest('Vai trò không hợp lệ');

    // 3. Tạo tài khoản
    const user = await repo.insertEmployee(data, passwordHash, maVaiTro, client);

    // 4. Nếu là Đầu bếp, gán vào các trạm chế biến
    if (data.ma_vai_tro === 'DAU_BEP' && data.ma_tram && data.ma_tram.length > 0) {
      await repo.assignStations(user.ma_tai_khoan, data.ma_tram, client);
    }

    return user;
  });
}

export async function getEmployees(filters) {
  return await repo.getEmployeesList(filters);
}