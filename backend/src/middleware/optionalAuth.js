const { verifyToken } = require('../config/jwt');
const User = require('../models/User');

/**
 * Optional authentication - sets req.user if valid token, otherwise continues without
 * Used for routes that need to check ownership for some cases but allow anonymous access for others
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = verifyToken(token);
        } catch {
            return next();
        }

        const user = await User.findById(decoded.userId);
        if (user && user.isActive) {
            req.user = user;
        }
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = optionalAuth;
