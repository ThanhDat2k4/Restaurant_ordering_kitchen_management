import { withTx, query } from '../../database/with-tx.js';
import { AppError } from '../../shared/app-error.js';
import { eventBus, EVENTS } from '../../realtime/event-bus.js';

// Lấy danh sách phiếu bếp đang chờ
export async function getTickets() {
  const { rows } = await query('SELECT * FROM v_man_hinh_bep');
  return rows;
}

// Bếp cập nhật trạng thái món (DANG_NAU / DA_XONG)
export async function updateItemStatus(itemId, status, userId) {
  if (!['DANG_NAU', 'DA_XONG'].includes(status)) {
    throw AppError.badRequest('Trạng thái không hợp lệ (chỉ nhận DANG_NAU hoặc DA_XONG)');
  }

  const result = await withTx({ userId }, async (client) => {
    // Gọi function DB có sẵn: Tự động đồng bộ 2 chiều (bếp <-> đơn)
    await client.query(
      'SELECT fn_cap_nhat_trang_thai_mon($1, $2, $3)',
      [itemId, status, userId]
    );

    // Lấy lại thông tin để tí nữa bắn Socket
    const { rows } = await client.query(
      `SELECT ctdh.*, dh.ma_don_hang, dh.ma_ban, m.ten_mon_an 
       FROM chi_tiet_don_hang ctdh
       JOIN don_hang dh ON dh.ma_don_hang = ctdh.ma_don_hang
       JOIN mon_an m ON m.ma_mon_an = ctdh.ma_mon_an
       WHERE ctdh.ma_chi_tiet_don_hang = $1`,
      [itemId]
    );
    return rows[0];
  });

  // SAU KHI COMMIT -> Mới phát sự kiện
  if (status === 'DA_XONG') {
    eventBus.emit(EVENTS.ITEM_READY, {
      ma_chi_tiet_don_hang: result.ma_chi_tiet_don_hang,
      ten_mon: result.ten_mon_an,
      ma_ban: result.ma_ban,
    });
  }

  return result;
}