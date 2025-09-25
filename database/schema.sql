
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
VALUES ('00000000', 'admin@turnos.local', '$2a$10$abcdefghijklmnopqrstuv', 'Admin', 'Principal', 'ADMIN', 1)
ON DUPLICATE KEY UPDATE email=email;
