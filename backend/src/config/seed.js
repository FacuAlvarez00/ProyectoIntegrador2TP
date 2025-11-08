import { getPool } from './db.js';

const DEFAULT_HASH = '$2a$10$IEeqngcUwiMm2oNf8FNqVOAyJcSqvE9M1Fv1xMUJLgP9o3rJtxf6i';

const estadosBase = ['Pendiente', 'Confirmado', 'Cancelado', 'Atendido'];

const especialidadesBase = [
  'Clínica Médica',
  'Cardiología',
  'Pediatría',
  'Dermatología'
];

const doctoresBase = [
  { nombre: 'Sofía', apellido: 'Paredes', email: 'sofia.paredes@cardio.local', dni: '30000001', licencia: 'CARD-1001', bio: 'Especialista en cardiología preventiva', especialidad: 'Cardiología' },
  { nombre: 'Martín', apellido: 'Carrizo', email: 'martin.carrizo@cardio.local', dni: '30000002', licencia: 'CARD-1002', bio: 'Cardiólogo clínico con enfoque en rehabilitación', especialidad: 'Cardiología' },
  { nombre: 'Carolina', apellido: 'Vega', email: 'carolina.vega@cardio.local', dni: '30000003', licencia: 'CARD-1003', bio: 'Cardióloga intervencionista', especialidad: 'Cardiología' },
  { nombre: 'Lucas', apellido: 'Ferrero', email: 'lucas.ferrero@cardio.local', dni: '30000004', licencia: 'CARD-1004', bio: 'Especialista en cardiología pediátrica', especialidad: 'Cardiología' },
  { nombre: 'Natalia', apellido: 'Mansilla', email: 'natalia.mansilla@cardio.local', dni: '30000005', licencia: 'CARD-1005', bio: 'Cardióloga con foco en arritmias', especialidad: 'Cardiología' },
  { nombre: 'Diego', apellido: 'Montiel', email: 'diego.montiel@clinica.local', dni: '30000011', licencia: 'CLIN-2001', bio: 'Médico clínico generalista', especialidad: 'Clínica Médica' },
  { nombre: 'Gabriela', apellido: 'Arce', email: 'gabriela.arce@clinica.local', dni: '30000012', licencia: 'CLIN-2002', bio: 'Clínica médica con orientación en adultos mayores', especialidad: 'Clínica Médica' },
  { nombre: 'Ricardo', apellido: 'Funes', email: 'ricardo.funes@clinica.local', dni: '30000013', licencia: 'CLIN-2003', bio: 'Médico clínico y auditor', especialidad: 'Clínica Médica' },
  { nombre: 'Verónica', apellido: 'Nadal', email: 'veronica.nadal@clinica.local', dni: '30000014', licencia: 'CLIN-2004', bio: 'Clínica médica con enfoque en enfermedades crónicas', especialidad: 'Clínica Médica' },
  { nombre: 'Sebastián', apellido: 'Ledesma', email: 'sebastian.ledesma@clinica.local', dni: '30000015', licencia: 'CLIN-2005', bio: 'Clínico orientado a medicina preventiva', especialidad: 'Clínica Médica' },
  { nombre: 'Florencia', apellido: 'Muro', email: 'florencia.muro@derma.local', dni: '30000021', licencia: 'DERM-3001', bio: 'Dermatóloga especialista en acné adulto', especialidad: 'Dermatología' },
  { nombre: 'Adrián', apellido: 'Castillo', email: 'adrian.castillo@derma.local', dni: '30000022', licencia: 'DERM-3002', bio: 'Dermatología clínica y estética', especialidad: 'Dermatología' },
  { nombre: 'Macarena', apellido: 'Risso', email: 'macarena.risso@derma.local', dni: '30000023', licencia: 'DERM-3003', bio: 'Dermatóloga pediátrica', especialidad: 'Dermatología' },
  { nombre: 'Federico', apellido: 'Basile', email: 'federico.basile@derma.local', dni: '30000024', licencia: 'DERM-3004', bio: 'Dermatología quirúrgica y lesiones pigmentadas', especialidad: 'Dermatología' },
  { nombre: 'Romina', apellido: 'Puccio', email: 'romina.puccio@derma.local', dni: '30000025', licencia: 'DERM-3005', bio: 'Dermatóloga especialista en alergias cutáneas', especialidad: 'Dermatología' },
  { nombre: 'Mariano', apellido: 'Albornoz', email: 'mariano.albornoz@pedia.local', dni: '30000031', licencia: 'PEDS-4001', bio: 'Pediatra general con enfoque en desarrollo infantil', especialidad: 'Pediatría' },
  { nombre: 'Soledad', apellido: 'Villar', email: 'soledad.villar@pedia.local', dni: '30000032', licencia: 'PEDS-4002', bio: 'Pediatría y nutrición infantil', especialidad: 'Pediatría' },
  { nombre: 'Gastón', apellido: 'Arena', email: 'gaston.arena@pedia.local', dni: '30000033', licencia: 'PEDS-4003', bio: 'Pediatra con especialización en neonatología', especialidad: 'Pediatría' },
  { nombre: 'Mariela', apellido: 'Cuffia', email: 'mariela.cuffia@pedia.local', dni: '30000034', licencia: 'PEDS-4004', bio: 'Pediatría clínica y seguimiento del crecimiento', especialidad: 'Pediatría' },
  { nombre: 'Nicolás', apellido: 'Iglesias', email: 'nicolas.iglesias@pedia.local', dni: '30000035', licencia: 'PEDS-4005', bio: 'Pediatra orientado a enfermedades respiratorias', especialidad: 'Pediatría' }
];

export async function seedDemoData() {
  let connection;
  try {
    const pool = await getPool();
    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.query(`
      CREATE TABLE IF NOT EXISTS turnos_cancelaciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        turno_id INT NOT NULL,
        motivo TEXT,
        actor VARCHAR(20),
        creado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_turnos_cancelaciones_turno
          FOREIGN KEY (turno_id) REFERENCES turnos(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    for (const estado of estadosBase) {
      await connection.query(
        'INSERT INTO estados (valor) VALUES (?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)',
        [estado]
      );
    }

    for (const especialidad of especialidadesBase) {
      await connection.query(
        'INSERT INTO especialidades (nombre) VALUES (?) ON DUPLICATE KEY UPDATE nombre = VALUES(nombre)',
        [especialidad]
      );
    }

    const nombresEspecialidades = [...new Set(doctoresBase.map(d => d.especialidad))];
    const [especialidadRows] = await connection.query(
      `SELECT id, nombre FROM especialidades WHERE nombre IN (?)`,
      [nombresEspecialidades]
    );
    const especialidadMap = new Map(especialidadRows.map(row => [row.nombre, row.id]));

    for (const doctor of doctoresBase) {
      const especialidadId = especialidadMap.get(doctor.especialidad);
      if (!especialidadId) continue;

      const [usuarioRows] = await connection.query(
        'SELECT id FROM usuarios WHERE email = ?',
        [doctor.email]
      );

      let usuarioId;
      if (usuarioRows.length) {
        usuarioId = usuarioRows[0].id;
        await connection.query(
          `UPDATE usuarios
             SET nombre = ?, apellido = ?, rol = 'MEDICO', dni = IFNULL(dni, ?)
           WHERE id = ?`,
          [doctor.nombre, doctor.apellido, doctor.dni, usuarioId]
        );
      } else {
        const [res] = await connection.query(
          `INSERT INTO usuarios (dni, email, hash_contrasena, nombre, apellido, rol, email_verificado)
           VALUES (?,?,?,?,?,?,1)`,
          [doctor.dni, doctor.email, DEFAULT_HASH, doctor.nombre, doctor.apellido, 'MEDICO']
        );
        usuarioId = res.insertId;
      }

      await connection.query(
        `INSERT INTO doctores (id_usuario, numero_licencia, bio)
         VALUES (?,?,?)
         ON DUPLICATE KEY UPDATE numero_licencia = VALUES(numero_licencia), bio = VALUES(bio)`,
        [usuarioId, doctor.licencia, doctor.bio]
      );

      await connection.query(
        `INSERT INTO doctores_especialidades (id_doctor, id_especialidad)
         VALUES (?,?)
         ON DUPLICATE KEY UPDATE id_doctor = id_doctor`,
        [usuarioId, especialidadId]
      );
    }

    await connection.commit();
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('Error al ejecutar la carga inicial:', err.message);
  } finally {
    if (connection) connection.release();
  }
}

