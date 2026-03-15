import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector } from '@/store/hooks';
import { RootStackParamList } from '@/types/navigation.types';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { BiometricGate } from '@/components/BiometricGate';
import { linking } from './linking';
import { StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';

const RootStack = createNativeStackNavigator<RootStackParamList>();

const AppWithBiometric = () => (
  <BiometricGate>
    <AppNavigator />
  </BiometricGate>
);

export const RootNavigator = () => {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

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
