// Tập trung tất cả biến môi trường, validate ngay khi khởi động
import dotenv from 'dotenv';
dotenv.config();

function required(name) {
  const val = process.env[name];
  if (!val) {
    console.error(`❌ Thiếu biến môi trường bắt buộc: ${name}`);
    process.exit(1);
  }
  return val;
}

function optional(name, defaultValue) {
  return process.env[name] ?? defaultValue;
}

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '3000'), 10),
  FRONTEND_URL: optional('FRONTEND_URL', 'http://localhost:5173'),

  DATABASE_URL: required('DATABASE_URL'),
  DB_POOL_MAX: parseInt(optional('DB_POOL_MAX', '20'), 10),
  DB_IDLE_TIMEOUT_MS: parseInt(optional('DB_IDLE_TIMEOUT_MS', '30000'), 10),
  DB_CONNECTION_TIMEOUT_MS: parseInt(optional('DB_CONNECTION_TIMEOUT_MS', '5000'), 10),

  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES_IN: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
  JWT_REFRESH_EXPIRES_IN: optional('JWT_REFRESH_EXPIRES_IN', '7d'),

  LOG_LEVEL: optional('LOG_LEVEL', 'info'),

  // Derived
  isProd: optional('NODE_ENV', 'development') === 'production',
};