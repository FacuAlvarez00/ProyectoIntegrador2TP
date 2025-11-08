import { getPool } from '../config/db.js';
import { BadRequest } from '../utils/httpErrors.js';

export async function listar({ search='' } = {}){
  const pool = await getPool();
  const like = `%${search}%`;
  const [rows] = await pool.execute(
    'SELECT id, nombre FROM especialidades WHERE (? = "" OR nombre LIKE ?) ORDER BY nombre ASC',
    [search, like]
  );
  return rows;
}

export async function obtener(id){
  const pool = await getPool();
  const [rows] = await pool.execute('SELECT id, nombre FROM especialidades WHERE id = ?', [id]);
  return rows[0] || null;
}

export async function crear({ nombre }){
  if (!nombre || !nombre.trim()) throw new BadRequest('Nombre requerido');
  const pool = await getPool();
  try {
    const [res] = await pool.execute('INSERT INTO especialidades (nombre) VALUES (?)', [nombre.trim()]);
    return { id: res.insertId, nombre: nombre.trim() };
  } catch (e) {
    if (String(e.message).includes('Duplicate')) throw new BadRequest('La especialidad ya existe');
    throw e;
  }
}

export async function actualizar(id, { nombre }){
  if (!nombre || !nombre.trim()) throw new BadRequest('Nombre requerido');
  const pool = await getPool();
  try {
    await pool.execute('UPDATE especialidades SET nombre = ? WHERE id = ?', [nombre.trim(), id]);
    return obtener(id);
  } catch (e) {
    if (String(e.message).includes('Duplicate')) throw new BadRequest('La especialidad ya existe');
    throw e;
  }
}

export async function eliminar(id){
  const pool = await getPool();
  try {
    await pool.execute('DELETE FROM especialidades WHERE id = ?', [id]);
  } catch (e) {
    if (String(e.message).includes('a foreign key constraint fails')) {
      throw new BadRequest('No se puede eliminar: la especialidad está en uso');
    }
    throw e;
  }
  return { ok: true };
}
