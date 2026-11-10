import { query } from '../../database/with-tx.js';

export async function getTableMap() {
  const { rows } = await query('SELECT * FROM v_so_do_ban');
  return rows;
}

export async function findQrToken(token) {
  const { rows } = await query(
    `SELECT q.ma_ban, b.ten_ban, b.trang_thai_ban 
     FROM ma_qr_ban q 
     JOIN ban_an b ON b.ma_ban = q.ma_ban 
     WHERE q.ma_xac_thuc_qr = $1 AND q.trang_thai_qr = 'HIEU_LUC'`,
    [token]
  );
  return rows[0] || null;
}

export async function getOpenOrder(maBan) {
  const { rows } = await query(
    `SELECT ma_don_hang FROM don_hang 
     WHERE ma_ban = $1 AND trang_thai_don NOT IN ('DA_THANH_TOAN', 'DA_HUY', 'DA_GOP')
     LIMIT 1`,
    [maBan]
  );
  return rows[0] ? rows[0].ma_don_hang : null;
}

export async function callStaff(maBan, client) {
  // 1. Lấy tên bàn từ database để hiển thị cho đẹp
  const { rows: banRows } = await client.query(
    'SELECT ten_ban FROM ban_an WHERE ma_ban = $1',
    [maBan]
  );
  const tenBan = banRows[0] ? banRows[0].ten_ban : `Bàn ${maBan}`;

  // 2. Lấy mã đơn đang mở (nếu có)
  const openOrder = await getOpenOrder(maBan);
  const maDonHang = openOrder || null;

  // 3. Dùng function có sẵn trong DB để tạo thông báo
  // Truyền tenBan ($1) thay vì maBan
  await client.query(
    `SELECT fn_tao_thong_bao_vai_tro(
      'PHUC_VU', 
      'HE_THONG', 
      'Khách gọi phục vụ', 
      'Khách tại ' || $1 || ' đang gọi phục vụ', 
      $2
    )`,
    [tenBan, maDonHang]
  );
}