/**
 * API types — aligned with backend be_webhoclaptrinh responses.
 * @see docs/BACKEND_API_REFERENCE.md + Websitehoclaptrinhjncoding/src/app/lib/api.ts
 */

// Common API response wrappers (backend uses success + data/message)
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

// Backend returns _id (Mongo); we normalize to id in app or use _id in types
export interface User {
  _id: string;
  id?: string; // optional alias
  email: string;
  fullName: string;
  role: 'learner' | 'instructor' | 'admin';
  isActive?: boolean;
  avatar?: string | null;
  bio?: string | null;
  createdAt?: string;
  lastLogin?: string;
  // Instructor profile
  instructorHeadline?: string | null;
  instructorBio?: string | null;
  instructorSkills?: string[];
  instructorWebsite?: string | null;
  instructorFacebook?: string | null;
  instructorYoutube?: string | null;
  instructorLinkedin?: string | null;
}

// Backend login returns single token (no refresh token)
export interface LoginResponse {
  success: boolean;
  message?: string;
  data: {
    token: string;
    user: User;
  };
}

// Register returns user only (no token)
export interface RegisterResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  /** Một số backend dùng field "name" thay vì fullName */
  name?: string;
}

// Profile response (GET /users/profile)
export interface ProfileResponse {
  success: boolean;
  data: { user: User };
}

// ─── Course & Learning (backend Mongoose) ───────────────────────────────────
export interface Lesson {
  _id: string;
  courseId: string;
  title: string;
  type: 'video' | 'text' | 'quiz';
  content?: string;
  resources?: string;
  videoUrl?: string;
  duration?: number;
  order: number;
  isPreview?: boolean;
  isHidden?: boolean;
  /** Chỉ có khi type === 'quiz' (từ GET learn) */
  quizId?: string;
}

export interface Progress {
  _id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  isCompleted: boolean;
  timeSpent?: number;
  lastPosition?: number;
  completedAt?: string | null;
}

export interface QuizQuestion {
  questionText: string;
  questionCode?: string;
  type: 'multiple-choice' | 'true-false' | 'coding';
  options?: string[];
  /** Backend ẩn correctAnswer/explanation khi trả đề cho learner */
  correctAnswer?: unknown;
  explanation?: string;
  points?: number;
}

export interface Quiz {
  _id: string;
  lessonId: string;
  title: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit: number;
}

export interface QuizAttemptRequest {
  answers: Array<{ questionIndex: number; answer: unknown }>;
  timeSpent?: number;
}

export interface QuizAttemptResponse {
  success: boolean;
  data: {
    attemptId: string;
    score: number;
    isPassed: boolean;
    timeSpent?: number;
  };
}

// Assignment (regular: nộp bài, exam: trắc nghiệm tự chấm)
export interface Assignment {
  _id: string;
  courseId: string;
  lessonId: string | null;
  title: string;
  description?: string;
  maxScore: number;
  dueDate: string | null;
  isActive: boolean;
  type?: 'regular' | 'exam';
  questions?: Array<{
    questionText: string;
    options: string[];
    correctIndex: number;
    points?: number;
  }>;
  timeLimitMinutes?: number | null;
  passingScorePercent?: number;
}

export interface AssignmentSubmission {
  _id: string;
  assignmentId: string;
  userId: string;
  content?: string;
  attachments?: string[];
  score: number | null;
  feedback: string | null;
  status: 'submitted' | 'graded' | 'needs_revision';
  gradedAt: string | null;
  gradedBy: string | null;
  createdAt?: string;
}

export interface Certificate {
  _id: string;
  userId: string;
  courseId: string;
  certificateId: string;
  issuedAt: string;
  pdfUrl?: string | null;
  verificationUrl?: string | null;
}

// GET /api/courses/:id/learn
export interface CourseLearningData {
  course: { _id: string; title: string; instructorId: string | null };
  lessons: Lesson[];
  progress: Progress[];
  completionPercentage: number;
}

// GET /api/courses/:id/assignments
export interface AssignmentsByCourseResponse {
  assignments: Assignment[];
  canSubmit: boolean;
}

// GET /api/assignments/:id
export interface AssignmentDetailResponse {
  assignment: Assignment;
  canSubmit: boolean;
  mySubmission: AssignmentSubmission | null;
}
