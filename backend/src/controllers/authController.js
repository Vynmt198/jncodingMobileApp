const crypto = require('crypto');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { generateToken } = require('../config/jwt');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');

// POST /api/auth/register
const register = async (req, res, next) => {
    try {
        const { email, password, fullName } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email is already registered.',
            });
        }

        const user = await User.create({ email, password, fullName });
        sendWelcomeEmail(user.email, user.fullName).catch((err) =>
            console.error('[Email] Failed to send welcome email:', err.message)
        );

        return res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            data: {
                user: {
                    _id: user._id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    isActive: user.isActive,
                    avatar: user.avatar,
                    bio: user.bio,
                    instructorHeadline: user.instructorHeadline,
                    instructorBio: user.instructorBio,
                    instructorSkills: user.instructorSkills,
                    instructorWebsite: user.instructorWebsite,
                    instructorFacebook: user.instructorFacebook,
                    instructorYoutube: user.instructorYoutube,
                    instructorLinkedin: user.instructorLinkedin,
                    createdAt: user.createdAt,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/auth/login
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
            });
        }
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support.',
            });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
            });
        }
        const token = generateToken({ userId: user._id, role: user.role });

        // Update last login
        await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: {
                token,
                user: {
                    _id: user._id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    avatar: user.avatar,
                    bio: user.bio,
                    instructorHeadline: user.instructorHeadline,
                    instructorBio: user.instructorBio,
                    instructorSkills: user.instructorSkills,
                    instructorWebsite: user.instructorWebsite,
                    instructorFacebook: user.instructorFacebook,
                    instructorYoutube: user.instructorYoutube,
                    instructorLinkedin: user.instructorLinkedin,
                    lastLogin: user.lastLogin,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/auth/logout
const logout = async (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'Logged out successfully. Please discard your token.',
    });
};
// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({
                success: true,
                message: 'If that email exists, a password reset link has been sent.',
            });
        }
        const plainToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');
        await PasswordReset.deleteMany({ userId: user._id });

        await PasswordReset.create({
            userId: user._id,
            token: hashedToken,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        });

        sendPasswordResetEmail(user.email, user.fullName, plainToken).catch((err) =>
            console.error('[Email] Failed to send reset email:', err.message)
        );

        return res.status(200).json({
            success: true,
            message: 'If that email exists, a password reset link has been sent.',
            ...(process.env.NODE_ENV === 'development' && { dev_token: plainToken }),
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const resetRecord = await PasswordReset.findOne({
            token: hashedToken,
            expiresAt: { $gt: new Date() },
        });

        if (!resetRecord) {
            return res.status(400).json({
                success: false,
                message: 'Reset token is invalid or has expired.',
            });
        }

        const user = await User.findById(resetRecord.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        user.password = newPassword;
        await user.save();

        await PasswordReset.deleteMany({ userId: user._id });

        return res.status(200).json({
            success: true,
            message: 'Password has been reset successfully. Please login with your new password.',
        });
    } catch (error) {
        next(error);
    }
};

// Google OAuth Callback
const googleCallback = async (req, res, next) => {
    try {
        const user = req.user;
        const token = generateToken({ userId: user._id, role: user.role });

        await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

        // Redirect to frontend with token in query string
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        return res.redirect(`${clientUrl}/auth/callback?token=${token}`);
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, logout, forgotPassword, resetPassword, googleCallback };
