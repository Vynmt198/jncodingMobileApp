import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/theme';
import { EnrolledCourseCard } from '@/components/EnrolledCourseCard';
import { useGetMyEnrollmentsQuery } from '@/store/api/enrollmentsApi';
import { ROUTES } from '@/constants/routes';
import type { AppStackParamList } from '@/types/navigation.types';
import type { MyEnrollmentItem } from '@/types/api.types';
import { useAppSelector } from '@/store/hooks';

type FilterType = 'all' | 'in_progress' | 'completed';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'in_progress', label: 'Đang học' },
  { key: 'completed', label: 'Hoàn thành' },
];

export const MyCoursesScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList, 'MainTabs'>>();
  const token = useAppSelector(s => s.auth.token);
  const { data, isLoading, isError, refetch, isFetching } = useGetMyEnrollmentsQuery(undefined, {
    skip: !token,
  });
  const [filter, setFilter] = useState<FilterType>('all');

  const enrollments = data?.enrollments ?? [];
  const filteredList = useMemo(() => {
    if (filter === 'all') return enrollments;
    if (filter === 'in_progress') {
      return enrollments.filter((e: MyEnrollmentItem) => (e.progress ?? 0) < 100);
    }
    return enrollments.filter((e: MyEnrollmentItem) => (e.progress ?? 0) >= 100);
  }, [enrollments, filter]);

  const handleCoursePress = (courseId: string) => {
    navigation.navigate(ROUTES.COURSE_DETAIL, { courseId });
  };

  const handleContinuePress = (courseId: string) => {
    navigation.navigate(ROUTES.COURSE_PLAYER, { courseId, lessonId: undefined });
  };

  const renderItem = ({ item }: { item: MyEnrollmentItem }) => {
    const courseId =
      typeof item.courseId === 'object' && item.courseId !== null
        ? (item.courseId as { _id: string })._id
        : String(item.courseId);
    return (
      <EnrolledCourseCard
        enrollment={item}
        onPress={() => handleCoursePress(courseId)}
        onContinuePress={() => handleContinuePress(courseId)}
      />
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>Chưa có khóa học nào</Text>
        <Text style={styles.emptySubtitle}>
          Đăng ký khóa học từ trang chủ để bắt đầu học tập.
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Khoá học của tôi</Text>
        <Text style={styles.headerSubtitle}>
          Tiếp tục học tập của bạn
        </Text>
        <View style={styles.chipRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, filter === f.key && styles.chipActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.content}>
        {isLoading && !data ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : isError ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>Không thể tải danh sách. Thử lại.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryBtnText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredList}
            keyExtractor={item => item._id}
            renderItem={renderItem}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={[
              styles.listContent,
              filteredList.length === 0 && styles.listContentEmpty,
            ]}
            refreshControl={
              <RefreshControl
                refreshing={isFetching && !!data}
                onRefresh={refetch}
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
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textInverse,
    marginBottom: SPACING[1],
  },
  headerSubtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.gray200,
    marginBottom: SPACING[4],
  },
  chipRow: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  chip: {
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  chipActive: {
    backgroundColor: COLORS.white,
  },
  chipText: {
    ...TYPOGRAPHY.label,
    color: COLORS.textInverse,
  },
  chipTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '600',
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING[5],
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
