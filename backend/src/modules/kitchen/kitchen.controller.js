import * as service from './kitchen.service.js';
import { sendSuccess } from '../../shared/response.js';

export async function getTickets(req, res, next) {
  try { sendSuccess(res, await service.getTickets()); } catch (err) { next(err); }
}

export async function updateItemStatus(req, res, next) {
  try {
    const result = await service.updateItemStatus(parseInt(req.params.itemId), req.body.status, req.user.userId);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}