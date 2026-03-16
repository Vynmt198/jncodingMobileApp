import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { Button } from '@/components/ui';
import { useGetQuizResultsQuery } from '@/store/api/quizzesApi';
import { useGetCourseLearningQuery } from '@/store/api/coursesApi';
import axiosInstance from '@/api/axiosInstance';
import { ROUTES } from '@/constants/routes';
import type { AppStackParamList } from '@/types/navigation.types';

type QuizResultRouteProp = RouteProp<AppStackParamList, typeof ROUTES.QUIZ_RESULT>;
type QuizResultNavProp = NativeStackNavigationProp<AppStackParamList, typeof ROUTES.QUIZ_RESULT>;

interface AttemptData {
  _id?: string;
  score?: number;
  isPassed?: boolean;
  answers?: (string | boolean | number)[];
  quizId?: {
    _id?: string;
    title?: string;
    questions?: Array<{
      questionText?: string;
      correctAnswer?: unknown;
      explanation?: string;
      options?: string[];
    }>;
  };
}

export const QuizResultScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<QuizResultNavProp>();
  const route = useRoute<QuizResultRouteProp>();
  const { attemptId, quizId, courseId } = route.params ?? { attemptId: '' };

  const { data: attemptData, isLoading, error } = useGetQuizResultsQuery(attemptId, {
    skip: !attemptId,
  });

  const { data: learningData } = useGetCourseLearningQuery(courseId ?? '', {
    skip: !courseId,
  });
  const completionPercentage = learningData?.completionPercentage ?? 0;
  const allCompleted = completionPercentage >= 100;

  const attempt = (attemptData as AttemptData) ?? null;
  const score = attempt?.score ?? 0;
  const isPassed = attempt?.isPassed ?? false;
  const questions = attempt?.quizId?.questions ?? [];
  const userAnswers = attempt?.answers ?? [];

  const handleRetry = () => {
    if (quizId) {
      navigation.replace(ROUTES.QUIZ_START, { quizId, courseId });
    } else {
      navigation.goBack();
    }
  };

  const handleBackToCourse = () => {
    if (courseId) {
      navigation.navigate(ROUTES.COURSE_DETAIL, { courseId });
    } else {
      navigation.getParent()?.goBack();
    }
  };

  const handleCompleteCourse = async () => {
    if (!courseId) {
      Alert.alert('Thông báo', 'Không tìm thấy khóa học để cấp chứng chỉ.');
      return;
    }

    try {
      await axiosInstance.post('/certificates/generate', { courseId });
      Alert.alert(
        'Chúc mừng!',
        'Bạn đã hoàn thành khóa học và (nếu đủ điều kiện) chứng chỉ đã được cấp. Vào Hồ sơ → Chứng chỉ của bạn để xem.',
        [
          {
            text: 'Xem khóa học',
            onPress: () => navigation.navigate(ROUTES.COURSE_DETAIL, { courseId }),
          },
        ]
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.data?.message ??
        'Không cấp được chứng chỉ. Vui lòng thử lại.';
      Alert.alert('Lỗi', msg);
    }
  };

  if (!attemptId) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Thiếu thông tin kết quả.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải kết quả...</Text>
      </View>
    );
  }

  if (error || !attempt) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>Không tải được kết quả.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING[4], paddingBottom: insets.bottom + SPACING[6] }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.scoreCard, isPassed ? styles.scoreCardPass : styles.scoreCardFail]}>
        <View style={styles.scoreIconWrap}>
          <Ionicons name={isPassed ? 'checkmark-circle' : 'close-circle'} size={64} color={isPassed ? COLORS.success : COLORS.error} />
        </View>
        <Text style={styles.scoreLabel}>{isPassed ? 'Chúc mừng! Bạn đã đạt.' : 'Chưa đạt'}</Text>
        <Text style={styles.scoreValue}>{Math.round(score)}%</Text>
      </View>

      {questions.length > 0 && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewTitle}>Xem lại đáp án</Text>
          {questions.map((q, i) => {
            const userAns = userAnswers[i];
            const correct = q.correctAnswer;
            const isCorrect = String(userAns ?? '').trim().toLowerCase() === String(correct ?? '').trim().toLowerCase();
            return (
              <View key={i} style={styles.reviewItem}>
                <View style={styles.reviewQuestionRow}>
                  <Ionicons
                    name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={isCorrect ? COLORS.success : COLORS.error}
                  />
                  <Text style={styles.reviewQuestionText}>{q.questionText}</Text>
                </View>
                <Text style={styles.reviewYourAnswer}>
                  Đáp án của bạn: <Text style={styles.reviewAnswerValue}>{String(userAns ?? '—')}</Text>
                </Text>
                <Text style={styles.reviewCorrectAnswer}>
                  Đáp án đúng: <Text style={styles.reviewAnswerValue}>{String(correct ?? '—')}</Text>
                </Text>
                {q.explanation ? (
                  <Text style={styles.reviewExplanation}>{q.explanation}</Text>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      {allCompleted && courseId && (
        <View style={styles.completeCourseWrap}>
          <Text style={styles.completeCourseLabel}>Bạn đã hoàn thành khóa học!</Text>
          <TouchableOpacity style={styles.completeCourseBtn} onPress={handleCompleteCourse} activeOpacity={0.8}>
            <Ionicons name="trophy" size={16} color={COLORS.white} />
            <Text style={styles.completeCourseBtnText}>Hoàn thành khóa học</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.actions}>
        {quizId ? (
          <Button title="Làm lại" onPress={handleRetry} style={StyleSheet.flatten([styles.btn, styles.btnSecondary])} />
        ) : null}
        <Button title={courseId ? 'Về khóa học' : 'Quay lại'} onPress={handleBackToCourse} style={StyleSheet.flatten([styles.btn, styles.btnPrimary])} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING[5] },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING[5] },
  loadingText: { marginTop: SPACING[3], ...TYPOGRAPHY.bodyMedium, color: COLORS.gray600 },
  errorText: { ...TYPOGRAPHY.bodyMedium, color: COLORS.gray700, marginBottom: SPACING[4], textAlign: 'center' },
  link: { ...TYPOGRAPHY.bodyMedium, color: COLORS.primary, fontWeight: '600' },
  scoreCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING[6],
    alignItems: 'center',
    marginBottom: SPACING[6],
    borderWidth: 1,
  },
  scoreCardPass: { backgroundColor: COLORS.success + '15', borderColor: COLORS.success + '50' },
  scoreCardFail: { backgroundColor: COLORS.error + '12', borderColor: COLORS.error + '40' },
  scoreIconWrap: { marginBottom: SPACING[3] },
  scoreLabel: { ...TYPOGRAPHY.h3, color: COLORS.gray800, marginBottom: SPACING[1] },
  scoreValue: { ...TYPOGRAPHY.h1, color: COLORS.gray900 } as any,
  reviewSection: { marginBottom: SPACING[6] },
  reviewTitle: { ...TYPOGRAPHY.h3, color: COLORS.gray800, marginBottom: SPACING[4] },
  reviewItem: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING[4],
    marginBottom: SPACING[3],
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewQuestionRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING[2] },
  reviewQuestionText: { ...TYPOGRAPHY.bodyMedium, color: COLORS.gray800, flex: 1, marginLeft: SPACING[2] },
  reviewYourAnswer: { ...TYPOGRAPHY.bodySmall, color: COLORS.gray600, marginTop: SPACING[2] },
  reviewCorrectAnswer: { ...TYPOGRAPHY.bodySmall, color: COLORS.gray600, marginTop: 2 },
  reviewAnswerValue: { fontWeight: '600', color: COLORS.gray800 },
  reviewExplanation: { ...TYPOGRAPHY.bodySmall, color: COLORS.gray700, marginTop: SPACING[2], fontStyle: 'italic' },
  actions: { gap: SPACING[3] },
  btn: {},
  btnPrimary: {},
  btnSecondary: { backgroundColor: COLORS.gray300 } as any,
  completeCourseWrap: { marginBottom: SPACING[5], alignItems: 'flex-start' },
  completeCourseLabel: { ...TYPOGRAPHY.bodyMedium, color: COLORS.gray700, marginBottom: SPACING[2] },
  completeCourseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[3],
    borderRadius: BORDER_RADIUS.md,
  },
  completeCourseBtnText: { ...TYPOGRAPHY.caption, color: COLORS.white, fontWeight: '600' },
});
