import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';

// Cấu hình nơi lưu và tên file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/'); // Thư mục lưu ảnh
  },
  filename: (req, file, cb) => {
    // Tạo tên file ngẫu nhiên để không trùng (VD: 1a2b3c4d.jpg)
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// Chỉ cho phép upload file ảnh
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, webp)'), false);
  }
};

export const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // Giới hạn 2MB
});