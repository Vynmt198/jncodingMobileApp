const mongoose = require('mongoose');

/**
 * CourseBlock - UC36 Block User in Course
 * Instructor chặn learner tham gia khóa học
 */
const courseBlockSchema = new mongoose.Schema(
    {
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        blockedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        reason: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

courseBlockSchema.index({ courseId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('CourseBlock', courseBlockSchema);
