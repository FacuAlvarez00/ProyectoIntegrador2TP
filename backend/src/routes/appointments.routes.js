import { Router } from 'express';
import * as ctrl from '../controllers/appointments.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// HU17 (ADMIN): Listar todos los turnos con filtros query param: ?status=Pendiente&doctor_id=1&date=2024-05-20
router.get('/all', requireAuth, requireRole('ADMIN', 'SECRETARIO'), ctrl.listAllForAdmin);

router.get('/my', requireAuth, requireRole('PACIENTE', 'ADMIN'), ctrl.listMine);
router.get('/doctor/my', requireAuth, requireRole('MEDICO', 'ADMIN'), ctrl.listForDoctor);

// HU15 (PACIENTE/ADMIN): Crear turno
router.post('/', requireAuth, requireRole('PACIENTE', 'ADMIN'), ctrl.create);

// HU16 (PACIENTE/ADMIN): Reprogramar turno
router.put('/:id/reschedule', requireAuth, requireRole('PACIENTE', 'ADMIN'), ctrl.update);

// HU18 (PACIENTE/MEDICO): Cancelar turno lógicamente
router.post('/:id/cancel', requireAuth, requireRole('PACIENTE', 'ADMIN'), ctrl.cancel);
router.post('/:id/doctor-cancel', requireAuth, requireRole('MEDICO', 'ADMIN'), ctrl.cancelByDoctor);

export default router;

