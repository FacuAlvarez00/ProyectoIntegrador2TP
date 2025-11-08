import { Router } from 'express';
import * as ctrl from '../controllers/specialties.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, ctrl.list);

export default router;

