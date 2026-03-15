const express = require('express');
const router = express.Router();

const {
    listUsers,
    updateUserRole,
    toggleUserStatus,
} = require('../controllers/adminUserController');
const {
    approveCourse,
    updateCourseStatus,
    listPendingCourses,
} = require('../controllers/adminCourseController');
const { getSystemStats } = require('../controllers/adminStatsController');
const {
    listLessons,
    toggleLessonVisibility,
    listComments,
    deleteComment,
    listReviews,
    listReports,
    resolveReport,
} = require('../controllers/adminContentController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

// All admin routes require auth + isAdmin
router.use(auth, isAdmin);

// @route   GET /api/admin/stats
// @desc    System stats for dashboard (revenue, new students, courses, revenue chart)
router.get('/stats', getSystemStats);

// Content moderation
router.get('/content/lessons', listLessons);
router.patch('/content/lessons/:id/visibility', toggleLessonVisibility);
router.get('/content/comments', listComments);
router.delete('/content/comments/:id', deleteComment);
router.get('/content/reports', listReports);
router.patch('/content/reports/:id', resolveReport);
router.get('/content/reviews', listReviews);

// @route   GET /api/admin/users
// @desc    List all users with pagination & filters
// @access  Admin
router.get('/users', listUsers);

// @route   PUT /api/admin/users/:id/role
// @desc    Update a user's role
// @access  Admin
router.put('/users/:id/role', updateUserRole);

// @route   PUT /api/admin/users/:id/status
// @desc    Toggle user account active status
// @access  Admin
router.put('/users/:id/status', toggleUserStatus);

router.get('/courses', listPendingCourses);
router.put('/courses/:id/approve', approveCourse);
router.put('/courses/:id/status', updateCourseStatus);

module.exports = router;
