import React from 'react';
import { View, StyleSheet, ViewProps, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOW } from '@/constants/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: keyof typeof SPACING;
  shadowLevel?: keyof typeof SHADOW;
  onPress?: () => void;
  style?: ViewProps['style'];
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 4,
  shadowLevel = 'sm',
  onPress,
  style,
  ...props
}) => {
  const cardStyle = [
    styles.container,
    {
      padding: SPACING[padding],
    },
    SHADOW[shadowLevel],
    style,
  ];

  if (onPress) {
    const { onBlur, onFocus, ...restProps } = props as ViewProps & {
      onBlur?: unknown;
      onFocus?: unknown;
    };
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={cardStyle}
        onPress={onPress}
        {...(restProps as React.ComponentProps<typeof TouchableOpacity>)}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
});

export default Card;
