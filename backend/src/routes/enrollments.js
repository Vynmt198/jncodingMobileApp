const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const auth = require('../middleware/auth');

router.post('/', auth, enrollmentController.enrollFreeCourse);
router.get('/', auth, enrollmentController.getMyEnrollments);

module.exports = router;
