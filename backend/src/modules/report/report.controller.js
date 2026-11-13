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

export async function exportRevenueExcel(req, res, next) {
  try {
    const buffer = await reportService.generateRevenueExcel();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="BaoCaoDoanhThu.xlsx"');
    
    res.send(buffer);
  } catch (err) { next(err); }
}