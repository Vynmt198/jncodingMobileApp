const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Progress = require('../models/Progress');
const Quiz = require('../models/Quiz');

/**
 * @route GET /api/courses/:id/learn
 * @desc Get course learning data including lessons, progress, and quizId for quiz lessons
 */
exports.getCourseLearningData = async (req, res, next) => {
    try {
        const courseId = req.params.id;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (course.status !== 'active') {
            return res.status(403).json({ success: false, message: 'This course is not active' });
        }

        // Get all lessons for the course, sorted by order
        const lessons = await Lesson.find({ courseId }).sort({ order: 1 }).select('-content -videoUrl');
        const quizLessons = lessons.filter((l) => l.type === 'quiz');
        const quizByLesson = {};
        if (quizLessons.length > 0) {
            const quizzes = await Quiz.find({ lessonId: { $in: quizLessons.map((l) => l._id) } }).select('_id lessonId');
            quizzes.forEach((q) => {
                quizByLesson[q.lessonId.toString()] = q._id;
            });
        }
        const lessonsWithQuizId = lessons.map((l) => {
            const plain = l.toObject ? l.toObject() : { ...l };
            if (l.type === 'quiz' && quizByLesson[l._id.toString()]) {
                plain.quizId = quizByLesson[l._id.toString()];
            }
            return plain;
        });

        // Get user progress for these lessons
        const progress = await Progress.find({ courseId, userId: req.user._id });

        // Calculate % completion
        const totalLessons = lessons.length;
        const completedLessons = progress.filter(p => p.isCompleted).length;
        const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        res.status(200).json({
            success: true,
            data: {
                course: {
                    _id: course._id,
                    title: course.title,
                    instructorId: course.instructorId ? course.instructorId.toString() : null,
                },
                lessons: lessonsWithQuizId,
                progress,
                completionPercentage
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route GET /api/lessons/:id/content
 * @desc Get specific lesson content
 */
exports.getLessonContent = async (req, res, next) => {
    try {
        const lessonId = req.params.id;

        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        // Find or create progress record for this lesson when accessed
        let progress = await Progress.findOne({ lessonId, userId: req.user._id });
        if (!progress) {
            progress = await Progress.create({
                userId: req.user._id,
                courseId: lesson.courseId,
                lessonId: lessonId
            });
        }

        res.status(200).json({
            success: true,
            data: {
                lesson,
                progress
            }
        });
    } catch (error) {
        next(error);
    }
};
