const express = require('express');
const router = express.Router();

const {
    generateCertificate,
    getMyCertificates,
    downloadCertificate,
    verifyCertificate,
} = require('../controllers/certificateController');

const auth = require('../middleware/auth');

/**
 * @route   GET /api/certificates/verify/:certId
 * @desc    Verify a certificate by its unique certificateId (public)
 * @access  Public
 */
router.get('/verify/:certId', verifyCertificate);

/**
 * @route   GET /api/certificates/my-certificates
 * @desc    Get all certificates for the logged-in user
 * @access  Private (auth)
 */
router.get('/my-certificates', auth, getMyCertificates);

/**
 * @route   POST /api/certificates/generate
 * @desc    Generate a certificate
 * @access  Private (auth)
 */
router.post('/generate', auth, generateCertificate);

/**
 * @route   GET /api/certificates/:id/download
 * @desc    Download certificate PDF data (owner or admin only)
 * @access  Private (auth)
 */
router.get('/:id/download', auth, downloadCertificate);

module.exports = router;
