const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Grade submission (instructor) – must be before /:id to avoid matching
router.put(
    '/submissions/:id/grade',
    auth,
    roleCheck.isSubmissionGrader('id'),
    assignmentController.gradeSubmission
);

// Get one assignment (enrolled or course owner) – requires loadAssignment
router.get(
    '/:id',
    auth,
    roleCheck.loadAssignment('id'),
    assignmentController.getOne
);

// Update / delete / list submissions – course owner only
router.put(
    '/:id',
    auth,
    roleCheck.isAssignmentCourseOwner('id'),
    assignmentController.update
);
router.delete(
    '/:id',
    auth,
    roleCheck.isAssignmentCourseOwner('id'),
    assignmentController.delete
);
router.get(
    '/:id/submissions',
    auth,
    roleCheck.isAssignmentCourseOwner('id'),
    assignmentController.getSubmissions
);

// Learner submit – only need to be able to load assignment; enrollment + pass quiz checked in controller
router.post(
    '/:id/submit',
    auth,
    roleCheck.loadAssignment('id'),
    assignmentController.submit
);

// Learner submit exam (multiple choice, auto-grade)
router.post(
    '/:id/submit-exam',
    auth,
    roleCheck.loadAssignment('id'),
    assignmentController.submitExam
);

module.exports = router;
