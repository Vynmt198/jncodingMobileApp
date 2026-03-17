// Auth routes
export const AUTH_ROUTES = {
  ONBOARDING: 'Onboarding',
  LOGIN: 'Login',
  REGISTER: 'Register',
  REGISTER_SUCCESS: 'RegisterSuccess',
  FORGOT_PASSWORD: 'ForgotPassword',
  OTP_VERIFICATION: 'OTPVerification',
  NEW_PASSWORD: 'NewPassword',
} as const;

// App routes (main app)
export const APP_ROUTES = {
  HOME: 'Home',
  SEARCH: 'Search',
  MY_COURSES: 'MyCourses',
  PROFILE: 'Profile',
  ADMIN_DASHBOARD: 'AdminDashboard',
  ADMIN_USER_MANAGEMENT: 'AdminUserManagement',
  ADMIN_COURSE_APPROVAL: 'AdminCourseApproval',
  ADMIN_LESSONS: 'AdminLessons',
  ADMIN_REVIEWS: 'AdminReviews',
  INSTRUCTOR_DASHBOARD: 'InstructorDashboard',
  INSTRUCTOR_ANALYTICS: 'InstructorAnalytics',
  INSTRUCTOR_DISCUSSIONS: 'InstructorDiscussions',
  INSTRUCTOR_CREATE_COURSE: 'InstructorCreateCourse',
} as const;

// Course routes
export const COURSE_ROUTES = {
  COURSE_LISTING: 'CourseListings',
  COURSE_DETAIL: 'CourseDetail',
  CATEGORY: 'Category',
  COURSE_PLAYER: 'CoursePlayer',
} as const;

// Enrollment & Payment routes
export const ENROLL_ROUTES = {
  PAYMENT: 'Payment',
  PAYMENT_SUCCESS: 'PaymentSuccess',
  PAYMENT_HISTORY: 'PaymentHistory',
} as const;

// Quiz routes
export const QUIZ_ROUTES = {
  QUIZ_START: 'QuizStart',
  QUIZ_QUESTION: 'QuizQuestion',
  QUIZ_RESULT: 'QuizResult',
} as const;

// All routes combined
export const ROUTES = {
  ...AUTH_ROUTES,
  ...APP_ROUTES,
  ...COURSE_ROUTES,
  ...ENROLL_ROUTES,
  ...QUIZ_ROUTES,
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RouteName = (typeof ROUTES)[RouteKey];
