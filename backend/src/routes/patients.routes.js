import { Router } from 'express';
import * as ctrl from '../controllers/patients.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, requireRole('ADMIN'), ctrl.list);

export default router;

