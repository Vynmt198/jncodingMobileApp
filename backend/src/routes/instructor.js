const express = require('express');
const router = express.Router();
const instructorController = require('../controllers/instructorController');
const instructorQuizController = require('../controllers/instructorQuizController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require auth + instructor or admin
router.use(auth, roleCheck.requireRole('instructor', 'admin'));

router.get('/courses', instructorController.listMyCourses);
// More specific paths first so :id does not consume "analytics" or "enrollments"
router.get('/courses/:id/enrollments', instructorController.getCourseEnrollmentsWithProgress);
router.get('/courses/:id/analytics', instructorController.getCourseAnalytics);

router.get('/lessons/:lessonId/quiz', roleCheck.isLessonOwnerParam('lessonId'), instructorQuizController.getQuizByLesson);
router.post('/lessons/:lessonId/quiz', roleCheck.isLessonOwnerParam('lessonId'), instructorQuizController.createOrUpdateQuiz);
router.put('/quizzes/:quizId', roleCheck.isQuizOwner('quizId'), instructorQuizController.updateQuiz);

module.exports = router;
