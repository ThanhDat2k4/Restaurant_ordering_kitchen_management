import { withTx, query } from '../../database/with-tx.js';
import { AppError } from '../../shared/app-error.js';

export async function getSettings() {
  const { rows } = await query('SELECT * FROM cau_hinh_he_thong ORDER BY ma_cau_hinh');
  return rows;
}

export async function updateSetting(khoa, giaTri, userId) {
  return await withTx({ userId }, async (client) => {
    const { rows } = await client.query(
      `UPDATE cau_hinh_he_thong 
       SET gia_tri = $1, nguoi_cap_nhat = $2, ngay_cap_nhat = now() 
       WHERE khoa_cau_hinh = $3 RETURNING *`,
      [String(giaTri), userId, khoa]
    );
    if (!rows[0]) throw AppError.notFound('Không tìm thấy cấu hình');
    return rows[0];
  });
}