const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Progress = require('../models/Progress');
const Lesson = require('../models/Lesson');

/**
 * Check if learner can attempt quiz for a quiz-lesson.
 * Rule: learner must be enrolled (handled by middleware) AND must have completed all previous lessons in the course
 * (by order) before attempting this quiz. The quiz lesson itself will be marked completed when the learner PASSES.
 */
const canAttemptQuiz = async (userId, quizLessonId) => {
    const quizLesson = await Lesson.findById(quizLessonId).select('courseId order type');
    if (!quizLesson) return { ok: false, message: 'Lesson not found.' };
    if (quizLesson.type !== 'quiz') return { ok: false, message: 'Lesson is not a quiz lesson.' };

    const prevLessons = await Lesson.find({
        courseId: quizLesson.courseId,
        order: { $lt: quizLesson.order },
    }).select('_id');

    if (prevLessons.length === 0) return { ok: true };

    const prevIds = prevLessons.map((l) => l._id);
    const completedPrev = await Progress.countDocuments({
        userId,
        lessonId: { $in: prevIds },
        isCompleted: true,
    });

    if (completedPrev !== prevIds.length) {
        return {
            ok: false,
            message: 'Bạn cần hoàn thành các bài học trước đó trước khi làm quiz này.',
        };
    }

    return { ok: true };
};

/**
 * @route GET /api/quizzes/:id
 * @desc Get quiz questions (must complete previous lessons before attempting)
 */
exports.getQuiz = async (req, res, next) => {
    try {
        const quizId = req.params.id;
        const userId = req.user._id;

        const quiz = await Quiz.findById(quizId).select('-questions.correctAnswer -questions.explanation');
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        const allowed = await canAttemptQuiz(userId, quiz.lessonId);
        if (!allowed.ok) {
            return res.status(403).json({
                success: false,
                message: allowed.message || 'Bạn chưa đủ điều kiện để làm quiz này.',
            });
        }

        res.status(200).json({
            success: true,
            data: quiz
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route POST /api/quizzes/:id/attempt
 * @desc Submit quiz attempt (must complete previous lessons; can retry)
 */
exports.submitAttempt = async (req, res, next) => {
    try {
        const quizId = req.params.id;
        const userId = req.user._id;
        const { answers, timeSpent } = req.body; // answers is an array corresponding to questions

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        const allowed = await canAttemptQuiz(userId, quiz.lessonId);
        if (!allowed.ok) {
            return res.status(403).json({
                success: false,
                message: allowed.message || 'Bạn chưa đủ điều kiện để làm quiz này.',
            });
        }

        const quizLesson = await Lesson.findById(quiz.lessonId).select('courseId');
        if (!quizLesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }

        let totalScore = 0;
        let maxScore = 0;

        // Calculate score
        quiz.questions.forEach((q, index) => {
            maxScore += q.points;
            const submittedAnswer = answers[index];

            // Basic equality check. For complex types or multiple-choice arrays, 
            // a deeper comparison might be needed.
            // Converting to string for simple comparison in this generic implementation.
            if (submittedAnswer !== undefined &&
                String(submittedAnswer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()) {
                totalScore += q.points;
            }
        });

        const scorePercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
        const isPassed = scorePercentage >= quiz.passingScore;

        const attempt = await QuizAttempt.create({
            userId: req.user._id,
            quizId,
            answers,
            score: scorePercentage,
            isPassed,
            submittedAt: new Date(),
            timeSpent: timeSpent || 0
        });

        // If passed: mark the quiz lesson as completed (this becomes the ONLY way to complete a quiz lesson)
        if (isPassed) {
            await Progress.findOneAndUpdate(
                { userId, lessonId: quiz.lessonId },
                {
                    courseId: quizLesson.courseId,
                    isCompleted: true,
                    completedAt: new Date(),
                },
                { new: true, upsert: true }
            );
        }

        res.status(200).json({
            success: true,
            data: {
                attemptId: attempt._id,
                score: scorePercentage,
                isPassed,
                timeSpent: attempt.timeSpent
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route GET /api/quizzes/:id/results
 * @desc Get quiz results including correct answers and user's score
 */
exports.getQuizResults = async (req, res, next) => {
    try {
        const attemptId = req.params.id; // Using attempt ID to get specific result

        const attempt = await QuizAttempt.findById(attemptId).populate('quizId');
        if (!attempt) {
            return res.status(404).json({ success: false, message: 'Quiz attempt not found' });
        }

        if (attempt.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this result' });
        }

        res.status(200).json({
            success: true,
            data: attempt
        });
    } catch (error) {
        next(error);
    }
};
