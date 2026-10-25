import { z } from 'zod';

// ─── Register (đăng ký khách hàng) ───
export const registerSchema = z.object({
  ten_dang_nhap: z
    .string()
    .min(3, 'Tên đăng nhập tối thiểu 3 ký tự')
    .max(50, 'Tên đăng nhập tối đa 50 ký tự')
    .regex(/^[a-zA-Z0-9_.]+$/, 'Chỉ chứa chữ, số, dấu . và _'),
  mat_khau: z
    .string()
    .min(8, 'Mật khẩu tối thiểu 8 ký tự')
    .max(72, 'Mật khẩu tối đa 72 ký tự'),
  ho_ten: z.string().min(2).max(100),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  so_dien_thoai: z
    .string()
    .regex(/^0[0-9]{9,10}$/, 'SĐT phải bắt đầu bằng 0, dài 10-11 số')
    .optional()
    .or(z.literal('')),
});

// ─── Login ───
export const loginSchema = z.object({
  identifier: z.string().min(1, 'Nhập tên đăng nhập / email / SĐT'),
  mat_khau: z.string().min(1, 'Nhập mật khẩu'),
});

// ─── Refresh ───
export const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

// ─── Change password ───
export const changePasswordSchema = z.object({
  mat_khau_cu: z.string().min(1),
  mat_khau_moi: z.string().min(8, 'Mật khẩu mới tối thiểu 8 ký tự').max(72),
});