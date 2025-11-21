import bcrypt from 'bcryptjs';
import { getPool } from '../config/db.js';
import { signToken } from '../utils/jwt.js';
import { BadRequest, Unauthorized } from '../utils/httpErrors.js';
import { sendMail } from '../utils/mailer.js';
import crypto from 'crypto';
import { ENV } from '../config/env.js';

export async function register({ nombre, apellido='', email, password, role, dni }) {
  if (!nombre || !email || !password) throw new BadRequest('Datos incompletos');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new BadRequest('Email inválido');
  if (!isStrong(password)) throw new BadRequest('Contraseña débil');

  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [exists] = await conn.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (exists.length) {
      await conn.rollback();
      throw new BadRequest('Email ya registrado');
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await conn.query(
      `INSERT INTO usuarios (nombre, apellido, email, hash_contrasena, rol, dni, email_verificado)
       VALUES (?,?,?,?,?,?,0)`,
      [nombre, apellido, email, hash, role, dni || null]
    );
    const userId = result.insertId;

    if (role === 'PACIENTE') {
      await conn.query(
        `INSERT INTO pacientes (id_usuario, fecha_nacimiento, genero)
         VALUES (?, NULL, NULL)`,
        [userId]
      );
    } else if (role === 'MEDICO') {
      await conn.query(
        `INSERT INTO doctores (id_usuario, numero_licencia, bio)
         VALUES (?, '', NULL)`,
        [userId]
      );
    }

    await conn.commit();

    const user = {
      id: userId,
      name: nombre + (apellido ? ' ' + apellido : ''),
      email,
      role,
      activo: role === 'PACIENTE' ? true : undefined
    };
    const token = signToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      ...(user.activo !== undefined ? { activo: user.activo } : {})
    });
    return { user, token };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function login({ email, password }) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT u.id, u.nombre, u.apellido, u.email, u.hash_contrasena, u.rol,
            IFNULL(p.activo, 1) AS activo
     FROM usuarios u
     LEFT JOIN pacientes p ON p.id_usuario = u.id
     WHERE u.email = ?`,
    [email]
  );
  if (!rows.length) throw new Unauthorized('Credenciales inválidas');
  const u = rows[0];
  const ok = await bcrypt.compare(password, u.hash_contrasena);
  if (!ok) throw new Unauthorized('Credenciales inválidas');
  const user = {
    id: u.id,
    name: (u.nombre + (u.apellido ? ' ' + u.apellido : '')),
    email: u.email,
    role: u.rol,
    activo: u.rol === 'PACIENTE' ? Boolean(u.activo) : undefined
  };
  const token = signToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    ...(user.activo !== undefined ? { activo: user.activo } : {})
  });
  return { user, token };
}

export async function forgotPassword(email, origin='') {
  const pool = await getPool();
  const [rows] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
  if (!rows.length) return; // ocultar existencia
  const userId = rows[0].id;

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + ENV.RESET_TOKEN_EXPIRES_MIN * 60 * 1000);
  await pool.query('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?,?,?)', [userId, token, expiresAt]);

  const resetUrl = origin ? `${origin}/reset?token=${token}` : `http://localhost:5173/reset?token=${token}`;
  await sendMail({
    to: email,
    subject: 'Recuperación de contraseña',
    text: `Usa este enlace para restablecer tu contraseña (expira en ${ENV.RESET_TOKEN_EXPIRES_MIN} minutos): ${resetUrl}`
  });
}

export async function resetPassword(token, newPassword) {
  if (!isStrong(newPassword)) throw new BadRequest('Contraseña débil');
  const pool = await getPool();
  const [rows] = await pool.query('SELECT user_id, expires_at FROM password_resets WHERE token = ?', [token]);
  if (!rows.length) throw new BadRequest('Token inválido');
  const { user_id, expires_at } = rows[0];
  if (new Date(expires_at) < new Date()) throw new BadRequest('Token expirado');

  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE usuarios SET hash_contrasena = ? WHERE id = ?', [hash, user_id]);
  await pool.query('DELETE FROM password_resets WHERE token = ?', [token]);
}

function isStrong(pw) {
  return pw.length >= 8;
}
