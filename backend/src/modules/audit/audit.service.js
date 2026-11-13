import { query } from '../../database/with-tx.js';

export async function getAuditLogs(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const { rows } = await query(
    `SELECT nk.ma_nhat_ky, nk.hanh_dong, nk.ten_doi_tuong, nk.chi_tiet_nhat_ky, nk.ngay_tao,
            tk.ho_ten as nguoi_thuc_hien
     FROM nhat_ky_he_thong nk
     LEFT JOIN tai_khoan tk ON tk.ma_tai_khoan = nk.ma_tai_khoan
     ORDER BY nk.ngay_tao DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}