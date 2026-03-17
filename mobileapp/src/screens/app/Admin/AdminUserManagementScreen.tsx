import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  type ViewStyle,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOW } from '@/constants/theme';
import { Button, Card, Modal } from '@/components/ui';
import type { AppScreenProps } from '@/types/navigation.types';
import { ROUTES } from '@/constants/routes';
import { Ionicons } from '@expo/vector-icons';
import {
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useUpdateUserStatusMutation,
} from '@/store/api/adminApi';
import type { AdminUserListItem } from '@/store/api/adminApi';

type ScreenProps = AppScreenProps<typeof ROUTES.ADMIN_USER_MANAGEMENT>;

const PAGE_SIZE = 10;
const ROLE_OPTIONS: Array<'all' | 'learner' | 'instructor' | 'admin'> = ['all', 'learner', 'instructor', 'admin'];
const STATUS_OPTIONS: Array<'all' | 'active' | 'suspended'> = ['all', 'active', 'suspended'];

const ROLE_LABELS: Record<string, string> = {
  all: 'Tất cả',
  learner: 'Học viên',
  instructor: 'Giảng viên',
  admin: 'Quản trị',
};

const STATUS_LABELS: Record<string, string> = {
  all: 'Tất cả',
  active: 'Hoạt động',
  suspended: 'Đã khóa',
};

const ROLE_ICONS: Record<string, string> = {
  all: 'people',
  learner: 'school',
  instructor: 'easel',
  admin: 'shield-checkmark',
};

const STATUS_ICONS: Record<string, string> = {
  all: 'ellipse',
  active: 'checkmark-circle',
  suspended: 'lock-closed',
};

export const AdminUserManagementScreen: React.FC<ScreenProps> = ({ navigation }) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'learner' | 'instructor' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [isFocused, setIsFocused] = useState(false);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  const params = {
    page,
    limit: PAGE_SIZE,
    ...(roleFilter !== 'all' && { role: roleFilter }),
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(searchDebounced.trim() && { search: searchDebounced.trim() }),
  };

  const { data, isLoading, isFetching, refetch } = useGetUsersQuery(params);
  const [updateRole, { isLoading: isUpdatingRole }] = useUpdateUserRoleMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateUserStatusMutation();

  const users = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalUsers = data?.total ?? 0;
  const hasMore = page < totalPages;

  const [roleModalUser, setRoleModalUser] = useState<AdminUserListItem | null>(null);
  const [statusModalUser, setStatusModalUser] = useState<AdminUserListItem | null>(null);

  // Live search with debounce
  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearchDebounced(text);
      setPage(1);
    }, 400);
  }, []);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  const clearSearch = useCallback(() => {
    setSearch('');
    setSearchDebounced('');
    setPage(1);
  }, []);

  const handleRoleChange = (user: AdminUserListItem) => {
    setRoleModalUser(user);
  };

  const applyRole = (user: AdminUserListItem, role: 'learner' | 'instructor' | 'admin') => {
    setRoleModalUser(null);
    updateRole({ userId: user._id, role })
      .unwrap()
      .then(() => refetch())
      .catch(() => Alert.alert('Lỗi', 'Không thể cập nhật vai trò'));
  };

  const handleStatusToggle = (user: AdminUserListItem) => {
    setStatusModalUser(user);
  };

  const confirmStatusToggle = () => {
    if (!statusModalUser) return;
    const isSuspended = statusModalUser.status === 'suspended' || statusModalUser.isActive === false;
    updateStatus({ userId: statusModalUser._id, status: isSuspended ? 'active' : 'suspended' })
      .unwrap()
      .then(() => {
        setStatusModalUser(null);
        refetch();
      })
      .catch(() => Alert.alert('Lỗi', 'Không thể cập nhật trạng thái'));
  };

  const renderUserItem = ({ item }: { item: AdminUserListItem }) => {
    const isSuspended = item.status === 'suspended' || item.isActive === false;
    return (
      <Card padding={4} shadowLevel="sm" style={styles.userCard}>
        <View style={styles.userHeaderRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(item.fullName || item.email).charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.fullName || item.email}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <View style={styles.badgeRow}>
              <TouchableOpacity
                onPress={() => handleRoleChange(item)}
                style={[styles.badge, styles.roleBadge]}
              >
                <Text style={styles.badgeText}>{(item.role || 'learner').toUpperCase()}</Text>
              </TouchableOpacity>
              <View
                style={[
                  styles.badge,
                  isSuspended ? styles.statusBadgeSuspended : styles.statusBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isSuspended ? styles.badgeTextSuspended : styles.badgeTextActive,
                  ]}
                >
                  {isSuspended ? 'Đã khóa' : 'Hoạt động'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            Tham gia: {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '—'}
          </Text>
          {typeof item.totalCourses === 'number' && (
            <Text style={styles.metaText}>Khóa học: {item.totalCourses}</Text>
          )}
        </View>
        <View style={styles.actionsRow}>
          <View style={styles.actionBtnWeb}>
            <Button
              title={isSuspended ? 'Mở khóa' : 'Khóa tài khoản'}
              variant={isSuspended ? 'outline' : 'secondary'}
              size="sm"
              style={styles.actionButton}
              onPress={() => handleStatusToggle(item)}
              disabled={isUpdatingStatus}
            />
          </View>
          <View style={styles.actionBtnWeb}>
            <Button
              title="Đổi vai trò"
              variant="ghost"
              size="sm"
              textStyle={{ color: COLORS.primary }}
              onPress={() => handleRoleChange(item)}
              disabled={isUpdatingRole}
            />
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Quản lý người dùng</Text>
          <Text style={styles.subtitle}>Lọc, tìm kiếm và quản lý tài khoản</Text>
        </View>
      </View>

      {/* Search & Filter Card */}
      <View style={styles.filterCard}>
        {/* Live Search Input */}
        <View style={[styles.searchWrapper, isFocused && styles.searchWrapperFocused]}>
          <Ionicons
            name="search"
            size={18}
            color={isFocused ? COLORS.primary : COLORS.gray400}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Tìm theo tên, email..."
            placeholderTextColor={COLORS.gray400}
            style={styles.searchInput}
            value={search}
            onChangeText={handleSearchChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearBtn} activeOpacity={0.6}>
              <Ionicons name="close-circle" size={18} color={COLORS.gray400} />
            </TouchableOpacity>
          )}
          {isFetching && search.length > 0 && (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: SPACING[2] }} />
          )}
        </View>

        {/* Role Filter — Compact Chips */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Vai trò</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {ROLE_OPTIONS.map((r) => {
              const active = roleFilter === r;
              return (
                <TouchableOpacity
                  key={`role-${r}`}
                  onPress={() => { setRoleFilter(r); setPage(1); }}
                  style={[styles.chip, active && styles.chipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {ROLE_LABELS[r]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Status Filter — Compact Chips */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Trạng thái</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {STATUS_OPTIONS.map((s) => {
              const active = statusFilter === s;
              return (
                <TouchableOpacity
                  key={`status-${s}`}
                  onPress={() => { setStatusFilter(s); setPage(1); }}
                  style={[styles.chip, active && styles.chipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {STATUS_LABELS[s]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Result count */}
        {!isLoading && (
          <View style={styles.resultCountRow}>
            <Ionicons name="people-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.resultCountText}>
              {totalUsers} người dùng
              {searchDebounced.trim() ? ` cho "${searchDebounced}"` : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Main Content */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          <FlatList
            data={users}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContent}
            renderItem={renderUserItem}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="person-outline" size={60} color={COLORS.gray200} />
                <Text style={styles.emptyText}>Không có người dùng nào.</Text>
              </View>
            }
            ListFooterComponent={
              isFetching && page > 1 ? (
                <ActivityIndicator style={styles.footerLoader} color={COLORS.primary} />
              ) : null
            }
          />
          {totalPages > 1 && (
            <View style={styles.pagination}>
              <Button
                title="Trang trước"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onPress={() => setPage(p => Math.max(1, p - 1))}
              />
              <Text style={styles.pageText}>
                {page} / {totalPages}
              </Text>
              <Button
                title="Trang sau"
                variant="outline"
                size="sm"
                disabled={!hasMore}
                onPress={() => setPage(p => Math.min(totalPages, p + 1))}
              />
            </View>
          )}
        </>
      )}

      {/* Modal đổi vai trò */}
      <Modal
        visible={!!roleModalUser}
        onClose={() => setRoleModalUser(null)}
        title="Đổi vai trò"
        dismissOnOverlayPress={true}
      >
        {roleModalUser ? (
          <>
            <Text style={styles.modalMessage}>
              Chọn vai trò mới cho {roleModalUser.fullName || roleModalUser.email}
            </Text>
            <View style={styles.roleOptions}>
              {(['learner', 'instructor', 'admin'] as const).map(role => {
                const currentRole = (roleModalUser?.role || 'learner') as string;
                const isCurrentRole = role === currentRole;
                return (
                  <Pressable
                    key={role}
                    style={({ pressed }) => [
                      styles.roleOptionBtn,
                      isCurrentRole && styles.roleOptionBtnDisabled,
                      pressed && !isCurrentRole && styles.roleOptionBtnPressed,
                    ]}
                    onPress={() => !isCurrentRole && roleModalUser && applyRole(roleModalUser, role)}
                    disabled={isCurrentRole}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        isCurrentRole && styles.roleOptionTextDisabled,
                      ]}
                    >
                      {role.toUpperCase()}
                      {isCurrentRole ? '' : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.modalFooter}>
              <Button title="Hủy" variant="outline" size="sm" onPress={() => setRoleModalUser(null)} />
            </View>
          </>
        ) : null}
      </Modal>

      {/* Modal xác nhận khóa / mở khóa tài khoản */}
      <Modal
        visible={!!statusModalUser}
        onClose={() => setStatusModalUser(null)}
        title={
          statusModalUser &&
            (statusModalUser.status === 'suspended' || statusModalUser.isActive === false)
            ? 'Mở khóa tài khoản'
            : 'Khóa tài khoản'
        }
        dismissOnOverlayPress={true}
      >
        {statusModalUser ? (
          <>
            <Text style={styles.modalMessage}>
              {statusModalUser.status === 'suspended' || statusModalUser.isActive === false
                ? `Mở khóa tài khoản ${statusModalUser.fullName || statusModalUser.email}?`
                : `Khóa tài khoản ${statusModalUser.fullName || statusModalUser.email}?`}
            </Text>
            <View style={styles.modalFooter}>
              <Button title="Hủy" variant="outline" size="sm" onPress={() => setStatusModalUser(null)} />
              <Button
                title="Xác nhận"
                variant="secondary"
                size="sm"
                onPress={confirmStatusToggle}
              />
            </View>
          </>
        ) : null}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[6],
    marginBottom: SPACING[4],
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
  headerTextWrap: {
    marginLeft: SPACING[3],
    flex: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  /* ── Filter Card ─────────────────────────────────────────── */
  filterCard: {
    marginHorizontal: SPACING[6],
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING[5],
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
    marginBottom: SPACING[4],
  },

  /* Search */
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingHorizontal: SPACING[4],
    height: 48,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  searchWrapperFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
    ...SHADOW.md,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.15,
  },
  searchIcon: {
    marginRight: SPACING[3],
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textPrimary,
    fontWeight: '500',
    // @ts-ignore - Web outline removal
    outlineStyle: 'none' as any,
  },
  clearBtn: {
    padding: 4,
    marginLeft: SPACING[2],
  },

  /* Filter sections */
  filterSection: {
    marginTop: SPACING[4],
  },
  filterLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING[2],
  },
  chipRow: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  chip: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },

  /* Result count */
  resultCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING[4],
    paddingTop: SPACING[3],
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING[2],
  },
  resultCountText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  /* List */
  listContent: { paddingHorizontal: SPACING[6], paddingVertical: SPACING[2], paddingBottom: SPACING[10] },
  loadingWrap: { paddingVertical: SPACING[10], alignItems: 'center' },
  footerLoader: { paddingVertical: SPACING[2] },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING[3] },

  /* User Card */
  userCard: { marginBottom: SPACING[4] },
  userHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING[3] },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { ...TYPOGRAPHY.h4, color: COLORS.primaryDark, fontWeight: '700' },
  userInfo: { marginLeft: SPACING[3], flex: 1 },
  userName: { ...TYPOGRAPHY.label, color: COLORS.textPrimary, fontWeight: '700' },
  userEmail: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: SPACING[1], marginTop: SPACING[2] },
  badge: {
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    borderRadius: BORDER_RADIUS.full,
  },
  roleBadge: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  statusBadgeActive: { backgroundColor: '#E6F9F0' },
  statusBadgeSuspended: { backgroundColor: '#FFE9E9' },
  badgeText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  badgeTextActive: { color: '#13705A', fontWeight: '600' },
  badgeTextSuspended: { color: '#B3261E', fontWeight: '600' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING[2] },
  metaText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING[3],
  },
  actionButton: { flex: 1, marginRight: SPACING[2] },
  actionBtnWeb: (Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}) as ViewStyle,

  /* Modals */
  modalMessage: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textPrimary, marginBottom: SPACING[4] },
  roleOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[2], marginBottom: SPACING[4] },
  roleOptionBtn: {
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleOptionBtnPressed: { opacity: 0.8 },
  roleOptionBtnDisabled: { backgroundColor: COLORS.gray200, borderColor: COLORS.gray400, opacity: 0.8 },
  roleOptionText: { ...TYPOGRAPHY.label, color: COLORS.textPrimary, fontWeight: '600' },
  roleOptionTextDisabled: { color: COLORS.gray500 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING[2], marginTop: SPACING[2] },

  /* Pagination */
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[3],
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[6],
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  pageText: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary },
});
