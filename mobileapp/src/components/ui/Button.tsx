import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  ...props
}) => {
  const getContainerStyle = (): ViewStyle => {
    let backgroundColor = COLORS.primary;
    let borderColor = 'transparent';
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
      style={[getContainerStyle(), style]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'secondary' ? COLORS.white : COLORS.primary} />
      ) : (
        <>
          {icon}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
