import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  StyleProp,
  Animated,
  StyleSheet,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

const PRESS_SCALE = 0.98;
const PRESS_DURATION = 100;

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  onPressIn,
  onPressOut,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    if (!disabled && !loading) {
      Animated.timing(scaleAnim, { toValue: PRESS_SCALE, duration: PRESS_DURATION, useNativeDriver: true }).start();
    }
    onPressIn?.(e);
  };
  const handlePressOut = (e: any) => {
    Animated.timing(scaleAnim, { toValue: 1, duration: PRESS_DURATION, useNativeDriver: true }).start();
    onPressOut?.(e);
  };

  const getContainerStyle = (): ViewStyle => {
    let backgroundColor: string = COLORS.primary;
    let borderColor: string = 'transparent';
    let borderWidth = 0;

    switch (variant) {
      case 'secondary':
        backgroundColor = COLORS.secondary;
        break;
      case 'outline':
        backgroundColor = 'transparent';
        borderColor = COLORS.primary;
        borderWidth = 1;
        break;
      case 'ghost':
        backgroundColor = 'transparent';
        break;
    }

    if (disabled) {
      backgroundColor = variant === 'outline' || variant === 'ghost' ? 'transparent' : COLORS.gray300;
      borderColor = variant === 'outline' ? COLORS.gray300 : 'transparent';
    }

    let paddingVertical: number = SPACING[3];
    let paddingHorizontal: number = SPACING[4];

    switch (size) {
      case 'sm':
        paddingVertical = Number(SPACING[2]);
        paddingHorizontal = Number(SPACING[3]);
        break;
      case 'lg':
        paddingVertical = Number(SPACING[4]);
        paddingHorizontal = Number(SPACING[6]);
        break;
    }

    const containerStyle: ViewStyle = {
      backgroundColor,
      borderColor,
      borderWidth,
      paddingVertical,
      paddingHorizontal,
      borderRadius: BORDER_RADIUS.md,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      opacity: disabled || loading ? 0.7 : 1,
    };
    return containerStyle;
  };

  const getTextStyle = (): TextStyle => {
    let color = COLORS.white;

    if (variant === 'outline' || variant === 'ghost') {
      color = COLORS.primary;
    }

    if (disabled && (variant === 'outline' || variant === 'ghost')) {
      color = COLORS.gray400;
    }

    let typography = TYPOGRAPHY.button;
    if (size === 'sm') typography = { ...TYPOGRAPHY.button, fontSize: 14 } as any;
    if (size === 'lg') typography = { ...TYPOGRAPHY.button, fontSize: 18 } as any;

    return {
      ...typography,
      color,
      marginLeft: icon ? SPACING[2] : 0,
    };
  };

  return (
    <TouchableOpacity
      style={StyleSheet.flatten([style as any])}
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      {...props}
    >
      <Animated.View style={[getContainerStyle(), { transform: [{ scale: scaleAnim }] }]}>
        {loading ? (
          <ActivityIndicator color={variant === 'primary' || variant === 'secondary' ? COLORS.white : COLORS.primary} />
        ) : (
          <>
            {icon}
            <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          </>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default Button;
