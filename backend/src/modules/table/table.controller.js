import * as tableService from './table.service.js';
import { sendSuccess } from '../../shared/response.js';

export async function getTableMap(req, res, next) {
  try {
    sendSuccess(res, await tableService.getTableMap());
  } catch (err) { next(err); }
}

export async function guestQr(req, res, next) {
  try {
    // :token là ma_xac_thuc_qr (VD: e4b1c...)
    sendSuccess(res, await tableService.processGuestQr(req.params.token));
  } catch (err) { next(err); }
}

export async function callStaff(req, res, next) {
  try {
    // Lấy maBan từ Table Token (qua middleware), không lấy từ body
    const result = await tableService.callStaff(req.table.maBan, null);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function transferOrder(req, res, next) {
  try {
    const result = await tableService.transferOrder(req.body.ma_don_hang, req.body.ma_ban_dich, req.user.userId);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function mergeOrders(req, res, next) {
  try {
    const result = await tableService.mergeOrders(req.body.ma_don_nguon, req.body.ma_don_dich, req.user.userId);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}