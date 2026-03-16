import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { Button, Input, FadeInView } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import type { AuthStackParamList } from '@/types/navigation.types';

export const OTPVerificationScreen = () => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const route = useRoute<RouteProp<AuthStackParamList, typeof ROUTES.OTP_VERIFICATION>>();
  const navigation = useNavigation();
  const email = route.params?.email ?? '';

  const validate = () => {
    if (!token.trim()) {
      setError('Vui lòng nhập mã đặt lại mật khẩu từ email');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (!validate()) return;
    navigation.navigate(ROUTES.NEW_PASSWORD, { email, otp: token.trim() });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <FadeInView style={{ flex: 1 }} duration={500} slide>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Nhập mã đặt lại</Text>
        <Text style={styles.subtitle}>
          Nhập mã đặt lại mật khẩu đã được gửi đến {email || 'email của bạn'}.
        </Text>

        <Input
          label="Mã đặt lại mật khẩu"
          placeholder="Dán hoặc nhập mã từ email"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          containerStyle={styles.input}
        />
        {error ? <Text style={styles.errText}>{error}</Text> : null}

        <Button title="Tiếp tục" onPress={handleNext} style={styles.btn} />
        <Button title="Quay lại" onPress={() => navigation.goBack()} variant="ghost" />
        </ScrollView>
      </FadeInView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING[5],
    paddingTop: 48,
    paddingBottom: SPACING[8],
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING[1],
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    marginBottom: SPACING[8],
  },
  input: {
    marginBottom: SPACING[4],
  },
  errText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    marginBottom: SPACING[2],
  },
  btn: {
    marginBottom: SPACING[4],
  },
});
