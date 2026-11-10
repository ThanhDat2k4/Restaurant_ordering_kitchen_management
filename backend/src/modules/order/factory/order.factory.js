import { AppError } from '../../../shared/app-error.js';

// Lớp trừu tượng (Abstract Class) cho tất cả các loại đơn
class BaseOrderFactory {
  validate(dto) {
    throw new Error('Phải ghi đè phương thức validate()');
  }

  buildHeader(dto, ctx) {
    throw new Error('Phải ghi đè phương thức buildHeader()');
  }
}

// 1. Đơn tại bàn (Dine-in)
class DineInOrderFactory extends BaseOrderFactory {
  validate(dto) {
    if (!dto.ma_ban) throw AppError.badRequest('Đơn tại bàn bắt buộc phải có ma_ban');
  }

  buildHeader(dto, ctx) {
    return {
      loai_don: 'TAI_BAN',
      ma_ban: dto.ma_ban,
      ma_tai_khoan: ctx.userId || null,
      so_khach: dto.so_khach || null,
      ghi_chu: dto.ghi_chu || null,
      ten_nguoi_nhan: null,
      so_dien_thoai_nhan: null,
      dia_chi_giao: null,
    };
  }
}

// 2. Đơn mang đi (Takeaway)
class TakeAwayOrderFactory extends BaseOrderFactory {
  validate(dto) {
    if (!dto.so_dien_thoai_nhan) {
      throw AppError.badRequest('Đơn mang đi bắt buộc phải có số điện thoại');
    }
  }

  buildHeader(dto, ctx) {
    return {
      loai_don: 'MANG_DI',
      ma_ban: null,
      ma_tai_khoan: ctx.userId || null,
      so_khach: null,
      ghi_chu: dto.ghi_chu || null,
      ten_nguoi_nhan: dto.ten_nguoi_nhan || null,
      so_dien_thoai_nhan: dto.so_dien_thoai_nhan,
      dia_chi_giao: null,
    };
  }
}

// 3. Đơn giao hàng (Delivery)
class DeliveryOrderFactory extends BaseOrderFactory {
  validate(dto) {
    if (!dto.so_dien_thoai_nhan || !dto.dia_chi_giao) {
      throw AppError.badRequest('Đơn giao hàng bắt buộc phải có SĐT và địa chỉ');
    }
  }

  buildHeader(dto, ctx) {
    return {
      loai_don: 'GIAO_HANG',
      ma_ban: null,
      ma_tai_khoan: ctx.userId || null,
      so_khach: null,
      ghi_chu: dto.ghi_chu || null,
      ten_nguoi_nhan: dto.ten_nguoi_nhan || null,
      so_dien_thoai_nhan: dto.so_dien_thoai_nhan,
      dia_chi_giao: dto.dia_chi_giao,
    };
  }
}

// Registry map loại đơn với Factory tương ứng
const factories = {
  TAI_BAN: new DineInOrderFactory(),
  MANG_DI: new TakeAwayOrderFactory(),
  GIAO_HANG: new DeliveryOrderFactory(),
};

export class OrderFactory {
  static getFactory(loai_don) {
    const factory = factories[loai_don];
    if (!factory) throw AppError.badRequest('Loại đơn không hợp lệ');
    return factory;
  }
}