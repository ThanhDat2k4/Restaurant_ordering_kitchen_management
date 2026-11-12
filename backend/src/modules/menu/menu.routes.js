import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import * as controller from './menu.controller.js';

const router = Router();

// Public API
router.get('/', controller.getMenu);
router.get('/:id', controller.getMenuItem);

// Admin API
router.patch('/items/:id/status', authenticate, authorize('QUAN_LY', 'DAU_BEP'), controller.updateStatus);
router.post('/items', authenticate, authorize('QUAN_LY'), controller.createMenuItem);

export default router;