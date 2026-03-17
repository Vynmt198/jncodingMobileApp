import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, SHADOW } from '@/constants/theme';
import { ROUTES } from '@/constants/routes';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://localhost:3000/api';

const H_PADDING = SPACING[5] * 2;
const CARD_GAP = SPACING[4];

// Luxury Banner Images (Unsplash)
const BANNER_IMAGE = 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1200&auto=format&fit=crop';

export const CategoryScreen = () => {
  const navigation = useNavigation<any>();
  const { width: screenWidth } = useWindowDimensions();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const cardWidth = Math.floor((screenWidth - H_PADDING - CARD_GAP) / 2);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/categories`);
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (category: any) => {
    navigation.navigate(ROUTES.COURSE_LISTING, {
      categoryId: category._id,
      categoryName: category.name,
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header Banner */}
      <View style={styles.bannerContainer}>
        <Image source={{ uri: BANNER_IMAGE }} style={styles.bannerImage} />
        <LinearGradient
          colors={['transparent', COLORS.background]}
          style={styles.bannerOverlay}
        />
        <View style={styles.bannerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.bannerTitle}>Khám phá danh mục</Text>
          <Text style={styles.bannerSubtitle}>Tìm kiếm khóa học hoàn hảo cho hành trình của bạn</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { width: screenWidth }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {categories.map((cat) => (
            <TouchableOpacity 
              key={cat._id} 
              style={[styles.card, { width: cardWidth }]}
              onPress={() => handleCategoryPress(cat)}
              activeOpacity={0.8}
            >
              <View style={styles.cardGradient}>
                <View style={styles.iconContainer}>
                  <Text style={styles.iconText}>{cat.name.charAt(0)}</Text>
                </View>
                <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{cat.courseCount || 0} Khóa học</Text>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={16} 
                  color={COLORS.textSecondary} 
                  style={styles.chevron} 
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  bannerContainer: {
    height: 280,
    width: '100%',
    maxWidth: '100%',
    position: 'relative',
    alignSelf: 'stretch',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerContent: {
    position: 'absolute',
    bottom: SPACING[6],
    left: SPACING[5],
    right: SPACING[5],
  },
  backButton: {
    position: 'absolute',
    top: -160,
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.white,
    marginBottom: SPACING[1],
  },
  bannerSubtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: COLORS.background,
    alignSelf: 'stretch',
  },
  scrollContent: {
    paddingHorizontal: SPACING[5],
    paddingTop: SPACING[6],
    paddingBottom: SPACING[8],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: CARD_GAP,
    width: '100%',
  },
  card: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    borderRadius: 12,
    padding: SPACING[3],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 0,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  iconText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textInverse,
  },
  categoryName: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING[1],
    width: '100%',
    maxWidth: '100%',
  },
  countBadge: {
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  countText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
  chevron: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  }
});
