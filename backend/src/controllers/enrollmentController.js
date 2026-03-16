const Enrollment = require('../models/Enrollment');
const Lesson = require('../models/Lesson');
const Progress = require('../models/Progress');
const Course = require('../models/Course');
const mongoose = require('mongoose');

/**
 * Core handler for enrolling in a free course (price === 0).
 * Used by both POST /api/enrollments and POST /api/courses/:id/enroll.
 */
async function handleFreeEnrollment(userId, courseId, res) {
    if (!courseId) {
        return res.status(400).json({ success: false, message: 'courseId is required.' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found.' });
    }
    if (Number(course.price) !== 0) {
        return res.status(400).json({
            success: false,
            message: 'Chỉ khóa học miễn phí mới có thể đăng ký trực tiếp.',
        });
    }

    let enrollment = await Enrollment.findOne({ userId, courseId });
    if (enrollment) {
        if (enrollment.status === 'active' || enrollment.status === 'completed') {
            return res.status(200).json({
                success: true,
                message: 'Bạn đã đăng ký khóa học này.',
                data: { enrollment },
            });
        }
        enrollment.status = 'active';
        await enrollment.save();
        return res.status(200).json({
            success: true,
            message: 'Đã kích hoạt lại đăng ký.',
            data: { enrollment },
        });
    }

    enrollment = await Enrollment.create({ userId, courseId, status: 'active' });
    await Course.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: 1 } });

    return res.status(201).json({
        success: true,
        message: 'Đăng ký thành công.',
        data: { enrollment },
    });
}

/**
 * @route POST /api/enrollments
 * @desc Enroll in a free course (price === 0). Requires auth.
 */
exports.enrollFreeCourse = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { courseId } = req.body;
        await handleFreeEnrollment(userId, courseId, res);
    } catch (error) {
        next(error);
    }
};

/**
 * @route POST /api/courses/:id/enroll
 * @desc Enroll in a free course (price === 0) using courseId from route param.
 */
exports.enrollCourse = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const courseId = req.params.id;
        await handleFreeEnrollment(userId, courseId, res);
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
