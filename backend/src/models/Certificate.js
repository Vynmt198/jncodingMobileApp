const mongoose = require('mongoose');

/**
 * Certificate - UC17 Generate/View Certificate
 * BR16: Only issued when 100% course completion + all quizzes passed
 */
const certificateSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
        },
        certificateId: {
            type: String,
            unique: true,
            required: true,
        },
        issuedAt: {
            type: Date,
            default: Date.now,
        },
        pdfUrl: {
            type: String,
            default: null,
        },
        verificationUrl: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

certificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });
// Note: certificateId index is created automatically via unique:true on the field

module.exports = mongoose.model('Certificate', certificateSchema);
