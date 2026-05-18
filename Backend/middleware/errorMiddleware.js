const { errorResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

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
