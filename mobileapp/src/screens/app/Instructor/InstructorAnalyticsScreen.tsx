import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import type { AppScreenProps } from '@/types/navigation.types';
import { ROUTES } from '@/constants/routes';
import { Card } from '@/components/ui';
import { useGetAnalyticsQuery } from '@/store/api/instructorApi';

type ScreenProps = AppScreenProps<typeof ROUTES.INSTRUCTOR_ANALYTICS>;

export const InstructorAnalyticsScreen: React.FC<ScreenProps> = () => {
  const { data, isLoading, isError } = useGetAnalyticsQuery();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Course Analytics</Text>
      <Text style={styles.subtitle}>
        Tỉ lệ hoàn thành, rating và top khoá học của bạn.
      </Text>

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
            <Text style={styles.sectionTitle}>Tỉ lệ hoàn thành chung</Text>
            <Text style={styles.metricValue}>{Math.round(data.completionRate)}%</Text>
            <Text style={styles.metricHint}>So với lần đo gần nhất</Text>
          </Card>

          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Đánh giá trung bình</Text>
            <Text style={styles.metricValue}>
              {data.averageRating.toFixed(1)} / 5.0
            </Text>
            <Text style={styles.metricHint}>
              Dựa trên {data.totalReviews.toLocaleString('vi-VN')} lượt đánh giá
            </Text>
          </Card>

          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Top khoá học</Text>
            {data.topCourses.map((course, index) => (
              <Text key={course.courseId} style={styles.itemText}>
                {index + 1}. {course.title} — {course.averageRating.toFixed(1)} ★ —{' '}
                {course.enrollments.toLocaleString('vi-VN')} học viên
              </Text>
            ))}
          </Card>
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
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginBottom: SPACING[2],
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING[5],
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

