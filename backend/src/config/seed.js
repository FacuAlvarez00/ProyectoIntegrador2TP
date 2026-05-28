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
  { nombre: 'Martín', apellido: 'Carrizo', email: 'martin.carrizo@cardio.local', dni: '30000002', licencia: 'CARD-1002', bio: 'Cardiólogo clínico', especialidad: 'Cardiología' },
  { nombre: 'Diego', apellido: 'Montiel', email: 'diego.montiel@clinica.local', dni: '30000011', licencia: 'CLIN-2001', bio: 'Médico clínico generalista', especialidad: 'Clínica Médica' },
  { nombre: 'Gabriela', apellido: 'Arce', email: 'gabriela.arce@clinica.local', dni: '30000012', licencia: 'CLIN-2002', bio: 'Clínica médica con orientación', especialidad: 'Clínica Médica' },
  { nombre: 'Florencia', apellido: 'Muro', email: 'florencia.muro@derma.local', dni: '30000021', licencia: 'DERM-3001', bio: 'Dermatología', especialidad: 'Dermatología' },
  { nombre: 'Mariano', apellido: 'Albornoz', email: 'mariano.albornoz@pedia.local', dni: '30000031', licencia: 'PEDS-4001', bio: 'Pediatra general', especialidad: 'Pediatría' }
];

// Espera asíncrona auxiliar
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function seedDemoData(maxRetries = 10, retryDelay = 3000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let connection;
    try {
      const pool = await getPool();
      // Si la DB no está lista, fallará aquí lanzando ECONNREFUSED
      connection = await pool.getConnection(); 
      await connection.beginTransaction();

      const [[{ db }]] = await connection.query('SELECT DATABASE() AS db');
      const [activoColumn] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'pacientes' AND COLUMN_NAME = 'activo'`, [db]
      );
      if (!activoColumn.length) {
        await connection.query('ALTER TABLE pacientes ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1');
      }
      await connection.query('UPDATE pacientes SET activo = 1 WHERE activo IS NULL');

      await connection.query(`
        CREATE TABLE IF NOT EXISTS turnos_cancelaciones (
          id INT AUTO_INCREMENT PRIMARY KEY,
          turno_id INT NOT NULL,
          motivo TEXT,
          actor VARCHAR(20),
          creado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_turnos_cancelaciones_turno FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE CASCADE
        ) ENGINE=InnoDB
      `);

      // Estados y Especialidades
      for (const estado of estadosBase) {
        await connection.query('INSERT INTO estados (valor) VALUES (?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)', [estado]);
      }
      for (const especialidad of especialidadesBase) {
        await connection.query('INSERT INTO especialidades (nombre) VALUES (?) ON DUPLICATE KEY UPDATE nombre = VALUES(nombre)', [especialidad]);
      }

      const [especialidadRows] = await connection.query('SELECT id, nombre FROM especialidades');
      const especialidadMap = new Map(especialidadRows.map(row => [row.nombre, row.id]));

      // Doctores
      for (const doctor of doctoresBase) {
        const especialidadId = especialidadMap.get(doctor.especialidad);
        if (!especialidadId) continue;

        const [usuarioRows] = await connection.query('SELECT id FROM usuarios WHERE email = ?', [doctor.email]);
        let usuarioId;
        if (usuarioRows.length) {
          usuarioId = usuarioRows[0].id;
          await connection.query(`UPDATE usuarios SET nombre = ?, apellido = ?, rol = 'MEDICO', dni = IFNULL(dni, ?) WHERE id = ?`, [doctor.nombre, doctor.apellido, doctor.dni, usuarioId]);
        } else {
          const [res] = await connection.query(`INSERT INTO usuarios (dni, email, hash_contrasena, nombre, apellido, rol, email_verificado) VALUES (?,?,?,?,?,?,1)`, [doctor.dni, doctor.email, DEFAULT_HASH, doctor.nombre, doctor.apellido, 'MEDICO']);
          usuarioId = res.insertId;
        }
        await connection.query(`INSERT INTO doctores (id_usuario, numero_licencia, bio) VALUES (?,?,?) ON DUPLICATE KEY UPDATE numero_licencia = VALUES(numero_licencia), bio = VALUES(bio)`, [usuarioId, doctor.licencia, doctor.bio]);
        await connection.query(`INSERT INTO doctores_especialidades (id_doctor, id_especialidad) VALUES (?,?) ON DUPLICATE KEY UPDATE id_doctor = id_doctor`, [usuarioId, especialidadId]);
      }

      // Secretario (HU-IN19)
      const emailSecretario = 'secretario@clinica.local';
      const [secRows] = await connection.query('SELECT id FROM usuarios WHERE email = ?', [emailSecretario]);
      if (!secRows.length) {
          await connection.query(`INSERT INTO usuarios (dni, email, hash_contrasena, nombre, apellido, rol, email_verificado) VALUES (?,?,?,?,?,?,1)`,
              ['20000000', emailSecretario, DEFAULT_HASH, 'Carlos', 'Recepción', 'SECRETARIO']
          );
      }

      // Pacientes de Prueba (5)
      let pacienteIds = [];
      for (let i = 1; i <= 5; i++) {
          const email = `paciente${i}@demo.local`;
          const [rows] = await connection.query('SELECT id FROM usuarios WHERE email = ?', [email]);
          let pid;
          if (!rows.length) {
              const [res] = await connection.query(`INSERT INTO usuarios (dni, email, hash_contrasena, nombre, apellido, rol, email_verificado) VALUES (?,?,?,?,?,?,1)`, [`4000000${i}`, email, DEFAULT_HASH, `Paci${i}`, 'Test', 'PACIENTE']);
              pid = res.insertId;
              await connection.query('INSERT IGNORE INTO pacientes (id_usuario) VALUES (?)', [pid]);
          } else {
              pid = rows[0].id;
          }
          pacienteIds.push(pid);
      }

      // Generador de 150 Turnos Históricos y Futuros (HU-IN20)
      const [conteoTurnos] = await connection.query('SELECT COUNT(*) as c FROM turnos');
      if (conteoTurnos[0].c === 0 && pacienteIds.length > 0) {
          const [docsDb] = await connection.query('SELECT d.id_usuario as id_doctor, de.id_especialidad FROM doctores d JOIN doctores_especialidades de ON d.id_usuario = de.id_doctor');
          
          const [estadosRows] = await connection.query('SELECT id, valor FROM estados');
          const estadosIdMap = {};
          estadosRows.forEach(e => estadosIdMap[e.valor] = e.id);

          if (docsDb.length > 0) {
              for (let i = 0; i < 150; i++) {
                  const isPast = Math.random() > 0.25; 
                  const daysOffset = isPast ? -Math.floor(Math.random() * 30) : Math.floor(Math.random() * 5);
                  const hour = 9 + Math.floor(Math.random() * 8); 
                  
                  const d = new Date();
                  d.setDate(d.getDate() + daysOffset);
                  d.setHours(hour, (Math.random() > 0.5 ? 30 : 0), 0, 0);
                  
                  const fechaStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;

                  const doc = docsDb[Math.floor(Math.random() * docsDb.length)];
                  const pacId = pacienteIds[Math.floor(Math.random() * pacienteIds.length)];

                  let estadoVal = 'Pendiente';
                  if (isPast) {
                      estadoVal = Math.random() > 0.2 ? 'Atendido' : 'Cancelado';
                  } else if (daysOffset === 0) {
                      estadoVal = Math.random() > 0.5 ? 'Confirmado' : 'Pendiente';
                  }

                  const [res] = await connection.query(`INSERT INTO turnos (id_paciente, id_doctor, id_especialidad, fecha_turno) VALUES (?, ?, ?, ?)`, [pacId, doc.id_doctor, doc.id_especialidad, fechaStr]);
                  const turnoId = res.insertId;

                  await connection.query(`INSERT INTO turnos_estado (id_turno, id_estado, fecha) VALUES (?, ?, DATE_SUB(?, INTERVAL 1 HOUR))`, [turnoId, estadosIdMap['Pendiente'], fechaStr]);
                  
                  if (estadoVal !== 'Pendiente') {
                      await connection.query(`INSERT INTO turnos_estado (id_turno, id_estado, fecha) VALUES (?, ?, ?)`, [turnoId, estadosIdMap[estadoVal], fechaStr]);
                  }

                  if (estadoVal === 'Cancelado') {
                      await connection.query(`INSERT INTO turnos_cancelaciones (turno_id, motivo, actor) VALUES (?, ?, ?)`, [turnoId, 'Motivos personales / Ausentismo', 'PACIENTE']);
                  }
              }
          }
      }

      await connection.commit();
      console.log('Base de datos validada y poblada exitosamente.');
      return; // Carga exitosa, salimos de la función sin reintentar

    } catch (err) {
      if (connection) {
        try { await connection.rollback(); } catch(e) {}
      }
      
      console.warn(`Intento ${attempt}/${maxRetries} falló: ${err.message}`);
      
      if (attempt < maxRetries) {
        console.log(`Reintentando seed en ${retryDelay / 1000} segundos...`);
        await sleep(retryDelay);
      } else {
        console.error('Se agotaron los reintentos para la carga inicial de datos.');
      }
      
    } finally {
      if (connection) connection.release();
    }
  }
}

