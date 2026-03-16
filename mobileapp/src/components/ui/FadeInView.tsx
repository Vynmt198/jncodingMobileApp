import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, Platform } from 'react-native';

/** Trên web useNativeDriver: true có thể khiến animation không chạy → nội dung mãi opacity 0 (màn trắng). */
const useNativeDriver = Platform.OS !== 'web';

interface FadeInViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  duration?: number;
  /** Nếu true, thêm hiệu ứng trượt nhẹ từ dưới lên */
  slide?: boolean;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  style,
  delay = 0,
  duration = 400,
  slide = false,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(slide ? 12 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver,
      }),
      slide
        ? Animated.timing(translateY, {
            toValue: 0,
            duration,
            delay,
            useNativeDriver,
          })
        : Animated.timing(translateY, {
            toValue: 0,
            duration: 0,
            useNativeDriver,
          }),
    ]).start();
  }, [opacity, translateY, duration, delay, slide]);

  return (
    <Animated.View pointerEvents="box-none" style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};

export default FadeInView;
