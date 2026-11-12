import * as authService from './auth.service.js';
import { sendSuccess } from '../../shared/response.js';

export async function login(req, res, next) {
  try {
    const result = await authService.login({
      identifier: req.body.identifier,
      mat_khau: req.body.mat_khau,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Set refresh token vào HttpOnly Cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      path: '/api/v1/auth',
    });

    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    await authService.logout({ sid: req.user.sid });
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    sendSuccess(res, { ok: true });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const data = await authService.getMe(req.user.userId);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    // Lấy từ body hoặc cookie
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    const result = await authService.refresh({
      refreshToken,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });

    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const result = await authService.changePassword(req.user.userId, req.body.mat_khau_cu, req.body.mat_khau_moi);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}