// Wrapper transaction: BEGIN → set app.ma_tai_khoan → logic → COMMIT/ROLLBACK
// Tự retry khi gặp lỗi concurrency (40001, 40P01)
import { pool } from './pool.js';
import { mapPgError } from './pg-error-map.js';

const RETRYABLE_CODES = new Set(['40001', '40P01']);
const MAX_RETRIES = 3;

/**
 * Chạy fn trong transaction. Tự retry khi deadlock/serialization.
 * @param {object} ctx - { userId, ip, userAgent } — userId sẽ set vào app.ma_tai_khoan
 * @param {(client) => Promise<any>} fn - Callback chứa logic (dùng client.query)
 * @returns {Promise<any>} - Giá trị fn() trả về
 */
export async function withTx(ctx, fn) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // QUAN TRỌNG: set người thao tác để Trigger audit/lịch sử hoạt động
      if (ctx?.userId) {
        await client.query(
          "SELECT set_config('app.ma_tai_khoan', $1, true)",
          [String(ctx.userId)]
        );
      }

      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch { /* ignore */ }

      const mapped = mapPgError(err);

      // Chỉ retry với lỗi concurrency
      if (RETRYABLE_CODES.has(err.code) && attempt < MAX_RETRIES) {
        lastError = mapped;
        const delay = 50 * attempt; // 50ms, 100ms, 150ms
        console.warn(`[tx] Retry ${attempt}/${MAX_RETRIES} sau ${delay}ms do lỗi ${err.code}`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      throw mapped;
    } finally {
      client.release();
    }
  }
  throw lastError;
}

/**
 * Query đơn giản (không transaction) — chỉ dùng cho READ
 * @param {string} text - SQL
 * @param {any[]} params - Tham số
 */
export async function query(text, params) {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    throw mapPgError(err);
  }
}