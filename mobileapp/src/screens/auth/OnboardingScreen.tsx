import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { Button } from '@/components/ui';
import { setAppReady } from '@/store/slices/authSlice';
import { ROUTES } from '@/constants/routes';
import type { AuthStackParamList } from '@/types/navigation.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const FALLBACK_WIDTH = 400;
const slideWidth = Dimensions.get('window').width || FALLBACK_WIDTH;

const SLIDES = [
  {
    id: '1',
    title: 'Học lập trình mọi lúc',
    subtitle: 'Khoá học từ cơ bản đến nâng cao, học mọi lúc mọi nơi trên điện thoại.',
  },
  {
    id: '2',
    title: 'Theo dõi tiến độ',
    subtitle: 'Lưu tiến độ học, làm bài tập và quiz ngay trên app.',
  },
  {
    id: '3',
    title: 'Chứng chỉ sau khoá học',
    subtitle: 'Hoàn thành khoá học và nhận chứng chỉ xác thực.',
  },
];

export const OnboardingScreen = () => {
  const [width, setWidth] = useState(slideWidth);
  const [index, setIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, typeof ROUTES.ONBOARDING>>();
  const dispatch = useDispatch();

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setWidth(w);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const w = width || FALLBACK_WIDTH;
    const i = Math.round(e.nativeEvent.contentOffset.x / w);
    setIndex(i);
  };

  const getItemLayout = (_: unknown, i: number) => ({
    length: width || FALLBACK_WIDTH,
    offset: (width || FALLBACK_WIDTH) * i,
    index: i,
  });

  const onSkip = () => {
    dispatch(setAppReady({ isFirstLaunch: false }));
    navigation.replace(ROUTES.LOGIN);
  };

  const onContinue = () => {
    if (index < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: index + 1, animated: true });
      setIndex(index + 1);
    }
  };

  const onGetStarted = () => {
    dispatch(setAppReady({ isFirstLaunch: false }));
    navigation.replace(ROUTES.REGISTER);
  };

  const renderItem = ({ item }: { item: (typeof SLIDES)[0] }) => (
    <View style={[styles.slide, { width: slideW }]}>
      <View style={styles.placeholder} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );

  const slideW = width || FALLBACK_WIDTH;

  return (
    <View style={styles.container} onLayout={onLayout}>
      <TouchableOpacity style={styles.skip} onPress={onSkip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={styles.skipText}>Bỏ qua</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={getItemLayout}
        extraData={slideW}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.footer}>
        {index === SLIDES.length - 1 ? (
          <Button title="Bắt đầu" onPress={onGetStarted} style={styles.btn} />
        ) : (
          <Button title="Tiếp tục" onPress={onContinue} variant="outline" style={styles.btn} />
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
  skip: {
    position: 'absolute',
    top: 56,
    right: SPACING[5],
    zIndex: 1,
  },
  skipText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
    fontWeight: '600',
  },
  slide: {
    flex: 1,
    paddingHorizontal: SPACING[6],
    paddingTop: 120,
    alignItems: 'center',
  },
  placeholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.primary + '20',
    marginBottom: SPACING[8],
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING[3],
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: SPACING[6],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gray300,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  footer: {
    paddingHorizontal: SPACING[5],
    paddingBottom: SPACING[8] + 24,
  },
  btn: {
    width: '100%',
  },
});
