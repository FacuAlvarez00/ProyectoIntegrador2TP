import { Router } from 'express';
import * as ctrl from '../controllers/doctors.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, ctrl.list);
router.post('/', requireAuth, requireRole('ADMIN'), ctrl.create);

export default router;

