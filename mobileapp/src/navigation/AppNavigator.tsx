import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '@/constants/routes';
import { AppStackParamList, BottomTabParamList } from '@/types/navigation.types';
import { COLORS } from '@/constants/theme';
import { useAppSelector } from '@/store/hooks';
import {
  ProfileScreen,
  HomeScreen,
  RoleDashboardScreen,
  CourseListingScreen,
  SearchScreen,
  CourseDetailScreen,
  CategoryScreen,
  MyCoursesScreen,
  PaymentScreen,
  PaymentSuccessScreen,
  PaymentHistoryScreen,
  QuizStartScreen,
  QuizQuestionScreen,
  QuizResultScreen,
  CoursePlayerScreen,
  AdminUserManagementScreen,
  AdminCourseApprovalScreen,
  InstructorDashboardScreen,
  InstructorAnalyticsScreen,
  InstructorDiscussionManagementScreen,
  InstructorCourseCreateScreen,
  InstructorMyCoursesScreen,
} from '@/screens/app';

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

const TabNavigator = () => {
  const role = useAppSelector(state => state.auth.user?.role);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          elevation: 0,
        },
      }}
    >
      {role === 'instructor' ? (
        <>
          <Tab.Screen
            name={ROUTES.INSTRUCTOR_DASHBOARD}
            component={InstructorMyCoursesScreen}
            options={{ title: 'Khóa tôi dạy' }}
          />
          <Tab.Screen
            name={ROUTES.INSTRUCTOR_CREATE_COURSE}
            component={InstructorCourseCreateScreen}
            options={{ title: 'Tạo khóa mới' }}
          />
          <Tab.Screen
            name={ROUTES.INSTRUCTOR_ANALYTICS}
            component={InstructorAnalyticsScreen}
            options={{ title: 'Thống kê' }}
          />
          <Tab.Screen name={ROUTES.PROFILE} component={ProfileScreen} />
        </>
      ) : (
        <>
          <Tab.Screen
            name={ROUTES.HOME}
            component={RoleDashboardScreen}
            options={{ title: 'Home' }}
          />
          <Tab.Screen name={ROUTES.SEARCH} component={SearchScreen} />
          <Tab.Screen name={ROUTES.MY_COURSES} component={MyCoursesScreen} />
          <Tab.Screen name={ROUTES.PROFILE} component={ProfileScreen} />
        </>
      )}
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name={ROUTES.COURSE_LISTING} component={CourseListingScreen} />
      <Stack.Screen name={ROUTES.COURSE_DETAIL} component={CourseDetailScreen} />
      <Stack.Screen name={ROUTES.CATEGORY} component={CategoryScreen} />
      <Stack.Screen name={ROUTES.COURSE_PLAYER} component={CoursePlayerScreen} />
      <Stack.Screen name={ROUTES.PAYMENT} component={PaymentScreen} />
      <Stack.Screen name={ROUTES.PAYMENT_SUCCESS} component={PaymentSuccessScreen} />
      <Stack.Screen name={ROUTES.PAYMENT_HISTORY} component={PaymentHistoryScreen} />
      <Stack.Screen name="QuizStart" component={QuizStartScreen} />
      <Stack.Screen name="QuizQuestion" component={QuizQuestionScreen} />
      <Stack.Screen name="QuizResult" component={QuizResultScreen} />
      <Stack.Screen name={ROUTES.ADMIN_USER_MANAGEMENT} component={AdminUserManagementScreen} />
      <Stack.Screen name={ROUTES.ADMIN_COURSE_APPROVAL} component={AdminCourseApprovalScreen} />
      <Stack.Screen name={ROUTES.INSTRUCTOR_DASHBOARD} component={InstructorDashboardScreen} />
      <Stack.Screen name={ROUTES.INSTRUCTOR_ANALYTICS} component={InstructorAnalyticsScreen} />
      <Stack.Screen name={ROUTES.INSTRUCTOR_DISCUSSIONS} component={InstructorDiscussionManagementScreen} />
      <Stack.Screen name={ROUTES.INSTRUCTOR_CREATE_COURSE} component={InstructorCourseCreateScreen} />
    </Stack.Navigator>
  );
};
