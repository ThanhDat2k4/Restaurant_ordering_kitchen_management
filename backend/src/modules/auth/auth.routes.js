import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import * as controller from './auth.controller.js';
import { loginSchema, createEmployeeSchema } from './auth.schema.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Quá nhiều lần thử, vui lòng đợi 1 phút' } }
});

router.post('/login', loginLimiter, validate(loginSchema), controller.login);
router.post('/refresh', controller.refresh);

// Các route bên dưới đều cần login
router.use(authenticate); 
router.post('/logout', controller.logout);
router.post('/change-password', authenticate, controller.changePassword);
router.get('/employees', authorize('QUAN_LY'), controller.getEmployees);
router.post('/employees', authorize('QUAN_LY'), validate(createEmployeeSchema), controller.createEmployee);
router.get('/me', controller.me);

export default router;