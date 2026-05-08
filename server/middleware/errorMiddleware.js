/**
 * Global error handler — registered LAST in server.js
 * Catches any error thrown with next(error) in controllers
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Sequelize unique constraint (duplicate email)
  if (err.name === 'SequelizeUniqueConstraintError') {
    message = err.errors[0]?.message || 'Duplicate value entered.';
    statusCode = 409;
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({ field: e.path, message: e.message }));
    return res.status(400).json({ success: false, message: 'Validation Error', errors });
  }

  // Sequelize connection error
  if (err.name === 'SequelizeConnectionError') {
    message = 'Database connection failed.';
    statusCode = 503;
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;