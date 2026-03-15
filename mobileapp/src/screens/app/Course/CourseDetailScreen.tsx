import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, SHADOW } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ROUTES } from '@/constants/routes';
import { useEnrollCourseMutation } from '@/store/api/enrollmentApi';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '@/types/navigation.types';

const { width } = Dimensions.get('window');
const API_URL = 'http://localhost:3000/api';

type TabType = 'overview' | 'curriculum' | 'reviews';

type Nav = NativeStackNavigationProp<AppStackParamList, typeof ROUTES.COURSE_DETAIL>;

export const CourseDetailScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const { id } = route.params;
  const [enrollCourse, { isLoading: isEnrolling }] = useEnrollCourseMutation();

  const [course, setCourse] = useState<any>(null);
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [expandedSections, setExpandedSections] = useState<number[]>([0]);

  const courseId = course?._id ?? id;

  const handleEnrollPress = async () => {
    if (!courseId || !course) return;
    if (course.isEnrolled) {
      navigation.navigate(ROUTES.COURSE_PLAYER as never, { courseId, lessonId: undefined } as never);
      return;
    }
    if (course.price === 0) {
      try {
        await enrollCourse(courseId).unwrap();
        Alert.alert('Thành công', 'Bạn đã đăng ký khóa học miễn phí.');
        navigation.navigate(ROUTES.COURSE_PLAYER as never, { courseId, lessonId: undefined } as never);
      } catch (err: any) {
        const msg = err?.data?.message ?? err?.message ?? 'Đăng ký thất bại.';
        if (err?.status === 400 && (msg.includes('Already enrolled') || msg.includes('đã đăng ký'))) {
          navigation.navigate(ROUTES.COURSE_PLAYER as never, { courseId, lessonId: undefined } as never);
          return;
        }
        if (err?.status === 401) {
          Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để đăng ký khóa học.');
          return;
        }
        Alert.alert('Lỗi', msg);
      }
      return;
    }
    navigation.navigate(ROUTES.PAYMENT as never, {
      courseId,
      courseTitle: course.title ?? '',
      price: Number(course.price) || 0,
    } as never);
  };

  const toggleSection = (index: number) => {
    setExpandedSections(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const [courseRes, curriculumRes, reviewsRes] = await Promise.all([
        fetch(`${API_URL}/courses/${id}`),
        fetch(`${API_URL}/courses/${id}/curriculum`),
        fetch(`${API_URL}/courses/${id}/reviews`)
      ]);

      const [courseData, curriculumData, reviewsData] = await Promise.all([
        courseRes.json(),
        curriculumRes.json(),
        reviewsRes.json()
      ]);

      if (courseData.success) setCourse(courseData.data);
      if (curriculumData.success) setCurriculum(curriculumData.data);
      if (reviewsData.success) setReviews(reviewsData.data);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
            {sections.length} sections • {curriculum.length} lectures • {Math.floor(curriculum.reduce((acc, l) => acc + (l.duration || 0), 0) / 60)}h {curriculum.reduce((acc, l) => acc + (l.duration || 0), 0) % 60}m total length
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
                  {section.lessons.map((lesson: any) => (
                    <TouchableOpacity 
                      key={lesson._id} 
                      style={styles.lessonItem}
                      disabled={!lesson.isPreview && !course.isEnrolled}
                    >
                      <View style={styles.lessonLeft}>
                        <View style={styles.lessonIconContainer}>
                          {lesson.isPreview ? (
                            <Ionicons name="play-circle" size={24} color={COLORS.secondary} />
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
                              {Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, '0')}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {lesson.isPreview && !course.isEnrolled && (
                        <View style={styles.previewBadge}>
                          <Text style={styles.previewText}>Preview</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
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
      </View>
      
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
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
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
                        {Math.floor(curriculum.reduce((acc, l) => acc + (l.duration || 0), 0) / 60)}h {curriculum.reduce((acc, l) => acc + (l.duration || 0), 0) % 60}m
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
            <Text style={styles.footerPriceLabel}>Total Price</Text>
            <Text style={styles.footerPrice}>{course.price === 0 ? 'Free' : `$${course.price}`}</Text>
         </View>
         <TouchableOpacity
            style={styles.enrollBtn}
            onPress={handleEnrollPress}
            disabled={isEnrolling}
          >
            <LinearGradient
              colors={[COLORS.secondary, COLORS.secondaryDark]}
              style={styles.enrollGradient}
            >
              {isEnrolling ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.enrollText}>
                  {course.isEnrolled ? 'Vào học' : 'Enroll Now'}
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
    borderBottomColor: COLORS.border,
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
