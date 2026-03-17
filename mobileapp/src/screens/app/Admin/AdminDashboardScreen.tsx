import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/theme';
import { Card } from '@/components/ui';
import { useGetStatsQuery } from '@/store/api/adminApi';
import { ROUTES } from '@/constants/routes';
import type { AppStackParamList } from '@/types/navigation.types';

type Nav = NativeStackNavigationProp<AppStackParamList>;

const MENU_ITEMS: Array<{ title: string; desc: string; route: keyof AppStackParamList }> = [
  { title: 'Người dùng', desc: 'Quản lý user, vai trò và trạng thái', route: ROUTES.ADMIN_USER_MANAGEMENT },
  { title: 'Khóa học', desc: 'Duyệt khóa học, bật/tắt trạng thái', route: ROUTES.ADMIN_COURSE_APPROVAL },
  { title: 'Bài học', desc: 'Ẩn/hiện nội dung bài học', route: ROUTES.ADMIN_LESSONS },
  { title: 'Đánh giá', desc: 'Xem đánh giá khóa học', route: ROUTES.ADMIN_REVIEWS },
];

// Backend trả về: totalRevenue, newStudentsThisWeek, totalCourses, revenueLast7Days
const STAT_KEYS: Array<{ key: string; label: string }> = [
  { key: 'totalRevenue', label: 'Doanh thu (VNĐ)' },
  { key: 'newStudentsThisWeek', label: 'Học viên mới (tuần)' },
  { key: 'totalCourses', label: 'Khóa học' },
];

export const AdminDashboardScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { data: stats, isLoading, error } = useGetStatsQuery();

  const statEntries = stats
    ? STAT_KEYS.map(({ key, label }) => ({ key, label, value: stats[key] })).filter(
        ({ value }) => typeof value === 'number'
      )
    : [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Quản trị hệ thống</Text>
        <Text style={styles.subtitle}>Tổng quan và điều hướng nhanh</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>Không tải được thống kê. Kiểm tra đăng nhập admin.</Text>
        </View>
      ) : (
        <View style={styles.statsGrid}>
          {statEntries.map(({ key, label, value }) => (
            <Card key={key} padding={4} shadowLevel="sm" style={styles.statCard}>
              <Text style={styles.statValue}>
                {key === 'totalRevenue' ? Number(value).toLocaleString('vi-VN') + '₫' : Number(value).toLocaleString('vi-VN')}
              </Text>
              <Text style={styles.statLabel}>{label}</Text>
            </Card>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Quản lý</Text>
      <View style={styles.menuList}>
        {MENU_ITEMS.map((item, index) => (
          <TouchableOpacity
            key={item.route}
            style={[styles.menuRow, index === MENU_ITEMS.length - 1 && styles.menuRowLast]}
            onPress={() => navigation.navigate(item.route)}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDesc}>{item.desc}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING[6], paddingTop: SPACING[8], paddingBottom: SPACING[12] },
  header: { marginBottom: SPACING[6] },
  title: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, fontWeight: '700' },
  subtitle: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, marginTop: 4 },
  loadingWrap: { paddingVertical: SPACING[10], alignItems: 'center' },
  errorWrap: { paddingVertical: SPACING[4] },
  errorText: { ...TYPOGRAPHY.bodySmall, color: COLORS.error },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[3],
    marginBottom: SPACING[6],
  },
  statCard: {
    minWidth: '45%',
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
  },
  statValue: { ...TYPOGRAPHY.h4, color: COLORS.primary, fontWeight: '700' },
  statLabel: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 4 },
  sectionTitle: { ...TYPOGRAPHY.label, color: COLORS.textSecondary, marginBottom: SPACING[3] },
  menuList: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[4],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuRowLast: { borderBottomWidth: 0 },
  menuRowContent: { flex: 1 },
  menuTitle: { ...TYPOGRAPHY.label, color: COLORS.textPrimary, fontWeight: '600' },
  menuDesc: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 4 },
  menuArrow: { fontSize: 22, color: COLORS.gray400, fontWeight: '700', marginLeft: SPACING[2] },
});
