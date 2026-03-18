import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/theme';
import { Button, Card, Modal } from '@/components/ui';
import type { AppScreenProps } from '@/types/navigation.types';
import { ROUTES } from '@/constants/routes';
import {
  useGetCoursesQuery,
  useApproveCourseMutation,
  useUpdateCourseStatusMutation,
} from '@/store/api/adminApi';
import type { AdminCourseListItem } from '@/store/api/adminApi';

type ScreenProps = AppScreenProps<typeof ROUTES.ADMIN_COURSE_APPROVAL>;

const PAGE_SIZE = 20;
const STATUS_FILTERS: Array<'all' | 'pending' | 'active' | 'rejected' | 'disabled' | 'draft'> = [
  'all',
  'pending',
  'active',
  'rejected',
  'disabled',
  'draft',
];

export const AdminCourseApprovalScreen: React.FC<ScreenProps> = ({ navigation }) => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading, refetch } = useGetCoursesQuery({
    page,
    limit: PAGE_SIZE,
    ...(statusFilter !== 'all' && { status: statusFilter }),
  });
  const [approveCourse, { isLoading: isApproving }] = useApproveCourseMutation();
  const [updateCourseStatus, { isLoading: isUpdatingStatus }] = useUpdateCourseStatusMutation();

  const courses = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const [confirmModal, setConfirmModal] = useState<{
    type: 'approve' | 'reject';
    course: AdminCourseListItem;
  } | null>(null);

  const handleApprove = (course: AdminCourseListItem) => {
    setConfirmModal({ type: 'approve', course });
  };

  const handleReject = (course: AdminCourseListItem) => {
    setConfirmModal({ type: 'reject', course });
  };

  const executeApprove = () => {
    if (!confirmModal || confirmModal.type !== 'approve') return;
    const { course } = confirmModal;
    setConfirmModal(null);
    approveCourse({ courseId: course._id, action: 'approve' })
      .unwrap()
      .then(() => refetch())
      .catch(() => Alert.alert('Lỗi', 'Không thể duyệt khóa học'));
  };

  const executeReject = () => {
    if (!confirmModal || confirmModal.type !== 'reject') return;
    const { course } = confirmModal;
    setConfirmModal(null);
    updateCourseStatus({ courseId: course._id, status: 'rejected' })
      .unwrap()
      .then(() => refetch())
      .catch(() => Alert.alert('Lỗi', 'Không thể từ chối'));
  };

  const handleStatusChange = (course: AdminCourseListItem, newStatus: 'active' | 'rejected' | 'disabled') => {
    updateCourseStatus({ courseId: course._id, status: newStatus })
      .unwrap()
      .then(() => refetch())
      .catch(() => Alert.alert('Lỗi', 'Không thể cập nhật trạng thái'));
  };

  const renderStatusBadge = (status?: string) => {
    const s = status || 'draft';
    let backgroundColor = '#FFE9E0';
    let textColor = '#C43E00';
    let label = 'Chờ duyệt';
    if (s === 'active') {
      backgroundColor = '#E6F9F0';
      textColor = '#13705A';
      label = 'Đã xuất bản';
    } else if (s === 'rejected') {
      backgroundColor = '#FFE9E9';
      textColor = '#B3261E';
      label = 'Từ chối';
    } else if (s === 'disabled') {
      label = 'Ẩn';
    } else if (s === 'draft') {
      label = 'Nháp';
    } else if (s === 'pending') {
      label = 'Chờ duyệt';
    }
    return (
      <View style={[styles.statusBadge, { backgroundColor }]}>
        <Text style={[styles.statusBadgeText, { color: textColor }]}>{label}</Text>
      </View>
    );
  };

  const renderFilterChip = (label: string, value: string, active: boolean, onPress: () => void) => (
    <TouchableOpacity
      onPress={() => {
        onPress();
        setPage(1);
      }}
      style={[styles.filterChip, active && styles.filterChipActive]}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderCourseItem = ({ item }: { item: AdminCourseListItem }) => (
    <Card padding={4} shadowLevel="sm" style={styles.courseCard}>
      <View style={styles.courseHeaderRow}>
        <View style={styles.courseTitleContainer}>
          <Text style={styles.courseTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.instructorText}>{item.instructorName || item.instructorId || '—'}</Text>
        </View>
        {renderStatusBadge(item.status)}
      </View>
      <View style={styles.metaRow}>
        {item.categoryName && (
          <Text style={styles.metaText}>Danh mục: {item.categoryName}</Text>
        )}
        {typeof item.price === 'number' && (
          <Text style={styles.metaText}>Giá: {item.price.toLocaleString('vi-VN')}₫</Text>
        )}
      </View>
      {(item.submittedAt || item.createdAt) && (
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            Ngày: {new Date(item.submittedAt || item.createdAt || '').toLocaleDateString('vi-VN')}
          </Text>
        </View>
      )}
      <View style={styles.actionsRow}>
        {(item.status === 'pending' || item.status === 'draft') && (
          <View style={styles.actionBtnWrap}>
            <Button
              title="Duyệt"
              variant="secondary"
              size="sm"
              style={styles.actionButton}
              onPress={() => handleApprove(item)}
              disabled={isApproving}
            />
          </View>
        )}
        {item.status === 'pending' && (
          <View style={styles.actionBtnWrap}>
            <Button
              title="Từ chối"
              variant="outline"
              size="sm"
              style={styles.actionButton}
              onPress={() => handleReject(item)}
              disabled={isUpdatingStatus}
            />
          </View>
        )}
        {item.status === 'active' && (
          <Button
            title="Ẩn"
            variant="outline"
            size="sm"
            onPress={() => handleStatusChange(item, 'disabled')}
            disabled={isUpdatingStatus}
          />
        )}
        {item.status === 'disabled' && (
          <Button
            title="Bật lại"
            variant="ghost"
            size="sm"
            textStyle={{ color: COLORS.primary }}
            onPress={() => handleStatusChange(item, 'active')}
            disabled={isUpdatingStatus}
          />
        )}
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý khóa học</Text>
      </View>
      <Text style={styles.subtitle}>Duyệt, từ chối và bật/tắt trạng thái khóa học</Text>

      <View style={styles.filterRow}>
        {STATUS_FILTERS.map(s =>
          renderFilterChip(
            s === 'all' ? 'Tất cả' : s === 'pending' ? 'Chờ duyệt' : s === 'active' ? 'Đã xuất bản' : s === 'rejected' ? 'Từ chối' : s === 'disabled' ? 'Ẩn' : 'Nháp',
            s,
            statusFilter === s,
            () => setStatusFilter(s)
          )
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          <FlatList
            data={courses}
            keyExtractor={item => item._id}
            renderItem={renderCourseItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Không có khóa học nào.</Text>
            }
          />
          {totalPages > 1 && (
            <View style={styles.pagination}>
              <Button
                title="Trước"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onPress={() => setPage(p => Math.max(1, p - 1))}
              />
              <Text style={styles.pageText}>
                {page} / {totalPages}
              </Text>
              <Button
                title="Sau"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onPress={() => setPage(p => p + 1)}
              />
            </View>
          )}
        </>
      )}

      {/* Modal xác nhận Duyệt / Từ chối (web: Alert không hiện nút) */}
      <Modal
        visible={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={confirmModal?.type === 'approve' ? 'Duyệt khóa học' : 'Từ chối khóa học'}
        dismissOnOverlayPress={true}
      >
        {confirmModal ? (
          <>
            <Text style={styles.modalMessage}>
              {confirmModal.type === 'approve'
                ? `Duyệt khóa "${confirmModal.course.title}"?`
                : `Từ chối khóa "${confirmModal.course.title}"?`}
            </Text>
            <View style={styles.modalFooter}>
              <Button title="Hủy" variant="outline" size="sm" onPress={() => setConfirmModal(null)} />
              {confirmModal.type === 'approve' ? (
                <Button
                  title="Duyệt"
                  variant="secondary"
                  size="sm"
                  onPress={executeApprove}
                  disabled={isApproving}
                />
              ) : (
                <Button
                  title="Từ chối"
                  variant="secondary"
                  size="sm"
                  onPress={executeReject}
                  disabled={isUpdatingStatus}
                />
              )}
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[2],
    marginBottom: SPACING[3],
  },
  filterChip: {
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  filterChipText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  filterChipTextActive: { color: COLORS.primaryDark, fontWeight: '600' },
  listContent: { paddingVertical: SPACING[4], paddingBottom: SPACING[10] },
  loadingWrap: { paddingVertical: SPACING[10], alignItems: 'center' },
  emptyText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING[6],
  },
  courseCard: { marginBottom: SPACING[4] },
  courseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING[3],
  },
  courseTitleContainer: { flex: 1, paddingRight: SPACING[3] },
  courseTitle: { ...TYPOGRAPHY.label, color: COLORS.textPrimary, fontWeight: '700' },
  instructorText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    borderRadius: BORDER_RADIUS.full,
  },
  statusBadgeText: { ...TYPOGRAPHY.caption, fontWeight: '600' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING[1] },
  metaText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  actionsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: SPACING[2], marginTop: SPACING[3] },
  actionBtnWrap: {},
  actionButton: { marginRight: SPACING[2] },
  modalMessage: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textPrimary, marginBottom: SPACING[4] },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING[2], marginTop: SPACING[2] },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[3],
    paddingVertical: SPACING[4],
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  pageText: { ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary },
});
