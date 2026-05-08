const { verifyToken } = require('../utils/generateToken');
const User = require('../models/User');
const { sendError } = require('../utils/apiResponse');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return sendError(res, 401, 'Access denied. Please log in.');

  try {
    const decoded = verifyToken(token);

    // Sequelize uses findByPk (find by primary key) instead of findById
    const user = await User.findByPk(decoded.id);
    if (!user) return sendError(res, 401, 'User no longer exists.');
    if (!user.isActive) return sendError(res, 401, 'Account deactivated.');

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Session expired. Please log in again.');
    }
    return sendError(res, 401, 'Invalid token. Please log in again.');
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userType)) {
      return sendError(res, 403, `Access denied. Required: ${roles.join(' or ')}`);
    }
    next();
  };
};

module.exports = { protect, authorize };