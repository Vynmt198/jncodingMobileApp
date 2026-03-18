import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/theme';
import { Card } from '@/components/ui';
import { useGetPaymentHistoryQuery } from '@/store/api/paymentsApi';
import type { PaymentHistoryItem, PaymentStatus } from '@/types/api.types';

const STATUS_LABEL: Record<PaymentStatus, string> = {
  success: 'Thành công',
  pending: 'Chờ xử lý',
  failed: 'Thất bại',
  cancelled: 'Đã hủy',
};

const STATUS_COLOR: Record<PaymentStatus, string> = {
  success: COLORS.success,
  pending: COLORS.warning,
  failed: COLORS.error,
  cancelled: COLORS.error,
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

const PAGE_LIMIT = 30;

export const PaymentHistoryScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data, isLoading, isError, refetch, isFetching } = useGetPaymentHistoryQuery(
    { page: 1, limit: PAGE_LIMIT },
    { skip: false }
  );

  const payments = data?.payments ?? [];

  const renderItem = ({ item }: { item: PaymentHistoryItem }) => {
    const status = (item.paymentStatus || 'pending') as PaymentStatus;
    return (
      <Card padding={4} style={styles.itemCard}>
        <View style={styles.itemRow}>
          <Text style={styles.itemOrderId} numberOfLines={1}>
            #{item.orderId}
          </Text>
          <View style={[styles.badge, { backgroundColor: STATUS_COLOR[status] + '20' }]}>
            <Text
              style={[styles.badgeText, { color: STATUS_COLOR[status] }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {STATUS_LABEL[status]}
            </Text>
          </View>
        </View>
        <Text style={styles.itemOrderInfo} numberOfLines={1}>
          {item.orderInfo || 'Thanh toán khóa học'}
        </Text>
        <View style={styles.itemFooter}>
          <Text style={styles.itemAmount}>{formatAmount(item.amount)}</Text>
          <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
        </View>
      </Card>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyIcon}>🧾</Text>
        <Text style={styles.emptyTitle}>Chưa có giao dịch</Text>
        <Text style={styles.emptySubtitle}>
          Lịch sử thanh toán của bạn sẽ hiển thị tại đây.
        </Text>
      </View>
    );
  };


  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backBtnText}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử thanh toán</Text>
        <Text style={styles.headerSubtitle}>
          Xem lại các giao dịch của bạn
        </Text>
      </View>

      <View style={styles.content}>
        {isLoading && !data ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : isError ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>Không thể tải. Thử lại.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryBtnText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={payments}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={[
              styles.listContent,
              payments.length === 0 && styles.listContentEmpty,
            ]}
            refreshControl={
              <RefreshControl
                refreshing={isFetching && !!data && payments.length > 0}
                onRefresh={() => refetch()}
                colors={[COLORS.primary]}
              />
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: SPACING[5],
    paddingBottom: SPACING[5],
    paddingTop: SPACING[4],
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: SPACING[2],
  },
  backBtnText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textInverse,
    opacity: 0.9,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textInverse,
    marginBottom: SPACING[1],
  },
  headerSubtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.gray200,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING[5],
    paddingTop: SPACING[4],
  },
  listContent: {
    paddingBottom: SPACING[8],
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  itemCard: {
    marginBottom: SPACING[4],
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[2],
  },
  itemOrderId: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: SPACING[2],
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: SPACING[2],
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  itemOrderInfo: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
    marginBottom: SPACING[2],
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemAmount: {
    ...TYPOGRAPHY.h5,
    color: COLORS.primary,
  },
  itemDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: SPACING[16],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING[4],
  },
  emptyTitle: {
    ...TYPOGRAPHY.h5,
    color: COLORS.textPrimary,
    marginBottom: SPACING[2],
  },
  emptySubtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING[6],
  },
  errorText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    marginBottom: SPACING[4],
  },
  retryBtn: {
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
  },
  retryBtnText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary,
  },
});
