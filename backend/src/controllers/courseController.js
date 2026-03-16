const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');
const mongoose = require('mongoose');

const listCourses = async (req, res, next) => {
    try {
        const { page = 1, limit = 12, sortBy = 'newest', sortOrder = 'desc' } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;
        const filter = { status: 'active' };
        const sortOptions = {
            newest: { createdAt: sortOrder === 'asc' ? 1 : -1 },
            popular: { enrollmentCount: sortOrder === 'asc' ? 1 : -1 },
            price: { price: sortOrder === 'asc' ? 1 : -1 },
        };
        const sort = sortOptions[sortBy] || sortOptions.newest;
        const [courses, total] = await Promise.all([
            Course.find(filter)
                .populate('instructorId', 'fullName avatar')
                .populate('categoryId', 'name slug')
                .sort(sort)
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

const searchCourses = async (req, res, next) => {
    try {
        const { q, category, level, priceType, page = 1, limit = 12, sortBy = 'newest' } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;
        const filter = { status: 'active' };
        if (category && mongoose.Types.ObjectId.isValid(category)) filter.categoryId = new mongoose.Types.ObjectId(category);
        if (level) filter.level = level;
        if (priceType === 'free') filter.price = 0;
        if (priceType === 'paid') filter.price = { $gt: 0 };
        if (q && q.trim()) {
            filter.$or = [
                { title: { $regex: q.trim(), $options: 'i' } },
                { description: { $regex: q.trim(), $options: 'i' } },
            ];
        }
        const sortOptions = { newest: { createdAt: -1 }, popular: { enrollmentCount: -1 }, price: { price: 1 } };
        const sort = sortOptions[sortBy] || sortOptions.newest;
        const [courses, total] = await Promise.all([
            Course.find(filter)
                .populate('instructorId', 'fullName avatar')
                .populate('categoryId', 'name slug')
                .sort(sort)
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

const autocomplete = async (req, res, next) => {
    try {
        const { q, limit = 10 } = req.query;
        if (!q || q.trim().length < 2) return res.status(200).json({ success: true, data: [] });
        const list = await Course.find(
            { status: 'active', title: { $regex: q.trim(), $options: 'i' } },
            { title: 1 }
        )
            .limit(parseInt(limit, 10))
            .lean();
        return res.status(200).json({ success: true, data: list });
    } catch (error) {
        next(error);
    }
};

const getCourseById = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('instructorId', 'fullName avatar bio')
            .populate('categoryId', 'name slug');
        if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
        const instrId = course.instructorId?._id || course.instructorId;
        const isOwnerOrAdmin = req.user && (instrId?.toString() === req.user._id?.toString() || req.user.role === 'admin');
        if (course.status !== 'active' && !isOwnerOrAdmin) {
            return res.status(404).json({ success: false, message: 'Course not found.' });
        }
        let isEnrolled = false;
        let enrollmentStatus = null;
        let hasCertificate = false;

        if (req.user) {
            const [enrollment, certificate] = await Promise.all([
                Enrollment.findOne({
                    userId: req.user._id,
                    courseId: course._id,
                    status: { $in: ['active', 'completed'] },
                }).lean(),
                Certificate.findOne({
                    userId: req.user._id,
                    courseId: course._id,
                }).lean(),
            ]);

            if (enrollment) {
                isEnrolled = true;
                enrollmentStatus = enrollment.status;
            }
            if (certificate) {
                hasCertificate = true;
                // Nếu đã có chứng chỉ mà enrollment chưa ở trạng thái completed thì coi như completed
                if (!enrollmentStatus) {
                    enrollmentStatus = 'completed';
                }
            }
        }

        const payload = {
            ...course.toObject(),
            isEnrolled,
            enrollmentStatus,
            hasCertificate,
        };

        return res.status(200).json({ success: true, data: payload });
    } catch (error) {
        next(error);
    }
};

const getCurriculum = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
        const instrId = course.instructorId?.toString?.() || course.instructorId;
        const isOwnerOrAdmin = req.user && (instrId === req.user._id?.toString() || req.user.role === 'admin');
        if (course.status !== 'active' && !isOwnerOrAdmin) {
            return res.status(404).json({ success: false, message: 'Course not found.' });
        }
        const lessons = await Lesson.find({ courseId: req.params.id })
            .sort({ order: 1 })
            .select('title type duration order isPreview')
            .lean();
        return res.status(200).json({ success: true, data: lessons });
    } catch (error) {
        next(error);
    }
};

const createCourse = async (req, res, next) => {
    try {
        const { title, description, syllabus, categoryId, level, price, thumbnail, estimatedCompletionHours } = req.body;
        const course = await Course.create({
            title,
            description: description || '',
            syllabus: syllabus || '',
            instructorId: req.user._id,
            categoryId: categoryId || null,
            level: level || 'all-levels',
            price: price ?? 0,
            thumbnail: thumbnail || null,
            estimatedCompletionHours: estimatedCompletionHours || 0,
            status: 'draft',
        });
        const populated = await Course.findById(course._id)
            .populate('instructorId', 'fullName avatar')
            .populate('categoryId', 'name slug');
        return res.status(201).json({ success: true, data: populated });
    } catch (error) {
        next(error);
    }
};

const updateCourse = async (req, res, next) => {
    try {
        const { title, description, syllabus, categoryId, level, price, thumbnail, estimatedCompletionHours, submitForReview } = req.body;
        const isDraft = req.course.status === 'draft';
        const canEditFull = isDraft || req.course.status === 'rejected';
        const updateData = {};
        if (canEditFull) {
            if (title !== undefined) updateData.title = title;
            if (categoryId !== undefined) updateData.categoryId = categoryId || null;
            if (level !== undefined) updateData.level = level;
            if (price !== undefined) updateData.price = price;
        }
        if (description !== undefined) updateData.description = description;
        if (syllabus !== undefined) updateData.syllabus = syllabus;
        if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
        if (estimatedCompletionHours !== undefined) updateData.estimatedCompletionHours = estimatedCompletionHours;
        if (submitForReview === true && (req.course.status === 'draft' || req.course.status === 'rejected')) {
            updateData.status = 'pending';
        }
        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        )
            .populate('instructorId', 'fullName avatar')
            .populate('categoryId', 'name slug');
        return res.status(200).json({ success: true, data: course });
    } catch (error) {
        next(error);
    }
};

const deleteCourse = async (req, res, next) => {
    try {
        await Lesson.deleteMany({ courseId: req.params.id });
        await Course.findByIdAndDelete(req.params.id);
        return res.status(200).json({ success: true, message: 'Course deleted.' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    listCourses,
    searchCourses,
    autocomplete,
    getCourseById,
    getCurriculum,
    createCourse,
    updateCourse,
    deleteCourse,
};
