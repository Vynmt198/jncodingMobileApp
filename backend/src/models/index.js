/**
 * OPLW - Database Models Index
 * Tất cả models cần require từ đây để đảm bảo thứ tự load đúng
 */
const mongoose = require('mongoose');

const User = require('./User');
const Category = require('./Category');
const Course = require('./Course');
const Lesson = require('./Lesson');
const Enrollment = require('./Enrollment');
const Progress = require('./Progress');
const Payment = require('./Payment');
const Review = require('./Review');
const Quiz = require('./Quiz');
const QuizAttempt = require('./QuizAttempt');
const PasswordReset = require('./PasswordReset');
const Session = require('./Session');
const Discussion = require('./Discussion');
const Certificate = require('./Certificate');
const CourseBlock = require('./CourseBlock');
const Assignment = require('./Assignment');
const AssignmentSubmission = require('./AssignmentSubmission');

module.exports = {
    mongoose,
    User,
    Category,
    Course,
    Lesson,
    Enrollment,
    Progress,
    Payment,
    Review,
    Quiz,
    QuizAttempt,
    PasswordReset,
    Session,
    Discussion,
    Certificate,
    CourseBlock,
    Assignment,
    AssignmentSubmission,
};
