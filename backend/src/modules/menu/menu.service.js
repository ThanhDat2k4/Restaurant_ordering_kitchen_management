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