import * as svc from '../services/patients.service.js';

export async function list(req, res, next) {
  try {
    const data = await svc.listPatients();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function toggleStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await svc.togglePatientStatus(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

