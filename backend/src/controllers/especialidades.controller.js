import * as svc from '../services/especialidades.service.js';

export async function listar(req, res, next){
  try {
    const data = await svc.listar({ search: (req.query.search || '').trim() });
    res.json(data);
  } catch (e) { next(e); }
}

export async function obtener(req, res, next){
  try {
    const id = Number(req.params.id);
    const data = await svc.obtener(id);
    if (!data) return res.status(404).json({ message: 'No encontrado' });
    res.json(data);
  } catch (e) { next(e); }
}

export async function crear(req, res, next){
  try {
    const { nombre } = req.body;
    const data = await svc.crear({ nombre });
    res.status(201).json(data);
  } catch (e) { next(e); }
}

export async function actualizar(req, res, next){
  try {
    const id = Number(req.params.id);
    const { nombre } = req.body;
    const data = await svc.actualizar(id, { nombre });
    res.json(data);
  } catch (e) { next(e); }
}

export async function eliminar(req, res, next){
  try {
    const id = Number(req.params.id);
    const data = await svc.eliminar(id);
    res.json(data);
  } catch (e) { next(e); }
}
