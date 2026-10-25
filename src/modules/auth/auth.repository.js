import { query } from '../../db/tx.js';

// ─── Tìm tài khoản theo identifier (ten_dang_nhap / email / SĐT) ───
export async function findByIdentifier(identifier) {
  const { rows } = await query(
    `SELECT t.ma_tai_khoan, t.ten_dang_nhap, t.ho_ten, t.email, t.so_dien_thoai,
            t.mat_khau_ma_hoa, t.trang_thai_tai_khoan, t.so_lan_dang_nhap_sai,
            t.khoa_den, t.lan_dang_nhap_cuoi, v.ten_vai_tro
       FROM tai_khoan t
       JOIN vai_tro v ON v.ma_vai_tro = t.ma_vai_tro
      WHERE t.ten_dang_nhap = $1
         OR lower(t.email) = lower($1)
         OR t.so_dien_thoai = $1
      LIMIT 1`,
    [identifier]
  );
  return rows[0] || null;
}

// ─── Lấy user theo ID (cho /me) ───
export async function findById(userId) {
  const { rows } = await query(
    `SELECT t.ma_tai_khoan, t.ten_dang_nhap, t.ho_ten, t.email, t.so_dien_thoai,
            t.trang_thai_tai_khoan, v.ten_vai_tro
       FROM tai_khoan t
       JOIN vai_tro v ON v.ma_vai_tro = t.ma_vai_tro
      WHERE t.ma_tai_khoan = $1`,
    [userId]
  );
  return rows[0] || null;
}

// ─── Lấy danh sách trạm (cho DAU_BEP) ───
export async function getStationsOfUser(userId) {
  const { rows } = await query(
    `SELECT tkt.ma_tram, tcb.ten_tram
       FROM tai_khoan_tram tkt
       JOIN tram_che_bien tcb ON tcb.ma_tram = tkt.ma_tram
      WHERE tkt.ma_tai_khoan = $1
      ORDER BY tkt.ma_tram`,
    [userId]
  );
  return rows;
}

// ─── Lấy vai trò KHACH (để đăng ký) ───
export async function getRoleKhach(client) {
  const { rows } = await client.query(
    `SELECT ma_vai_tro FROM vai_tro WHERE ten_vai_tro = 'KHACH' LIMIT 1`
  );
  return rows[0] || null;
}