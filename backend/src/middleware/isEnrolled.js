const Enrollment = require('../models/Enrollment');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const Course = require('../models/Course');

/**
 * Middleware to check if the user is enrolled in the course.
 * Also handles nested routes like /lessons/:id and /quizzes/:id
 * by finding their parent courseId.
 */
const isEnrolled = async (req, res, next) => {
    try {
        let courseId = req.params.courseId || req.params.id; // Try standard routes

        // If route is /lessons/:id/content
        if (req.originalUrl.includes('/lessons/')) {
            const lesson = await Lesson.findById(req.params.id);
            if (!lesson) {
                return res.status(404).json({ success: false, message: 'Lesson not found.' });
            }
            courseId = lesson.courseId;
        }

        // If route is /quizzes/:id
        if (req.originalUrl.includes('/quizzes/')) {
            const quiz = await Quiz.findById(req.params.id);
            if (!quiz) {
                return res.status(404).json({ success: false, message: 'Quiz not found.' });
            }
            const lesson = await Lesson.findById(quiz.lessonId);
            if (!lesson) {
                return res.status(404).json({ success: false, message: 'Associated lesson not found.' });
            }
            courseId = lesson.courseId;
        }

        if (!courseId) {
            return res.status(400).json({ success: false, message: 'Invalid request: course ID could not be determined.' });
        }

        // Check if user is enrolled
        const enrollment = await Enrollment.findOne({
            userId: req.user._id,
            courseId: courseId,
            status: 'active'
        });

        if (!enrollment) {
            // Allow instructor of this course (and admin) to access learn/discussion
            if (req.user.role === 'admin') {
                req.courseId = courseId;
                return next();
            }
            const course = await Course.findById(courseId);
            if (course && course.instructorId && course.instructorId.toString() === req.user._id.toString()) {
                req.courseId = courseId;
                return next();
            }
            return res.status(403).json({
                success: false,
                message: 'Access denied. You are not enrolled in this course or your enrollment is inactive.'
            });
        }

        // Attach courseId to request for convenience in downstream handlers
        req.courseId = courseId;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = isEnrolled;
