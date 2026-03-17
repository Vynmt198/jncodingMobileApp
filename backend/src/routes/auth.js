const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const { register, login, logout, forgotPassword, resetPassword, googleCallback } = require('../controllers/authController');
const passport = require('../config/passport');
const {
    validateRegister,
    validateLogin,
    validateForgotPassword,
    validateResetToken,
} = require('../utils/validators');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

// Rate limiting for auth endpoints 
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: {
        success: false,
        message: 'Too many attempts. Please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// @route   POST /api/auth/register
// @desc    Register a new account
// @access  Public
router.post('/register', authLimiter, validateRegister, register);

// @route   POST /api/auth/login
// @desc    Login and get JWT token
// @access  Public
router.post('/login', authLimiter, validateLogin, login);

// @route   POST /api/auth/logout
// @desc    Logout (client-side token revocation)
// @access  Public (idempotent; accepts token if provided)
router.post('/logout', optionalAuth, logout);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', authLimiter, validateForgotPassword, forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password using token from email
// @access  Public
router.post('/reset-password', validateResetToken, resetPassword);

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth flow (open this URL in a browser)
// @access  Public
router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback → returns JWT token
// @access  Public
router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=google_failed` }),
    googleCallback
);

// @route   GET /api/auth/google/failed
// @desc    Google OAuth failure
// @access  Public
router.get('/google/failed', (req, res) => {
    res.status(401).json({ success: false, message: 'Google authentication failed.' });
});

module.exports = router;
