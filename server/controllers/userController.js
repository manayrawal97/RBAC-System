const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ── GET all users ─────────────────────────────────────────────────
const getUsers = async (req, res, next) => {
  try {
    let query = {};

    // CLIENT only sees users they created
    if (req.user.userType === 'CLIENT') {
      query = { createdBy: req.user._id };
    }
    // ADMIN sees everyone — empty query = no filter

    const users = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .populate('createdBy', 'username email userType')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Users fetched.', {
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET single user ───────────────────────────────────────────────
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .populate('createdBy', 'username email userType');

    if (!user) return sendError(res, 404, 'User not found.');

    // CLIENT can only view their own created users
    if (req.user.userType === 'CLIENT' &&
      String(user.createdBy?._id || user.createdBy) !== String(req.user._id)
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

    // CLIENT can only create USER role — not CLIENT or ADMIN
    if (req.user.userType === 'CLIENT' && userType && userType !== 'USER') {
      return sendError(res, 403, 'Clients can only create users with role USER.');
    }

    const exists = await User.findOne({ email });
    if (exists) return sendError(res, 409, 'Email already registered.');

    const user = await User.create({
      username,
      email,
      password,
      userType: req.user.userType === 'CLIENT' ? 'USER' : (userType || 'USER'),
      createdBy: req.user._id, // track who made this user
    });

    return sendSuccess(res, 201, 'User created.', {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        userType: user.userType,
        createdBy: user.createdBy,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── UPDATE user ───────────────────────────────────────────────────
const updateUser = async (req, res, next) => {
  try {
    let user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, 'User not found.');

    // CLIENT can only update users they created
    if (req.user.userType === 'CLIENT' &&
      String(user.createdBy) !== String(req.user._id)
    ) {
      return sendError(res, 403, 'You can only update users you created.');
    }

    // Only ADMIN can change roles
    if (req.user.userType === 'CLIENT' && req.body.userType) {
      return sendError(res, 403, 'Clients cannot change user roles.');
    }

    // Check new email isn't already taken
    if (req.body.email && req.body.email !== user.email) {
      const taken = await User.findOne({ email: req.body.email });
      if (taken) return sendError(res, 409, 'Email already in use.');
    }

    // Whitelist updatable fields
    const allowed = ['username', 'email', 'isActive'];
    if (req.user.userType === 'ADMIN') allowed.push('userType');
    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password -resetPasswordToken -resetPasswordExpire');

    return sendSuccess(res, 200, 'User updated.', { user });
  } catch (error) {
    next(error);
  }
};

// ── DELETE user ───────────────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, 'User not found.');

    // Can't delete yourself
    if (String(user._id) === String(req.user._id)) {
      return sendError(res, 400, 'You cannot delete your own account.');
    }

    // CLIENT can only delete their own created users
    if (req.user.userType === 'CLIENT' &&
      String(user.createdBy) !== String(req.user._id)
    ) {
      return sendError(res, 403, 'You can only delete users you created.');
    }

    await User.findByIdAndDelete(req.params.id);
    return sendSuccess(res, 200, 'User deleted.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser };