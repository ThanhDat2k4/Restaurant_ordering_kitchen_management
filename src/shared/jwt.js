import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

// ─── Access token (short-lived) ───
export function signAccessToken({ userId, role, sid }) {
  return jwt.sign(
    { sub: userId, role, sid },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

// ─── Refresh token (long-lived) ───
export function signRefreshToken({ userId, sid }) {
  return jwt.sign(
    { sub: userId, sid, typ: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
}

export function verifyRefreshToken(token) {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
  if (payload.typ !== 'refresh') throw new Error('Not a refresh token');
  return payload;
}

// ─── Hash refresh token để lưu DB (SHA256 — deterministic, tìm nhanh) ───
// Lưu ý: KHÔNG dùng bcrypt cho refresh token vì bcrypt hash không
// deterministic, không query được theo hash. bcrypt chỉ dùng cho password
// (entropy thấp, dễ bị brute-force).
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}