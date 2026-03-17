import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ViewStyle,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOW } from '@/constants/theme';
import type { MyEnrollmentItem } from '@/types/api.types';

const DEFAULT_THUMB = 'https://placehold.co/160x100?text=Course';

interface EnrolledCourseCardProps {
  enrollment: MyEnrollmentItem;
  onPress: () => void;
  onContinuePress?: () => void;
  style?: ViewStyle;
}

export const EnrolledCourseCard: React.FC<EnrolledCourseCardProps> = ({
  enrollment,
  onPress,
  onContinuePress,
  style,
}) => {
  const course = enrollment.courseId;
  const title = typeof course === 'object' && course !== null ? (course as { title?: string }).title : 'Khóa học';
  const thumbnail =
    typeof course === 'object' && course !== null
      ? (course as { thumbnail?: string }).thumbnail
      : undefined;
  const progress = enrollment.progress ?? 0;
  const totalLessons = enrollment.totalLessons ?? 0;
  const completedLessons = enrollment.completedLessons ?? 0;
  const isCompleted = progress >= 100;

  return (
    <TouchableOpacity
      style={[styles.card, SHADOW.sm, style]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.thumbWrap}>
        <Image
          source={{ uri: thumbnail || DEFAULT_THUMB }}
          style={styles.thumb}
          resizeMode="cover"
        />
        <View style={styles.progressWrap}>
          <View style={[styles.progressBar, { width: `${Math.min(100, progress)}%` }]} />
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.meta}>
          {completedLessons}/{totalLessons} bài • {progress}%
        </Text>
        {onContinuePress && (
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={e => {
              e.stopPropagation();
              onContinuePress();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.continueBtnText}>
              {isCompleted ? 'Đã hoàn thành' : 'Tiếp tục học'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING[4],
  },
  thumbWrap: {
    width: '100%',
    height: 100,
    backgroundColor: COLORS.gray200,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  progressWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: COLORS.gray200,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  body: {
    padding: SPACING[4],
  },
  title: {
    ...TYPOGRAPHY.h5,
    color: COLORS.textPrimary,
    marginBottom: SPACING[1],
  },
  meta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING[3],
  },
  continueBtn: {
    alignSelf: 'flex-start',
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  continueBtnText: {
    ...TYPOGRAPHY.label,
    color: COLORS.textInverse,
    fontWeight: '600',
  },
});
