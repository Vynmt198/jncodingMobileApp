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
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useDeleteCourseMutation, useGetMyCoursesQuery, useUpdateCourseMutation } from '@/store/api/instructorApi';
import { ROUTES } from '@/constants/routes';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/store/hooks';
import { useGetCourseByIdQuery } from '@/store/api/coursesApi';

type InstructorCourseItem = {
  _id: string;
  title: string;
  status?: string;
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  pending: 'Chờ duyệt',
  active: 'Đã duyệt',
  rejected: 'Bị từ chối',
  disabled: 'Ẩn',
};

interface CourseRowProps {
  item: InstructorCourseItem;
  onPressDetail: () => void;
  onPressEdit: () => void;
  onPressDelete: () => void;
  onPressSubmit?: () => void;
}

const InstructorCourseRow: React.FC<CourseRowProps> = ({
  item,
  onPressDetail,
  onPressEdit,
  onPressDelete,
  onPressSubmit,
}) => {
  const { data: courseDetail } = useGetCourseByIdQuery(item._id);

  const thumb =
    (courseDetail as any)?.thumbnail ||
    (item as any).thumbnail ||
    'https://placehold.co/100x100?text=Course';
  const level = (courseDetail as any)?.level ?? (item as any).level ?? '—';
  const status = (courseDetail as any)?.status ?? (item as any).status ?? '—';
  const statusLabel = STATUS_LABELS[String(status)] ?? status;
  const enrollments =
    (courseDetail as any)?.enrollmentCount ?? (item as any).enrollmentCount ?? 0;
  const canSubmit = status === 'draft' || status === 'rejected';

  return (
    <TouchableOpacity
      style={styles.courseRow}
      activeOpacity={0.85}
      onPress={onPressDetail}
    >
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
      <View style={styles.courseActions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            !canSubmit && { opacity: 0.35 },
          ]}
          activeOpacity={canSubmit ? 0.8 : 1}
          onPress={canSubmit && onPressSubmit ? onPressSubmit : undefined}
        >
          <Ionicons name="paper-plane-outline" size={18} color={COLORS.secondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.8}
          onPress={onPressEdit}
        >
          <Ionicons name="create-outline" size={18} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.8}
          onPress={onPressDelete}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export const InstructorMyCoursesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { data, isLoading, isError, refetch } = useGetMyCoursesQuery();
  const [deleteCourse] = useDeleteCourseMutation();
  const [updateCourse] = useUpdateCourseMutation();
  const user = useAppSelector(s => s.auth.user);
  const [searchQuery, setSearchQuery] = React.useState('');

  const courses = data?.courses ?? [];
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

      {isLoading && <Text style={styles.helperText}>Đang tải danh sách khóa học...</Text>}
      {isError && !isLoading && (
        <Text style={styles.errorText}>Không thể tải danh sách khóa học.</Text>
      )}

      {!isLoading && !isError && (
        <FlatList
          data={filteredCourses}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
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
                        await refetch();
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

            const handleSubmitForReview = () => {
              Alert.alert(
                'Gửi xét duyệt',
                'Gửi bản nháp này cho admin duyệt? Sau khi duyệt, khóa học mới hiển thị cho học viên.',
                [
                  { text: 'Hủy', style: 'cancel' },
                  {
                    text: 'Gửi',
                    onPress: async () => {
                      try {
                        await updateCourse({
                          courseId: item._id,
                          payload: { submitForReview: true },
                        }).unwrap();
                        await refetch();
                        Alert.alert('Thành công', 'Đã gửi khóa học chờ admin duyệt.');
                      } catch (e: any) {
                        Alert.alert(
                          'Lỗi',
                          e?.message || 'Không thể gửi xét duyệt. Vui lòng thử lại.',
                        );
                      }
                    },
                  },
                ],
              );
            };

            return (
              <InstructorCourseRow
                item={item as InstructorCourseItem}
                onPressDetail={() =>
                  navigation.navigate(ROUTES.COURSE_DETAIL as never, { courseId: item._id })
                }
                onPressEdit={handleEditCourse}
                onPressDelete={handleDeleteCourse}
                onPressSubmit={handleSubmitForReview}
              />
            );
          }}
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
});

