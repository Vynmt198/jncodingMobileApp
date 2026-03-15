const mongoose = require('mongoose');

/**
 * DiscussionReport - Báo cáo bình luận (hỏi đáp) từ người dùng cho admin
 */
const discussionReportSchema = new mongoose.Schema(
    {
        discussionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Discussion',
            required: true,
        },
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        reason: {
            type: String,
            trim: true,
            maxlength: [500, 'Reason cannot exceed 500 characters'],
            default: null,
        },
        status: {
            type: String,
            enum: ['pending', 'resolved', 'dismissed'],
            default: 'pending',
        },
        resolvedAt: { type: Date, default: null },
        resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true }
);

discussionReportSchema.index({ discussionId: 1, reportedBy: 1 }, { unique: true });
discussionReportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('DiscussionReport', discussionReportSchema);
