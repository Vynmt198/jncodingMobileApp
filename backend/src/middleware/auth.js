const { verifyToken } = require('../config/jwt');
const User = require('../models/User');

/**
 * Authentication middleware (BR6)
 * Verify JWT token and attach user to req.user
 */
const auth = async (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
            });
        }

        const token = authHeader.split(' ')[1];

        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token has expired. Please login again.',
                });
            }
            return res.status(401).json({
                success: false,
                message: 'Invalid token.',
            });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found.',
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support.',
            });
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = auth;
