/**
 * API endpoints — aligned with backend be_webhoclaptrinh (Node/Express).
 * @see docs/BACKEND_API_REFERENCE.md
 */
export const API_ENDPOINTS = {
  // Auth (single JWT, no refresh token)
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // User profile (use GET /users/profile for "me")
  USER: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
    PUBLIC_PROFILE: (id: string) => `/users/${id}/public-profile`,
  },

  // Categories
  CATEGORIES: {
    LIST: '/categories',
  },

  // Courses
  COURSES: {
    LIST: '/courses',
    SEARCH: '/courses/search',
    AUTOCOMPLETE: '/courses/autocomplete',
    DETAIL: (id: string) => `/courses/${id}`,
    CURRICULUM: (id: string) => `/courses/${id}/curriculum`,
    REVIEWS: (id: string) => `/courses/${id}/reviews`,
    RATING_SUMMARY: (id: string) => `/courses/${id}/rating-summary`,
    LEARN: (id: string) => `/courses/${id}/learn`,
    ASSIGNMENTS: (id: string) => `/courses/${id}/assignments`,
    MY_ASSIGNMENT_SUBMISSIONS: (id: string) => `/courses/${id}/my-assignment-submissions`,
    LESSONS: (id: string) => `/courses/${id}/lessons`,
  },

  // Assignments (learner: get one, submit; instructor: submissions, grade)
  ASSIGNMENTS: {
    GET_ONE: (id: string) => `/assignments/${id}`,
    SUBMIT: (id: string) => `/assignments/${id}/submit`,
    SUBMIT_EXAM: (id: string) => `/assignments/${id}/submit-exam`,
  },

  // Lessons
  LESSONS: {
    BY_ID: (id: string) => `/lessons/by-id/${id}`,
    CONTENT: (id: string) => `/lessons/${id}/content`,
    UPDATE: (id: string) => `/lessons/${id}`,
    DELETE: (id: string) => `/lessons/${id}`,
    REORDER: '/lessons/reorder',
  },

  // Progress
  PROGRESS: {
    MARK_COMPLETE: '/progress/mark-complete',
    UPDATE_POSITION: '/progress/update-position',
    BY_COURSE: (courseId: string) => `/progress/${courseId}`,
  },

  // Enrollments (POST for free course, GET my list)
  ENROLLMENTS: {
    MY: '/enrollments',
    ENROLL_FREE: '/enrollments',

  },

  // Payments (VNPay)
  PAYMENTS: {
    CREATE: '/payments/create',
    VNPAY_RETURN_API: '/payments/vnpay-return-api',
    HISTORY: '/payments/history',
    DETAIL: (orderId: string) => `/payments/${orderId}`,
  },

  // Reviews
  REVIEWS: {
    MY_REVIEW: (courseId: string) => `/reviews/my-review/${courseId}`,
    LIST: '/reviews',
    BY_ID: (id: string) => `/reviews/${id}`,
  },

  // Quizzes
  QUIZZES: {
    GET: (id: string) => `/quizzes/${id}`,
    ATTEMPT: (id: string) => `/quizzes/${id}/attempt`,
    RESULTS: (id: string) => `/quizzes/${id}/results`,
  },

  // Certificates
  CERTIFICATES: {
    MY: '/certificates/my-certificates',
    GENERATE: '/certificates/generate',
    DOWNLOAD: (id: string) => `/certificates/${id}/download`,
    VERIFY: (certId: string) => `/certificates/verify/${certId}`,
  },

  // Discussions
  DISCUSSIONS: {
    LIST: (courseId: string) => `/discussions/${courseId}`,
    REPLIES: (courseId: string, postId: string) => `/discussions/${courseId}/${postId}/replies`,
    CREATE: '/discussions',
    REPLY: (postId: string) => `/discussions/${postId}/reply`,
    LIKE: (postId: string) => `/discussions/${postId}/like`,
    UNLIKE: (postId: string) => `/discussions/${postId}/unlike`,
    PIN: (postId: string) => `/discussions/${postId}/pin`,
    DELETE: (id: string) => `/discussions/${id}`,
    REPORT: (id: string) => `/discussions/${id}/report`,
  },

  // Instructor dashboards & analytics
  INSTRUCTOR: {
    DASHBOARD: '/instructor/dashboard',
    ANALYTICS: '/instructor/analytics',
    DISCUSSION_SUMMARY: '/instructor/discussions/summary',
    MY_COURSES: '/instructor/courses',
    CREATE_COURSE: '/instructor/courses',
  },

  // Upload
  UPLOAD: {
    THUMBNAIL: '/upload/thumbnail',
  },

  // Health
  HEALTH: '/health',
} as const;
