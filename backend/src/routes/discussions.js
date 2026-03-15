const express = require('express');
const router = express.Router();

const {
    getDiscussions,
    getReplies,
    createDiscussion,
    replyToDiscussion,
    pinDiscussion,
    deleteDiscussion,
    likeDiscussion,
    reportDiscussion,
} = require('../controllers/discussionController');

const auth = require('../middleware/auth');

/**
 * @route   GET /api/discussions/:courseId
 * @desc    Get top-level discussions for a course
 * @access  Private (auth, enrolled learner or instructor/admin)
 * Business Rules: BR10
 */
router.get('/:courseId', auth, getDiscussions);

/**
 * @route   GET /api/discussions/:courseId/:postId/replies
 * @desc    Get replies for a specific discussion post
 * @access  Private (auth, enrolled)
 */
router.get('/:courseId/:postId/replies', auth, getReplies);

/**
 * @route   POST /api/discussions
 * @desc    Create a new discussion post (enrolled learners only)
 * @access  Private (auth, isEnrolled)
 * Business Rules: BR10
 */
router.post('/', auth, createDiscussion);

/**
 * @route   POST /api/discussions/:id/reply
 * @desc    Reply to a discussion post (enrolled learners only)
 * @access  Private (auth, isEnrolled)
 * Business Rules: BR10
 */
router.post('/:id/reply', auth, replyToDiscussion);

/**
 * @route   PUT /api/discussions/:id/pin
 * @desc    Pin/unpin a discussion post (instructor of course or admin)
 * @access  Private (auth, isInstructorOrAdmin)
 * Business Rules: BR22, BR23
 */
router.put('/:id/pin', auth, pinDiscussion);

/**
 * @route   POST /api/discussions/:id/like
 * @desc    Like a discussion post or reply
 * @access  Private (auth)
 */
router.post('/:id/like', auth, likeDiscussion);

/**
 * @route   POST /api/discussions/:id/report
 * @desc    Report a discussion (spam, inappropriate) for admin review
 * @access  Private (auth)
 */
router.post('/:id/report', auth, reportDiscussion);

/**
 * @route   DELETE /api/discussions/:id
 * @desc    Soft-delete a discussion (owner, instructor of course, or admin)
 * @access  Private (auth)
 * Business Rules: BR22, BR23
 */
router.delete('/:id', auth, deleteDiscussion);

module.exports = router;
