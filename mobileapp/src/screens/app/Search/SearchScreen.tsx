import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  ScrollView,
  Keyboard
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, SHADOW } from '@/constants/theme';
import { ROUTES } from '@/constants/routes';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:3000/api';
const SEARCH_HISTORY_KEY = '@search_history';

export const SearchScreen = () => {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Tất cả');
  const [isFocused, setIsFocused] = useState(false);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const FILTERS = ['Tất cả', 'Cao cấp', 'Miễn phí', 'Cơ bản', 'Nâng cao'];

  // Reset state when screen is focused (navigation reset)
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Reset when leaving the screen
        setQuery('');
        setResults([]);
        setIsSearching(false);
        setLoading(false);
        setSelectedFilter('Tất cả');
        setShowHistoryDropdown(false);
      };
    }, [])
  );

  // Load all courses and history when entering
  useFocusEffect(
    useCallback(() => {
      setQuery('');
      setResults([]);
      setIsSearching(false);
      setLoading(false);
      setSelectedFilter('Tất cả');
      setShowHistoryDropdown(false);
      loadHistory();
      // Immediately load all courses
      fetchAllCourses();
    }, [])
  );

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveToHistory = async (term: string) => {
    if (!term.trim()) return;
    const newHistory = [term, ...history.filter(h => h !== term)].slice(0, 10);
    setHistory(newHistory);
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  };

  const clearHistory = async () => {
    setHistory([]);
    setShowHistoryDropdown(false);
    await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  const removeHistoryItem = async (item: string) => {
    const newHistory = history.filter(h => h !== item);
    setHistory(newHistory);
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    if (newHistory.length === 0) setShowHistoryDropdown(false);
  };

  const fetchAllCourses = async () => {
    setLoading(true);
    setIsSearching(true);
    try {
      const res = await fetch(`${API_URL}/courses/search?q=&level=&priceType=`);
      const data = await res.json();
      if (data.success) {
        setResults(data.data.courses);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (term: string, filterStr = selectedFilter, isLive = false) => {
    if (!isLive) {
      Keyboard.dismiss();
      if (term.trim()) saveToHistory(term);
    }
    setShowHistoryDropdown(false);
    setQuery(term);
    setIsSearching(true);
    setLoading(true);

    try {
      let level = '';
      let priceType = '';
      if (filterStr === 'Cơ bản') level = 'beginner';
      if (filterStr === 'Nâng cao') level = 'advanced';
      if (filterStr === 'Miễn phí') priceType = 'free';
      if (filterStr === 'Cao cấp') priceType = 'paid';

      const baseUrl = `${API_URL}/courses/search`;
      const queryParams = `q=${term}&level=${level}&priceType=${priceType}`;
      const res = await fetch(`${baseUrl}?${queryParams}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.data.courses);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderResultItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => navigation.navigate(ROUTES.COURSE_DETAIL as never, { id: item._id })}
    >
      <Image source={{ uri: item.thumbnail || 'https://placehold.co/100x100?text=Course' }} style={styles.resultImage} />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.resultInstructor}>{item.instructorId?.fullName}</Text>
        <View style={styles.resultMeta}>
          <Text style={styles.ratingText}>⭐ {item.averageRating}</Text>
          <Text style={styles.priceText}>{item.price === 0 ? 'Miễn phí' : `${item.price?.toLocaleString('vi-VN')} ₫`}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Luxury Search Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={[
            styles.inputWrapper,
            isFocused && styles.inputWrapperFocused
          ]}>
            <Ionicons
              name="search"
              size={18}
              color={isFocused ? COLORS.secondary : COLORS.gray400}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Tìm kiếm khóa học cao cấp..."
              placeholderTextColor={COLORS.textSecondary}
              value={query}
              onChangeText={(text) => {
                setQuery(text);

                // Live Search Logic (Debounced)
                if (searchTimeout.current) clearTimeout(searchTimeout.current);
                if (text.trim().length > 0) {
                  setShowHistoryDropdown(false);
                  searchTimeout.current = setTimeout(() => {
                    handleSearch(text, selectedFilter, true);
                  }, 500);
                } else {
                  // No query - reload all courses
                  searchTimeout.current = setTimeout(() => {
                    fetchAllCourses();
                  }, 300);
                }
              }}
              onFocus={() => {
                setIsFocused(true);
                if (history.length > 0) setShowHistoryDropdown(true);
              }}
              onBlur={() => {
                setIsFocused(false);
                setTimeout(() => setShowHistoryDropdown(false), 200);
              }}
              onSubmitEditing={() => handleSearch(query)}
              returnKeyType="search"
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => {
                setQuery('');
                setShowHistoryDropdown(history.length > 0);
                fetchAllCourses();
              }}>
                <Ionicons name="close-circle" size={18} color={COLORS.gray400} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* History Dropdown - overlays content below */}
        {showHistoryDropdown && history.length > 0 && (
          <View style={styles.historyDropdown}>
            <View style={styles.historyDropdownHeader}>
              <Text style={styles.historyDropdownTitle}>Lịch sử tìm kiếm</Text>
              <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.clearAllText}>Xóa tất cả</Text>
              </TouchableOpacity>
            </View>
            {history.map((item, idx) => (
              <View key={idx} style={styles.historyDropdownItem}>
                <TouchableOpacity
                  style={styles.historyItemLeft}
                  onPress={() => handleSearch(item)}
                >
                  <Ionicons name="time-outline" size={16} color={COLORS.gray400} />
                  <Text style={styles.historyItemText} numberOfLines={1}>{item}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => removeHistoryItem(item)}
                  style={styles.historyItemClose}
                >
                  <Ionicons name="close" size={16} color={COLORS.gray400} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Premium Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipContent}
        >
          {FILTERS.map(chip => (
            <TouchableOpacity
              key={chip}
              style={[
                styles.chip,
                selectedFilter === chip && styles.chipActive
              ]}
              onPress={() => {
                setSelectedFilter(chip);
                handleSearch(query, chip);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.chipText,
                selectedFilter === chip && styles.chipTextActive
              ]}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={results}
            renderItem={renderResultItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listPadding}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={80} color={COLORS.gray200} />
                <Text style={styles.emptyText}>
                  {query ? `Không tìm thấy kết quả cho "${query}"` : 'Không có khóa học nào'}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: SPACING[4],
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    zIndex: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[5],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING[3],
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 16,
    paddingHorizontal: SPACING[4],
    height: 52,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  inputWrapperFocused: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.primary,
    ...SHADOW.md,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
  },
  searchIcon: {
    marginRight: SPACING[3],
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
    fontWeight: '500',
    // @ts-ignore - Web outline removal
    outlineStyle: 'none' as any,
  },
  // History Dropdown
  historyDropdown: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    left: SPACING[5] + 40 + SPACING[3], // align with input
    right: SPACING[5],
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 999,
    ...SHADOW.md,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.15,
    maxHeight: 280,
    overflow: 'hidden',
  },
  historyDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  historyDropdownTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  clearAllText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.secondaryDark,
    fontWeight: '700',
  },
  historyDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  historyItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItemText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.gray600,
    marginLeft: SPACING[3],
    flex: 1,
    fontWeight: '500',
  },
  historyItemClose: {
    padding: 4,
    marginLeft: SPACING[2],
  },
  chipScroll: {
    marginTop: SPACING[5],
  },
  chipContent: {
    paddingHorizontal: SPACING[5],
    paddingRight: SPACING[10],
  },
  chip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING[5],
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: SPACING[3],
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray600,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chipTextActive: {
    color: COLORS.secondary,
  },
  content: {
    flex: 1,
  },
  listPadding: {
    padding: SPACING[5],
    paddingBottom: 40,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: SPACING[4],
    marginBottom: SPACING[5],
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.md,
  },
  resultImage: {
    width: 90,
    height: 90,
    borderRadius: 18,
  },
  resultInfo: {
    flex: 1,
    marginLeft: SPACING[4],
    justifyContent: 'space-between',
  },
  resultTitle: {
    ...TYPOGRAPHY.label,
    color: COLORS.primary,
    fontWeight: '800',
    lineHeight: 20,
  },
  resultInstructor: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  resultMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING[2],
  },
  ratingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.secondaryDark,
    fontWeight: '800',
  },
  priceText: {
    ...TYPOGRAPHY.label,
    color: COLORS.primary,
    fontWeight: '900',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 120,
    paddingHorizontal: SPACING[10],
  },
  emptyText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    marginTop: SPACING[5],
    textAlign: 'center',
    lineHeight: 22,
  },
});
