import { PaymentFacade } from './payment.facade.js';
import { sendSuccess } from '../../shared/response.js';

export async function pay(req, res, next) {
  try {
    const result = await PaymentFacade.pay(parseInt(req.params.id), req.body, req.user.userId);
    sendSuccess(res, result, 201);
  } catch (err) { next(err); }
}