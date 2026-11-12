import { withTx, query } from '../../database/with-tx.js';
import { AppError } from '../../shared/app-error.js';

export async function getPromotions() {
  const { rows } = await query(`
    SELECT ma_giam_gia, ma_code_giam_gia, loai_giam_gia, gia_tri_giam, 
           gia_tri_don_toi_thieu, giam_toi_da, trang_thai_giam_gia 
    FROM ma_giam_gia ORDER BY ma_giam_gia DESC
  `);
  return rows;
}

export async function createPromotion(data, userId) {
  return await withTx({ userId }, async (client) => {
    const { rows } = await client.query(
      `INSERT INTO ma_giam_gia (ma_code_giam_gia, loai_giam_gia, gia_tri_giam, thoi_gian_bat_dau, thoi_gian_ket_thuc, gia_tri_don_toi_thieu, giam_toi_da)
       VALUES ($1, $2, $3, now(), now() + interval '1 month', $4, $5) RETURNING *`,
      [data.code, data.loai, data.gia_tri, data.don_toi_thieu || 0, data.giam_toi_da || null]
    );
    return rows[0];
  });
}

export async function updatePromotionStatus(id, status, userId) {
  return await withTx({ userId }, async (client) => {
    const { rows } = await client.query(
      'UPDATE ma_giam_gia SET trang_thai_giam_gia = $1 WHERE ma_giam_gia = $2 RETURNING *',
      [status, id]
    );
    if (!rows[0]) throw AppError.notFound('Không tìm thấy mã');
    return rows[0];
  });
}