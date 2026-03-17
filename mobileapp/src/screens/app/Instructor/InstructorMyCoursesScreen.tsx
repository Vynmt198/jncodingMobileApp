import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Image,
  Alert,
  TextInput,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useDeleteCourseMutation, useGetMyCoursesQuery, useUpdateCourseMutation } from '@/store/api/instructorApi';
import { ROUTES } from '@/constants/routes';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/store/hooks';
import { API_BASE_URL } from '@/api/axiosInstance';

type InstructorCourseItem = {
  _id: string;
  title: string;
  status?: string;
  thumbnail?: string | null;
  level?: string;
  enrollmentCount?: number;
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  pending: 'Chờ duyệt',
  active: 'Đã duyệt',
  rejected: 'Bị từ chối',
  disabled: 'Ẩn',
};

const PLACEHOLDER_THUMB = 'https://placehold.co/100x100?text=Course';

function resolveThumbnailUri(input?: string | null) {
  if (!input) return PLACEHOLDER_THUMB;
  const raw = String(input).trim();
  if (!raw) return PLACEHOLDER_THUMB;

  // Allow http(s) + data URLs. Block unknown schemes on web (e.g. myapp://).
  if (/^(https?:)?\/\//i.test(raw) || /^data:/i.test(raw)) return raw;

  // Backend serves static files at /uploads (NOT under /api)
  const origin = API_BASE_URL.replace(/\/api\/?$/i, '');
  if (raw.startsWith('/uploads/')) return `${origin}${raw}`;
  if (raw.startsWith('uploads/')) return `${origin}/${raw}`;

  // Fallback: keep placeholder to avoid ERR_UNKNOWN_URL_SCHEME on web.
  return PLACEHOLDER_THUMB;
}

interface CourseRowProps {
  item: InstructorCourseItem;
  role?: string;
  onPressDetail: () => void;
  onPressEdit: () => void;
  onPressDelete: () => void;
  onPressSubmit?: () => void;
}

const InstructorCourseRow: React.FC<CourseRowProps> = ({
  item,
  role,
  onPressDetail,
  onPressEdit,
  onPressDelete,
  onPressSubmit,
}) => {
  const thumb = resolveThumbnailUri(item.thumbnail);
  const level = item.level ?? '—';
  const status = item.status ?? '—';
  const statusLabel = STATUS_LABELS[String(status)] ?? status;
  const enrollments = item.enrollmentCount ?? 0;

  const canSubmit = status === 'draft';
  const canEdit = status !== 'rejected';
  const canDeleteByStatus = status === 'draft' || status === 'pending' || status === 'rejected';
  const canDelete = canDeleteByStatus || (status === 'disabled' && role === 'admin');

  return (
    <View style={styles.courseRow}>
      <Pressable style={styles.coursePressArea} onPress={onPressDetail}>
        <Image source={{ uri: thumb }} style={styles.thumbnail} />
        <View style={styles.courseInfo}>
          <Text style={styles.courseTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.courseMeta} numberOfLines={1}>
            Trạng thái: <Text style={styles.courseMetaHighlight}>{statusLabel}</Text>
          </Text>
          <Text style={styles.courseMeta} numberOfLines={1}>
            Cấp độ: <Text style={styles.courseMetaHighlight}>{level}</Text> • Học viên:{' '}
            <Text style={styles.courseMetaHighlight}>{enrollments}</Text>
          </Text>
        </View>
      </Pressable>
      <View style={styles.courseActions}>
        {canSubmit ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSubmit]}
            activeOpacity={0.8}
            onPress={onPressSubmit}
            accessibilityLabel="Gửi duyệt"
            accessibilityRole="button"
          >
            <Ionicons name="send" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.actionButton, !canEdit && { opacity: 0.35 }]}
          activeOpacity={canEdit ? 0.8 : 1}
          onPress={canEdit ? onPressEdit : undefined}
        >
          <Ionicons name="create-outline" size={18} color={COLORS.primary} />
        </TouchableOpacity>
        {canDelete ? (
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.8}
            onPress={onPressDelete}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

export const InstructorMyCoursesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const user = useAppSelector(s => s.auth.user);

  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [page, setPage] = React.useState(1);
  const limit = 20;
  const statusParam = statusFilter === 'all' ? undefined : statusFilter;

  const { data, isLoading, isFetching, isError, refetch } = useGetMyCoursesQuery({
    page,
    limit,
    status: statusParam,
  });
  const [deleteCourse] = useDeleteCourseMutation();
  const [updateCourse] = useUpdateCourseMutation();
  const [searchQuery, setSearchQuery] = React.useState('');

  const [courses, setCourses] = React.useState<InstructorCourseItem[]>([]);
  const pagination = data?.pagination;
  const pageCourses = (data?.courses ?? []) as InstructorCourseItem[];
  // Tránh vòng lặp render trên web khi data.courses có thể đổi reference liên tục
  // nhưng nội dung không đổi (gây useEffect chạy lại và setState mãi).
  const pageCoursesKey = pageCourses.map(c => c._id).join('|');

  React.useEffect(() => {
    if (!pageCourses.length) {
      if (page === 1) setCourses([]);
      return;
    }
    setCourses(prev => {
      const next = page === 1 ? [] : prev;
      const seen = new Set(next.map(c => c._id));
      const merged = [...next];
      for (const c of pageCourses) {
        if (!seen.has(c._id)) {
          seen.add(c._id);
          merged.push(c);
        }
      }
      return merged;
    });
  }, [pageCoursesKey, page]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredCourses =
    !normalizedQuery.length
      ? courses
      : courses.filter(c =>
          (c.title || '')
            .toString()
            .toLowerCase()
            .includes(normalizedQuery),
        );
  const displayEmail = user?.email ?? 'instructor@example.com';
  const avatarInitial =
    (user?.fullName && user.fullName.trim().charAt(0)) ||
    (displayEmail && displayEmail.trim().charAt(0)) ||
    'U';

  const isRefreshing = isFetching && page === 1;
  const canLoadMore = !!pagination && pagination.page < pagination.totalPages;
  const role = user?.role;

  const handleChangeStatus = (nextStatus: string) => {
    setStatusFilter(nextStatus);
    setPage(1);
  };

  const handleLoadMore = () => {
    if (isFetching || isLoading) return;
    if (!canLoadMore) return;
    setPage(p => p + 1);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.headerCard}
      >
        <View style={styles.headerTop}>
          <View style={styles.userRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{avatarInitial.toUpperCase()}</Text>
            </View>
            <View style={styles.headerTextWrap}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerHello}>
                  Hello,
                  {' '}
                  <Text style={styles.headerEmail}>{displayEmail}</Text>
                </Text>
                <View style={styles.vipBadge}>
                  <Text style={styles.vipLabel}>VIP</Text>
                </View>
              </View>
              <Text style={styles.headerSubtitle}>Quản lý các khóa bạn đang giảng dạy</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellButton} activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={styles.searchPlaceholder}
            placeholder="Tìm trong các khóa tôi dạy..."
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>
      </LinearGradient>

      <Text style={styles.sectionTitle}>Khóa tôi dạy</Text>
      <Text style={styles.subtitle}>Quản lý các khóa học bạn đang giảng dạy.</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {(['all', 'draft', 'pending', 'active', 'rejected', 'disabled'] as const).map(s => {
          const active = statusFilter === s;
          const label = s === 'all' ? 'Tất cả' : (STATUS_LABELS[s] ?? s);
          return (
            <TouchableOpacity
              key={s}
              style={[styles.filterChip, active && styles.filterChipActive]}
              activeOpacity={0.85}
              onPress={() => handleChangeStatus(s)}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading && <Text style={styles.helperText}>Đang tải danh sách khóa học...</Text>}
      {isError && !isLoading && (
        <Text style={styles.errorText}>Không thể tải danh sách khóa học.</Text>
      )}

      {!isLoading && !isError && (
        <FlatList
          data={filteredCourses}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          onEndReachedThreshold={0.4}
          onEndReached={handleLoadMore}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setPage(1);
                refetch();
              }}
              tintColor={COLORS.primary}
            />
          }
          renderItem={({ item }) => {
            const handleEditCourse = () => {
              navigation.navigate(ROUTES.INSTRUCTOR_CREATE_COURSE as never, {
                courseId: item._id,
              });
            };

            const handleDeleteCourse = () => {
              Alert.alert(
                'Xóa khóa học',
                `Bạn chắc chắn muốn xóa khóa "${item.title}"?`,
                [
                  { text: 'Hủy', style: 'cancel' },
                  {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await deleteCourse(item._id).unwrap();
                        // Không reset trang/filter; chỉ remove item khỏi list hiện tại
                        setCourses(prev => prev.filter(c => c._id !== item._id));
                      } catch (e: any) {
                        Alert.alert(
                          'Lỗi',
                          e?.message || 'Không thể xóa khóa học. Vui lòng thử lại.',
                        );
                      }
                    },
                  },
                ],
              );
            };

            const submitForReview = async () => {
              try {
                await updateCourse({
                  courseId: item._id,
                  payload: { submitForReview: true },
                }).unwrap();
                // Không reset trang/filter; cập nhật trạng thái item tại chỗ
                setCourses(prev =>
                  prev.map(c => (c._id === item._id ? { ...c, status: 'pending' } : c)),
                );
                Alert.alert('Thành công', 'Đã gửi khóa học chờ admin duyệt. Trạng thái: Chờ duyệt.');
              } catch (e: any) {
                const msg =
                  e?.data?.message ??
                  e?.error?.data?.message ??
                  e?.message ??
                  'Không thể gửi xét duyệt. Kiểm tra đăng nhập và quyền sở hữu khóa.';
                Alert.alert('Lỗi', msg);
              }
            };

            const handleSubmitForReview = () => {
              const isResubmit = item.status === 'rejected';
              // react-native-web Alert không hỗ trợ buttons đầy đủ → nút "Gửi" có thể không chạy.
              // Trên web, submit thẳng để đảm bảo request PUT được gửi lên backend.
              if (Platform.OS === 'web') {
                submitForReview();
                return;
              }
              Alert.alert(
                'Gửi xét duyệt',
                isResubmit
                  ? 'Gửi lại khóa học cho admin duyệt?'
                  : 'Gửi bản nháp này cho admin duyệt? Sau khi duyệt, khóa học mới hiển thị cho học viên.',
                [
                  { text: 'Hủy', style: 'cancel' },
                  {
                    text: 'Gửi',
                    onPress: submitForReview,
                  },
                ],
              );
            };

            return (
              <InstructorCourseRow
                item={item as InstructorCourseItem}
                role={role}
                onPressDetail={() =>
                  navigation.navigate(ROUTES.COURSE_DETAIL as never, { courseId: item._id })
                }
                onPressEdit={handleEditCourse}
                onPressDelete={handleDeleteCourse}
                onPressSubmit={handleSubmitForReview}
              />
            );
          }}
          ListFooterComponent={
            canLoadMore ? (
              <Text style={styles.helperText}>Đang tải thêm...</Text>
            ) : null
          }
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
    paddingTop: 0,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: SPACING[5],
  },
  filterRow: {
    alignItems: 'center',
    paddingVertical: SPACING[2],
    gap: 10,
    paddingRight: SPACING[2],
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: COLORS.textInverse,
  },
  headerCard: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: SPACING[5],
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: SPACING[6],
    marginHorizontal: -SPACING[6],
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING[4],
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    ...TYPOGRAPHY.h5,
    color: COLORS.textInverse,
    fontWeight: '800',
  },
  headerTextWrap: {
    marginLeft: SPACING[3],
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  headerHello: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.white,
    fontWeight: '700',
  },
  headerEmail: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.white,
    fontWeight: '800',
  },
  vipBadge: {
    marginLeft: SPACING[2],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  vipLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textInverse,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.textInverse,
  },
  searchBar: {
    marginTop: SPACING[3],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    paddingHorizontal: SPACING[4],
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  searchPlaceholder: {
    flex: 1,
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: SPACING[2],
    paddingVertical: Platform.OS === 'web' ? 10 : 0,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginBottom: SPACING[1],
  },
  helperText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  errorText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.error,
  },
  listContent: {
    paddingTop: SPACING[2],
    paddingBottom: SPACING[8],
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING[4],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  coursePressArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  courseInfo: {
    flex: 1,
    paddingRight: SPACING[3],
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: SPACING[3],
    backgroundColor: COLORS.surfaceSecondary,
  },
  courseTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  courseMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  courseMetaHighlight: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  courseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceSecondary,
  },
  actionButtonSubmit: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
});

