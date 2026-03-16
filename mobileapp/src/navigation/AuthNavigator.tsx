import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { ROUTES } from '@/constants/routes';
import { AuthStackParamList } from '@/types/navigation.types';
import { clearPendingAuthRoute } from '@/store/slices/authSlice';
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
  const dispatch = useAppDispatch();
  const isFirstLaunch = useAppSelector(state => state.auth.isFirstLaunch);
  const pendingAuthRoute = useAppSelector(state => state.auth.pendingAuthRoute);

  const initialRoute =
    pendingAuthRoute === 'Register'
      ? ROUTES.REGISTER
      : pendingAuthRoute === 'Login'
        ? ROUTES.LOGIN
        : isFirstLaunch
          ? ROUTES.ONBOARDING
          : ROUTES.LOGIN;

  useEffect(() => {
    if (pendingAuthRoute) dispatch(clearPendingAuthRoute());
  }, [dispatch, pendingAuthRoute]);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={initialRoute}
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
