import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import * as controller from './setting.controller.js';

const router = Router();
router.use(authenticate, authorize('QUAN_LY'));

router.get('/', controller.getSettings);
router.patch('/:khoa', controller.updateSetting);

export default router;