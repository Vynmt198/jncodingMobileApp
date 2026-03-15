import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector } from '@/store/hooks';
import { ROUTES } from '@/constants/routes';
import { AuthStackParamList } from '@/types/navigation.types';
import {
  OnboardingScreen,
  LoginScreen,
  RegisterScreen,
  ForgotPasswordScreen,
  OTPVerificationScreen,
  NewPasswordScreen,
} from '@/screens/auth';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  const isFirstLaunch = useAppSelector(state => state.auth.isFirstLaunch);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={isFirstLaunch ? ROUTES.ONBOARDING : ROUTES.LOGIN}
    >
      <Stack.Screen name={ROUTES.ONBOARDING} component={OnboardingScreen} />
      <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
      <Stack.Screen name={ROUTES.REGISTER} component={RegisterScreen} />
      <Stack.Screen name={ROUTES.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
      <Stack.Screen name={ROUTES.OTP_VERIFICATION} component={OTPVerificationScreen} />
      <Stack.Screen name={ROUTES.NEW_PASSWORD} component={NewPasswordScreen} />
    </Stack.Navigator>
  );
};
