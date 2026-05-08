const { verifyToken } = require('../utils/generateToken');
const User = require('../models/User');
const { sendError } = require('../utils/apiResponse');

/**
 * protect — verifies JWT token on every protected request
 * Attaches the logged-in user to req.user
 */
const protect = async (req, res, next) => {
  let token;

  // Token comes in the Authorization header as: Bearer <token>
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendError(res, 401, 'Access denied. Please log in.');
  }

  try {
    const decoded = verifyToken(token); // throws if expired or invalid

    // Fetch fresh user from DB to confirm they still exist
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return sendError(res, 401, 'User no longer exists.');
    if (!user.isActive) return sendError(res, 401, 'Account deactivated.');

    req.user = user; // attach to request — available in all controllers
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Session expired. Please log in again.');
    }
    return sendError(res, 401, 'Invalid token. Please log in again.');
  }
};

/**
 * authorize — restricts route to specific roles
 * Always used AFTER protect
 * Usage: authorize('ADMIN') or authorize('ADMIN', 'CLIENT')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userType)) {
      return sendError(res, 403,
        `Access denied. Required role: ${roles.join(' or ')}`
      );
    }
    next();
  };
};

module.exports = { protect, authorize };