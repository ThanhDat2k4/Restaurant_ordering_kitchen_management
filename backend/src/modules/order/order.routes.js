import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { authenticateTable } from '../../middlewares/authenticate-table.js';
import { validate } from '../../middlewares/validate.js';
import { createOrderSchema } from './order.schema.js';
import * as controller from './order.controller.js';

const router = Router();

// Middleware linh hoạt: Cho phép cả nhân viên HOẶC khách (table token)
function allowStaffOrGuest(req, res, next) {
  if (req.headers.authorization) {
    // Thử auth cho nhân viên trước
    authenticate(req, res, (err) => {
      if (!err) return next();
      // Nếu nhân viên fail -> thử auth cho khách
      authenticateTable(req, res, next);
    });
  } else {
    next(AppError.unauthorized('Thiếu token xác thực'));
  }
}

router.post('/', allowStaffOrGuest, validate(createOrderSchema), controller.createOrder);

// Các route dành cho nhân viên
router.get('/', authenticate, authorize('PHUC_VU', 'QUAN_LY'), controller.getOrders);
router.get('/:id', authenticate, controller.getOrderById);
router.post('/:id/confirm', authenticate, authorize('PHUC_VU', 'QUAN_LY'), controller.confirmOrder);
router.patch(
  '/items/:itemId/serve', 
  authenticate, 
  authorize('PHUC_VU', 'QUAN_LY'), 
  controller.serveItem
);

export default router;