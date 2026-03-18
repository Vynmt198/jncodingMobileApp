import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
  Platform,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOW } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  secureTextEntry,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isMultiline = !!props.multiline;

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View pointerEvents="box-none" style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View
        collapsable={false}
        style={[
          styles.inputContainer,
          isMultiline && styles.inputContainerMultiline,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          style={[styles.input, isMultiline && styles.inputMultiline]}
          placeholderTextColor={COLORS.gray100}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          scrollEnabled={isMultiline}
          textAlignVertical={isMultiline ? 'top' : 'center'}
          {...props}
        />

        {secureTextEntry && (
          <TouchableOpacity onPress={togglePasswordVisibility} style={styles.rightIcon}>
            <Text style={{ color: COLORS.gray500, ...TYPOGRAPHY.caption }}>
              {isPasswordVisible ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        )}

        {!secureTextEntry && rightIcon && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING[4],
  },
  label: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    marginBottom: SPACING[2],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING[3],
    height: 48,
  },
  inputContainerMultiline: {
    alignItems: 'flex-start',
    height: 'auto',
    minHeight: 96,
    paddingVertical: SPACING[3],
  },
  inputFocused: {
    borderColor: COLORS.borderFocus,
    backgroundColor: COLORS.surfaceSecondary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  leftIcon: {
    marginRight: SPACING[2],
  },
  rightIcon: {
    marginLeft: SPACING[2],
  },
  input: {
    flex: 1,
    height: '100%',
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textPrimary,
    // @ts-ignore - Web outline removal
    outlineStyle: 'none' as any,
  },
  inputMultiline: {
    height: 'auto',
    paddingTop: Platform.OS === 'android' ? 0 : undefined,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    marginTop: SPACING[1],
  },
});

export default Input;
