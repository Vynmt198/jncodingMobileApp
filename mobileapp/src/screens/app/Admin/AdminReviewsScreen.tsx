import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { Card } from '@/components/ui';
import type { AppScreenProps } from '@/types/navigation.types';
import { ROUTES } from '@/constants/routes';
import { useGetContentReviewsQuery } from '@/store/api/adminApi';
import type { AdminReviewListItem } from '@/store/api/adminApi';

type ScreenProps = AppScreenProps<typeof ROUTES.ADMIN_REVIEWS>;

const PAGE_SIZE = 20;

export const AdminReviewsScreen: React.FC<ScreenProps> = ({ navigation }) => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetContentReviewsQuery({ page, limit: PAGE_SIZE });
  const reviews = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const renderReviewItem = ({ item }: { item: AdminReviewListItem }) => (
    <Card padding={4} shadowLevel="sm" style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewUser}>{item.userName || item.userId || 'Ẩn danh'}</Text>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>★ {item.rating}</Text>
        </View>
      </View>
      {item.courseTitle && (
        <Text style={styles.courseTitle} numberOfLines={1}>
          Khóa: {item.courseTitle}
        </Text>
      )}
      {item.comment ? (
        <Text style={styles.comment} numberOfLines={4}>
          {item.comment}
        </Text>
      ) : null}
      {item.createdAt && (
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString('vi-VN')}
        </Text>
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đánh giá</Text>
      </View>
      <Text style={styles.subtitle}>Xem đánh giá khóa học từ người học</Text>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          <FlatList
            data={reviews}
            keyExtractor={item => item._id}
            renderItem={renderReviewItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Chưa có đánh giá nào.</Text>
            }
          />
          {totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                onPress={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <Text style={styles.pageBtnText}>Trước</Text>
              </TouchableOpacity>
              <Text style={styles.pageText}>
                {page} / {totalPages}
              </Text>
              <TouchableOpacity
                style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
                onPress={() => setPage(p => p + 1)}
                disabled={page >= totalPages}
              >
                <Text style={styles.pageBtnText}>Sau</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING[6],
    paddingTop: SPACING[8],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
    marginBottom: SPACING[2],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 22, color: COLORS.textPrimary, fontWeight: '700', marginTop: -2 },
  headerTitle: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, fontWeight: '700', flex: 1 },
  subtitle: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, marginTop: 4 },
  listContent: { paddingVertical: SPACING[4], paddingBottom: SPACING[10] },
  loadingWrap: { paddingVertical: SPACING[10], alignItems: 'center' },
  emptyText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING[6],
  },
  reviewCard: { marginBottom: SPACING[3] },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewUser: { ...TYPOGRAPHY.label, color: COLORS.textPrimary, fontWeight: '600' },
  ratingBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    borderRadius: 8,
  },
  ratingText: { ...TYPOGRAPHY.caption, color: COLORS.primaryDark, fontWeight: '600' },
  courseTitle: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 4 },
  comment: { ...TYPOGRAPHY.bodySmall, color: COLORS.textPrimary, marginTop: SPACING[2] },
  date: { ...TYPOGRAPHY.caption, color: COLORS.gray400, marginTop: SPACING[2] },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[3],
    paddingVertical: SPACING[4],
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  pageBtn: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pageBtnDisabled: { opacity: 0.5 },
  pageBtnText: { ...TYPOGRAPHY.bodySmall, color: COLORS.primary, fontWeight: '600' },
  pageText: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary },
});
