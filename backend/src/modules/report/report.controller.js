import * as reportService from './report.service.js';
import { sendSuccess } from '../../shared/response.js';

export async function getDashboard(req, res, next) {
  try { sendSuccess(res, await reportService.getDashboard()); } catch (err) { next(err); }
}

export async function getRevenueByDay(req, res, next) {
  try { sendSuccess(res, await reportService.getRevenueByDay()); } catch (err) { next(err); }
}

export async function getBestSellingItems(req, res, next) {
  try { sendSuccess(res, await reportService.getBestSellingItems()); } catch (err) { next(err); }
}

export async function getKitchenPerformance(req, res, next) {
  try { sendSuccess(res, await reportService.getKitchenPerformance()); } catch (err) { next(err); }
}