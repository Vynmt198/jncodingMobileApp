import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '@/store';
import { RootNavigator } from '@/navigation';
import { ErrorBoundary } from '@/components/ui';
import { setAppReady } from '@/store/slices/authSlice';
import { TOKEN_KEY } from '@/api/axiosInstance';
import { setSecureItem } from '@/utils/secureStorage';
import { COLORS } from '@/constants/theme';

const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    store.dispatch(setAppReady({ isFirstLaunch: true }));
    const runInBackground = async () => {
      try {
        const state = store.getState();
        const token = state.auth?.token;
        if (token) await setSecureItem(TOKEN_KEY, token);
        const hasLaunched = await AsyncStorage.getItem('@has_launched');
        const isFirstLaunch = hasLaunched === null;
        if (isFirstLaunch) await AsyncStorage.setItem('@has_launched', 'true');
        store.dispatch(setAppReady({ isFirstLaunch }));
      } catch (error) {
        console.error('Failed to initialize app', error);
        store.dispatch(setAppReady({ isFirstLaunch: false }));
      }
    };
    runInBackground();
  }, []);

  return <>{children}</>;
};

export default function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <View style={[styles.root, Platform.OS === 'web' && webRootStyle]}>
          <AppInitializer>
            <SafeAreaProvider style={styles.safeArea}>
              <RootNavigator />
              <StatusBar style="auto" />
            </SafeAreaProvider>
          </AppInitializer>
        </View>
      </Provider>
    </ErrorBoundary>
  );
}

const webRootStyle: ViewStyle | undefined =
  Platform.OS === 'web' ? ({ minHeight: '100vh' } as unknown as ViewStyle) : undefined;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
});
