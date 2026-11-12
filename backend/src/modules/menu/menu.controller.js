import * as menuService from './menu.service.js';
import { sendSuccess } from '../../shared/response.js';

export async function getMenu(req, res, next) {
  try {
    sendSuccess(res, await menuService.getMenu());
  } catch (err) { next(err); }
}

export async function getMenuItem(req, res, next) {
  try {
    sendSuccess(res, await menuService.getMenuItem(parseInt(req.params.id)));
  } catch (err) { next(err); }
}

export async function updateStatus(req, res, next) {
  try {
    const result = await menuService.updateStatus(parseInt(req.params.id), req.body.status, req.user.userId);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function createMenuItem(req, res, next) {
  try {
    const result = await menuService.createMenuItem(req.body, req.user.userId);
    sendSuccess(res, result, 201);
  } catch (err) { next(err); }
}