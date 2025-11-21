import bcrypt from 'bcryptjs';
import { getPool } from '../config/db.js';
import { BadRequest, NotFound } from '../utils/httpErrors.js';

export async function getAllUsers() {
    const pool = await getPool();
    const [rows] = await pool.query(
        `SELECT 
      u.id,
      u.nombre,
      u.apellido,
      u.email,
      u.dni,
      u.rol,
      u.email_verificado,
      u.creado,
      COALESCE(u.activo, p.activo, 1) AS activo
    FROM usuarios u
    LEFT JOIN pacientes p ON p.id_usuario = u.id
    ORDER BY u.creado DESC`
    );
    return rows.map(u => ({
        id: u.id,
        nombre: u.nombre,
        apellido: u.apellido,
        name: u.nombre + (u.apellido ? ' ' + u.apellido : ''),
        email: u.email,
        dni: u.dni,
        role: u.rol,
        email_verificado: Boolean(u.email_verificado),
        creado: u.creado,
        activo: u.activo !== null ? Boolean(u.activo) : true
    }));
}

export async function createAdmin({ nombre, apellido = '', email, password, dni }) {
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
       VALUES (?,?,?,?,?,?,1,1)`,
            [nombre, apellido, email, hash, 'ADMIN', dni || null]
        );
        const userId = result.insertId;

        await conn.commit();

        return {
            id: userId,
            nombre,
            apellido,
            name: nombre + (apellido ? ' ' + apellido : ''),
            email,
            dni,
            role: 'ADMIN',
            email_verificado: true,
            creado: new Date(),
            activo: true
        };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

export async function updateUserRole(userId, newRole) {
    if (!['ADMIN', 'MEDICO', 'PACIENTE'].includes(newRole)) {
        throw new BadRequest('Rol inválido');
    }

    const pool = await getPool();
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Verificar que el usuario existe
        const [userRows] = await conn.query('SELECT id, rol FROM usuarios WHERE id = ?', [userId]);
        if (!userRows.length) {
            await conn.rollback();
            throw new NotFound('Usuario no encontrado');
        }

        const oldRole = userRows[0].rol;

        // Si el rol no cambió, no hacer nada
        if (oldRole === newRole) {
            await conn.rollback();
            return { message: 'El usuario ya tiene ese rol' };
        }

        // Actualizar el rol
        await conn.query('UPDATE usuarios SET rol = ? WHERE id = ?', [newRole, userId]);

        // Si el usuario era PACIENTE y ahora no lo es, eliminar de pacientes
        if (oldRole === 'PACIENTE' && newRole !== 'PACIENTE') {
            await conn.query('DELETE FROM pacientes WHERE id_usuario = ?', [userId]);
        }

        // Si el usuario era MEDICO y ahora no lo es, eliminar de doctores
        if (oldRole === 'MEDICO' && newRole !== 'MEDICO') {
            await conn.query('DELETE FROM doctores WHERE id_usuario = ?', [userId]);
            await conn.query('DELETE FROM doctores_especialidades WHERE id_doctor = ?', [userId]);
        }

        // Si el nuevo rol es PACIENTE, crear registro en pacientes si no existe
        if (newRole === 'PACIENTE') {
            const [pacienteExists] = await conn.query('SELECT id_usuario FROM pacientes WHERE id_usuario = ?', [userId]);
            if (!pacienteExists.length) {
                await conn.query(
                    `INSERT INTO pacientes (id_usuario, fecha_nacimiento, genero, activo)
           VALUES (?, NULL, NULL, 1)`,
                    [userId]
                );
            }
        }

        // Si el nuevo rol es MEDICO, crear registro en doctores si no existe
        if (newRole === 'MEDICO') {
            const [doctorExists] = await conn.query('SELECT id_usuario FROM doctores WHERE id_usuario = ?', [userId]);
            if (!doctorExists.length) {
                await conn.query(
                    `INSERT INTO doctores (id_usuario, numero_licencia, bio)
           VALUES (?, '', NULL)`,
                    [userId]
                );
            }
        }

        await conn.commit();

        // Obtener el usuario actualizado
        const [updatedRows] = await conn.query(
            `SELECT 
        u.id,
        u.nombre,
        u.apellido,
        u.email,
        u.dni,
        u.rol,
        u.email_verificado,
        u.creado,
        COALESCE(u.activo, p.activo, 1) AS activo
      FROM usuarios u
      LEFT JOIN pacientes p ON p.id_usuario = u.id
      WHERE u.id = ?`,
            [userId]
        );

        const u = updatedRows[0];
        return {
            id: u.id,
            nombre: u.nombre,
            apellido: u.apellido,
            name: u.nombre + (u.apellido ? ' ' + u.apellido : ''),
            email: u.email,
            dni: u.dni,
            role: u.rol,
            email_verificado: Boolean(u.email_verificado),
            creado: u.creado,
            activo: u.activo !== null ? Boolean(u.activo) : true
        };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

export async function updateUser(userId, { nombre, apellido, email, dni, password }) {
    const pool = await getPool();
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Verificar que el usuario existe
        const [userRows] = await conn.query('SELECT id, email FROM usuarios WHERE id = ?', [userId]);
        if (!userRows.length) {
            await conn.rollback();
            throw new NotFound('Usuario no encontrado');
        }

        const currentEmail = userRows[0].email;

        // Validar email si se está cambiando
        if (email && email !== currentEmail) {
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                await conn.rollback();
                throw new BadRequest('Email inválido');
            }
            // Verificar que el nuevo email no esté en uso
            const [emailExists] = await conn.query('SELECT id FROM usuarios WHERE email = ? AND id != ?', [email, userId]);
            if (emailExists.length) {
                await conn.rollback();
                throw new BadRequest('Email ya registrado');
            }
        }

        // Validar contraseña si se está cambiando
        if (password) {
            if (!isStrong(password)) {
                await conn.rollback();
                throw new BadRequest('Contraseña débil (mínimo 8 caracteres)');
            }
        }

        // Construir la query de actualización dinámicamente
        const updates = [];
        const values = [];

        if (nombre !== undefined) {
            updates.push('nombre = ?');
            values.push(nombre);
        }
        if (apellido !== undefined) {
            updates.push('apellido = ?');
            values.push(apellido);
        }
        if (email && email !== currentEmail) {
            updates.push('email = ?');
            values.push(email);
        }
        if (dni !== undefined) {
            updates.push('dni = ?');
            values.push(dni || null);
        }
        if (password) {
            const hash = await bcrypt.hash(password, 10);
            updates.push('hash_contrasena = ?');
            values.push(hash);
        }

        if (updates.length === 0) {
            await conn.rollback();
            throw new BadRequest('No hay datos para actualizar');
        }

        values.push(userId);
        await conn.query(
            `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        await conn.commit();

        // Obtener el usuario actualizado
        const [updatedRows] = await conn.query(
            `SELECT 
        u.id,
        u.nombre,
        u.apellido,
        u.email,
        u.dni,
        u.rol,
        u.email_verificado,
        u.creado,
        COALESCE(u.activo, p.activo, 1) AS activo
      FROM usuarios u
      LEFT JOIN pacientes p ON p.id_usuario = u.id
      WHERE u.id = ?`,
            [userId]
        );

        const u = updatedRows[0];
        return {
            id: u.id,
            nombre: u.nombre,
            apellido: u.apellido,
            name: u.nombre + (u.apellido ? ' ' + u.apellido : ''),
            email: u.email,
            dni: u.dni,
            role: u.rol,
            email_verificado: Boolean(u.email_verificado),
            creado: u.creado,
            activo: u.activo !== null ? Boolean(u.activo) : true
        };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

export async function toggleUserStatus(userId) {
    const pool = await getPool();
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [rows] = await conn.query('SELECT id, rol, activo FROM usuarios WHERE id = ? FOR UPDATE', [userId]);
        if (!rows.length) {
            await conn.rollback();
            throw new NotFound('Usuario no encontrado');
        }
        const user = rows[0];
        const current = (user.activo === null || user.activo === undefined) ? 1 : user.activo;
        const next = current ? 0 : 1;

        await conn.query('UPDATE usuarios SET activo = ? WHERE id = ?', [next, userId]);

        if (user.rol === 'PACIENTE') {
            const [pRows] = await conn.query('SELECT id_usuario FROM pacientes WHERE id_usuario = ?', [userId]);
            if (pRows.length) {
                await conn.query('UPDATE pacientes SET activo = ? WHERE id_usuario = ?', [next, userId]);
            } else {
                await conn.query('INSERT INTO pacientes (id_usuario, fecha_nacimiento, genero, activo) VALUES (?, NULL, NULL, ?)', [userId, next]);
            }
        }

        await conn.commit();
        return { id: userId, activo: !!next };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

function isStrong(pw) {
    return pw.length >= 8;
}