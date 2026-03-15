const mongoose = require('mongoose');

/**
 * AssignmentSubmission - UC22 Grade Assignments
 * Bài nộp của learner, instructor chấm điểm
 */
const assignmentSubmissionSchema = new mongoose.Schema(
    {
        assignmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Assignment',
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        content: {
            type: String,
            default: '',
        },
        attachments: [{
            type: String, // URLs of uploaded files
        }],
        score: {
            type: Number,
            default: null,
        },
        feedback: {
            type: String,
            default: null,
        },
        status: {
            type: String,
            enum: ['submitted', 'graded', 'needs_revision'],
            default: 'submitted',
        },
        gradedAt: {
            type: Date,
            default: null,
        },
        gradedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    { timestamps: true }
);

assignmentSubmissionSchema.index({ assignmentId: 1, userId: 1 }, { unique: true });
assignmentSubmissionSchema.index({ userId: 1 });

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
