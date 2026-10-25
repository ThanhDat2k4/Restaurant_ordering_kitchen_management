import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import * as controller from './auth.controller.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
} from './auth.schema.js';

const router = Router();

// Rate limit cho login (chống brute force): 10 req/phút/IP
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: { code: 'RATE_LIMITED', message: 'Quá nhiều lần thử, vui lòng đợi 1 phút' } },
});

// Rate limit cho register: 5 req/15 phút/IP
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: { code: 'RATE_LIMITED', message: 'Quá nhiều lần đăng ký' } },
});

// ─── Public routes ───
router.post('/register', registerLimiter, validate(registerSchema), controller.register);
router.post('/login', loginLimiter, validate(loginSchema), controller.login);
router.post('/refresh', validate(refreshSchema), controller.refresh);

// ─── Protected routes ───
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.me);
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  controller.changePassword
);

export default router;