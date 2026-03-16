#!/usr/bin/env node
/**
 * Thêm 1 quiz mẫu vào khóa học đầu tiên (để test Module 6).
 * Chạy SAU khi đã chạy seed.js: node scripts/db/seed-quiz.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

const connectDB = require('../../src/config/database');
const { Course, Lesson, Quiz } = require('../../src/models');

async function run() {
    try {
        if (mongoose.connection.readyState !== 1) {
            await connectDB();
        }
        console.log('[Seed-Quiz] Đang thêm quiz mẫu...');

        const course = await Course.findOne({ status: 'active' }).sort({ createdAt: 1 });
        if (!course) {
            console.log('[Seed-Quiz] Không tìm thấy khóa học. Chạy seed.js trước.');
            process.exit(1);
        }

        // Lesson đầu tiên của khóa → đổi thành type quiz (để không cần hoàn thành lesson trước)
        const lesson = await Lesson.findOne({ courseId: course._id }).sort({ order: 1 });
        if (!lesson) {
            console.log('[Seed-Quiz] Không tìm thấy lesson. Chạy seed.js trước.');
            process.exit(1);
        }

        await Lesson.findByIdAndUpdate(lesson._id, {
            type: 'quiz',
            title: 'Quiz: Kiểm tra Python cơ bản',
            duration: 300, // 5 phút
        });
        console.log('[Seed-Quiz] Đã cập nhật lesson thành type quiz:', lesson._id);

        const existing = await Quiz.findOne({ lessonId: lesson._id });
        if (existing) {
            console.log('[Seed-Quiz] Quiz đã tồn tại cho lesson này. Bỏ qua.');
            process.exit(0);
        }

        await Quiz.create({
            lessonId: lesson._id,
            title: 'Quiz: Kiểm tra Python cơ bản',
            passingScore: 60,
            timeLimit: 300,
            questions: [
                {
                    questionText: 'Python là ngôn ngữ lập trình biên dịch hay thông dịch?',
                    type: 'multiple-choice',
                    options: ['Biên dịch', 'Thông dịch', 'Cả hai', 'Không xác định'],
                    correctAnswer: 'Thông dịch',
                    explanation: 'Python dùng trình thông dịch để chạy code.',
                    points: 1,
                },
                {
                    questionText: 'Trong Python, list có thể chứa nhiều kiểu dữ liệu khác nhau.',
                    type: 'true-false',
                    options: ['Đúng', 'Sai'],
                    correctAnswer: true,
                    explanation: 'List trong Python có thể chứa int, str, list, v.v.',
                    points: 1,
                },
                {
                    questionText: 'Hàm print() trong Python dùng để làm gì?',
                    type: 'multiple-choice',
                    options: ['Đọc input', 'In ra màn hình', 'Ghi file', 'Khai báo biến'],
                    correctAnswer: 'In ra màn hình',
                    explanation: 'print() xuất nội dung ra console/màn hình.',
                    points: 1,
                },
            ],
        });
        console.log('[Seed-Quiz] ✅ Đã tạo quiz mẫu. Vào app → Khóa học "Python cơ bản" → tab Curriculum → bấm lesson Quiz.');
    } catch (error) {
        console.error('[Seed-Quiz] Lỗi:', error.message);
        process.exit(1);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
    }
}

if (require.main === module) {
    run().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { run };
