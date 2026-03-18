#!/usr/bin/env node
/**
 * OPLW - Full Database Seed Script (Test Coverage)
 * Chạy: node scripts/db/seed-full.js
 * Tạo dữ liệu đầy đủ các trạng thái: Enrollment, Quiz, Session, Payment, Progress, Discussion, Assignment...
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const connectDB = require('../../src/config/database');
const {
    User, Category, Course, Lesson, Enrollment,
    Progress, Payment, Review, Quiz, QuizAttempt,
    Session, Discussion, Certificate, Assignment,
    AssignmentSubmission,
} = require('../../src/models');

const SALT_ROUNDS = 10;

const IMAGES = {
    categories: [
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=400',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400',
        'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400',
        'https://images.unsplash.com/photo-1493612276216-ee3925520721?q=80&w=400',
    ],
    courses: [
        'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=800',
        'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=800',
        'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800',
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800',
        'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800',
        'https://images.unsplash.com/photo-1542744094-3a56a6936353?q=80&w=800',
    ],
    avatars: [
        'https://i.pravatar.cc/150?u=admin1',
        'https://i.pravatar.cc/150?u=instr1',
        'https://i.pravatar.cc/150?u=instr2',
        'https://i.pravatar.cc/150?u=learn1',
        'https://i.pravatar.cc/150?u=learn2',
        'https://i.pravatar.cc/150?u=learn3',
    ],
};

async function run() {
    try {
        if (mongoose.connection.readyState !== 1) await connectDB();
        console.log('\n💎 [OPLW Full Seed] Bắt đầu...\n');

        // ── CLEAN ──────────────────────────────────────────────────────────
        await Promise.all([
            User.deleteMany({}), Category.deleteMany({}), Course.deleteMany({}),
            Lesson.deleteMany({}), Enrollment.deleteMany({}), Progress.deleteMany({}),
            Payment.deleteMany({}), Review.deleteMany({}), Quiz.deleteMany({}),
            QuizAttempt.deleteMany({}), Session.deleteMany({}), Discussion.deleteMany({}),
            Certificate.deleteMany({}), Assignment.deleteMany({}), AssignmentSubmission.deleteMany({}),
        ]);
        console.log('🧹 Đã dọn sạch database cũ');

        // ── 1. USERS ───────────────────────────────────────────────────────
        const hashedPw = await bcrypt.hash('Password@123', SALT_ROUNDS);
        const users = await User.insertMany([
            {
                email: 'admin@oplw.com', password: hashedPw,
                fullName: 'Admin OPLW', role: 'admin',
                avatar: IMAGES.avatars[0], isActive: true,
                bio: 'Quản trị viên hệ thống OPLW.',
            },
            {
                email: 'instructor@oplw.com', password: hashedPw,
                fullName: 'Nguyễn Thị Minh Anh', role: 'instructor',
                avatar: IMAGES.avatars[1], isActive: true,
                bio: 'Giảng viên lập trình web và mobile.',
                instructorHeadline: 'Senior Software Engineer – 10+ years experience',
                instructorBio: 'Chuyên gia React Native và Node.js. Đã đào tạo hơn 5000 học viên.',
                instructorSkills: ['React Native', 'Node.js', 'MongoDB', 'TypeScript'],
            },
            {
                email: 'instructor2@oplw.com', password: hashedPw,
                fullName: 'Trần Văn Minh', role: 'instructor',
                avatar: IMAGES.avatars[2], isActive: true,
                bio: 'Chuyên gia Python và AI/ML.',
                instructorHeadline: 'AI Engineer & Data Scientist',
                instructorBio: 'Nghiên cứu sinh tiến sĩ AI tại HUST. Tác giả 3 bài báo quốc tế về Machine Learning.',
                instructorSkills: ['Python', 'TensorFlow', 'Data Science', 'SQL'],
            },
            {
                email: 'learner@oplw.com', password: hashedPw,
                fullName: 'Lê Hoàng Nam', role: 'learner',
                avatar: IMAGES.avatars[3], isActive: true,
                bio: 'Sinh viên CNTT, đam mê lập trình web.',
            },
            {
                email: 'learner2@oplw.com', password: hashedPw,
                fullName: 'Phạm Thị Thu Hà', role: 'learner',
                avatar: IMAGES.avatars[4], isActive: true,
                bio: 'Kỹ sư chuyển ngành, đang học thêm về Data Science.',
            },
            {
                email: 'learner3@oplw.com', password: hashedPw,
                fullName: 'Võ Quốc Bảo', role: 'learner',
                avatar: IMAGES.avatars[5], isActive: false, // inactive user
                bio: 'Tài khoản bị vô hiệu hóa để test.',
            },
        ]);
        const [admin, instr1, instr2, learner1, learner2, learner3] = users;
        console.log('👤 Tạo', users.length, 'users (admin, 2 instructors, 3 learners)');

        // ── 2. CATEGORIES ──────────────────────────────────────────────────
        const categories = await Category.insertMany([
            { name: 'Lập trình Web', description: 'HTML, CSS, JavaScript, React, Node.js', slug: 'lap-trinh-web' },
            { name: 'Mobile Development', description: 'React Native, Flutter, iOS, Android', slug: 'mobile-dev' },
            { name: 'Python & AI', description: 'Python cơ bản, Machine Learning, Deep Learning', slug: 'python-ai' },
            { name: 'Database & DevOps', description: 'SQL, MongoDB, Docker, CI/CD', slug: 'database-devops' },
            { name: 'Kỹ năng mềm', description: 'Giao tiếp, quản lý thời gian, tư duy phản biện', slug: 'ky-nang-mem' },
        ]);
        console.log('📂 Tạo', categories.length, 'categories');

        // ── 3. COURSES (đủ trạng thái) ─────────────────────────────────────
        const courses = await Course.insertMany([
            {
                title: 'React Native từ A-Z',
                description: 'Xây dựng ứng dụng mobile cross-platform với React Native. Học từ cơ bản đến nâng cao với dự án thực tế.',
                syllabus: '## Chương trình\n1. React Native Basics\n2. Navigation\n3. State Management\n4. API Integration\n5. Publish App',
                instructorId: instr1._id, categoryId: categories[1]._id,
                level: 'beginner', status: 'active', price: 0,
                estimatedCompletionHours: 25, thumbnail: IMAGES.courses[0],
                enrollmentCount: 3200, averageRating: 4.8, totalLessons: 5,
            },
            {
                title: 'Node.js & Express API nâng cao',
                description: 'REST API chuyên nghiệp với Node.js, Express, MongoDB. JWT auth, file upload, email, payment.',
                syllabus: '## Nội dung\n- RESTful Design\n- JWT & OAuth\n- MongoDB Advanced\n- VNPay Integration',
                instructorId: instr1._id, categoryId: categories[0]._id,
                level: 'intermediate', status: 'active', price: 299000,
                estimatedCompletionHours: 35, thumbnail: IMAGES.courses[1],
                enrollmentCount: 1540, averageRating: 4.7, totalLessons: 5,
            },
            {
                title: 'Python Machine Learning cơ bản',
                description: 'Nhập môn Machine Learning với Python, Scikit-learn, Pandas, Matplotlib.',
                instructorId: instr2._id, categoryId: categories[2]._id,
                level: 'beginner', status: 'active', price: 199000,
                estimatedCompletionHours: 30, thumbnail: IMAGES.courses[2],
                enrollmentCount: 870, averageRating: 4.6, totalLessons: 5,
            },
            {
                title: 'Docker & Kubernetes cho Dev',
                description: 'Container hóa ứng dụng, deploy lên K8s, CI/CD với GitHub Actions.',
                instructorId: instr2._id, categoryId: categories[3]._id,
                level: 'advanced', status: 'active', price: 399000,
                estimatedCompletionHours: 40, thumbnail: IMAGES.courses[3],
                enrollmentCount: 420, averageRating: 4.9, totalLessons: 5,
            },
            {
                title: 'TypeScript Full Course',
                description: 'Nắm vững TypeScript từ types cơ bản đến generic, decorators, utility types.',
                instructorId: instr1._id, categoryId: categories[0]._id,
                level: 'intermediate', status: 'pending', price: 149000,
                estimatedCompletionHours: 20, thumbnail: IMAGES.courses[4],
                enrollmentCount: 0, averageRating: 0, totalLessons: 0,
            },
            {
                title: 'Deep Learning với TensorFlow',
                description: 'CNN, RNN, Transformer với TensorFlow và Keras. Dự án thực tế: nhận dạng ảnh.',
                instructorId: instr2._id, categoryId: categories[2]._id,
                level: 'advanced', status: 'draft', price: 499000,
                estimatedCompletionHours: 50, thumbnail: IMAGES.courses[5],
                enrollmentCount: 0, averageRating: 0, totalLessons: 0,
            },
        ]);
        console.log('📚 Tạo', courses.length, 'courses (4 active, 1 pending, 1 draft)');

        const [courseRN, courseNode, coursePy, courseDocker] = courses;

        // ── 4. LESSONS ─────────────────────────────────────────────────────
        const lessonDefs = [
            // React Native (courseRN)
            [
                { title: 'Giới thiệu React Native & Setup môi trường', type: 'video', duration: 900, isPreview: true },
                { title: 'Components cơ bản: View, Text, Image', type: 'video', duration: 1200 },
                { title: 'Navigation với React Navigation', type: 'video', duration: 1500 },
                { title: 'Quản lý State với Redux Toolkit', type: 'video', duration: 1800 },
                { title: 'Kết nối API và xử lý dữ liệu', type: 'video', duration: 1350 },
            ],
            // Node.js (courseNode)
            [
                { title: 'RESTful API Design Patterns', type: 'video', duration: 900, isPreview: true },
                { title: 'JWT Authentication & Authorization', type: 'video', duration: 1500 },
                { title: 'MongoDB Aggregation Pipeline', type: 'video', duration: 1200 },
                { title: 'File Upload với Multer', type: 'video', duration: 900 },
                { title: 'Tích hợp VNPay Payment Gateway', type: 'video', duration: 1800 },
            ],
            // Python ML (coursePy)
            [
                { title: 'Python cho Data Science', type: 'video', duration: 1200, isPreview: true },
                { title: 'Data Cleaning với Pandas', type: 'video', duration: 1500 },
                { title: 'Trực quan hóa dữ liệu với Matplotlib', type: 'video', duration: 1200 },
                { title: 'Thuật toán Classification', type: 'video', duration: 1800 },
                { title: 'Model Evaluation & Tuning', type: 'video', duration: 1350 },
            ],
            // Docker (courseDocker)
            [
                { title: 'Docker cơ bản: Image, Container, Volume', type: 'video', duration: 1200, isPreview: true },
                { title: 'Docker Compose cho Multi-container', type: 'video', duration: 1500 },
                { title: 'Kubernetes: Pod, Service, Deployment', type: 'video', duration: 1800 },
                { title: 'GitHub Actions CI/CD Pipeline', type: 'video', duration: 1500 },
                { title: 'Deploy lên Google Cloud / AWS', type: 'video', duration: 1800 },
            ],
        ];

        const allLessons = [];
        const lessonsByCourse = [];

        for (let i = 0; i < 4; i++) {
            const course = courses[i];
            const defs = lessonDefs[i];
            const courseLessons = [];
            for (let j = 0; j < defs.length; j++) {
                courseLessons.push({
                    courseId: course._id,
                    title: defs[j].title,
                    type: defs[j].type || 'video',
                    duration: defs[j].duration || 600,
                    order: j + 1,
                    isPreview: defs[j].isPreview || false,
                    content: `Nội dung chi tiết bài "${defs[j].title}". Học viên sẽ nắm được các khái niệm cốt lõi và thực hành qua bài tập.`,
                    resources: `## Tài liệu tham khảo\n- [Official Docs](https://docs.example.com)\n- [GitHub Repo](https://github.com/example)`,
                });
            }
            const inserted = await Lesson.insertMany(courseLessons);
            lessonsByCourse.push(inserted);
            allLessons.push(...inserted);
        }
        console.log('🎥 Tạo', allLessons.length, 'lessons (5 per active course)');

        // ── 5. QUIZZES ─────────────────────────────────────────────────────
        // Quiz cho lesson cuối mỗi khóa
        const quiz1 = await Quiz.create({
            lessonId: lessonsByCourse[0][4]._id,
            title: 'Quiz: Kết nối API trong React Native',
            passingScore: 70,
            timeLimit: 600,
            questions: [
                {
                    questionText: 'Hook nào dùng để gọi API khi component mount?',
                    type: 'multiple-choice',
                    options: ['useState', 'useEffect', 'useCallback', 'useMemo'],
                    correctAnswer: 1,
                    explanation: 'useEffect với dependency array rỗng [] chạy sau khi component mount.',
                    points: 1,
                },
                {
                    questionText: 'Fetch API trong React Native có sẵn không?',
                    type: 'true-false',
                    options: ['True', 'False'],
                    correctAnswer: 0,
                    explanation: 'React Native hỗ trợ Fetch API mà không cần cài thêm package.',
                    points: 1,
                },
                {
                    questionText: 'Axios được cài đặt bằng lệnh nào?',
                    type: 'multiple-choice',
                    options: ['npm install axios', 'npm add axios', 'expo install axios', 'yarn add axios'],
                    correctAnswer: 0,
                    explanation: 'npm install axios là lệnh chuẩn.',
                    points: 2,
                },
                {
                    questionText: 'async/await là gì?',
                    type: 'multiple-choice',
                    options: ['CSS property', 'Cú pháp xử lý bất đồng bộ', 'Framework JS', 'Database query'],
                    correctAnswer: 1,
                    explanation: 'async/await là cú pháp sugar cho Promise.',
                    points: 1,
                },
            ],
        });

        const quiz2 = await Quiz.create({
            lessonId: lessonsByCourse[1][2]._id,
            title: 'Quiz: MongoDB Aggregation',
            passingScore: 80,
            timeLimit: 900,
            questions: [
                {
                    questionText: 'Stage nào dùng để lọc documents trong Aggregation?',
                    type: 'multiple-choice',
                    options: ['$project', '$match', '$group', '$sort'],
                    correctAnswer: 1,
                    explanation: '$match tương đương với find() filter.',
                    points: 1,
                },
                {
                    questionText: 'Aggregation pipeline thực thi các stages theo thứ tự.',
                    type: 'true-false',
                    options: ['True', 'False'],
                    correctAnswer: 0,
                    explanation: 'Đúng, các stage xử lý tuần tự từ trên xuống.',
                    points: 1,
                },
                {
                    questionText: '$lookup dùng để làm gì?',
                    type: 'multiple-choice',
                    options: ['Tạo index', 'Join collection', 'Tính trung bình', 'Xóa document'],
                    correctAnswer: 1,
                    explanation: '$lookup thực hiện left outer join với collection khác.',
                    points: 2,
                },
            ],
        });

        const quiz3 = await Quiz.create({
            lessonId: lessonsByCourse[2][3]._id,
            title: 'Quiz: Classification Algorithms',
            passingScore: 75,
            timeLimit: 720,
            questions: [
                {
                    questionText: 'Decision Tree thuộc loại algorithm nào?',
                    type: 'multiple-choice',
                    options: ['Unsupervised', 'Supervised', 'Reinforcement', 'Semi-supervised'],
                    correctAnswer: 1,
                    explanation: 'Decision Tree là supervised learning algorithm.',
                    points: 1,
                },
                {
                    questionText: 'Overfitting xảy ra khi model quá khớp với training data.',
                    type: 'true-false',
                    options: ['True', 'False'],
                    correctAnswer: 0,
                    explanation: 'Đúng, overfitting làm model kém khi gặp data mới.',
                    points: 1,
                },
            ],
        });
        console.log('📝 Tạo 3 quizzes');

        // ── 6. ENROLLMENTS (đủ trạng thái) ────────────────────────────────
        const enrollments = [];

        // learner1: active enrollments
        const enr1 = await Enrollment.create({ userId: learner1._id, courseId: courseRN._id, status: 'active' });
        const enr2 = await Enrollment.create({ userId: learner1._id, courseId: courseNode._id, status: 'active' });
        const enr3 = await Enrollment.create({ userId: learner1._id, courseId: coursePy._id, status: 'completed' });
        enrollments.push(enr1, enr2, enr3);

        // learner2: mixed statuses
        const enr4 = await Enrollment.create({ userId: learner2._id, courseId: courseRN._id, status: 'active' });
        const enr5 = await Enrollment.create({ userId: learner2._id, courseId: courseDocker._id, status: 'pending' });
        const enr6 = await Enrollment.create({ userId: learner2._id, courseId: coursePy._id, status: 'cancelled' });
        enrollments.push(enr4, enr5, enr6);

        // learner3: inactive user – có 1 enrollment
        const enr7 = await Enrollment.create({ userId: learner3._id, courseId: courseRN._id, status: 'cancelled' });
        enrollments.push(enr7);

        console.log('📋 Tạo', enrollments.length, 'enrollments (active, completed, pending, cancelled)');

        // ── 7. PROGRESS ───────────────────────────────────────────────────
        // learner1 đang học React Native: bài 1-3 xong, bài 4 đang học
        const rnLessons = lessonsByCourse[0];
        await Progress.create({ userId: learner1._id, courseId: courseRN._id, lessonId: rnLessons[0]._id, isCompleted: true, timeSpent: 900, completedAt: new Date('2026-03-10') });
        await Progress.create({ userId: learner1._id, courseId: courseRN._id, lessonId: rnLessons[1]._id, isCompleted: true, timeSpent: 1200, completedAt: new Date('2026-03-11') });
        await Progress.create({ userId: learner1._id, courseId: courseRN._id, lessonId: rnLessons[2]._id, isCompleted: true, timeSpent: 1500, completedAt: new Date('2026-03-12') });
        await Progress.create({ userId: learner1._id, courseId: courseRN._id, lessonId: rnLessons[3]._id, isCompleted: false, timeSpent: 600, lastPosition: 600 });

        // learner1 đang học Node.js: bài 1 xong
        const nodeLessons = lessonsByCourse[1];
        await Progress.create({ userId: learner1._id, courseId: courseNode._id, lessonId: nodeLessons[0]._id, isCompleted: true, timeSpent: 900, completedAt: new Date('2026-03-14') });

        // learner1 hoàn thành Python (completed enrollment)
        const pyLessons = lessonsByCourse[2];
        for (let i = 0; i < pyLessons.length; i++) {
            await Progress.create({
                userId: learner1._id, courseId: coursePy._id,
                lessonId: pyLessons[i]._id, isCompleted: true,
                timeSpent: pyLessons[i].duration, completedAt: new Date(2026, 2, i + 1),
            });
        }

        // learner2 đang học React Native: chỉ bài 1
        await Progress.create({ userId: learner2._id, courseId: courseRN._id, lessonId: rnLessons[0]._id, isCompleted: true, timeSpent: 900, completedAt: new Date('2026-03-15') });

        console.log('📊 Tạo progress records (learner1: RN 3/5, Node 1/5, Python 5/5; learner2: RN 1/5)');

        // ── 8. QUIZ ATTEMPTS (đủ trạng thái) ──────────────────────────────
        // learner1 - quiz1: đã pass
        await QuizAttempt.create({
            userId: learner1._id, quizId: quiz1._id,
            answers: [1, 0, 0, 1],
            score: 85, isPassed: true,
            startedAt: new Date('2026-03-12T09:00:00'), submittedAt: new Date('2026-03-12T09:08:00'), timeSpent: 480,
        });
        // learner1 - quiz2: fail
        await QuizAttempt.create({
            userId: learner1._id, quizId: quiz2._id,
            answers: [0, 0, 1],
            score: 50, isPassed: false,
            startedAt: new Date('2026-03-14T10:00:00'), submittedAt: new Date('2026-03-14T10:12:00'), timeSpent: 720,
        });
        // learner2 - quiz1: fail lần 1
        await QuizAttempt.create({
            userId: learner2._id, quizId: quiz1._id,
            answers: [0, 1, 2, 0],
            score: 40, isPassed: false,
            startedAt: new Date('2026-03-15T14:00:00'), submittedAt: new Date('2026-03-15T14:07:00'), timeSpent: 420,
        });
        // learner2 - quiz1: pass lần 2
        await QuizAttempt.create({
            userId: learner2._id, quizId: quiz1._id,
            answers: [1, 0, 0, 1],
            score: 90, isPassed: true,
            startedAt: new Date('2026-03-16T09:00:00'), submittedAt: new Date('2026-03-16T09:05:00'), timeSpent: 300,
        });
        // learner1 - quiz3: pass (Python)
        await QuizAttempt.create({
            userId: learner1._id, quizId: quiz3._id,
            answers: [1, 0],
            score: 100, isPassed: true,
            startedAt: new Date('2026-03-08T11:00:00'), submittedAt: new Date('2026-03-08T11:06:00'), timeSpent: 360,
        });
        console.log('🧪 Tạo 5 quiz attempts (pass, fail, retry pass)');

        // ── 9. REVIEWS ─────────────────────────────────────────────────────
        await Review.insertMany([
            { userId: learner1._id, courseId: courseRN._id, rating: 5, reviewText: 'Khóa học rất chất lượng! Thầy giải thích rõ ràng, dự án thực tế.' },
            { userId: learner2._id, courseId: courseRN._id, rating: 4, reviewText: 'Nội dung tốt, muốn có thêm bài tập thực hành.' },
            { userId: learner1._id, courseId: coursePy._id, rating: 5, reviewText: 'Học xong có thể tự xây dựng mô hình ML cơ bản. Tuyệt vời!' },
            { userId: learner1._id, courseId: courseNode._id, rating: 4, reviewText: 'API design rất professional, phần VNPay hữu ích thực tế.' },
        ]);
        console.log('⭐ Tạo 4 reviews');

        // ── 10. PAYMENTS (đủ trạng thái) ──────────────────────────────────
        await Payment.insertMany([
            {
                userId: learner1._id, courseId: courseNode._id, enrollmentId: enr2._id,
                orderId: `OPLW-20260310-001`, amount: 299000,
                orderInfo: 'Thanh toán khóa Node.js & Express API nâng cao',
                transactionNo: 'VNP14892001', bankCode: 'NCB', cardType: 'ATM',
                paymentStatus: 'success',
                vnpayData: { vnp_ResponseCode: '00', vnp_TransDate: '20260310120000' },
            },
            {
                userId: learner2._id, courseId: courseDocker._id, enrollmentId: enr5._id,
                orderId: `OPLW-20260315-002`, amount: 399000,
                orderInfo: 'Thanh toán khóa Docker & Kubernetes',
                paymentStatus: 'pending',
            },
            {
                userId: learner2._id, courseId: coursePy._id, enrollmentId: enr6._id,
                orderId: `OPLW-20260312-003`, amount: 199000,
                orderInfo: 'Thanh toán khóa Python ML',
                paymentStatus: 'failed',
                vnpayData: { vnp_ResponseCode: '24', vnp_TransDate: '20260312080000' },
            },
            {
                userId: learner3._id, courseId: courseRN._id, enrollmentId: enr7._id,
                orderId: `OPLW-20260301-004`, amount: 0,
                orderInfo: 'Đăng ký khóa React Native (miễn phí)',
                paymentStatus: 'cancelled',
            },
        ]);
        console.log('💳 Tạo 4 payments (success, pending, failed, cancelled)');

        // ── 11. ASSIGNMENTS ────────────────────────────────────────────────
        const assign1 = await Assignment.create({
            courseId: courseRN._id, lessonId: lessonsByCourse[0][2]._id,
            title: 'Bài tập: Xây dựng màn hình Navigation',
            description: 'Tạo app React Native với 3 màn hình: Home, Profile, Settings. Sử dụng Stack và Tab Navigator.',
            maxScore: 100,
            dueDate: new Date('2026-04-01'),
            type: 'regular',
        });

        const assign2 = await Assignment.create({
            courseId: courseNode._id,
            title: 'Final Exam: Node.js & Express',
            description: 'Bài thi cuối khóa trắc nghiệm 30 phút.',
            maxScore: 100, type: 'exam',
            timeLimitMinutes: 30, passingScorePercent: 70,
            questions: [
                { questionText: 'Middleware trong Express là gì?', options: ['Hàm xử lý request/response', 'Database model', 'CSS framework', 'Routing library'], correctIndex: 0, points: 2 },
                { questionText: 'JWT viết tắt của?', options: ['Java Web Token', 'JSON Web Token', 'JavaScript Web Type', 'JSON Widget Tool'], correctIndex: 1, points: 2 },
                { questionText: 'Method HTTP nào dùng để xóa?', options: ['PUT', 'PATCH', 'DELETE', 'GET'], correctIndex: 2, points: 2 },
            ],
        });

        const assign3 = await Assignment.create({
            courseId: coursePy._id, lessonId: pyLessons[3]._id,
            title: 'Dự án: Xây dựng mô hình phân loại Email Spam',
            description: 'Sử dụng dataset SMS Spam Collection để train Naive Bayes classifier. Đạt accuracy >= 95%.',
            maxScore: 100,
            dueDate: new Date('2026-03-20'),
            type: 'regular',
        });
        console.log('📄 Tạo 3 assignments (2 regular, 1 exam)');

        // ── 12. ASSIGNMENT SUBMISSIONS (đủ trạng thái) ────────────────────
        await AssignmentSubmission.insertMany([
            {
                assignmentId: assign1._id, userId: learner1._id,
                content: 'GitHub: https://github.com/learner1/rn-navigation-demo\n\nApp có đủ 3 màn hình với Stack và Tab Navigator. Đã test trên Android.',
                status: 'graded', score: 92,
                feedback: 'Làm tốt! Code sạch, có thể cải thiện phần animation transition.',
                gradedAt: new Date('2026-03-13'), gradedBy: instr1._id,
            },
            {
                assignmentId: assign1._id, userId: learner2._id,
                content: 'https://github.com/learner2/nav-assignment',
                status: 'needs_revision',
                feedback: 'Thiếu Settings screen, cần bổ sung và nộp lại.',
                gradedAt: new Date('2026-03-14'), gradedBy: instr1._id,
            },
            {
                assignmentId: assign3._id, userId: learner1._id,
                content: 'Notebook: https://colab.research.google.com/drive/xxx\nAccuracy: 97.3%',
                status: 'submitted',
            },
        ]);
        console.log('📮 Tạo 3 assignment submissions (graded, needs_revision, submitted)');

        // ── 13. DISCUSSIONS ────────────────────────────────────────────────
        const post1 = await Discussion.create({
            courseId: courseRN._id, userId: learner1._id,
            lessonId: lessonsByCourse[0][2]._id,
            title: 'Hỏi về React Navigation v7 Stack vs Tab',
            content: 'Thầy ơi, khi nào nên dùng Stack Navigator, khi nào dùng Tab Navigator? Có thể mix 2 loại không ạ?',
            isPinned: false, likesCount: 5, repliesCount: 2,
        });

        const reply1 = await Discussion.create({
            courseId: courseRN._id, userId: instr1._id,
            parentId: post1._id,
            content: 'Chào em! Stack Navigator dùng cho flow dạng tuyến tính (A → B → C). Tab Navigator dùng khi cần chuyển nhanh giữa các section chính. Mix hoàn toàn được, thực tế hầu hết app đều mix.',
            likesCount: 8,
        });

        const reply2 = await Discussion.create({
            courseId: courseRN._id, userId: learner2._id,
            parentId: post1._id,
            content: 'Mình hiểu ra rồi, cảm ơn thầy và bạn! Drawer Navigator cũng mix được vào nữa nè.',
            likesCount: 2,
        });

        const post2 = await Discussion.create({
            courseId: courseRN._id, userId: instr1._id,
            lessonId: lessonsByCourse[0][0]._id,
            title: '📌 Hướng dẫn setup môi trường cho Windows/Mac',
            content: 'Các em cài đặt theo hướng dẫn trong file README. Nếu gặp lỗi Metro bundler, thử xóa node_modules và chạy lại npm install.',
            isPinned: true, likesCount: 15, repliesCount: 0,
        });

        const post3 = await Discussion.create({
            courseId: courseNode._id, userId: learner1._id,
            title: 'Lỗi CORS khi call API từ React app',
            content: "Bị lỗi CORS khi gọi API từ localhost:5173 sang localhost:3000. Đã thêm cors() middleware nhưng vẫn lỗi với preflight request.",
            likesCount: 3, repliesCount: 1,
        });

        const reply3 = await Discussion.create({
            courseId: courseNode._id, userId: instr1._id,
            parentId: post3._id,
            content: 'Em cần config cors với options: `{ origin: "http://localhost:5173", credentials: true }`. Thêm vào trước tất cả routes nhé.',
            likesCount: 6,
        });

        // Post ẩn (bị mod)
        await Discussion.create({
            courseId: courseRN._id, userId: learner3._id,
            title: 'Post vi phạm nội quy',
            content: 'Nội dung spam bị ẩn.',
            status: 'hidden',
        });

        console.log('💬 Tạo discussions (3 posts, 3 replies, 1 hidden)');

        // ── 14. CERTIFICATE ────────────────────────────────────────────────
        // learner1 hoàn thành Python → có certificate
        const certId = `OPLW-CERT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        await Certificate.create({
            userId: learner1._id, courseId: coursePy._id,
            certificateId: certId,
            issuedAt: new Date('2026-03-09'),
            verificationUrl: `https://oplw.com/verify/${certId}`,
        });
        console.log('🏆 Tạo 1 certificate cho learner1 (Python ML)');

        // ── 15. SESSIONS ──────────────────────────────────────────────────
        const now = new Date();
        const in30m = new Date(now.getTime() + 30 * 60 * 1000);
        const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const past = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago (expired)

        await Session.insertMany([
            {
                userId: learner1._id,
                token: `eyJhbGciOiJIUzI1NiJ9.learner1.active_session_${Date.now()}`,
                expiresAt: in30m, // active session
            },
            {
                userId: instr1._id,
                token: `eyJhbGciOiJIUzI1NiJ9.instr1.active_session_${Date.now() + 1}`,
                expiresAt: in30m,
            },
            // Expired session (để test)
            {
                userId: learner2._id,
                token: `eyJhbGciOiJIUzI1NiJ9.learner2.expired_${Date.now() + 2}`,
                expiresAt: past,
            },
        ]);
        console.log('🔐 Tạo 3 sessions (2 active, 1 expired)');

        // ── SUMMARY ────────────────────────────────────────────────────────
        console.log('\n✅ ═══════════════════════════════════════════════');
        console.log('   OPLW Full Seed hoàn tất!');
        console.log('═══════════════════════════════════════════════\n');
        console.log('📧 Tài khoản đăng nhập (Password: Password@123)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  Admin      : admin@oplw.com');
        console.log('  Instructor1: instructor@oplw.com  (2 active courses)');
        console.log('  Instructor2: instructor2@oplw.com (2 courses: 1 active, 1 draft)');
        console.log('  Learner1   : learner@oplw.com     (3 enrollments, has certificate)');
        console.log('  Learner2   : learner2@oplw.com    (3 enrollments mixed statuses)');
        console.log('  Learner3   : learner3@oplw.com    (inactive account)');
        console.log('');
        console.log('📊 Trạng thái để test:');
        console.log('  Enrollments : active, completed, pending, cancelled');
        console.log('  Payments    : success, pending, failed, cancelled');
        console.log('  Quiz Attempts: pass, fail, retry→pass');
        console.log('  Assignments : graded, needs_revision, submitted');
        console.log('  Discussions : visible, hidden (moderated), pinned');
        console.log('  Sessions    : active (2), expired (1)');
        console.log('  Courses     : active(4), pending(1), draft(1)');
        console.log('  Progress    : learner1: RN 60%, Node 20%, Python 100% ✓');

    } catch (err) {
        console.error('\n❌ Seed lỗi:', err.message);
        if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
        process.exit(1);
    } finally {
        if (mongoose.connection.readyState === 1) await mongoose.connection.close();
    }
}

run().then(() => process.exit(0)).catch(() => process.exit(1));
