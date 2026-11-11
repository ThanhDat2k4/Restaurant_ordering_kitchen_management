import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import * as controller from './kitchen.controller.js';
const router = Router();

router.use(authenticate, authorize('DAU_BEP', 'QUAN_LY'));
router.get('/tickets', controller.getTickets);
router.patch('/items/:itemId/status', controller.updateItemStatus);
export default router;