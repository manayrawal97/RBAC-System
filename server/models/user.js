const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');

/**
 * User model — maps to 'users' table in MySQL
 * Sequelize auto-creates the table on first run
 */
const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        len: { args: [3, 30], msg: 'Username must be 3–30 characters' },
        notEmpty: { msg: 'Username is required' },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: { msg: 'Email already exists.' },
      validate: {
        isEmail: { msg: 'Provide a valid email address' },
        notEmpty: { msg: 'Email is required' },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: { args: [6, 255], msg: 'Password must be at least 6 characters' },
      },
    },
    userType: {
      type: DataTypes.ENUM('ADMIN', 'CLIENT', 'USER'),
      defaultValue: 'USER',
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      // References another user's id — self-referential foreign key
      references: { model: 'Users', key: 'id' },
      onDelete: 'SET NULL',
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    resetPasswordExpire: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: 'users',
    timestamps: true,        // adds createdAt and updatedAt columns
    defaultScope: {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] },
    },
    scopes: {
      withPassword: { attributes: {} }, // include all fields including password
    },
  }
);

/**
 * Hook: hash password before creating or updating a user
 */
const hashPasswordHook = async (user) => {
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
};

User.beforeCreate(hashPasswordHook);
User.beforeUpdate(hashPasswordHook);

/**
 * Instance method: compare entered password with stored hash
 */
User.prototype.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Instance method: generate password reset token
 */
User.prototype.generatePasswordResetToken = function () {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = new Date(Date.now() + 3600000); // 1 hour
  return resetToken;
};

module.exports = User;