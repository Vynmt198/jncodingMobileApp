const Review = require('../models/Review');
const { calculateCourseRatingStats } = require('../services/reviewService');

/**
 * GET /api/courses/:id/reviews
 * Get all reviews for a course with pagination and sorting
 * @access Public 
 */
const getCourseReviews = async (req, res, next) => {
    try {
        const courseId = req.params.id || req.params.courseId;
        const pageNumber = Number(req.query.page) || 1;
        const limitNumber = Number(req.query.limit) || 10;
        const sortQuery = req.query.sort || 'newest';

        const sortOptions = {
            newest: { createdAt: -1 },
            highest: { rating: -1, createdAt: -1 },
            lowest: { rating: 1, createdAt: -1 },
        };
        const sort = sortOptions[sortQuery] || sortOptions.newest;

        const skip = (pageNumber - 1) * limitNumber;

        const reviews = await Review.find({ courseId })
            .populate('userId', 'fullName avatar')
            .sort(sort)
            .skip(skip)
            .limit(limitNumber);

        const total = await Review.countDocuments({ courseId });

        const totalPages = Math.ceil(total / limitNumber);
        return res.status(200).json({
            success: true,
            data: {
                reviews,
                pagination: {
                    total,
                    page: pageNumber,
                    limit: limitNumber,
                    totalPages,
                    pages: totalPages,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/reviews/my-review/:courseId
 * Get current user's review for a specific course
 * @access Private (auth required)
 */
const getUserReviewForCourse = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const userId = req.user._id;

        const review = await Review.findOne({ userId, courseId })
            .populate('userId', 'fullName avatar');

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found.',
            });
        }

        return res.status(200).json({
            success: true,
            data: { review },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/reviews
 * Create a new review for a course
 * @access Private (auth, isEnrolled required)
 * Business Rules: BR17 (only enrolled), BR18 (one review per course)
 */
const createReview = async (req, res, next) => {
    try {
        const { courseId, rating, reviewText } = req.body;
        const userId = req.user._id;

        // Validate required fields
        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: 'Course ID is required.',
            });
        }

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5.',
            });
        }

        // Check if user already has a review for this course (BR18)
        const existingReview = await Review.findOne({ userId, courseId });
        if (existingReview) {
            return res.status(409).json({
                success: false,
                message: 'You have already reviewed this course. Please edit your existing review instead.',
            });
        }

        // Check if user is enrolled in the course (BR17)
        // Note: This requires Enrollment model. If not available, skip for now
        // const enrollment = await Enrollment.findOne({ userId, courseId, status: 'active' });
        // if (!enrollment) {
        //     return res.status(403).json({
        //         success: false,
        //         message: 'You must be enrolled in the course to leave a review.',
        //     });
        // }

        const review = await Review.create({
            userId,
            courseId,
            rating,
            reviewText: reviewText || null,
        });

        await syncCourseRating(courseId);

        // Populate user data
        await review.populate('userId', 'fullName avatar');

        return res.status(201).json({
            success: true,
            message: 'Review created successfully.',
            data: { review },
        });
    } catch (error) {
        // Handle duplicate key error for unique constraint
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'You have already reviewed this course.',
            });
        }
        next(error);
    }
};

/**
 * PUT /api/reviews/:reviewId
 * Update an existing review
 * @access Private (auth, isReviewOwner required)
 * Business Rules: BR18 (only own review)
 */
const updateReview = async (req, res, next) => {
    try {
        const reviewId = req.params.id || req.params.reviewId;
        const { rating, reviewText } = req.body;
        const userId = req.user._id;

        // Find review
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found.',
            });
        }

        // Check ownership (BR18)
        if (review.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only edit your own review.',
            });
        }

        // Update fields
        if (rating !== undefined) {
            if (rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating must be between 1 and 5.',
                });
            }
            review.rating = rating;
        }

        if (reviewText !== undefined) {
            review.reviewText = reviewText || null;
        }

        await review.save();
        await review.populate('userId', 'fullName avatar');
        await syncCourseRating(review.courseId);

        return res.status(200).json({
            success: true,
            message: 'Review updated successfully.',
            data: { review },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/reviews/:reviewId
 * Delete a review
 * @access Private (auth, isReviewOwner or isReviewOwnerOrAdmin required)
 * Business Rules: BR22 (admin can delete any)
 */
const deleteReview = async (req, res, next) => {
    try {
        const reviewId = req.params.id || req.params.reviewId;
        const userId = req.user._id;
        const userRole = req.user.role;

        // Find review
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found.',
            });
        }

        // Check authorization: owner or admin (BR22)
        if (review.userId.toString() !== userId.toString() && userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own review or an admin can delete any review.',
            });
        }

        await Review.findByIdAndDelete(reviewId);
        await syncCourseRating(review.courseId);

        return res.status(200).json({
            success: true,
            message: 'Review deleted successfully.',
        });
    } catch (error) {
        next(error);
    }
};

const syncCourseRating = async (courseId) => {
    try {
        let Course;
        try {
            Course = require('../models/Course');
        } catch (error) {
            return;
        }

        const ratingSummary = await calculateCourseRatingStats(courseId);
        await Course.findByIdAndUpdate(courseId, {
            averageRating: ratingSummary.averageRating,
        });
    } catch (error) {
        console.error('[Review] Error syncing course rating:', error);
    }
};

/**
 * GET /api/courses/:id/rating-summary
 * Get rating distribution and summary for a course
 * @access Public
 */
const getRatingSummary = async (req, res, next) => {
    try {
        const courseId = req.params.id || req.params.courseId;

        const stats = await calculateCourseRatingStats(courseId);

        return res.status(200).json({
            success: true,
            data: {
                averageRating: Math.round(stats.averageRating * 10) / 10,
                totalReviews: stats.totalReviews,
                distribution: stats.distribution,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCourseReviews,
    getUserReviewForCourse,
    createReview,
    updateReview,
    deleteReview,
    getRatingSummary,
};