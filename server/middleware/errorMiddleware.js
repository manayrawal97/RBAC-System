/**
 * Global error handler — registered LAST in server.js
 * Catches any error thrown with next(error) in controllers
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Duplicate field (e.g. email already exists)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists.`;
    statusCode = 409;
  }

  // Invalid MongoDB ObjectId (e.g. /users/not-a-valid-id)
  if (err.name === 'CastError') {
    message = 'Resource not found.';
    statusCode = 404;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({ success: false, message: 'Validation Error', errors });
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;