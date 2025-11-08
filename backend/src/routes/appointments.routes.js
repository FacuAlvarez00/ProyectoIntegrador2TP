import { Router } from 'express';
import * as ctrl from '../controllers/appointments.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/my', requireAuth, requireRole('PACIENTE', 'ADMIN'), ctrl.listMine);
router.get('/doctor/my', requireAuth, requireRole('MEDICO', 'ADMIN'), ctrl.listForDoctor);
router.post('/', requireAuth, requireRole('PACIENTE', 'ADMIN'), ctrl.create);
router.post('/:id/cancel', requireAuth, requireRole('PACIENTE', 'ADMIN'), ctrl.cancel);
router.post('/:id/doctor-cancel', requireAuth, requireRole('MEDICO', 'ADMIN'), ctrl.cancelByDoctor);

export default router;

