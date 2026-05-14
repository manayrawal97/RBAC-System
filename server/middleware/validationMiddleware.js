const { body, validationResult } = require('express-validator');
const { sendError } = require('../utils/apiResponse');

// Collects validation errors and returns 400 if any exist
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const messages = errors.array().map(e => ({
            field: e.path,
            message: e.msg,
        }));
        return sendError(res, 400, 'Validation failed', messages);
        // return sendError(res, 400, errors.array()[0].msg);
    }
    next();
};

// ── Register ──────────────────────────────────────────
const validateRegister = [
    body('username').trim().notEmpty().withMessage('Username is required').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('userType').optional().isIn(['ADMIN', 'CLIENT', 'USER']).withMessage('Invalid user type'),
    handleValidation,
];

// ── Login ─────────────────────────────────────────────
const validateLogin = [
    body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidation,
];

// ── Forgot password ───────────────────────────────────
const validateForgotPassword = [
    body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
    handleValidation,
];

// ── Reset password ────────────────────────────────────
const validateResetPassword = [
    body('token').notEmpty().withMessage('Reset token is required.'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    handleValidation,
]

// ── Create / Update user ──────────────────────────────
const validateCreateUser = [
    body('username').trim().notEmpty().withMessage('Username is required').isLength({ min: 3 }).withMessage('Minimum 3 characters'),
    body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Minimum 6 characters'),
    body('userType').optional().isIn(['ADMIN', 'CLIENT', 'USER']).withMessage('Invalid user type'),
    handleValidation,
];

const validateUpdateUser = [
    body('username').optional().trim().isLength({ min: 3 }).withMessage('Minimum 3 characters'),
    body('email').optional().trim().isEmail().withMessage('Valid email required').normalizeEmail(),
    body('userType').optional().isIn(['ADMIN', 'CLIENT', 'USER']).withMessage('Invalid user type'),
    handleValidation,
];

// Add this alongside your existing validators      <-------- New

const validateUpdateProfile = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3–30 characters.'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Provide a valid email address.')
    .normalizeEmail(),

  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters.'),

  // Hard block — prevent any attempt to escalate role via this route
  body('userType')
    .not().exists()
    .withMessage('You cannot change your own role.'),

  handleValidation,
]


module.exports = {
    validateRegister,
    validateLogin,
    validateForgotPassword,
    validateResetPassword,
    validateCreateUser,
    validateUpdateUser,
    validateUpdateProfile,   // ← new add in this
};