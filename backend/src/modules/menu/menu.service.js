import * as repo from './menu.repository.js';
import { AppError } from '../../shared/app-error.js';
import { withTx, query } from '../../database/with-tx.js';

export async function getMenu() {
  return await repo.getMenu();
}

export async function getMenuItem(id) {
  const item = await repo.getMenuItemById(id);
  if (!item) throw AppError.notFound('Không tìm thấy món ăn');
  return item;
}

export async function updateStatus(id, status, userId) {
  const validStatuses = ['CON_BAN', 'HET_MON', 'AN'];
  if (!validStatuses.includes(status)) {
    throw AppError.badRequest('Trạng thái không hợp lệ');
  }

  return await withTx({ userId }, async (client) => {
    const item = await repo.updateMenuStatus(id, status, client);
    if (!item) throw AppError.notFound('Không tìm thấy món ăn');
    return item;
  });
}

export async function createMenuItem(data, userId) {
  return await withTx({ userId }, async (client) => {
    const { rows } = await client.query(
      `INSERT INTO mon_an (ma_danh_muc, ten_mon_an, don_gia, ma_tram, mo_ta)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.ma_danh_muc, data.ten_mon_an, data.don_gia, data.ma_tram || null, data.mo_ta || null]
    );
    return rows[0];
  });
}

export async function updateItemImage(maMonAn, imagePath, userId) {
  return await withTx({ userId }, async (client) => {
    const { rows } = await client.query(
      'UPDATE mon_an SET duong_dan_hinh_anh = $1 WHERE ma_mon_an = $2 RETURNING *',
      [imagePath, maMonAn]
    );
    if (!rows[0]) throw AppError.notFound('Không tìm thấy món ăn');
    return rows[0];
  });
}