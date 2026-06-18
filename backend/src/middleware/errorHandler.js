const config = require('../config/env');

function notFoundHandler(req, res, next) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  // Translate a few common Postgres errors into friendly messages.
  let message = err.message || 'Something went wrong.';
  if (err.code === '23505') {
    message = 'That record already exists or conflicts with an existing one.';
  } else if (err.code === '23503') {
    message = 'This action references a record that does not exist.';
  } else if (err.code === '23P01') {
    message = 'This time slot conflicts with an existing schedule.';
  }

  if (statusCode === 500 && config.nodeEnv !== 'test') {
    console.error(err);
  }

  res.status(statusCode).json({
    error: message,
    ...(config.nodeEnv === 'development' && statusCode === 500 ? { stack: err.stack } : {}),
  });
}

module.exports = { notFoundHandler, errorHandler };
