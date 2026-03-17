import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, SHADOW } from '@/constants/theme';
import { ROUTES } from '@/constants/routes';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import axiosInstance from '@/api/axiosInstance';
import { API_ENDPOINTS } from '@/api/endpoints';

const { width } = Dimensions.get('window');

const LEVELS = [
  { label: 'All', value: '' },
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

export const CourseListingScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialCategoryId = route.params?.categoryId || '';
  const initialCategoryName = route.params?.categoryName || 'All Courses';
  const initialLevel = route.params?.level || '';

  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isGridView, setIsGridView] = useState(false);

  // Filter states
  const [sortBy, setSortBy] = useState('newest');
  const [selectedLevel, setSelectedLevel] = useState(initialLevel);
  const [categoryId, setCategoryId] = useState(initialCategoryId);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['40%'], []);

  useEffect(() => {
    fetchCourses(1, true);
  }, [sortBy, selectedLevel, categoryId]);

  const fetchCourses = async (pageNum: number, shouldReset = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await axiosInstance.get(API_ENDPOINTS.COURSES.SEARCH, {
        params: {
          page: pageNum,
          limit: 10,
          sortBy,
          level: selectedLevel,
          category: categoryId,
        },
      });
      const result = res.data as {
        success?: boolean;
        data?: { courses?: any[]; pagination?: { totalPages?: number } };
      };

      if (result.success) {
        setCourses(prev => shouldReset ? result.data.courses : [...prev, ...result.data.courses]);
        setTotalPages(result.data.pagination.totalPages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses(1, true);
  };

  const loadMore = () => {
    if (page < totalPages && !loadingMore) {
      fetchCourses(page + 1);
    }
  };

  const toggleView = () => setIsGridView(!isGridView);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsAtIndex={-1}
        appearsAtIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const renderItem = ({ item }: { item: any }) => {
    if (isGridView) {
      return (
        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => navigation.navigate(ROUTES.COURSE_DETAIL as never, { id: item._id })}
        >
          <Image source={{ uri: item.thumbnail || 'https://via.placeholder.com/150' }} style={styles.gridImage} />
          <View style={styles.gridInfo}>
            <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.gridPrice}>{item.price === 0 ? 'Free' : `$${item.price}`}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={COLORS.primary} />
              <Text style={styles.ratingText}>{item.averageRating}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.listCard}
        onPress={() => navigation.navigate(ROUTES.COURSE_DETAIL as never, { id: item._id })}
      >
        <Image source={{ uri: item.thumbnail || 'https://via.placeholder.com/100' }} style={styles.listImage} />
        <View style={styles.listInfo}>
          <Text style={styles.listTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.listInstructor}>{item.instructorId?.fullName}</Text>
          <View style={styles.listBottom}>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={COLORS.primary} />
              <Text style={styles.ratingText}>{item.averageRating}</Text>
            </View>
            <Text style={styles.listPrice}>{item.price === 0 ? 'Free' : `$${item.price}`}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search/Tool Bar Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{route.params?.categoryName || 'All Courses'}</Text>
          <TouchableOpacity onPress={toggleView} style={styles.viewToggle}>
            <Ionicons name={isGridView ? "list-outline" : "grid-outline"} size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Level Filter Bar */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.levelFilterBar}
          contentContainerStyle={styles.levelFilterContent}
        >
          {LEVELS.map((lvl) => (
            <TouchableOpacity
              key={lvl.value}
              style={[
                styles.levelChip,
                selectedLevel === lvl.value && styles.levelChipActive
              ]}
              onPress={() => setSelectedLevel(lvl.value)}
            >
              <Text style={[
                styles.levelChipText,
                selectedLevel === lvl.value && styles.levelChipTextActive
              ]}>
                {lvl.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.filterBar}>
          <TouchableOpacity style={styles.filterBtn} onPress={() => bottomSheetRef.current?.expand()}>
            <Ionicons name="options-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.filterText}>Sort & Filter</Text>
          </TouchableOpacity>
          <Text style={styles.resultCount}>{courses.length} Results</Text>
        </View>
      </View>

      {loading && page === 1 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          key={isGridView ? 'G' : 'L'}
          data={courses}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          numColumns={isGridView ? 2 : 1}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListFooterComponent={() => (
            loadingMore ? <ActivityIndicator style={{ margin: SPACING[4] }} color={COLORS.primary} /> : null
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color={COLORS.gray200} />
              <Text style={styles.emptyText}>No courses found.</Text>
            </View>
          )}
        />
      )}

      {/* Sort & Filter Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Sort Courses By</Text>
          <View style={styles.sortOptions}>
            {[
              { label: 'Newest First', value: 'newest' },
              { label: 'Most Popular', value: 'popular' },
              { label: 'Price: Low to High', value: 'price' }
            ].map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.sortBtn, sortBy === opt.value && styles.sortBtnActive]}
                onPress={() => {
                  setSortBy(opt.value);
                  bottomSheetRef.current?.close();
                }}
              >
                <Text style={[styles.sortBtnText, sortBy === opt.value && styles.sortBtnTextActive]}>{opt.label}</Text>
                {sortBy === opt.value && <Ionicons name="checkmark" size={20} color={COLORS.textInverse} />}
              </TouchableOpacity>
            ))}
          </View>
        </BottomSheetView>
      </BottomSheet>
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
  header: {
    backgroundColor: COLORS.surface,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: SPACING[4],
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[4],
    marginBottom: SPACING[4],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
    fontWeight: '700',
  },
  viewToggle: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterText: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    marginLeft: 6,
    fontWeight: '600',
  },
  resultCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  listContent: {
    padding: SPACING[4],
  },
  listCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING[3],
    marginBottom: SPACING[4],
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceSecondary,
  },
  levelFilterBar: {
    paddingVertical: SPACING[2],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  levelFilterContent: {
    paddingHorizontal: SPACING[4],
    gap: SPACING[2],
  },
  levelChip: {
    paddingHorizontal: SPACING[3],
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  levelChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  levelChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  levelChipTextActive: {
    color: COLORS.textInverse,
    fontWeight: '700',
  },
  listInfo: {
    flex: 1,
    marginLeft: SPACING[4],
    justifyContent: 'space-between',
  },
  listTitle: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  listInstructor: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  listBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listPrice: {
    ...TYPOGRAPHY.label,
    color: COLORS.primary,
    fontWeight: '800',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginLeft: 4,
  },
  gridCard: {
    flex: 0.5,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING[3],
    margin: SPACING[2],
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gridImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: SPACING[2],
  },
  gridInfo: {
    justifyContent: 'space-between',
  },
  gridTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textPrimary,
    fontWeight: '700',
    height: 40,
  },
  gridPrice: {
    ...TYPOGRAPHY.label,
    color: COLORS.primary,
    fontWeight: '800',
    marginTop: 4,
  },
  emptyContainer: {
    paddingVertical: 100,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.gray400,
    marginTop: SPACING[4],
  },
  sheetContent: {
    flex: 1,
    padding: SPACING[6],
  },
  sheetTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
    marginBottom: SPACING[6],
    textAlign: 'center',
  },
  sortOptions: {
    gap: SPACING[4],
  },
  sortBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING[4],
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortBtnText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  sortBtnTextActive: {
    color: COLORS.textInverse,
  },
});
