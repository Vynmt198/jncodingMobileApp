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
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [isFocused, setIsFocused] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Reset state when screen is focused (navigation reset)
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Optional: Reset when leaving the screen
        setQuery('');
        setResults([]);
        setSuggestions([]);
        setIsSearching(false);
        setLoading(false);
        setSelectedFilter('All');
      };
    }, [])
  );

  // Reset state when focusing the screen (entering)
  useFocusEffect(
    useCallback(() => {
      setQuery('');
      setResults([]);
      setSuggestions([]);
      setIsSearching(false);
      setLoading(false);
      setSelectedFilter('All');
    }, [])
  );

  const FILTERS = ['All', 'Premium', 'Free', 'Beginner', 'Advanced'];

  useEffect(() => {
    loadHistory();
  }, []);

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
    await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  const fetchSuggestions = async (text: string) => {
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/courses/autocomplete?q=${text}`);
      const data = await res.json();
      if (data.success) {
        setSuggestions(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async (term: string, filterStr = selectedFilter, isLive = false) => {
    if (!term.trim() && filterStr === 'All') return;
    if (!isLive) {
      Keyboard.dismiss();
      if (term.trim()) saveToHistory(term);
    }
    setQuery(term);
    setIsSearching(true);
    setLoading(true);
    setSuggestions([]);

    try {
      let level = '';
      let priceType = '';
      if (filterStr === 'Beginner') level = 'beginner';
      if (filterStr === 'Advanced') level = 'advanced';
      if (filterStr === 'Free') priceType = 'free';
      if (filterStr === 'Premium') priceType = 'paid';

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
      <Image source={{ uri: item.thumbnail || 'https://via.placeholder.com/100' }} style={styles.resultImage} />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.resultInstructor}>{item.instructorId?.fullName}</Text>
        <View style={styles.resultMeta}>
          <Text style={styles.ratingText}>⭐ {item.averageRating}</Text>
          <Text style={styles.priceText}>{item.price === 0 ? 'Free' : `$${item.price}`}</Text>
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
              placeholder="Search premium courses..."
              placeholderTextColor={COLORS.textSecondary}
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                fetchSuggestions(text);
                
                // Live Search Logic (Debounced)
                if (searchTimeout.current) clearTimeout(searchTimeout.current);
                if (text.trim().length > 0) {
                  searchTimeout.current = setTimeout(() => {
                    handleSearch(text, selectedFilter, true);
                  }, 500);
                } else {
                  setIsSearching(false);
                  setResults([]);
                }
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onSubmitEditing={() => handleSearch(query)}
              returnKeyType="search"
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); setSuggestions([]); setIsSearching(false); }}>
                <Ionicons name="close-circle" size={18} color={COLORS.gray400} />
              </TouchableOpacity>
            )}
          </View>
        </View>

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
        ) : isSearching ? (
          <FlatList
            data={results}
            renderItem={renderResultItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listPadding}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={80} color={COLORS.gray200} />
                <Text style={styles.emptyText}>No results found for "{query}"</Text>
              </View>
            )}
          />
        ) : suggestions.length > 0 ? (
          <View style={styles.suggestions}>
            {suggestions.map((item, idx) => (
              <TouchableOpacity key={idx} style={styles.suggestionItem} onPress={() => handleSearch(item.title)}>
                <Ionicons name="search-outline" size={16} color={COLORS.gray400} />
                <Text style={styles.suggestionText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.historyContainer}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.historyList}>
              {history.map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.historyItem} onPress={() => handleSearch(item)}>
                  <Ionicons name="time-outline" size={16} color={COLORS.gray400} />
                  <Text style={styles.historyText}>{item}</Text>
                </TouchableOpacity>
              ))}
              {history.length === 0 && (
                <Text style={styles.noHistory}>Your recent searches will appear here.</Text>
              )}
            </View>
          </View>
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
  suggestions: {
    padding: SPACING[5],
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING[5],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
    marginLeft: SPACING[4],
    fontWeight: '500',
  },
  historyContainer: {
    padding: SPACING[6],
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[6],
  },
  historyTitle: {
    ...TYPOGRAPHY.label,
    color: COLORS.primary,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  clearText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.secondaryDark,
    fontWeight: '800',
  },
  historyList: {
    gap: SPACING[5],
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING[1],
  },
  historyText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.gray600,
    marginLeft: SPACING[4],
    fontWeight: '500',
  },
  noHistory: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.gray400,
    textAlign: 'center',
    marginTop: 60,
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
