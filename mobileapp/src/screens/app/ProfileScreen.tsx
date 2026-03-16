import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppSelector } from '@/store/hooks';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { Button, Input } from '@/components/ui';
import { useGetProfileQuery, useUpdateProfileMutation, useLogoutMutation } from '@/store/api/authApi';
import { useGetMyCertificatesQuery } from '@/store/api/certificateApi';
import { logout, updateUser, setPendingAuthRoute } from '@/store/slices/authSlice';
import { removeSecureItem } from '@/utils/secureStorage';
import { TOKEN_KEY } from '@/api/axiosInstance';
import { ROUTES } from '@/constants/routes';

const DEFAULT_AVATAR = null;
const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';

export const ProfileScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const token = useAppSelector(s => s.auth.token);
  const currentUser = useAppSelector(s => s.auth.user);
  const { data: certificates, isLoading: loadingCertificates } = useGetMyCertificatesQuery(undefined, {
    skip: !token,
  });
  const { data: user, isLoading: loadingProfile, error: profileError } = useGetProfileQuery(undefined, {
    skip: !token,
  });
  const [updateProfile, { isLoading: updating }] = useUpdateProfileMutation();
  const [logoutApi] = useLogoutMutation();

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY).then(v => setBiometricEnabled(v === 'true'));
    LocalAuthentication.hasHardwareAsync()
      .then(() => LocalAuthentication.isEnrolledAsync())
      .then(setBiometricAvailable);
  }, []);

  React.useEffect(() => {
    if (user) {
      setFullName(user.fullName ?? '');
      setBio(user.bio ?? '');
      setAvatarUri(user.avatar ?? null);
    }
  }, [user]);

  // Token hết hạn (401) → tự đăng xuất và chuyển về màn Login
  React.useEffect(() => {
    if (!profileError) return;
    const status = (profileError as { status?: number })?.status;
    if (status === 401) {
      dispatch(setPendingAuthRoute('Login'));
      dispatch(logout());
      void removeSecureItem(TOKEN_KEY);
    }
  }, [profileError, dispatch]);

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Cần quyền truy cập camera');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
          setAvatarUri(result.assets[0].uri);
          await updateProfile({ avatar: result.assets[0].uri }).unwrap();
          Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện.');
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Cần quyền truy cập thư viện ảnh');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
          setAvatarUri(result.assets[0].uri);
          await updateProfile({ avatar: result.assets[0].uri }).unwrap();
          Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện.');
        }
      }
    } catch (e) {
      console.warn('Image picker error', e);
      Alert.alert('Không thể chọn ảnh');
    }
  };

  const handleSave = async () => {
    try {
      const updated = await updateProfile({ fullName: fullName.trim(), bio: bio.trim() || undefined }).unwrap();
      dispatch(updateUser(updated));
      Alert.alert('Thành công', 'Đã cập nhật thông tin');
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật');
    }
  };

  const performLogout = () => {
    dispatch(setPendingAuthRoute('Login'));
    dispatch(logout());
    void removeSecureItem(TOKEN_KEY);
    logoutApi().catch(() => {});
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Đăng xuất để đăng nhập bằng tài khoản hoặc vai trò khác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => setTimeout(performLogout, 0),
        },
      ]
    );
  };

  if (!token || (loadingProfile && !user && !profileError)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const is401 = profileError && typeof profileError === 'object' && 'status' in profileError && profileError.status === 401;
  if (profileError && !user && !is401) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Không thể tải hồ sơ</Text>
        <Text style={styles.errorHint}>
          Token có thể hết hạn hoặc mất kết nối. Đăng xuất để đăng nhập lại.
        </Text>
        <Button title="Đăng xuất và về đăng nhập" onPress={handleLogout} variant="outline" style={{ marginTop: SPACING[4] }} />
      </View>
    );
  }
  if (is401) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const displayName = (user?.fullName ?? fullName) || 'Người dùng';
  const displayEmail = user?.email ?? '';
  const displayAvatar = avatarUri || user?.avatar || DEFAULT_AVATAR;
  const avatarInitial =
    (displayName && displayName.trim().charAt(0)) ||
    (displayEmail && displayEmail.trim().charAt(0)) ||
    'U';

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Hồ sơ</Text>

        <View style={styles.avatarSection}>
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Chọn ảnh', 'Chọn nguồn', [
                { text: 'Máy ảnh', onPress: () => pickImage('camera') },
                { text: 'Thư viện', onPress: () => pickImage('library') },
                { text: 'Hủy', style: 'cancel' },
              ])
            }
            activeOpacity={0.8}
          >
            {displayAvatar ? (
              <Image source={{ uri: displayAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{avatarInitial.toUpperCase()}</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Chạm để đổi ảnh đại diện</Text>
        </View>

        <Input
          label="Họ và tên"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Họ và tên"
          containerStyle={styles.input}
        />
        <Input
          label="Email"
          value={user?.email ?? ''}
          editable={false}
          containerStyle={styles.input}
        />
        <Input
          label="Giới thiệu"
          value={bio}
          onChangeText={setBio}
          placeholder="Giới thiệu ngắn về bạn"
          multiline
          numberOfLines={3}
          containerStyle={styles.input}
        />

        <TouchableOpacity
          style={[styles.menuRow, styles.paymentHistoryRow]}
          onPress={() => (navigation as any).navigate(ROUTES.PAYMENT_HISTORY as never)}
          activeOpacity={0.7}
        >
          <Text style={styles.paymentHistoryRowText}> Lịch sử thanh toán</Text>
          <Text style={styles.paymentHistoryRowArrow}>›</Text>
        </TouchableOpacity>

        

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Chứng chỉ của bạn</Text>
        </View>
        {loadingCertificates ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginBottom: SPACING[4] }} />
        ) : !certificates || certificates.length === 0 ? (
          <Text style={styles.emptyCertificatesText}>Bạn chưa có chứng chỉ nào.</Text>
        ) : (
          certificates.map(cert => {
            const course: any = (cert as any).courseId ?? null;
            const courseTitle = course?.title ?? 'Khóa học';
            const issuedAt = (cert as any).issuedAt;
            return (
              <View key={(cert as any)._id} style={styles.certificateCard}>
                <Text style={styles.certificateCourseTitle}>{courseTitle}</Text>
                <Text style={styles.certificateDate}>
                  Cấp ngày:{' '}
                  {issuedAt ? new Date(issuedAt).toLocaleDateString('vi-VN') : '—'}
                </Text>
              </View>
            );
          })
        )}

        <Button
          title={updating ? 'Đang lưu...' : 'Lưu thay đổi'}
          onPress={handleSave}
          loading={updating}
          disabled={updating}
          style={styles.saveBtn}
        />
        <TouchableOpacity
          style={[styles.menuRow, styles.logoutRow]}
          onPress={performLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutRowText}>Đăng xuất và đổi tài khoản</Text>
          <Text style={styles.menuRowArrow}>›</Text>
        </TouchableOpacity>
       
        {biometricAvailable && (
          <TouchableOpacity
            style={styles.checkRow}
            onPress={async () => {
              const next = !biometricEnabled;
              await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, next ? 'true' : 'false');
              setBiometricEnabled(next);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, biometricEnabled && styles.checkboxChecked]}>
              {biometricEnabled ? <Text style={styles.check}>✓</Text> : null}
            </View>
            <Text style={styles.checkLabel}>Đăng nhập bằng vân tay / Face ID</Text>
          </TouchableOpacity>
        )}

        
        
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  scroll: {
    paddingHorizontal: SPACING[5],
    paddingTop: SPACING[6],
    paddingBottom: SPACING[8],
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginBottom: SPACING[5],
  },
  errorHint: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING[6],
    marginBottom: SPACING[4],
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: SPACING[6],
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.gray200,
  },
  avatarFallback: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textInverse,
    fontWeight: '800',
  },
  avatarHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING[2],
  },
  input: {
    marginBottom: SPACING[4],
  },
  saveBtn: {
    marginBottom: SPACING[4],
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING[4],
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
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[2],
    marginBottom: SPACING[2],
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },
  menuRowText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
  },
  paymentHistoryRow: {
    backgroundColor: COLORS.primaryLight + '20',
    borderWidth: 1,
    borderColor: COLORS.primary + '50',
    marginBottom: SPACING[4],
    paddingVertical: SPACING[5],
  },
  paymentHistoryRowText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 16,
  },
  paymentHistoryRowArrow: {
    fontSize: 22,
    color: COLORS.primary,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: SPACING[4],
    marginBottom: SPACING[2],
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  certificateCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING[4],
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING[3],
  },
  certificateCourseTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: SPACING[1],
  },
  certificateDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  emptyCertificatesText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING[4],
  },
  logoutRow: {
    marginTop: SPACING[2],
    borderWidth: 1,
    borderColor: COLORS.error + '40',
  },
  logoutRowText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.error,
    fontWeight: '600',
  },
  menuRowArrow: {
    fontSize: 20,
    color: COLORS.gray400,
  },
});
