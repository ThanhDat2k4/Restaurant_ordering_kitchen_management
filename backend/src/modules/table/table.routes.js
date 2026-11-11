import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { authenticateTable } from '../../middlewares/authenticate-table.js';
import * as controller from './table.controller.js';

const router = Router();

// PUBLIC API (Dành cho khách)
// Đường dẫn: /api/v1/public/qr/:token
router.get('/public/qr/:token', controller.guestQr);
router.post('/public/table-session/call-staff', authenticateTable, controller.callStaff);

// NHÂN VIÊN API
// Đường dẫn: /api/v1/tables/map
router.get('/tables/map', authenticate, authorize('PHUC_VU', 'QUAN_LY'), controller.getTableMap);
router.post('/transfer-order', authenticate, authorize('PHUC_VU', 'QUAN_LY'), controller.transferOrder);
router.post('/merge-orders', authenticate, authorize('PHUC_VU', 'QUAN_LY'), controller.mergeOrders);

export default router;