import { query } from '../../database/with-tx.js';

export async function getMenu() {
  const { rows } = await query('SELECT * FROM v_thuc_don_hien_hanh');
  return rows;
}

export async function getMenuItemById(maMonAn) {
  const { rows } = await query(
    `SELECT m.*, dm.ten_danh_muc 
     FROM mon_an m 
     JOIN danh_muc_mon_an dm ON dm.ma_danh_muc = m.ma_danh_muc 
     WHERE m.ma_mon_an = $1`, 
    [maMonAn]
  );
  return rows[0] || null;
}

export async function updateMenuStatus(maMonAn, trangThai, client) {
  const { rows } = await client.query(
    'UPDATE mon_an SET trang_thai_phuc_vu = $1 WHERE ma_mon_an = $2 RETURNING *',
    [trangThai, maMonAn]
  );
  return rows[0];
}