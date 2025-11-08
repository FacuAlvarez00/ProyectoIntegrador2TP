import { getPool } from '../config/db.js';

export async function listAll() {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT
       d.id_usuario AS id,
       CONCAT(u.nombre, ' ', IFNULL(u.apellido, '')) AS name,
       (
         SELECT de.id_especialidad
         FROM doctores_especialidades de
         WHERE de.id_doctor = d.id_usuario
         ORDER BY de.id_especialidad
         LIMIT 1
       ) AS specialty_id,
       (
         SELECT e.nombre
         FROM doctores_especialidades de
         JOIN especialidades e ON e.id = de.id_especialidad
         WHERE de.id_doctor = d.id_usuario
         ORDER BY e.nombre
         LIMIT 1
       ) AS specialty_name
     FROM doctores d
     JOIN usuarios u ON u.id = d.id_usuario
     ORDER BY name`
  );

  return rows.map(row => ({
    id: row.id,
    name: row.name.trim(),
    specialty_id: row.specialty_id || null,
    specialty: row.specialty_name || null,
  }));
}

