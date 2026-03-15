#!/usr/bin/env node
/**
 * OPLW - Database Seed Script
 * Chạy: node scripts/db/seed.js
 * Tạo dữ liệu mẫu để team dev dùng chung, tránh conflict khi mỗi người tự tạo
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = require('../../src/config/database');
const {
    User,
    Category,
    Course,
    Lesson,
    Enrollment,
} = require('../../src/models');

const SALT_ROUNDS = 10;

async function run() {
    try {
        if (mongoose.connection.readyState !== 1) {
            await connectDB();
        }
        console.log('[Seed] Bắt đầu seed database...');

        // 1. Categories
        const categories = await Category.insertMany([
            { name: 'Python', description: 'Lập trình Python' },
            { name: 'JavaScript', description: 'Lập trình JavaScript' },
            { name: 'Java', description: 'Lập trình Java' },
            { name: 'Web Development', description: 'HTML, CSS, React, Node.js' },
            { name: 'SQL', description: 'Cơ sở dữ liệu SQL' },
        ]);
        console.log('[Seed] Đã tạo', categories.length, 'categories');

        // 2. Users (admin, instructor, learner)
        const hashedPassword = await bcrypt.hash('Password@123', SALT_ROUNDS);
        const users = await User.insertMany([
            {
                email: 'admin@oplw.com',
                password: hashedPassword,
                fullName: 'Admin OPLW',
                role: 'admin',
            },
            {
                email: 'instructor@oplw.com',
                password: hashedPassword,
                fullName: 'Instructor Demo',
                role: 'instructor',
            },
            {
                email: 'learner@oplw.com',
                password: hashedPassword,
                fullName: 'Learner Demo',
                role: 'learner',
            },
        ]);
        const [admin, instructor, learner] = users;
        console.log('[Seed] Đã tạo', users.length, 'users');

        // 3. Courses
        const courses = await Course.insertMany([
            {
                title: 'Python cơ bản',
                description: 'Học Python từ con số 0',
                instructorId: instructor._id,
                categoryId: categories[0]._id,
                level: 'beginner',
                status: 'active',
                price: 0,
                estimatedCompletionHours: 20,
            },
            {
                title: 'JavaScript nâng cao',
                description: 'JavaScript ES6+, async/await',
                instructorId: instructor._id,
                categoryId: categories[1]._id,
                level: 'intermediate',
                status: 'active',
                price: 199000,
                estimatedCompletionHours: 30,
            },
        ]);
        console.log('[Seed] Đã tạo', courses.length, 'courses');

        // 4. Lessons
        const lessons = [];
        for (const course of courses) {
            for (let i = 1; i <= 3; i++) {
                lessons.push({
                    courseId: course._id,
                    title: `Bài ${i}: Giới thiệu`,
                    content: `Nội dung bài học ${i}`,
                    order: i,
                });
            }
        }
        await Lesson.insertMany(lessons);
        console.log('[Seed] Đã tạo', lessons.length, 'lessons');

        // 5. Enrollment (learner enrolled in free course)
        await Enrollment.create({
            userId: learner._id,
            courseId: courses[0]._id,
            status: 'active',
        });
        console.log('[Seed] Đã tạo enrollment mẫu');

        console.log('[Seed] ✅ Seed hoàn tất!');
        console.log('\n--- Tài khoản mẫu ---');
        console.log('Admin:     admin@oplw.com / Password@123');
        console.log('Instructor: instructor@oplw.com / Password@123');
        console.log('Learner:   learner@oplw.com / Password@123');
    } catch (error) {
        console.error('[Seed] Lỗi:', error.message);
        process.exit(1);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
    }
}

// Cho phép gọi trực tiếp: node seed.js
if (require.main === module) {
    run()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { run };
