import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import * as controller from './payment.controller.js';
const router = Router();

router.use(authenticate, authorize('THU_NGAN', 'QUAN_LY', 'PHUC_VU'));
router.post('/orders/:id/payments', controller.pay);
router.patch('/payments/:id/confirm', authenticate, authorize('THU_NGAN', 'QUAN_LY'), controller.confirmManual);

export default router;