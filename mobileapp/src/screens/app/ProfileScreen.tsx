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
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { Button, Input } from '@/components/ui';
import { useGetProfileQuery, useUpdateProfileMutation, useLogoutMutation } from '@/store/api/authApi';
import { logout, updateUser } from '@/store/slices/authSlice';
import { removeSecureItem } from '@/utils/secureStorage';
import { TOKEN_KEY } from '@/api/axiosInstance';

const DEFAULT_AVATAR = 'https://via.placeholder.com/120?text=Avatar';
const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';

export const ProfileScreen = () => {
  const dispatch = useDispatch();
  const { data: user, isLoading: loadingProfile, error: profileError } = useGetProfileQuery(undefined, { skip: false });
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

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          try {
            await logoutApi().unwrap();
          } catch {
            // ignore
          }
          await removeSecureItem(TOKEN_KEY);
          dispatch(logout());
        },
      },
    ]);
  };

  if (loadingProfile && !user && !profileError) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (profileError && !user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Không thể tải hồ sơ</Text>
        <Button title="Đăng xuất" onPress={handleLogout} variant="outline" style={{ marginTop: SPACING[4] }} />
      </View>
    );
  }

  const displayName = (user?.fullName ?? fullName) || 'Người dùng';
  const displayAvatar = avatarUri || user?.avatar || DEFAULT_AVATAR;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Hồ sơ</Text>

        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={() => Alert.alert('Chọn ảnh', 'Chọn nguồn', [
            { text: 'Máy ảnh', onPress: () => pickImage('camera') },
            { text: 'Thư viện', onPress: () => pickImage('library') },
            { text: 'Hủy', style: 'cancel' },
          ])}>
            <Image source={{ uri: displayAvatar }} style={styles.avatar} />
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

        <Button
          title={updating ? 'Đang lưu...' : 'Lưu thay đổi'}
          onPress={handleSave}
          loading={updating}
          disabled={updating}
          style={styles.saveBtn}
        />
        <Button title="Đăng xuất" onPress={handleLogout} variant="outline" />
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
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING[6],
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
});
