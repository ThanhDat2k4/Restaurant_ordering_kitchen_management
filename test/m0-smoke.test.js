// Test smoke cho M0: health check + DB + error mapping
import { test, expect } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { mapPgError } from '../src/db/pg-error-map.js';
import { AppError } from '../src/shared/AppError.js';

test('GET /health trả 200', async () => {
  const res = await request(app).get('/health');
  expect(res.status).toBe(200);
  expect(res.body.status).toBe('OK');
});

test('GET /health/db kết nối được DB', async () => {
  const res = await request(app).get('/health/db');
  expect(res.status).toBe(200);
  expect(res.body.db.ok).toBe(true);
});

test('404 route không tồn tại', async () => {
  const res = await request(app).get('/xyz');
  expect(res.status).toBe(404);
  expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
});

test('mapPgError: unique violation → 409', () => {
  const err = { code: '23505', message: 'uq_tai_khoan_ten_dang_nhap' };
  const mapped = mapPgError(err);
  expect(mapped.status).toBe(409);
  expect(mapped.code).toBe('DUPLICATE_DATA');
});

test('mapPgError: trigger RAISE → 400', () => {
  const err = { code: 'P0001', message: 'Món đã nấu không thể hủy.' };
  const mapped = mapPgError(err);
  expect(mapped.status).toBe(400);
  expect(mapped.code).toBe('BUSINESS_RULE_VIOLATION');
});

test('AppError giữ nguyên khi map', () => {
  const err = AppError.badRequest('Lỗi test', 'TEST_CODE');
  const mapped = mapPgError(err);
  expect(mapped).toBe(err);
});