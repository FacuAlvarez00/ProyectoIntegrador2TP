import * as svc from '../services/doctors.service.js';

export async function list(req, res, next) {
  try {
    const data = await svc.listAll();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

