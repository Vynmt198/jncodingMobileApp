import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/theme';
import { Button, Card } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import type { AppStackParamList } from '@/types/navigation.types';
import { useGetPaymentDetailQuery } from '@/store/api/paymentsApi';

type PaymentSuccessRouteProp = RouteProp<AppStackParamList, typeof ROUTES.PAYMENT_SUCCESS>;
type PaymentSuccessNavProp = NativeStackNavigationProp<AppStackParamList, typeof ROUTES.PAYMENT_SUCCESS>;

export const PaymentSuccessScreen = () => {
  const navigation = useNavigation<PaymentSuccessNavProp>();
  const route = useRoute<PaymentSuccessRouteProp>();
  const { courseId, orderId } = route.params ?? { courseId: '', orderId: '' };
  const { data: paymentDetail } = useGetPaymentDetailQuery(orderId ?? '', {
    skip: !orderId,
  });
  const payment = paymentDetail?.payment;

  const handleStartLearning = () => {
    // Sau khi thanh toán, ưu tiên đưa user về tab "Khoá học của tôi"
    (navigation as any).navigate('MainTabs', { screen: ROUTES.MY_COURSES });
  };

  const handleDownloadInvoice = () => {
    if (orderId) {
      // Backend có GET /payments/:orderId; khi có PDF URL có thể mở Linking.openURL(pdfUrl)
      Alert.alert(
        'Tải hóa đơn',
        'Bạn có thể xem chi tiết giao dịch tại mục Lịch sử thanh toán trong Hồ sơ. Tính năng tải PDF sẽ có trong bản cập nhật.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>✓</Text>
        </View>
        <Text style={styles.title}>Thanh toán thành công</Text>
        <Text style={styles.subtitle}>
          Bạn đã mua khóa học thành công. Bắt đầu học ngay!
        </Text>
      </View>

      <Card padding={5} style={styles.card}>
        <Text style={styles.cardTitle}>Thông tin đơn hàng</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Mã đơn hàng</Text>
          <Text style={styles.value} numberOfLines={1}>{payment?.orderId || orderId || '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Số tiền</Text>
          <Text style={styles.value} numberOfLines={1}>
            {payment ? `${payment.amount.toLocaleString('vi-VN')}₫` : '—'}
          </Text>
        </View>
        {courseId ? (
          <View style={styles.row}>
            <Text style={styles.label}>Khóa học</Text>
            <Text style={styles.value} numberOfLines={1}>Đã kích hoạt</Text>
          </View>
        ) : null}
      </Card>

      <View style={styles.actions}>
        <Button
          title="Bắt đầu học"
          onPress={handleStartLearning}
          style={styles.primaryBtn}
        />
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={handleDownloadInvoice}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryBtnText}>Tải hóa đơn</Text>
        </TouchableOpacity>
        <Button
          title="Về trang chủ"
          variant="outline"
          onPress={() => (navigation as any).navigate('MainTabs', { screen: ROUTES.MY_COURSES })}
          style={styles.homeBtn}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING[5],
    paddingTop: SPACING[10],
    paddingBottom: SPACING[8],
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING[8],
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[4],
  },
  icon: {
    fontSize: 36,
    color: COLORS.success,
    fontWeight: '700',
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING[2],
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING[4],
  },
  card: {
    marginBottom: SPACING[6],
  },
  cardTitle: {
    ...TYPOGRAPHY.h5,
    color: COLORS.textPrimary,
    marginBottom: SPACING[4],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING[2],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  label: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
  },
  value: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
    fontWeight: '600',
    flex: 1,
    marginLeft: SPACING[3],
    textAlign: 'right',
  },
  actions: {
    gap: SPACING[4],
  },
  primaryBtn: {
    marginBottom: 0,
  },
  secondaryBtn: {
    paddingVertical: SPACING[3],
    alignItems: 'center',
  },
  secondaryBtnText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary,
  },
  homeBtn: {
    marginTop: SPACING[2],
  },
});
