import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/theme';
import { Button, Card } from '@/components/ui';
import type { AppScreenProps } from '@/types/navigation.types';
import { ROUTES } from '@/constants/routes';

type ScreenProps = AppScreenProps<typeof ROUTES.ADMIN_COURSE_APPROVAL>;

interface PendingCourse {
  id: string;
  title: string;
  instructorName: string;
  price: number;
  categoryName: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

const MOCK_PENDING_COURSES: PendingCourse[] = [
  {
    id: 'c1',
    title: 'React Native Advanced Patterns',
    instructorName: 'Lê Minh Instructor',
    price: 499000,
    categoryName: 'Mobile Development',
    submittedAt: '2024-10-02',
    status: 'pending',
  },
  {
    id: 'c2',
    title: 'Node.js Backend for E-Learning',
    instructorName: 'Phạm Quốc Instructor',
    price: 399000,
    categoryName: 'Backend',
    submittedAt: '2024-09-28',
    status: 'pending',
  },
];

export const AdminCourseApprovalScreen: React.FC<ScreenProps> = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filteredCourses = useMemo(() => {
    return MOCK_PENDING_COURSES.filter(course => {
      const matchesSearch =
        !search ||
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.instructorName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const renderStatusBadge = (status: PendingCourse['status']) => {
    let backgroundColor = '#FFE9E0';
    let textColor = '#C43E00';
    let label = 'Pending';

    if (status === 'approved') {
      backgroundColor = '#E6F9F0';
      textColor = '#13705A';
      label = 'Approved';
    } else if (status === 'rejected') {
      backgroundColor = '#FFE9E9';
      textColor = '#B3261E';
      label = 'Rejected';
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor }]}>
        <Text style={[styles.statusBadgeText, { color: textColor }]}>{label}</Text>
      </View>
    );
  };

  const renderFilterChip = (label: string, active: boolean, onPress: () => void) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.filterChip, active && styles.filterChipActive]}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderCourseItem = ({ item }: { item: PendingCourse }) => {
    return (
      <Card padding={4} shadowLevel="sm" style={styles.courseCard}>
        <View style={styles.courseHeaderRow}>
          <View style={styles.courseTitleContainer}>
            <Text style={styles.courseTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.instructorText}>{item.instructorName}</Text>
          </View>
          {renderStatusBadge(item.status)}
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Danh mục: {item.categoryName}</Text>
          <Text style={styles.metaText}>Giá: {item.price.toLocaleString('vi-VN')}₫</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Ngày gửi: {item.submittedAt}</Text>
        </View>

        <View style={styles.actionsRow}>
          <Button
            title="Xem preview"
            variant="ghost"
            size="sm"
            textStyle={{ color: COLORS.primary }}
            onPress={() => {
              // TODO: điều hướng chi tiết khoá học chờ duyệt
            }}
          />
          <Button
            title="Từ chối"
            variant="outline"
            size="sm"
            style={styles.actionButton}
            onPress={() => {
              // TODO: mở modal nhập lý do từ chối & gọi API /admin/courses/:id/reject
            }}
          />
          <Button
            title="Duyệt"
            variant="secondary"
            size="sm"
            style={styles.actionButton}
            onPress={() => {
              // TODO: gọi API /admin/courses/:id/approve
            }}
          />
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Course Approval</Text>
        <Text style={styles.subtitle}>Danh sách khoá học đang chờ duyệt, approve/reject nhanh</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Tìm theo tên khoá học hoặc giảng viên..."
          placeholderTextColor={COLORS.gray400}
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        {renderFilterChip('Tất cả', statusFilter === 'all', () => setStatusFilter('all'))}
        {renderFilterChip('Pending', statusFilter === 'pending', () => setStatusFilter('pending'))}
        {renderFilterChip('Approved', statusFilter === 'approved', () => setStatusFilter('approved'))}
        {renderFilterChip('Rejected', statusFilter === 'rejected', () => setStatusFilter('rejected'))}
      </View>

      <FlatList
        data={filteredCourses}
        keyExtractor={item => item.id}
        renderItem={renderCourseItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
  header: {
    marginBottom: SPACING[4],
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  searchContainer: {
    marginTop: SPACING[4],
    marginBottom: SPACING[3],
  },
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[2],
    marginBottom: SPACING[2],
  },
  filterChip: {
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: SPACING[4],
    paddingBottom: SPACING[10],
  },
  courseCard: {
    marginBottom: SPACING[4],
  },
  courseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING[3],
  },
  courseTitleContainer: {
    flex: 1,
    paddingRight: SPACING[3],
  },
  courseTitle: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  instructorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    borderRadius: BORDER_RADIUS.full,
  },
  statusBadgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING[1],
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING[3],
  },
  actionButton: {
    marginLeft: SPACING[2],
  },
});

