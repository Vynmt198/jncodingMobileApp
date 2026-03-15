const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
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
    lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: true,
    },
    isCompleted: {
        type: Boolean,
        default: false,
    },
    timeSpent: {
        type: Number,
        default: 0,
    },
    lastPosition: {
        type: Number,
        default: 0,
    },
    completedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});

progressSchema.index({ userId: 1, courseId: 1, lessonId: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
