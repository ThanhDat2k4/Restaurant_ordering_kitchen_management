import { AppError } from '../shared/app-error.js';

export function mapPgError(error) {
  if (error instanceof AppError) return error;
  if (!error || !error.code) return error;

  const msg = error.message || '';
  let mapped;

  switch (error.code) {
    case '23505': // UNIQUE
      mapped = new AppError(_translateUnique(msg), 409, 'DUPLICATE_DATA');
      break;
    case '23503': // FK
      mapped = new AppError('Dữ liệu tham chiếu không hợp lệ', 400, 'INVALID_REFERENCE');
      break;
    case '23502': // NOT NULL
      mapped = new AppError(_translateNotNull(msg), 400, 'MISSING_FIELD');
      break;
    case '23514': // CHECK
      mapped = new AppError('Dữ liệu vi phạm ràng buộc', 400, 'INVALID_DATA');
      break;
    case 'P0001': // RAISE EXCEPTION từ trigger
      mapped = new AppError(msg, 400, 'BUSINESS_RULE_VIOLATION');
      break;
    case '40001':
    case '40P01':
      mapped = new AppError('Hệ thống đang bận, thử lại sau', 409, 'CONCURRENCY_CONFLICT');
      mapped.retryable = true;
      break;
    default:
      mapped = new AppError('Lỗi hệ thống', 500, 'DATABASE_ERROR');
      mapped.originalCode = error.code;
      mapped.originalMessage = msg;
  }
  mapped.stack = error.stack;
  return mapped;
}

function _translateUnique(msg) {
  if (msg.includes('uq_tai_khoan_ten_dang_nhap')) return 'Tên đăng nhập đã tồn tại';
  if (msg.includes('uq_tai_khoan_email')) return 'Email đã được sử dụng';
  if (msg.includes('uq_tai_khoan_so_dien_thoai')) return 'Số điện thoại đã được sử dụng';
  if (msg.includes('uq_don_hang_ma_don')) return 'Mã đơn đã tồn tại';
  if (msg.includes('uq_thanh_toan_thanh_cong_theo_don')) return 'Đơn đã có thanh toán thành công';
  if (msg.includes('uq_hoa_don_phat_hanh_theo_don')) return 'Đơn đã có hóa đơn';
  if (msg.includes('uq_don_hang_mot_don_mo_moi_ban')) return 'Bàn đang có đơn mở';
  if (msg.includes('uq_chi_tiet_don_hang_dong_trung')) return 'Món đã có trong đơn';
  if (msg.includes('uq_ma_qr_ban_hieu_luc')) return 'Bàn đã có QR hiệu lực';
  return 'Dữ liệu đã tồn tại';
}

function _translateNotNull(msg) {
  const m = msg.match(/column "([^"]+)"/);
  return m ? `Thiếu trường bắt buộc: ${m[1]}` : 'Thiếu trường bắt buộc';
}