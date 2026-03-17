import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import type { AppScreenProps } from '@/types/navigation.types';
import { ROUTES } from '@/constants/routes';
import { Card } from '@/components/ui';
import { Select } from '@/components/ui/Select';
import { useGetCourseAnalyticsQuery, useGetMyCoursesQuery } from '@/store/api/instructorApi';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenProps = AppScreenProps<typeof ROUTES.INSTRUCTOR_ANALYTICS>;

export const InstructorAnalyticsScreen: React.FC<ScreenProps> = () => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isSmall = width < 380 || height < 700;
  const padX = isSmall ? SPACING[4] : SPACING[6];
  const padTop = Math.max(insets.top, isSmall ? 10 : 14);

  const { data: myCoursesData, isLoading: loadingCourses } = useGetMyCoursesQuery({ page: 1, limit: 50 });
  const courses = myCoursesData?.courses ?? [];
  const [courseId, setCourseId] = React.useState<string>('');

  React.useEffect(() => {
    if (courseId) return;
    if (courses[0]?._id) setCourseId(courses[0]._id);
  }, [courses, courseId]);

  const { data, isLoading, isError } = useGetCourseAnalyticsQuery(courseId, { skip: !courseId } as any);

  const formatSeconds = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h} giờ ${m} phút`;
    return `${m} phút`;
  };

  return (
    <View style={[styles.container, { paddingHorizontal: padX, paddingTop: padTop }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, isSmall && styles.titleSmall]}>Course Analytics</Text>
        <Text style={[styles.subtitle, isSmall && styles.subtitleSmall]}>
          Chọn 1 khoá học để xem thống kê.
        </Text>

        <Text style={styles.label}>Khoá học</Text>
        {loadingCourses ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tải danh sách khoá...</Text>
          </View>
        ) : (
          <Select
            value={courseId}
            onChange={val => setCourseId(String(val))}
            placeholder="Chọn khoá học"
            options={courses.map(c => ({ label: c.title, value: c._id }))}
          />
        )}

        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        )}

        {isError && !isLoading && (
          <Text style={styles.errorText}>Không thể tải dữ liệu phân tích.</Text>
        )}

        {data && (
          <>
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{data.courseTitle}</Text>
              <Text style={styles.metricHint}>Mã khoá: {data.courseId}</Text>
            </Card>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Học viên đang active</Text>
              <Text style={styles.metricValue}>{data.totalEnrollments.toLocaleString('vi-VN')}</Text>
              <Text style={styles.metricHint}>
                Bài học: {data.totalLessons.toLocaleString('vi-VN')} • Hoàn thành: {data.totalCompletedLessons.toLocaleString('vi-VN')}
              </Text>
            </Card>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Tỉ lệ hoàn thành</Text>
              <Text style={styles.metricValue}>{Math.round(data.completionRatePercent)}%</Text>
              <Text style={styles.metricHint}>Dựa trên tổng số bài hoàn thành / tổng kỳ vọng</Text>
              <Text style={[styles.itemText, { marginTop: SPACING[2] }]}>
                Tỉ lệ thời gian học: {Math.round(data.timeSpentRatePercent)}%
              </Text>
              <Text style={styles.itemText}>
                Tổng thời gian học: {formatSeconds(data.totalTimeSpentSeconds)}
              </Text>
              <Text style={styles.itemText}>
                Thời gian kỳ vọng: {formatSeconds(data.expectedTimeSeconds)}
              </Text>
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: SPACING[8],
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginBottom: SPACING[2],
  },
  titleSmall: {
    fontSize: 18,
    lineHeight: 24,
    marginBottom: SPACING[1],
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING[5],
  },
  subtitleSmall: {
    marginBottom: SPACING[4],
  },
  label: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    marginBottom: SPACING[2],
  },
  sectionCard: {
    marginBottom: SPACING[4],
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginBottom: SPACING[2],
  },
  metricValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: SPACING[1],
  },
  metricHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  itemText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING[1],
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING[4],
    gap: SPACING[2],
  },
  loadingText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  errorText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.error,
    marginBottom: SPACING[4],
  },
});

