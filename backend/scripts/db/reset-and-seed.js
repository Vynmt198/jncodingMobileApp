#!/usr/bin/env node
/**
 * OPLW - Reset + Seed (Development only)
 * Chạy: npm run db:reset-seed
 * Xóa DB và seed lại - dùng khi setup lần đầu hoặc cần fresh data
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

if (process.env.NODE_ENV === 'production') {
    console.error('Không chạy reset trên production!');
    process.exit(1);
}

const mongoose = require('mongoose');
const connectDB = require('../../src/config/database');
const seed = require('./seed');

async function main() {
    try {
        await connectDB();
        const db = mongoose.connection.db;

        const COLLECTIONS = [
            'users', 'sessions', 'categories', 'courses', 'lessons', 'enrollments',
            'progresses', 'payments', 'reviews', 'quizzes', 'quizattempts',
            'passwordresets', 'discussions', 'certificates', 'courseblocks',
            'assignments', 'assignmentsubmissions',
        ];

        const existing = await db.listCollections().toArray();
        const names = existing.map((c) => c.name);

        for (const name of COLLECTIONS) {
            if (names.includes(name)) {
                await db.collection(name).drop();
                console.log('[Reset] Đã xóa', name);
            }
        }

        console.log('[Reset] Database đã xóa. Đang seed...\n');
        await seed.run();
    } catch (error) {
        console.error('Lỗi:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

main();
