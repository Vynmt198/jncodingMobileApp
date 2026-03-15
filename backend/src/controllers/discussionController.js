const Discussion = require('../models/Discussion');
const DiscussionReport = require('../models/DiscussionReport');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

/**
 * Helper: verify the user is actively enrolled in the course
 */
const checkEnrolled = async (userId, courseId) => {
    const enrollment = await Enrollment.findOne({ userId, courseId, status: 'active' });
    return !!enrollment;
};

/**
 * Helper: can user participate in discussions? (enrolled, or instructor of course, or admin)
 */
const checkCanParticipate = async (userId, courseId, userRole) => {
    if (userRole === 'admin') return true;
    const enrolled = await checkEnrolled(userId, courseId);
    if (enrolled) return true;
    const course = await Course.findById(courseId);
    if (course && course.instructorId && course.instructorId.toString() === userId.toString()) return true;
    return false;
};

/**
 * GET /api/discussions/:courseId
 * Get top-level discussions (posts) for a course, with reply counts.
 * @access Private (auth, isEnrolled)
 * Business Rules: BR10 – only enrolled learners
 */
exports.getDiscussions = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const pageNumber = Number(req.query.page) || 1;
        const limitNumber = Number(req.query.limit) || 20;
        const skip = (pageNumber - 1) * limitNumber;

        // Verify: learner must be enrolled; instructor of course or admin can view without enrollment
        const enrolled = await checkEnrolled(req.user._id, courseId);
        let canView = enrolled || req.user.role === 'admin';
        if (!canView && req.user.role === 'instructor') {
            const course = await Course.findById(courseId);
            canView = !!(course && course.instructorId && course.instructorId.toString() === req.user._id.toString());
        }
        if (!canView) {
            return res.status(403).json({
                success: false,
                message: 'You must be enrolled in this course to view discussions.',
            });
        }

        const filter = {
            courseId,
            parentId: null,            // top-level posts only
            status: { $ne: 'deleted' },
        };
        const lessonIdParam = req.query.lessonId;
        if (lessonIdParam) {
            filter.lessonId = lessonIdParam;
        }

        const [posts, total] = await Promise.all([
            Discussion.find(filter)
                .populate('userId', 'fullName avatar')
                .populate('lessonId', 'title order')
                .sort({ isPinned: -1, createdAt: -1 })
                .skip(skip)
                .limit(limitNumber)
                .lean(),
            Discussion.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                discussions: posts,
                pagination: {
                    total,
                    page: pageNumber,
                    limit: limitNumber,
                    pages: Math.ceil(total / limitNumber),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/discussions/:courseId/:postId/replies
 * Get replies for a specific discussion post
 * @access Private (auth, enrolled)
 */
exports.getReplies = async (req, res, next) => {
    try {
        const { courseId, postId } = req.params;
        const pageNumber = Number(req.query.page) || 1;
        const limitNumber = Number(req.query.limit) || 20;
        const skip = (pageNumber - 1) * limitNumber;

        const enrolled = await checkEnrolled(req.user._id, courseId);
        let canViewReplies = enrolled || req.user.role === 'admin';
        if (!canViewReplies && req.user.role === 'instructor') {
            const course = await Course.findById(courseId);
            canViewReplies = !!(course && course.instructorId && course.instructorId.toString() === req.user._id.toString());
        }
        if (!canViewReplies && req.user.role === 'learner') {
            return res.status(403).json({ success: false, message: 'You must be enrolled to view replies.' });
        }
        if (!canViewReplies) {
            return res.status(403).json({ success: false, message: 'Access denied to view replies.' });
        }

        const [replies, total] = await Promise.all([
            Discussion.find({ parentId: postId, status: { $ne: 'deleted' } })
                .populate('userId', 'fullName avatar')
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(limitNumber),
            Discussion.countDocuments({ parentId: postId, status: { $ne: 'deleted' } }),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                replies,
                pagination: { total, page: pageNumber, limit: limitNumber, pages: Math.ceil(total / limitNumber) },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/discussions
 * Create a new top-level discussion post
 * @access Private (auth, isEnrolled)
 * Business Rules: BR10
 */
exports.createDiscussion = async (req, res, next) => {
    try {
        const { courseId, title, content, lessonId } = req.body;
        const userId = req.user._id;

        if (!courseId || !content) {
            return res.status(400).json({ success: false, message: 'courseId and content are required.' });
        }

        // Verify: enrolled, or instructor of course, or admin (so instructor can reply too)
        const canParticipate = await checkCanParticipate(userId, courseId, req.user.role);
        if (!canParticipate) {
            return res.status(403).json({
                success: false,
                message: 'You must be enrolled in this course (or be the instructor) to post a discussion.',
            });
        }

        const discussion = await Discussion.create({
            courseId,
            userId,
            parentId: null,
            title: title || null,
            content,
            lessonId: lessonId || null,
        });

        await discussion.populate('userId', 'fullName avatar');
        await discussion.populate('lessonId', 'title order');

        return res.status(201).json({
            success: true,
            message: 'Discussion post created successfully.',
            data: { discussion },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/discussions/:id/reply
 * Reply to a discussion post
 * @access Private (auth, isEnrolled)
 * Business Rules: BR10
 */
exports.replyToDiscussion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { courseId, content } = req.body;
        const userId = req.user._id;

        if (!content) {
            return res.status(400).json({ success: false, message: 'content is required.' });
        }

        // Find the parent post
        const parent = await Discussion.findById(id);
        if (!parent || parent.status === 'deleted') {
            return res.status(404).json({ success: false, message: 'Discussion post not found.' });
        }

        // Use parent's courseId if not provided
        const targetCourseId = courseId || parent.courseId.toString();

        // Verify: enrolled, or instructor of course, or admin (instructor can reply)
        const canParticipate = await checkCanParticipate(userId, targetCourseId, req.user.role);
        if (!canParticipate) {
            return res.status(403).json({
                success: false,
                message: 'You must be enrolled in this course (or be the instructor) to reply.',
            });
        }

        const reply = await Discussion.create({
            courseId: targetCourseId,
            userId,
            parentId: parent._id,
            content,
        });

        // Increment repliesCount on parent post
        await Discussion.findByIdAndUpdate(parent._id, { $inc: { repliesCount: 1 } });

        await reply.populate('userId', 'fullName avatar');

        return res.status(201).json({
            success: true,
            message: 'Reply posted successfully.',
            data: { reply },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/discussions/:id/pin
 * Pin or unpin a discussion post
 * @access Private (auth, instructor of course or admin) – BR22, BR23
 */
exports.pinDiscussion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const discussion = await Discussion.findById(id);
        if (!discussion || discussion.status === 'deleted') {
            return res.status(404).json({ success: false, message: 'Discussion not found.' });
        }

        if (discussion.parentId !== null) {
            return res.status(400).json({ success: false, message: 'Only top-level posts can be pinned.' });
        }

        // Authorization: admin can pin any; instructor can pin in their own course
        if (user.role !== 'admin') {
            if (user.role !== 'instructor') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Instructor or admin privileges required.',
                });
            }

            // Verify instructor owns the course
            const course = await Course.findById(discussion.courseId);
            if (!course || course.instructorId.toString() !== user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only pin discussions in your own courses.',
                });
            }
        }

        discussion.isPinned = !discussion.isPinned;
        await discussion.save();

        return res.status(200).json({
            success: true,
            message: `Discussion ${discussion.isPinned ? 'pinned' : 'unpinned'} successfully.`,
            data: { discussion },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/discussions/:id
 * Soft-delete a discussion (owner or admin)
 * @access Private (auth) – BR22
 */
exports.deleteDiscussion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const discussion = await Discussion.findById(id);
        if (!discussion || discussion.status === 'deleted') {
            return res.status(404).json({ success: false, message: 'Discussion not found.' });
        }

        // Authorization: owner, instructor of course, or admin
        const isOwner = discussion.userId.toString() === user._id.toString();
        const isAdmin = user.role === 'admin';

        let isInstructorOfCourse = false;
        if (user.role === 'instructor') {
            const course = await Course.findById(discussion.courseId);
            isInstructorOfCourse = course && course.instructorId.toString() === user._id.toString();
        }

        if (!isOwner && !isAdmin && !isInstructorOfCourse) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only delete your own posts.',
            });
        }

        // Soft-delete
        discussion.status = 'deleted';
        await discussion.save();

        // If it was a reply, decrement parent's repliesCount
        if (discussion.parentId) {
            await Discussion.findByIdAndUpdate(discussion.parentId, { $inc: { repliesCount: -1 } });
        }

        return res.status(200).json({
            success: true,
            message: 'Discussion deleted successfully.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/discussions/:id/like
 * Like a discussion post or reply
 * @access Private (auth)
 */
exports.likeDiscussion = async (req, res, next) => {
    try {
        const { id } = req.params;

        const discussion = await Discussion.findById(id);
        if (!discussion || discussion.status === 'deleted') {
            return res.status(404).json({ success: false, message: 'Discussion not found.' });
        }

        await Discussion.findByIdAndUpdate(id, { $inc: { likesCount: 1 } });

        return res.status(200).json({
            success: true,
            message: 'Liked successfully.',
            data: { likesCount: discussion.likesCount + 1 },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/discussions/:id/report
 * Report a discussion post or reply (spam, inappropriate, etc.)
 * @access Private (auth) – user must be able to view the course
 */
exports.reportDiscussion = async (req, res, next) => {
    try {
        const { id: discussionId } = req.params;
        const { reason } = req.body || {};
        const userId = req.user._id;

        const discussion = await Discussion.findById(discussionId)
            .populate('courseId', '_id');
        if (!discussion || discussion.status === 'deleted') {
            return res.status(404).json({ success: false, message: 'Discussion not found.' });
        }

        const courseId = discussion.courseId?._id ?? discussion.courseId;
        const canView = await checkCanParticipate(userId, courseId, req.user.role);
        if (!canView) {
            return res.status(403).json({
                success: false,
                message: 'You cannot report a comment in a course you do not have access to.',
            });
        }

        const authorId = discussion.userId && discussion.userId._id ? discussion.userId._id : discussion.userId;
        if (authorId && authorId.toString() === userId.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Bạn không thể báo cáo bình luận của chính mình.',
            });
        }

        const existing = await DiscussionReport.findOne({
            discussionId,
            reportedBy: userId,
            status: 'pending',
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã báo cáo bình luận này rồi. Admin sẽ xem xét.',
            });
        }

        await DiscussionReport.create({
            discussionId,
            reportedBy: userId,
            reason: reason && String(reason).trim() ? String(reason).trim().slice(0, 500) : undefined,
            status: 'pending',
        });

        return res.status(201).json({
            success: true,
            message: 'Báo cáo đã gửi. Admin sẽ xem xét.',
        });
    } catch (error) {
        next(error);
    }
};
