const Course = require('../models/Course');

const approveCourse = async (req, res, next) => {
    try {
        const { action } = req.body;
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
        if (action === 'approve') course.status = 'active';
        else if (action === 'reject') course.status = 'rejected';
        else return res.status(400).json({ success: false, message: 'action must be approve or reject.' });
        await course.save();
        const populated = await Course.findById(course._id)
            .populate('instructorId', 'fullName email avatar')
            .populate('categoryId', 'name slug');
        return res.status(200).json({ success: true, data: populated });
    } catch (error) {
        next(error);
    }
};

const updateCourseStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const allowed = ['active', 'rejected', 'disabled'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ success: false, message: `status must be one of: ${allowed.join(', ')}.` });
        }
        const course = await Course.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true })
            .populate('instructorId', 'fullName email avatar')
            .populate('categoryId', 'name slug');
        if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
        return res.status(200).json({ success: true, data: course });
    } catch (error) {
        next(error);
    }
};

const listPendingCourses = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const filter = {};
        // Khi status = "all" hoặc undefined → hiển thị tất cả khóa học
        if (status && status !== 'all') filter.status = status;
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;
        const [courses, total] = await Promise.all([
            Course.find(filter)
                .populate('instructorId', 'fullName email avatar')
                .populate('categoryId', 'name slug')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Course.countDocuments(filter),
        ]);
        return res.status(200).json({
            success: true,
            data: { courses, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    approveCourse,
    updateCourseStatus,
    listPendingCourses,
};
