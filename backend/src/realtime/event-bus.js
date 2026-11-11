import { EventEmitter } from 'node:events';

export const eventBus = new EventEmitter();

// Định nghĩa các loại sự kiện để tránh gõ sai chính tả
export const EVENTS = {
  KITCHEN_TICKET_CREATED: 'kitchen.ticket.created',
  ITEM_READY: 'item.ready',
  ITEM_SERVED: 'item.served',
  PAYMENT_COMPLETED: 'payment.completed',
  TABLE_FREED: 'table.freed',
};