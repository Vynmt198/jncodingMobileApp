import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/theme';
import { Button, Card } from '@/components/ui';
import { useCreatePaymentMutation } from '@/store/api/paymentsApi';
import { ROUTES } from '@/constants/routes';
import type { AppStackParamList } from '@/types/navigation.types';

type PaymentRouteProp = RouteProp<AppStackParamList, typeof ROUTES.PAYMENT>;
type PaymentNavProp = NativeStackNavigationProp<AppStackParamList, typeof ROUTES.PAYMENT>;

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export const PaymentScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<PaymentNavProp>();
  const route = useRoute<PaymentRouteProp>();
  const { courseId, courseTitle, price } = route.params ?? { courseId: '', courseTitle: '', price: 0 };

  const [createPayment, { isLoading: processing }] = useCreatePaymentMutation();

  const handlePayWithVNPay = async () => {
    if (!courseId || price <= 0) {
      Alert.alert('Lỗi', 'Thông tin khóa học không hợp lệ.');
      return;
    }
    try {
      const { paymentUrl, orderId } = await createPayment({ courseId, amount: price }).unwrap();
      if (paymentUrl) {
        const canOpen = await Linking.canOpenURL(paymentUrl);
        if (canOpen) {
          await Linking.openURL(paymentUrl);
          Alert.alert(
            'Chuyển đến thanh toán',
            'Sau khi thanh toán xong trên trình duyệt, quay lại app và kiểm tra "Khoá học của tôi" hoặc màn hình thành công.',
            [
              { text: 'OK', onPress: () => navigation.goBack() },
              { text: 'Xem đơn hàng', onPress: () => navigation.navigate(ROUTES.PAYMENT_SUCCESS, { courseId, orderId }) },
            ]
          );
        } else {
          Alert.alert('Lỗi', 'Không thể mở link thanh toán. Vui lòng thử lại.');
        }
      } else {
        Alert.alert('Lỗi', 'Không nhận được link thanh toán từ máy chủ.');
      }
    } catch (err: any) {
      const msg = err?.data?.message ?? err?.message ?? 'Tạo thanh toán thất bại. Thử lại.';
      Alert.alert('Lỗi', msg);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Quay lại</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Thanh toán</Text>
        <Text style={styles.subtitle}>Xem lại và xác nhận thanh toán khóa học</Text>

        <Card padding={5} style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin khóa học</Text>
          <Text style={styles.courseName} numberOfLines={2}>{courseTitle || 'Khóa học'}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tổng thanh toán</Text>
            <Text style={styles.priceValue}>{formatPrice(price)}</Text>
          </View>
        </Card>

        <View style={styles.methods}>
          <Text style={styles.methodTitle}>Phương thức thanh toán</Text>
          <TouchableOpacity
            style={[styles.methodBtn, processing && styles.methodBtnDisabled]}
            onPress={handlePayWithVNPay}
            disabled={processing}
            activeOpacity={0.8}
          >
            {processing ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <>
                <Text style={styles.methodBtnText}>Thanh toán qua VNPay</Text>
                <Text style={styles.methodBtnHint}>Chuyển hướng đến cổng thanh toán VNPay</Text>
              </>
            )}
          </TouchableOpacity>
          <View style={styles.placeholderRow}>
            <Text style={styles.placeholderText}>Apple Pay / Google Pay — Sắp ra mắt</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    paddingHorizontal: SPACING[5],
    paddingBottom: SPACING[8],
  },
  backRow: {
    alignSelf: 'flex-start',
    marginBottom: SPACING[4],
  },
  backText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
    fontWeight: '600',
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING[1],
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    marginBottom: SPACING[6],
  },
  card: {
    marginBottom: SPACING[6],
  },
  cardTitle: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    marginBottom: SPACING[2],
    textTransform: 'uppercase',
  },
  courseName: {
    ...TYPOGRAPHY.h5,
    color: COLORS.textPrimary,
    marginBottom: SPACING[4],
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING[4],
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  priceLabel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
  },
  priceValue: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
    fontWeight: '700',
  },
  methods: {
    marginTop: SPACING[2],
  },
  methodTitle: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    marginBottom: SPACING[4],
  },
  methodBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING[5],
    marginBottom: SPACING[4],
  },
  methodBtnDisabled: {
    opacity: 0.7,
  },
  methodBtnText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary,
    marginBottom: SPACING[1],
  },
  methodBtnHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  placeholderRow: {
    padding: SPACING[4],
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.gray50,
  },
  placeholderText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textDisabled,
    textAlign: 'center',
  },
});
