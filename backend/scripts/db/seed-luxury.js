#!/usr/bin/env node
/**
 * OPLW - Luxury Database Seed Script
 * Chạy: node scripts/db/seed-luxury.js
 * Tạo dữ liệu cao cấp, đẹp mắt để demo Luxury UI theme
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
    Review,
    Enrollment,
} = require('../../src/models');

const SALT_ROUNDS = 10;

// High-quality imagery from Unsplash for Luxury feel
const IMAGES = {
    categories: {
        design: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&auto=format&fit=crop',
        business: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400&auto=format&fit=crop',
        tech: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=400&auto=format&fit=crop',
        growth: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?q=80&w=400&auto=format&fit=crop',
        wellness: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=400&auto=format&fit=crop',
        marketing: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400&auto=format&fit=crop',
    },
    courses: [
        'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1454117096348-e4abd6c4e51-q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1542744094-3a56a6936353?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1491975474562-1f4e30bc9468?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=800&auto=format&fit=crop',
    ],
    avatars: [
        'https://i.pravatar.cc/150?u=1',
        'https://i.pravatar.cc/150?u=2',
        'https://i.pravatar.cc/150?u=3',
        'https://i.pravatar.cc/150?u=4',
        'https://i.pravatar.cc/150?u=5',
    ]
};

async function run() {
    try {
        if (mongoose.connection.readyState !== 1) {
            await connectDB();
        }
        console.log('[Seed-Luxury] 💎 Bắt đầu seed database với dữ liệu cao cấp...');

        // Clear existing data (optional but recommended for clean verification)
        await Promise.all([
            Category.deleteMany({}),
            Course.deleteMany({}),
            User.deleteMany({}),
            Lesson.deleteMany({}),
            Review.deleteMany({}),
            Enrollment.deleteMany({}),
        ]);
        console.log('[Seed-Luxury] 🧹 Đã dọn dẹp database cũ');

        // 1. Categories
        const categories = await Category.insertMany([
            { name: 'Design & Creative', description: 'Nghệ thuật, UI/UX, và Sáng tạo nội dung', slug: 'design-creative' },
            { name: 'Business & Strategy', description: 'Quản trị, Tài chính, và Khởi nghiệp', slug: 'business-strategy' },
            { name: 'Technology & Coding', description: 'Lập trình, AI, và Hạ tầng Cloud', slug: 'technology-coding' },
            { name: 'Personal Growth', description: 'Kỹ năng mềm, Tư duy, và Năng suất', slug: 'personal-growth' },
            { name: 'Lifestyle & Wellness', description: 'Sức khỏe, Yoga, và Nghệ thuật sống', slug: 'lifestyle-wellness' },
            { name: 'Marketing & Growth', description: 'Branding, SEO, và Phễu bán hàng', slug: 'marketing-growth' },
        ]);
        console.log('[Seed-Luxury] ✨ Đã tạo', categories.length, 'categories cao cấp');

        // 2. Users (admin, instructors, learners)
        const hashedPassword = await bcrypt.hash('Password@123', SALT_ROUNDS);
        const users = await User.insertMany([
            {
                email: 'admin@oplw.com',
                password: hashedPassword,
                fullName: 'Alexander Wright',
                role: 'admin',
                avatar: IMAGES.avatars[0],
                bio: 'Managing Director of OPLW Elite Learning.'
            },
            {
                email: 'instructor@oplw.com',
                password: hashedPassword,
                fullName: 'Julianne Moore',
                role: 'instructor',
                avatar: IMAGES.avatars[1],
                instructorHeadline: 'Senior UI/UX Design Consultant at Apple',
                instructorBio: 'With over 15 years of experience in Silicon Valley, Julianne brings a world-class perspective to design education.',
                bio: 'Award-winning designer and educator.'
            },
            {
                email: 'instructor2@oplw.com',
                password: hashedPassword,
                fullName: 'Marcus Aurelius',
                role: 'instructor',
                avatar: IMAGES.avatars[2],
                instructorHeadline: 'Venture Capitalist & Business Strategist',
                instructorBio: 'Marcus has helped scale over 50 startups to Series B. He specializes in lean operations and rapid market entry.',
                bio: 'Serial entrepreneur and investor.'
            },
            {
                email: 'learner@oplw.com',
                password: hashedPassword,
                fullName: 'Sophia Sterling',
                role: 'learner',
                avatar: IMAGES.avatars[3],
                bio: 'Aspiring product manager and design enthusiast.'
            },
            {
                email: 'learner2@oplw.com',
                password: hashedPassword,
                fullName: 'David Beckham',
                role: 'learner',
                avatar: IMAGES.avatars[4],
                bio: 'Dedicated student aiming for a career in technology.'
            }
        ]);
        const [admin, instructor1, instructor2, learner1, learner2] = users;
        console.log('[Seed-Luxury] 👤 Đã tạo', users.length, 'người dùng (Alexander, Julianne, Marcus, Sophia, David)');

        // 3. Courses
        const courses = await Course.insertMany([
            {
                title: 'Mastering Minimalist UI Design',
                description: 'Trở thành chuyên gia thiết kế giao diện theo phong cách tối giản cao cấp. Khám phá bí mật về khoảng trắng và typo.',
                instructorId: instructor1._id,
                categoryId: categories[0]._id,
                level: 'advanced',
                status: 'active',
                price: 299,
                estimatedCompletionHours: 45,
                thumbnail: IMAGES.courses[0],
                enrollmentCount: 5460,
                averageRating: 4.9,
            },
            {
                title: 'Venture Capital & Seed Funding',
                description: 'Quy trình gọi vốn từ A-Z dành cho các nhà sáng lập. Cách làm việc với các quỹ đầu tư thiên thần.',
                instructorId: instructor2._id,
                categoryId: categories[1]._id,
                level: 'intermediate',
                status: 'active',
                price: 199,
                estimatedCompletionHours: 32,
                thumbnail: IMAGES.courses[1],
                enrollmentCount: 1280,
                averageRating: 4.7,
            },
            {
                title: 'Fullstack Next.js 14 Mastery',
                description: 'Xây dựng ứng dụng SaaS quy mô lớn với Next.js, Server Actions, và PostgreSQL. Hiệu năng vượt trội.',
                instructorId: instructor1._id, // Assume she also codes :)
                categoryId: categories[2]._id,
                level: 'advanced',
                status: 'active',
                price: 150,
                estimatedCompletionHours: 60,
                thumbnail: IMAGES.courses[2],
                enrollmentCount: 8900,
                averageRating: 4.8,
            },
            {
                title: 'The Stoic Mindset for Leaders',
                description: 'Áp dụng triết học khắc kỷ vào quản trị doanh nghiệp và cân bằng cuộc sống. Đạt được sự bình thản trong bão tố.',
                instructorId: instructor2._id,
                categoryId: categories[3]._id,
                level: 'all-levels',
                status: 'active',
                price: 0,
                estimatedCompletionHours: 15,
                thumbnail: IMAGES.courses[3],
                enrollmentCount: 12500,
                averageRating: 4.9,
            },
            {
                title: 'Luxury Real Estate Marketing',
                description: 'Cách tiếp cận và chốt deal với khách hàng siêu giàu. Xây dựng thương hiệu cá nhân trong ngành BĐS xa xỉ.',
                instructorId: instructor1._id,
                categoryId: categories[5]._id,
                level: 'advanced',
                status: 'active',
                price: 499,
                estimatedCompletionHours: 40,
                thumbnail: IMAGES.courses[4],
                enrollmentCount: 950,
                averageRating: 5.0,
            },
            {
               title: 'Modern Architecture & Sustainability',
               description: 'Thiết kế không gian sống hiện đại kết hợp với các nguyên liệu bền vững. Tương lai của kiến trúc xanh.',
               instructorId: instructor2._id,
               categoryId: categories[0]._id,
               level: 'intermediate',
               status: 'active',
               price: 175,
               thumbnail: IMAGES.courses[5],
               enrollmentCount: 2300,
               averageRating: 4.6
            },
            {
                title: 'Advanced AI Prompt Engineering',
                description: 'Kỹ thuật điều khiển AI để tạo ra kết quả chính xác nhất cho doanh nghiệp. Làm chủ ChatGPT, Midjourney, và Claude.',
                instructorId: instructor1._id,
                categoryId: categories[2]._id,
                level: 'intermediate',
                status: 'active',
                price: 89,
                thumbnail: IMAGES.courses[6],
                enrollmentCount: 15000,
                averageRating: 4.7
            }
        ]);
        console.log('[Seed-Luxury] 📚 Đã tạo', courses.length, 'khóa học Elite');

        // 4. Lessons
        const lessons = [];
        const lessonTitles = [
            ['Introduction to High-End Aesthetics', 'Understanding the Golden Ratio', 'Case Study: Apple Website', 'Typography and Hierarchy', 'Final Project: Personal Portfolio'],
            ['The VC Landscape 2024', 'Crafting the Perfect Pitch Deck', 'Valuation Methods', 'Negotiating Term Sheets', 'Closing the Deal'],
            ['Next.js Fundamentals', 'Server Components vs Client Components', 'Authentication with NextAuth', 'Deployment to Vercel', 'Database Integration'],
            ['Introduction to Stoicism', 'The Dichotomy of Control', 'Morning Meditations', 'Handling Adversity', 'Living in Accordance with Nature'],
            ['Understanding the Ultra-High-Net-Worth Mindset', 'Personal Branding in Luxury', 'Digital Marketing for Real Estate', 'Networking at Elite Events', 'Psychology of the Sale']
        ];

        for (let i = 0; i < 5; i++) {
            const course = courses[i];
            const titles = lessonTitles[i];
            titles.forEach((title, idx) => {
                lessons.push({
                    courseId: course._id,
                    title: title,
                    content: `In this lesson, we will explore ${title.toLowerCase()}. This is a premium module designed for serious learners.`,
                    order: idx + 1,
                    duration: 15 + (idx * 5),
                    type: 'video',
                    isPreview: idx === 0 // First lesson is preview
                });
            });
        }
        await Lesson.insertMany(lessons);
        console.log('[Seed-Luxury] 🎥 Đã tạo', lessons.length, 'bài học chi tiết');

        // 5. Reviews
        const reviews = [
            { userId: learner1._id, courseId: courses[0]._id, rating: 5, reviewText: 'This course changed the way I see design. Absolutely worth every penny!' },
            { userId: learner2._id, courseId: courses[0]._id, rating: 4, reviewText: 'Very detailed and high-quality production. Highly recommended.' },
            { userId: learner1._id, courseId: courses[1]._id, rating: 5, reviewText: 'The best resource I found for learning about seed funding. Marcus is a legend.' },
            { userId: learner2._id, courseId: courses[3]._id, rating: 5, reviewText: 'Crucial for any leader. It helped me stay calm during my last launch.' },
            { userId: learner1._id, courseId: courses[4]._id, rating: 5, reviewText: 'Elite content for elite professionals. The networking tips are gold.' },
        ];
        await Review.insertMany(reviews);
        console.log('[Seed-Luxury] ⭐ Đã tạo', reviews.length, 'nhận xét từ học viên');

        // 6. Enrollment
        await Enrollment.create({
            userId: learner1._id,
            courseId: courses[0]._id,
            status: 'active',
        });
        await Enrollment.create({
            userId: learner1._id,
            courseId: courses[3]._id, // Enrolled in the stoicism course (free)
            status: 'active',
        });
        console.log('[Seed-Luxury] 🔗 Đã tạo các đăng ký mẫu');

        console.log('[Seed-Luxury] 🏆 ✅ Cấu trúc database sẵn sàng cho Luxury Experience!');
        console.log('\n--- Thông tin Đăng nhập ---');
        console.log('Alexander (Admin):  admin@oplw.com   / Password@123');
        console.log('Julianne (Instr):   instructor@oplw.com / Password@123');
        console.log('Sophia (Learner):   learner@oplw.com    / Password@123');
    } catch (error) {
        console.error('[Seed-Luxury] ❌ Lỗi:', error.message);
        process.exit(1);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
    }
}

run();
