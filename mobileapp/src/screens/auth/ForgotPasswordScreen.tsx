import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { Button, Input, FadeInView } from '@/components/ui';
import { useForgotPasswordMutation } from '@/store/api/authApi';
import { ROUTES } from '@/constants/routes';
import type { AuthStackParamList } from '@/types/navigation.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, typeof ROUTES.FORGOT_PASSWORD>>();

  const validate = () => {
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Email không hợp lệ');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await forgotPassword({ email: email.trim() }).unwrap();
      setSent(true);
      Alert.alert('Thành công', 'Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (và thư mục spam).');
    } catch {
      setError('Gửi thất bại. Vui lòng thử lại.');
      Alert.alert('Thất bại', 'Gửi email thất bại. Vui lòng kiểm tra email và thử lại.');
    }
  };

  const goToOtp = () => {
    navigation.navigate(ROUTES.OTP_VERIFICATION, { email: email.trim() });
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <FadeInView style={{ flex: 1 }} duration={400} slide>
        <View style={styles.sentBlock}>
          <Text style={styles.sentTitle}>Kiểm tra email</Text>
          <Text style={styles.sentText}>
            Chúng tôi đã gửi link đặt lại mật khẩu đến {email}. Vui lòng kiểm tra hộp thư (và thư mục spam).
          </Text>
          <Text style={styles.sentHint}>Nếu bạn nhận được mã đặt lại trong email, nhấn bên dưới để nhập mã.</Text>
          <Button title="Tôi đã có mã đặt lại" onPress={goToOtp} variant="outline" style={styles.btn} />
          <Button
            title="Quay lại đăng nhập"
            onPress={() => navigation.goBack()}
            variant="ghost"
            style={styles.btn}
          />
        </View>
        </FadeInView>
      </View>
    );
  }

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
          <Text style={styles.title}>Quên mật khẩu</Text>
          <Text style={styles.subtitle}>Nhập email đăng ký, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.</Text>
          <Input
            label="Email"
            placeholder="email@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            containerStyle={styles.input}
          />
          {error ? <Text style={styles.errText}>{error}</Text> : null}
          <Button title="Gửi link đặt lại" onPress={handleSubmit} loading={isLoading} disabled={isLoading} style={styles.btn} />
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
  sentBlock: {
    flex: 1,
    paddingHorizontal: SPACING[5],
    paddingTop: 48,
  },
  sentTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING[3],
  },
  sentText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    marginBottom: SPACING[4],
    lineHeight: 22,
  },
  sentHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING[6],
  },
});
