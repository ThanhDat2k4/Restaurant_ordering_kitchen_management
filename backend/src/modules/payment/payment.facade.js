import { withTx } from '../../database/with-tx.js';
import { AppError } from '../../shared/app-error.js';
import { eventBus, EVENTS } from '../../realtime/event-bus.js';

export class PaymentFacade {
  // Thanh Toán Trực Tiếp (Tiền mặt, thẻ)
  static async pay(maDonHang, dto, userId) {
    const result = await withTx({ userId }, async (client) => {
      // Lock đơn
      const { rows: [order] } = await client.query(
        'SELECT * FROM don_hang WHERE ma_don_hang = $1 FOR UPDATE',
        [maDonHang]
      );
      if (!order) throw AppError.notFound('Đơn hàng không tồn tại');

      // Tạo giao dịch thanh toán (Trigger DB sẽ check BR.24 + tính tiền thừa)
      const { rows: [payment] } = await client.query(
        `INSERT INTO thanh_toan (ma_don_hang, nguoi_xu_ly, phuong_thuc_thanh_toan, so_tien, trang_thai_thanh_toan, tien_khach_dua)
         VALUES ($1, $2, $3, $4, 'THANH_CONG', $5) RETURNING *`,
        [maDonHang, userId, dto.phuong_thuc, dto.so_tien, dto.tien_khach_dua || null]
      );

      // Tạo hóa đơn (Trigger tự sinh số HD-...)
      const { rows: [invoice] } = await client.query(
        `INSERT INTO hoa_don (ma_don_hang, ma_thanh_toan, tong_tien_hoa_don)
         VALUES ($1, $2, $3) RETURNING *`,
        [maDonHang, payment.ma_thanh_toan, order.tong_tien]
      );

      return { payment, invoice, ma_ban: order.ma_ban, ma_don_hang: order.ma_don_hang };
    });

    eventBus.emit(EVENTS.PAYMENT_COMPLETED, { ma_don_hang: result.ma_don_hang });
    if (result.ma_ban) {
      eventBus.emit(EVENTS.TABLE_FREED, { ma_ban: result.ma_ban });
    }

    return result;
  }

  // Xác Nhận Thanh Toán Thủ Công (Dành cho Chuyển khoản)
  static async confirmManualPayment(paymentId, userId) {
    const result = await withTx({ userId }, async (client) => {
      // Update trạng thái giao dịch từ CHO_XU_LY -> THANH_CONG
      const { rows: [payment] } = await client.query(
        `UPDATE thanh_toan 
         SET trang_thai_thanh_toan = 'THANH_CONG', thoi_gian_thanh_toan = now() 
         WHERE ma_thanh_toan = $1 AND trang_thai_thanh_toan = 'CHO_XU_LY' RETURNING *`,
        [paymentId]
      );
      
      if (!payment) {
        throw AppError.badRequest('Giao dịch không tồn tại hoặc đã được xử lý trước đó');
      }

      // Lấy thông tin đơn hàng để tạo hóa đơn
      const { rows: [order] } = await client.query(
        'SELECT tong_tien, ma_ban, ma_don_hang FROM don_hang WHERE ma_don_hang = $1',
        [payment.ma_don_hang]
      );

      // Sinh hóa đơn
      await client.query(
        `INSERT INTO hoa_don (ma_don_hang, ma_thanh_toan, tong_tien_hoa_don)
         VALUES ($1, $2, $3)`,
        [payment.ma_don_hang, paymentId, order.tong_tien]
      );

      return { ma_ban: order.ma_ban, ma_don_hang: order.ma_don_hang };
    });

    // Sau khi thanh toán bắn Socket báo cho phục vụ/quản lý biết bàn đã trống
    eventBus.emit(EVENTS.PAYMENT_COMPLETED, { ma_don_hang: result.ma_don_hang });
    if (result.ma_ban) {
      eventBus.emit(EVENTS.TABLE_FREED, { ma_ban: result.ma_ban });
    }

    return { ok: true };
  }
}