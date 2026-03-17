const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Lesson = require('../models/Lesson');
const mongoose = require('mongoose');

/**
 * @route GET /api/instructor/courses
 * @desc List courses of the current instructor
 */
const ALLOWED_COURSE_STATUSES = ['draft', 'pending', 'active', 'rejected', 'disabled'];

exports.listMyCourses = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;
        const filter = { instructorId: req.user._id };
        if (status) {
            if (!ALLOWED_COURSE_STATUSES.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `status must be one of: ${ALLOWED_COURSE_STATUSES.join(', ')}.`,
                });
            }
            filter.status = status;
        }
        const [courses, total] = await Promise.all([
            Course.find(filter)
                .populate('categoryId', 'name slug')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Course.countDocuments(filter),
        ]);
        return res.status(200).json({
            success: true,
            data: {
                courses,
                pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route GET /api/instructor/courses/:id/analytics
 * @desc Get course analytics for instructor (BR19 - instructors manage own courses)
 */
exports.getCourseAnalytics = async (req, res, next) => {
    try {
        const courseId = req.params.id;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Verify ownership
        if (course.instructorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to view analytics for this course' });
        }

        const courseIdObj = new mongoose.Types.ObjectId(courseId);

        const [totalEnrollments, totalLessons, lessonDurationAgg, progressStats] = await Promise.all([
            Enrollment.countDocuments({ courseId: courseIdObj, status: 'active' }),
            Lesson.countDocuments({ courseId: courseIdObj }),
            Lesson.aggregate([
                { $match: { courseId: courseIdObj } },
                { $group: { _id: null, totalDurationSeconds: { $sum: '$duration' } } },
            ]),
            Progress.aggregate([
                { $match: { courseId: courseIdObj } },
                {
                    $group: {
                        _id: null,
                        totalTimeSpent: { $sum: '$timeSpent' },
                        completedLessons: { $sum: { $cond: ['$isCompleted', 1, 0] } },
                    },
                },
            ]),
        ]);

        const stats = progressStats.length > 0 ? progressStats[0] : { totalTimeSpent: 0, completedLessons: 0 };
        const totalDurationSecondsPerLearner = lessonDurationAgg?.[0]?.totalDurationSeconds ?? 0;
        const expectedTimeSeconds = totalDurationSecondsPerLearner * totalEnrollments;
        const totalLessonCompletionsExpected = totalLessons * totalEnrollments;

        const completionRatePercent =
            totalLessonCompletionsExpected > 0
                ? Math.round((stats.completedLessons / totalLessonCompletionsExpected) * 100)
                : 0;

        const timeSpentRatePercent =
            expectedTimeSeconds > 0 ? Math.min(100, Math.round((stats.totalTimeSpent / expectedTimeSeconds) * 100)) : 0;

        res.status(200).json({
            success: true,
            data: {
                totalEnrollments,
                totalTimeSpentSeconds: stats.totalTimeSpent,
                totalCompletedLessons: stats.completedLessons,
                totalLessons,
                expectedTimeSeconds,
                completionRatePercent,
                timeSpentRatePercent,
                courseId: course._id,
                courseTitle: course.title
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route GET /api/instructor/courses/:id/enrollments
 * @desc List enrolled students with completed/total lessons for this course
 */
exports.getCourseEnrollmentsWithProgress = async (req, res, next) => {
    try {
        const courseId = req.params.id;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        if (course.instructorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const courseIdObj = new mongoose.Types.ObjectId(courseId);

        const [totalLessons, lessonDurationAgg, enrollments] = await Promise.all([
            Lesson.countDocuments({ courseId: courseIdObj }),
            Lesson.aggregate([
                { $match: { courseId: courseIdObj } },
                { $group: { _id: null, totalDurationSeconds: { $sum: '$duration' } } },
            ]),
            Enrollment.find({ courseId: courseIdObj, status: 'active' })
            .populate('userId', 'fullName email')
            .lean(),
        ]);

        const expectedSecondsPerLearner = lessonDurationAgg?.[0]?.totalDurationSeconds ?? 0;

        const completedByUser = await Progress.aggregate([
            { $match: { courseId: courseIdObj, isCompleted: true } },
            { $group: { _id: '$userId', count: { $sum: 1 } } },
        ]);
        const completedMap = Object.fromEntries(completedByUser.map((r) => [r._id.toString(), r.count]));

        const timeSpentByUser = await Progress.aggregate([
            { $match: { courseId: courseIdObj } },
            { $group: { _id: '$userId', totalTimeSpent: { $sum: '$timeSpent' } } },
        ]);
        const timeSpentMap = Object.fromEntries(timeSpentByUser.map((r) => [r._id.toString(), r.totalTimeSpent ?? 0]));

        const list = enrollments.map((e) => {
            const user = e.userId;
            const uid = (user && typeof user === 'object' && user._id ? user._id : e.userId)?.toString?.() ?? '';
            const timeSpentSeconds = timeSpentMap[uid] ?? 0;
            const timeSpentRatePercent =
                expectedSecondsPerLearner > 0 ? Math.min(100, Math.round((timeSpentSeconds / expectedSecondsPerLearner) * 100)) : 0;
            return {
                userId: uid,
                fullName: (user && typeof user === 'object' && user.fullName) ? user.fullName : '—',
                email: (user && typeof user === 'object' && user.email) ? user.email : '',
                completedLessons: completedMap[uid] ?? 0,
                totalLessons,
                incompleteLessons: totalLessons - (completedMap[uid] ?? 0),
                timeSpentSeconds,
                timeSpentRatePercent,
            };
        });

        res.status(200).json({
            success: true,
            data: { enrollments: list, totalLessons, expectedSecondsPerLearner },
        });
    } catch (error) {
        next(error);
    }
};
