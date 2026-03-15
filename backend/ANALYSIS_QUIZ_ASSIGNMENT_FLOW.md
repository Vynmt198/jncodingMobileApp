# Phân tích luồng Bài tập – Quiz – Assignment (trước khi code)

> Mục tiêu: Instructor tạo bài tập/quiz; Learner truy cập khóa, làm quiz sau từng bài học, làm assignment cuối để đủ điều kiện nhận chứng chỉ.

---

## 1. Tổng quan luồng nghiệp vụ mong muốn

```
[Instructor]
  → Tạo/sửa khóa học
  → Thêm bài học: video | text | quiz (mỗi lesson type = quiz là 1 “quiz nhỏ”)
  → Với lesson type = quiz: tạo/sửa nội dung Quiz (câu hỏi, passingScore, timeLimit)
  → Tạo Assignment (có thể gắn lessonId hoặc để null = bài tập cuối khóa)
  → Chấm bài nộp (grade) → status: graded / needs_revision

[Learner]
  → Đăng ký khóa (enrollment)
  → Học theo thứ tự lesson (order):
      → Lesson video/text: xem → đánh dấu “Hoàn thành bài học”
      → Lesson quiz: làm quiz → đạt (pass) → mới coi là hoàn thành bài đó (và mở khóa bước sau)
  → Sau khi pass hết mọi quiz trong khóa → mới được nộp Assignment
  → Nộp assignment → Instructor chấm → đạt (score >= 60% maxScore, status = graded)
  → Đủ: 100% lesson hoàn thành + pass hết quiz + pass hết assignment → Cấp chứng chỉ
```

---

## 2. Mô hình dữ liệu hiện tại (Backend)

### 2.1 Lesson (`Lesson`)

- **courseId**, **title**, **type**: `'video' | 'text' | 'quiz'`, **order**, content, videoUrl, duration, isPreview.
- Mỗi bài học là một “bước” trong curriculum. `type = 'quiz'` = bước đó là một quiz (nội dung quiz nằm ở collection Quiz, link bởi lessonId).

### 2.2 Quiz (`Quiz`)

- **lessonId** (ref Lesson, required) — 1-1: một lesson type=quiz tương ứng tối đa một Quiz.
- title, **questions** (questionText, type, options, correctAnswer, explanation, points), **passingScore** (%), timeLimit.
- Instructor tạo/sửa qua `/api/instructor/lessons/:lessonId/quiz` và PUT `/api/instructor/quizzes/:quizId`.

### 2.3 Assignment (`Assignment`)

- **courseId** (ref Course), **lessonId** (ref Lesson, optional).
- title, description, maxScore, dueDate, isActive.
- Một khóa có thể có nhiều assignment; assignment có thể gắn với một lesson cụ thể hoặc “chung” (lessonId = null).

### 2.4 Progress (`Progress`)

- userId, courseId, **lessonId**, **isCompleted**, timeSpent, lastPosition, completedAt.
- “Hoàn thành bài học” = có bản ghi Progress với lessonId đó và isCompleted = true.

### 2.5 QuizAttempt (`QuizAttempt`)

- userId, quizId, answers, score (%), isPassed, submittedAt, timeSpent.
- Dùng để: (1) kiểm tra “đã pass quiz chưa”; (2) điều kiện nộp assignment; (3) điều kiện cấp chứng chỉ.

### 2.6 Certificate (`certificateController`)

- Cấp chứng chỉ khi:
  1. Enrollment active.
  2. 100% lesson đã có Progress isCompleted.
  3. Mọi quiz trong khóa có ít nhất một QuizAttempt isPassed.
  4. Mọi assignment (isActive) có submission status = 'graded' và score >= 60% maxScore (ASSIGNMENT_PASS_PERCENT = 0.6).

---

## 3. Phân quyền Backend (đã implement)

### 3.1 Instructor – Quiz

| Endpoint | Middleware | Mô tả |
|----------|------------|--------|
| GET `/api/instructor/lessons/:lessonId/quiz` | auth, isLessonOwnerParam('lessonId') | Xem quiz của lesson (chủ khóa/admin) |
| POST `/api/instructor/lessons/:lessonId/quiz` | auth, isLessonOwnerParam('lessonId') | Tạo/cập nhật quiz (lesson phải type=quiz) |
| PUT `/api/instructor/quizzes/:quizId` | auth, isQuizOwner('quizId') | Sửa quiz |

### 3.2 Instructor – Assignment

| Endpoint | Middleware | Mô tả |
|----------|------------|--------|
| GET `/api/courses/:id/assignments` | auth, (owner hoặc enrolled) | Danh sách assignment (owner: canSubmit=true) |
| POST `/api/courses/:id/assignments` | auth, isCourseOwner('id') | Tạo assignment |
| GET `/api/assignments/:id` | auth, loadAssignment | Chi tiết (controller check enrolled/owner) |
| PUT `/api/assignments/:id` | auth, isAssignmentCourseOwner('id') | Sửa assignment |
| DELETE `/api/assignments/:id` | auth, isAssignmentCourseOwner('id') | Xóa assignment |
| GET `/api/assignments/:id/submissions` | auth, isAssignmentCourseOwner('id') | Danh sách bài nộp |
| PUT `/api/assignments/submissions/:id/grade` | auth, isSubmissionGrader('id') | Chấm bài |

### 3.3 Learner – Quiz

| Endpoint | Middleware | Mô tả |
|----------|------------|--------|
| GET `/api/quizzes/:id` | auth, isEnrolled (qua lesson→course) | Lấy đề quiz (ẩn correctAnswer, explanation) |
| POST `/api/quizzes/:id/attempt` | auth, isEnrolled | Nộp bài làm quiz |

- **Điều kiện làm quiz (backend):** `canAttemptQuiz(userId, quiz.lessonId)` = tồn tại Progress(userId, **quiz.lessonId**, isCompleted: true).  
  → Nghĩa là **bài học (lesson) chứa quiz đó phải đã được đánh dấu hoàn thành** thì mới được gọi getQuiz/submitAttempt.

### 3.4 Learner – Assignment

| Endpoint | Middleware | Mô tả |
|----------|------------|--------|
| GET `/api/courses/:id/assignments` | auth, (enrolled hoặc owner) | Danh sách + canSubmit |
| GET `/api/assignments/:id` | auth, loadAssignment | Chi tiết + canSubmit + mySubmission |
| POST `/api/assignments/:id/submit` | auth, loadAssignment | Nộp bài |

- **canSubmit:** `hasPassedAllQuizzesInCourse(courseId, userId)` = với mọi lesson type=quiz trong khóa, tồn tại QuizAttempt(userId, quizId, isPassed: true).  
  → Chỉ khi **pass hết tất cả quiz** trong khóa thì learner mới được nộp assignment (đúng nghiệp vụ).

---

## 4. Luồng Learner trên FE (Learn.tsx)

- **Dữ liệu:** `learningApi.getCourseLearning(courseId)` → course, lessons (có quizId với lesson type=quiz), progress, completionPercentage.
- **Sidebar:** Danh sách lesson theo thứ tự; mỗi lesson có trạng thái completed (theo progress) và nút “Bài tập” (assignments) ở dưới.
- **Nội dung bài học:**
  - Nút “Hoàn thành bài học” → gọi `progressApi.markComplete(lessonId)` (bất kể type video/text/quiz).
  - Với `currentLesson.type === 'quiz'`:
    - Hiện thông báo “Hoàn thành bài học trước khi làm quiz” và nút “Làm quiz” **bị disable** cho đến khi `isCompleted(currentLesson._id)`.
    - Tức là FE yêu cầu learner **bấm “Hoàn thành bài học” trước**, sau đó mới được bấm “Làm quiz”.
- **Quiz modal:** getQuiz(quizId) → hiện câu hỏi → submitAttempt → hiện kết quả (score, isPassed). Không gọi markComplete sau khi pass.
- **Bài tập:** listByCourse → hiển thị danh sách assignment, canSubmit (pass hết quiz), nộp/sửa bài qua modal; disabled nếu !canSubmit.

---

## 5. Vấn đề cần xử lý (trước/sau khi code)

### 5.1 Luồng “quiz nhỏ sau mỗi bài học” (quan trọng)

- **Mong muốn:** Hoàn thành nội dung (video/text) → làm quiz của bài đó → **pass quiz** → mới coi là “hoàn thành” bài học đó; sau đó mới đến assignment (và cuối cùng chứng chỉ).
- **Hiện tại Backend:** Cho phép làm quiz **chỉ khi** Progress(lessonId của quiz) đã isCompleted. Tức là phải “hoàn thành bài học” (bằng cách bấm nút mark-complete) **trước** khi làm quiz.
- **Hiện tại FE:** Đúng với backend: disable “Làm quiz” cho đến khi đã bấm “Hoàn thành bài học” cho chính lesson quiz đó.

**Hệ quả:** Learner có thể đánh dấu “Hoàn thành bài học” cho lesson quiz **mà không cần làm quiz**, sau đó vẫn làm quiz (vì backend đã mở). Điều kiện “pass hết quiz mới nộp assignment” và “pass hết quiz + 100% lesson + pass assignment mới có chứng chỉ” vẫn đúng, nhưng **ý nghĩa “hoàn thành bài học” với lesson quiz bị sai**: nên là “đã pass quiz” mới được coi là hoàn thành lesson đó.

**Đề xuất sửa:**

1. **Cách A (khuyến nghị):**  
   - Với lesson **type = quiz**: không cho phép bấm “Hoàn thành bài học” (mark-complete) từ FE.  
   - Backend: **Cho phép làm quiz** khi user enrolled và (tuỳ chọn) đã hoàn thành **các lesson trước đó** (theo order), không cần Progress(quiz.lessonId).isCompleted.  
   - Sau khi **submitAttempt** và **isPassed = true**, backend (hoặc FE) gọi **mark-complete** cho chính lessonId của quiz → lesson quiz chỉ “completed” khi đã pass.

2. **Cách B:**  
   - Giữ “phải complete lesson trước khi làm quiz” nhưng đổi nghĩa: với lesson type=quiz, “complete” chỉ được set khi có ít nhất một QuizAttempt(isPassed: true) cho quiz của lesson đó (ví dụ: job/cron hoặc khi submitAttempt thành công và isPassed thì backend tự gọi mark-complete cho lessonId đó).  
   - Khi đó getQuiz không nên yêu cầu Progress(quiz.lessonId).isCompleted; thay vào đó có thể yêu cầu “các lesson trước (order nhỏ hơn) đã completed” nếu muốn thứ tự nghiêm ngặt.

Cần thống nhất một trong hai hướng và sửa đồng bộ backend (canAttemptQuiz + có thể auto mark-complete khi pass) và FE (ẩn/disable “Hoàn thành bài học” cho lesson quiz, có thể hiển thị “Hoàn thành bằng cách làm quiz đạt”).

### 5.2 Thứ tự lesson (video/text → quiz → assignment)

- Curriculum: lessons sort by `order`. Assignment có thể gắn lessonId (bài tập gắn với một bài học) hoặc null (bài tập cuối khóa).
- Không có ràng buộc “assignment chỉ hiện sau lesson X” ở backend; chỉ có ràng buộc **canSubmit** = pass hết quiz. Nếu muốn “assignment cuối cùng sau khi học hết lesson”, có thể:
  - Thiết kế: 1 assignment “tổng kết” với lessonId = null, và/hoặc
  - FE chỉ hiển thị block assignment khi completionPercentage = 100% (tuỳ chọn).

### 5.3 Chứng chỉ

- Backend đã đủ: 100% lesson completed + pass hết quiz + pass hết assignment (graded, score >= 60% maxScore) → POST `/api/certificates/generate` tạo chứng chỉ.
- FE: Chưa có `certificateApi` trong `api.ts`; cần thêm gọi getMyCertificates, generate (khi đủ điều kiện), download, và màn hình “Chứng chỉ của tôi” / nút “Nhận chứng chỉ” trên trang Learn hoặc Account.

### 5.4 Tóm tắt phân quyền (đã đúng, cần giữ)

- **Instructor:** Tạo/sửa/xóa assignment (course owner); tạo/sửa quiz (lesson owner); xem/chấm submission; list assignments của khóa.
- **Learner:** Chỉ xem/làm quiz khi enrolled; chỉ nộp assignment khi đã pass hết quiz; xem tiến độ và bài đã nộp của mình.

---

## 6. Checklist triển khai (gợi ý)

- [ ] **Backend – Quiz:** Sửa `canAttemptQuiz`: không yêu cầu Progress(quiz.lessonId).isCompleted; có thể yêu cầu “tất cả lesson có order < lesson(quiz).order đã completed” (nếu muốn học tuần tự).
- [ ] **Backend – Progress:** Khi POST `/api/quizzes/:id/attempt` trả về isPassed = true, tự gọi logic mark Lesson(quiz.lessonId) complete (Progress upsert isCompleted=true) để lesson quiz chỉ completed khi đã pass.
- [ ] **FE – Learn:** Với lesson type=quiz: ẩn hoặc disable nút “Hoàn thành bài học”; chỉ cho bấm “Làm quiz”; sau khi pass có thể tự refresh progress (lesson hiển thị completed).
- [ ] **FE – Certificate:** Thêm certificateApi (generate, getMyCertificates, download); trang/modal “Chứng chỉ của tôi” và nút “Nhận chứng chỉ” khi đủ điều kiện (có thể gọi generate khi user bấm).
- [ ] **Tùy chọn:** Ràng buộc “chỉ được làm quiz của lesson X khi đã complete các lesson có order < X” (backend + FE) nếu product yêu cầu học đúng thứ tự.

---

## 7. Sơ đồ luồng tóm tắt

```
INSTRUCTOR:
  Course → Lessons (video | text | quiz) [order]
        → Với type=quiz: POST/PUT /api/instructor/lessons/:lessonId/quiz (Quiz)
        → POST /api/courses/:id/assignments (Assignment, lessonId optional)
        → GET/PUT /api/assignments/:id/submissions, PUT .../grade

LEARNER (enrolled):
  GET /api/courses/:id/learn → lessons (with quizId), progress
  For each lesson (by order):
    - video/text: view → mark-complete → Progress(lessonId).isCompleted = true
    - quiz: getQuiz (allowed when previous lessons completed / or when backend allows) 
            → submitAttempt → if isPassed → backend sets Progress(quiz.lessonId).isCompleted = true
  hasPassedAllQuizzesInCourse? → canSubmit assignment
  POST /api/assignments/:id/submit (content, attachments)
  Instructor grades → status=graded, score
  When 100% lessons + all quizzes passed + all assignments passed (score >= 60%) 
    → POST /api/certificates/generate → Certificate
```

Tài liệu này dùng làm căn bản để triển khai/sửa code đảm bảo đúng luồng Bài tập – Quiz – Assignment và phân quyền Instructor/Learner.
