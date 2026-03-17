// Navigation type definitions
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { ROUTES } from '@/constants/routes';

// Auth Stack params
export type AuthStackParamList = {
  [ROUTES.ONBOARDING]: undefined;
  [ROUTES.LOGIN]: undefined;
  [ROUTES.REGISTER]: undefined;
  [ROUTES.REGISTER_SUCCESS]: undefined;
  [ROUTES.FORGOT_PASSWORD]: undefined;
  [ROUTES.OTP_VERIFICATION]: { email: string };
  [ROUTES.NEW_PASSWORD]: { email: string; otp: string };
};

// Bottom Tab params (learner + admin + instructor tab names)
export type BottomTabParamList = {
  [ROUTES.HOME]: undefined;
  [ROUTES.SEARCH]: { query?: string } | undefined;
  [ROUTES.MY_COURSES]: undefined;
  [ROUTES.PROFILE]: undefined;
  [ROUTES.ADMIN_DASHBOARD]: undefined;
  [ROUTES.ADMIN_USER_MANAGEMENT]: undefined;
  [ROUTES.ADMIN_COURSE_APPROVAL]: undefined;
  [ROUTES.ADMIN_LESSONS]: undefined;
  [ROUTES.ADMIN_REVIEWS]: undefined;
  [ROUTES.INSTRUCTOR_DASHBOARD]: undefined;
  [ROUTES.INSTRUCTOR_CREATE_COURSE]: undefined;
  [ROUTES.INSTRUCTOR_ANALYTICS]: undefined;
};

// App Stack params (wrapping bottom tabs + detail screens)
export type AppStackParamList = {
  MainTabs: undefined;
  [ROUTES.COURSE_LISTING]: { categoryId?: string; categoryName?: string } | undefined;
  [ROUTES.COURSE_DETAIL]: { courseId: string };
  [ROUTES.CATEGORY]: { categoryId?: string; categoryName?: string } | undefined;
  [ROUTES.COURSE_PLAYER]: { courseId: string; lessonId?: string };
  [ROUTES.PAYMENT]: { courseId: string; courseTitle: string; price: number };
  [ROUTES.PAYMENT_SUCCESS]: { courseId: string; orderId: string };
  [ROUTES.PAYMENT_HISTORY]: undefined;
  [ROUTES.QUIZ_START]: { quizId: string; courseId?: string; lessonId?: string };
  [ROUTES.QUIZ_QUESTION]: { quizId: string; courseId?: string; lessonId?: string };
  [ROUTES.QUIZ_RESULT]: { attemptId: string; quizId?: string; courseId?: string; lessonId?: string };
  [ROUTES.ADMIN_DASHBOARD]: undefined;
  [ROUTES.ADMIN_USER_MANAGEMENT]: undefined;
  [ROUTES.ADMIN_COURSE_APPROVAL]: undefined;
  [ROUTES.ADMIN_LESSONS]: undefined;
  [ROUTES.ADMIN_REVIEWS]: undefined;
  [ROUTES.INSTRUCTOR_DASHBOARD]: undefined;
  [ROUTES.INSTRUCTOR_ANALYTICS]: undefined;
  [ROUTES.INSTRUCTOR_DISCUSSIONS]: undefined;
  [ROUTES.INSTRUCTOR_CREATE_COURSE]: undefined;
};

// Root Navigator (Auth vs App)
export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

// Screen prop types
export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<AuthStackParamList, T>;
export type AppScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<AppStackParamList, T>;
export type TabScreenProps<T extends keyof BottomTabParamList> = BottomTabScreenProps<BottomTabParamList, T>;
