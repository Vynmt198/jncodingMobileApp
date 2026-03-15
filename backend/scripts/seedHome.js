const mongoose = require('mongoose');
const Category = require('../src/models/Category');
const Course = require('../src/models/Course');
const User = require('../src/models/User');
const Enrollment = require('../src/models/Enrollment');
// Hardcoded URI for script execution since dotenv path resolution can be tricky from nested dirs
const MONGODB_URI = 'mongodb://localhost:27017/oplw';

const seedHomeScreenData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('[Seed] Connected to MongoDB');

        // 1. Ensure instructor exists
        let instructor = await User.findOne({ email: 'instructor@oplw.com' });
        if (!instructor) {
            instructor = await User.create({
                fullName: 'Expert Instructor',
                email: 'instructor@oplw.com',
                password: 'Password@123',
                role: 'instructor'
            });
        }

        // 2. Ensure learner exists
        let learner = await User.findOne({ email: 'learner@oplw.com' });
        if (!learner) {
            learner = await User.create({
                fullName: 'Active Learner',
                email: 'learner@oplw.com',
                password: 'Password@123',
                role: 'learner'
            });
        }

        // 3. Create Categories (Horizontal Scroll)
        const categoriesData = [
            { name: 'Web Development', icon: 'code' },
            { name: 'Mobile Apps', icon: 'smartphone' },
            { name: 'Data Science', icon: 'bar-chart' },
            { name: 'Design', icon: 'pen-tool' },
            { name: 'Business', icon: 'briefcase' }
        ];

        const createdCategories = [];
        for (const cat of categoriesData) {
            const existing = await Category.findOne({ name: cat.name });
            if (!existing) {
                const newCat = await Category.create(cat);
                createdCategories.push(newCat);
            } else {
                createdCategories.push(existing);
            }
        }
        console.log('[Seed] Categories ensured');

        // 4. Create Featured Courses (Carousel) & Trending Courses
        const coursesData = [
            // Featured
            {
                title: 'Master React Native 2026',
                description: 'Complete guide to building mobile apps',
                instructorId: instructor._id,
                categoryId: createdCategories[1]._id,
                price: 49.99,
                thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c',
                status: 'active',
                averageRating: 4.9,
                enrollmentCount: 1500
            },
            {
                title: 'Advanced UI/UX Design',
                description: 'Design beautiful interfaces',
                instructorId: instructor._id,
                categoryId: createdCategories[3]._id,
                price: 29.99,
                thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5',
                status: 'active',
                averageRating: 4.8,
                enrollmentCount: 1200
            },
            // Trending
            {
                title: 'Python for Data Science',
                description: 'Data analysis and machine learning basics',
                instructorId: instructor._id,
                categoryId: createdCategories[2]._id,
                price: 0, // Free course
                thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bfce8',
                status: 'active',
                averageRating: 4.7,
                enrollmentCount: 3500 // High enrollment = trending
            },
            {
                title: 'Fullstack Web Bootcamp',
                description: 'From zero to hero in web dev',
                instructorId: instructor._id,
                categoryId: createdCategories[0]._id,
                price: 89.99,
                thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
                status: 'active',
                averageRating: 4.6,
                enrollmentCount: 2800
            }
        ];

        const createdCourses = [];
        for (const course of coursesData) {
            const existing = await Course.findOne({ title: course.title });
            if (!existing) {
                const newCourse = await Course.create(course);
                createdCourses.push(newCourse);
            } else {
                createdCourses.push(existing);
            }
        }
        console.log('[Seed] Courses ensured');

        // 5. Create Enrollments (Continue Learning Section)
        if (createdCourses.length > 0) {
            const activeCourseId = createdCourses[0]._id;
            const existingEnrollment = await Enrollment.findOne({ userId: learner._id, courseId: activeCourseId });
            
            if (!existingEnrollment) {
                await Enrollment.create({
                    userId: learner._id,
                    courseId: activeCourseId,
                    status: 'active'
                });
                console.log('[Seed] Enrollment added for Continue Learning');
            }
        }

        console.log('[Seed] Home Screen data seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('[Seed] Error:', error);
        process.exit(1);
    }
};

seedHomeScreenData();
