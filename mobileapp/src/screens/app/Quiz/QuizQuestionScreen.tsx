import React, { useState, useEffect, useRef } from 'react';
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
import { useGetQuizQuery, useSubmitAttemptMutation } from '@/store/api/quizzesApi';
import { ROUTES } from '@/constants/routes';
import type { AppStackParamList } from '@/types/navigation.types';
import type { QuizQuestion } from '@/types/api.types';

type QuizQuestionRouteProp = RouteProp<AppStackParamList, typeof ROUTES.QUIZ_QUESTION>;
type QuizQuestionNavProp = NativeStackNavigationProp<AppStackParamList, typeof ROUTES.QUIZ_QUESTION>;

export const QuizQuestionScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<QuizQuestionNavProp>();
  const route = useRoute<QuizQuestionRouteProp>();
  const { quizId, courseId, lessonId } = route.params ?? { quizId: '' };

  const { data: quiz, isLoading, error } = useGetQuizQuery(quizId, { skip: !quizId });
  const [submitAttempt, { isLoading: submitting }] = useSubmitAttemptMutation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | boolean | number | null)[]>([]);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (quiz?.questions?.length) {
      setAnswers(Array(quiz.questions.length).fill(null));
    }
  }, [quiz?.questions?.length]);

  const handleSubmit = async () => {
    if (!quiz || !quizId) return;
    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const answersPayload = answers.map(a => (a === null ? '' : a)) as unknown[];
    try {
      const result = await submitAttempt({
        quizId,
        body: { answers: answersPayload, timeSpent },
      }).unwrap();
      const attemptId = (result as { attemptId?: string })?.attemptId ?? (result as { _id?: string })?._id;
      if (attemptId) {
        navigation.replace(ROUTES.QUIZ_RESULT, { attemptId, quizId, courseId, lessonId });
      } else {
        Alert.alert('Lỗi', 'Không nhận được kết quả. Thử lại.');
      }
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? (err as Error)?.message ?? 'Nộp bài thất bại.';
      Alert.alert('Lỗi', msg);
    }
  };

  const setAnswer = (value: string | boolean | number) => {
    setAnswers(prev => {
      const next = [...prev];
      next[currentIndex] = value;
      return next;
    });
  };

  if (!quizId) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Thiếu thông tin quiz.</Text>
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
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Không tải được đề bài.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!quiz) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Không có dữ liệu quiz.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const questions = quiz.questions ?? [];
  const total = questions.length;
  const current = questions[currentIndex] as QuizQuestion | undefined;
  const canSubmit = total > 0 && answers.every(a => a !== null);
  const isLast = currentIndex === total - 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={24} color={COLORS.gray700} />
        </TouchableOpacity>
        <Text style={styles.progress}>
          Câu {currentIndex + 1} / {total}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${((currentIndex + 1) / total) * 100}%` }]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {current && (
          <>
            <Text style={styles.questionType}>
              {current.type === 'multiple-choice' ? 'Chọn một đáp án' : current.type === 'true-false' ? 'Đúng / Sai' : 'Câu hỏi'}
            </Text>
            <Text style={styles.questionText}>{current.questionText}</Text>
            {current.questionCode ? (
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>{current.questionCode}</Text>
              </View>
            ) : null}

            {current.type === 'multiple-choice' && (current.options ?? []).map((opt, i) => {
              const isSelected = answers[currentIndex] === opt;
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.option, isSelected && styles.optionSelected]}
                  onPress={() => setAnswer(opt)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionRadio, isSelected && styles.optionRadioSelected]}>
                    {isSelected ? <Ionicons name="checkmark" size={16} color={COLORS.white} /> : null}
                  </View>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}

            {current.type === 'true-false' && (
              <View style={styles.tfRow}>
                <TouchableOpacity
                  style={[styles.tfBtn, answers[currentIndex] === true && styles.tfBtnSelected]}
                  onPress={() => setAnswer(true)}
                >
                  <Ionicons name="checkmark-circle" size={28} color={answers[currentIndex] === true ? COLORS.primary : COLORS.gray400} />
                  <Text style={styles.tfLabel}>Đúng</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tfBtn, answers[currentIndex] === false && styles.tfBtnSelected]}
                  onPress={() => setAnswer(false)}
                >
                  <Ionicons name="close-circle" size={28} color={answers[currentIndex] === false ? COLORS.error : COLORS.gray400} />
                  <Text style={styles.tfLabel}>Sai</Text>
                </TouchableOpacity>
              </View>
            )}

            {current.type !== 'multiple-choice' && current.type !== 'true-false' && current.options?.length ? (
              (current.options ?? []).map((opt, i) => {
                const isSelected = answers[currentIndex] === opt;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => setAnswer(opt)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })
            ) : null}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING[4] }]}>
        <View style={styles.footerRow}>
          {currentIndex > 0 ? (
            <Button
              title="Trước"
              onPress={() => setCurrentIndex(i => i - 1)}
              style={[styles.navBtn, styles.navBtnSecondary]}
            />
          ) : (
            <View style={styles.navBtn} />
          )}
          {isLast ? (
            <Button
              title={submitting ? 'Đang nộp...' : 'Nộp bài'}
              onPress={handleSubmit}
              disabled={!canSubmit || submitting}
              style={[styles.navBtn, styles.navBtnPrimary]}
            />
          ) : (
            <Button
              title="Tiếp"
              onPress={() => setCurrentIndex(i => i + 1)}
              style={[styles.navBtn, styles.navBtnPrimary]}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING[5] },
  errorText: { ...TYPOGRAPHY.bodyMedium, color: COLORS.gray700, marginBottom: SPACING[2] },
  link: { ...TYPOGRAPHY.bodyMedium, color: COLORS.primary, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBack: { padding: SPACING[2] },
  progress: { ...TYPOGRAPHY.label, color: COLORS.gray800 },
  headerRight: { width: 40 },
  bar: { height: 4, backgroundColor: COLORS.gray200 },
  barFill: { height: '100%', backgroundColor: COLORS.primary },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING[5] },
  questionType: { ...TYPOGRAPHY.caption, color: COLORS.primary, marginBottom: SPACING[2], textTransform: 'uppercase' },
  questionText: { ...TYPOGRAPHY.h3, color: COLORS.gray900, marginBottom: SPACING[4], lineHeight: 26 } as any,
  codeBlock: { backgroundColor: COLORS.gray100, borderRadius: BORDER_RADIUS.md, padding: SPACING[3], marginBottom: SPACING[4] },
  codeText: { ...TYPOGRAPHY.bodySmall, fontFamily: 'monospace', color: COLORS.gray800 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING[4],
    marginBottom: SPACING[3],
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  optionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight + '15' },
  optionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray400,
    marginRight: SPACING[3],
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRadioSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  optionText: { ...TYPOGRAPHY.bodyMedium, color: COLORS.gray800, flex: 1 },
  optionTextSelected: { color: COLORS.gray900, fontWeight: '600' },
  tfRow: { flexDirection: 'row', gap: SPACING[4], marginTop: SPACING[2] },
  tfBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING[4],
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: SPACING[2],
  },
  tfBtnSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight + '15' },
  tfLabel: { ...TYPOGRAPHY.label, color: COLORS.gray800 },
  footer: {
    paddingHorizontal: SPACING[5],
    paddingTop: SPACING[4],
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING[4] },
  navBtn: { flex: 1 },
  navBtnPrimary: {},
  navBtnSecondary: { backgroundColor: COLORS.gray300 } as any,
});
