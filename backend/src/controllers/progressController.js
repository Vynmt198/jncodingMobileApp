const Progress = require('../models/Progress');
const Lesson = require('../models/Lesson');

/**
 * @route POST /api/progress/mark-complete
 * @desc Mark a lesson as completed
 */
exports.markLessonComplete = async (req, res, next) => {
    try {
        const { lessonId } = req.body;

        if (!lessonId) {
            return res.status(400).json({ success: false, message: 'lessonId is required' });
        }

        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        // With quiz lessons, completion must come from passing the quiz attempt.
        // This prevents learners from manually marking quiz lessons as completed.
        if (lesson.type === 'quiz') {
            return res.status(400).json({
                success: false,
                message: 'Với bài học dạng quiz, bạn cần làm quiz và đạt để được tính là hoàn thành.',
            });
        }

        // Upsert progress
        const progress = await Progress.findOneAndUpdate(
            { userId: req.user._id, lessonId },
            {
                courseId: lesson.courseId,
                isCompleted: true,
                completedAt: new Date()
            },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            data: progress
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route PUT /api/progress/update-position
 * @desc Update user video position and time spent
 */
exports.updateVideoPosition = async (req, res, next) => {
    try {
        const { lessonId, lastPosition, timeSpent } = req.body;

        if (!lessonId) {
            return res.status(400).json({ success: false, message: 'lessonId is required' });
        }

        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        const updateData = { courseId: lesson.courseId };
        if (lastPosition !== undefined) updateData.lastPosition = lastPosition;

        // If updating time spent, we might want to increment rather than replace, 
        // but for simplicity according to schema, let's allow setting it or incrementing
        const progress = await Progress.findOneAndUpdate(
            { userId: req.user._id, lessonId },
            {
                $set: updateData,
                ...(timeSpent !== undefined && { $inc: { timeSpent: timeSpent } }) // increment timeSpent
            },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            data: progress
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route GET /api/progress/:courseId
 * @desc Get user progress for a specific course
 */
exports.getCourseProgress = async (req, res, next) => {
    try {
        const courseId = req.params.courseId;

        const progress = await Progress.find({ courseId, userId: req.user._id });

        res.status(200).json({
            success: true,
            data: progress
        });
    } catch (error) {
        next(error);
    }
};
