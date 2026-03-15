const mongoose = require('mongoose');

/**
 * Assignment - UC21 Create Assessments, UC22 Grade Assignments
 * type:
 * - regular: bài tập tự luận / nộp link, instructor chấm điểm
 * - exam: bài thi trắc nghiệm cuối khóa, hệ thống tự chấm
 */
const assignmentSchema = new mongoose.Schema(
    {
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
        },
        lessonId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lesson',
            default: null,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            default: '',
        },
        maxScore: {
            type: Number,
            default: 100,
        },
        dueDate: {
            type: Date,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        type: {
            type: String,
            enum: ['regular', 'exam'],
            default: 'regular',
        },
        // Chỉ dùng cho type = 'exam'
        questions: [
            {
                questionText: {
                    type: String,
                    required: true,
                },
                options: [
                    {
                        type: String,
                        required: true,
                    },
                ],
                correctIndex: {
                    type: Number,
                    required: true,
                },
                points: {
                    type: Number,
                    default: 1,
                },
            },
        ],
        timeLimitMinutes: {
            type: Number,
            default: null,
        },
        passingScorePercent: {
            type: Number,
            default: 60,
        },
    },
    { timestamps: true }
);

assignmentSchema.index({ courseId: 1 });
assignmentSchema.index({ lessonId: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
