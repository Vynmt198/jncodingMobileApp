# Tổng quan dự án & Tiến độ theo OPLW Mobile Task Breakdown

Tài liệu đối chiếu với **OPLW_Mobile_Task_Breakdown** (7 modules + Infrastructure, 8 Sprints). Cập nhật theo codebase hiện tại.

---

## 1. Flow khi user mới tải app (đã hoàn chỉnh)

Khi user mới cài và mở app lần đầu:

1. **PersistGate** chờ Redux rehydration (đọc state đã lưu từ AsyncStorage). Trong lúc chờ hiển thị màn hình loading (splash).
2. **Sau rehydration:** Nếu chưa đăng nhập (`!isAuthenticated`) → hiển thị **Auth** stack:
   - **Lần đầu** (`isFirstLaunch === true`): màn **Onboarding** (3 slide) → Skip/Get Started → **Login** hoặc **Register**.
   - **Các lần sau** (đã qua onboarding): màn **Login** (có link Forgot Password, Register).
3. User **đăng nhập/đăng ký** thành công → `setCredentials` → `isAuthenticated = true` → chuyển sang **App** (Bottom Tab: Home, Search, My Courses, Profile).
4. **Đăng xuất** (Profile → Logout) → `logout` → `isAuthenticated = false` → quay lại **Auth** (màn Login).

**Kỹ thuật đã áp dụng:**

- `App.tsx`: Bọc `PersistGate` với `persistor`; loading = splash (ActivityIndicator).
- `AppInitializer`: Chạy **sau** rehydration; kiểm tra nếu `isAuthenticated` nhưng không có `token` thì `dispatch(logout())`; đồng bộ `@has_launched` và `setAppReady({ isFirstLaunch })`.
- `authSlice`: Xử lý `REHYDRATE` — nếu state rehydrate có `isAuthenticated` nhưng không có `token` thì reset auth.
- `RootNavigator`: Render **Auth** khi `!isAuthenticated`, **App** khi `isAuthenticated`.
- `AuthNavigator`: `initialRouteName = isFirstLaunch ? Onboarding : Login`.

---

## 2. Tiến độ theo Module (OPLW Plan)

### MODULE 1: SETUP & INFRASTRUCTURE — ✅ Đủ (5/7), 2 task một phần

| Task ID        | Trạng thái | Ghi chú |
|----------------|------------|---------|
| MOB-SETUP-01   | ✅         | Expo, ESLint, Prettier, cấu trúc, .env |
| MOB-SETUP-02   | ✅         | React Navigation, Bottom Tab, Stack Auth, deep link |
| MOB-SETUP-03   | ✅         | Redux Toolkit, RTK Query, Redux Persist, Auth slice |
| MOB-SETUP-04   | ✅         | Axios, JWT interceptor, 401, endpoints |
| MOB-SETUP-05   | ✅         | Design tokens, Button, Input, Card, Modal, Skeleton, ErrorBoundary |
| MOB-SETUP-06   | ⚠️ Một phần | expo-notifications (permission, local). FCM đầy đủ cần config production. |
| MOB-SETUP-07   | ⚠️ Một phần | analytics (mock), ErrorBoundary gọi logError. Firebase khi có config. |

### MODULE 2: AUTHENTICATION — ✅ Hoàn thành (7/7)

| Task ID        | Trạng thái | Ghi chú |
|----------------|------------|---------|
| MOB-AUTH-01    | ✅         | Onboarding 3 slide, Skip, Get Started, chỉ lần đầu (@has_launched) |
| MOB-AUTH-02    | ✅         | Login: email/password, show/hide, Remember me, links, social (placeholder) |
| MOB-AUTH-03    | ✅         | Register: form, validation, password strength, Terms |
| MOB-AUTH-04    | ✅         | Forgot Password → OTP → New password |
| MOB-AUTH-05    | ✅         | Biometric (BiometricGate, bật/tắt trong Profile) |
| MOB-AUTH-06    | ✅         | JWT SecureStore, 401 clear token, RootNavigator theo isAuthenticated, PersistGate |
| MOB-AUTH-07    | ✅         | Profile: Avatar (Camera/Gallery), sửa thông tin, logout |

### MODULE 3: COURSE DISCOVERY & BROWSING — ✅ Hoàn thành (7/7)

| Task ID        | Trạng thái | Ghi chú |
|----------------|------------|---------|
| MOB-COURSE-01  | ✅         | Home: featured, categories, trending, continue learning |
| MOB-COURSE-02  | ✅         | Course Listing: FlatList, filter, sort, pull-to-refresh |
| MOB-COURSE-03  | ✅         | Search: search bar, recent, results, filter chips |
| MOB-COURSE-04  | ✅         | Course Detail: hero, info, tabs Overview/Curriculum/Reviews, Enroll |
| MOB-COURSE-05  | ✅         | Curriculum accordion (trong Course Detail) |
| MOB-COURSE-06  | ✅         | Category Screen: grid categories, banner |
| MOB-COURSE-07  | ✅         | Course Card: thumbnail, title, instructor, rating, price, progress |

### MODULE 4: ENROLLMENT & PAYMENT — ⚠️ Màn hình mock

| Task ID        | Trạng thái | Ghi chú |
|----------------|------------|---------|
| MOB-ENROLL-01  | ⚠️         | Enroll logic (một phần: API có, UI chi tiết course có nút) |
| MOB-ENROLL-02  | 🔲 Mock    | Payment Screen (MockScreen) |
| MOB-ENROLL-03  | 🔲 Mock    | Payment Success (MockScreen) |
| MOB-ENROLL-04  | 🔲 Mock    | My Courses tab (MockScreen) |
| MOB-ENROLL-05  | 🔲 Mock    | Payment History (MockScreen) |

### MODULE 5: LEARNING EXPERIENCE — 🔲 Chưa làm (mock)

| Task ID        | Trạng thái | Ghi chú |
|----------------|------------|---------|
| MOB-LEARN-01..08 | 🔲 Mock  | Course Player hiện là MockScreen |

### MODULE 6: QUIZ & ASSESSMENT — 🔲 Chưa làm

| Task ID        | Trạng thái | Ghi chú |
|----------------|------------|---------|
| MOB-QUIZ-01..04 | 🔲        | Chưa có màn Quiz |

### MODULE 7: REVIEWS, RATINGS & CERTIFICATES — 🔲 Chưa làm

| Task ID        | Trạng thái | Ghi chú |
|----------------|------------|---------|
| MOB-REVIEW-01..02 | 🔲      | Chưa có màn Review |
| MOB-CERT-01..03   | 🔲      | Chưa có màn Certificate |

### MODULE 8: INSTRUCTOR & ADMIN — 🔲 Chưa làm

| Task ID        | Trạng thái | Ghi chú |
|----------------|------------|---------|
| MOB-INST-01..03, MOB-ADMIN-01..02 | 🔲 | Chưa có |

---

## 3. Tóm tắt tiến độ

| Nội dung | Kết luận |
|----------|----------|
| **Đã chạy được khi mở app** | Flow user mới: Splash (PersistGate) → Onboarding (lần đầu) / Login (lần sau) → Đăng nhập/Đăng ký → App (tabs). Đăng xuất → lại Login. |
| **Module 1** | 5/7 đủ; 2 task (Push, Analytics) một phần. |
| **Module 2** | 7/7 đủ. |
| **Module 3** | 7/7 đủ (Home, Listing, Search, Detail, Category, Course Card, Curriculum). |
| **Module 4** | Màn Payment, My Courses, Payment Success/History đang mock. |
| **Module 5–8** | Chưa triển khai (Learning, Quiz, Certificates, Instructor/Admin). |

---

## 4. API đã gọi từ mobile (đã đồng bộ backend)

- Auth: Login, Register, Logout, Forgot password, Reset password.
- User: Get profile, Update profile.
- Courses: List, search, detail, curriculum, learning data (đã có API slice).
- Progress, Assignments, Quizzes, Certificates: Đã có API slice, chưa gắn đủ màn hình.

Chi tiết API và endpoint: xem `PROJECT_SYNC.md`, `MODULE_1_2_VERIFICATION.md`.

---

## 5. Tài liệu tham chiếu

- **Kế hoạch gốc:** `docs/OPLW_Mobile_Task_Breakdown.docx` (hoặc bản text trong `doc_extract.txt`).
- **Feature checklist Module 1 & 2:** `docs/FEATURE_CHECKLIST.md`, `docs/MODULE_1_2_VERIFICATION.md`.
- **Theme đồng bộ website:** `docs/THEME_WEBSITE_SYNC.md`.
