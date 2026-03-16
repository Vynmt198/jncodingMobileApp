import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { Button } from '@/components/ui';
import { useGetQuizQuery } from '@/store/api/quizzesApi';
import { ROUTES } from '@/constants/routes';
import type { AppStackParamList } from '@/types/navigation.types';

type QuizStartRouteProp = RouteProp<AppStackParamList, typeof ROUTES.QUIZ_START>;
type QuizStartNavProp = NativeStackNavigationProp<AppStackParamList, typeof ROUTES.QUIZ_START>;

export const QuizStartScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<QuizStartNavProp>();
  const route = useRoute<QuizStartRouteProp>();
  const { quizId, courseId, lessonId } = route.params ?? { quizId: '' };

  const { data: quiz, isLoading, error } = useGetQuizQuery(quizId, { skip: !quizId });

  const handleStart = () => {
    navigation.replace(ROUTES.QUIZ_QUESTION, { quizId, courseId, lessonId });
  };

  if (!quizId) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Thiếu thông tin quiz. Quay lại và thử lại.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải quiz...</Text>
      </View>
    );
  }

  if (error || !quiz) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>
          {(error as { data?: { message?: string } })?.data?.message ?? 'Không tải được quiz. Bạn có thể chưa đủ điều kiện làm bài.'}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const numQuestions = quiz.questions?.length ?? 0;
  const timeMinutes = Math.ceil((quiz.timeLimit ?? 0) / 60);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING[4], paddingBottom: insets.bottom + SPACING[6] }]}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
        <Ionicons name="chevron-back" size={24} color={COLORS.gray700} />
        <Text style={styles.headerBackText}>Quay lại</Text>
      </TouchableOpacity>

      <View style={styles.iconWrap}>
        <Ionicons name="help-buoy" size={56} color={COLORS.primary} />
      </View>
      <Text style={styles.title}>{quiz.title ?? 'Quiz'}</Text>
      <Text style={styles.subtitle}>Kiểm tra kiến thức của bạn</Text>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="list" size={20} color={COLORS.gray600} />
          <Text style={styles.infoText}>{numQuestions} câu hỏi</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={20} color={COLORS.gray600} />
          <Text style={styles.infoText}>{timeMinutes} phút</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="trophy-outline" size={20} color={COLORS.gray600} />
          <Text style={styles.infoText}>Đạt {quiz.passingScore ?? 60}% để qua</Text>
        </View>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>Lưu ý</Text>
        <Text style={styles.instructionsBody}>
          • Hoàn thành các bài học trước đó trước khi làm quiz.{'\n'}
          • Bạn có thể làm lại nếu chưa đạt.{'\n'}
          • Khi hết giờ, bài làm sẽ tự động nộp.
        </Text>
      </View>

      <Button title="Bắt đầu làm bài" onPress={handleStart} style={styles.startBtn} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: SPACING[5] },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING[5] },
  loadingText: { marginTop: SPACING[3], ...TYPOGRAPHY.bodyMedium, color: COLORS.gray600 },
  errorText: { ...TYPOGRAPHY.bodyMedium, color: COLORS.gray700, textAlign: 'center', marginBottom: SPACING[4] },
  backBtn: { paddingVertical: SPACING[2], paddingHorizontal: SPACING[4] },
  backBtnText: { ...TYPOGRAPHY.bodyMedium, color: COLORS.primary, fontWeight: '600' },
  headerBack: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING[6] },
  headerBackText: { ...TYPOGRAPHY.bodyMedium, color: COLORS.gray700, marginLeft: 4 },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: SPACING[4],
  },
  title: { ...TYPOGRAPHY.h2, color: COLORS.gray900, textAlign: 'center', marginBottom: SPACING[2] },
  subtitle: { ...TYPOGRAPHY.bodyMedium, color: COLORS.gray600, textAlign: 'center', marginBottom: SPACING[6] },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[4],
    marginBottom: SPACING[5],
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING[2] },
  infoText: { ...TYPOGRAPHY.bodyMedium, color: COLORS.gray700, marginLeft: SPACING[3] },
  instructions: { marginBottom: SPACING[6] },
  instructionsTitle: { ...TYPOGRAPHY.label, color: COLORS.gray700, marginBottom: SPACING[2] },
  instructionsBody: { ...TYPOGRAPHY.bodySmall, color: COLORS.gray600, lineHeight: 22 },
  startBtn: { alignSelf: 'stretch' },
});
