// Pool kết nối PostgreSQL — dùng chung cho toàn app
import pg from 'pg';
import { env } from '../config/env.js';

// Set timezone cho mọi session = Asia/Ho_Chi_Minh
pg.types.setTypeParser(1114, (v) => new Date(v + '+07:00')); // timestamp without tz
pg.types.setTypeParser(1184, (v) => new Date(v));           // timestamptz (đã có tz)
// Đọc numeric dưới dạng number thay vì string (mặc định pg trả string)
pg.types.setTypeParser(1700, (v) => v === null ? null : parseFloat(v));

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: env.DB_IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: env.DB_CONNECTION_TIMEOUT_MS,
  // Set timezone sau khi kết nối
  options: '-c timezone=Asia/Ho_Chi_Minh',
});

// Log khi pool lỗi
pool.on('error', (err) => {
  console.error('[pool] Lỗi không mong muốn:', err);
});

// Test connection
export async function testConnection() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW() AS now, version() AS version');
    return {
      ok: true,
      now: res.rows[0].now,
      version: res.rows[0].version.split(' ').slice(0, 2).join(' '),
    };
  } finally {
    client.release();
  }
}