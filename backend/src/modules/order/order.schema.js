import { z } from 'zod';

export const createOrderSchema = z.object({
  loai_don: z.enum(['TAI_BAN', 'MANG_DI', 'GIAO_HANG']),
  ma_ban: z.number().int().positive().optional(),
  so_khach: z.number().int().positive().optional(),
  ghi_chu: z.string().optional(),
  ten_nguoi_nhan: z.string().optional(),
  so_dien_thoai_nhan: z.string().optional(),
  dia_chi_giao: z.string().optional(),
  items: z.array(
    z.object({
      ma_mon_an: z.number().int().positive(),
      so_luong: z.number().int().positive().max(20),
      ghi_chu: z.string().nullable().optional(),
    })
  ).min(1, 'Đơn hàng phải có ít nhất 1 món'),
});