import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, TYPOGRAPHY, SPACING, SHADOW } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGetCourseByIdQuery, useGetCurriculumQuery, useGetCourseLearningQuery } from '@/store/api/coursesApi';
import { useEnrollFreeCourseMutation } from '@/store/api/enrollmentsApi';
import { ROUTES } from '@/constants/routes';
import type { AppStackParamList } from '@/types/navigation.types';
import axiosInstance from '@/api/axiosInstance';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

const { width } = Dimensions.get('window');

type TabType = 'overview' | 'curriculum' | 'reviews';

type Nav = NativeStackNavigationProp<AppStackParamList, typeof ROUTES.COURSE_DETAIL>;

export const CourseDetailScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<AppStackParamList, typeof ROUTES.COURSE_DETAIL>>();
  const courseId = (route.params?.courseId ?? (route.params as { id?: string })?.id ?? '') as string;

  const { data: courseData, isLoading: loadingCourse, error: courseError } = useGetCourseByIdQuery(courseId, {
    skip: !courseId,
  });
  const { data: curriculumData, isLoading: loadingCurriculum } = useGetCurriculumQuery(courseId, { skip: !courseId });
  const { data: learningData } = useGetCourseLearningQuery(courseId, { skip: !courseId || !(courseData as { isEnrolled?: boolean })?.isEnrolled });
  const [enrollFree, { isLoading: enrolling }] = useEnrollFreeCourseMutation();

  const course = courseData as any;
  const curriculum: any[] = Array.isArray(curriculumData) ? curriculumData : [];
  const lessonsWithQuizId = (learningData as any)?.lessons ?? [];
  const lessonIdToQuizId: Record<string, string> = {};
  lessonsWithQuizId.forEach((l: any) => {
    if (l.type === 'quiz' && l.quizId) lessonIdToQuizId[l._id] = l.quizId;
  });
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [expandedSections, setExpandedSections] = useState<number[]>([0]);

  // Lấy user hiện tại để quyết định quyền review
  const auth = useSelector((state: RootState) => state.auth);
  const currentUserId = (auth as any)?.user?._id;

  const [myReview, setMyReview] = useState<any | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [editing, setEditing] = useState<boolean>(false);

  const isEnrolled = !!course?.isEnrolled;
  const price = Number(course?.price) ?? 0;
  const loading = loadingCourse || !course;

  const canReview = !!currentUserId && isEnrolled;

  // Khi myReview thay đổi (sau khi gửi lần đầu hoặc reload), đồng bộ lại rating/comment trong form
  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating ?? 0);
      setComment(myReview.reviewText ?? '');
      setEditing(false);
    }
  }, [myReview?._id]);

  useEffect(() => {
    if (!courseId) return;
    axiosInstance
      .get(`/courses/${courseId}/reviews`)
      .then(res => {
        if (res.data?.success && Array.isArray(res.data.data)) setReviews(res.data.data);
      })
      .catch(() => {});
  }, [courseId]);
  // Fetch review của riêng user hiện tại để luôn có _id chính xác cho PUT/DELETE
  useEffect(() => {
    if (!courseId || !canReview) return;
    axiosInstance
      .get(`/reviews/my-review/${courseId}`)
      .then(res => {
        const data = res.data?.data;
        const review = data?.review ?? data;
        if (review) {
          setMyReview(review);
        } else {
          setMyReview(null);
        }
      })
      .catch((err: any) => {
        if (err?.response?.status === 404) {
          // Chưa có review
          setMyReview(null);
        }
      });
  }, [courseId, canReview]);

  const toggleSection = (index: number) => {
    setExpandedSections(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Nếu không có màn hình trước (ví dụ mở trực tiếp trên web),
      // thì quay về danh sách khóa học.
      navigation.navigate(ROUTES.COURSE_LISTING as any);
    }
  };

  const handleSubmitReview = async () => {
    if (!canReview || !courseId) return;
    if (!rating) {
      Alert.alert('Thông báo', 'Vui lòng chọn số sao đánh giá.');
      return;
    }
    try {
      if (!myReview) {
        const res = await axiosInstance.post('/reviews', {
          courseId,
          rating,
          reviewText: comment,
        });
        const created = res.data?.data?.review ?? res.data?.data;
        if (res.data?.success && created) {
          setReviews(prev => [...prev, created]);
          setMyReview(created);
          setEditing(false);
        }
      } else {
        const res = await axiosInstance.put(
          `/reviews/${myReview._id}`,
          { rating, reviewText: comment },
        );
        const updated = res.data?.data?.review ?? res.data?.data;
        if (res.data?.success && updated) {
          setReviews(prev => prev.map(r => (r._id === myReview._id ? updated : r)));
          setMyReview(updated);
          setEditing(false);
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Không lưu được đánh giá.';
      Alert.alert('Lỗi', msg);
    }
  };

  const handleDeleteReview = async () => {
    if (!myReview || !courseId) return;
    Alert.alert('Xóa đánh giá', 'Bạn có chắc muốn xóa đánh giá này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await axiosInstance.delete(`/reviews/${myReview._id}`);
            setReviews(prev => prev.filter(r => r._id !== myReview._id));
            setRating(0);
            setComment('');
                setMyReview(null);
            setEditing(false);
          } catch (err: any) {
            const msg = err?.response?.data?.message ?? 'Không xóa được đánh giá.';
            Alert.alert('Lỗi', msg);
          }
        },
      },
    ]);
  };

  const handleEnrollPress = async () => {
    if (!courseId) return;
    if (isEnrolled) {
      navigation.navigate(ROUTES.COURSE_PLAYER, { courseId, lessonId: undefined });
      return;
    }
    if (price === 0) {
      try {
        await enrollFree(courseId).unwrap();
        navigation.navigate(ROUTES.COURSE_PLAYER, { courseId, lessonId: undefined });
      } catch (err: any) {
        const msg = err?.data?.message ?? err?.message ?? 'Đăng ký thất bại. Thử lại.';
        Alert.alert('Lỗi', msg);
      }
      return;
    }
    navigation.navigate('Payment', {
      courseId,
      courseTitle: course?.title ?? 'Khóa học',
      price,
    });
  };

  if (!courseId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Thiếu thông tin khóa học. Vui lòng chọn từ danh sách.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: SPACING[4] }}>
          <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (courseError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Không tải được khóa học. Kiểm tra kết nối hoặc thử lại.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: SPACING[4] }}>
          <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading || !course) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  const renderOverview = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>About this course</Text>
      <Text style={styles.description}>{course.description}</Text>
      
      <View style={styles.instructorCard}>
        <Text style={styles.instructorTitle}>Instructor</Text>
        <View style={styles.instructorInfo}>
          <Image 
            source={{ uri: course.instructorId?.avatar || 'https://via.placeholder.com/60' }} 
            style={styles.instructorAvatar} 
          />
          <View style={styles.instructorText}>
            <Text style={styles.instructorName}>{course.instructorId?.fullName}</Text>
            <Text style={styles.instructorBio} numberOfLines={2}>{course.instructorId?.bio || 'Expert Instructor'}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  /** duration: seconds. Format as "Mm:Ss" or "Xh Ym", cap absurd values. */
  const formatLessonDuration = (duration: number | null | undefined): string => {
    if (duration == null || duration < 0) return '—';
    const sec = Math.floor(Number(duration));
    if (sec >= 3600) {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      return h > 99 ? '—' : `${h}h ${m}m`;
    }
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  /** totalSeconds → "Xh Ym" or "Xm". */
  const formatTotalDuration = (totalSeconds: number): string => {
    const sec = Math.floor(totalSeconds);
    if (sec <= 0) return '0m';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const renderCurriculum = () => {
    // Group lessons into sections (Mock groups for UI)
    const lessonsPerSection = 3;
    const sections = [];
    for (let i = 0; i < curriculum.length; i += lessonsPerSection) {
      sections.push({
        title: `Module ${Math.floor(i / lessonsPerSection) + 1}`,
        lessons: curriculum.slice(i, i + lessonsPerSection),
      });
    }

    return (
      <View style={styles.tabContent}>
        <View style={styles.curriculumHeader}>
          <Text style={styles.curriculumTitle}>Course Content</Text>
          <Text style={styles.curriculumMeta}>
            {sections.length} sections • {curriculum.length} lectures • {formatTotalDuration(curriculum.reduce((acc, l) => acc + (l.duration || 0), 0))} total length
          </Text>
        </View>

        {sections.map((section, idx) => {
          const isExpanded = expandedSections.includes(idx);
          return (
            <View key={idx} style={styles.sectionContainer}>
              <TouchableOpacity 
                style={[styles.sectionHeader, isExpanded && styles.sectionHeaderActive]} 
                onPress={() => toggleSection(idx)}
                activeOpacity={0.7}
              >
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons 
                    name={isExpanded ? "chevron-down" : "chevron-forward"} 
                    size={20} 
                    color={isExpanded ? COLORS.secondary : COLORS.gray400} 
                  />
                  <Text style={[styles.accordionTitle, isExpanded && styles.accordionTitleActive]}>
                    {section.title}
                  </Text>
                </View>
                <Text style={styles.sectionMeta}>{section.lessons.length} lessons</Text>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.lessonsContainer}>
                  {section.lessons.map((lesson: any) => {
                    const isQuiz = lesson.type === 'quiz';
                    const quizId = isQuiz ? (lesson.quizId ?? lessonIdToQuizId[lesson._id]) : null;
                    const canOpenQuiz = isQuiz && course.isEnrolled && quizId;
                    const canOpenLesson = !isQuiz && (lesson.isPreview || course.isEnrolled);
                    const canOpenQuizOrGoToPlayer = isQuiz && course.isEnrolled;
                    const onPress = () => {
                      if (canOpenQuiz) {
                        navigation.navigate('QuizStart', {
                          quizId,
                          courseId,
                          lessonId: lesson._id,
                        });
                      } else if (canOpenLesson) {
                        navigation.navigate(ROUTES.COURSE_PLAYER, { courseId, lessonId: lesson._id });
                      } else if (canOpenQuizOrGoToPlayer) {
                        navigation.navigate(ROUTES.COURSE_PLAYER, { courseId, lessonId: lesson._id });
                      }
                    };
                    const canPress = canOpenQuiz || canOpenLesson || canOpenQuizOrGoToPlayer;
                    const LessonRowWrapper = Platform.OS === 'web' ? Pressable : TouchableOpacity;
                    const lessonRowProps = Platform.OS === 'web'
                      ? { onPress: canPress ? onPress : undefined, style: styles.lessonItem, disabled: !canPress }
                      : { onPress, disabled: !canPress, activeOpacity: 0.7, style: styles.lessonItem, hitSlop: { top: 8, bottom: 8, left: 8, right: 8 } };
                    return (
                      <LessonRowWrapper
                        key={lesson._id}
                        {...lessonRowProps}
                      >
                        <View style={styles.lessonLeft}>
                          <View style={styles.lessonIconContainer}>
                            {lesson.isPreview ? (
                              <Ionicons name="play-circle" size={24} color={COLORS.secondary} />
                            ) : isQuiz ? (
                              <Ionicons name="help-buoy" size={24} color={canOpenQuiz ? COLORS.primary : COLORS.gray300} />
                            ) : course.isEnrolled ? (
                              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                            ) : (
                              <Ionicons name="lock-closed" size={22} color={COLORS.gray300} />
                            )}
                          </View>
                          <View style={styles.lessonInfo}>
                            <Text style={styles.lessonName} numberOfLines={1}>{lesson.title}</Text>
                            <View style={styles.lessonMetaRow}>
                              <Text style={styles.lessonType}>{lesson.type.toUpperCase()}</Text>
                              <Text style={styles.dot}> • </Text>
                              <Text style={styles.lessonDuration}>
                                {lesson.type === 'quiz' ? 'Quiz' : formatLessonDuration(lesson.duration)}
                              </Text>
                            </View>
                          </View>
                        </View>
                        {(canOpenQuiz || canOpenQuizOrGoToPlayer) && (
                          <View style={styles.previewBadge}>
                            <Text style={styles.previewText}>Làm quiz</Text>
                          </View>
                        )}
                        {lesson.isPreview && !course.isEnrolled && (
                          <View style={styles.previewBadge}>
                            <Text style={styles.previewText}>Preview</Text>
                          </View>
                        )}
                      </LessonRowWrapper>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
        {curriculum.length === 0 && <Text style={styles.emptyText}>No lessons found.</Text>}
      </View>
    );
  };

  const renderReviews = () => (
    <View style={styles.tabContent}>
      <View style={styles.ratingSummary}>
         <Text style={styles.ratingBig}>{course.averageRating}</Text>
         <View style={styles.ratingStars}>
            {[1,2,3,4,5].map(i => (
              <Ionicons 
                key={i} 
                name="star" 
                size={24} 
                color={i <= Math.round(course.averageRating) ? COLORS.secondary : COLORS.gray200} 
              />
            ))}
         </View>
         <Text style={styles.totalReviews}>Based on {course.reviewCount || 0} reviews</Text>
         {myReview && (
           <Text style={[styles.totalReviews, { marginTop: SPACING[1] }]}>
             Bạn đã đánh giá: {myReview.rating}★
           </Text>
         )}
      </View>

      {canReview && (
        <View style={{ marginBottom: SPACING[6] }}>
          <Text style={[styles.sectionTitle, { marginBottom: SPACING[2] }]}>
            Đánh giá khóa học
          </Text>

          <View style={{ flexDirection: 'row', marginBottom: SPACING[3] }}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity
                key={star}
                onPress={() => {
                  setRating(star);
                  if (!editing && myReview) setEditing(true);
                }}
                style={{ marginRight: 4 }}
              >
                <Ionicons
                  name="star"
                  size={24}
                  color={star <= rating ? COLORS.secondary : COLORS.gray200}
                />
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ marginBottom: SPACING[3] }}>
            <Text style={{ ...TYPOGRAPHY.bodySmall, color: COLORS.textSecondary, marginBottom: SPACING[1] }}>
              {myReview ? 'Sửa đánh giá của bạn' : 'Viết đánh giá của bạn'}
            </Text>
            <TextInput
              style={{
                ...TYPOGRAPHY.bodySmall,
                color: COLORS.textSecondary,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 12,
                padding: SPACING[3],
                backgroundColor: COLORS.surface,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
              placeholder="Chạm để nhập nội dung đánh giá..."
              placeholderTextColor={COLORS.gray400}
              multiline
              value={comment}
              onChangeText={text => {
                setComment(text);
                if (!editing && myReview) setEditing(true);
              }}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            {myReview && (
              <TouchableOpacity
                onPress={handleDeleteReview}
                style={{ marginRight: SPACING[3] }}
              >
                <Text style={{ ...TYPOGRAPHY.bodySmall, color: COLORS.error }}>
                  Xóa đánh giá
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleSubmitReview}>
              <View
                style={{
                  backgroundColor: COLORS.primary,
                  paddingHorizontal: SPACING[4],
                  paddingVertical: SPACING[2],
                  borderRadius: 999,
                }}
              >
                <Text
                  style={{
                    ...TYPOGRAPHY.bodySmall,
                    color: COLORS.white,
                    fontWeight: '700',
                  }}
                >
                  {myReview ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {reviews.map((rev) => (
        <View key={rev._id} style={styles.reviewItem}>
          <View style={styles.reviewHeader}>
            <Image source={{ uri: rev.userId?.avatar || 'https://via.placeholder.com/40' }} style={styles.reviewAvatar} />
            <View>
              <Text style={styles.reviewUser}>{rev.userId?.fullName}</Text>
              <Text style={styles.reviewDate}>{rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recent'}</Text>
            </View>
          </View>
          <Text style={styles.reviewComment}>{rev.reviewText}</Text>
        </View>
      ))}
      {reviews.length === 0 && <Text style={styles.emptyText}>No reviews yet.</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Header */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: course.thumbnail || 'https://via.placeholder.com/500' }} style={styles.heroImage} />
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(11, 19, 43, 0.95)']}
            style={styles.heroOverlay}
          >
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <Ionicons name="chevron-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.heroContent}>
               <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{course.categoryId?.name}</Text>
               </View>
               <Text style={styles.title}>{course.title}</Text>
               <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                     <Ionicons name="star" size={16} color={COLORS.secondary} />
                     <Text style={styles.metaText}>{course.averageRating}</Text>
                  </View>
                  <View style={styles.metaItem}>
                     <Ionicons name="people" size={16} color={COLORS.white} />
                     <Text style={styles.metaText}>{course.enrollmentCount} Learners</Text>
                  </View>
                  <View style={styles.metaItem}>
                     <Ionicons name="time" size={16} color={COLORS.white} />
                     <Text style={styles.metaText}>
                        {formatTotalDuration(curriculum.reduce((acc, l) => acc + (l.duration || 0), 0))}
                     </Text>
                  </View>
               </View>
            </View>
          </LinearGradient>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {(['overview', 'curriculum', 'reviews'] as TabType[]).map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'curriculum' && renderCurriculum()}
        {activeTab === 'reviews' && renderReviews()}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.footer}>
         <View>
            <Text style={styles.footerPriceLabel}>Tổng giá</Text>
            <Text style={styles.footerPrice}>{price === 0 ? 'Miễn phí' : `${price.toLocaleString('vi-VN')} ₫`}</Text>
         </View>
         <TouchableOpacity
           style={styles.enrollBtn}
           onPress={handleEnrollPress}
           disabled={enrolling}
           activeOpacity={0.85}
           hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
         >
            <LinearGradient
              colors={[COLORS.secondary, COLORS.secondaryDark]}
              style={[styles.enrollGradient, { pointerEvents: 'none' }]}
            >
               {enrolling ? (
                 <ActivityIndicator size="small" color={COLORS.primaryDark} />
               ) : (
                 <Text style={[styles.enrollText, { pointerEvents: 'none' }]}>
                   {isEnrolled ? 'Tiếp tục học' : price === 0 ? 'Đăng ký miễn phí' : 'Mua khóa học'}
                 </Text>
               )}
            </LinearGradient>
         </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    height: 380,
    width: '100%',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: SPACING[6],
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 40 : 20,
  },
  heroContent: {
    marginBottom: SPACING[2],
  },
  categoryBadge: {
    backgroundColor: COLORS.secondary,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    borderRadius: 8,
    marginBottom: SPACING[3],
  },
  categoryText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.primaryDark,
    textTransform: 'uppercase',
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.white,
    fontWeight: '800',
    marginBottom: SPACING[4],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING[6],
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    marginLeft: 4,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING[6],
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  tab: {
    paddingVertical: SPACING[4],
    marginRight: SPACING[8],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.secondary,
  },
  tabText: {
    ...TYPOGRAPHY.label,
    color: COLORS.gray400,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  tabContent: {
    padding: SPACING[6],
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
    fontWeight: '800',
    marginBottom: SPACING[4],
  },
  description: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING[8],
  },
  instructorCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING[4],
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  instructorTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray400,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: SPACING[3],
  },
  instructorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  instructorText: {
    marginLeft: SPACING[4],
    flex: 1,
  },
  instructorName: {
    ...TYPOGRAPHY.label,
    color: COLORS.primary,
    fontWeight: '800',
  },
  instructorBio: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  curriculumHeader: {
    marginBottom: SPACING[6],
  },
  curriculumTitle: {
    ...TYPOGRAPHY.h5,
    color: COLORS.primary,
    fontWeight: '800',
    marginBottom: 4,
  },
  curriculumMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  sectionContainer: {
    marginBottom: SPACING[4],
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING[4],
    backgroundColor: COLORS.surface,
  },
  sectionHeaderActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accordionTitle: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginLeft: SPACING[2],
  },
  accordionTitleActive: {
    color: COLORS.secondaryDark,
  },
  sectionMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray400,
  },
  lessonsContainer: {
    backgroundColor: COLORS.surface,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING[4],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray50,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  lessonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lessonIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING[3],
  },
  lessonInfo: {
    flex: 1,
  },
  lessonName: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  lessonMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  lessonType: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gray400,
    letterSpacing: 0.5,
  },
  dot: {
    color: COLORS.gray300,
  },
  lessonDuration: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray400,
  },
  previewBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  previewText: {
    fontSize: 10,
    color: COLORS.secondaryDark,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  ratingSummary: {
    alignItems: 'center',
    marginBottom: SPACING[8],
  },
  ratingBig: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
    fontWeight: '900',
  },
  ratingStars: {
    flexDirection: 'row',
    marginVertical: SPACING[2],
  },
  totalReviews: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray400,
  },
  reviewItem: {
    marginBottom: SPACING[6],
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING[2],
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING[3],
  },
  reviewUser: {
    ...TYPOGRAPHY.label,
    color: COLORS.primary,
    fontWeight: '700',
  },
  reviewDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray400,
  },
  reviewComment: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  emptyText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.gray400,
    textAlign: 'center',
    marginTop: SPACING[4],
  },
  errorText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    padding: SPACING[6],
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING[6],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOW.md,
  },
  footerPriceLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  footerPrice: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
    fontWeight: '900',
  },
  enrollBtn: {
    flex: 1,
    marginLeft: SPACING[8],
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  enrollGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enrollText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },
});
