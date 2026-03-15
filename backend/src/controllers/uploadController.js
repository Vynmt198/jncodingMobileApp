const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'thumbnails');
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

/**
 * POST /api/upload/thumbnail
 * Upload course thumbnail image
 * @access Private (auth, instructor or admin)
 */
const uploadThumbnail = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded. Please select an image (JPEG, PNG, GIF, WebP, max 5MB).',
            });
        }
        const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
        const url = `${baseUrl}/uploads/thumbnails/${req.file.filename}`;
        return res.status(200).json({
            success: true,
            data: { url },
        });
    } catch (error) {
        next(error);
    }
};

const multerConfig = (multer) => {
    ensureDir(UPLOAD_DIR);
    const storage = multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
        filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname) || '.jpg';
            const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
            cb(null, name);
        },
    });
    const fileFilter = (req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP are allowed.'), false);
        }
    };
    return multer({
        storage,
        fileFilter,
        limits: { fileSize: MAX_SIZE },
    });
};

module.exports = { uploadThumbnail, multerConfig, ensureDir: () => ensureDir(UPLOAD_DIR) };
