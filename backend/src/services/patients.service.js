import { getPool } from '../config/db.js';

export async function listPatients() {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT
       u.id,
       CONCAT(u.nombre, ' ', IFNULL(u.apellido, '')) AS name,
       u.email,
       u.dni,
       u.creado
     FROM usuarios u
     LEFT JOIN pacientes p ON p.id_usuario = u.id
     WHERE u.rol = 'PACIENTE'
     ORDER BY u.creado DESC`
  );
  return rows.map(row => ({
    ...row,
    name: row.name.trim(),
  }));
}

