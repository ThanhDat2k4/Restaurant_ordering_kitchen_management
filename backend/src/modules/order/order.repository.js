import { query } from '../../database/with-tx.js';

// Lấy danh sách đơn
export async function getOrders() {
  const { rows } = await query(`
    SELECT * FROM v_don_hang_tong_quan 
    WHERE trang_thai_don NOT IN ('DA_HUY', 'DA_GOP')
    ORDER BY ngay_tao DESC
  `);
  return rows;
}

// Lấy chi tiết 1 đơn
export async function getOrderById(maDonHang) {
  const { rows } = await query('SELECT * FROM v_don_hang_tong_quan WHERE ma_don_hang = $1', [maDonHang]);
  return rows[0] || null;
}