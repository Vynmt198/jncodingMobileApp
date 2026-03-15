#!/usr/bin/env node
/**
 * OPLW - Database Reset (Chỉ dùng cho môi trường development)
 * Chạy: node scripts/db/reset.js
 * Xóa toàn bộ collections và seed lại
 * CẢNH BÁO: Không chạy trên production!
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

if (process.env.NODE_ENV === 'production') {
    console.error('[Reset] Không được reset database ở môi trường production!');
    process.exit(1);
}

const mongoose = require('mongoose');
const connectDB = require('../../src/config/database');

const COLLECTIONS = [
    'users',
    'sessions',
    'categories',
    'courses',
    'lessons',
    'enrollments',
    'progresses',
    'payments',
    'reviews',
    'quizzes',
    'quizattempts',
    'passwordresets',
    'discussions',
    'certificates',
    'courseblocks',
    'assignments',
    'assignmentsubmissions',
];

async function reset() {
    try {
        await connectDB();
        const db = mongoose.connection.db;

        console.log('[Reset] Đang xóa các collections...');
        const existing = await db.listCollections().toArray();
        const names = existing.map((c) => c.name);

        for (const name of COLLECTIONS) {
            if (names.includes(name)) {
                await db.collection(name).drop();
                console.log('  - Đã xóa', name);
            }
        }

        console.log('[Reset] ✅ Database đã reset.');
        console.log('[Reset] Chạy: npm run db:seed để tạo dữ liệu mẫu.');
    } catch (error) {
        console.error('[Reset] Lỗi:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

reset();
