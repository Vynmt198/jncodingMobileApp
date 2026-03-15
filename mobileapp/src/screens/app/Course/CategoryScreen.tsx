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
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, SHADOW } from '@/constants/theme';
import { ROUTES } from '@/constants/routes';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const API_URL = 'http://localhost:3000/api';

// Luxury Banner Images (Unsplash)
const BANNER_IMAGE = 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1200&auto=format&fit=crop';

export const CategoryScreen = () => {
  const navigation = useNavigation<any>();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        <ActivityIndicator size="large" color={COLORS.secondary} />
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
          colors={['transparent', 'rgba(10, 25, 41, 0.95)']}
          style={styles.bannerOverlay}
        />
        <View style={styles.bannerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.bannerTitle}>Explore Categories</Text>
          <Text style={styles.bannerSubtitle}>Find the perfect elite course for your journey</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {categories.map((cat) => (
            <TouchableOpacity 
              key={cat._id} 
              style={styles.card}
              onPress={() => handleCategoryPress(cat)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.white, '#F8FAFC']}
                style={styles.cardGradient}
              >
                <View style={styles.iconContainer}>
                  <Text style={styles.iconText}>{cat.name.charAt(0)}</Text>
                </View>
                <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{cat.courseCount || 0} Courses</Text>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={16} 
                  color={COLORS.secondary} 
                  style={styles.chevron} 
                />
              </LinearGradient>
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
    position: 'relative',
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
  },
  scrollContent: {
    padding: SPACING[5],
    paddingTop: SPACING[6],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING[4],
  },
  card: {
    width: (width - SPACING[5] * 2 - SPACING[4]) / 2,
    height: 160,
    borderRadius: 20,
    ...SHADOW.sm,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 20,
    padding: SPACING[4],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[3],
    ...SHADOW.md,
  },
  iconText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.secondary,
  },
  categoryName: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING[1],
  },
  countBadge: {
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  countText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  chevron: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  }
});
