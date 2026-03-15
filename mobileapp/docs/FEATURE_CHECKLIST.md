# Kiểm tra hoàn thành feature — Module 1 & Module 2

Đối chiếu theo task list với codebase hiện tại. *(Cập nhật sau khi hoàn thành phần còn thiếu.)*

---

## MODULE 1: SETUP & INFRASTRUCTURE

| Task ID | Tên Task | Chi tiết yêu cầu | Trạng thái | Ghi chú |
|---------|----------|-------------------|------------|---------|
| **MOB-SETUP-01** | Project Initialization | React Native init, ESLint + Prettier, folder structure, .env | ✅ Đủ | Expo project, `.eslintrc.js`, `.prettierrc`, cấu trúc `src/`, `.env.example` |
| **MOB-SETUP-02** | Navigation Setup | React Navigation v6, Bottom Tab, Stack auth, deep linking | ✅ Đủ | RN v7, Bottom Tab + Stack, `linking.ts` với scheme `myapp://` |
| **MOB-SETUP-03** | State Management | Redux Toolkit, RTK Query, Redux Persist, Auth slice | ✅ Đủ | `store/index.ts`, `baseApi.ts`, `authApi.ts`, `authSlice.ts` |
| **MOB-SETUP-04** | API Service Layer | Axios base URL, JWT interceptor, 401, endpoint constants | ✅ Đủ | `axiosInstance.ts` (dùng secureStorage), `endpoints.ts` |
| **MOB-SETUP-05** | UI Component Library | Design tokens, Button, Input, Card, Modal, Skeleton, ErrorBoundary | ✅ Đủ | `constants/`, `components/ui/*` |
| **MOB-SETUP-06** | Push Notifications | FCM / permission / handlers / local | ⚠️ Một phần | **expo-notifications**: permission, channel Android, local + Expo Push. Firebase FCM cần config khi build production. |
| **MOB-SETUP-07** | Analytics & Crash Reporting | Firebase Analytics, Crashlytics, events, user properties | ⚠️ Một phần | `utils/analytics.ts`: mock + **ErrorBoundary gọi logError**. Gắn Firebase khi có config. |

---

## MODULE 2: AUTHENTICATION (Mobile)

| Task ID | Tên Task | Chi tiết yêu cầu | Trạng thái | Ghi chú |
|---------|----------|-------------------|------------|---------|
| **MOB-AUTH-01** | Onboarding Screens | 3–4 slide, Skip, Get Started, chỉ lần đầu | ✅ Đủ | 3 slide, onLayout + getItemLayout cho emulator |
| **MOB-AUTH-02** | Login Screen | Email/Password, show/hide, Remember me, links, social | ✅ Đủ | Remember me, link Forgot/Register, nút Google/Apple (placeholder) |
| **MOB-AUTH-03** | Register Screen | Form, validation, password strength, Terms, redirect | ✅ Đủ | Đã có đầy đủ |
| **MOB-AUTH-04** | Forgot Password | Email → OTP/code → mật khẩu mới | ✅ Đủ | ForgotPassword → OTPVerification → NewPassword |
| **MOB-AUTH-05** | Biometric Authentication | Face ID / Fingerprint, fallback password | ✅ Đủ | **expo-local-authentication**: BiometricGate khi mở app, bật trong Profile |
| **MOB-AUTH-06** | Auth State Management | JWT an toàn, auto login/logout, bảo vệ route | ✅ Đủ | **expo-secure-store** (fallback AsyncStorage), 401 clear token, RootNavigator |
| **MOB-AUTH-07** | Profile Screen | Avatar (Camera/Gallery), sửa thông tin | ✅ Đủ | **ProfileScreen**: avatar (expo-image-picker), form sửa, bật/tắt biometric, đăng xuất |

---

## Tóm tắt

| Module | Đủ | Một phần |
|--------|-----|----------|
| **Module 1** | 5 | 2 (SETUP-06, 07: cần Firebase config khi production) |
| **Module 2** | 7 | 0 |

**Đã bổ sung:** Secure storage (SecureStore + fallback), Remember me, Google/Apple UI, BiometricGate + cài đặt trong Profile, màn Profile thật (avatar, edit, logout), ErrorBoundary → analytics.logError, Onboarding dùng onLayout/getItemLayout cho emulator.
