const express = require('express');
const router = express.Router();

const { getProfile, getPublicProfile, updateProfile, changePassword } = require('../controllers/userController');
const { validateUpdateProfile, validateChangePassword } = require('../utils/validators');
const auth = require('../middleware/auth');

// @route   GET /api/users/:id/public-profile
// @desc    Get public profile of a user (e.g. instructor) – no auth required
// @access  Public
router.get('/:id/public-profile', getPublicProfile);

// All other user routes require authentication
router.use(auth);

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', getProfile);

// @route   PUT /api/users/profile
// @desc    Update current user's profile
// @access  Private
router.put('/profile', validateUpdateProfile, updateProfile);

// @route   PUT /api/users/change-password
// @desc    Change current user's password
// @access  Private
router.put('/change-password', validateChangePassword, changePassword);

module.exports = router;
