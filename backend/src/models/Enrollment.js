const mongoose = require('mongoose');

/**
 * Enrollment - UC10 Enroll in Course, BR7 Single Enrollment, BR8-BR10
 * Pending: đang chờ thanh toán | Active: đã kích hoạt | Completed: hoàn thành
 */
const enrollmentSchema = new mongoose.Schema(
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
        status: {
            type: String,
            enum: ['pending', 'active', 'cancelled', 'completed'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ courseId: 1, status: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
