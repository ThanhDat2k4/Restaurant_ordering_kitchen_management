import menuRoutes from './modules/menu/menu.routes.js';
import tableRoutes from './modules/table/table.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { testConnection } from './database/pool.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(pinoHttp({ logger }));

// ─── Health check ───
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    message: 'Bep Nha Backend is running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/health/ready', async (req, res) => {
  try {
    const db = await testConnection();
    res.json({ success: true, db });
  } catch (err) {
    res.status(503).json({ success: false, error: { code: 'DB_UNAVAILABLE', message: err.message } });
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTES — Sprint 1 sẽ mount /auth, Sprint 2 /menu, ...
// ═══════════════════════════════════════════════════════════════
// import authRoutes from './modules/auth/auth.routes.js';
// app.use('/api/v1/auth', authRoutes);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/menu', menuRoutes);
app.use('/api/v1/', tableRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;