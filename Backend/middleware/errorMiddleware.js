const { errorResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('\n========== ERROR DETECTED ==========');
  console.error(`Method: ${req.method}`);
  console.error(`URL: ${req.originalUrl}`);
  console.error(`Status Code: ${err.statusCode || 500}`);
  console.error(`Message: ${err.message || 'Server Error'}`);
  console.error('Stack Trace:', err.stack || err);
  console.error('====================================\n');

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';

  // Postgres unique violation
  if (err.code === '23505') {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }

  // Postgres foreign key violation
  if (err.code === '23503') {
     statusCode = 400;
     message = 'Referenced record does not exist';
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = errorHandler;
