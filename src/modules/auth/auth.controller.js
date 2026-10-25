import * as authService from './auth.service.js';

// POST /api/v1/auth/register
export async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ data: user });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/auth/login
export async function login(req, res, next) {
  try {
    const ip = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await authService.login({
      identifier: req.body.identifier,
      mat_khau: req.body.mat_khau,
      ip,
      userAgent,
    });

    // Set refresh token vào httpOnly cookie (bảo mật hơn localStorage)
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      path: '/api/v1/auth',
    });

    // Trả cả refreshToken trong body để client curl/demo dễ dùng
    res.json({
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
        stations: result.stations,
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/auth/logout
export async function logout(req, res, next) {
  try {
    await authService.logout({ sid: req.user.sid });
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/auth/me
export async function me(req, res, next) {
  try {
    const data = await authService.me({ userId: req.user.userId });
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/auth/refresh
export async function refresh(req, res, next) {
  try {
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

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/auth/change-password
export async function changePassword(req, res, next) {
  try {
    await authService.changePassword({
      userId: req.user.userId,
      sid: req.user.sid,
      mat_khau_cu: req.body.mat_khau_cu,
      mat_khau_moi: req.body.mat_khau_moi,
    });
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
}