import pino from 'pino';
import { env } from './env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
          // Không có option tắt emoji trực tiếp,
          // nhưng có thể ẩn "emoji" bằng cách dùng message không emoji
        },
      }
    : undefined,
});