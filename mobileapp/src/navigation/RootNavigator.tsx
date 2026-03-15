import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { RootStackParamList } from '@/types/navigation.types';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { BiometricGate } from '@/components/BiometricGate';
import { linking } from './linking';
import { StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';
import { logout, setPendingAuthRoute } from '@/store/slices/authSlice';
import { removeSecureItem } from '@/utils/secureStorage';
import { TOKEN_KEY } from '@/api/axiosInstance';

const RootStack = createNativeStackNavigator<RootStackParamList>();

const AppWithBiometric = () => (
  <BiometricGate>
    <AppNavigator />
  </BiometricGate>
);

function parseAuthPath(url: string): 'Login' | 'Register' | null {
  const path = (Linking.parse(url).path ?? url).replace(/^\/+/, '');
  const lower = path.toLowerCase();
  if (lower === 'login' || lower.endsWith('/login')) return 'Login';
  if (lower === 'register' || lower.endsWith('/register')) return 'Register';
  return null;
}

export const RootNavigator = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const handledInitialUrl = useRef(false);

  // Khi đã đăng nhập mà mở myapp://login hoặc myapp://register → logout và mở đúng màn Auth
  useEffect(() => {
    const handleUrl = async (url: string) => {
      const authRoute = parseAuthPath(url);
      if (!authRoute || !isAuthenticated) return;
      await removeSecureItem(TOKEN_KEY);
      dispatch(setPendingAuthRoute(authRoute));
      dispatch(logout());
    };

    Linking.getInitialURL().then(url => {
      if (url && isAuthenticated && !handledInitialUrl.current) {
        handledInitialUrl.current = true;
        handleUrl(url);
      }
    });

    const sub = Linking.addEventListener('url', ({ url }) => {
      if (isAuthenticated) handleUrl(url);
    });
    return () => sub.remove();
  }, [dispatch, isAuthenticated]);

  return (
    <NavigationContainer linking={linking}>
      <RootStack.Navigator screenOptions={{ headerShown: false, contentStyle: styles.content }}>
        {isAuthenticated ? (
          <RootStack.Screen name="App" component={AppWithBiometric} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
