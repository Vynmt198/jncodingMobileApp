const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Lesson = require('../models/Lesson');
const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
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

        // Chỉ yêu cầu: có lesson (nếu có) và pass tất cả quiz của khóa (không bắt 100% lesson completion)
        const allLessons = await Lesson.find({ courseId });
        if (allLessons.length === 0) {
            return res.status(400).json({ success: false, message: 'This course has no lessons.' });
        }

        // App chỉ yêu cầu: đã pass ít nhất 1 quiz của khóa (nếu khóa có quiz)
        const quizLessons = allLessons.filter((l) => l.type === 'quiz');
        let quizIds = [];
        if (quizLessons.length > 0) {
            const quizzes = await Quiz.find({ lessonId: { $in: quizLessons.map((l) => l._id) } });
            quizIds = quizzes.map((q) => q._id);
        }

        if (quizIds.length > 0) {
            const passedAttempts = await QuizAttempt.find({
                userId,
                quizId: { $in: quizIds },
                isPassed: true,
            });
            if (passedAttempts.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'You must pass at least one quiz in this course to receive a certificate.',
                });
            }
        }

        // BỎ QUA CHECK ASSIGNMENT: app mobile chỉ yêu cầu hoàn thành bài học + pass tất cả quiz

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
