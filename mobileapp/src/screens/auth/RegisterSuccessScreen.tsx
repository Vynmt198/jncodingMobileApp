import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { ROUTES } from '@/constants/routes';
import type { AuthStackParamList } from '@/types/navigation.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Nav = NativeStackNavigationProp<AuthStackParamList, typeof ROUTES.REGISTER_SUCCESS>;

export const RegisterSuccessScreen = () => {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../../../assets/animations/account-created-1.json')}
        autoPlay
        loop={false}
        style={styles.lottie}
        onAnimationFinish={() => {
          navigation.replace(ROUTES.LOGIN);
        }}
      />
      <Text style={styles.title}>Đăng ký thành công!</Text>
      <Text style={styles.subtitle}>Vui lòng đăng nhập để bắt đầu học.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: SPACING[5],
    paddingTop: 56,
  },
  lottie: {
    width: 220,
    height: 220,
    marginBottom: SPACING[3],
    backgroundColor: COLORS.background,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING[1],
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING[6],
  },
});
