
-- ===============================================
--  turnos_db  — Esquema completo (según PDF)
-- ===============================================
CREATE DATABASE IF NOT EXISTS turnos_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE turnos_db;

-- =====================
-- Tabla: Usuarios
-- =====================
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS turnos_estado;
DROP TABLE IF EXISTS turnos_cancelaciones;
DROP TABLE IF EXISTS turnos;
DROP TABLE IF EXISTS disponibilidad;
DROP TABLE IF EXISTS doctores_especialidades;
DROP TABLE IF EXISTS estados;
DROP TABLE IF EXISTS especialidades;
DROP TABLE IF EXISTS doctores;
DROP TABLE IF EXISTS pacientes;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  dni               VARCHAR(20),
  email             VARCHAR(255) NOT NULL UNIQUE,
  hash_contrasena   VARCHAR(255) NOT NULL,
  nombre            VARCHAR(255) NOT NULL,
  apellido          VARCHAR(255) NOT NULL,
  rol               VARCHAR(255) NOT NULL,                 -- 'PACIENTE' | 'MEDICO' | 'ADMIN'
  email_verificado  BOOLEAN NOT NULL DEFAULT 0,
  creado            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_usuarios_email (email),
  INDEX idx_usuarios_dni (dni)
) ENGINE=InnoDB;

-- =====================
-- Tabla: Pacientes
-- =====================
CREATE TABLE pacientes (
  id_usuario        INT PRIMARY KEY,
  fecha_nacimiento  DATE,
  genero            VARCHAR(20),
  activo            TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_pacientes_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
      ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================
-- Tabla: Doctores
-- =====================
CREATE TABLE doctores (
  id_usuario      INT PRIMARY KEY,
  numero_licencia VARCHAR(100) NOT NULL,
  bio             TEXT,
  CONSTRAINT fk_doctores_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
      ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================
-- Tabla: Especialidades
-- =====================
CREATE TABLE especialidades (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  nombre  VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ==============================
-- Tabla puente: Doctores-Especialidades (N:M)
-- ==============================
CREATE TABLE doctores_especialidades (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  id_doctor        INT NOT NULL,
  id_especialidad  INT NOT NULL,
  UNIQUE KEY uk_doctor_especialidad (id_doctor, id_especialidad),
  CONSTRAINT fk_de_doctor
    FOREIGN KEY (id_doctor) REFERENCES doctores(id_usuario)
      ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_de_especialidad
    FOREIGN KEY (id_especialidad) REFERENCES especialidades(id)
      ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =====================
-- Tabla: Disponibilidad (slots del médico)
-- =====================
CREATE TABLE disponibilidad (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  id_doctor  INT NOT NULL,
  desde      DATETIME NOT NULL,
  hasta      DATETIME NOT NULL,
  CONSTRAINT fk_disp_doctor
    FOREIGN KEY (id_doctor) REFERENCES doctores(id_usuario)
      ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_disp_doctor_fecha (id_doctor, desde, hasta),
  CHECK (hasta > desde)
) ENGINE=InnoDB;

-- =====================
-- Tabla: Turnos
-- =====================
CREATE TABLE turnos (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  id_paciente      INT NOT NULL,
  id_doctor        INT NOT NULL,
  id_especialidad  INT NOT NULL,
  fecha_turno      DATETIME NOT NULL,
  creado           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_turno_paciente
    FOREIGN KEY (id_paciente) REFERENCES pacientes(id_usuario)
      ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_turno_doctor
    FOREIGN KEY (id_doctor) REFERENCES doctores(id_usuario)
      ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_turno_especialidad
    FOREIGN KEY (id_especialidad) REFERENCES especialidades(id)
      ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_turno_doctor_fecha (id_doctor, fecha_turno),
  INDEX idx_turno_paciente_fecha (id_paciente, fecha_turno)
) ENGINE=InnoDB;

-- =====================
-- Tabla: Estados
-- =====================
CREATE TABLE estados (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  valor  VARCHAR(50) NOT NULL UNIQUE   -- 'Pendiente', 'Confirmado', 'Cancelado', 'Atendido', etc.
) ENGINE=InnoDB;

-- =====================
-- Tabla: Turnos-Estado (historial)
-- =====================
CREATE TABLE turnos_estado (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  id_turno   INT NOT NULL,
  id_estado  INT NOT NULL,
  fecha      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_te_turno
    FOREIGN KEY (id_turno) REFERENCES turnos(id)
      ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_te_estado
    FOREIGN KEY (id_estado) REFERENCES estados(id)
      ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_te_turno (id_turno),
  INDEX idx_te_estado (id_estado)
) ENGINE=InnoDB;

-- =====================
-- Tabla: Cancelaciones de turnos
-- =====================
CREATE TABLE IF NOT EXISTS turnos_cancelaciones (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  turno_id  INT NOT NULL,
  motivo    TEXT,
  actor     VARCHAR(20),
  creado    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tc_turno
    FOREIGN KEY (turno_id) REFERENCES turnos(id)
      ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================
-- Tokens de recuperación de contraseña
-- =====================
CREATE TABLE password_resets (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  token       VARCHAR(64) NOT NULL UNIQUE,
  expires_at  DATETIME NOT NULL,
  creado      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pr_usuario
    FOREIGN KEY (user_id) REFERENCES usuarios(id)
      ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================
-- Datos base (semillas)
-- =====================
INSERT INTO estados (valor) VALUES
  ('Pendiente'), ('Confirmado'), ('Cancelado'), ('Atendido')
ON DUPLICATE KEY UPDATE valor = VALUES(valor);

INSERT INTO especialidades (nombre) VALUES
  ('Clínica Médica'), ('Cardiología'), ('Pediatría'), ('Dermatología')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Usuario admin de ejemplo (hash dummy, reemplazar)
INSERT INTO usuarios (dni, email, hash_contrasena, nombre, apellido, rol, email_verificado)
VALUES ('00000000', 'admin@turnos.local', '$2a$10$IEeqngcUwiMm2oNf8FNqVOAyJcSqvE9M1Fv1xMUJLgP9o3rJtxf6i', 'Admin', 'Principal', 'ADMIN', 1)
ON DUPLICATE KEY UPDATE email=email;

-- Médicos de ejemplo
INSERT INTO usuarios (dni, email, hash_contrasena, nombre, apellido, rol, email_verificado)
VALUES
  ('30000001', 'sofia.paredes@cardio.local', '$2a$10$IEeqngcUwiMm2oNf8FNqVOAyJcSqvE9M1Fv1xMUJLgP9o3rJtxf6i', 'Sofía', 'Paredes', 'MEDICO', 1),
  ('30000002', 'martin.carrizo@cardio.local', '$2a$10$IEeqngcUwiMm2oNf8FNqVOAyJcSqvE9M1Fv1xMUJLgP9o3rJtxf6i', 'Martín', 'Carrizo', 'MEDICO', 1),
  ('30000003', 'carolina.vega@cardio.local', '$2a$10$IEeqngcUwiMm2oNf8FNqVOAyJcSqvE9M1Fv1xMUJLgP9o3rJtxf6i', 'Carolina', 'Vega', 'MEDICO', 1),
  ('30000004', 'lucas.ferrero@cardio.local', '$2a$10$IEeqngcUwiMm2oNf8FNqVOAyJcSqvE9M1Fv1xMUJLgP9o3rJtxf6i', 'Lucas', 'Ferrero', 'MEDICO', 1),
  ('30000005', 'natalia.mansilla@cardio.local', '$2a$10$IEeqngcUwiMm2oNf8FNqVOAyJcSqvE9M1Fv1xMUJLgP9o3rJtxf6i', 'Natalia', 'Mansilla', 'MEDICO', 1),
  ('30000011', 'diego.montiel@clinica.local', '$2a$10$IEeqngcUwiMm2oNf8FNqVOAyJcSqvE9M1Fv1xMUJLgP9o3rJtxf6i', 'Diego', 'Montiel', 'MEDICO', 1),
  ('30000012', 'gabriela.arce@clinica.local', '$2a$10$IEeqngcUwiMm2oNf8FNqVOAyJcSqvE9M1Fv1xMUJLgP9o3rJtxf6i', 'Gabriela', 'Arce', 'MEDICO', 1),
  ('30000013', 'ricardo.funes@clinica.local', '$2a$10$IEeqngcUwiMm2oNf8FNqVOAyJcSqvE9M1Fv1xMUJLgP9o3rJtxf6i', 'Ricardo', 'Funes', 'MEDICO', 1),
  ('30000014', 'veronica.nadal@clinica.local', '$2a$10$IEeqngcUwiMm2oNf8FNqVOAyJcSqvE9M1Fv1xMUJLgP9o3rJtxf6i', 'Verónica', 'Nadal', 'MEDICO', 1),
  ('30000015', 'sebastian.ledesma@clinica.local', '$2a$10$IEeqngcUwiMm2oNf8FNqVOAyJcSqvE9M1Fv1xMUJLgP9o3rJtxf6i', 'Sebastián', 'Ledesma', 'MEDICO', 1),
  ('30000021', 'florencia.muro@derma.local', '$2a$10$IEeqngcUwiMm2oNf8FNqVOAyJcSqvE9M1Fv1xMUJLgP9o3rJtxf6i', 'Florencia', 'Muro', 'MEDICO', 1),
  ('30000022', 'adrian.castillo@derma.local', '$2a$10$IEeqngcUwiMm2oNf8FNqVOAyJcSqvE9M1Fv1xMUJLgP9o3rJtxf6i', 'Adrián', 'Castillo', 'MEDICO', 1),
  ('30000023', 'macarena.risso@derma.local', '$2a$10$IEeqngcUwiMm2oNf8FNqVOAyJcSqvE9M1Fv1xMUJLgP9o3rJtxf6i', 'Macarena', 'Risso', 'MEDICO', 1),
  ('30000024', 'federico.basile@derma.local', '$2a$10$IEeqngcUwiMm2oNf8FNqVOAyJcSqvE9M1Fv1xMUJLgP9o3rJtxf6i', 'Federico', 'Basile', 'MEDICO', 1),
  ('30000025', 'romina.puccio@derma.local', '$2a$10$IEeqngcUwiMm2oNf8FNqVOAyJcSqvE9M1Fv1xMUJLgP9o3rJtxf6i', 'Romina', 'Puccio', 'MEDICO', 1),
  ('30000031', 'mariano.albornoz@pedia.local', '$2a$10$IEeqngcUwiMm2oNf8FNqVOAyJcSqvE9M1Fv1xMUJLgP9o3rJtxf6i', 'Mariano', 'Albornoz', 'MEDICO', 1),
  ('30000032', 'soledad.villar@pedia.local', '$2a$10$IEeqngcUwiMm2oNf8FNqVOAyJcSqvE9M1Fv1xMUJLgP9o3rJtxf6i', 'Soledad', 'Villar', 'MEDICO', 1),
  ('30000033', 'gaston.arena@pedia.local', '$2a$10$IEeqngcUwiMm2oNf8FNqVOAyJcSqvE9M1Fv1xMUJLgP9o3rJtxf6i', 'Gastón', 'Arena', 'MEDICO', 1),
  ('30000034', 'mariela.cuffia@pedia.local', '$2a$10$IEeqngcUwiMm2oNf8FNqVOAyJcSqvE9M1Fv1xMUJLgP9o3rJtxf6i', 'Mariela', 'Cuffia', 'MEDICO', 1),
  ('30000035', 'nicolas.iglesias@pedia.local', '$2a$10$IEeqngcUwiMm2oNf8FNqVOAyJcSqvE9M1Fv1xMUJLgP9o3rJtxf6i', 'Nicolás', 'Iglesias', 'MEDICO', 1)
ON DUPLICATE KEY UPDATE email = email;

INSERT INTO doctores (id_usuario, numero_licencia, bio)
SELECT id, 'CARD-1001', 'Especialista en cardiología preventiva'
FROM usuarios WHERE email = 'sofia.paredes@cardio.local'
ON DUPLICATE KEY UPDATE numero_licencia = VALUES(numero_licencia), bio = VALUES(bio);

INSERT INTO doctores (id_usuario, numero_licencia, bio)
SELECT id, 'CARD-1002', 'Cardiólogo clínico con enfoque en rehabilitación'
FROM usuarios WHERE email = 'martin.carrizo@cardio.local'
ON DUPLICATE KEY UPDATE numero_licencia = VALUES(numero_licencia), bio = VALUES(bio);

INSERT INTO doctores (id_usuario, numero_licencia, bio)
SELECT id, 'CARD-1003', 'Cardióloga intervencionista'
FROM usuarios WHERE email = 'carolina.vega@cardio.local'
ON DUPLICATE KEY UPDATE numero_licencia = VALUES(numero_licencia), bio = VALUES(bio);

INSERT INTO doctores (id_usuario, numero_licencia, bio)
SELECT id, 'CARD-1004', 'Especialista en cardiología pediátrica'
FROM usuarios WHERE email = 'lucas.ferrero@cardio.local'
ON DUPLICATE KEY UPDATE numero_licencia = VALUES(numero_licencia), bio = VALUES(bio);

INSERT INTO doctores (id_usuario, numero_licencia, bio)
SELECT id, 'CARD-1005', 'Cardióloga con foco en arritmias'
FROM usuarios WHERE email = 'natalia.mansilla@cardio.local'
ON DUPLICATE KEY UPDATE numero_licencia = VALUES(numero_licencia), bio = VALUES(bio);

INSERT INTO doctores (id_usuario, numero_licencia, bio)
SELECT id, 'CLIN-2001', 'Médico clínico generalista'
FROM usuarios WHERE email = 'diego.montiel@clinica.local'
ON DUPLICATE KEY UPDATE numero_licencia = VALUES(numero_licencia), bio = VALUES(bio);

INSERT INTO doctores (id_usuario, numero_licencia, bio)
SELECT id, 'CLIN-2002', 'Clínica médica con orientación en adultos mayores'
FROM usuarios WHERE email = 'gabriela.arce@clinica.local'
ON DUPLICATE KEY UPDATE numero_licencia = VALUES(numero_licencia), bio = VALUES(bio);

INSERT INTO doctores (id_usuario, numero_licencia, bio)
SELECT id, 'CLIN-2003', 'Médico clínico y auditor'
FROM usuarios WHERE email = 'ricardo.funes@clinica.local'
ON DUPLICATE KEY UPDATE numero_licencia = VALUES(numero_licencia), bio = VALUES(bio);

INSERT INTO doctores (id_usuario, numero_licencia, bio)
SELECT id, 'CLIN-2004', 'Clínica médica con enfoque en enfermedades crónicas'
FROM usuarios WHERE email = 'veronica.nadal@clinica.local'
ON DUPLICATE KEY UPDATE numero_licencia = VALUES(numero_licencia), bio = VALUES(bio);

INSERT INTO doctores (id_usuario, numero_licencia, bio)
SELECT id, 'CLIN-2005', 'Clínico orientado a medicina preventiva'
FROM usuarios WHERE email = 'sebastian.ledesma@clinica.local'
ON DUPLICATE KEY UPDATE numero_licencia = VALUES(numero_licencia), bio = VALUES(bio);

INSERT INTO doctores (id_usuario, numero_licencia, bio)
SELECT id, 'DERM-3001', 'Dermatóloga especialista en acné adulto'
FROM usuarios WHERE email = 'florencia.muro@derma.local'
ON DUPLICATE KEY UPDATE numero_licencia = VALUES(numero_licencia), bio = VALUES(bio);

INSERT INTO doctores (id_usuario, numero_licencia, bio)
SELECT id, 'DERM-3002', 'Dermatología clínica y estética'
FROM usuarios WHERE email = 'adrian.castillo@derma.local'
ON DUPLICATE KEY UPDATE numero_licencia = VALUES(numero_licencia), bio = VALUES(bio);

INSERT INTO doctores (id_usuario, numero_licencia, bio)
SELECT id, 'DERM-3003', 'Dermatóloga pediátrica'
FROM usuarios WHERE email = 'macarena.risso@derma.local'
ON DUPLICATE KEY UPDATE numero_licencia = VALUES(numero_licencia), bio = VALUES(bio);

INSERT INTO doctores (id_usuario, numero_licencia, bio)
SELECT id, 'DERM-3004', 'Dermatología quirúrgica y lesiones pigmentadas'
FROM usuarios WHERE email = 'federico.basile@derma.local'
ON DUPLICATE KEY UPDATE numero_licencia = VALUES(numero_licencia), bio = VALUES(bio);

INSERT INTO doctores (id_usuario, numero_licencia, bio)
SELECT id, 'DERM-3005', 'Dermatóloga especialista en alergias cutáneas'
FROM usuarios WHERE email = 'romina.puccio@derma.local'
ON DUPLICATE KEY UPDATE numero_licencia = VALUES(numero_licencia), bio = VALUES(bio);

INSERT INTO doctores (id_usuario, numero_licencia, bio)
SELECT id, 'PEDS-4001', 'Pediatra general con enfoque en desarrollo infantil'
FROM usuarios WHERE email = 'mariano.albornoz@pedia.local'
ON DUPLICATE KEY UPDATE numero_licencia = VALUES(numero_licencia), bio = VALUES(bio);

INSERT INTO doctores (id_usuario, numero_licencia, bio)
SELECT id, 'PEDS-4002', 'Pediatría y nutrición infantil'
FROM usuarios WHERE email = 'soledad.villar@pedia.local'
ON DUPLICATE KEY UPDATE numero_licencia = VALUES(numero_licencia), bio = VALUES(bio);

INSERT INTO doctores (id_usuario, numero_licencia, bio)
SELECT id, 'PEDS-4003', 'Pediatra con especialización en neonatología'
FROM usuarios WHERE email = 'gaston.arena@pedia.local'
ON DUPLICATE KEY UPDATE numero_licencia = VALUES(numero_licencia), bio = VALUES(bio);

INSERT INTO doctores (id_usuario, numero_licencia, bio)
SELECT id, 'PEDS-4004', 'Pediatría clínica y seguimiento del crecimiento'
FROM usuarios WHERE email = 'mariela.cuffia@pedia.local'
ON DUPLICATE KEY UPDATE numero_licencia = VALUES(numero_licencia), bio = VALUES(bio);

INSERT INTO doctores (id_usuario, numero_licencia, bio)
SELECT id, 'PEDS-4005', 'Pediatra orientado a enfermedades respiratorias'
FROM usuarios WHERE email = 'nicolas.iglesias@pedia.local'
ON DUPLICATE KEY UPDATE numero_licencia = VALUES(numero_licencia), bio = VALUES(bio);

-- Relaciones doctores-especialidades
INSERT INTO doctores_especialidades (id_doctor, id_especialidad)
SELECT u.id, e.id
FROM usuarios u
JOIN especialidades e ON e.nombre = 'Cardiología'
WHERE u.email IN (
  'sofia.paredes@cardio.local',
  'martin.carrizo@cardio.local',
  'carolina.vega@cardio.local',
  'lucas.ferrero@cardio.local',
  'natalia.mansilla@cardio.local'
)
ON DUPLICATE KEY UPDATE id_doctor = id_doctor;

INSERT INTO doctores_especialidades (id_doctor, id_especialidad)
SELECT u.id, e.id
FROM usuarios u
JOIN especialidades e ON e.nombre = 'Clínica Médica'
WHERE u.email IN (
  'diego.montiel@clinica.local',
  'gabriela.arce@clinica.local',
  'ricardo.funes@clinica.local',
  'veronica.nadal@clinica.local',
  'sebastian.ledesma@clinica.local'
)
ON DUPLICATE KEY UPDATE id_doctor = id_doctor;

INSERT INTO doctores_especialidades (id_doctor, id_especialidad)
SELECT u.id, e.id
FROM usuarios u
JOIN especialidades e ON e.nombre = 'Dermatología'
WHERE u.email IN (
  'florencia.muro@derma.local',
  'adrian.castillo@derma.local',
  'macarena.risso@derma.local',
  'federico.basile@derma.local',
  'romina.puccio@derma.local'
)
ON DUPLICATE KEY UPDATE id_doctor = id_doctor;

INSERT INTO doctores_especialidades (id_doctor, id_especialidad)
SELECT u.id, e.id
FROM usuarios u
JOIN especialidades e ON e.nombre = 'Pediatría'
WHERE u.email IN (
  'mariano.albornoz@pedia.local',
  'soledad.villar@pedia.local',
  'gaston.arena@pedia.local',
  'mariela.cuffia@pedia.local',
  'nicolas.iglesias@pedia.local'
)
ON DUPLICATE KEY UPDATE id_doctor = id_doctor;