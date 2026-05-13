const express = require('express');
const router = express.Router();

const { register, login, logout, getMe, forgotPassword, resetPassword } = require('../controllers/authController');
//                                        ↑ was 'forgetPassword'

const { protect } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin, validateForgotPassword, validateResetPassword } = require('../middleware/validationMiddleware');
//                                        ↑ was 'ValidateForgotPassword'  ↑ was 'validateRestPassword'

// Public — no token needed
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);

// Protected — token required
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;