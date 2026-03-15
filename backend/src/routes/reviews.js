const express = require('express');
const router = express.Router();

const {
    getUserReviewForCourse,
    createReview,
    updateReview,
    deleteReview,
} = require('../controllers/reviewController');

const auth = require('../middleware/auth');
const { isEnrolled, isReviewOwner, isReviewOwnerOrAdmin } = require('../middleware/roleCheck');
const { validateCreateReview, validateUpdateReview } = require('../utils/validators');

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       required:
 *         - userId
 *         - courseId
 *         - rating
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ObjectId
 *           example: "507f1f77bcf86cd799439011"
 *         userId:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: "507f1f77bcf86cd799439012"
 *             fullName:
 *               type: string
 *               example: "Nguyen Van A"
 *             avatar:
 *               type: string
 *               example: "https://example.com/avatar.jpg"
 *         courseId:
 *           type: string
 *           description: Course ObjectId
 *           example: "507f1f77bcf86cd799439013"
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Rating from 1 to 5 stars
 *           example: 5
 *         reviewText:
 *           type: string
 *           maxLength: 1000
 *           description: Optional review text
 *           example: "Great course! Very helpful."
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-03-07T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-03-07T10:30:00.000Z"
 *     ReviewInput:
 *       type: object
 *       required:
 *         - courseId
 *         - rating
 *       properties:
 *         courseId:
 *           type: string
 *           description: Course ObjectId to review
 *           example: "507f1f77bcf86cd799439013"
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Rating from 1 to 5 stars
 *           example: 5
 *         reviewText:
 *           type: string
 *           maxLength: 1000
 *           description: Optional review text
 *           example: "Great course! Very helpful."
 *     ReviewUpdateInput:
 *       type: object
 *       properties:
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Updated rating (1-5 stars)
 *           example: 4
 *         reviewText:
 *           type: string
 *           maxLength: 1000
 *           description: Updated review text
 *           example: "Updated: Still a great course!"
 *     Pagination:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           example: 50
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         pages:
 *           type: integer
 *           example: 5
 */

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Course reviews and ratings management (Module 5)
 */

/**
 * @swagger
 * /api/reviews/my-review/{courseId}:
 *   get:
 *     summary: Get current user's review for a specific course
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ObjectId
 *         example: "507f1f77bcf86cd799439013"
 *     responses:
 *       200:
 *         description: User's review found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     review:
 *                       $ref: '#/components/schemas/Review'
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Review not found
 */
router.get('/my-review/:courseId', auth, getUserReviewForCourse);

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a new review for a course
 *     description: Only enrolled learners can create a review. One review per course per user (BR17, BR18).
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewInput'
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Review created successfully."
 *                 data:
 *                   type: object
 *                   properties:
 *                     review:
 *                       $ref: '#/components/schemas/Review'
 *       400:
 *         description: Validation error - Invalid rating or missing fields
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - User not enrolled in the course
 *       409:
 *         description: Conflict - User has already reviewed this course
 */
router.post('/', auth, isEnrolled('courseId'), validateCreateReview, createReview);

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Update an existing review
 *     description: Only the review owner can update their review (BR18).
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ObjectId
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewUpdateInput'
 *     responses:
 *       200:
 *         description: Review updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Review updated successfully."
 *                 data:
 *                   type: object
 *                   properties:
 *                     review:
 *                       $ref: '#/components/schemas/Review'
 *       400:
 *         description: Validation error - Invalid rating
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Not the review owner
 *       404:
 *         description: Review not found
 */
router.put('/:id', auth, isReviewOwner, validateUpdateReview, updateReview);

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     description: Review owner or admin can delete a review (BR22).
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ObjectId
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Review deleted successfully."
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Not the review owner or admin
 *       404:
 *         description: Review not found
 */
router.delete('/:id', auth, isReviewOwnerOrAdmin, deleteReview);

module.exports = router;