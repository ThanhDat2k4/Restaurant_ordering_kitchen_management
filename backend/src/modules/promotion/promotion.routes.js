import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import * as controller from './promotion.controller.js';

const router = Router();
router.use(authenticate, authorize('QUAN_LY'));

router.get('/', controller.getPromotions);
router.post('/', controller.createPromotion);
router.patch('/:id/status', controller.updateStatus);

export default router;