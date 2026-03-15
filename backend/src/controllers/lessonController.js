const Lesson = require('../models/Lesson');
const Course = require('../models/Course');

async function recalcCourseStats(courseId) {
    const lessons = await Lesson.find({ courseId });
    const totalLessons = lessons.length;
    const totalDuration = lessons.reduce((sum, l) => sum + (l.duration || 0), 0);
    await Course.findByIdAndUpdate(courseId, {
        totalLessons,
        totalDuration: Math.round(totalDuration / 60),
    });
}

const createLesson = async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const { title, type, content, resources, videoUrl, duration, order, isPreview } = req.body;
        const maxOrder = await Lesson.findOne({ courseId }).sort({ order: -1 }).select('order');
        const nextOrder = order != null ? order : (maxOrder?.order || 0) + 1;
        const lesson = await Lesson.create({
            courseId,
            title: title || 'Untitled Lesson',
            type: type || 'video',
            content: content || '',
            resources: resources || '',
            videoUrl: videoUrl || '',
            duration: duration || 0,
            order: nextOrder,
            isPreview: isPreview || false,
        });
        await recalcCourseStats(courseId);
        const populated = await Lesson.findById(lesson._id).lean();
        return res.status(201).json({ success: true, data: populated });
    } catch (error) {
        next(error);
    }
};

const updateLesson = async (req, res, next) => {
    try {
        const { title, type, content, resources, videoUrl, duration, order, isPreview } = req.body;
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (type !== undefined) updateData.type = type;
        if (content !== undefined) updateData.content = content;
        if (resources !== undefined) updateData.resources = resources;
        if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
        if (duration !== undefined) updateData.duration = duration;
        if (order !== undefined) updateData.order = order;
        if (isPreview !== undefined) updateData.isPreview = isPreview;
        const lesson = await Lesson.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
        await recalcCourseStats(lesson.courseId);
        return res.status(200).json({ success: true, data: lesson });
    } catch (error) {
        next(error);
    }
};

const getLessonById = async (req, res, next) => {
    try {
        // isLessonOwner already loaded and validated req.lesson
        const lesson = req.lesson?.toObject ? req.lesson.toObject() : req.lesson;
        if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found.' });
        return res.status(200).json({ success: true, data: lesson });
    } catch (error) {
        next(error);
    }
};

const deleteLesson = async (req, res, next) => {
    try {
        const courseId = req.lesson.courseId;
        await Lesson.findByIdAndDelete(req.params.id);
        await recalcCourseStats(courseId);
        return res.status(200).json({ success: true, message: 'Lesson deleted.' });
    } catch (error) {
        next(error);
    }
};

const reorderLessons = async (req, res, next) => {
    try {
        const { courseId, lessons } = req.body;
        if (!courseId || !Array.isArray(lessons)) {
            return res.status(400).json({ success: false, message: 'courseId and lessons array required.' });
        }
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
        const isOwner = course.instructorId.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';
        if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Access denied.' });
        for (const item of lessons) {
            await Lesson.findByIdAndUpdate(item.id, { order: item.order });
        }
        return res.status(200).json({ success: true, message: 'Lessons reordered.' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getLessonById,
    createLesson,
    updateLesson,
    deleteLesson,
    reorderLessons,
};
