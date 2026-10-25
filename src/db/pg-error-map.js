// Chuyển lỗi PostgreSQL (SQLSTATE) → AppError với HTTP status phù hợp
// Đọc kỹ các mã lỗi tại: https://www.postgresql.org/docs/current/errcodes-appendix.html
import { AppError } from '../shared/AppError.js';

export function mapPgError(error) {
  // Nếu đã là AppError (lỗi nghiệp vụ do backend throw) → giữ nguyên
  if (error instanceof AppError) return error;

  // Nếu không phải lỗi PostgreSQL (không có .code) → giữ nguyên
  if (!error || !error.code) return error;

  const msg = error.message || '';
  let mapped;

  switch (error.code) {
    // ─── Nhóm lỗi ràng buộc dữ liệu ───
    case '23505': // UNIQUE VIOLATION
      mapped = new AppError(
        _translateUniqueMessage(msg),
        409,
        'DUPLICATE_DATA'
      );
      break;

    case '23503': // FOREIGN KEY VIOLATION
      mapped = new AppError(
        'Dữ liệu tham chiếu không tồn tại hoặc đang được sử dụng.',
        400,
        'INVALID_REFERENCE'
      );
      break;

    case '23502': // NOT NULL VIOLATION
      mapped = new AppError(
        _translateNotNullMessage(msg),
        400,
        'MISSING_FIELD'
      );
      break;

    case '23514': // CHECK VIOLATION
      mapped = new AppError(
        _translateCheckMessage(msg),
        400,
        'INVALID_DATA'
      );
      break;

    // ─── Nhóm lỗi do RAISE EXCEPTION trong Trigger (P0001) ───
    case 'P0001': // Trigger RAISE (business rule vi phạm)
      mapped = new AppError(msg, 400, 'BUSINESS_RULE_VIOLATION');
      break;

    // ─── Nhóm lỗi concurrency ───
    case '40001': // SERIALIZATION FAILURE
    case '40P01': // DEADLOCK DETECTED
      mapped = new AppError(
        'Hệ thống đang bận, vui lòng thử lại.',
        409,
        'CONCURRENCY_CONFLICT'
      );
      mapped.retryable = true;
      break;

    case '57014': // QUERY CANCELED (statement_timeout)
      mapped = new AppError('Truy vấn quá thời gian xử lý.', 504, 'QUERY_TIMEOUT');
      break;

    case '53300': // TOO_MANY_CONNECTIONS
      mapped = new AppError('Hệ thống đang quá tải.', 503, 'TOO_MANY_CONNECTIONS');
      break;

    // ─── Nhóm lỗi khác ───
    case '22P02': // INVALID TEXT REPRESENTATION (VD: chuyển string sang int fail)
      mapped = new AppError('Dữ liệu không đúng định dạng.', 400, 'INVALID_FORMAT');
      break;

    case '22003': // NUMERIC VALUE OUT OF RANGE
      mapped = new AppError('Giá trị số vượt quá giới hạn.', 400, 'NUMBER_OUT_OF_RANGE');
      break;

    // ─── Mặc định: lỗi hệ thống, không lộ chi tiết cho client ───
    default:
      mapped = new AppError(
        'Lỗi hệ thống, vui lòng thử lại sau.',
        500,
        'DATABASE_ERROR'
      );
      mapped.originalCode = error.code;
      mapped.originalMessage = msg; // giữ lại để log
      break;
  }

  // Giữ stack trace của lỗi gốc
  mapped.stack = error.stack;
  return mapped;
}

// ─── Các hàm dịch message thân thiện ───

function _translateUniqueMessage(msg) {
  if (msg.includes('uq_tai_khoan_ten_dang_nhap')) return 'Tên đăng nhập đã tồn tại.';
  if (msg.includes('uq_tai_khoan_email')) return 'Email đã được sử dụng.';
  if (msg.includes('uq_tai_khoan_so_dien_thoai')) return 'Số điện thoại đã được sử dụng.';
  if (msg.includes('uq_don_hang_ma_don')) return 'Mã đơn hàng đã tồn tại.';
  if (msg.includes('uq_ma_qr_ban_hieu_luc')) return 'Bàn này đã có QR hiệu lực.';
  if (msg.includes('uq_thanh_toan_thanh_cong_theo_don')) return 'Đơn hàng đã có thanh toán thành công.';
  if (msg.includes('uq_chi_tiet_don_hang_dong_trung')) return 'Món ăn (cùng ghi chú) đã có trong đơn, hãy cập nhật số lượng thay vì thêm mới.';
  if (msg.includes('uq_ban_an_ten_ban_theo_khu_vuc')) return 'Tên bàn đã tồn tại trong khu vực này.';
  if (msg.includes('uq_mon_an_ten_theo_danh_muc')) return 'Tên món đã tồn tại trong danh mục này.';
  if (msg.includes('uq_don_hang_mot_don_mo_moi_ban')) return 'Bàn này đang có đơn mở, không thể tạo thêm.';
  if (msg.includes('uq_phien_dang_nhap_refresh')) return 'Phiên đăng nhập trùng lặp.';
  return 'Dữ liệu đã tồn tại trong hệ thống.';
}

function _translateNotNullMessage(msg) {
  const match = msg.match(/column "([^"]+)"/);
  const col = match ? match[1] : 'trường bắt buộc';
  return `Thiếu giá trị bắt buộc: ${col}`;
}

function _translateCheckMessage(msg) {
  if (msg.includes('ck_don_hang_ban_theo_loai')) {
    return 'Đơn tại bàn phải có bàn; đơn mang đi/giao hàng không được có bàn.';
  }
  if (msg.includes('ck_don_hang_giao_hang')) {
    return 'Đơn giao hàng phải có số điện thoại và địa chỉ người nhận.';
  }
  if (msg.includes('ck_chi_tiet_don_hang_so_luong')) {
    return 'Số lượng món phải lớn hơn 0.';
  }
  if (msg.includes('ck_thanh_toan_so_tien')) {
    return 'Số tiền thanh toán phải lớn hơn 0.';
  }
  return 'Dữ liệu vi phạm ràng buộc kiểm tra.';
}