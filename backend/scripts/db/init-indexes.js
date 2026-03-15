#!/usr/bin/env node
/**
 * OPLW - Database Index Initialization
 * Chạy: node scripts/db/init-indexes.js
 * Tạo/sync tất cả indexes từ Mongoose schemas
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

const connectDB = require('../../src/config/database');

async function initIndexes() {
    try {
        await connectDB();

        console.log('[Init] Đang đồng bộ indexes từ các models...');

        // Load tất cả models để Mongoose đăng ký indexes
        require('../../src/models/User');
        require('../../src/models/Category');
        require('../../src/models/Course');
        require('../../src/models/Lesson');
        require('../../src/models/Enrollment');
        require('../../src/models/Progress');
        require('../../src/models/Payment');
        require('../../src/models/Review');
        require('../../src/models/Quiz');
        require('../../src/models/QuizAttempt');
        require('../../src/models/PasswordReset');
        require('../../src/models/Session');
        require('../../src/models/Discussion');
        require('../../src/models/Certificate');
        require('../../src/models/CourseBlock');
        require('../../src/models/Assignment');
        require('../../src/models/AssignmentSubmission');

        await mongoose.connection.syncIndexes();
        console.log('[Init] ✅ Indexes đã được đồng bộ.');
    } catch (error) {
        console.error('[Init] Lỗi:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

initIndexes();
