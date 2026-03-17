const { body, validationResult } = require('express-validator');

/**
 * Middleware to check validation results and return errors
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
        });
    }
    next();
};

const validateRegister = [
    body('email')
        .trim()
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number'),
    body('fullName')
        .trim()
        .notEmpty().withMessage('Full name is required')
        .isLength({ max: 100 }).withMessage('Full name cannot exceed 100 characters'),
    validate,
];

const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required'),
    validate,
];


// Forgot password validation

const validateForgotPassword = [
    body('email')
        .trim()
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),
    validate,
];


// Reset password validation

const validateResetToken = [
    body('token')
        .notEmpty().withMessage('Reset token is required'),
    body('newPassword')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number'),
    validate,
];


// Update profile validation

const validateUpdateProfile = [
    body('fullName')
        .optional()
        .trim()
        .notEmpty().withMessage('Full name cannot be empty')
        .isLength({ max: 100 }).withMessage('Full name cannot exceed 100 characters'),
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
    body('avatar')
        .optional()
        .isURL().withMessage('Avatar must be a valid URL'),
    body('instructorHeadline')
        .optional()
        .trim()
        .isLength({ max: 150 }).withMessage('Headline cannot exceed 150 characters'),
    body('instructorBio')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Instructor bio cannot exceed 2000 characters'),
    body('instructorSkills')
        .optional()
        .isArray().withMessage('Instructor skills must be an array of strings'),
    body('instructorSkills.*')
        .optional()
        .isString().withMessage('Each instructor skill must be a string'),
    body('instructorWebsite')
        .optional()
        .isURL().withMessage('Website must be a valid URL'),
    body('instructorFacebook')
        .optional()
        .isURL().withMessage('Facebook must be a valid URL'),
    body('instructorYoutube')
        .optional()
        .isURL().withMessage('Youtube must be a valid URL'),
    body('instructorLinkedin')
        .optional()
        .isURL().withMessage('LinkedIn must be a valid URL'),
    validate,
];

// Change password validation
const validateChangePassword = [
    body('currentPassword')
        .notEmpty().withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number'),
    validate,
];

// Review validation
const validateCreateReview = [
    body('courseId')
        .trim()
        .notEmpty().withMessage('Course ID is required')
        .isMongoId().withMessage('Course ID must be a valid MongoDB ID'),
    body('rating')
        .notEmpty().withMessage('Rating is required')
        .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('reviewText')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Review text cannot exceed 1000 characters'),
    validate,
];

const validateUpdateReview = [
    body('rating')
        .optional()
        .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('reviewText')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Review text cannot exceed 1000 characters'),
    validate,
];

module.exports = {
    validateRegister,
    validateLogin,
    validateForgotPassword,
    validateResetToken,
    validateUpdateProfile,
    validateChangePassword,
    validateCreateReview,
    validateUpdateReview,
};
