const mongoose = require('mongoose');

/**
 * Course - UC03-UC07, UC19-20, UC25, UC40-42
 * BR5: Chỉ course Active visible | BR20: Cần admin approve | BR27: Course pricing control
 */
const courseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Course title is required'],
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        syllabus: {
            type: String,
            default: '',
        },
        instructorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            default: null,
        },
        level: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'all-levels'],
            default: 'all-levels',
        },
        status: {
            type: String,
            enum: ['draft', 'pending', 'active', 'rejected', 'disabled'],
            default: 'draft',
        },
        price: {
            type: Number,
            default: 0,
            min: 0,
        },
        estimatedCompletionHours: {
            type: Number,
            default: 0,
            min: 0,
        },
        thumbnail: {
            type: String,
            default: null,
        },
        totalLessons: { type: Number, default: 0 },
        totalDuration: { type: Number, default: 0 }, // minutes
        enrollmentCount: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0, min: 0, max: 5 },
    },
    { timestamps: true }
);

courseSchema.index({ status: 1 });
courseSchema.index({ instructorId: 1 });
courseSchema.index({ title: 'text', description: 'text', syllabus: 'text' });
courseSchema.index({ categoryId: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ price: 1 });
courseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Course', courseSchema);
