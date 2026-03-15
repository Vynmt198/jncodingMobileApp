const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const auth = require('../middleware/auth');

// Note: checking 'isEnrolled' might not be strictly necessary here if we just handle progress tracking,
// but it adds security. Our progress routes mostly take lessonId.
// For simplicity, we just use auth here as the controller fetches the lesson and checks things.

router.post('/mark-complete', auth, progressController.markLessonComplete);
router.put('/update-position', auth, progressController.updateVideoPosition);
router.get('/:courseId', auth, progressController.getCourseProgress);

module.exports = router;
