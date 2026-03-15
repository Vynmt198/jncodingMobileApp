const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { hasPassedAllQuizzesInCourse } = require('../helpers/assignmentHelpers');

/**
 * GET /api/courses/:id/assignments
 * List assignments of a course. Learner: must be enrolled, returns canSubmit (pass all quizzes).
 * Instructor: must be course owner.
 */
exports.listByCourse = async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const userId = req.user._id;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found.' });
        }

        const isOwner =
            course.instructorId.toString() === userId.toString() || req.user.role === 'admin';

        if (!isOwner) {
            const enrollment = await Enrollment.findOne({
                userId,
                courseId,
                status: 'active',
            });
            if (!enrollment) {
                return res.status(403).json({
                    success: false,
                    message: 'You must be enrolled in this course to view assignments.',
                });
            }
        }

        const assignments = await Assignment.find({ courseId, isActive: true })
            .populate('lessonId', 'title order')
            .sort({ createdAt: 1 });

        let canSubmit = false;
        if (!isOwner) {
            canSubmit = await hasPassedAllQuizzesInCourse(courseId, userId);
        } else {
            canSubmit = true;
        }

        return res.status(200).json({
            success: true,
            data: {
                assignments,
                canSubmit,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/courses/:id/assignments
 * Create assignment (instructor only, course owner).
 */
exports.create = async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const {
            title,
            description,
            lessonId,
            maxScore,
            dueDate,
            type,
            questions,
            timeLimitMinutes,
            passingScorePercent,
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: 'Title is required.' });
        }

        const payload = {
            courseId,
            lessonId: lessonId || null,
            title: title.trim(),
            description: (description || '').trim(),
            maxScore: maxScore != null ? Number(maxScore) : 100,
            dueDate: dueDate || null,
            isActive: true,
        };

        if (type && ['regular', 'exam'].includes(type)) {
            payload.type = type;
        }
        if (type === 'exam') {
            if (Array.isArray(questions) && questions.length > 0) {
                payload.questions = questions.map((q) => ({
                    questionText: String(q.questionText || '').trim(),
                    options: Array.isArray(q.options) ? q.options.map((o) => String(o)) : [],
                    correctIndex: Number(q.correctIndex),
                    points: q.points != null ? Number(q.points) : 1,
                }));
            }
            if (timeLimitMinutes != null) {
                payload.timeLimitMinutes = Number(timeLimitMinutes);
            }
            if (passingScorePercent != null) {
                payload.passingScorePercent = Number(passingScorePercent);
            }
        }

        const assignment = await Assignment.create(payload);

        await assignment.populate('lessonId', 'title order');

        return res.status(201).json({
            success: true,
            message: 'Assignment created successfully.',
            data: { assignment },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/assignments/:id
 * Get one assignment (enrolled learner or course owner).
 */
exports.getOne = async (req, res, next) => {
    try {
        const assignment = req.assignment;
        const userId = req.user._id;
        const courseId = assignment.courseId.toString();

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found.' });
        }

        const isOwner =
            course.instructorId.toString() === userId.toString() || req.user.role === 'admin';
        if (!isOwner) {
            const enrollment = await Enrollment.findOne({
                userId,
                courseId: assignment.courseId,
                status: 'active',
            });
            if (!enrollment) {
                return res.status(403).json({
                    success: false,
                    message: 'You must be enrolled in this course to view this assignment.',
                });
            }
        }

        const canSubmit = isOwner
            ? true
            : await hasPassedAllQuizzesInCourse(assignment.courseId, userId);

        let mySubmission = null;
        const sub = await AssignmentSubmission.findOne({
            assignmentId: assignment._id,
            userId,
        });
        if (sub) mySubmission = sub;

        return res.status(200).json({
            success: true,
            data: {
                assignment,
                canSubmit,
                mySubmission,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/assignments/:id
 * Update assignment (course owner only).
 */
exports.update = async (req, res, next) => {
    try {
        const assignment = req.assignment;
        const {
            title,
            description,
            lessonId,
            maxScore,
            dueDate,
            isActive,
            type,
            questions,
            timeLimitMinutes,
            passingScorePercent,
        } = req.body;

        if (title !== undefined) assignment.title = title.trim();
        if (description !== undefined) assignment.description = description.trim();
        if (lessonId !== undefined) assignment.lessonId = lessonId || null;
        if (maxScore !== undefined) assignment.maxScore = Number(maxScore);
        if (dueDate !== undefined) assignment.dueDate = dueDate || null;
        if (isActive !== undefined) assignment.isActive = Boolean(isActive);

        if (type !== undefined && ['regular', 'exam'].includes(type)) {
            assignment.type = type;
        }
        if (assignment.type === 'exam') {
            if (Array.isArray(questions)) {
                assignment.questions = questions.map((q) => ({
                    questionText: String(q.questionText || '').trim(),
                    options: Array.isArray(q.options) ? q.options.map((o) => String(o)) : [],
                    correctIndex: Number(q.correctIndex),
                    points: q.points != null ? Number(q.points) : 1,
                }));
            }
            if (timeLimitMinutes !== undefined) {
                assignment.timeLimitMinutes =
                    timeLimitMinutes != null ? Number(timeLimitMinutes) : null;
            }
            if (passingScorePercent !== undefined) {
                assignment.passingScorePercent =
                    passingScorePercent != null ? Number(passingScorePercent) : 60;
            }
        }

        await assignment.save();
        await assignment.populate('lessonId', 'title order');

        return res.status(200).json({
            success: true,
            message: 'Assignment updated successfully.',
            data: { assignment },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/assignments/:id
 * Delete assignment (course owner only).
 */
exports.delete = async (req, res, next) => {
    try {
        const assignment = req.assignment;
        await AssignmentSubmission.deleteMany({ assignmentId: assignment._id });
        await assignment.deleteOne();

        return res.status(200).json({
            success: true,
            message: 'Assignment deleted successfully.',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/assignments/:id/submit
 * Submit or update submission (learner, enrolled, must have passed all quizzes).
 */
exports.submit = async (req, res, next) => {
    try {
        const assignment = req.assignment;
        const userId = req.user._id;
        const { content, attachments } = req.body;

        const enrollment = await Enrollment.findOne({
            userId,
            courseId: assignment.courseId,
            status: 'active',
        });
        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: 'You must be enrolled in this course to submit assignments.',
            });
        }

        const canSubmit = await hasPassedAllQuizzesInCourse(assignment.courseId, userId);
        if (!canSubmit) {
            return res.status(403).json({
                success: false,
                message:
                    'Bạn cần pass hết quiz trong khóa trước khi nộp bài tập.',
            });
        }

        const update = {
            content: (content !== undefined ? content : '').trim(),
            attachments: Array.isArray(attachments) ? attachments : [],
        };

        // Cho phép nộp nhiều lần: cập nhật bản ghi nếu đã nộp trước đó (upsert)
        const submission = await AssignmentSubmission.findOneAndUpdate(
            { assignmentId: assignment._id, userId },
            { $set: update },
            { new: true, upsert: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Assignment submitted successfully. You can resubmit to update your work.',
            data: { submission },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/assignments/:id/submit-exam
 * Submit multiple-choice exam (auto-grade). Only for assignment.type === 'exam'.
 */
exports.submitExam = async (req, res, next) => {
    try {
        const assignment = req.assignment;
        const userId = req.user._id;

        if (assignment.type !== 'exam' || !Array.isArray(assignment.questions) || assignment.questions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Assignment is not a valid exam.',
            });
        }

        const enrollment = await Enrollment.findOne({
            userId,
            courseId: assignment.courseId,
            status: 'active',
        });
        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: 'You must be enrolled in this course to submit assignments.',
            });
        }

        const canSubmit = await hasPassedAllQuizzesInCourse(assignment.courseId, userId);
        if (!canSubmit) {
            return res.status(403).json({
                success: false,
                message:
                    'Bạn cần pass hết quiz trong khóa trước khi làm bài thi cuối khóa.',
            });
        }

        const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
        let totalPoints = 0;
        let earnedPoints = 0;

        assignment.questions.forEach((q, idx) => {
            const pts = q.points != null ? q.points : 1;
            totalPoints += pts;
            if (Number(answers[idx]) === q.correctIndex) {
                earnedPoints += pts;
            }
        });

        const scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
        const passPercent = assignment.passingScorePercent || 60;
        const isPassed = scorePercent >= passPercent;

        const submissionUpdate = {
            content: '',
            attachments: [],
            score: scorePercent,
            status: 'graded',
            gradedAt: new Date(),
            gradedBy: null,
        };

        const submission = await AssignmentSubmission.findOneAndUpdate(
            { assignmentId: assignment._id, userId },
            { $set: submissionUpdate },
            { new: true, upsert: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: isPassed
                ? 'Bạn đã hoàn thành bài thi cuối khóa.'
                : 'Bài thi chưa đạt điểm yêu cầu.',
            data: {
                submission,
                score: scorePercent,
                isPassed,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/assignments/:id/submissions
 * List all submissions for an assignment (course owner only).
 */
exports.getSubmissions = async (req, res, next) => {
    try {
        const assignmentId = req.assignment._id;

        const submissions = await AssignmentSubmission.find({ assignmentId })
            .populate('userId', 'fullName email')
            .sort({ updatedAt: -1 });

        return res.status(200).json({
            success: true,
            data: {
                submissions,
                total: submissions.length,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/assignments/submissions/:id/grade
 * Grade a submission (course owner only). Body: score, feedback, status.
 */
exports.gradeSubmission = async (req, res, next) => {
    try {
        const submission = req.submission;
        const { score, feedback, status } = req.body;

        const assignment = await Assignment.findById(submission.assignmentId);
        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found.' });
        }

        if (score !== undefined) {
            const num = Number(score);
            if (Number.isNaN(num) || num < 0) {
                return res.status(400).json({ success: false, message: 'Invalid score.' });
            }
            submission.score = num;
        }
        if (feedback !== undefined) submission.feedback = feedback;
        if (status !== undefined) {
            if (!['submitted', 'graded', 'needs_revision'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Status must be one of: submitted, graded, needs_revision.',
                });
            }
            submission.status = status;
        }

        submission.gradedAt = new Date();
        submission.gradedBy = req.user._id;
        await submission.save();

        await submission.populate('userId', 'fullName email');

        return res.status(200).json({
            success: true,
            message: 'Submission graded successfully.',
            data: { submission },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/courses/:id/my-assignment-submissions
 * Get current user's submissions for all assignments in the course (enrolled learner).
 */
exports.getMySubmissionsByCourse = async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const userId = req.user._id;

        const assignments = await Assignment.find({ courseId, isActive: true });
        const assignmentIds = assignments.map((a) => a._id);

        const submissions = await AssignmentSubmission.find({
            userId,
            assignmentId: { $in: assignmentIds },
        })
            .populate('assignmentId', 'title maxScore')
            .sort({ updatedAt: -1 });

        return res.status(200).json({
            success: true,
            data: {
                submissions,
                total: submissions.length,
            },
        });
    } catch (error) {
        next(error);
    }
};
