import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/forgot', ctrl.forgotPassword);
router.post('/reset', ctrl.resetPassword);
router.get('/me', requireAuth, ctrl.me);

export default router;
