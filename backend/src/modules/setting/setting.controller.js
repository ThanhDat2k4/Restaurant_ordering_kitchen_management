import * as service from './setting.service.js';
import { sendSuccess } from '../../shared/response.js';

export async function getSettings(req, res, next) {
  try { sendSuccess(res, await service.getSettings()); } catch (err) { next(err); }
}
export async function updateSetting(req, res, next) {
  try { 
    const result = await service.updateSetting(req.params.khoa, req.body.gia_tri, req.user.userId);
    sendSuccess(res, result); 
  } catch (err) { next(err); }
}
