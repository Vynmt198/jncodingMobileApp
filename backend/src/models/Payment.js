const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            default: null,
        },
        /** Multiple courses in one payment (cart). When set, enrollments created for each on success. */
        courseIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
        }],
        enrollmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Enrollment',
            default: null,
        },
        orderId: {
            type: String,
            required: true,
            unique: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        orderInfo: {
            type: String,
            required: true,
        },
        transactionNo: {
            type: String,
            default: null,
        },
        bankCode: {
            type: String,
            default: null,
        },
        cardType: {
            type: String,
            default: null,
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'success', 'failed', 'cancelled'],
            default: 'pending',
        },
        vnpayData: {
            type: Object,
            default: {},
        },
    },
    { timestamps: true }
);

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ courseId: 1 });
paymentSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
