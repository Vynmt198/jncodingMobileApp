const Quiz = require('../models/Quiz');
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');

/**
 * GET /api/instructor/lessons/:lessonId/quiz
 * Get quiz for a lesson (instructor only, owner)
 */
const getQuizByLesson = async (req, res, next) => {
    try {
        const lessonId = req.params.lessonId;
        const quiz = await Quiz.findOne({ lessonId }).lean();
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found for this lesson.' });
        }
        return res.status(200).json({ success: true, data: quiz });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/instructor/lessons/:lessonId/quiz
 * Create or replace quiz for a lesson
 */
const createOrUpdateQuiz = async (req, res, next) => {
    try {
        const lessonId = req.params.lessonId;
        const { title, questions, passingScore, timeLimit } = req.body;
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found.' });
        if (lesson.type !== 'quiz') {
            return res.status(400).json({ success: false, message: 'Lesson must be of type quiz.' });
        }
        const course = await Course.findById(lesson.courseId);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
        const isOwner = course.instructorId?.toString() === req.user._id?.toString();
        const isAdmin = req.user.role === 'admin';
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        const questionsList = Array.isArray(questions)
            ? questions.filter((q) => q && (q.questionText || '').toString().trim())
            : [];
        const payload = {
            lessonId,
            title: title || lesson.title || 'Quiz',
            questions: questionsList,
            passingScore: typeof passingScore === 'number' ? Math.min(100, Math.max(0, passingScore)) : 80,
            timeLimit: typeof timeLimit === 'number' ? timeLimit : 0,
        };
        let quiz = await Quiz.findOne({ lessonId });
        if (quiz) {
            quiz.title = payload.title;
            quiz.questions = payload.questions;
            quiz.passingScore = payload.passingScore;
            quiz.timeLimit = payload.timeLimit;
            await quiz.save();
        } else {
            quiz = await Quiz.create(payload);
        }
        return res.status(200).json({ success: true, data: quiz });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/instructor/quizzes/:quizId
 * Update quiz (instructor owner only)
 */
const updateQuiz = async (req, res, next) => {
    try {
        const quiz = await Quiz.findById(req.params.quizId);
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });
        const lesson = await Lesson.findById(quiz.lessonId);
        if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found.' });
        const course = await Course.findById(lesson.courseId);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
        const isOwner = course.instructorId?.toString() === req.user._id?.toString();
        const isAdmin = req.user.role === 'admin';
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        const { title, questions, passingScore, timeLimit } = req.body;
        if (title !== undefined) quiz.title = title;
        if (Array.isArray(questions)) {
            quiz.questions = questions.filter((q) => q && (q.questionText || '').toString().trim());
        }
        if (typeof passingScore === 'number') quiz.passingScore = Math.min(100, Math.max(0, passingScore));
        if (typeof timeLimit === 'number') quiz.timeLimit = timeLimit;
        await quiz.save();
        return res.status(200).json({ success: true, data: quiz });
    } catch (error) {
        next(error);
    }
};

module.exports = { getQuizByLesson, createOrUpdateQuiz, updateQuiz };
