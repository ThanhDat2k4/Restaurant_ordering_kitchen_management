import * as orderService from './order.service.js';
import { sendSuccess } from '../../shared/response.js';

export async function createOrder(req, res, next) {
  try {
    // Lấy Idempotency-Key từ Header (nếu client gửi)
    const idempotencyKey = req.headers['idempotency-key'];
    
    // Context: Nếu là khách (table token) thì userId = null, ngược lại là nhân viên
    const ctx = {
      userId: req.user ? req.user.userId : null,
    };

    // Nếu là khách, ghi đè ma_ban từ Table Token (không tin body)
    if (req.table) {
      req.body.ma_ban = req.table.maBan;
      req.body.loai_don = 'TAI_BAN'; // Khách chỉ được đặt tại bàn
    }

    const result = await orderService.createOrder(req.body, ctx, idempotencyKey);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function getOrders(req, res, next) {
  try {
    sendSuccess(res, await orderService.getOrders());
  } catch (err) {
    next(err);
  }
}

export async function getOrderById(req, res, next) {
  try {
    sendSuccess(res, await orderService.getOrderById(parseInt(req.params.id)));
  } catch (err) {
    next(err);
  }
}

export async function confirmOrder(req, res, next) {
  try {
    const result = await orderService.confirmOrder(parseInt(req.params.id), req.user.userId);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

// Phục vụ xác nhận món đã ra bàn
export async function serveItem(req, res, next) {
  try {
    const itemId = parseInt(req.params.itemId);
    const result = await orderService.serveItem(itemId, req.user.userId);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function cancelOrder(req, res, next) {
  try {
    const result = await orderService.cancelOrder(parseInt(req.params.id), req.body.ly_do, req.user.userId);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function cancelItem(req, res, next) {
  try {
    const result = await orderService.cancelItem(parseInt(req.params.itemId), req.body.ly_do, req.user.userId);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function applyCoupon(req, res, next) {
  try {
    const result = await orderService.applyCoupon(parseInt(req.params.id), req.body.code, req.user.userId);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function removeCoupon(req, res, next) {
  try {
    const result = await orderService.removeCoupon(parseInt(req.params.id), req.user.userId);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}