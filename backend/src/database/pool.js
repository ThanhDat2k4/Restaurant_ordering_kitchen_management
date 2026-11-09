import pg from 'pg';
import { env } from '../config/env.js';

export const pool = new pg.Pool({
  ...env.DB,
  // Ép PostgreSQL session dùng giờ VN — quan trọng để mã đơn, báo cáo đúng ngày
  options: '-c timezone=Asia/Ho_Chi_Minh',
});

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