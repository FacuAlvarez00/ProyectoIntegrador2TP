import bcrypt from 'bcryptjs';
import { getPool } from '../config/db.js';
import { signToken } from '../utils/jwt.js';
import { BadRequest, Unauthorized } from '../utils/httpErrors.js';
import { sendMail } from '../utils/mailer.js';
import crypto from 'crypto';
import { ENV } from '../config/env.js';

export async function register({ nombre, apellido = '', email, password, role, dni }) {
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
            `INSERT INTO usuarios (nombre, apellido, email, hash_contrasena, rol, dni, email_verificado, activo)
       VALUES (?,?,?,?,?,?,0,1)`,
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
            activo: true
        };
        const token = signToken({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            activo: user.activo
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
            COALESCE(u.activo, IFNULL(p.activo, 1)) AS activo,
            u.intentos_fallidos, u.bloqueado_hasta
     FROM usuarios u
     LEFT JOIN pacientes p ON p.id_usuario = u.id
     WHERE u.email = ?`,
        [email]
    );

    if (!rows.length) throw new Unauthorized('Credenciales inválidas');
    const u = rows[0];

    // Bloquear login si la cuenta está inactiva (activo === 0)
    const isActive = Boolean(u.activo);
    if (!isActive) {
        throw new Unauthorized('Cuenta inactiva');
    }

    // Verificar si la cuenta está temporalmente bloqueada
    if (u.bloqueado_hasta && new Date(u.bloqueado_hasta) > new Date()) {
        const checkTime = Math.ceil((new Date(u.bloqueado_hasta) - new Date()) / 60000);
        throw new Unauthorized(`Cuenta temporalmente bloqueada por múltiples intentos fallidos. Intente nuevamente en ${checkTime} minutos.`);
    }

    const ok = await bcrypt.compare(password, u.hash_contrasena);
    if (!ok) {
        const fallos = (u.intentos_fallidos || 0) + 1;
        
        if (fallos >= 3) {
            // Bloqueamos la cuenta por 15 minutos exactos del primer error
            const bloqueado_hasta = new Date(Date.now() + 15 * 60000);
            await pool.query(
                `UPDATE usuarios SET intentos_fallidos = ?, bloqueado_hasta = ? WHERE id = ?`, 
                [fallos, bloqueado_hasta, u.id]
            );
            throw new Unauthorized('Cuenta temporalmente bloqueada por múltiples intentos fallidos. Intente nuevamente en 15 minutos.');
        } else {
            // Guardamos el intento fallido
            await pool.query(
                `UPDATE usuarios SET intentos_fallidos = ? WHERE id = ?`, 
                [fallos, u.id]
            );
            throw new Unauthorized('Credenciales inválidas');
        }
    }

    // Restablecer los intentos en login exitoso
    if (u.intentos_fallidos > 0 || u.bloqueado_hasta) {
        await pool.query(`UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?`, [u.id]);
    }

    const user = {
        id: u.id,
        name: (u.nombre + (u.apellido ? ' ' + u.apellido : '')),
        email: u.email,
        role: u.rol,
        activo: true
    };
    const token = signToken({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        activo: user.activo
    });
    return { user, token };
}

export async function forgotPassword(email, origin = '') {
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