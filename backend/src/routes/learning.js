const express = require('express');
const router = express.Router();
const learningController = require('../controllers/learningController');
const auth = require('../middleware/auth');
const isEnrolled = require('../middleware/isEnrolled');

// In app.js these will be mounted differently. 
// For /api/courses/:id/learn, we handle it in this router mounted at /api/courses
// For /api/lessons/:id/content, we handle it in this router mounted at /api/lessons

// Course learning data
router.get('/:id/learn', auth, isEnrolled, learningController.getCourseLearningData);

// Lesson content (when mounted at /api/lessons)
// In app.js: app.use('/api/lessons', learningRoutes) - wait this makes routing split.
// Better approach: Since learningRoutes might be mounted at different base paths, 
// let's define them explicitly or split them. 

module.exports = router;
