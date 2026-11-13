import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import * as controller from './audit.controller.js';

const router = Router();
router.use(authenticate, authorize('QUAN_LY'));
router.get('/', controller.getAuditLogs);

export default router;