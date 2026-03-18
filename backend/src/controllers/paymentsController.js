const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const vnpayService = require('../services/vnpayService');

exports.createPayment = async (req, res, next) => {
    try {
        const { amount, courseId, courseIds, returnUrl } = req.body;
        const userId = req.user._id;

        const orderId = `${Date.now()}_${userId}`;
        const ipAddr = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            '127.0.0.1';

        console.log('Creating payment with IP:', ipAddr);

        const ids = Array.isArray(courseIds) && courseIds.length > 0
            ? courseIds
            : (courseId ? [courseId] : []);

        // BR: Không cho mua lại khóa đã có enrollment active
        if (ids.length > 0) {
            const existingEnrollments = await Enrollment.find({
                userId,
                courseId: { $in: ids },
                status: 'active',
            }).populate('courseId', 'title');

            if (existingEnrollments.length > 0) {
                const titles = existingEnrollments
                    .map((e) => e.courseId && e.courseId.title)
                    .filter(Boolean)
                    .join(', ');

                return res.status(400).json({
                    success: false,
                    message: titles
                        ? `Bạn đã mua khóa học: ${titles}. Vui lòng xóa khỏi giỏ hàng trước khi thanh toán.`
                        : 'Bạn đã mua một hoặc nhiều khóa trong giỏ hàng này. Vui lòng xóa chúng khỏi giỏ trước khi thanh toán.',
                });
            }
        }

        let orderInfo = 'Thanh toán';
        if (ids.length > 0) {
            const courses = await Course.find({ _id: { $in: ids } }).select('title').lean();
            const titles = courses.map((c) => c.title).join(', ');
            orderInfo = titles ? `Thanh toan khoa hoc: ${titles}` : orderInfo;
        }

        const payment = await Payment.create({
            userId,
            orderId,
            amount,
            orderInfo,
            courseId: ids[0] || null,
            courseIds: ids,
        });

        const safeReturnUrl = typeof returnUrl === 'string' && /^https?:\/\//i.test(returnUrl) && returnUrl.length <= 2048
            ? returnUrl
            : undefined;

        console.log('[VNPay] returnUrl override:', safeReturnUrl || '(none)', 'default:', require('../config/vnpay').vnp_ReturnUrl);

        const paymentUrl = vnpayService.createPaymentUrl(
            orderId,
            amount,
            orderInfo,
            ipAddr,
            safeReturnUrl
        );

        console.log('Payment URL created:', paymentUrl);

        res.status(200).json({
            success: true,
            message: 'Payment URL created successfully',
            data: {
                paymentUrl,
                orderId,
            },
        });
    } catch (error) {
        next(error);
    }
};

exports.vnpayReturn = async (req, res, next) => {
    try {
        const vnp_Params = req.query;

        const isValid = vnpayService.verifyReturnUrl(vnp_Params);
        // Luôn redirect về cùng backend (trang /payment-result do backend serve) — không dùng CLIENT_URL để tránh sai trang 5173/8081
        const baseUrl = process.env.PAYMENT_RESULT_BASE_URL || `${req.protocol}://${req.get('host')}`;

        if (!isValid) {
            return res.redirect(`${baseUrl}/payment-result?status=failed&message=Invalid+signature`);
        }

        const orderId = vnp_Params.vnp_TxnRef;
        const responseCode = vnp_Params.vnp_ResponseCode;

        const payment = await Payment.findOne({ orderId });

        if (!payment) {
            return res.redirect(`${baseUrl}/payment-result?status=failed&message=Payment+not+found`);
        }

        payment.transactionNo = vnp_Params.vnp_TransactionNo;
        payment.bankCode = vnp_Params.vnp_BankCode;
        payment.cardType = vnp_Params.vnp_CardType;
        payment.vnpayData = vnp_Params;

        if (responseCode === '00') {
            payment.paymentStatus = 'success';

            const courseIdsToEnroll = (payment.courseIds && payment.courseIds.length > 0)
                ? payment.courseIds
                : (payment.courseId ? [payment.courseId] : []);
            for (const cid of courseIdsToEnroll) {
                let enrollment = await Enrollment.findOne({ userId: payment.userId, courseId: cid });
                if (!enrollment) {
                    enrollment = await Enrollment.create({ userId: payment.userId, courseId: cid, status: 'active' });
                    await Course.findByIdAndUpdate(cid, { $inc: { enrollmentCount: 1 } });
                } else {
                    await Enrollment.updateOne({ _id: enrollment._id }, { status: 'active' });
                }
            }
            if (courseIdsToEnroll.length > 0) {
                payment.enrollmentId = (await Enrollment.findOne({ userId: payment.userId, courseId: courseIdsToEnroll[0], status: 'active' }))?._id || null;
            }
        } else {
            payment.paymentStatus = 'failed';
        }

        await payment.save();

        // Redirect về trang kết quả (baseUrl đã khai báo ở đầu hàm)
        const redirectUrl = new URL(`${baseUrl}/payment-result`);
        Object.keys(vnp_Params).forEach(key => {
            redirectUrl.searchParams.append(key, vnp_Params[key]);
        });
        res.redirect(redirectUrl.toString());
    } catch (error) {
        next(error);
    }
};

// Endpoint mới để trả về JSON cho frontend
exports.vnpayReturnApi = async (req, res, next) => {
    try {
        const vnp_Params = req.query;

        const isValid = vnpayService.verifyReturnUrl(vnp_Params);

        if (!isValid) {
            return res.status(200).json({
                success: false,
                responseCode: '97',
                message: 'Invalid signature',
            });
        }

        const orderId = vnp_Params.vnp_TxnRef;
        const responseCode = vnp_Params.vnp_ResponseCode;

        const payment = await Payment.findOne({ orderId });

        if (!payment) {
            return res.status(200).json({
                success: false,
                responseCode: '01',
                message: 'Payment not found',
            });
        }

        payment.transactionNo = vnp_Params.vnp_TransactionNo;
        payment.bankCode = vnp_Params.vnp_BankCode;
        payment.cardType = vnp_Params.vnp_CardType;
        payment.vnpayData = vnp_Params;

        if (responseCode === '00') {
            payment.paymentStatus = 'success';

            const courseIdsToEnroll = (payment.courseIds && payment.courseIds.length > 0)
                ? payment.courseIds
                : (payment.courseId ? [payment.courseId] : []);
            for (const cid of courseIdsToEnroll) {
                let enrollment = await Enrollment.findOne({ userId: payment.userId, courseId: cid });
                if (!enrollment) {
                    enrollment = await Enrollment.create({ userId: payment.userId, courseId: cid, status: 'active' });
                    await Course.findByIdAndUpdate(cid, { $inc: { enrollmentCount: 1 } });
                } else {
                    await Enrollment.updateOne({ _id: enrollment._id }, { status: 'active' });
                }
            }
            if (courseIdsToEnroll.length > 0) {
                payment.enrollmentId = (await Enrollment.findOne({ userId: payment.userId, courseId: courseIdsToEnroll[0], status: 'active' }))?._id || null;
            }
        } else {
            payment.paymentStatus = 'failed';
        }

        await payment.save();

        return res.status(200).json({
            success: responseCode === '00',
            responseCode: responseCode,
            message: vnpayService.getPaymentStatus(responseCode),
            data: {
                orderId: orderId,
                amount: payment.amount,
                transactionNo: payment.transactionNo,
            },
        });
    } catch (error) {
        next(error);
    }
};

exports.vnpayIPN = async (req, res, next) => {
    try {
        const vnp_Params = req.query;

        const isValid = vnpayService.verifyReturnUrl(vnp_Params);

        if (!isValid) {
            return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
        }

        const orderId = vnp_Params.vnp_TxnRef;
        const payment = await Payment.findOne({ orderId });

        if (!payment) {
            return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
        }

        if (payment.amount !== parseInt(vnp_Params.vnp_Amount) / 100) {
            return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
        }

        if (payment.paymentStatus === 'success') {
            return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
        }

        const responseCode = vnp_Params.vnp_ResponseCode;

        if (responseCode === '00') {
            payment.paymentStatus = 'success';
            payment.transactionNo = vnp_Params.vnp_TransactionNo;
            payment.bankCode = vnp_Params.vnp_BankCode;
            payment.cardType = vnp_Params.vnp_CardType;
            payment.vnpayData = vnp_Params;

            const courseIdsToEnroll = (payment.courseIds && payment.courseIds.length > 0)
                ? payment.courseIds
                : (payment.courseId ? [payment.courseId] : []);
            for (const cid of courseIdsToEnroll) {
                let enrollment = await Enrollment.findOne({ userId: payment.userId, courseId: cid });
                if (!enrollment) {
                    enrollment = await Enrollment.create({ userId: payment.userId, courseId: cid, status: 'active' });
                    await Course.findByIdAndUpdate(cid, { $inc: { enrollmentCount: 1 } });
                } else {
                    await Enrollment.updateOne({ _id: enrollment._id }, { status: 'active' });
                }
            }
            if (courseIdsToEnroll.length > 0) {
                payment.enrollmentId = (await Enrollment.findOne({ userId: payment.userId, courseId: courseIdsToEnroll[0], status: 'active' }))?._id || null;
            }

            await payment.save();

            return res.status(200).json({ RspCode: '00', Message: 'Success' });
        } else {
            payment.paymentStatus = 'failed';
            await payment.save();

            return res.status(200).json({ RspCode: '00', Message: 'Success' });
        }
    } catch (error) {
        console.error('VNPay IPN Error:', error);
        return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
};

exports.getPaymentHistory = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10, status } = req.query;

        const query = { userId };
        if (status) {
            query.paymentStatus = status;
        }

        const payments = await Payment.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('-vnpayData');

        // Auto-expire old pending payments (VNPay chưa callback hoặc user đóng browser)
        // Nếu "pending" quá lâu thì chuyển sang "cancelled" để UI không bị kẹt "Chờ xử lý".
        const PENDING_EXPIRE_MS = 30 * 60 * 1000; // 30 phút
        const now = Date.now();
        const expiredIds = payments
            .filter((p) => p.paymentStatus === 'pending' && p.createdAt && (now - new Date(p.createdAt).getTime()) > PENDING_EXPIRE_MS)
            .map((p) => p._id);

        if (expiredIds.length > 0) {
            await Payment.updateMany(
                { _id: { $in: expiredIds }, paymentStatus: 'pending' },
                { $set: { paymentStatus: 'cancelled' } }
            );
            payments.forEach((p) => {
                if (expiredIds.some((id) => id.toString() === p._id.toString())) {
                    p.paymentStatus = 'cancelled';
                }
            });
        }

        const count = await Payment.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                payments,
                totalPages: Math.ceil(count / limit),
                currentPage: parseInt(page),
                total: count,
            },
        });
    } catch (error) {
        next(error);
    }
};

exports.getPaymentDetail = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        const payment = await Payment.findOne({ orderId, userId });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found',
            });
        }

        res.status(200).json({
            success: true,
            data: payment,
        });
    } catch (error) {
        next(error);
    }
};

exports.getPaymentStats = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { startDate, endDate } = req.query;

        const query = { userId };
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const stats = await Payment.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$paymentStatus',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                },
            },
        ]);

        const total = await Payment.countDocuments(query);
        const totalAmount = await Payment.aggregate([
            { $match: { ...query, paymentStatus: 'success' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        res.status(200).json({
            success: true,
            data: {
                stats,
                total,
                totalSuccessAmount: totalAmount[0]?.total || 0,
            },
        });
    } catch (error) {
        next(error);
    }
};
