// Socket.io server + subscribe Event Bus
// Phòng (rooms) được tổ chức:
//   - ROLE_<ten_vai_tro>       : VD ROLE_PHUC_VU, ROLE_DAU_BEP
//   - TRAM_<ma_tram>           : bếp theo trạm
//   - TABLE_<ma_ban>           : khách đang ở bàn
//   - USER_<ma_tai_khoan>      : thông báo cá nhân
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { eventBus, EVENTS } from './event-bus.js';
import { pool } from '../db/pool.js';

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // ─── Auth middleware ───
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('UNAUTHORIZED: thiếu token'));
      }

      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      socket.user = {
        userId: decoded.sub,
        role: decoded.role,
        sid: decoded.sid,
      };

      // Load danh sách trạm nếu là DAU_BEP
      if (decoded.role === 'DAU_BEP') {
        const res = await pool.query(
          'SELECT ma_tram FROM tai_khoan_tram WHERE ma_tai_khoan = $1',
          [decoded.sub]
        );
        socket.user.stations = res.rows.map((r) => r.ma_tram);
      }

      // Load ma_ban nếu là KHACH (table token)
      if (decoded.role === 'KHACH' && decoded.tableToken) {
        socket.user.maBan = decoded.maBan;
      }

      next();
    } catch (err) {
      console.error('[socket] Auth lỗi:', err.message);
      next(new Error('UNAUTHORIZED: token không hợp lệ'));
    }
  });

  // ─── Connection ───
  io.on('connection', (socket) => {
    const { userId, role, stations, maBan } = socket.user;
    console.log(`[socket] ✅ User ${userId} (${role}) đã kết nối`);

    // Auto-join rooms
    socket.join(`USER_${userId}`);
    socket.join(`ROLE_${role}`);
    if (stations && stations.length > 0) {
      stations.forEach((t) => socket.join(`TRAM_${t}`));
    }
    if (maBan) {
      socket.join(`TABLE_${maBan}`);
    }

    // ─── Client emit join_table (nếu khách join bàn sau khi connect) ───
    socket.on('join_table', (tableId) => {
      if (role === 'KHACH') {
        socket.join(`TABLE_${tableId}`);
        console.log(`[socket] Khách ${userId} join bàn ${tableId}`);
      }
    });

    socket.on('leave_table', (tableId) => {
      socket.leave(`TABLE_${tableId}`);
    });

    // ─── Ping/health ───
    socket.on('ping:server', (cb) => {
      if (typeof cb === 'function') cb({ pong: Date.now(), userId });
    });

    socket.on('disconnect', (reason) => {
      console.log(`[socket] ❌ User ${userId} ngắt kết nối: ${reason}`);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // SUBSCRIBE EVENT BUS → EMIT SOCKET
  // Chỉ chạy sau khi Service đã COMMIT (withTx đảm bảo)
  // ═══════════════════════════════════════════════════════════

  eventBus.on(EVENTS.KITCHEN_TICKET_CREATED, (data) => {
    // data: { ma_tram, ma_phieu_bep, ma_don, danh_sach_mon: [...] }
    io.to(`TRAM_${data.ma_tram}`).emit('kitchen:ticketCreated', data);
    console.log(`[socket] Emit kitchen:ticketCreated tới TRAM_${data.ma_tram}`);
  });

  eventBus.on(EVENTS.ITEM_READY, (data) => {
    // data: { ma_ban, ma_chi_tiet_don_hang, ten_mon, so_luong }
    if (data.ma_ban) {
      io.to(`TABLE_${data.ma_ban}`).emit('item:ready', data);
    }
    io.to('ROLE_PHUC_VU').emit('item:ready', data);
  });

  eventBus.on(EVENTS.ITEM_STATUS_CHANGED, (data) => {
    io.to('ROLE_PHUC_VU').emit('item:statusChanged', data);
    io.to('ROLE_DAU_BEP').emit('item:statusChanged', data);
  });

  eventBus.on(EVENTS.ORDER_STATUS_CHANGED, (data) => {
    if (data.ma_ban) io.to(`TABLE_${data.ma_ban}`).emit('order:statusChanged', data);
    io.to('ROLE_PHUC_VU').emit('order:statusChanged', data);
    io.to('ROLE_QUAN_LY').emit('order:statusChanged', data);
  });

  eventBus.on(EVENTS.TABLE_FREED, (data) => {
    io.to('ROLE_PHUC_VU').emit('table:freed', data);
    io.to('ROLE_QUAN_LY').emit('table:freed', data);
  });

  eventBus.on(EVENTS.MENU_AVAILABILITY_CHANGED, (data) => {
    // Broadcast toàn bộ client (mọi bàn)
    io.emit('menu:availabilityChanged', data);
  });

  eventBus.on(EVENTS.STAFF_CALL_REQUESTED, (data) => {
    io.to('ROLE_PHUC_VU').emit('staff:callRequested', data);
  });

  eventBus.on(EVENTS.KITCHEN_TICKET_WARNING, (data) => {
    io.to(`TRAM_${data.ma_tram}`).emit('kitchen:ticketWarning', data);
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.io chưa được khởi tạo.');
  return io;
}