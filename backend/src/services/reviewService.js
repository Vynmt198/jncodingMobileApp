const Review = require('../models/Review');
const mongoose = require('mongoose');

/**
 * ReviewService - Handles review-related business logic
 * Including rating calculations and aggregations
 */

/**
 * Calculate aggregated rating statistics for a course
 * Returns: { averageRating, totalReviews, distribution }
 */
const calculateCourseRatingStats = async (courseId) => {
    try {
        const stats = await Review.aggregate([
            {
                $match: {
                    courseId: new mongoose.Types.ObjectId(courseId),
                },
            },
            {
                $group: {
                    _id: '$courseId',
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    ratings: { $push: '$rating' },
                },
            },
        ]);

        if (!stats.length) {
            return {
                averageRating: 0,
                totalReviews: 0,
                distribution: {
                    oneStar: 0,
                    twoStars: 0,
                    threeStars: 0,
                    fourStars: 0,
                    fiveStars: 0,
                },
            };
        }

        const result = stats[0];
        const distribution = {
            oneStar: 0,
            twoStars: 0,
            threeStars: 0,
            fourStars: 0,
            fiveStars: 0,
        };

        // Count distribution by rating
        result.ratings.forEach((rating) => {
            switch (rating) {
                case 1:
                    distribution.oneStar++;
                    break;
                case 2:
                    distribution.twoStars++;
                    break;
                case 3:
                    distribution.threeStars++;
                    break;
                case 4:
                    distribution.fourStars++;
                    break;
                case 5:
                    distribution.fiveStars++;
                    break;
            }
        });

        return {
            averageRating: Math.round(result.averageRating * 10) / 10,
            totalReviews: result.totalReviews,
            distribution,
        };
    } catch (error) {
        console.error('[ReviewService] Error calculating course rating stats:', error);
        throw error;
    }
};

/**
 * Update course's rating fields after a review change
 * NOTE: This requires Course model to have averageRating field
 * TODO: Uncomment when Course model is available
 */
const updateCourseRating = async (courseId) => {
    try {
        // Dynamic require to avoid circular dependencies
        let Course;
        try {
            Course = require('../models/Course');
        } catch (err) {
            console.warn('[ReviewService] Course model not found yet. Skipping rating update.');
            return null;
        }

        const stats = await calculateCourseRatingStats(courseId);

        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            {
                averageRating: stats.averageRating,
            },
            { new: true }
        );

        return updatedCourse;
    } catch (error) {
        console.error('[ReviewService] Error updating course rating:', error);
        // Don't throw - this is non-critical
        return null;
    }
};

/**
 * Get reviews for a course with pagination and sorting
 */
const getCourseReviews = async (courseId, options = {}) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = -1,
        } = options;

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder };

        const reviews = await Review.find({ courseId })
            .populate('userId', 'fullName avatar')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Review.countDocuments({ courseId });

        return {
            reviews,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error('[ReviewService] Error fetching course reviews:', error);
        throw error;
    }
};

/**
 * Get user's review for a specific course
 */
const getUserReviewForCourse = async (userId, courseId) => {
    try {
        const review = await Review.findOne({ userId, courseId })
            .populate('userId', 'fullName avatar');

        return review;
    } catch (error) {
        console.error('[ReviewService] Error fetching user review:', error);
        throw error;
    }
};

/**
 * Create a new review
 */
const createReview = async (reviewData) => {
    try {
        const review = await Review.create(reviewData);
        await review.populate('userId', 'fullName avatar');

        // Update course rating
        await updateCourseRating(reviewData.courseId);

        return review;
    } catch (error) {
        if (error.code === 11000) {
            const err = new Error('You have already reviewed this course.');
            err.statusCode = 409;
            throw err;
        }
        console.error('[ReviewService] Error creating review:', error);
        throw error;
    }
};

/**
 * Update an existing review
 */
const updateReview = async (reviewId, updateData) => {
    try {
        const review = await Review.findByIdAndUpdate(reviewId, updateData, {
            new: true,
            runValidators: true,
        }).populate('userId', 'fullName avatar');

        if (review) {
            // Update course rating
            await updateCourseRating(review.courseId);
        }

        return review;
    } catch (error) {
        console.error('[ReviewService] Error updating review:', error);
        throw error;
    }
};

/**
 * Delete a review
 */
const deleteReview = async (reviewId) => {
    try {
        const review = await Review.findByIdAndDelete(reviewId);

        if (review) {
            // Update course rating
            await updateCourseRating(review.courseId);
        }

        return review;
    } catch (error) {
        console.error('[ReviewService] Error deleting review:', error);
        throw error;
    }
};

module.exports = {
    calculateCourseRatingStats,
    updateCourseRating,
    getCourseReviews,
    getUserReviewForCourse,
    createReview,
    updateReview,
    deleteReview,
};
