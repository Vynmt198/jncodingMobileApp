const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true,
    },
    answers: [{
        type: mongoose.Schema.Types.Mixed,
    }],
    score: {
        type: Number,
        default: 0,
    },
    isPassed: {
        type: Boolean,
        default: false,
    },
    startedAt: {
        type: Date,
        default: Date.now,
    },
    submittedAt: {
        type: Date,
    },
    timeSpent: {
        type: Number,
        default: 0, // seconds
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
