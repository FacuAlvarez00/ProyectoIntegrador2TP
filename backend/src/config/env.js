import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 4000,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'turnos_db',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  RESET_TOKEN_EXPIRES_MIN: parseInt(process.env.RESET_TOKEN_EXPIRES_MIN || '10', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  FROM_EMAIL: process.env.FROM_EMAIL || 'no-reply@turnos.local'
};
