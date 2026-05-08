const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,       // MongoDB enforces no duplicate emails
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,      // NEVER returned in queries by default
    },
    userType: {
      type: String,
      enum: ['ADMIN', 'CLIENT', 'USER'],
      default: 'USER',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',        // Reference to whoever created this user
      default: null,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }  // Adds createdAt and updatedAt automatically
);

/**
 * Pre-save hook: hash password before saving to DB
 * Only runs when password field is new or changed
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);       // 12 rounds = strong security
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Instance method: compare entered password with stored hash
 * Used in login — bcrypt.compare() does the work
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Instance method: generate a password reset token
 * Returns plain token (to send to user), stores hashed version in DB
 */
userSchema.methods.generatePasswordResetToken = function () {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash before storing — plain token only travels via email
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 3600000; // 1 hour
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);