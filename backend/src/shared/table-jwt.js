import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signTableToken(maBan) {
  return jwt.sign({ maBan, type: 'table' }, env.JWT.tableSecret, {
    expiresIn: env.JWT.tableExpiresIn,
  });
}

export function verifyTableToken(token) {
  const payload = jwt.verify(token, env.JWT.tableSecret);
  if (payload.type !== 'table') throw new Error('Invalid token type');
  return payload;
}