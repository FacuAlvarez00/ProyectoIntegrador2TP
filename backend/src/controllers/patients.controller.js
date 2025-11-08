import * as svc from '../services/patients.service.js';

export async function list(req, res, next) {
  try {
    const data = await svc.listPatients();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

