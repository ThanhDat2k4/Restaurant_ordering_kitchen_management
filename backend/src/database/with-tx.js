import { pool } from './pool.js';
import { mapPgError } from './pg-error-map.js';
import { logger } from '../config/logger.js';

const RETRYABLE = new Set(['40001', '40P01']);
const MAX_RETRIES = 3;

/**
 * Chạy fn trong transaction, tự set app.ma_tai_khoan cho trigger audit.
 * @param {object} ctx - { userId } (bắt buộc nếu là write có audit)
 * @param {function} fn - async (client) => result
 */
export async function withTx(ctx, fn) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
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
      
      if (RETRYABLE.has(err.code) && attempt < MAX_RETRIES) {
        lastError = mapped;
        const delay = 50 * attempt;
        logger.warn({ attempt, code: err.code, delay }, 'Retry transaction');
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw mapped;
    } finally {
      client.release();
    }
  }
  throw lastError;
}

/** Query đơn giản (READ) */
export async function query(text, params) {
  try {
    const { rows } = await pool.query(text, params);
    return { rows };
  } catch (err) {
    throw mapPgError(err);
  }
}