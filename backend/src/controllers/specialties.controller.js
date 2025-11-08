import * as svc from '../services/especialidades.service.js';

export async function list(req, res, next) {
  try {
    const rows = await svc.listar({ search: (req.query.search || '').trim() });
    const data = rows.map(row => ({ id: row.id, name: row.nombre }));
    res.json(data);
  } catch (err) {
    next(err);
  }
}

