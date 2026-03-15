const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: [true, 'Course ID is required'],
        },
        rating: {
            type: Number,
            required: [true, 'Rating is required'],
            min: [1, 'Rating must be at least 1'],
            max: [5, 'Rating cannot exceed 5'],
        },
        reviewText: {
            type: String,
            trim: true,
            maxlength: [1000, 'Review text cannot exceed 1000 characters'],
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Unique constraint: one review per user per course (BR18)
reviewSchema.index({ userId: 1, courseId: 1 }, { unique: true });
// Index for fetching reviews by course, sorted by date
reviewSchema.index({ courseId: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;