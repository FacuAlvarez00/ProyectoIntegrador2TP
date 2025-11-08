import * as svc from '../services/appointments.service.js';
import { BadRequest } from '../utils/httpErrors.js';

export async function listMine(req, res, next) {
  try {
    const data = await svc.listByPatient(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function listForDoctor(req, res, next) {
  try {
    const data = await svc.listByDoctor(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { doctor_id, specialty_id, date, time } = req.body;
    const data = await svc.createAppointment({
      patientId: req.user.id,
      doctorId: Number(doctor_id),
      specialtyId: Number(specialty_id),
      date,
      time,
    });
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

export async function cancel(req, res, next) {
  try {
    const { reason } = req.body || {};
    const appointmentId = Number(req.params.id);
    const data = await svc.cancelAppointment({
      appointmentId,
      patientId: req.user.id,
      reason,
      actor: 'PACIENTE',
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function cancelByDoctor(req, res, next) {
  try {
    const { reason } = req.body || {};
    if (!reason || reason.trim().length < 5) {
      throw new BadRequest('Indica un motivo (mínimo 5 caracteres)');
    }
    const appointmentId = Number(req.params.id);
    const data = await svc.cancelAppointment({
      appointmentId,
      doctorId: req.user.id,
      reason: reason.trim(),
      actor: 'MEDICO',
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

