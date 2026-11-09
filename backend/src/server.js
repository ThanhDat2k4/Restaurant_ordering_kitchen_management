import http from 'node:http';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { testConnection } from './database/pool.js';

async function bootstrap() {
  logger.info('Kiem tra ket noi DB...');
  try {
    const db = await testConnection();
    logger.info(`DB OK ${db.version} | now=${db.now} | tz=${db.timezone}`);
  } catch (err) {
    logger.error({ err }, 'Không ket noi duoc DB');
    process.exit(1);
  }

  const httpServer = http.createServer(app);

  // Socket.io sẽ gắn ở Sprint 4
  // const { initSocket } = await import('./realtime/socket.js');
  // initSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    logger.info(`Server: http://localhost:${env.PORT}`);
    logger.info(`Health: http://localhost:${env.PORT}/api/v1/health`);
    logger.info(`Ready:  http://localhost:${env.PORT}/api/v1/health/ready`);
  });

  const shutdown = (sig) => {
    logger.info(`${sig} received, shutting down...`);
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch(err => {
  logger.error({ err }, 'Bootstrap failed');
  process.exit(1);
});