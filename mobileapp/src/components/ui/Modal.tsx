import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  ModalProps as RNModalProps,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOW } from '@/constants/theme';

export interface ModalProps extends RNModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Footer content (e.g. buttons). If not provided, no footer. */
  footer?: React.ReactNode;
  /** Size: 'sm' | 'md' | 'full'. Default 'md'. */
  size?: 'sm' | 'md' | 'full';
  /** If true, closing the overlay (backdrop) won't call onClose. */
  dismissOnOverlayPress?: boolean;
  contentStyle?: ViewStyle;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  dismissOnOverlayPress = true,
  contentStyle,
  ...modalProps
}) => {
  const getContentWidth = (): ViewStyle => {
    if (size === 'full') return { width: '100%', maxHeight: '90%' };
    if (size === 'sm') return { width: '85%', maxWidth: 320 };
    return { width: '90%', maxWidth: 400 };
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      {...modalProps}
    >
      <TouchableWithoutFeedback onPress={dismissOnOverlayPress ? onClose : undefined}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={[styles.contentWrapper, getContentWidth()]}
            >
              <View style={[styles.content, contentStyle]}>
                {title ? <Text style={styles.title}>{title}</Text> : null}
                <View style={styles.body}>{children}</View>
                {footer ? <View style={styles.footer}>{footer}</View> : null}
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING[4],
  },
  contentWrapper: {
    alignSelf: 'center',
  },
  content: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOW.lg,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING[5],
    paddingTop: SPACING[5],
    paddingBottom: SPACING[2],
  },
  body: {
    paddingHorizontal: SPACING[5],
    paddingVertical: SPACING[3],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING[3],
    paddingHorizontal: SPACING[5],
    paddingBottom: SPACING[5],
    paddingTop: SPACING[2],
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default Modal;
