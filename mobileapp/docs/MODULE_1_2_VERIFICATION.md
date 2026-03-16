# Kiểm tra Module 1 & Module 2 + API call (đối chiếu code)

Đối chiếu với **OPLW Mobile Task Breakdown** và codebase thực tế. Cập nhật: kiểm tra đã call API từ mobile tới backend hay chưa.

---

## MODULE 1: SETUP & INFRASTRUCTURE

| Task ID | Yêu cầu | Trạng thái | Xác minh trong code |
|---------|---------|------------|---------------------|
| **MOB-SETUP-01** | Project init, ESLint, Prettier, cấu trúc, .env | ✅ Hoàn thành | Expo, `package.json`, `.eslintrc.js`, `.prettierrc`, `src/`, `.env.example` |
| **MOB-SETUP-02** | React Navigation v6, Bottom Tab, Stack auth, deep link | ✅ Hoàn thành | `navigation/RootNavigator`, `AuthNavigator`, `AppNavigator`, `linking.ts` (scheme `myapp://`) |
| **MOB-SETUP-03** | Redux Toolkit, RTK Query, Redux Persist, Auth slice | ✅ Hoàn thành | `store/index.ts`, `baseApi.ts`, `authApi.ts`, `authSlice.ts`, persist với AsyncStorage |
| **MOB-SETUP-04** | API: base URL, JWT interceptor, 401, endpoints | ✅ Hoàn thành | `axiosInstance.ts` (BASE_URL từ `API_BASE_URL`), Bearer token, 401 → xóa token, `endpoints.ts` |
| **MOB-SETUP-05** | UI: design tokens, Button, Input, Card, Modal, Skeleton, ErrorBoundary | ✅ Hoàn thành | `constants/theme`, `colors`, `typography`, `components/ui/*` |
| **MOB-SETUP-06** | Push Notifications (FCM, permission, handlers) | ⚠️ Một phần | `expo-notifications` (permission, channel, local). FCM đầy đủ cần config production. |
| **MOB-SETUP-07** | Analytics & Crash (Firebase) | ⚠️ Một phần | `utils/analytics.ts` (mock), ErrorBoundary gọi logError. Gắn Firebase khi có config. |

---

## MODULE 2: AUTHENTICATION (Mobile)

| Task ID | Yêu cầu | Trạng thái | Xác minh trong code |
|---------|---------|------------|---------------------|
| **MOB-AUTH-01** | Onboarding 3–4 slide, Skip, Get Started, chỉ lần đầu | ✅ Hoàn thành | `OnboardingScreen.tsx`, AsyncStorage `isFirstLaunch` |
| **MOB-AUTH-02** | Login: email/password, show/hide, Remember me, links, social | ✅ Hoàn thành | `LoginScreen.tsx`, `useLoginMutation`, Remember me, link Forgot/Register, Google/Apple (placeholder) |
| **MOB-AUTH-03** | Register: form, validation, password strength, Terms | ✅ Hoàn thành | `RegisterScreen.tsx`, `useRegisterMutation`, validation + map lỗi backend |
| **MOB-AUTH-04** | Forgot Password: email → OTP/code → mật khẩu mới | ✅ Hoàn thành | `ForgotPasswordScreen` → `OTPVerificationScreen` → `NewPasswordScreen`, `useForgotPasswordMutation`, `useResetPasswordMutation` |
| **MOB-AUTH-05** | Biometric (Face ID / Fingerprint) | ✅ Hoàn thành | `BiometricGate.tsx`, `expo-local-authentication`, bật/tắt trong Profile |
| **MOB-AUTH-06** | Auth state: JWT an toàn, auto login/logout, bảo vệ route | ✅ Hoàn thành | `expo-secure-store` (fallback AsyncStorage), 401 clear token, `RootNavigator` theo `isAuthenticated` |
| **MOB-AUTH-07** | Profile: Avatar (Camera/Gallery), sửa thông tin | ✅ Hoàn thành | `ProfileScreen.tsx`, `useGetProfileQuery`, `useUpdateProfileMutation`, `useLogoutMutation`, ImagePicker, form fullName/bio |

---

## API CALL — Đã gọi backend từ mobile

| API | Endpoint (backend) | Màn hình / luồng | Ghi chú |
|-----|--------------------|-------------------|--------|
| **Login** | `POST /api/auth/login` | `LoginScreen` → `useLoginMutation` | ✅ Gửi email/password, nhận token + user, lưu token + setCredentials |
| **Register** | `POST /api/auth/register` | `RegisterScreen` → `useRegisterMutation` | ✅ Gửi fullName, email, password; xử lý 409 (email đã tồn tại) |
| **Logout** | `POST /api/auth/logout` | `ProfileScreen` → `useLogoutMutation` | ✅ Gọi API + xóa token + dispatch logout |
| **Forgot password** | `POST /api/auth/forgot-password` | `ForgotPasswordScreen` → `useForgotPasswordMutation` | ✅ Gửi email, chuyển màn nhập OTP |
| **Reset password** | `POST /api/auth/reset-password` | `NewPasswordScreen` → `useResetPasswordMutation` | ✅ Gửi token (otp) + newPassword |
| **Get profile** | `GET /api/users/profile` | `ProfileScreen`, `HomeScreen` → `useGetProfileQuery` | ✅ Có JWT trong header (axios interceptor) |
| **Update profile** | `PUT /api/users/profile` | `ProfileScreen` → `useUpdateProfileMutation` | ✅ Đã sửa method PATCH → PUT khớp backend |

**Cơ chế gọi API:**

- `axiosInstance`: baseURL = `process.env.API_BASE_URL` (mặc định `http://localhost:3000/api`).
- Mọi request đều gắn `Authorization: Bearer <token>` (trừ login/register/forgot/reset).
- 401 → xóa token (trong response interceptor).
- RTK Query dùng `axiosBaseQuery()` từ `baseApi.ts` → gọi qua `axiosInstance`.

**Backend tương ứng (đã có):**

- `POST /api/auth/register`, `login`, `logout`, `forgot-password`, `reset-password`
- `GET /api/users/profile`, `PUT /api/users/profile`

---

## Tóm tắt

| Nội dung | Kết luận |
|----------|----------|
| **Module 1** | 5/7 task đủ; 2 task (Push Notifications, Analytics) một phần, cần Firebase khi production. |
| **Module 2** | 7/7 task đủ; toàn bộ màn auth + profile có trong code và dùng API. |
| **Call API từ mobile** | **Đã gọi được:** Login, Register, Logout, Forgot password, Reset password, Get profile, Update profile. Cần cấu hình đúng `API_BASE_URL` và backend chạy (CORS đã cấu hình cho Expo web 8081). |

**Đã sửa trong lần kiểm tra:** `updateProfile` đổi từ `PATCH` sang `PUT` để khớp backend.

**Flow user mới tải app:** Đã hoàn chỉnh: PersistGate → rehydration → Auth (Onboarding lần đầu / Login lần sau) → đăng nhập → App. Chi tiết: `docs/PROJECT_OVERVIEW_AND_PROGRESS.md`.

**Xử lý 401 & lỗi hiển thị:** Khi API trả 401, axios interceptor gọi `logout()` → chuyển về màn Login. GetProfile/GetEnrollments chỉ gọi khi có `token` (skip khi chưa đăng nhập) để tránh 401 không cần thiết. ProfileScreen khi lỗi 401 không hiện "Không thể tải hồ sơ" mà hiện loading (sắp redirect).
