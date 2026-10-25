import http from 'node:http';
import app from './app.js';
import { initSocket } from './realtime/socket.js';
import { env } from './config/env.js';
import { testConnection } from './db/pool.js';

async function bootstrap() {
  // 1. Test DB trước khi khởi động server
  console.log('🔍 Kiểm tra kết nối Database...');
  try {
    const db = await testConnection();
    console.log(`✅ DB OK — ${db.version} | now=${db.now}`);
  } catch (err) {
    console.error('❌ Không kết nối được DB:', err.message);
    console.error('   Kiểm tra biến DATABASE_URL trong .env');
    process.exit(1);
  }

  // 2. Tạo HTTP server + attach Socket.io
  const httpServer = http.createServer(app);
  initSocket(httpServer);

  // 3. Listen
  httpServer.listen(env.PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log(`🚀 Server: http://localhost:${env.PORT}`);
    console.log(`🌍 Env:    ${env.NODE_ENV}`);
    console.log(`🔌 Socket: ws://localhost:${env.PORT}`);
    console.log(`💚 Health: http://localhost:${env.PORT}/health`);
    console.log(`💚 DB:     http://localhost:${env.PORT}/health/db`);
    console.log('═══════════════════════════════════════════');
    console.log('');
  });

  // 4. Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n⚠️  Nhận ${signal}, đang tắt server...`);
    httpServer.close(() => {
      console.log('✅ Server đã đóng.');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('❌ Lỗi khởi động:', err);
  process.exit(1);
});