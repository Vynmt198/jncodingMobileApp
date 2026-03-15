const Enrollment = require('../models/Enrollment');
const Lesson = require('../models/Lesson');
const Progress = require('../models/Progress');
const Course = require('../models/Course');
const mongoose = require('mongoose');

/**
 * @route POST /api/courses/:id/enroll
 * @desc Enroll in a free course (price === 0). Paid courses must use payment flow.
 */
exports.enrollCourse = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const courseId = req.params.id;

        const course = await Course.findById(courseId).select('title price').lean();
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found.' });
        }
        if (course.price > 0) {
            return res.status(400).json({
                success: false,
                message: 'Paid course. Please use the payment flow.',
            });
        }

        let enrollment = await Enrollment.findOne({ userId, courseId, status: 'active' });
        if (enrollment) {
            return res.status(200).json({
                success: true,
                message: 'Already enrolled.',
                data: { enrollment },
            });
        }

        enrollment = await Enrollment.create({ userId, courseId, status: 'active' });
        await Course.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: 1 } });

        res.status(201).json({
            success: true,
            message: 'Enrolled successfully.',
            data: { enrollment },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route GET /api/enrollments
 * @desc List current user's active enrollments with course details and progress
 */
exports.getMyEnrollments = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const enrollments = await Enrollment.find({ userId, status: 'active' })
            .populate('courseId')
            .sort({ updatedAt: -1 })
            .lean();

        if (enrollments.length === 0) {
            return res.status(200).json({
                success: true,
                data: { enrollments: [] },
            });
        }

        const courseIds = enrollments.map((e) => e.courseId?._id).filter(Boolean);
        if (courseIds.length === 0) {
            return res.status(200).json({
                success: true,
                data: { enrollments: enrollments.map((e) => ({ ...e, progress: 0, completedLessons: 0, totalLessons: 0 })) },
            });
        }

        const [lessonCounts, progressCounts] = await Promise.all([
            Lesson.aggregate([
                { $match: { courseId: { $in: courseIds } } },
                { $group: { _id: '$courseId', total: { $sum: 1 } } },
            ]),
            Progress.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId), courseId: { $in: courseIds }, isCompleted: true } },
                { $group: { _id: '$courseId', completed: { $sum: 1 } } },
            ]),
        ]);

        const totalByCourse = Object.fromEntries(lessonCounts.map((l) => [l._id.toString(), l.total]));
        const completedByCourse = Object.fromEntries(progressCounts.map((p) => [p._id.toString(), p.completed]));

        const enrollmentsWithProgress = enrollments.map((e) => {
            const cid = e.courseId?._id?.toString();
            const totalLessons = totalByCourse[cid] ?? 0;
            const completedLessons = completedByCourse[cid] ?? 0;
            const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
            return {
                ...e,
                progress,
                completedLessons,
                totalLessons,
            };
        });

        res.status(200).json({
            success: true,
            data: { enrollments: enrollmentsWithProgress },
        });
    } catch (error) {
        next(error);
    }
};
