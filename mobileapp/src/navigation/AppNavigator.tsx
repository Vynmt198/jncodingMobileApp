import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '@/constants/routes';
import { AppStackParamList, BottomTabParamList } from '@/types/navigation.types';
import { COLORS } from '@/constants/theme';
import {
  ProfileScreen,
  HomeScreen,
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
} from '@/screens/app';

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

const TabNavigator = () => {
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
      <Tab.Screen name={ROUTES.HOME} component={HomeScreen} />
      <Tab.Screen name={ROUTES.SEARCH} component={SearchScreen} />
      <Tab.Screen name={ROUTES.MY_COURSES} component={MyCoursesScreen} />
      <Tab.Screen name={ROUTES.PROFILE} component={ProfileScreen} />
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
    </Stack.Navigator>
  );
};
