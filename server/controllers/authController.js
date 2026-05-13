const crypto = require('crypto');
const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Helper — safe user object to return (no password)
const safeUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  userType: user.userType,
  createdAt: user.createdAt,
});

// ── Register ──────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { username, email, password, userType } = req.body;

    const exists = await User.findOne({ where: { email } });
    if (exists) return sendError(res, 409, 'Email already registered.');

    const user = await User.create({
      username, email, password,
      userType: userType || 'USER',
    });

    const token = generateToken(user.id, user.userType);
    return sendSuccess(res, 201, 'Account created successfully.', {
      token, user: safeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// ── Login ─────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Use withPassword scope to include the password field
    const user = await User.scope('withPassword').findOne({ where: { email } });
    if (!user) return sendError(res, 401, 'Invalid email or password.');
    if (!user.isActive) return sendError(res, 401, 'Account deactivated.');

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return sendError(res, 401, 'Invalid email or password.');

    const token = generateToken(user.id, user.userType);
    return sendSuccess(res, 200, 'Login successful.', {
      token, user: safeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// ── Logout ────────────────────────────────────────────────────────
const logout = async (req, res) => {
  return sendSuccess(res, 200, 'Logged out successfully.');
};

// ── Get current user ──────────────────────────────────────────────
const getMe = async (req, res) => {
  return sendSuccess(res, 200, 'Profile fetched.', { user: req.user });
};

// ── Forgot password ───────────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.scope('withPassword').findOne({ where: { email } });

    if (!user) {
      return sendSuccess(res, 200, 'If that email exists, a reset link was sent.');
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    return sendSuccess(res, 200, 'Reset token generated.', {
      resetToken, // ⚠️ Remove in production — send via email only
      resetUrl,
    });
  } catch (error) {
    next(error);
  }
};

// ── Reset password ────────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body   // ← changed from req.params + req.body.password

    if (!token) return sendError(res, 400, 'Reset token is required.')

    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const { Op } = require('sequelize');
    const user = await User.scope('withPassword').findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { [Op.gt]: new Date() },
      },
    });

    if (!user) return sendError(res, 400, 'Invalid or expired reset token.');

    user.password = newPassword          // hashed by beforeUpdate hook
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    const jwtToken = generateToken(user.id, user.userType)
    return sendSuccess(res, 200, 'Password reset successful.', { token: jwtToken })
  } catch (error) {
    next(error)
  }
};

module.exports = { register, login, logout, getMe, forgotPassword, resetPassword };