const express = require('express');
const router = express.Router();

const {
  getUsers, getUserById, createUser, updateUser, deleteUser,
} = require('../controllers/userController');

const { protect, authorize } = require('../middleware/authMiddleware');
const { validateCreateUser, validateUpdateUser } = require('../middleware/validationMiddleware');

// All routes require login + ADMIN or CLIENT role
router.use(protect);
router.use(authorize('ADMIN', 'CLIENT'));

router.route('/')
  .get(getUsers)
  .post(validateCreateUser, createUser);

router.route('/:id')
  .get(getUserById)
  .put(validateUpdateUser, updateUser)
  .delete(deleteUser);

module.exports = router;