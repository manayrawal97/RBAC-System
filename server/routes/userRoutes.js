const express = require('express');
const router = express.Router();

const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateMyProfile,   // ← new
  deleteUser,
} = require('../controllers/userController')

const { protect, authorize } = require('../middleware/authMiddleware')
const {
  validateCreateUser,
  validateUpdateUser,
  validateUpdateProfile,  // ← new
} = require('../middleware/validationMiddleware')

// All routes require login
router.use(protect)

// ── Self-profile route — any authenticated user (no role restriction) ──
// IMPORTANT: /me must be defined BEFORE /:id
// otherwise Express matches "me" as an :id param
router.put('/me', validateUpdateProfile, updateMyProfile)
router.get('/me', (req, res) => {
  const { sendSuccess } = require('../utils/apiResponse')
  return sendSuccess(res, 200, 'Profile fetched.', { user: req.user })
})

// ── User management routes — ADMIN and CLIENT only ──
router.route('/')
  .get(authorize('ADMIN', 'CLIENT'), getUsers)
  .post(authorize('ADMIN', 'CLIENT'), validateCreateUser, createUser)

router.route('/:id')
  .get(authorize('ADMIN', 'CLIENT'), getUserById)
  .put(authorize('ADMIN', 'CLIENT'), validateUpdateUser, updateUser)
  .delete(authorize('ADMIN', 'CLIENT'), deleteUser)

module.exports = router


// const express = require('express');
// const router = express.Router();

// const {
//   getUsers, getUserById, createUser, updateUser, deleteUser,
// } = require('../controllers/userController');

// const { protect, authorize } = require('../middleware/authMiddleware');
// const { validateCreateUser, validateUpdateUser } = require('../middleware/validationMiddleware');

// // All routes require login + ADMIN or CLIENT role
// router.use(protect);
// router.use(authorize('ADMIN', 'CLIENT'));

// router.route('/')
//   .get(getUsers)
//   .post(validateCreateUser, createUser);

// router.route('/:id')
//   .get(getUserById)
//   .put(validateUpdateUser, updateUser)
//   .delete(deleteUser);

// module.exports = router;