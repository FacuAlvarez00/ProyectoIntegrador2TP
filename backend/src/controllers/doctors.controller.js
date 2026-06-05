import * as svc from '../services/doctors.service.js';

export async function list(req, res, next) {
  try {
    const data = await svc.listAll();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { nombre, apellido, email, password, dni, specialty_id } = req.body;
    const doctor = await svc.createDoctor({ nombre, apellido, email, password, dni, specialty_id });
    res.status(201).json(doctor);
  } catch (err) {
    next(err);
  }
}

