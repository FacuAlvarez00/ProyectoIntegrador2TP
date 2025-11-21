import { getPool } from '../config/db.js';
import { BadRequest } from '../utils/httpErrors.js';

export async function listPatients() {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT
       u.id,
       CONCAT(u.nombre, ' ', IFNULL(u.apellido, '')) AS name,
       u.email,
       u.dni,
       u.creado,
       IFNULL(p.activo, 1) AS activo
     FROM usuarios u
     LEFT JOIN pacientes p ON p.id_usuario = u.id
     WHERE u.rol = 'PACIENTE'
     ORDER BY u.creado DESC`
  );
  return rows.map(row => ({
    ...row,
    name: row.name.trim(),
    activo: row.activo === 1
  }));
}

export async function togglePatientStatus(id) {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[row]] = await conn.query(
      'SELECT activo FROM pacientes WHERE id_usuario = ? FOR UPDATE',
      [id]
    );
    if (!row) {
      throw new BadRequest('Paciente no encontrado');
    }
    const next = row.activo ? 0 : 1;
    await conn.query('UPDATE pacientes SET activo = ? WHERE id_usuario = ?', [next, id]);
    await conn.commit();
    return { id, activo: !!next };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

