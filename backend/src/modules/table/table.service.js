import * as repo from './table.repository.js';
import { AppError } from '../../shared/app-error.js';
import { withTx } from '../../database/with-tx.js';
import { signTableToken } from '../../shared/table-jwt.js';

export async function getTableMap() {
  return await repo.getTableMap();
}

export async function processGuestQr(token) {
  // 1. Tìm bàn từ mã QR
  const table = await repo.findQrToken(token);
  if (!table) throw AppError.notFound('Mã QR không hợp lệ hoặc đã hết hạn');
  
  if (table.trang_thai_ban === 'BAO_TRI') {
    throw AppError.forbidden('Bàn đang bảo trì', 'TABLE_UNAVAILABLE');
  }

  // 2. Kiểm tra xem bàn có đơn đang mở không
  const existingOrderId = await repo.getOpenOrder(table.ma_ban);

  // 3. Sinh Table Token
  const tableToken = signTableToken(table.ma_ban);

  return {
    table_token: tableToken,
    ma_ban: table.ma_ban,
    ten_ban: table.ten_ban,
    existing_order_id: existingOrderId
  };
}

export async function callStaff(maBan, userId) {
  await withTx({ userId }, async (client) => {
    await repo.callStaff(maBan, client);
  });
  return { ok: true };
}

export async function transferOrder(maDonHang, maBanDich, userId) {
  return await withTx({ userId }, async (client) => {
    await client.query('SELECT fn_chuyen_ban($1, $2, $3)', [maDonHang, maBanDich, userId]);
    return { ok: true };
  });
}

export async function mergeOrders(maDonNguon, maDonDich, userId) {
  return await withTx({ userId }, async (client) => {
    await client.query('SELECT fn_gop_ban($1, $2, $3)', [maDonNguon, maDonDich, userId]);
    return { ok: true };
  });
}