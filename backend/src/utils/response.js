export function sendSuccess(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function sendError(res, message, status = 400) {
  return res.status(status).json({ success: false, message });
}
