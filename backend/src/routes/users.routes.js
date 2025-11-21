import { Router } from 'express';
import * as ctrl from '../controllers/users.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación y rol ADMIN
router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.get('/', ctrl.getAllUsers);
router.post('/', ctrl.createAdmin);
router.patch('/:id/role', ctrl.updateUserRole);
router.put('/:id', ctrl.updateUser);

export default router;

