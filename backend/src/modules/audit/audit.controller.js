import * as service from './audit.service.js';
import { sendSuccess } from '../../shared/response.js';

export async function getAuditLogs(req, res, next) {
  try { 
    const page = parseInt(req.query.page) || 1;
    sendSuccess(res, await service.getAuditLogs(page)); 
  } catch (err) { next(err); }
}