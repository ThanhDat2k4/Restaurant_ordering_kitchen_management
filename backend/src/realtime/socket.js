import { Server } from 'socket.io';
import { verifyAccessToken } from '../shared/jwt.js';
import { eventBus, EVENTS } from './event-bus.js';
import { env } from '../config/env.js';

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.FRONTEND_URL, credentials: true },
  });

  // Xác thực JWT khi kết nối Socket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Thiếu token'));
    try {
      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Token không hợp lệ'));
    }
  });

  io.on('connection', (socket) => {
    // Tự động join room theo Role (VD: ROLE_DAU_BEP, ROLE_PHUC_VU)
    socket.join(`ROLE_${socket.user.role}`);
    console.log(`[Socket] Kết nối: User ${socket.user.sub} (${socket.user.role})`);
  });

  // LẮNG NGHE EVENT BUS & PHÁT XUỐNG CLIENT
  
  // Khi có phiếu bếp mới -> Báo cho màn hình Bếp
  eventBus.on(EVENTS.KITCHEN_TICKET_CREATED, (data) => {
    io.to('ROLE_DAU_BEP').emit('kitchen:newTicket', data);
  });

  // Khi bếp báo món xong -> Báo cho màn hình Phục vụ
  eventBus.on(EVENTS.ITEM_READY, (data) => {
    io.to('ROLE_PHUC_VU').emit('item:ready', data);
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket chưa được khởi tạo');
  return io;
}