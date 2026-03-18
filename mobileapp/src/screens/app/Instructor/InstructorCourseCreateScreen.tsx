import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Modal,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { Input, Button, Select } from '@/components/ui';
import axiosInstance from '@/api/axiosInstance';
import { API_ENDPOINTS } from '@/api/endpoints';
import {
  useCreateCourseMutation,
  useCreateLessonMutation,
  useGetCurriculumQuery,
  useGetCourseByIdQuery,
  useUpdateLessonMutation,
  useDeleteLessonMutation,
  useReorderLessonsMutation,
} from '@/store/api/coursesApi';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ROUTES } from '@/constants/routes';
import * as ImagePicker from 'expo-image-picker';
import { useUpdateCourseMutation } from '@/store/api/instructorApi';

type Category = {
  _id: string;
  name: string;
};

export const InstructorCourseCreateScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editingCourseId: string | undefined = route.params?.courseId;
  const isEditing = !!editingCourseId;

  const [createCourse, { isLoading }] = useCreateCourseMutation();
  const [createLesson, { isLoading: creatingLesson }] = useCreateLessonMutation();
  const [updateLesson] = useUpdateLessonMutation();
  const [deleteLesson] = useDeleteLessonMutation();
  const [reorderLessons] = useReorderLessonsMutation();
  const [updateCourse, { isLoading: updatingCourse }] = useUpdateCourseMutation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [lessonModalVisible, setLessonModalVisible] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    type: 'video' as 'video' | 'text' | 'quiz',
    videoUrl: '',
    duration: '',
    isPreview: false,
    resources: '',
    content: '',
  });

  const {
    data: editingCourse,
    isLoading: loadingEditingCourse,
  } = useGetCourseByIdQuery(editingCourseId as string, {
    skip: !editingCourseId,
  });

  const {
    data: createdCurriculum = [],
    refetch: refetchCurriculum,
  } = useGetCurriculumQuery(createdCourseId ?? '', {
    skip: !createdCourseId,
  } as any);
  const [curriculum, setCurriculum] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    syllabus: '',
    categoryId: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    price: '0',
    thumbnail: '',
    estimatedCompletionHours: '0',
  });

  useEffect(() => {
    if (editingCourseId) {
      setCreatedCourseId(editingCourseId);
    }
  }, [editingCourseId]);

  useEffect(() => {
    setCurriculum(createdCurriculum as any[]);
  }, [createdCurriculum]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await axiosInstance.get(API_ENDPOINTS.CATEGORIES.LIST);
        const json = (res as any)?.data;
        if (json?.success && Array.isArray(json.data)) {
          setCategories(json.data);
        } else {
          setCategories([]);
        }
      } catch (e) {
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    void fetchCategories();
  }, []);

  useEffect(() => {
    if (!isEditing || !editingCourse) return;

    const anyCourse = editingCourse as any;
    const category =
      typeof anyCourse.categoryId === 'object' && anyCourse.categoryId !== null
        ? anyCourse.categoryId._id
        : anyCourse.categoryId;

    setForm(prev => ({
      ...prev,
      title: anyCourse.title ?? '',
      description: anyCourse.description ?? '',
      syllabus: anyCourse.syllabus ?? '',
      categoryId: category ?? '',
      level: (anyCourse.level as 'beginner' | 'intermediate' | 'advanced') ?? 'beginner',
      price: String(anyCourse.price ?? '0'),
      thumbnail: anyCourse.thumbnail ?? '',
      estimatedCompletionHours: String(anyCourse.estimatedCompletionHours ?? '0'),
    }));
  }, [isEditing, editingCourse]);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên khóa học.');
      return;
    }
    if (!form.description.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mô tả khóa học.');
      return;
    }
    if (!form.categoryId) {
      Alert.alert('Lỗi', 'Vui lòng chọn danh mục khóa học.');
      return;
    }

    const estimatedHours = Number(form.estimatedCompletionHours) || 0;
    if (estimatedHours < 0) {
      Alert.alert('Lỗi', 'Thời gian học ước tính phải lớn hơn 0.');
      return;
    }

    const priceNumber = Number(form.price) || 0;

    try {
      if (isEditing && editingCourseId) {
        await updateCourse({
          courseId: editingCourseId,
          payload: {
            title: form.title.trim(),
            description: form.description.trim(),
            syllabus: form.syllabus.trim() || undefined,
            categoryId: form.categoryId,
            level: form.level,
            price: priceNumber,
            thumbnail: form.thumbnail.trim() || undefined,
            estimatedCompletionHours: estimatedHours,
          },
        }).unwrap();

        Alert.alert('Thành công', 'Đã cập nhật khóa học.', [
          {
            text: 'Xem khóa học',
            onPress: () => {
              navigation.navigate(ROUTES.COURSE_DETAIL as never, { courseId: editingCourseId });
            },
          },
          {
            text: 'Đóng',
            style: 'cancel',
          },
        ]);
      } else {
        const result = await createCourse({
          title: form.title.trim(),
          description: form.description.trim(),
          syllabus: form.syllabus.trim() || undefined,
          categoryId: form.categoryId,
          level: form.level,
          price: priceNumber,
          thumbnail: form.thumbnail.trim() || undefined,
          estimatedCompletionHours: estimatedHours,
        }).unwrap();

        if (result?._id) {
          setCreatedCourseId(result._id);
        }

        Alert.alert('Thành công', 'Đã tạo khóa học! Bạn có thể thêm bài học.', [
          {
            text: 'Xem khóa học',
            onPress: () => {
              if (result?._id) {
                navigation.navigate(ROUTES.COURSE_DETAIL as never, { courseId: result._id });
              }
            },
          },
          {
            text: 'Đóng',
            style: 'cancel',
          },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || (isEditing ? 'Không thể cập nhật khóa học.' : 'Không thể tạo khóa học.'));
    }
  };

  const resetLessonForm = () => {
    setLessonForm({
      title: '',
      type: 'video',
      videoUrl: '',
      duration: '',
      isPreview: false,
      resources: '',
      content: '',
    });
    setEditingLessonId(null);
  };

  const handleCreateLesson = async () => {
    if (!createdCourseId) return;
    if (!lessonForm.title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên bài học.');
      return;
    }
    if (lessonForm.type === 'video' && !lessonForm.videoUrl.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập URL video (YouTube, v.v.).');
      return;
    }
    const durationNumber = Number(lessonForm.duration) || 0;
    try {
      if (editingLessonId) {
        const updated = await updateLesson({
          lessonId: editingLessonId,
          title: lessonForm.title.trim(),
          type: lessonForm.type,
          videoUrl: lessonForm.videoUrl.trim() || undefined,
          content: lessonForm.content.trim() || undefined,
          resources: lessonForm.resources.trim() || undefined,
          duration: durationNumber,
          isPreview: lessonForm.isPreview,
        }).unwrap();
        setCurriculum(prev =>
          prev.map(l => (l._id === (updated as any)._id ? updated : l)),
        );
        Alert.alert('Thành công', 'Đã cập nhật bài học.');
      } else {
        const created = await createLesson({
          courseId: createdCourseId,
          title: lessonForm.title.trim(),
          type: lessonForm.type,
          videoUrl: lessonForm.videoUrl.trim() || undefined,
          content: lessonForm.content.trim() || undefined,
          resources: lessonForm.resources.trim() || undefined,
          duration: durationNumber,
          isPreview: lessonForm.isPreview,
        }).unwrap();
        setCurriculum(prev => [...prev, created as any]);
        Alert.alert('Thành công', 'Đã thêm bài học.');
      }
      resetLessonForm();
      setLessonModalVisible(false);
      void refetchCurriculum();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể thêm bài học.');
    }
  };

  const handlePickAndUploadThumbnail = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập thư viện ảnh');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]?.uri) {
        return;
      }

      setUploadingThumbnail(true);
      const formData = new FormData();
      // Backend expects field name "thumbnail"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formData.append('thumbnail', {
        uri: result.assets[0].uri,
        name: 'thumbnail.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await axiosInstance.post(API_ENDPOINTS.UPLOAD.THUMBNAIL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const json = (response as any)?.data;
      const url = json?.data?.url || json?.url;
      if (!url) {
        throw new Error('Không lấy được URL ảnh từ server');
      }
      handleChange('thumbnail', url);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể upload ảnh bìa.');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{isEditing ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}</Text>
      <Text style={styles.subtitle}>
        {isEditing
          ? 'Cập nhật thông tin khóa học và quản lý curriculum.'
          : 'Điền thông tin cơ bản, sau đó bạn có thể thêm bài học và nội dung.'}
      </Text>

      {isEditing && loadingEditingCourse && (
        <View style={{ marginBottom: SPACING[4] }}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}

      <Input
        label="Tên khóa học *"
        value={form.title}
        onChangeText={v => handleChange('title', v)}
        placeholder="Nhập tên khóa học"
      />

      <Input
        label="Mô tả *"
        value={form.description}
        onChangeText={v => handleChange('description', v)}
        placeholder="Mô tả ngắn về khóa học"
        multiline
      />

      <Input
        label="Syllabus / Nội dung chính"
        value={form.syllabus}
        onChangeText={v => handleChange('syllabus', v)}
        placeholder="Tóm tắt các chương, bài học..."
        multiline
      />

      <Text style={styles.label}>Danh mục *</Text>
      {loadingCategories ? (
        <Text style={styles.helperText}>Đang tải danh mục...</Text>
      ) : (
        <Select
          value={form.categoryId}
          onChange={val => handleChange('categoryId', String(val))}
          placeholder="Chọn danh mục"
          options={categories.map(cat => ({ label: cat.name, value: cat._id }))}
        />
      )}

      <Text style={styles.label}>Trình độ</Text>
      <Select
        value={form.level}
        onChange={val =>
          handleChange('level', val as 'beginner' | 'intermediate' | 'advanced')
        }
        options={[
          { label: 'Cơ bản', value: 'beginner' },
          { label: 'Trung cấp', value: 'intermediate' },
          { label: 'Nâng cao', value: 'advanced' },
        ]}
      />

      <Input
        label="Giá (VNĐ)"
        value={form.price}
        onChangeText={v => handleChange('price', v.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
        placeholder="0"
      />

      <Text style={styles.label}>Ảnh bìa</Text>
      <View style={styles.thumbnailRow}>
        <Button
          title={uploadingThumbnail ? 'Đang upload...' : 'Chọn ảnh upload'}
          onPress={handlePickAndUploadThumbnail}
          loading={uploadingThumbnail}
          disabled={uploadingThumbnail}
          size="sm"
        />
        <View style={{ flex: 1, marginLeft: SPACING[3] }}>
          <Input
            label="hoặc nhập URL"
            value={form.thumbnail}
            onChangeText={v => handleChange('thumbnail', v)}
            placeholder="https://..."
            containerStyle={{ marginBottom: 0 }}
          />
        </View>
      </View>
      {!!form.thumbnail && (
        <Image source={{ uri: form.thumbnail }} style={styles.thumbnailPreview} />
      )}

      <Input
        label="Thời gian học ước tính (giờ)"
        value={form.estimatedCompletionHours}
        onChangeText={v => handleChange('estimatedCompletionHours', v.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
        placeholder="0"
      />

      <Button
        title={isEditing ? 'Lưu thay đổi' : 'Tạo khóa học'}
        onPress={handleSubmit}
        loading={isEditing ? updatingCourse : isLoading}
        disabled={isEditing ? updatingCourse : isLoading}
        style={styles.submitButton}
      />

      {isEditing &&
        editingCourseId &&
        ((editingCourse as any)?.status === 'draft' || (editingCourse as any)?.status === 'rejected') && (
          <Button
            title="Gửi xét duyệt"
            onPress={async () => {
              try {
                await updateCourse({
                  courseId: editingCourseId,
                  payload: { submitForReview: true },
                }).unwrap();
                Alert.alert(
                  'Đã gửi',
                  'Khóa học đã được gửi cho admin duyệt. Sau khi duyệt, khóa sẽ hiển thị cho học viên.',
                  [{ text: 'OK' }],
                );
              } catch (e: any) {
                Alert.alert('Lỗi', e?.message || 'Không thể gửi xét duyệt.');
              }
            }}
            loading={updatingCourse}
            disabled={updatingCourse}
            variant="outline"
            style={[styles.submitButton, { marginTop: SPACING[2] }]}
          />
        )}

      {createdCourseId && (
        <View style={styles.nextStepsSection}>
          <Text style={styles.nextStepsTitle}>Bước tiếp theo</Text>

          <View style={styles.nextCard}>
            <View style={styles.nextCardHeader}>
              <Text style={styles.nextCardTitle}>Nội dung khóa học (Curriculum)</Text>
              <Button
                title="+ Thêm bài học"
                size="sm"
                onPress={() => {
                  resetLessonForm();
                  setLessonModalVisible(true);
                }}
              />
            </View>
            {createdCurriculum.length === 0 ? (
              <Text style={styles.nextCardDescription}>
                Chưa có bài học. Nhấn &quot;Thêm bài học&quot; để tạo.
              </Text>
            ) : (
              <View style={styles.lessonList}>
                {curriculum.map((lesson: any, index: number) => {
                  const canMoveUp = index > 0;
                  const canMoveDown = index < createdCurriculum.length - 1;
                  const handleMove = async (direction: 'up' | 'down') => {
                    if (!createdCourseId) return;
                    const copy = [...createdCurriculum];
                    const targetIndex = direction === 'up' ? index - 1 : index + 1;
                    const tmp = copy[targetIndex];
                    copy[targetIndex] = copy[index];
                    copy[index] = tmp;
                    setCurriculum(copy);
                    try {
                      await reorderLessons({
                        courseId: createdCourseId,
                        lessons: copy.map((l: any, idx: number) => ({
                          id: l._id,
                          order: idx + 1,
                        })),
                      }).unwrap();
                      void refetchCurriculum();
                    } catch (e: any) {
                      Alert.alert('Lỗi', e?.message || 'Không thể đổi thứ tự bài học.');
                    }
                  };

                  const handleEdit = () => {
                    setEditingLessonId(lesson._id);
                    setLessonForm({
                      title: lesson.title ?? '',
                      type: (lesson.type as any) ?? 'video',
                      videoUrl: lesson.videoUrl ?? '',
                      duration: String(lesson.duration ?? ''),
                      isPreview: !!lesson.isPreview,
                      resources: lesson.resources ?? '',
                      content: lesson.content ?? '',
                    });
                    setLessonModalVisible(true);
                  };

                  const handleDelete = async () => {
                    Alert.alert('Xóa bài học', 'Bạn chắc chắn muốn xóa bài học này?', [
                      { text: 'Hủy', style: 'cancel' },
                      {
                        text: 'Xóa',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await deleteLesson(lesson._id).unwrap();
                            setCurriculum(prev => prev.filter(l => l._id !== lesson._id));
                            void refetchCurriculum();
                          } catch (e: any) {
                            Alert.alert('Lỗi', e?.message || 'Không thể xóa bài học.');
                          }
                        },
                      },
                    ]);
                  };

                  return (
                    <View key={lesson._id ?? index} style={styles.lessonRow}>
                      <Text style={styles.lessonIndex}>{index + 1}.</Text>
                      <View style={styles.lessonInfo}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.lessonTitle} numberOfLines={1}>
                            {lesson.title || 'Bài học'}
                          </Text>
                          <Text style={styles.lessonMeta}>
                            {lesson.type === 'video'
                              ? '📹 video'
                              : lesson.type === 'text'
                              ? '📄 text'
                              : '❓ quiz'}
                          </Text>
                        </View>
                        <View style={styles.lessonActions}>
                          <TouchableOpacity
                            style={[styles.iconButton, !canMoveUp && styles.iconButtonDisabled]}
                            onPress={() => canMoveUp && handleMove('up')}
                            disabled={!canMoveUp}
                          >
                            <Text style={styles.iconButtonText}>↑</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.iconButton, !canMoveDown && styles.iconButtonDisabled]}
                            onPress={() => canMoveDown && handleMove('down')}
                            disabled={!canMoveDown}
                          >
                            <Text style={styles.iconButtonText}>↓</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.iconButton} onPress={handleEdit}>
                            <Text style={styles.iconButtonText}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.iconButton} onPress={handleDelete}>
                            <Text style={styles.iconButtonText}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      )}

      <Modal
        visible={lessonModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setLessonModalVisible(false)}
      >
        <View style={styles.lessonModalOverlay}>
          <View style={styles.lessonModal}>
            <View style={styles.lessonModalHeader}>
              <Text style={styles.lessonModalTitle}>Thêm bài học</Text>
              <TouchableOpacity onPress={() => setLessonModalVisible(false)}>
                <Text style={styles.lessonModalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: Platform.OS === 'web' ? 520 : 600 }}
              contentContainerStyle={{ paddingBottom: SPACING[4] }}
              keyboardShouldPersistTaps="handled"
            >
              <Input
                label="Tên bài học *"
                value={lessonForm.title}
                onChangeText={v => setLessonForm(prev => ({ ...prev, title: v }))}
                placeholder="VD: Bài 1 – Giới thiệu khóa học"
              />

              <Text style={styles.label}>Loại bài học</Text>
              <Select
                value={lessonForm.type}
                onChange={val =>
                  setLessonForm(prev => ({ ...prev, type: val as 'video' | 'text' | 'quiz' }))
                }
                options={[
                  { label: 'Video', value: 'video' },
                  { label: 'Văn bản', value: 'text' },
                  { label: 'Quiz', value: 'quiz' },
                ]}
              />

              <Input
                label="Thời lượng (giây)"
                value={lessonForm.duration}
                onChangeText={v => setLessonForm(prev => ({ ...prev, duration: v.replace(/[^0-9]/g, '') }))}
                keyboardType="numeric"
                placeholder="0"
              />

              {lessonForm.type === 'video' && (
                <Input
                  label="URL video (YouTube, v.v.)"
                  value={lessonForm.videoUrl}
                  onChangeText={v => setLessonForm(prev => ({ ...prev, videoUrl: v }))}
                  placeholder="https://www.youtube.com/..."
                />
              )}

              {lessonForm.type === 'text' && (
                <Input
                  label="Nội dung text"
                  value={lessonForm.content}
                  onChangeText={v => setLessonForm(prev => ({ ...prev, content: v }))}
                  placeholder="Nội dung bài học..."
                  multiline
                />
              )}

              <Input
                label="Tài liệu tham khảo"
                value={lessonForm.resources}
                onChangeText={v => setLessonForm(prev => ({ ...prev, resources: v }))}
                placeholder="Ghi chú tài liệu, link slide, repo, bài viết... Mỗi dòng một mục."
                multiline
              />
            </ScrollView>

            <View style={styles.lessonModalFooter}>
              <Button
                title="Hủy"
                variant="outline"
                size="sm"
                onPress={() => {
                  setLessonModalVisible(false);
                }}
                style={{ flex: 1, marginRight: SPACING[3] }}
              />
              <Button
                title={creatingLesson ? 'Đang lưu...' : 'Thêm bài học'}
                onPress={handleCreateLesson}
                loading={creatingLesson}
                disabled={creatingLesson}
                size="sm"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING[6],
    paddingTop: SPACING[8],
    paddingBottom: SPACING[8],
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
  label: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    marginBottom: SPACING[2],
  },
  helperText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING[4],
  },
  submitButton: {
    marginTop: SPACING[4],
  },
  thumbnailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  thumbnailPreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: SPACING[4],
    backgroundColor: COLORS.gray200,
  },
  nextStepsSection: {
    marginTop: SPACING[8],
    gap: SPACING[4],
  },
  nextStepsTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginBottom: SPACING[1],
  },
  nextCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING[4],
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  nextCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[2],
  },
  nextCardTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  nextCardDescription: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  lessonList: {
    marginTop: SPACING[3],
    gap: SPACING[2],
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  lessonIndex: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    width: 18,
  },
  lessonInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonTitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textPrimary,
    fontWeight: '600',
    flex: 1,
    marginRight: SPACING[2],
  },
  lessonMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  lessonActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: SPACING[2],
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  iconButtonDisabled: {
    opacity: 0.4,
  },
  iconButtonText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  lessonModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
  },
  lessonModal: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    padding: SPACING[5],
  },
  lessonModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  lessonModalTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  lessonModalClose: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textSecondary,
  },
  lessonModalFooter: {
    flexDirection: 'row',
    marginTop: SPACING[4],
  },
});

