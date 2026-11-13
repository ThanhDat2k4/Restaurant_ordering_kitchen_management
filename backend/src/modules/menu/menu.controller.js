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

export async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      throw AppError.badRequest('Vui lòng chọn file ảnh');
    }
    // Đường dẫn URL công khai (VD: /uploads/1a2b3c.jpg)
    const imagePath = `/uploads/${req.file.filename}`;
    
    const result = await menuService.updateItemImage(parseInt(req.params.id), imagePath, req.user.userId);
    sendSuccess(res, { message: 'Upload thành công', data: result });
  } catch (err) { next(err); }
}