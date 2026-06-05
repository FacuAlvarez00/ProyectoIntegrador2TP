import bcrypt from 'bcryptjs';
import { getPool } from '../config/db.js';
import { BadRequest } from '../utils/httpErrors.js';

export async function createDoctor({ nombre, apellido = '', email, password, dni, specialty_id }) {
  if (!nombre || !email || !password) throw new BadRequest('Nombre, email y contraseña son obligatorios');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new BadRequest('Email inválido');
  if (password.length < 8) throw new BadRequest('La contraseña debe tener al menos 8 caracteres');

  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [exists] = await conn.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (exists.length) throw new BadRequest('El email ya está registrado');

    const hash = await bcrypt.hash(password, 10);
    const [result] = await conn.query(
      `INSERT INTO usuarios (nombre, apellido, email, hash_contrasena, rol, dni, email_verificado, activo)
       VALUES (?, ?, ?, ?, 'MEDICO', ?, 1, 1)`,
      [nombre, apellido, email, hash, dni || null]
    );
    const userId = result.insertId;

    await conn.query(
      `INSERT INTO doctores (id_usuario, numero_licencia, bio) VALUES (?, '', NULL)`,
      [userId]
    );

    if (specialty_id) {
      const [specExists] = await conn.query('SELECT id FROM especialidades WHERE id = ?', [specialty_id]);
      if (specExists.length) {
        await conn.query(
          `INSERT INTO doctores_especialidades (id_doctor, id_especialidad) VALUES (?, ?)`,
          [userId, specialty_id]
        );
      }
    }

    await conn.commit();
    return { id: userId, nombre, apellido, name: `${nombre} ${apellido}`.trim(), email, dni: dni || null, role: 'MEDICO' };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

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

