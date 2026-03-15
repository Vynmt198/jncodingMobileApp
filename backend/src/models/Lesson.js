const mongoose = require('mongoose');

/**
 * Lesson - UC20 Upload Lesson, UC33-34 Edit/Delete Lesson
 * type: video | text | quiz (quiz content ref Quiz model)
 */
const lessonSchema = new mongoose.Schema(
    {
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['video', 'text', 'quiz'],
            default: 'video',
        },
        content: {
            type: String,
            default: '',
        },
        // Optional learning materials / references for this lesson (plain text or markdown)
        resources: {
            type: String,
            default: '',
        },
        videoUrl: {
            type: String,
            default: '',
        },
        duration: {
            type: Number,
            default: 0, // seconds
        },
        order: {
            type: Number,
            required: true,
            default: 1,
        },
        isPreview: {
            type: Boolean,
            default: false,
        },
        /** Admin moderation: hide lesson from learners/instructors UI */
        isHidden: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

lessonSchema.index({ courseId: 1, order: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);
