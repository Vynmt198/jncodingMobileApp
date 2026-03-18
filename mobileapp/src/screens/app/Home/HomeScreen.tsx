import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppSelector } from '@/store/hooks';
import { COLORS, TYPOGRAPHY, SPACING, SHADOW } from '@/constants/theme';
import { ROUTES } from '@/constants/routes';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useGetProfileQuery } from '@/store/api/authApi';
import { useGetMyEnrollmentsQuery } from '@/store/api/enrollmentsApi';
import axiosInstance from '@/api/axiosInstance';
import { API_ENDPOINTS } from '@/api/endpoints';

export const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const token = useAppSelector(s => s.auth.token);
  const { data: user } = useGetProfileQuery(undefined, { skip: !token });
  const { data: enrollmentsData } = useGetMyEnrollmentsQuery(undefined, { skip: !token });
  const enrollments = enrollmentsData?.enrollments ?? [];
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<any[]>([]);
  const [trendingCourses, setTrendingCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  // Khi quay lại từ màn khác (vd CourseDetail sau khi đánh giá), refetch để cập nhật averageRating.
  useFocusEffect(
    useCallback(() => {
      fetchHomeData();
    }, [])
  );

  const fetchHomeData = async () => {
    try {
      setLoading(true);

      // Fetch Categories
      const categoriesRes = await axiosInstance.get(API_ENDPOINTS.CATEGORIES.LIST);
      const categoriesData = categoriesRes.data as { success?: boolean; data?: unknown };
      if (categoriesData?.success) setCategories((categoriesData as any).data ?? []);

      // Fetch Featured Courses (Carousel)
      const featuredRes = await axiosInstance.get(API_ENDPOINTS.COURSES.LIST, {
        params: { sortBy: 'popular', limit: 5 },
      });
      const featuredData = featuredRes.data as { success?: boolean; data?: { courses?: unknown[] } };
      if (featuredData?.success) setFeaturedCourses(featuredData?.data?.courses ?? []);

      // Fetch Trending Courses
      const trendingRes = await axiosInstance.get(API_ENDPOINTS.COURSES.LIST, {
        params: { sortBy: 'newest', limit: 4 },
      });
      const trendingData = trendingRes.data as { success?: boolean; data?: { courses?: unknown[] } };
      if (trendingData?.success) setTrendingCourses(trendingData?.data?.courses ?? []);
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />

      {/* Premium Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.userInfo}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{user?.fullName?.charAt(0) || 'U'}</Text>
            </View>
            <View style={styles.userTextContainer}>
              <View style={styles.nameRow}>
                <Text style={styles.greetingText}>Chào, {user?.fullName || 'Học viên'}</Text>
              </View>
              <Text style={styles.sloganText}>Khám phá khóa học cao cấp tiếp theo của bạn</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate(ROUTES.SEARCH as any)}
        >
          <Ionicons name="search-outline" size={20} color={COLORS.gray400} style={{ marginRight: SPACING[2] }} />
          <Text style={styles.searchPlaceholder}>Tìm kiếm khóa học cao cấp...</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Categories Horizontal Scroll */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Danh mục</Text>
          <TouchableOpacity onPress={() => navigation.navigate(ROUTES.CATEGORY)}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((cat: any) => (
            <TouchableOpacity
              key={cat._id}
              style={styles.categoryCard}
              onPress={() => navigation.navigate(ROUTES.COURSE_LISTING, { categoryId: cat._id, categoryName: cat.name })}
            >
              <View style={styles.categoryIconContainer}>
                <Text style={styles.categoryIconText}>{cat.name.charAt(0)}</Text>
              </View>
              <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Featured Courses Carousel */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trải nghiệm nổi bật</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carouselScroll} pagingEnabled>
          {featuredCourses.map((course: any) => (
            <TouchableOpacity
              key={course._id}
              style={styles.featuredCard}
              onPress={() => navigation.navigate(ROUTES.COURSE_DETAIL as never, { id: course._id })}
            >
              <Image
                source={{ uri: course.thumbnail || 'https://placehold.co/300x200?text=Course' }}
                style={styles.featuredImage}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.featuredOverlay}
              >
                <Text style={styles.featuredCategory}>{course.categoryId?.name}</Text>
                <Text style={styles.featuredTitle} numberOfLines={2}>{course.title}</Text>
                <View style={styles.featuredRow}>
                  <Text style={styles.featuredInstructor}>{course.instructorId?.fullName}</Text>
                  <Text style={[styles.featuredPrice, { color: COLORS.primaryLight }]}>
                    {course.price === 0 ? 'Miễn phí' : `${course.price?.toLocaleString('vi-VN')} ₫`}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tiếp tục học — từ Khoá học của tôi (My Courses) */}
      {enrollments.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tiếp tục học</Text>
            <TouchableOpacity onPress={() => navigation.navigate(ROUTES.MY_COURSES as never)}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
            <TouchableOpacity
            onPress={() => {
              const first = enrollments[0];
              const courseId = typeof first.courseId === 'object' && first.courseId != null ? (first.courseId as { _id: string })._id : String(first.courseId);
              navigation.navigate(ROUTES.COURSE_DETAIL as never, { courseId });
            }}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[COLORS.primaryDark, COLORS.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.continueCard}
            >
              <View style={styles.continueHeader}>
                <Text style={styles.continueTitle}>Từ khoá học của tôi</Text>
                <Ionicons name="chevron-forward-circle" size={24} color={COLORS.secondary} />
              </View>
              <Text style={styles.continueCourse} numberOfLines={1}>
                {(typeof enrollments[0].courseId === 'object' && enrollments[0].courseId != null ? (enrollments[0].courseId as { title?: string }).title : 'Khóa học') ?? 'Khóa học'}
              </Text>
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { backgroundColor: COLORS.secondary, width: `${enrollments[0].progress ?? 0}%` },
                  ]}
                />
              </View>
              <View style={styles.progressRow}>
                <Text style={styles.progressText}>{enrollments[0].progress ?? 0}% hoàn thành</Text>
                <Text style={styles.progressText}>{enrollments[0].completedLessons ?? 0} / {enrollments[0].totalLessons ?? 0} bài</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Trending Courses - Editorial List */}
      <View style={[styles.section, { marginBottom: SPACING[10] * 2 }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Xu hướng hiện nay</Text>
          <TouchableOpacity onPress={() => navigation.navigate(ROUTES.COURSE_LISTING as any)}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        {trendingCourses.map((course: any) => (
          <TouchableOpacity
            key={course._id}
            style={styles.trendingCard}
            onPress={() => navigation.navigate(ROUTES.COURSE_DETAIL as never, { id: course._id })}
          >
            <Image
              source={{ uri: course.thumbnail || 'https://placehold.co/100x100?text=Course' }}
              style={styles.trendingImage}
            />
            <View style={styles.trendingInfo}>
              <View>
                <Text style={styles.trendingTitle} numberOfLines={2}>{course.title}</Text>
                <Text style={styles.trendingInstructor}>{course.instructorId?.fullName}</Text>
              </View>
              <View style={styles.courseMeta}>
                <View style={styles.ratingContainer}>
                  {(() => {
                    const rating = Number(course.averageRating) || 0;
                    const filled = Math.max(0, Math.min(5, Math.floor(rating)));
                    return [1, 2, 3, 4, 5].map(i => (
                    <Ionicons
                      key={i}
                      name={i <= filled ? 'star' : 'star-outline'}
                      size={12}
                      color={i <= filled ? COLORS.primary : COLORS.gray600}
                    />
                    ));
                  })()}
                  <Text style={styles.ratingText}>{(Number(course.averageRating) || 0).toFixed(1)}</Text>
                </View>
                <Text style={styles.priceText} numberOfLines={1} ellipsizeMode="tail">
                  {course.price === 0 ? 'Miễn phí' : `${course.price?.toLocaleString('vi-VN')} ₫`}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
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
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING[6],
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[6],
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarInitial: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textInverse,
    fontWeight: '800',
  },
  userTextContainer: {
    marginLeft: SPACING[3],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.white,
    fontWeight: '800',
  },
  sloganText: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)',
    paddingHorizontal: SPACING[4],
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  searchPlaceholder: {
    ...TYPOGRAPHY.bodySmall,
    color: 'rgba(255,255,255,0.6)',
  },
  section: {
    marginTop: SPACING[8],
    paddingHorizontal: SPACING[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[6],
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  seeAllText: {
    ...TYPOGRAPHY.label,
    color: COLORS.primary,
    fontWeight: '600',
  },
  categoryScroll: {
    marginHorizontal: -SPACING[6],
    paddingHorizontal: SPACING[6],
  },
  categoryCard: {
    alignItems: 'center',
    marginRight: SPACING[6],
    width: 85,
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[1],
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryIconText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
  },
  categoryName: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  carouselScroll: {
    marginHorizontal: -SPACING[6],
  },
  featuredCard: {
    width: 320,
    height: 200,
    marginLeft: SPACING[6],
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING[6],
    justifyContent: 'flex-end',
  },
  featuredCategory: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryLight,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  featuredTitle: {
    ...TYPOGRAPHY.h5,
    color: COLORS.textInverse,
    marginBottom: 4,
    fontWeight: '700',
  },
  featuredRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredInstructor: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.8)',
  },
  featuredPrice: {
    ...TYPOGRAPHY.label,
    fontWeight: '700',
  },
  continueCard: {
    padding: SPACING[8],
    borderRadius: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  continueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[1],
  },
  continueTitle: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  continueCourse: {
    ...TYPOGRAPHY.h4,
    color: COLORS.white,
    marginBottom: SPACING[6],
  },
  progressContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    marginBottom: SPACING[1],
  },
  progressBar: {
    width: '45%',
    height: '100%',
    borderRadius: 4,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  trendingCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING[4],
    marginBottom: SPACING[6],
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  trendingImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  trendingInfo: {
    flex: 1,
    marginLeft: SPACING[4],
    justifyContent: 'space-between',
  },
  trendingTitle: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  trendingInstructor: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginLeft: 4,
  },
  priceText: {
    ...TYPOGRAPHY.label,
    color: COLORS.primary,
    fontWeight: '800',
    maxWidth: 110,
    textAlign: 'right',
  },
});
