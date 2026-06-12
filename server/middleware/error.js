function errorHandler(err, req, res, next) {
  console.error('服务器错误:', err);
  res.status(500).json({
    code: 500,
    message: err.message || '服务器内部错误',
    data: null,
  });
}

module.exports = errorHandler;
