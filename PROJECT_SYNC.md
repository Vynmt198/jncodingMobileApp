# Đồng bộ Backend – Mobile App (OPLW)

Tài liệu này mô tả cấu trúc dự án sau khi copy backend vào thư mục `code` và cách hai phần (backend + mobile) đồng bộ data/API để phát triển tiếp.

---

## 1. Cấu trúc thư mục

```
code/
├── backend/          # API Node/Express (đã build từ website)
│   ├── src/
│   │   ├── app.js
│   │   ├── config/   # database, jwt, passport, swagger, vnpay
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── helpers/
│   ├── scripts/db/   # seed, reset, init-indexes
│   └── ANALYSIS_QUIZ_ASSIGNMENT_FLOW.md
│
├── mobileapp/        # Expo / React Native
│   ├── src/
│   │   ├── api/           # axiosInstance, endpoints
│   │   ├── store/api/     # authApi, coursesApi, progressApi, certificateApi, assignmentApi, quizzesApi
│   │   ├── types/         # api.types (User, Lesson, Progress, Quiz, Assignment, Certificate, ...)
│   │   ├── screens/
│   │   ├── navigation/
│   │   └── components/
│   └── docs/
│
└── PROJECT_SYNC.md   # File này
```

---

## 2. Stack công nghệ

| Phần | Công nghệ |
|------|-----------|
| **Backend** | Node.js, Express 5, MongoDB (Mongoose), JWT, Passport (Google OAuth), Swagger, VNPay, Nodemailer |
| **Mobile** | Expo ~54, React Native, TypeScript, Redux Toolkit + RTK Query, React Navigation, axios, expo-secure-store |

---

## 3. Base URL & Env

- **Backend:** chạy mặc định `PORT=3000`, CORS `CLIENT_URL`, MongoDB `MONGODB_URI`.
- **Mobile:** `API_BASE_URL` trong `.env` (ví dụ `http://localhost:3000/api` cho emulator, hoặc IP máy thật khi test thiết bị).

Mobile dùng `axiosInstance` (baseURL = `API_BASE_URL`), mọi route đều prefix `/api` trên backend (ví dụ `/api/auth/login`).

---

## 4. API đã đồng bộ (Backend ↔ Mobile)

### 4.1 Auth & User
- `POST /auth/login`, `POST /auth/register`, `POST /auth/logout`
- `GET/PATCH /users/profile`, `POST /auth/forgot-password`, `POST /auth/reset-password`
- Mobile: `authApi` (login, register, getProfile, updateProfile, logout, forgotPassword, resetPassword)

### 4.2 Courses & Learning
- `GET /courses` — list
- `GET /courses/:id` — chi tiết
- `GET /courses/:id/curriculum` — curriculum
- `GET /courses/:id/learn` — **dữ liệu học:** course, lessons (có `quizId` với lesson type=quiz), progress, completionPercentage
- `GET /courses/:id/assignments` — danh sách assignment + `canSubmit`
- `GET /courses/:id/my-assignment-submissions` — bài nộp của user theo khóa
- Mobile: `coursesApi` (getCourseLearning, getCourseById, listCourses, getCurriculum, getAssignmentsByCourse, getMyAssignmentSubmissionsByCourse)

### 4.3 Progress
- `POST /progress/mark-complete` — body: `{ lessonId }` (video/text; lesson quiz không dùng nút này, hoàn thành qua pass quiz)
- `PUT /progress/update-position` — body: `lessonId`, `lastPosition?`, `timeSpent?`
- `GET /progress/:courseId` — tiến độ theo khóa
- Mobile: `progressApi` (markComplete, updatePosition, getByCourse)

### 4.4 Quizzes
- `GET /quizzes/:id` — đề quiz (ẩn correctAnswer/explanation)
- `POST /quizzes/:id/attempt` — body: `{ answers, timeSpent? }` (answers theo thứ tự câu)
- `GET /quizzes/:id/results` — kết quả (backend dùng cho attempt cụ thể)
- Mobile: `quizzesApi` (getQuiz, submitAttempt, getResults)
- **Luồng backend:** Làm quiz khi đã hoàn thành **các lesson trước** (theo order). Khi **pass** quiz, backend tự set Progress(lessonId quiz) = completed.

### 4.5 Assignments
- `GET /assignments/:id` — chi tiết + `canSubmit` + `mySubmission`
- `POST /assignments/:id/submit` — nộp bài (regular): body `content?`, `attachments?`
- `POST /assignments/:id/submit-exam` — nộp bài thi trắc nghiệm: body `answers` (mảng index đã chọn), `timeSpent?`
- Mobile: `assignmentApi` (getOne, submit, submitExam)

### 4.6 Certificates
- `GET /certificates/my-certificates` — danh sách chứng chỉ
- `POST /certificates/generate` — body `{ courseId }` (khi đủ điều kiện: 100% lesson + pass hết quiz + pass hết assignment)
- `GET /certificates/:id/download` — tải PDF/URL
- `GET /certificates/verify/:certId` — xác minh (public)
- Mobile: `certificateApi` (getMyCertificates, generate, download)

---

## 5. Types (mobile `api.types.ts`)

Đã bổ sung và đồng bộ với backend:

- **User, LoginResponse, RegisterResponse, ProfileResponse**
- **Lesson, Progress** (lesson type: video | text | quiz; progress isCompleted, completedAt)
- **Quiz, QuizQuestion, QuizAttemptRequest, QuizAttemptResponse**
- **Assignment, AssignmentSubmission, Certificate**
- **CourseLearningData** (GET learn), **AssignmentsByCourseResponse**, **AssignmentDetailResponse**

---

## 6. Luồng nghiệp vụ (tóm tắt)

- **Instructor:** Tạo khóa → thêm lesson (video/text/quiz) → tạo/sửa quiz cho lesson quiz → tạo assignment → chấm bài nộp.
- **Learner (enrolled):**
  1. Vào học: `GET /courses/:id/learn` → hiển thị lessons + progress + completion %.
  2. Lesson video/text: xem → bấm "Hoàn thành bài học" → `POST /progress/mark-complete` (lessonId).
  3. Lesson quiz: không bấm "Hoàn thành bài học"; bấm "Làm quiz" → GET quiz → submit attempt → khi **pass**, backend tự mark lesson đó completed.
  4. Khi **pass hết mọi quiz** trong khóa → `canSubmit = true` → được nộp assignment (submit hoặc submit-exam).
  5. Khi 100% lesson + pass hết quiz + pass hết assignment (score ≥ 60% maxScore) → `POST /certificates/generate` → nhận chứng chỉ.

Chi tiết và checklist triển khai xem `backend/ANALYSIS_QUIZ_ASSIGNMENT_FLOW.md`.

---

## 7. Phát triển tiếp (gợi ý)

1. **Mobile – Màn hình Learn:** Dùng `coursesApi.getCourseLearning(courseId)`, `progressApi.markComplete`, `quizzesApi.getQuiz` / `submitAttempt`, sidebar lessons + trạng thái completed.
2. **Mobile – Assignment:** List từ `getAssignmentsByCourse`, chi tiết + nộp qua `assignmentApi.getOne`, `submit` / `submitExam`.
3. **Mobile – Chứng chỉ:** Màn "Chứng chỉ của tôi" dùng `certificateApi.getMyCertificates`, nút "Nhận chứng chỉ" gọi `generate(courseId)` khi đủ điều kiện.
4. **Backend:** Giữ nguyên; chỉ cần đảm bảo `.env` và MongoDB chạy đúng khi mobile gọi API.

---

## 8. Chạy dự án

- **Backend:** `cd backend && npm install && npm run dev` (hoặc script tương ứng).
- **Mobile:** `cd mobileapp && npm install && npx expo start`; cấu hình `API_BASE_URL` trỏ tới backend (ví dụ `http://10.0.2.2:3000/api` Android emulator, `http://localhost:3000/api` iOS).

Sau khi đồng bộ, có thể phát triển tiếp các màn hình Learn, Quiz, Assignment, Certificate trên mobile dựa trên các API và types đã khai báo.
