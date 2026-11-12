import * as service from './promotion.service.js';
import { sendSuccess } from '../../shared/response.js';

export async function getPromotions(req, res, next) {
  try { sendSuccess(res, await service.getPromotions()); } catch (err) { next(err); }
}
export async function createPromotion(req, res, next) {
  try { sendSuccess(res, await service.createPromotion(req.body, req.user.userId), 201); } catch (err) { next(err); }
}
export async function updateStatus(req, res, next) {
  try { sendSuccess(res, await service.updatePromotionStatus(parseInt(req.params.id), req.body.status, req.user.userId)); } catch (err) { next(err); }
}