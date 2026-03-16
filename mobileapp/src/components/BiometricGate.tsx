import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { Button } from '@/components/ui';

const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';

type Props = {
  children: React.ReactNode;
};

export function BiometricGate({ children }: Props) {
  const [status, setStatus] = useState<'checking' | 'disabled' | 'prompt' | 'authenticated'>('checking');
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [enabled, hasHardware, compatible] = await Promise.all([
          Promise.resolve(true),
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
        ]);
        if (!mounted) return;
        const available = hasHardware && compatible;
        setBiometricAvailable(available);
        if (!enabled || !available) {
          setStatus('authenticated');
          return;
        }
        setStatus('prompt');
      } catch {
        if (mounted) setStatus('authenticated');
      }
    })();
    return () => { mounted = false; };
  }, []);

  const runBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Xác thực để tiếp tục',
        cancelLabel: 'Hủy',
      });
      if (result.success) {
        setStatus('authenticated');
      }
    } catch {
      setStatus('authenticated');
    }
  };

  useEffect(() => {
    if (status === 'prompt' && biometricAvailable) {
      runBiometric();
    }
  }, [status, biometricAvailable]);

  const handleUsePassword = () => {
    setStatus('authenticated');
  };

  if (status === 'checking') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (status === 'authenticated') {
    return <>{children}</>;
  }

  return (
    <View style={styles.centered}>
      <Text style={styles.title}>Xác thực vân tay / Face ID</Text>
      <Text style={styles.hint}>Vui lòng xác thực để tiếp tục sử dụng ứng dụng</Text>
      <Button title="Thử lại" onPress={runBiometric} style={styles.btn} />
      <Button title="Đăng nhập bằng mật khẩu" onPress={handleUsePassword} variant="ghost" />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING[6],
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING[2],
    textAlign: 'center',
  },
  hint: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    marginBottom: SPACING[6],
    textAlign: 'center',
  },
  btn: {
    marginBottom: SPACING[3],
    minWidth: 200,
  },
});
