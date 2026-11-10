import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Vui lòng nhập tên đăng nhập, email hoặc SĐT'),
  mat_khau: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});