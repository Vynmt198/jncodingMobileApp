import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StackActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
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
  AdminDashboardScreen,
  AdminUserManagementScreen,
  AdminCourseApprovalScreen,
  AdminLessonsScreen,
  AdminReviewsScreen,
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
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const iconSize = size ?? 22;
          const name = (() => {
            switch (route.name) {
              // Learner
              case ROUTES.HOME:
                return focused ? 'home' : 'home-outline';
              case ROUTES.SEARCH:
                return focused ? 'search' : 'search-outline';
              case ROUTES.MY_COURSES:
                return focused ? 'library' : 'library-outline';
              case ROUTES.PROFILE:
                return focused ? 'person' : 'person-outline';

              // Instructor
              case ROUTES.INSTRUCTOR_DASHBOARD:
                return focused ? 'school' : 'school-outline';
              case ROUTES.INSTRUCTOR_CREATE_COURSE:
                return focused ? 'add-circle' : 'add-circle-outline';
              case ROUTES.INSTRUCTOR_ANALYTICS:
                return focused ? 'bar-chart' : 'bar-chart-outline';

              // Admin
              case ROUTES.ADMIN_DASHBOARD:
                return focused ? 'speedometer' : 'speedometer-outline';

              default:
                return focused ? 'ellipse' : 'ellipse-outline';
            }
          })();
          return <Ionicons name={name as any} size={iconSize} color={color} />;
        },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          elevation: 0,
        },
      })}
    >
      {role === 'admin' ? (
        <>
          <Tab.Screen
            name={ROUTES.ADMIN_DASHBOARD}
            component={AdminDashboardScreen}
            options={{ title: 'Thống kê' }}
          />
          <Tab.Screen name={ROUTES.PROFILE} component={ProfileScreen} />
        </>
      ) : role === 'instructor' ? (
        <>
          <Tab.Screen
            name={ROUTES.INSTRUCTOR_DASHBOARD}
            component={InstructorMyCoursesScreen}
            options={{ title: 'Khóa tôi dạy' }}
          />
          <Tab.Screen
            name={ROUTES.INSTRUCTOR_CREATE_COURSE}
            component={InstructorCourseCreateScreen}
            options={({ navigation }) => ({
              title: 'Tạo khóa mới',
              listeners: {
                tabPress: () => {
                  const stack = navigation.getParent()?.getParent();
                  if (stack?.dispatch) stack.dispatch(StackActions.popToTop());
                },
              },
            })}
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
          <Tab.Screen name={ROUTES.SEARCH} component={SearchScreen} options={{ title: 'Search' }} />
          <Tab.Screen name={ROUTES.MY_COURSES} component={MyCoursesScreen} options={{ title: 'MyCourses' }} />
          <Tab.Screen name={ROUTES.PROFILE} component={ProfileScreen} options={{ title: 'Profile' }} />
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
      <Stack.Screen name={ROUTES.ADMIN_LESSONS} component={AdminLessonsScreen} />
      <Stack.Screen name={ROUTES.ADMIN_REVIEWS} component={AdminReviewsScreen} />
      <Stack.Screen name={ROUTES.INSTRUCTOR_DASHBOARD} component={InstructorDashboardScreen} />
      <Stack.Screen name={ROUTES.INSTRUCTOR_ANALYTICS} component={InstructorAnalyticsScreen} />
      <Stack.Screen name={ROUTES.INSTRUCTOR_DISCUSSIONS} component={InstructorDiscussionManagementScreen} />
      <Stack.Screen name={ROUTES.INSTRUCTOR_CREATE_COURSE} component={InstructorCourseCreateScreen} />
      <Stack.Screen name={ROUTES.INSTRUCTOR_EDIT_COURSE} component={InstructorCourseCreateScreen} />
    </Stack.Navigator>
  );
};
