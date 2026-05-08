// import crypto from 'crypto';
// or
const crypto = require('crypto');

const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ── Register ──────────────────────────────────────────────────────
// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { username, email, password, userType } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return sendError(res, 409, 'Email already registered.');

    // Password gets hashed automatically by the pre-save hook in User model
    const user = await User.create({
      username, email, password,
      userType: userType || 'USER',
    });

    const token = generateToken(user._id, user.userType);

    return sendSuccess(res, 201, 'Account created successfully.', {
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        userType: user.userType,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Login ─────────────────────────────────────────────────────────
// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Must use .select('+password') because password has select:false in schema
    const user = await User.findOne({ email }).select('+password');

    if (!user) return sendError(res, 401, 'Invalid email or password.');
    if (!user.isActive) return sendError(res, 401, 'Account deactivated.');

    // bcrypt.compare() happens inside matchPassword()
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return sendError(res, 401, 'Invalid email or password.');

    const token = generateToken(user._id, user.userType);

    return sendSuccess(res, 200, 'Login successful.', {
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        userType: user.userType,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};


// ── Logout ────────────────────────────────────────────────────────
// POST /api/auth/logout  (token deletion handled on frontend)
const logout = async (req, res) => {
  return sendSuccess(res, 200, 'Logged out successfully.');
};

// ── Get current user ──────────────────────────────────────────────
// GET /api/auth/me
const getMe = async (req, res) => {
  return sendSuccess(res, 200, 'Profile fetched.', { user: req.user });
};

// ── Forgot password ───────────────────────────────────────────────
// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return success — prevents exposing which emails are registered
    if (!user) {
      return sendSuccess(res, 200, 'If that email exists, a reset link was sent.')
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // In production: send resetToken via email (Nodemailer/SendGrid)
    // For now returning it directly so you can test in Postman
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    return sendSuccess(res, 200, 'Reset token generated.', {
      resetToken,  // ⚠️ Remove in production — send via email only
      resetUrl,
    });
  } catch (error) {
    next(error);
  }
};

// ── Reset password ────────────────────────────────────────────────
// POST /api/auth/reset-password/:token
const resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
      const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }, // not expired
    });

    if (!user) return sendError(res, 400, 'Invalid or expired reset token.');

    user.password = req.body.password; // hashed by pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = generateToken(user._id, user.userType);
    return sendSuccess(res, 200, 'Password reset successful.', { token });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, getMe, forgotPassword, resetPassword };

