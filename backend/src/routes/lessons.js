const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const learningController = require('../controllers/learningController');
const auth = require('../middleware/auth');
const { isLessonOwner } = require('../middleware/roleCheck');
const isEnrolled = require('../middleware/isEnrolled');

router.put('/reorder', auth, lessonController.reorderLessons);
router.get('/by-id/:id', auth, isLessonOwner, lessonController.getLessonById);
router.get('/:id/content', auth, isEnrolled, learningController.getLessonContent);
router.put('/:id', auth, isLessonOwner, lessonController.updateLesson);
router.delete('/:id', auth, isLessonOwner, lessonController.deleteLesson);

module.exports = router;
