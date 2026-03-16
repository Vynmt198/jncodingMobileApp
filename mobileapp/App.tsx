import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, ViewStyle, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store, persistor } from '@/store';
import { setStoreForAxios, TOKEN_KEY } from '@/api/axiosInstance';
import { RootNavigator } from '@/navigation';
import { ErrorBoundary } from '@/components/ui';
import { setAppReady, logout } from '@/store/slices/authSlice';
import { setSecureItem } from '@/utils/secureStorage';
import { COLORS } from '@/constants/theme';

setStoreForAxios(store);

/** Chờ rehydration xong rồi mới validate auth và đồng bộ isFirstLaunch. */
const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const run = async () => {
      try {
        const state = store.getState();
        const { auth } = state;
        if (auth?.isAuthenticated && !auth?.token) {
          store.dispatch(logout());
        }
        if (auth?.token) await setSecureItem(TOKEN_KEY, auth.token);
        const hasLaunched = await AsyncStorage.getItem('@has_launched');
        const isFirstLaunch = hasLaunched === null;
        if (isFirstLaunch) await AsyncStorage.setItem('@has_launched', 'true');
        store.dispatch(setAppReady({ isFirstLaunch }));
      } catch (error) {
        console.error('Failed to initialize app', error);
        store.dispatch(setAppReady({ isFirstLaunch: false }));
      }
    };
    run();
  }, []);

  return <>{children}</>;
};

function LoadingSplash() {
  return (
    <View style={styles.splash}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={<LoadingSplash />} persistor={persistor}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={[styles.root, Platform.OS === 'web' && webRootStyle]}>
              <AppInitializer>
                <SafeAreaProvider style={styles.safeArea}>
                  <RootNavigator />
                  <StatusBar style="auto" />
                </SafeAreaProvider>
              </AppInitializer>
            </View>
          </GestureHandlerRootView>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}

const webRootStyle: ViewStyle | undefined =
  Platform.OS === 'web'
    ? ({ minHeight: '100vh', height: '100%', width: '100%', backgroundColor: COLORS.background } as unknown as ViewStyle)
    : undefined;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
