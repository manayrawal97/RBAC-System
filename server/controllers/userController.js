const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ── GET all users ─────────────────────────────────────────────────
const getUsers = async (req, res, next) => {
  try {
    const where = req.user.userType === 'CLIENT'
      ? { createdBy: req.user.id }
      : {};

    const users = await User.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    return sendSuccess(res, 200, 'Users fetched.', {
      count: users.length, users,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET single user ───────────────────────────────────────────────
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return sendError(res, 404, 'User not found.');

    if (req.user.userType === 'CLIENT' &&
      user.createdBy !== req.user.id
    ) {
      return sendError(res, 403, 'Access denied.');
    }

    return sendSuccess(res, 200, 'User fetched.', { user });
  } catch (error) {
    next(error);
  }
};

// ── CREATE user ───────────────────────────────────────────────────
const createUser = async (req, res, next) => {
  try {
    const { username, email, password, userType } = req.body;

    if (req.user.userType === 'CLIENT' && userType && userType !== 'USER') {
      return sendError(res, 403, 'Clients can only create users with role USER.');
    }

    const exists = await User.findOne({ where: { email } });
    if (exists) return sendError(res, 409, 'Email already registered.');

    const user = await User.create({
      username, email, password,
      userType: req.user.userType === 'CLIENT' ? 'USER' : (userType || 'USER'),
      createdBy: req.user.id,
    });

    return sendSuccess(res, 201, 'User created.', { user });
  } catch (error) {
    next(error);
  }
};

// ── UPDATE user ───────────────────────────────────────────────────
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return sendError(res, 404, 'User not found.');

    if (req.user.userType === 'CLIENT' && user.createdBy !== req.user.id) {
      return sendError(res, 403, 'You can only update users you created.');
    }

    if (req.user.userType === 'CLIENT' && req.body.userType) {
      return sendError(res, 403, 'Clients cannot change user roles.');
    }

    if (req.body.email && req.body.email !== user.email) {
      const taken = await User.findOne({ where: { email: req.body.email } });
      if (taken) return sendError(res, 409, 'Email already in use.');
    }

    const allowed = ['username', 'email', 'isActive'];
    if (req.user.userType === 'ADMIN') allowed.push('userType');

    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    await user.update(updates);
    return sendSuccess(res, 200, 'User updated.', { user });
  } catch (error) {
    next(error);
  }
};

// ── UPDATE OWN PROFILE — available to ALL authenticated users ─────
// PUT /api/users/me
// Users can change username, email, password ONLY for themselves
// userType is blocked at validation layer AND here as double protection
const updateMyProfile = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware — always the logged-in user
    const user = await User.scope('withPassword').findByPk(req.user.id)

    if (!user) return sendError(res, 404, 'User not found.')

    const { username, email, password } = req.body

    // Double-check: silently strip userType even if validator missed it
    // Never allow role escalation through this endpoint
    if (req.body.userType) {
      return sendError(res, 403, 'You are not allowed to change your own role.')
    }

    // Check new email isn't already taken by someone else
    if (email && email !== user.email) {
      const taken = await User.findOne({ where: { email } })
      if (taken) return sendError(res, 409, 'That email is already in use.')
    }

    // Apply only the fields that were actually sent in the request
    if (username) user.username = username
    if (email)    user.email    = email
    if (password) user.password = password  // bcrypt hook fires on save

    await user.save()

    // Return updated user without sensitive fields
    const updatedUser = await User.findByPk(user.id)

    return sendSuccess(res, 200, 'Profile updated successfully.', {
      user: updatedUser,
    })
  } catch (error) {
    next(error)
  }
};


// ── DELETE user ───────────────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return sendError(res, 404, 'User not found.');

    if (user.id === req.user.id) {
      return sendError(res, 400, 'You cannot delete your own account.');
    }

    if (req.user.userType === 'CLIENT' && user.createdBy !== req.user.id) {
      return sendError(res, 403, 'You can only delete users you created.');
    }

    await user.destroy();
    return sendSuccess(res, 200, 'User deleted.');
  } catch (error) {
    next(error);
  }
};




module.exports = { 
  getUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  updateMyProfile,   // ← add this
  deleteUser 
};

