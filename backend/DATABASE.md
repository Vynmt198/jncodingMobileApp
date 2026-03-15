# OPLW - Database Architecture

> Đã được double-check với **Task Breakdown OPLW** và **SRS SWD392**

---

## 1. Collections & Schema

| Collection | Mô tả | Task Breakdown | SRS |
|------------|-------|----------------|-----|
| users | Người dùng (learner, instructor, admin) | ✓ | UC01-02, UC08, UC31 |
| sessions | JWT/session tokens (BR31) | ✓ | BR31 |
| categories | Danh mục khóa học | ✓ | UC05 |
| courses | Khóa học | ✓ | UC03-07, UC19-20, UC25, UC40-42 |
| lessons | Bài học (video/text/quiz) | ✓ | UC20, UC33-34 |
| enrollments | Đăng ký khóa học | ✓ | UC10, BR7-BR10 |
| progresses | Tiến độ học bài | ✓ | UC12-13, UC14 |
| payments | Giao dịch thanh toán | ✓ | UC11, BR11-12, BR32 |
| reviews | Đánh giá khóa học | ✓ | UC07, UC16, BR17-18 |
| quizzes | Bài quiz | ✓ | UC14, UC21, UC32 |
| quizattempts | Lần làm quiz | ✓ | UC14 |
| discussions | Thảo luận & replies | ✓ | UC15, UC24, UC35 |
| certificates | Chứng chỉ hoàn thành | ✓ | UC17, BR16 |
| courseblocks | User bị chặn trong khóa | ✓ | UC36 |
| assignments | Bài tập (instructor chấm) | ✓ | UC21-22 |
| assignmentsubmissions | Bài nộp | ✓ | UC22 |
| passwordresets | Token reset password | ✓ | UC30, UC48 |

---

## 2. API Endpoints → Database Mapping

### Auth & User (Module 1)
| Method | Endpoint | Collections |
|--------|----------|-------------|
| POST | /api/auth/register | users |
| POST | /api/auth/login | users, sessions |
| POST | /api/auth/logout | sessions |
| POST | /api/auth/forgot-password | users, passwordresets |
| POST | /api/auth/reset-password | users, passwordresets |
| GET | /api/users/profile | users |
| PUT | /api/users/profile | users |
| PUT | /api/users/change-password | users |
| GET | /api/admin/users | users |
| PUT | /api/admin/users/:id/role | users |
| PUT | /api/admin/users/:id/status | users |
| DELETE | /api/admin/users/:id | users |

### Course (Module 2)
| Method | Endpoint | Collections |
|--------|----------|-------------|
| GET | /api/courses | courses, categories |
| GET | /api/courses/search | courses |
| GET | /api/courses/:id | courses, lessons |
| GET | /api/courses/:id/curriculum | lessons |
| POST | /api/courses | courses *(auth, instructor)* |
| PUT | /api/courses/:id | courses *(auth, chủ khóa hoặc admin)* |
| DELETE | /api/courses/:id | courses *(auth, chủ khóa hoặc admin)* — xóa cả lessons của khóa |
| POST | /api/courses/:id/lessons | lessons |
| PUT | /api/lessons/:id | lessons |
| DELETE | /api/lessons/:id | lessons |
| PUT | /api/lessons/reorder | lessons |
| GET | /api/categories | categories |
| PUT | /api/admin/courses/:id/approve | courses |
| PUT | /api/admin/courses/:id/status | courses |

### Enrollment & Payment (Module 3)
| Method | Endpoint | Collections |
|--------|----------|-------------|
| POST | /api/enrollments | enrollments, payments |
| GET | /api/enrollments/my-courses | enrollments, courses |
| POST | /api/payment/create | payments |
| GET | /api/payment/return | payments, enrollments |

### Learning (Module 4)
*(Các endpoint dưới đây là implementation thực tế; logic tương đương với mô tả SRS.)*
| Method | Endpoint | Collections |
|--------|----------|-------------|
| GET | /api/courses/:id/learn | enrollments, lessons, progresses *(auth + isEnrolled)* |
| GET | /api/lessons/:id/content | lessons, progresses *(auth + isEnrolled)* |
| POST | /api/progress/mark-complete | progresses |
| PUT | /api/progress/update-position | progresses |
| GET | /api/progress/:courseId | progresses |
| GET | /api/quizzes/:id | quizzes *(id = quizId; isEnrolled qua lesson → course)* |
| POST | /api/quizzes/:id/attempt | quizattempts |

### Review & Certificate (Module 5-6)
| Method | Endpoint | Collections |
|--------|----------|-------------|
| GET | /api/courses/:id/reviews | reviews |
| POST | /api/reviews | reviews, enrollments |
| GET | /api/certificates | certificates |
| GET | /api/certificates/:id/download | certificates |

### Discussion (Module 7)
| Method | Endpoint | Collections |
|--------|----------|-------------|
| GET | /api/discussions/:courseId | discussions |
| POST | /api/discussions | discussions |
| POST | /api/discussions/:id/reply | discussions |
| PUT | /api/discussions/:id/pin | discussions |
| DELETE | /api/discussions/:id | discussions |

---

## 3. Schema Chi Tiết (Task Breakdown Alignment)

### Course
- `categoryId` (ref Category) - Task dùng category string enum, ta dùng ref linh hoạt hơn
- `status`: draft | pending | active | rejected | disabled (SRS có rejected/disabled)
- `totalLessons`, `totalDuration`, `enrollmentCount`, `averageRating` - cached fields

### Lesson
- `type`: video | text | quiz
- `content`, `videoUrl`, `duration`, `isPreview`

### Discussion
- `parentId` null = post (có title), set = reply
- `title`, `isPinned`, `likesCount`, `repliesCount`

### User
- `phone`, `bio` - cho profile (Task: update personal info)
- `role`: learner | instructor | admin (không có guest - Guest chưa đăng nhập)

---

## 4. Đồng bộ Team

1. Clone → copy `.env.example` → `MONGODB_URI`
2. `docker-compose up -d` hoặc MongoDB local
3. `npm run db:reset-seed` (lần đầu)
4. Khi schema đổi: `npm run db:init-indexes` hoặc `npm run db:reset-seed`

---

## 5. Lệnh Database

| Lệnh | Mô tả |
|------|-------|
| `npm run db:seed` | Seed dữ liệu mẫu |
| `npm run db:init-indexes` | Sync indexes |
| `npm run db:reset` | Xóa collections (dev only) |
| `npm run db:reset-seed` | Reset + seed |
