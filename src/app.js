import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';           // ⬅️ THÊM
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { testConnection } from './db/pool.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import authRoutes from './modules/auth/auth.routes.js';  // ⬅️ THÊM

const app = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());                             // ⬅️ THÊM

app.use(pinoHttp({
  level: env.LOG_LEVEL,
  customProps: (req) => ({ reqId: req.id }),
  autoLogging: { ignore: (req) => req.url === '/health' || req.url === '/health/db' },
}));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'restaurant-backend', timestamp: new Date().toISOString() });
});

app.get('/health/db', async (req, res) => {
  try {
    const db = await testConnection();
    res.json({ status: 'OK', db });
  } catch (err) {
    res.status(503).json({ status: 'ERROR', message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// MOUNT ROUTES
// ═══════════════════════════════════════════════════════════
app.use('/api/v1/auth', authRoutes);                // ⬅️ THÊM

app.use(notFoundHandler);
app.use(errorHandler);

export default app;