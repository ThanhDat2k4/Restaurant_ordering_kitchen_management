export function sendSuccess(res, data, status = 200) {
  res.status(status).json({ success: true, data });
}

export function sendError(res, error) {
  const status = error.status || 500;
  const body = {
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Lỗi hệ thống',
    },
  };
  if (error.details) body.error.details = error.details;
  res.status(status).json(body);
}