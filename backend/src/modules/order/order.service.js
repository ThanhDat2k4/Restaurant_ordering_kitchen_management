import { eventBus, EVENTS } from '../../realtime/event-bus.js';
import crypto from 'node:crypto';
import { withTx } from '../../database/with-tx.js';
import { AppError } from '../../shared/app-error.js';
import { OrderFactory } from './factory/order.factory.js';
import * as repo from './order.repository.js';

// Hàm băm request để check Idempotency
function hashRequest(body) {
  return crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
}

export async function createOrder(dto, ctx, idempotencyKey) {
  const requestHash = hashRequest(dto);

  return await withTx({ userId: ctx.userId }, async (client) => {
    // 1. XỬ LÝ IDEMPOTENCY (Chống tạo đơn trùng khi mạng lag/retry)
    if (idempotencyKey) {
      // Thử insert key mới (nếu đã có thì bỏ qua)
      await client.query(
        `INSERT INTO khoa_idempotency (khoa, endpoint, ma_tai_khoan, request_hash, trang_thai)
         VALUES ($1, 'POST /orders', $2, $3, 'DANG_XU_LY')
         ON CONFLICT (khoa, endpoint) DO NOTHING`,
        [idempotencyKey, ctx.userId || null, requestHash]
      );

      // Lock dòng idempotency này lại
      const { rows: [idem] } = await client.query(
        `SELECT request_hash, trang_thai, noi_dung_phan_hoi 
         FROM khoa_idempotency 
         WHERE khoa = $1 AND endpoint = 'POST /orders' FOR UPDATE`,
        [idempotencyKey]
      );

      if (idem.request_hash !== requestHash) {
        throw AppError.conflict('Mã Idempotency-Key đã được dùng với dữ liệu khác', 'IDEMPOTENCY_KEY_MISMATCH');
      }
      if (idem.trang_thai === 'HOAN_TAT') {
        return idem.noi_dung_phan_hoi; // Trả lại kết quả cũ
      }
    }

    // 2. FACTORY METHOD (Validate & Build Header)
    const factory = OrderFactory.getFactory(dto.loai_don);
    factory.validate(dto);
    const header = factory.buildHeader(dto, ctx);

    let maDonHang;

    // 3. TẠO ĐƠN & XỬ LÝ CONCURRENCY (2 khách quét cùng 1 bàn)
    if (header.loai_don === 'TAI_BAN') {
      // Dùng pg_advisory_xact_lock để khóa bàn (ngăn 2 request đồng thời)
      await client.query('SELECT pg_advisory_xact_lock($1)', [header.ma_ban]);

      // Tìm đơn đang mở của bàn này (Get-or-Create)
      const { rows: existing } = await client.query(
        `SELECT ma_don_hang FROM don_hang 
         WHERE ma_ban = $1 AND trang_thai_don NOT IN ('DA_THANH_TOAN', 'DA_HUY', 'DA_GOP')
         FOR UPDATE`,
        [header.ma_ban]
      );

      if (existing.length > 0) {
        maDonHang = existing[0].ma_don_hang; // Dùng chung đơn cũ
      } else {
        // Tạo đơn mới (Trigger tự sinh mã đơn DH-...)
        const { rows: newDon } = await client.query(
          `INSERT INTO don_hang (loai_don, ma_ban, ma_tai_khoan, so_khach, ghi_chu)
           VALUES ($1, $2, $3, $4, $5) RETURNING ma_don_hang`,
          [header.loai_don, header.ma_ban, header.ma_tai_khoan, header.so_khach, header.ghi_chu]
        );
        maDonHang = newDon[0].ma_don_hang;
      }
    } else {
      // Đơn mang đi / giao hàng (Tạo mới trực tiếp)
      const { rows: newDon } = await client.query(
        `INSERT INTO don_hang (loai_don, ten_nguoi_nhan, so_dien_thoai_nhan, dia_chi_giao, ghi_chu, ma_tai_khoan)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING ma_don_hang`,
        [header.loai_don, header.ten_nguoi_nhan, header.so_dien_thoai_nhan, header.dia_chi_giao, header.ghi_chu, header.ma_tai_khoan]
      );
      maDonHang = newDon[0].ma_don_hang;
    }

    // 4. THÊM MÓN VÀO ĐƠN (Dùng ON CONFLICT gộp dòng - Đã test 5/5)
    for (const item of dto.items) {
      await client.query(
        `INSERT INTO chi_tiet_don_hang (ma_don_hang, ma_mon_an, so_luong, ghi_chu)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (ma_don_hang, ma_mon_an, (COALESCE(ghi_chu, '')))
           WHERE trang_thai_bep = 'CHO_NAU'
         DO UPDATE SET so_luong = chi_tiet_don_hang.so_luong + EXCLUDED.so_luong`,
        [maDonHang, item.ma_mon_an, item.so_luong, item.ghi_chu || null]
      );
    }

    // 5. Đọc lại thông tin đơn
    const { rows: [finalOrder] } = await client.query(
      'SELECT * FROM v_don_hang_tong_quan WHERE ma_don_hang = $1',
      [maDonHang]
    );

    // 6. CẬP NHẬT IDEMPOTENCY = HOÀN TẤT (Lưu lại response)
    if (idempotencyKey) {
      await client.query(
        `UPDATE khoa_idempotency 
         SET trang_thai = 'HOAN_TAT', noi_dung_phan_hoi = $1 
         WHERE khoa = $2 AND endpoint = 'POST /orders'`,
        [JSON.stringify(finalOrder), idempotencyKey]
      );
    }

    return finalOrder;
  });
}

export async function confirmOrder(maDonHang, userId) {
  // 1. Chạy transaction và LƯU kết quả vào biến result
  const result = await withTx({ userId }, async (client) => {
    const { rows: [order] } = await client.query(
      'SELECT * FROM don_hang WHERE ma_don_hang = $1 FOR UPDATE', [maDonHang]
    );
    if (!order) throw AppError.notFound('Đơn hàng không tồn tại');
    if (order.trang_thai_don !== 'MOI_TAO') {
      throw AppError.badRequest('Chỉ có thể gửi bếp cho đơn đang ở trạng thái MOI_TAO');
    }

    // Gọi function DB có sẵn: Tách phiếu theo trạm, tự đổi trạng thái đơn
    const { rows: [res] } = await client.query(
      'SELECT fn_gui_xuong_bep($1) AS so_phieu', [maDonHang]
    );

    // Trả về thêm ma_don_hang để tí nữa bắn Socket
    return { so_phieu: res.so_phieu, ma_don_hang: maDonHang };
  });

  // 2. SAU KHI COMMIT THÀNH CÔNG -> Mới bắn sự kiện Observer (Socket.io)
  // Nếu so_phieu > 0 tức là có phiếu bếp mới được tạo
  if (result.so_phieu > 0) {
    eventBus.emit(EVENTS.KITCHEN_TICKET_CREATED, { 
      ma_don_hang: result.ma_don_hang 
    });
  }

  // 3. Trả kết quả về cho Controller
  return result;
}

// Phục vụ xác nhận món đã ra bàn
export async function serveItem(itemId, userId) {
  return await withTx({ userId }, async (client) => {
    const { rows: [item] } = await client.query(
      'SELECT trang_thai_bep, ma_don_hang, ma_ban FROM chi_tiet_don_hang JOIN don_hang USING(ma_don_hang) WHERE ma_chi_tiet_don_hang = $1',
      [itemId]
    );
    
    if (!item) throw AppError.notFound('Không tìm thấy món');
    if (item.trang_thai_bep !== 'DA_XONG') {
      throw AppError.badRequest('Chỉ món đã nấu xong (DA_XONG) mới được phục vụ');
    }

    await client.query(
      "SELECT fn_cap_nhat_trang_thai_mon($1, 'DA_PHUC_VU', $2)",
      [itemId, userId]
    );
    
    return item;
  });
}

// Lấy danh sách tất cả đơn hàng
export async function getOrders() {
  return await repo.getOrders();
}

// Lấy chi tiết 1 đơn hàng
export async function getOrderById(maDonHang) {
  const order = await repo.getOrderById(maDonHang);
  if (!order) {
    throw AppError.notFound('Không tìm thấy đơn hàng');
  }
  return order;
}

// Hủy đơn hàng
export async function cancelOrder(maDonHang, lyDo, userId) {
  return await withTx({ userId }, async (client) => {
    // Gọi function DB có sẵn: Hủy đơn, hoàn bàn, hủy các món chưa nấu
    await client.query('SELECT fn_huy_don_hang($1, $2, $3)', [maDonHang, lyDo, userId]);
    return { ok: true };
  });
}

// Hủy 1 món
export async function cancelItem(itemId, lyDo, userId) {
  return await withTx({ userId }, async (client) => {
    // Gọi function DB có sẵn: Đổi trạng thái món thành DA_HUY
    await client.query('SELECT fn_cap_nhat_trang_thai_mon($1, $2, $3, $4)', [itemId, 'DA_HUY', userId, lyDo]);
    return { ok: true };
  });
}

export async function applyCoupon(maDonHang, code, userId) {
  return await withTx({ userId }, async (client) => {
    const { rows } = await client.query('SELECT fn_ap_dung_ma_giam_gia($1, $2) AS so_tien_giam', [maDonHang, code]);
    return { so_tien_giam: rows[0].so_tien_giam };
  });
}

export async function removeCoupon(maDonHang, userId) {
  return await withTx({ userId }, async (client) => {
    await client.query('SELECT fn_go_ma_giam_gia($1)', [maDonHang]);
    return { ok: true };
  });
}