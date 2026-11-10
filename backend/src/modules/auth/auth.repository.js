import { query } from '../../database/with-tx.js';

export async function findUserByIdentifier(identifier) {
  const { rows } = await query(
    `SELECT t.ma_tai_khoan, t.ten_dang_nhap, t.ho_ten, t.mat_khau_ma_hoa,
            t.trang_thai_tai_khoan, t.so_lan_dang_nhap_sai, t.khoa_den,
            v.ten_vai_tro
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

export async function findUserById(userId) {
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

export async function getStations(userId) {
  const { rows } = await query(
    `SELECT tk.ma_tram, tcb.ten_tram
       FROM tai_khoan_tram tk
       JOIN tram_che_bien tcb ON tcb.ma_tram = tk.ma_tram
      WHERE tk.ma_tai_khoan = $1`,
    [userId]
  );
  return rows;
}