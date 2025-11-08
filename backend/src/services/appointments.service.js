import { getPool } from '../config/db.js';
import { BadRequest } from '../utils/httpErrors.js';

const estadoCache = new Map();

async function getEstadoId(conn, nombre) {
  if (estadoCache.has(nombre)) return estadoCache.get(nombre);
  const [rows] = await conn.query('SELECT id FROM estados WHERE valor = ?', [nombre]);
  if (!rows.length) throw new Error(`Estado "${nombre}" no configurado en la base`);
  estadoCache.set(nombre, rows[0].id);
  return rows[0].id;
}

function normalizeDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new BadRequest('Fecha inválida (usar formato YYYY-MM-DD)');
  }
  return date;
}

function normalizeTime(time) {
  if (!/^\d{2}:\d{2}$/.test(time)) {
    throw new BadRequest('Hora inválida (usar formato HH:mm)');
  }
  return time;
}

export async function listByPatient(patientId) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT
       t.id,
       DATE(t.fecha_turno) AS date,
       DATE_FORMAT(t.fecha_turno, '%H:%i') AS time,
       CONCAT(doc.nombre, ' ', IFNULL(doc.apellido, '')) AS doctor_name,
       esp.nombre AS specialty_name,
       COALESCE(
         (
           SELECT est.valor
           FROM turnos_estado te
           JOIN estados est ON est.id = te.id_estado
           WHERE te.id_turno = t.id
           ORDER BY te.fecha DESC, te.id DESC
           LIMIT 1
         ),
         'Pendiente'
       ) AS status,
       (
         SELECT motivo
         FROM turnos_cancelaciones tc
         WHERE tc.turno_id = t.id
         ORDER BY tc.creado DESC, tc.id DESC
         LIMIT 1
       ) AS cancel_reason,
       (
         SELECT actor
         FROM turnos_cancelaciones tc
         WHERE tc.turno_id = t.id
         ORDER BY tc.creado DESC, tc.id DESC
         LIMIT 1
       ) AS cancel_actor
     FROM turnos t
     JOIN usuarios pac ON pac.id = t.id_paciente
     JOIN usuarios doc ON doc.id = t.id_doctor
     JOIN especialidades esp ON esp.id = t.id_especialidad
     WHERE t.id_paciente = ?
     ORDER BY t.fecha_turno DESC`,
    [patientId]
  );
  return rows.map(row => ({
    ...row,
    doctor_name: row.doctor_name.trim(),
  }));
}

export async function createAppointment({ patientId, doctorId, specialtyId, date, time }) {
  if (!doctorId || !specialtyId || !date || !time) {
    throw new BadRequest('Datos incompletos para crear el turno');
  }

  const normalizedDate = normalizeDate(date);
  const normalizedTime = normalizeTime(time);
  const fechaTurno = `${normalizedDate} ${normalizedTime}:00`;

  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[patient]] = await conn.query(
      'SELECT id_usuario FROM pacientes WHERE id_usuario = ?',
      [patientId]
    );
    if (!patient) {
      const [[usuario]] = await conn.query(
        'SELECT id FROM usuarios WHERE id = ? AND rol = "PACIENTE"',
        [patientId]
      );
      if (!usuario) {
        throw new BadRequest('Paciente no encontrado');
      }
      await conn.query(
        `INSERT INTO pacientes (id_usuario, fecha_nacimiento, genero)
         VALUES (?, NULL, NULL)
         ON DUPLICATE KEY UPDATE id_usuario = id_usuario`,
        [patientId]
      );
    }

    const [doctorRows] = await conn.query(
      `SELECT d.id_usuario AS id_doctor, de.id_especialidad
       FROM doctores d
       LEFT JOIN doctores_especialidades de ON de.id_doctor = d.id_usuario
       WHERE d.id_usuario = ?`,
      [doctorId]
    );
    if (!doctorRows.length) {
      throw new BadRequest('Doctor no encontrado');
    }
    if (!doctorRows.some(row => row.id_especialidad === Number(specialtyId))) {
      throw new BadRequest('El doctor no atiende la especialidad seleccionada');
    }

    const [conflictRows] = await conn.query(
      `SELECT t.id,
              COALESCE(
                (
                  SELECT est.valor
                  FROM turnos_estado te
                  JOIN estados est ON est.id = te.id_estado
                  WHERE te.id_turno = t.id
                  ORDER BY te.fecha DESC, te.id DESC
                  LIMIT 1
                ),
                'Pendiente'
              ) AS estado
       FROM turnos t
       WHERE t.id_doctor = ? AND t.fecha_turno = ?
       LIMIT 1`,
      [doctorId, fechaTurno]
    );
    if (conflictRows.length && conflictRows[0].estado !== 'Cancelado') {
      throw new BadRequest('El turno ya está reservado');
    }

    const [res] = await conn.query(
      `INSERT INTO turnos (id_paciente, id_doctor, id_especialidad, fecha_turno)
       VALUES (?,?,?,?)`,
      [patientId, doctorId, specialtyId, fechaTurno]
    );
    const turnoId = res.insertId;

    const estadoPendienteId = await getEstadoId(conn, 'Pendiente');
    await conn.query(
      'INSERT INTO turnos_estado (id_turno, id_estado) VALUES (?, ?)',
      [turnoId, estadoPendienteId]
    );

    await conn.commit();
    return { id: turnoId };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function cancelAppointment({ appointmentId, patientId=null, doctorId=null, reason='', actor=null }) {
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[turno]] = await conn.query(
      `SELECT t.id, t.id_paciente, t.id_doctor,
              COALESCE(
                (
                  SELECT est.valor
                  FROM turnos_estado te
                  JOIN estados est ON est.id = te.id_estado
                  WHERE te.id_turno = t.id
                  ORDER BY te.fecha DESC, te.id DESC
                  LIMIT 1
                ),
                'Pendiente'
              ) AS estado
       FROM turnos t
       WHERE t.id = ?
       FOR UPDATE`,
      [appointmentId]
    );

    if (!turno) throw new BadRequest('Turno no encontrado');
    if (patientId && turno.id_paciente !== patientId) throw new BadRequest('Turno no coincide con el paciente');
    if (doctorId && turno.id_doctor !== doctorId) throw new BadRequest('Turno no coincide con el médico');
    if (turno.estado === 'Cancelado') {
      await conn.rollback();
      return { ok: true };
    }

    const estadoCanceladoId = await getEstadoId(conn, 'Cancelado');
    await conn.query(
      'INSERT INTO turnos_estado (id_turno, id_estado) VALUES (?, ?)',
      [appointmentId, estadoCanceladoId]
    );

    await conn.query(
      `INSERT INTO turnos_cancelaciones (turno_id, motivo, actor)
       VALUES (?,?,?)`,
      [appointmentId, reason || null, actor]
    );

    await conn.commit();
    return { ok: true };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function listByDoctor(doctorId) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT
       t.id,
       DATE(t.fecha_turno) AS date,
       DATE_FORMAT(t.fecha_turno, '%H:%i') AS time,
       CONCAT(pac.nombre, ' ', IFNULL(pac.apellido, '')) AS patient_name,
       pac.email AS patient_email,
       pac.dni AS patient_dni,
       esp.nombre AS specialty_name,
       COALESCE(
         (
           SELECT est.valor
           FROM turnos_estado te
           JOIN estados est ON est.id = te.id_estado
           WHERE te.id_turno = t.id
           ORDER BY te.fecha DESC, te.id DESC
           LIMIT 1
         ),
         'Pendiente'
       ) AS status,
       (
         SELECT motivo
         FROM turnos_cancelaciones tc
         WHERE tc.turno_id = t.id
         ORDER BY tc.creado DESC, tc.id DESC
         LIMIT 1
       ) AS cancel_reason,
       (
         SELECT actor
         FROM turnos_cancelaciones tc
         WHERE tc.turno_id = t.id
         ORDER BY tc.creado DESC, tc.id DESC
         LIMIT 1
       ) AS cancel_actor
     FROM turnos t
     JOIN usuarios pac ON pac.id = t.id_paciente
     JOIN especialidades esp ON esp.id = t.id_especialidad
     WHERE t.id_doctor = ?
     ORDER BY t.fecha_turno DESC`,
    [doctorId]
  );
  return rows.map(row => ({
    ...row,
    patient_name: row.patient_name.trim()
  }));
}

