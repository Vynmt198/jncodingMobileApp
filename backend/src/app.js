require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const passport = require('./config/passport');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const paymentsRoutes = require('./routes/payments');
const reviewRoutes = require('./routes/reviews');
const coursesRoutes = require('./routes/courses');
const lessonsRoutes = require('./routes/lessons');
const categoriesRoutes = require('./routes/categories');
const progressRoutes = require('./routes/progress');
const quizzesRoutes = require('./routes/quizzes');
const instructorRoutes = require('./routes/instructor');
const certificateRoutes = require('./routes/certificates');
const assignmentRoutes = require('./routes/assignments');
const enrollmentRoutes = require('./routes/enrollments');
const discussionRoutes = require('./routes/discussions');
const uploadRoutes = require('./routes/upload');
const path = require('path');
const fs = require('fs');
const app = express();

connectDB();

// Ensure uploads dir exists and serve static thumbnails
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

app.use(helmet());
// Cho phép cả web (Vite 5173) và Expo Web (8081) khi chạy dev
const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
].filter(Boolean);

const corsOrigin = process.env.NODE_ENV === 'production'
    ? (process.env.CLIENT_URL || '*')
    : (origin, cb) => {
        // Allow no origin (like mobile apps) or allowed origins
        if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) return cb(null, true);
        return cb(null, false);
    };
app.use(cors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
    credentials: true,
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(passport.initialize());


if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}
// Log mọi request tới /api để dễ kiểm tra emulator/device có gọi đúng backend
app.use('/api', (req, res, next) => {
    console.log(`[API] ${req.method} ${req.originalUrl}`);
    next();
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/quizzes', quizzesRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'OPLW API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
});

// Trang kết quả thanh toán VNPay (dùng khi redirect từ VNPay — không phụ thuộc web app localhost:5173)
app.get('/payment-result', (req, res) => {
    const status = req.query.status || (req.query.vnp_ResponseCode === '00' ? 'success' : 'failed');
    const message = req.query.message || (status === 'success' ? 'Thanh toán thành công.' : 'Giao dịch chưa thành công.');
    const orderId = (req.query.vnp_TxnRef || req.query.orderId || '').toString();
    const isSuccess = status === 'success';
    // Deep link mở app (scheme myapp trong app.json) — app sẽ mở màn PaymentSuccess với orderId
    const deepLink = orderId ? `myapp://payment-success/${encodeURIComponent(orderId)}` : 'myapp://';
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Kết quả thanh toán</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 24px; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f3f4f6; }
    .card { background: #fff; border-radius: 16px; padding: 32px; max-width: 400px; width: 100%; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 1.35rem; margin: 0 0 8px; color: #111827; }
    p { margin: 0 0 24px; color: #6b7280; font-size: 0.95rem; line-height: 1.5; }
    .order { font-size: 0.85rem; color: #9ca3af; margin-bottom: 24px; }
    .btn { display: inline-block; padding: 12px 24px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 0.95rem; margin: 4px; }
    .btn:focus { outline: none; }
    .btn-secondary { background: #e5e7eb; color: #374151; }
    .success .icon { color: #10b981; }
    .failed .icon { color: #ef4444; }
  </style>
</head>
<body>
  <div class="card ${isSuccess ? 'success' : 'failed'}">
    <div class="icon">${isSuccess ? '✓' : '✕'}</div>
    <h1>${isSuccess ? 'Thanh toán thành công' : 'Thanh toán chưa thành công'}</h1>
    <p>${message}</p>
    ${orderId ? `<div class="order">Mã đơn: ${orderId}</div>` : ''}
    <p style="margin-bottom:16px;font-size:0.9rem;">Bấm nút bên dưới để mở ứng dụng và xem khóa học.</p>
    <a href="${deepLink}" class="btn" id="openApp">Quay lại app</a>
    <a href="#" onclick="window.close(); return false;" class="btn btn-secondary">Đóng trang</a>
  </div>
  <script>
    (function() {
      var openApp = document.getElementById('openApp');
      if (openApp && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        openApp.click();
        setTimeout(function() { window.close(); }, 500);
      }
    })();
  </script>
</body>
</html>
    `);
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found.`,
    });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // 0.0.0.0 để emulator (10.0.2.2) kết nối được
app.listen(PORT, HOST, () => {
    console.log(`[Server] OPLW API running on http://${HOST}:${PORT} (${process.env.NODE_ENV} mode)`);
});

module.exports = app;
