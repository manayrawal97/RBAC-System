const crypto = require('crypto');
const { Op } = require('sequelize');
const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { sendPasswordResetEmail } = require('../utils/sendEmail');

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
// POST /api/auth/forgot-password
// Security rule: ALWAYS return the same response whether email exists or not.
// This prevents attackers from discovering which emails are registered.
const forgotPassword = async (req, res, next) => {
  const SAFE_RESPONSE = 'If this email is registered, a reset link has been sent.'

  try {
    const { email } = req.body

    // withPassword scope lets us access resetPasswordToken + resetPasswordExpire
    const user = await User.scope('withPassword').findOne({ where: { email } })

    // Email not found — return safe generic message, don't reveal this
    if (!user) {
      return sendSuccess(res, 200, SAFE_RESPONSE)
    }

    // Generate raw token (returned) + hashed token (stored in DB)
    const rawToken = user.generatePasswordResetToken()

    // Save hashed token + expiry — skip validation (no password change here)
    await user.save({ validate: false })

    // Build the reset URL pointing to your frontend
    const resetUrl = `${process.env.FRONTEND_URL}/forgot-password?token=${rawToken}`

    try {
      // Attempt to send the email
      await sendPasswordResetEmail(user.email, user.username, resetUrl)
      return sendSuccess(res, 200, SAFE_RESPONSE)

    } catch (emailError) {
      // Email sending failed — clean up: remove token from DB so it can't be used
      console.error('❌ Email send failed:', emailError.message)

      user.resetPasswordToken = null
      user.resetPasswordExpire = null
      await user.save({ validate: false })

      // Don't expose email error details to the client
      return sendError(res, 500, 'Failed to send reset email. Please try again later.')
    }

  } catch (error) {
    next(error)
  }
}
// const forgotPassword = async (req, res, next) => {
//   try {
//     const { email } = req.body;
//     const user = await User.scope('withPassword').findOne({ where: { email } });

//     if (!user) {
//       return sendSuccess(res, 200, 'If that email exists, a reset link was sent.');
//     }

//     const resetToken = user.generatePasswordResetToken();
//     await user.save();

//     const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
//     return sendSuccess(res, 200, 'Reset token generated.', {
//       resetToken, // ⚠️ Remove in production — send via email only
//       resetUrl,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// ── Reset password ────────────────────────────────────────────────
// POST /api/auth/reset-password
// Expects { token, newPassword } in request body
// token is the raw token from the email link query param
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body

    if (!token) {
      return sendError(res, 400, 'Reset token is required.')
    }

    // Hash the raw token to compare against the hashed version stored in DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    // Find user where token matches AND hasn't expired yet
    const user = await User.scope('withPassword').findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { [Op.gt]: new Date() },  // expiry must be in the future
      },
    })

    if (!user) {
      return sendError(res, 400, 'This reset link is invalid or has expired. Please request a new one.')
    }

    // Set new password — beforeUpdate hook in User.js handles bcrypt hashing
    user.password = newPassword
    user.resetPasswordToken = null   // invalidate token so it can't be reused
    user.resetPasswordExpire = null
    await user.save()

    // Log them in automatically by returning a fresh JWT
    const jwtToken = generateToken(user.id, user.userType)

    return sendSuccess(res, 200, 'Password reset successful. You are now logged in.', {
      token: jwtToken,
    })

  } catch (error) {
    next(error)
  }
}

// const resetPassword = async (req, res, next) => {
//   try {
//     const { token, newPassword } = req.body   // ← changed from req.params + req.body.password

//     if (!token) return sendError(res, 400, 'Reset token is required.')

//     const hashedToken = crypto
//       .createHash('sha256')
//       .update(req.params.token)
//       .digest('hex');

//     const { Op } = require('sequelize');
//     const user = await User.scope('withPassword').findOne({
//       where: {
//         resetPasswordToken: hashedToken,
//         resetPasswordExpire: { [Op.gt]: new Date() },
//       },
//     });

//     if (!user) return sendError(res, 400, 'Invalid or expired reset token.');

//     user.password = newPassword          // hashed by beforeUpdate hook
//     user.resetPasswordToken = null;
//     user.resetPasswordExpire = null;
//     await user.save();

//     const jwtToken = generateToken(user.id, user.userType)
//     return sendSuccess(res, 200, 'Password reset successful.', { token: jwtToken })
//   } catch (error) {
//     next(error)
//   }
// };

module.exports = { register, login, logout, getMe, forgotPassword, resetPassword };