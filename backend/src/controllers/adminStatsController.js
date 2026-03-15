const Payment = require('../models/Payment');
const User = require('../models/User');
const Course = require('../models/Course');

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']; // Sunday = 0, Monday = 1, ...

/**
 * @route GET /api/admin/stats
 * @desc System stats for admin dashboard: total revenue, new students (week), courses count, revenue last 7 days
 */
exports.getSystemStats = async (req, res, next) => {
    try {
        const now = new Date();
        const startOfThisWeek = new Date(now);
        startOfThisWeek.setDate(now.getDate() - now.getDay() + 1); // Monday 00:00
        startOfThisWeek.setHours(0, 0, 0, 0);
        const startOfLast7Days = new Date(now);
        startOfLast7Days.setDate(now.getDate() - 6);
        startOfLast7Days.setHours(0, 0, 0, 0);

        const [totalRevenueResult, newStudentsThisWeek, totalCourses, revenueByDay] = await Promise.all([
            Payment.aggregate([
                { $match: { paymentStatus: 'success' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            User.countDocuments({
                role: 'learner',
                createdAt: { $gte: startOfThisWeek },
            }),
            Course.countDocuments({}),
            Payment.aggregate([
                {
                    $match: {
                        paymentStatus: 'success',
                        createdAt: { $gte: startOfLast7Days },
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        total: { $sum: '$amount' },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
        ]);

        const totalRevenue = totalRevenueResult[0]?.total ?? 0;

        const revenueByDate = Object.fromEntries((revenueByDay || []).map((r) => [r._id, r.total]));
        const revenueLast7Days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfLast7Days);
            d.setDate(startOfLast7Days.getDate() + i);
            const key = d.toISOString().slice(0, 10);
            const dayOfWeek = d.getDay();
            revenueLast7Days.push({
                name: DAY_LABELS[dayOfWeek],
                total: revenueByDate[key] ?? 0,
            });
        }

        res.status(200).json({
            success: true,
            data: {
                totalRevenue,
                newStudentsThisWeek,
                totalCourses,
                revenueLast7Days,
            },
        });
    } catch (error) {
        next(error);
    }
};
