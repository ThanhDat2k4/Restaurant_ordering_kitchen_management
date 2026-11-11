import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import * as controller from './report.controller.js';

const router = Router();

// Tất cả API báo cáo chỉ dành cho Quản lý
router.use(authenticate, authorize('QUAN_LY'));

router.get('/dashboard', controller.getDashboard);
router.get('/revenue/daily', controller.getRevenueByDay);
router.get('/best-selling', controller.getBestSellingItems);
router.get('/kitchen-performance', controller.getKitchenPerformance);

export default router;