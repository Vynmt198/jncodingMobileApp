import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { ROUTES } from '@/constants/routes';
import { RootStackParamList } from '@/types/navigation.types';

const prefix = Linking.createURL('/');

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix, 'myapp://'],
  config: {
    screens: {
      Auth: {
        screens: {
          [ROUTES.LOGIN]: 'login',
          [ROUTES.REGISTER]: 'register',
          [ROUTES.FORGOT_PASSWORD]: 'forgot-password',
          [ROUTES.NEW_PASSWORD]: 'reset-password',
        },
      },
      App: {
        screens: {
          MainTabs: {
            screens: {
              [ROUTES.HOME]: 'home',
              [ROUTES.SEARCH]: 'search',
              [ROUTES.MY_COURSES]: 'my-courses',
              [ROUTES.PROFILE]: 'profile',
            },
          },
          [ROUTES.COURSE_DETAIL]: 'course/:courseId',
          [ROUTES.COURSE_PLAYER]: 'learn/:courseId/:lessonId?',
          [ROUTES.CATEGORY]: 'category/:categoryId',
          [ROUTES.PAYMENT]: 'payment/:courseId',
          [ROUTES.PAYMENT_SUCCESS]: 'payment-success/:orderId',
        },
      },
    },
  },
};
