import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { Button, Input, FadeInView } from '@/components/ui';
import { useLoginMutation } from '@/store/api/authApi';
import { setCredentials } from '@/store/slices/authSlice';
import { API_BASE_URL, TOKEN_KEY } from '@/api/axiosInstance';
import { setSecureItem } from '@/utils/secureStorage';
import { ROUTES } from '@/constants/routes';
import type { AuthStackParamList } from '@/types/navigation.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const REMEMBER_EMAIL_KEY = '@remember_email';
const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';

/** Map thông báo lỗi đăng nhập tiếng Anh từ backend sang tiếng Việt thân thiện hơn */
const mapLoginErrorToVietnamese = (message: string): string => {
  const map: Record<string, string> = {
    'Invalid email or password': 'Email hoặc mật khẩu không đúng',
    'Invalid credentials': 'Email hoặc mật khẩu không đúng',
    'User not found': 'Tài khoản không tồn tại',
    'Account is inactive': 'Tài khoản của bạn chưa được kích hoạt hoặc đã bị khóa',
    'Please provide a valid email address': 'Email không hợp lệ',
  };
  return map[message] ?? message;
};

/** Chuẩn hóa error object từ RTK Query / axios cho màn Login */
const getLoginErrorMessage = (err: unknown): string => {
  const e = err as Record<string, unknown>;
  const data =
    (e?.data as Record<string, unknown> | undefined) ??
    (e?.error as Record<string, unknown>)?.data ??
    (e?.payload as Record<string, unknown>)?.data;
  const status = (e?.status as number | undefined) ?? (e?.error as Record<string, unknown>)?.status;

  // Không có status + data là "Network Error" → lỗi kết nối thực sự (timeout, DNS...)
  if (status === undefined && (data === undefined || data === null || data === 'Network Error')) {
    return `Không thể kết nối máy chủ (base URL: ${API_BASE_URL}). Nếu chạy Android emulator, dùng http://10.0.2.2:<PORT>/api; nếu chạy máy thật, dùng IP LAN của máy tính. Kiểm tra EXPO_PUBLIC_API_BASE_URL trong file .env của mobileapp.`;
  }

  if (data && typeof data === 'object') {
    const body = data as { message?: string; errors?: Array<{ message?: string }> };
    const msg = body.message;
    const errors = body.errors;
    if (Array.isArray(errors) && errors.length > 0 && errors[0]?.message) {
      return mapLoginErrorToVietnamese(errors[0].message);
    }
    if (msg) return mapLoginErrorToVietnamese(msg);
  }

  if (typeof data === 'string') {
    return data;
  }

  return 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin hoặc thử lại sau.';
};

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [error, setError] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, typeof ROUTES.LOGIN>>();
  const dispatch = useDispatch();
  const route = useRoute<RouteProp<AuthStackParamList, typeof ROUTES.LOGIN>>();
  const registeredEmail = route.params?.registeredEmail;

  useEffect(() => {
    // Ưu tiên email vừa đăng ký (sau khi đăng ký xong chuyển sang Login)
    if (registeredEmail) {
      setEmail(registeredEmail);
      return;
    }
    AsyncStorage.getItem(REMEMBER_EMAIL_KEY).then(v => {
      if (v) setEmail(v);
    });
    AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY).then(v => {
      setBiometricEnabled(v === 'true');
    });
  }, [registeredEmail]);

  const validate = () => {
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Email không hợp lệ');
      return false;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return false;
    }
    setError('');
    return true;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      const data = await login({ email: email.trim(), password }).unwrap();
      await setSecureItem(TOKEN_KEY, data.token);
      dispatch(setCredentials({ user: data.user, token: data.token }));
      if (rememberMe) {
        await AsyncStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
      } else {
        await AsyncStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
    } catch (err: unknown) {
      const msg = getLoginErrorMessage(err);
      setError(msg);
      Alert.alert('Đăng nhập thất bại', msg);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'apple') => {
    const msg = 'Đăng nhập bằng ' + (provider === 'google' ? 'Google' : 'Apple') + ' đang được phát triển.';
    setError(msg);
    Alert.alert('Thông báo', msg);
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
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.subtitle}>Chào mừng bạn quay trở lại</Text>

          <Input
            label="Email"
            placeholder="email@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={styles.input}
          />
          <Input
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            containerStyle={styles.input}
          />
          {error ? <Text style={styles.errText}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe ? <Text style={styles.check}>✓</Text> : null}
            </View>
            <Text style={styles.checkLabel}>Ghi nhớ đăng nhập</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotWrap}
            onPress={() => navigation.navigate(ROUTES.FORGOT_PASSWORD)}
          >
            <Text style={styles.forgotLink}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <Button
            title="Đăng nhập"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.btn}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>hoặc</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn} onPress={() => handleSocialLogin('google')}>
              <Text style={styles.socialBtnText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} onPress={() => handleSocialLogin('apple')}>
              <Text style={styles.socialBtnText}>Apple</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate(ROUTES.REGISTER)}>
              <Text style={styles.registerLink}>Đăng ký</Text>
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
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING[2],
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
  checkLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: SPACING[6],
  },
  forgotLink: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
    fontWeight: '600',
  },
  btn: {
    marginBottom: SPACING[4],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING[4],
    gap: SPACING[3],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  socialRow: {
    flexDirection: 'row',
    gap: SPACING[3],
    marginBottom: SPACING[6],
  },
  socialBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialBtnText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
    fontWeight: '600',
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
  registerLink: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
