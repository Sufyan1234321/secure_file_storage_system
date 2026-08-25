export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  console.error(error);

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Email is already registered'
    });
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'File must be 110 MB or smaller' });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Something went wrong'
  });
}
