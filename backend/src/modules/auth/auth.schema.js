import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Vui lòng nhập tên đăng nhập, email hoặc SĐT'),
  mat_khau: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export const createEmployeeSchema = z.object({
  ho_ten: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  ten_dang_nhap: z.string().min(3, 'Tên đăng nhập tối thiểu 3 ký tự'),
  mat_khau: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  so_dien_thoai: z.string().optional().or(z.literal('')),
  ma_vai_tro: z.enum(['PHUC_VU', 'DAU_BEP', 'THU_NGAN'], {
    message: 'Chỉ được tạo tài khoản Phục vụ, Đầu bếp hoặc Thu ngân'
  }),
  ma_tram: z.array(z.number()).optional(), // Dành cho Đầu bếp (gán vào trạm nào)
});