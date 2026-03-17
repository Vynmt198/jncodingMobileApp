const crypto = require('crypto');
const vnpayConfig = require('../config/vnpay');
const qs = require('qs');

class VNPayService {
    createPaymentUrl(orderId, amount, orderInfo, ipAddr, returnUrl) {
        const date = new Date();
        // 1. Xử lý thời gian GMT+7 (Việt Nam)
        const vnTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));
        const formatVN = (d) => d.toISOString().replace(/[-:T.]/g, '').slice(0, 14);

        const createDate = formatVN(vnTime);
        const expireDate = formatVN(new Date(vnTime.getTime() + 15 * 60 * 1000));

        let vnp_Params = {
            'vnp_Version': '2.1.0',
            'vnp_Command': 'pay',
            'vnp_TmnCode': vnpayConfig.vnp_TmnCode,
            'vnp_Amount': Math.round(amount * 100),
            'vnp_CurrCode': 'VND',
            'vnp_TxnRef': orderId,
            'vnp_OrderInfo': orderInfo,
            'vnp_OrderType': 'other',
            'vnp_Locale': 'vn',
            'vnp_ReturnUrl': returnUrl || vnpayConfig.vnp_ReturnUrl,
            'vnp_IpAddr': ipAddr,
            'vnp_CreateDate': createDate,
            'vnp_ExpireDate': expireDate, // Đã fix lỗi ReferenceError ở đây
        };

        // 2. Sắp xếp tham số (Chỉ sắp xếp, không encode ở bước này)
        vnp_Params = this.sortObject(vnp_Params);

        // 3. Tạo chuỗi băm và Query String đồng nhất bằng thư viện qs
        // Chuẩn VNPay 2.1.0: encode các giá trị và thay %20 bằng +
        const signData = qs.stringify(vnp_Params, { encode: true }).replace(/%20/g, "+");

        // 4. Tạo SecureHash bằng SHA512
        const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        // 5. Build URL cuối cùng
        const paymentUrl = `${vnpayConfig.vnp_Url}?${signData}&vnp_SecureHash=${signed}`;

        console.log('--- DEBUG VNPAY ---');
        console.log('Sign Data:', signData);
        console.log('Secure Hash:', signed);

        return paymentUrl;
    }

    // TỐI ƯU: Hàm này chỉ làm đúng nhiệm vụ là sắp xếp Key
    sortObject(obj) {
        let sorted = {};
        let keys = Object.keys(obj).sort();
        for (let key of keys) {
            sorted[key] = obj[key];
        }
        return sorted;
    }

    verifyReturnUrl(vnp_Params) {
        // IMPORTANT: Không mutate object đầu vào (thường là req.query).
        // Nếu delete trực tiếp sẽ làm mất vnp_SecureHash khi redirect sang frontend,
        // dẫn tới lần verify tiếp theo (qua API) bị fail dù vnp_ResponseCode là '00'.
        const params = { ...vnp_Params };

        const secureHash = params.vnp_SecureHash;
        delete params.vnp_SecureHash;
        delete params.vnp_SecureHashType;

        const sortedParams = this.sortObject(params);
        // Sử dụng qs.stringify để đồng nhất cách encode với lúc tạo URL
        const signData = qs.stringify(sortedParams, { encode: true }).replace(/%20/g, "+");

        const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        if (!secureHash) return false;
        return String(secureHash).toLowerCase() === String(signed).toLowerCase();
    }

    getPaymentStatus(responseCode) {
        const statusMap = {
            '00': 'Giao dịch thành công',
            '24': 'Khách hàng hủy giao dịch',
            '11': 'Hết hạn chờ thanh toán',
            // ... các mã khác bạn đã có
        };
        return statusMap[responseCode] || 'Lỗi không xác định';
    }
}

module.exports = new VNPayService();