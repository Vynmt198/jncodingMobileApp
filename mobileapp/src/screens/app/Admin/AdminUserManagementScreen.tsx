import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOW } from '@/constants/theme';
import { Button, Card } from '@/components/ui';
import type { AppScreenProps } from '@/types/navigation.types';
import { ROUTES } from '@/constants/routes';

type ScreenProps = AppScreenProps<typeof ROUTES.ADMIN_USER_MANAGEMENT>;

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  status: 'active' | 'suspended';
  joinedAt: string;
  totalCourses: number;
}

const MOCK_USERS: AdminUser[] = [
  {
    id: 'u1',
    fullName: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    role: 'student',
    status: 'active',
    joinedAt: '2024-10-01',
    totalCourses: 5,
  },
  {
    id: 'u2',
    fullName: 'Trần Thị B',
    email: 'tranthib@example.com',
    role: 'instructor',
    status: 'active',
    joinedAt: '2024-09-12',
    totalCourses: 3,
  },
  {
    id: 'u3',
    fullName: 'Admin System',
    email: 'admin@example.com',
    role: 'admin',
    status: 'suspended',
    joinedAt: '2024-01-05',
    totalCourses: 0,
  },
];

export const AdminUserManagementScreen: React.FC<ScreenProps> = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'instructor' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  const filteredUsers = useMemo(() => {
    return MOCK_USERS.filter(user => {
      const matchesSearch =
        !search ||
        user.fullName.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [search, roleFilter, statusFilter]);

  const renderFilterChip = (label: string, value: string, active: boolean, onPress: () => void) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.filterChip,
        active && styles.filterChipActive,
      ]}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderUserItem = ({ item }: { item: AdminUser }) => {
    const isSuspended = item.status === 'suspended';
    return (
      <Card padding={4} shadowLevel="sm" style={styles.userCard}>
        <View style={styles.userHeaderRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{item.fullName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.fullName}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, styles.roleBadge]}>
                <Text style={styles.badgeText}>{item.role.toUpperCase()}</Text>
              </View>
              <View style={[styles.badge, isSuspended ? styles.statusBadgeSuspended : styles.statusBadgeActive]}>
                <Text style={[styles.badgeText, isSuspended ? styles.badgeTextSuspended : styles.badgeTextActive]}>
                  {isSuspended ? 'Suspended' : 'Active'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Tham gia: {item.joinedAt}</Text>
          <Text style={styles.metaText}>Khoá học: {item.totalCourses}</Text>
        </View>

        <View style={styles.actionsRow}>
          <Button
            title={isSuspended ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
            variant={isSuspended ? 'outline' : 'secondary'}
            size="sm"
            style={styles.actionButton}
            onPress={() => {
              // TODO: nối API /admin/users/:id/lock ở đây
            }}
          />
          <Button
            title="Xem chi tiết"
            variant="ghost"
            size="sm"
            textStyle={{ color: COLORS.primary }}
            onPress={() => {
              // TODO: điều hướng sang màn chi tiết người dùng nếu cần
            }}
          />
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin User Management</Text>
        <Text style={styles.subtitle}>Quản lý user, phân quyền & trạng thái tài khoản</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Tìm theo tên, email..."
          placeholderTextColor={COLORS.gray400}
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        {renderFilterChip('Tất cả vai trò', 'all', roleFilter === 'all', () => setRoleFilter('all'))}
        {renderFilterChip('Student', 'student', roleFilter === 'student', () => setRoleFilter('student'))}
        {renderFilterChip('Instructor', 'instructor', roleFilter === 'instructor', () => setRoleFilter('instructor'))}
        {renderFilterChip('Admin', 'admin', roleFilter === 'admin', () => setRoleFilter('admin'))}
      </View>

      <View style={styles.filterRow}>
        {renderFilterChip('Tất cả trạng thái', 'all', statusFilter === 'all', () => setStatusFilter('all'))}
        {renderFilterChip('Active', 'active', statusFilter === 'active', () => setStatusFilter('active'))}
        {renderFilterChip('Suspended', 'suspended', statusFilter === 'suspended', () => setStatusFilter('suspended'))}
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderUserItem}
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
  userCard: {
    marginBottom: SPACING[4],
  },
  userHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  userInfo: {
    marginLeft: SPACING[3],
    flex: 1,
  },
  userName: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  userEmail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: SPACING[1],
    marginTop: SPACING[2],
  },
  badge: {
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    borderRadius: BORDER_RADIUS.full,
  },
  roleBadge: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusBadgeActive: {
    backgroundColor: '#E6F9F0',
  },
  statusBadgeSuspended: {
    backgroundColor: '#FFE9E9',
  },
  badgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  badgeTextActive: {
    color: '#13705A',
    fontWeight: '600',
  },
  badgeTextSuspended: {
    color: '#B3261E',
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING[2],
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING[3],
  },
  actionButton: {
    flex: 1,
    marginRight: SPACING[2],
  },
});

