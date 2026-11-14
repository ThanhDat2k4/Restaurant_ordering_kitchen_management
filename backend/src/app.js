import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import settingRoutes from './modules/setting/setting.routes.js';
import promotionRoutes from './modules/promotion/promotion.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import reportRoutes from './modules/report/report.routes.js';
import kitchenRoutes from './modules/kitchen/kitchen.routes.js';
import paymentRoutes from './modules/payment/payment.routes.js';
import orderRoutes from './modules/order/order.routes.js';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDocument = JSON.parse(readFileSync(new URL('../swagger-output.json', import.meta.url)));

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

app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/menu', menuRoutes);
app.use('/api/v1', tableRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/kitchen', kitchenRoutes);
app.use('/api/v1', paymentRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/promotions', promotionRoutes);
app.use('/api/v1/settings', settingRoutes);
app.use('/api/v1/audit-logs', auditRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;