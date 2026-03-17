import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, TextInput } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { Button, FadeInView } from '@/components/ui';
import { useRegisterMutation } from '@/store/api/authApi';
import { API_BASE_URL } from '@/api/axiosInstance';
import { ROUTES } from '@/constants/routes';
import type { AuthStackParamList } from '@/types/navigation.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const getPasswordStrength = (pwd: string): { level: number; label: string } => {
  if (!pwd) return { level: 0, label: '' };
  let level = 0;
  if (pwd.length >= 8) level++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) level++;
  if (/\d/.test(pwd)) level++;
  if (/[^a-zA-Z0-9]/.test(pwd)) level++;
  const labels = ['Yếu', 'Trung bình', 'Khá', 'Mạnh'];
  return { level, label: labels[level - 1] ?? '' };
};

/** Map thông báo lỗi validation tiếng Anh từ backend sang tiếng Việt */
const mapBackendErrorToVietnamese = (message: string): string => {
  const map: Record<string, string> = {
    'Validation failed': 'Thông tin không hợp lệ',
    'Please provide a valid email address': 'Email không hợp lệ',
    'Email is already registered.': 'Email này đã được đăng ký.',
    'Password must be at least 8 characters': 'Mật khẩu tối thiểu 8 ký tự',
    'Password must contain at least one uppercase letter': 'Mật khẩu cần ít nhất một chữ in hoa',
    'Password must contain at least one lowercase letter': 'Mật khẩu cần ít nhất một chữ thường',
    'Password must contain at least one number': 'Mật khẩu cần ít nhất một chữ số',
    'Full name is required': 'Vui lòng nhập họ tên',
    'Full name cannot exceed 100 characters': 'Họ tên không quá 100 ký tự',
  };
  return map[message] ?? message;
};

/** Lấy thông báo lỗi từ nhiều dạng response (RTK Query / axios) */
const getErrorMessage = (err: unknown): string => {
  const e = err as Record<string, unknown>;
  const data =
    (e?.data as Record<string, unknown> | undefined) ??
    (e?.error as Record<string, unknown>)?.data ??
    (e?.payload as Record<string, unknown>)?.data;
  const status = (e?.status as number | undefined) ?? (e?.error as Record<string, unknown>)?.status;

  // Chỉ coi là lỗi mạng khi status không có và message thực sự là lỗi kết nối
  if (
    e?.status === undefined &&
    status === undefined &&
    (data === undefined || data === null || data === 'Network Error')
  ) {
    return `Không thể kết nối máy chủ (base URL: ${API_BASE_URL}). Nếu chạy Android emulator, dùng http://10.0.2.2:<PORT>/api; nếu chạy máy thật, dùng IP LAN của máy tính. Kiểm tra EXPO_PUBLIC_API_BASE_URL trong file .env của mobileapp.`;
  }

  // 409 Conflict = email đã được đăng ký
  if (status === 409) {
    const msg = data && typeof data === 'object' ? (data as { message?: string }).message : undefined;
    return msg ? mapBackendErrorToVietnamese(msg) : 'Email này đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập.';
  }

  if (data && typeof data === 'object') {
    const body = data as { message?: string; errors?: Array<{ message?: string }> };
    const msg = body.message;
    const errors = body.errors;
    if (Array.isArray(errors) && errors.length > 0 && errors[0]?.message) {
      return mapBackendErrorToVietnamese(errors[0].message);
    }
    if (msg) return mapBackendErrorToVietnamese(msg);
  }

  return 'Đăng ký thất bại. Vui lòng thử lại.';
};

export const RegisterScreen = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [register, { isLoading }] = useRegisterMutation();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, typeof ROUTES.REGISTER>>();

  const strength = getPasswordStrength(password);

  const validate = () => {
    if (!fullName.trim()) {
      setError('Vui lòng nhập họ tên');
      return false;
    }
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Vui lòng nhập email');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Email không hợp lệ');
      return false;
    }
    if (password.length < 8) {
      setError('Mật khẩu tối thiểu 8 ký tự');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Mật khẩu cần ít nhất một chữ in hoa');
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setError('Mật khẩu cần ít nhất một chữ thường');
      return false;
    }
    if (!/[0-9]/.test(password)) {
      setError('Mật khẩu cần ít nhất một chữ số');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return false;
    }
    if (!acceptedTerms) {
      setError('Vui lòng đồng ý với Điều khoản sử dụng');
      return false;
    }
    setError('');
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setError('');
    try {
      const payload = {
        fullName: fullName.trim(),
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      };
      await register(payload).unwrap();
      navigation.replace(ROUTES.REGISTER_SUCCESS, { email: payload.email });
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setError(msg);
      Alert.alert('Đăng ký thất bại', msg);
    }
  };

  const Container = Platform.OS === 'ios' ? KeyboardAvoidingView : View;

  return (
    <Container
      style={styles.container}
      {...(Platform.OS === 'ios'
        ? {
            behavior: 'padding' as const,
            keyboardVerticalOffset: 60,
          }
        : {})}
    >
      <FadeInView style={styles.fadeWrap} duration={500} slide>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Đăng ký</Text>
          <Text style={styles.subtitle}>Tạo tài khoản để bắt đầu học</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Họ và tên</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Nguyễn Văn A"
              placeholderTextColor={COLORS.gray400}
              value={fullName}
              onChangeText={setFullName}
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.textInput}
              placeholder="email@example.com"
              placeholderTextColor={COLORS.gray400}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mật khẩu</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Tối thiểu 8 ký tự, có chữ hoa, thường và số"
              placeholderTextColor={COLORS.gray400}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>
          {password.length > 0 && (
            <View style={styles.strengthWrap}>
              <View style={[styles.strengthBar, { width: `${(strength.level / 4) * 100}%` }]} />
              <Text style={styles.strengthText}>{strength.label}</Text>
            </View>
          )}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Nhập lại mật khẩu"
              placeholderTextColor={COLORS.gray400}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              returnKeyType="done"
            />
          </View>
          {error ? <Text style={styles.errText}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
              {acceptedTerms ? <Text style={styles.check}>✓</Text> : null}
            </View>
            <Text style={styles.termsText}>
              Tôi đồng ý với <Text style={styles.termsLink}>Điều khoản sử dụng</Text> và{' '}
              <Text style={styles.termsLink}>Chính sách bảo mật</Text>
            </Text>
          </TouchableOpacity>

          <Button
            title="Đăng ký"
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading}
            style={styles.btn}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate(ROUTES.LOGIN)}>
              <Text style={styles.loginLink}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </FadeInView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  fadeWrap: { flex: 1 },
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
    marginBottom: SPACING[6],
  },
  input: {
    marginBottom: SPACING[4],
  },
  inputGroup: {
    marginBottom: SPACING[4],
  },
  inputLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    marginBottom: SPACING[2],
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING[3],
    height: 48,
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
  },
  strengthWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING[2],
    gap: SPACING[2],
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    maxWidth: 120,
  },
  strengthText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  errText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    marginBottom: SPACING[2],
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING[6],
    gap: SPACING[2],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.gray400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  check: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  termsText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    flex: 1,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  btn: {
    marginBottom: SPACING[6],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
  },
  loginLink: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
