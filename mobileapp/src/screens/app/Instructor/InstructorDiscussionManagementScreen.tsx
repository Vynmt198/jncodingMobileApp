import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import type { AppScreenProps } from '@/types/navigation.types';
import { ROUTES } from '@/constants/routes';
import { Button, Card } from '@/components/ui';
import { useGetDiscussionSummaryQuery } from '@/store/api/instructorApi';

type ScreenProps = AppScreenProps<typeof ROUTES.INSTRUCTOR_DISCUSSIONS>;

export const InstructorDiscussionManagementScreen: React.FC<ScreenProps> = () => {
  const { data, isLoading, isError } = useGetDiscussionSummaryQuery();

  const discussions = data?.discussions ?? [];

  const renderItem = ({ item }: { item: (typeof discussions)[number] }) => {
    return (
      <Card style={styles.card}>
        <Text style={styles.courseTitle}>{item.courseTitle}</Text>
        <Text style={styles.topic} numberOfLines={2}>
          {item.topic}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{item.replies} trả lời</Text>
          {item.reported > 0 && (
            <Text style={[styles.metaText, styles.reportedText]}>{item.reported} báo cáo</Text>
          )}
        </View>
        <View style={styles.actionsRow}>
          <Button
            title={item.pinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
            size="sm"
            variant={item.pinned ? 'outline' : 'secondary'}
            style={styles.actionButton}
            onPress={() => {
              // TODO: gọi API pin/unpin discussions
            }}
          />
          <Button
            title="Xoá"
            size="sm"
            variant="outline"
            style={styles.actionButton}
            onPress={() => {
              // TODO: gọi API xoá discussion
            }}
          />
        </View>
        <TouchableOpacity
          style={styles.viewRepliesRow}
          onPress={() => {
            // TODO: điều hướng chi tiết thread
          }}
        >
          <Text style={styles.viewRepliesText}>Xem và trả lời thảo luận</Text>
          <Text style={styles.viewRepliesArrow}>›</Text>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Discussion Management</Text>
      <Text style={styles.subtitle}>
        Quản lý thảo luận theo khoá học, ghim topic quan trọng và xử lý nội dung báo cáo.
      </Text>

      {isLoading && (
        <Text style={styles.loadingText}>Đang tải danh sách thảo luận...</Text>
      )}

      {isError && !isLoading && (
        <Text style={styles.errorText}>Không thể tải danh sách thảo luận.</Text>
      )}

      {!isLoading && !isError && (
        <FlatList
          data={discussions}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
  listContent: {
    paddingBottom: SPACING[8],
  },
  card: {
    marginBottom: SPACING[4],
  },
  courseTitle: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    marginBottom: SPACING[1],
  },
  topic: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: SPACING[2],
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING[2],
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  reportedText: {
    color: COLORS.error,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    marginBottom: SPACING[2],
  },
  actionButton: {
    flex: 1,
    marginRight: SPACING[2],
  },
  viewRepliesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING[1],
  },
  viewRepliesText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: '600',
  },
  viewRepliesArrow: {
    fontSize: 18,
    color: COLORS.primary,
  },
  loadingText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING[4],
  },
  errorText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.error,
    marginBottom: SPACING[4],
  },
});

