const express = require('express');
const multer = require('multer');
const router = express.Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { uploadThumbnail, uploadAvatar, multerConfig } = require('../controllers/uploadController');

const uploadThumbnailMw = multerConfig(multer, 'thumbnails');
const uploadAvatarMw = multerConfig(multer, 'avatars');

router.post(
    '/thumbnail',
    auth,
    requireRole('instructor', 'admin'),
    (req, res, next) => {
        uploadThumbnailMw.single('thumbnail')(req, res, (err) => {
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

router.post(
    '/avatar',
    auth,
    (req, res, next) => {
        uploadAvatarMw.single('avatar')(req, res, (err) => {
            if (err) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ success: false, message: 'File too large. Max 5MB.' });
                }
                return res.status(400).json({ success: false, message: err.message || 'Upload failed.' });
            }
            next();
        });
    },
    uploadAvatar
);

module.exports = router;
