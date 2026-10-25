// Event Bus: nơi Service publish sự kiện, Socket.io subscribe
// Tách rời Service khỏi Socket.io (Observer Pattern)
import { EventEmitter } from 'node:events';

class TypedEventBus extends EventEmitter {}

export const eventBus = new TypedEventBus();

// Set max listener cao để không bị warning
eventBus.setMaxListeners(50);

// ═══════════════════════════════════════════════════════════
// DANH SÁCH EVENT CHUẨN (dùng hằng để tránh typo)
// ═══════════════════════════════════════════════════════════
export const EVENTS = {
  // ─── Đơn hàng ───
  ORDER_CREATED:            'order.created',           // Bếp nhận đơn mới
  ORDER_ITEMS_SENT:         'order.itemsSent',         // Đã gửi bếp
  ORDER_STATUS_CHANGED:     'order.statusChanged',     // Trạng thái đơn đổi
  ORDER_CANCELLED:          'order.cancelled',

  // ─── Bếp ───
  KITCHEN_TICKET_CREATED:   'kitchen.ticketCreated',   // Phiếu bếp mới
  KITCHEN_TICKET_WARNING:   'kitchen.ticketWarning',   // Phiếu quá thời gian
  ITEM_STATUS_CHANGED:      'item.statusChanged',      // Món đổi trạng thái
  ITEM_READY:               'item.ready',              // Món sẵn sàng

  // ─── Thanh toán ───
  PAYMENT_COMPLETED:        'payment.completed',
  TABLE_FREED:              'table.freed',

  // ─── Menu ───
  MENU_AVAILABILITY_CHANGED:'menu.availabilityChanged',// Món hết/còn

  // ─── Khách gọi ───
  STAFF_CALL_REQUESTED:     'staff.callRequested',
};