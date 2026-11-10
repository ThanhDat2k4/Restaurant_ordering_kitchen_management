import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middlewares/validate.js'; // (Cần tạo file này - xem bước 3)
import { authenticate } from '../../middlewares/authenticate.js';
import * as controller from './auth.controller.js';
import { loginSchema } from './auth.schema.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Quá nhiều lần thử, vui lòng đợi 1 phút' } }
});

router.post('/login', loginLimiter, validate(loginSchema), controller.login);
router.post('/refresh', controller.refresh);

router.use(authenticate); // Các route bên dưới đều cần login
router.post('/logout', controller.logout);
router.get('/me', controller.me);

export default router;