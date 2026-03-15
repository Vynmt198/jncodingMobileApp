const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const auth = require('../middleware/auth');
const isEnrolled = require('../middleware/isEnrolled');

router.get('/:id', auth, isEnrolled, quizController.getQuiz);
router.post('/:id/attempt', auth, isEnrolled, quizController.submitAttempt);
router.get('/:id/results', auth, quizController.getQuizResults);

module.exports = router;
