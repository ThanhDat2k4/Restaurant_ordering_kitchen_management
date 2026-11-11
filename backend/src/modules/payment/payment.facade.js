import { withTx } from '../../database/with-tx.js';
import { AppError } from '../../shared/app-error.js';
import { eventBus, EVENTS } from '../../realtime/event-bus.js';

export class PaymentFacade {
  static async pay(maDonHang, dto, userId) {
    // 1. Transaction: Xử lý toàn bộ nghiệp vụ thanh toán (Facade gom các bước)
    const result = await withTx({ userId }, async (client) => {
      // a. Lock đơn
      const { rows: [order] } = await client.query(
        'SELECT * FROM don_hang WHERE ma_don_hang = $1 FOR UPDATE',
        [maDonHang]
      );
      if (!order) throw AppError.notFound('Đơn hàng không tồn tại');

      // b. Tạo giao dịch thanh toán (Trigger DB sẽ check BR.24 + tính tiền thừa)
      const { rows: [payment] } = await client.query(
        `INSERT INTO thanh_toan (ma_don_hang, nguoi_xu_ly, phuong_thuc_thanh_toan, so_tien, trang_thai_thanh_toan, tien_khach_dua)
         VALUES ($1, $2, $3, $4, 'THANH_CONG', $5) RETURNING *`,
        [maDonHang, userId, dto.phuong_thuc, dto.so_tien, dto.tien_khach_dua || null]
      );

      // c. Tạo hóa đơn (Trigger tự sinh số HD-...)
      const { rows: [invoice] } = await client.query(
        `INSERT INTO hoa_don (ma_don_hang, ma_thanh_toan, tong_tien_hoa_don)
         VALUES ($1, $2, $3) RETURNING *`,
        [maDonHang, payment.ma_thanh_toan, order.tong_tien]
      );

      return { payment, invoice, ma_ban: order.ma_ban, ma_don_hang: order.ma_don_hang };
    });

    // 2. SAU KHI COMMIT: Bắn Socket
    eventBus.emit(EVENTS.PAYMENT_COMPLETED, { ma_don_hang: result.ma_don_hang });
    if (result.ma_ban) {
      eventBus.emit(EVENTS.TABLE_FREED, { ma_ban: result.ma_ban });
    }

    return result;
  }
}