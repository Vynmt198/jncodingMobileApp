const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const lessonController = require('../controllers/lessonController');
const learningController = require('../controllers/learningController');
const assignmentController = require('../controllers/assignmentController');
const { getCourseReviews, getRatingSummary } = require('../controllers/reviewController');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { isCourseOwner, isInstructor, isEnrolled: isEnrolledRole, isEnrolledOrCourseInstructor } = require('../middleware/roleCheck');
const isEnrolled = require('../middleware/isEnrolled');

router.get('/', courseController.listCourses);
router.get('/search', courseController.searchCourses);
router.get('/autocomplete', courseController.autocomplete);
// More specific :id routes first (before generic GET /:id)
router.get('/:id/curriculum', optionalAuth, courseController.getCurriculum);
router.get('/:id/reviews', getCourseReviews);
router.get('/:id/rating-summary', getRatingSummary);
router.get('/:id/learn', auth, isEnrolled, learningController.getCourseLearningData);
router.get('/:id/assignments', auth, assignmentController.listByCourse);
router.post('/:id/assignments', auth, isCourseOwner('id'), assignmentController.create);
router.get('/:id/my-assignment-submissions', auth, isEnrolledOrCourseInstructor('id'), assignmentController.getMySubmissionsByCourse);
router.get('/:id', optionalAuth, courseController.getCourseById);
router.post('/', auth, isInstructor, courseController.createCourse);
router.put('/:id', auth, isCourseOwner('id'), courseController.updateCourse);
router.delete('/:id', auth, isCourseOwner('id'), courseController.deleteCourse);
router.post('/:id/lessons', auth, isCourseOwner('id'), lessonController.createLesson);

module.exports = router;
