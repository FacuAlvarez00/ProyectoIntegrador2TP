import mysql from 'mysql2/promise';
import { ENV } from './env.js';

let pool;
export async function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: ENV.DB_HOST,
      user: ENV.DB_USER,
      password: ENV.DB_PASSWORD,
      database: ENV.DB_NAME,
      port: ENV.DB_PORT,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
}
