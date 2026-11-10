import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT.accessSecret, {
    expiresIn: env.JWT.accessExpiresIn,
  });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, env.JWT.refreshSecret, {
    expiresIn: env.JWT.refreshExpiresIn,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT.accessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT.refreshSecret);
}