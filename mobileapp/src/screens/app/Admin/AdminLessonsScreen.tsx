import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/theme';
import { Card } from '@/components/ui';
import type { AppScreenProps } from '@/types/navigation.types';
import { ROUTES } from '@/constants/routes';
import {
  useGetContentLessonsQuery,
  usePatchLessonVisibilityMutation,
} from '@/store/api/adminApi';
import type { AdminLessonListItem } from '@/store/api/adminApi';

type ScreenProps = AppScreenProps<typeof ROUTES.ADMIN_LESSONS>;

const PAGE_SIZE = 20;

export const AdminLessonsScreen: React.FC<ScreenProps> = ({ navigation }) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useGetContentLessonsQuery({
    page,
    limit: PAGE_SIZE,
    ...(search.trim() && { search: search.trim() }),
  });
  const [patchVisibility, { isLoading: isPatching }] = usePatchLessonVisibilityMutation();

  const lessons = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleVisibilityToggle = (lesson: AdminLessonListItem) => {
    patchVisibility({ lessonId: lesson._id })
      .unwrap()
      .then(() => refetch())
      .catch(() => Alert.alert('Lỗi', 'Không thể cập nhật hiển thị bài học'));
  };

  const renderLessonItem = ({ item }: { item: AdminLessonListItem }) => {
    const isVisible = !(item.isHidden ?? !item.isVisible ?? false);
    return (
      <Card padding={4} shadowLevel="sm" style={styles.lessonCard}>
        <View style={styles.lessonRow}>
          <View style={styles.lessonInfo}>
            <Text style={styles.lessonTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.lessonMeta}>
              {item.courseTitle || item.courseId} • Thứ tự: {item.order ?? '—'}
            </Text>
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{isVisible ? 'Hiển thị' : 'Ẩn'}</Text>
            <Switch
              value={isVisible}
              onValueChange={() => handleVisibilityToggle(item)}
              disabled={isPatching}
              trackColor={{ false: COLORS.gray400, true: COLORS.primaryLight }}
              thumbColor={isVisible ? COLORS.primary : COLORS.gray300}
            />
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nội dung – Bài học</Text>
      </View>
      <Text style={styles.subtitle}>Bật/tắt hiển thị bài học với người học</Text>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Tìm theo tên bài học..."
          placeholderTextColor={COLORS.gray400}
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          <FlatList
            data={lessons}
            keyExtractor={item => item._id}
            renderItem={renderLessonItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Không có bài học nào.</Text>
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
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, fontWeight: '700', flex: 1 },
  subtitle: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, marginTop: 4 },
  searchContainer: { marginBottom: SPACING[3] },
  searchInput: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    backgroundColor: COLORS.surface,
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textPrimary,
  },
  listContent: { paddingVertical: SPACING[4], paddingBottom: SPACING[10] },
  loadingWrap: { paddingVertical: SPACING[10], alignItems: 'center' },
  emptyText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING[6],
  },
  lessonCard: { marginBottom: SPACING[3] },
  lessonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lessonInfo: { flex: 1, marginRight: SPACING[3] },
  lessonTitle: { ...TYPOGRAPHY.label, color: COLORS.textPrimary, fontWeight: '600' },
  lessonMeta: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 4 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING[2] },
  switchLabel: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
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
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pageBtnDisabled: { opacity: 0.5 },
  pageBtnText: { ...TYPOGRAPHY.bodySmall, color: COLORS.primary, fontWeight: '600' },
  pageText: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary },
});
