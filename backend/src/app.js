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

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found.`,
    });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[Server] OPLW API running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = app;
