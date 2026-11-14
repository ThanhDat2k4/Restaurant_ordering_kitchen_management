import pg from 'pg';
import { env } from '../config/env.js';

// Cấu hình kết nối
let poolConfig;

if (env.DATABASE_URL) {
  // Nếu chạy trên Cloud (Render) hoặc có cấu hình URL
  poolConfig = {
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Bắt buộc cho Render External
  };
} else {
  // Nếu chạy Local
  poolConfig = {
    host: env.DB.host,
    port: env.DB.port,
    database: env.DB.database,
    user: env.DB.user,
    password: env.DB.password,
  };
}

export const pool = new pg.Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[pool] Unexpected error:', err);
});

export async function testConnection() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      "SELECT NOW() AS now, version() AS version, current_setting('TimeZone') AS tz"
    );
    return {
      ok: true,
      now: rows[0].now,
      version: rows[0].version.split(' ').slice(0, 2).join(' '),
      timezone: rows[0].tz,
    };
  } finally {
    client.release();
  }
}