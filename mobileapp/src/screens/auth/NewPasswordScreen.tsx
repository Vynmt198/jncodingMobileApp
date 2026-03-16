import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { Button, Input, FadeInView } from '@/components/ui';
import { useResetPasswordMutation } from '@/store/api/authApi';
import { ROUTES } from '@/constants/routes';
import type { AuthStackParamList } from '@/types/navigation.types';

export const NewPasswordScreen = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const route = useRoute<RouteProp<AuthStackParamList, typeof ROUTES.NEW_PASSWORD>>();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, typeof ROUTES.NEW_PASSWORD>>();
  const { email, otp } = route.params ?? { email: '', otp: '' };

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const validate = () => {
    if (newPassword.length < 8) {
      setError('Mật khẩu mới tối thiểu 8 ký tự');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await resetPassword({ token: otp, newPassword }).unwrap();
      Alert.alert('Thành công', 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập.', [
        {
          text: 'OK',
          onPress: () =>
            navigation.reset({
              index: 0,
              routes: [{ name: ROUTES.LOGIN }],
            }),
        },
      ]);
    } catch {
      setError('Đặt lại mật khẩu thất bại. Mã có thể đã hết hạn.');
      Alert.alert('Thất bại', 'Đặt lại mật khẩu thất bại. Mã có thể đã hết hạn. Vui lòng thử lại.');
    }
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
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Mật khẩu mới</Text>
        <Text style={styles.subtitle}>Nhập mật khẩu mới cho tài khoản của bạn.</Text>

        <Input
          label="Mật khẩu mới"
          placeholder="Tối thiểu 8 ký tự"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          containerStyle={styles.input}
        />
        <Input
          label="Xác nhận mật khẩu mới"
          placeholder="Nhập lại mật khẩu"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          containerStyle={styles.input}
        />
        {error ? <Text style={styles.errText}>{error}</Text> : null}

        <Button title="Đặt lại mật khẩu" onPress={handleSubmit} loading={isLoading} disabled={isLoading} style={styles.btn} />
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
