const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Lesson = require('../models/Lesson');
const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const { randomUUID } = require('crypto');

// Assignment is passed when score >= maxScore * ASSIGNMENT_PASS_PERCENT
const ASSIGNMENT_PASS_PERCENT = 0.6;

/**
 * POST /api/certificates/generate
 * Generate certificate for a course (BR16: 100% completion + all quizzes passed)
 * @access Private (auth)
 */
exports.generateCertificate = async (req, res, next) => {
    try {
        const { courseId } = req.body;
        const userId = req.user._id;

        if (!courseId) {
            return res.status(400).json({ success: false, message: 'courseId is required.' });
        }

        // Check active enrollment (BR10)
        const enrollment = await Enrollment.findOne({ userId, courseId, status: 'active' });
        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: 'You must be actively enrolled in this course to receive a certificate.',
            });
        }

        // Return existing certificate if already issued (idempotent)
        const existing = await Certificate.findOne({ userId, courseId })
            .populate('courseId', 'title thumbnail');
        if (existing) {
            return res.status(200).json({
                success: true,
                message: 'Certificate already issued.',
                data: { certificate: existing },
            });
        }

        // Check 100% lesson completion (BR16)
        const [allLessons, completedProgress] = await Promise.all([
            Lesson.find({ courseId }),
            Progress.find({ userId, courseId, isCompleted: true }),
        ]);

        if (allLessons.length === 0) {
            return res.status(400).json({ success: false, message: 'This course has no lessons.' });
        }

        const completedLessonIds = new Set(completedProgress.map((p) => p.lessonId.toString()));
        const allCompleted = allLessons.every((l) => completedLessonIds.has(l._id.toString()));

        if (!allCompleted) {
            const completionRate = Math.round((completedLessonIds.size / allLessons.length) * 100);
            return res.status(400).json({
                success: false,
                message: `You must complete 100% of the course lessons. Current progress: ${completionRate}%.`,
            });
        }

        // Check all quizzes passed (BR16)
        const quizLessons = allLessons.filter((l) => l.type === 'quiz');
        if (quizLessons.length > 0) {
            const quizzes = await Quiz.find({ lessonId: { $in: quizLessons.map((l) => l._id) } });
            const quizIds = quizzes.map((q) => q._id);

            // Get best attempt per quiz (must have at least one passed attempt)
            const passedAttempts = await QuizAttempt.find({
                userId,
                quizId: { $in: quizIds },
                isPassed: true,
            });

            const passedQuizIds = new Set(passedAttempts.map((a) => a.quizId.toString()));
            const allQuizzesPassed = quizIds.every((id) => passedQuizIds.has(id.toString()));

            if (!allQuizzesPassed) {
                return res.status(400).json({
                    success: false,
                    message: 'You must pass all quizzes in the course to receive a certificate.',
                });
            }
        }

        // Check all assignments passed (business rule: Pass Quiz → Assignment → Certificate)
        const assignments = await Assignment.find({ courseId, isActive: true });
        if (assignments.length > 0) {
            for (const assignment of assignments) {
                const submission = await AssignmentSubmission.findOne({
                    assignmentId: assignment._id,
                    userId,
                });

                const maxScore = assignment.maxScore || 100;
                const passScore = maxScore * ASSIGNMENT_PASS_PERCENT;

                const passed =
                    submission &&
                    submission.status === 'graded' &&
                    submission.score != null &&
                    submission.score >= passScore;

                if (!passed) {
                    return res.status(400).json({
                        success: false,
                        message:
                            'You must pass all assignments in the course to receive a certificate. Complete and pass every assignment first.',
                    });
                }
            }
        }

        // Generate unique certificate ID
        const certificateId = `CERT-${randomUUID().replace(/-/g, '').toUpperCase().slice(0, 16)}`;
        const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        const verificationUrl = `${baseUrl}/verify/${certificateId}`;

        const certificate = await Certificate.create({
            userId,
            courseId,
            certificateId,
            issuedAt: new Date(),
            verificationUrl,
        });

        await certificate.populate([
            { path: 'userId', select: 'fullName email' },
            { path: 'courseId', select: 'title thumbnail' },
        ]);

        return res.status(201).json({
            success: true,
            message: 'Certificate generated successfully.',
            data: { certificate },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/certificates/my-certificates
 * Get all certificates for logged-in user
 * @access Private (auth)
 */
exports.getMyCertificates = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const certificates = await Certificate.find({ userId })
            .populate('courseId', 'title thumbnail instructor')
            .sort({ issuedAt: -1 });

        return res.status(200).json({
            success: true,
            data: {
                certificates,
                total: certificates.length,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/certificates/:id/download
 * Get certificate data for download (validates ownership)
 * @access Private (auth)
 */
exports.downloadCertificate = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const certificate = await Certificate.findById(id)
            .populate('userId', 'fullName email')
            .populate('courseId', 'title thumbnail');

        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Certificate not found.' });
        }

        // Only owner or admin can download (BR22)
        if (
            certificate.userId._id.toString() !== userId.toString() &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only download your own certificate.',
            });
        }

        return res.status(200).json({
            success: true,
            data: { certificate },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/certificates/verify/:certId
 * Verify a certificate by its unique certificateId string (public)
 * @access Public
 */
exports.verifyCertificate = async (req, res, next) => {
    try {
        const { certId } = req.params;

        const certificate = await Certificate.findOne({ certificateId: certId })
            .populate('userId', 'fullName')
            .populate('courseId', 'title thumbnail');

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found. This certificate ID may be invalid.',
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                certificate: {
                    certificateId: certificate.certificateId,
                    issuedAt: certificate.issuedAt,
                    holderName: certificate.userId.fullName,
                    courseName: certificate.courseId.title,
                    verificationUrl: certificate.verificationUrl,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};
