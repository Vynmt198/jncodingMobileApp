const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/paymentsController');
const auth = require('../middleware/auth');
const { validateCreatePayment } = require('../utils/paymentValidator');

router.post('/create', auth, validateCreatePayment, paymentsController.createPayment);
router.get('/vnpay-return', paymentsController.vnpayReturn);
router.get('/vnpay-return-api', paymentsController.vnpayReturnApi);
router.get('/vnpay-ipn', paymentsController.vnpayIPN);
router.get('/history', auth, paymentsController.getPaymentHistory);
router.get('/stats/summary', auth, paymentsController.getPaymentStats);
router.get('/:orderId', auth, paymentsController.getPaymentDetail);

module.exports = router;
