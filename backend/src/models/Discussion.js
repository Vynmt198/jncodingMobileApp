const mongoose = require('mongoose');

/**
 * Discussion - UC15 Interact in Course Community, UC24 Moderate, UC35 Delete/Hide Comment
 * parentId null = post chính (có title), parentId set = reply
 */
const discussionSchema = new mongoose.Schema(
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
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Discussion',
            default: null, // null = post, set = reply
        },
        /** Optional: post gắn với bài học cụ thể (chỉ post gốc, reply kế thừa) */
        lessonId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lesson',
            default: null,
        },
        title: {
            type: String,
            trim: true,
            default: null, // Chỉ dùng cho post (parentId null)
        },
        content: {
            type: String,
            required: [true, 'Content is required'],
            trim: true,
            maxlength: [2000, 'Content cannot exceed 2000 characters'],
        },
        isPinned: {
            type: Boolean,
            default: false, // Chỉ post chính mới pin
        },
        likesCount: {
            type: Number,
            default: 0,
        },
        repliesCount: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ['visible', 'hidden', 'deleted'],
            default: 'visible',
        },
    },
    { timestamps: true }
);

discussionSchema.index({ courseId: 1, createdAt: -1 });
discussionSchema.index({ courseId: 1, lessonId: 1, createdAt: -1 });
discussionSchema.index({ userId: 1 });
discussionSchema.index({ parentId: 1 });
discussionSchema.index({ status: 1 });

module.exports = mongoose.model('Discussion', discussionSchema);
