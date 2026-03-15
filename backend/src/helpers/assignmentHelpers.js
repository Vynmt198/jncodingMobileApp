const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

/**
 * Check if the user has passed all quizzes in a course.
 * Used as a prerequisite for allowing assignment submissions.
 */
const hasPassedAllQuizzesInCourse = async (courseId, userId) => {
    const allLessons = await Lesson.find({ courseId });
    const quizLessons = allLessons.filter((l) => l.type === 'quiz');

    if (quizLessons.length === 0) return true;

    const quizzes = await Quiz.find({ lessonId: { $in: quizLessons.map((l) => l._id) } });
    const quizIds = quizzes.map((q) => q._id);

    const passedAttempts = await QuizAttempt.find({
        userId,
        quizId: { $in: quizIds },
        isPassed: true,
    });

    const passedQuizIds = new Set(passedAttempts.map((a) => a.quizId.toString()));
    return quizIds.every((id) => passedQuizIds.has(id.toString()));
};

module.exports = {
    hasPassedAllQuizzesInCourse,
};

