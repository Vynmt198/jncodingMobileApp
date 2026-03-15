const express = require('express');
const multer = require('multer');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { uploadThumbnail, multerConfig } = require('../controllers/uploadController');

const upload = multerConfig(multer);

router.post(
    '/thumbnail',
    auth,
    requireRole('instructor', 'admin'),
    (req, res, next) => {
        upload.single('thumbnail')(req, res, (err) => {
            if (err) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ success: false, message: 'File too large. Max 5MB.' });
                }
                return res.status(400).json({ success: false, message: err.message || 'Upload failed.' });
            }
            next();
        });
    },
    uploadThumbnail
);

module.exports = router;
