import { Router } from 'express';
import * as ctrl from '../controllers/especialidades.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, ctrl.listar);
router.get('/:id', requireAuth, ctrl.obtener);
router.post('/', requireAuth, requireRole('ADMIN'), ctrl.crear);
router.put('/:id', requireAuth, requireRole('ADMIN'), ctrl.actualizar);
router.delete('/:id', requireAuth, requireRole('ADMIN'), ctrl.eliminar);

export default router;
