import React, { useState, useMemo, useEffect, createElement, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
  Modal,
  useWindowDimensions,
  Pressable,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { Button } from '@/components/ui';
import { useGetCourseLearningQuery, useGetLessonContentQuery } from '@/store/api/coursesApi';
import { useMarkCompleteMutation } from '@/store/api/progressApi';
import { useGenerateMutation } from '@/store/api/certificateApi';
import { useGetMyLatestAttemptQuery } from '@/store/api/quizzesApi';
import { ROUTES } from '@/constants/routes';
import type { AppStackParamList } from '@/types/navigation.types';
import type { Lesson, Progress } from '@/types/api.types';
import { WebView } from 'react-native-webview';

type CoursePlayerRouteProp = RouteProp<AppStackParamList, typeof ROUTES.COURSE_PLAYER>;

const MOBILE_BREAKPOINT = 600;

export const CoursePlayerScreen = () => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < MOBILE_BREAKPOINT;
  const navigation = useNavigation<any>();
  const route = useRoute<CoursePlayerRouteProp>();
  const params = route?.params;
  const courseId = typeof params?.courseId === 'string' ? params.courseId : '';
  const paramLessonId = typeof params?.lessonId === 'string' ? params.lessonId : undefined;
  const navQuizId = typeof (params as any)?.quizId === 'string' ? String((params as any).quizId) : undefined;
  const navQuizScore = typeof (params as any)?.quizScore === 'number' ? (params as any).quizScore : undefined;
  const navQuizPassed = typeof (params as any)?.quizPassed === 'boolean' ? (params as any).quizPassed : undefined;
  const [curriculumModalVisible, setCurriculumModalVisible] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [videoUrlToPlay, setVideoUrlToPlay] = useState<string | null>(null);
  const [disableLatestAttemptQuery, setDisableLatestAttemptQuery] = useState(false);
  const [latestAttemptLocal, setLatestAttemptLocal] = useState<null | { score: number; isPassed: boolean }>(null);

  const { data: learningData, isLoading: loadingLearning, error: learningError, refetch: refetchLearning } = useGetCourseLearningQuery(courseId, {
    skip: !courseId,
  });

  // Khi quay lại màn từ Quiz (hoặc từ background), luôn refetch để cập nhật % hoàn thành.
  useFocusEffect(
    useCallback(() => {
      if (courseId) refetchLearning();
    }, [courseId, refetchLearning])
  );

  const lessons = learningData?.lessons ?? [];
  const completionPercentage = learningData?.completionPercentage ?? 0;
  const progressList = learningData?.progress ?? [];
  const [generateCertificate, { isLoading: generatingCertificate }] = useGenerateMutation();
  const certificateTriggeredRef = useRef(false);

  const progressByLessonId = useMemo(() => {
    const map: Record<string, Progress> = {};
    progressList.forEach((p: Progress) => {
      map[p.lessonId] = p;
    });
    return map;
  }, [progressList]);

  const firstLessonId = lessons.length > 0 ? lessons[0]._id : null;
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(paramLessonId ?? null);

  useEffect(() => {
    if (selectedLessonId == null && firstLessonId) setSelectedLessonId(firstLessonId);
  }, [firstLessonId, selectedLessonId]);

  // Tự cấp chứng chỉ khi hoàn thành 100% (đặc biệt với khóa không có quiz nên không đi qua QuizResultScreen).
  useEffect(() => {
    if (!courseId) return;
    if (certificateTriggeredRef.current) return;
    if (completionPercentage < 100) return;
    certificateTriggeredRef.current = true;

    generateCertificate({ courseId })
      .unwrap()
      .catch(() => {
        // Không spam alert: backend có thể trả lỗi điều kiện (vd cần pass quiz).
        // User vẫn có thể bấm "Hoàn thành khóa học" ở màn QuizResult (nếu có) hoặc thử lại sau.
      });
  }, [courseId, completionPercentage, generateCertificate]);

  const currentLesson = lessons.find((l: Lesson) => l._id === selectedLessonId) ?? lessons[0];
  const currentIndex = currentLesson ? lessons.findIndex((l: Lesson) => l._id === currentLesson._id) : -1;

  // NOTE: Hooks phải được gọi trước mọi return sớm.
  const isQuiz = currentLesson?.type === 'quiz';
  const isVideo = currentLesson?.type === 'video';
  const isText = currentLesson?.type === 'text';
  const currentQuizId = isQuiz ? String((currentLesson as any)?.quizId ?? '') : '';
  const { data: latestAttemptData, error: latestAttemptError } = useGetMyLatestAttemptQuery(currentQuizId, {
    skip: !currentQuizId || disableLatestAttemptQuery,
    refetchOnMountOrArgChange: true,
  });
  const latestAttempt = latestAttemptData?.attempt ?? null;
  const latestAttemptFallback =
    !latestAttempt && navQuizId && currentQuizId && navQuizId === currentQuizId && navQuizScore != null && navQuizPassed != null
      ? { score: navQuizScore, isPassed: navQuizPassed }
      : null;
  const latestAttemptEffective = latestAttempt ?? latestAttemptFallback ?? latestAttemptLocal;

  // Nếu backend chưa có endpoint /my-latest (404) thì stop gọi để tránh spam log và không ảnh hưởng UX.
  useEffect(() => {
    const status = (latestAttemptError as any)?.status;
    if (status === 404) setDisableLatestAttemptQuery(true);
  }, [latestAttemptError]);

  // Load local cached attempt (persisted from QuizQuestionScreen) when viewing a quiz lesson
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!currentQuizId) {
        setLatestAttemptLocal(null);
        return;
      }
      try {
        const raw = await (await import('@react-native-async-storage/async-storage')).default.getItem(
          `@quiz_latest_attempt_${currentQuizId}`
        );
        const parsed = raw ? JSON.parse(raw) : null;
        if (!cancelled && parsed && typeof parsed.score === 'number' && typeof parsed.isPassed === 'boolean') {
          setLatestAttemptLocal({ score: parsed.score, isPassed: parsed.isPassed });
        } else if (!cancelled) {
          setLatestAttemptLocal(null);
        }
      } catch {
        if (!cancelled) setLatestAttemptLocal(null);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [currentQuizId]);

  const { data: contentData, isLoading: loadingContent } = useGetLessonContentQuery(currentLesson?._id ?? '', {
    skip: !currentLesson?._id || currentLesson?.type === 'quiz',
  });

  const [markComplete, { isLoading: markingComplete }] = useMarkCompleteMutation();
  const lessonContent = contentData?.lesson;
  const isCompleted = currentLesson ? !!progressByLessonId[currentLesson._id]?.isCompleted : false;

  const handleMarkComplete = async () => {
    if (!currentLesson || currentLesson.type === 'quiz' || isCompleted) return;
    try {
      await markComplete({ lessonId: currentLesson._id }).unwrap();
      refetchLearning();
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể đánh dấu hoàn thành.');
    }
  };

  const handleOpenQuiz = () => {
    if (!currentLesson?.quizId) {
      Alert.alert('Thông báo', 'Bài này chưa có quiz.');
      return;
    }
    navigation.navigate('QuizStart', { quizId: currentLesson.quizId, courseId, lessonId: currentLesson._id });
  };

  const goPrev = () => {
    if (currentIndex > 0) setSelectedLessonId(lessons[currentIndex - 1]._id);
  };
  const goNext = () => {
    if (currentIndex >= 0 && currentIndex < lessons.length - 1) setSelectedLessonId(lessons[currentIndex + 1]._id);
  };

  const toYoutubeEmbedUrl = (url: string): string => {
    try {
      const u = new URL(url);
      // youtu.be/<id>
      if (u.hostname.includes('youtu.be')) {
        const id = u.pathname.replace('/', '').trim();
        return id ? `https://m.youtube.com/watch?v=${id}&playsinline=1` : url;
      }
      // youtube.com/watch?v=<id>
      const v = u.searchParams.get('v');
      if (v) return `https://m.youtube.com/watch?v=${v}&playsinline=1`;
      // already embed -> convert to watch (tránh error 153 trên một số video)
      if (u.pathname.includes('/embed/')) {
        const parts = u.pathname.split('/embed/');
        const id = (parts[1] ?? '').split('?')[0].trim();
        return id ? `https://m.youtube.com/watch?v=${id}&playsinline=1` : url;
      }
      return url;
    } catch {
      return url;
    }
  };

  const openVideoUrl = () => {
    const url = String(lessonContent?.videoUrl || (lessonContent as any)?.videoUrl || '');
    if (!url) {
      Alert.alert('Thông báo', 'Chưa có link video cho bài này.');
      return;
    }
    // Ưu tiên mở ngay trong app nếu là YouTube link
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      setVideoUrlToPlay(toYoutubeEmbedUrl(url));
      setVideoModalVisible(true);
      return;
    }
    Linking.openURL(url).catch(() => Alert.alert('Lỗi', 'Không thể mở video.'));
  };

  const paddingTop = insets?.top ?? 0;

  if (!courseId) {
    return (
      <View style={[styles.centered, styles.screenRoot, { paddingTop }]}>
        <Text style={styles.errText}>Thiếu thông tin khóa học.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loadingLearning || learningError) {
    return (
      <View style={[styles.centered, styles.screenRoot, { paddingTop }]}>
        {loadingLearning && <ActivityIndicator size="large" color={COLORS.primary} />}
        {learningError ? (
          <View>
            <Text style={styles.errText}>Không tải được nội dung. Bạn cần đăng ký khóa học.</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: SPACING[4] }}>
              <Text style={styles.link}>Quay lại</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  }

  if (lessons.length === 0) {
    return (
      <View style={[styles.centered, styles.screenRoot, { paddingTop }]}>
        <Text style={styles.errText}>Khóa học chưa có bài học.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const mainContent =
    loadingContent && (isVideo || isText) ? (
      <View style={styles.centeredMain}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    ) : isQuiz ? (
      <View
        style={[styles.centeredMain, Platform.OS === 'web' && styles.centeredMainWeb]}
        {...(Platform.OS === 'web' ? { onStartShouldSetResponder: () => true, onResponderRelease: handleOpenQuiz, onClick: handleOpenQuiz } : {})}
      >
        <Ionicons name="help-buoy" size={64} color={COLORS.primary} />
        <Text style={styles.mainTitle}>{currentLesson?.title}</Text>
        <Text style={styles.mainSubtitle}>Bài kiểm tra — làm quiz để hoàn thành bài học.</Text>
        {latestAttemptEffective ? (
          <View style={styles.quizInfoCard}>
            <View style={styles.quizInfoRow}>
              <Ionicons
                name={latestAttemptEffective.isPassed ? 'checkmark-circle' : 'alert-circle'}
                size={18}
                color={latestAttemptEffective.isPassed ? COLORS.success : COLORS.warning}
              />
              <Text style={styles.quizInfoText}>
                Điểm lần trước: <Text style={styles.quizInfoScore}>{Math.round(latestAttemptEffective.score)}%</Text>
                {latestAttemptEffective.isPassed ? ' (Đạt)' : ' (Chưa đạt)'}
              </Text>
            </View>
          </View>
        ) : null}
        {Platform.OS === 'web' ? (
          createElement('button', {
            type: 'button',
            onClick: (e: any) => {
              e.preventDefault();
              e.stopPropagation();
              handleOpenQuiz();
            },
            onMouseDown: (e: any) => {
              e.preventDefault();
              e.stopPropagation();
              handleOpenQuiz();
            },
            style: {
              minWidth: 160,
              minHeight: 48,
              backgroundColor: COLORS.primary,
              padding: '12px 16px',
              borderRadius: Number(BORDER_RADIUS.md) || 8,
              border: 'none',
              cursor: 'pointer',
              color: '#fff',
              fontSize: 16,
              fontWeight: '600',
              position: 'relative',
              zIndex: 10,
            },
            children: latestAttemptEffective ? 'Làm lại' : 'Làm quiz',
          })
        ) : (
          <View
            style={[styles.quizBtn, styles.quizBtnWeb]}
            onStartShouldSetResponder={() => true}
            onResponderRelease={handleOpenQuiz}
            accessibilityRole="button"
            accessibilityLabel={latestAttemptEffective ? 'Làm lại' : 'Làm quiz'}
          >
            <Text style={styles.quizBtnText}>{latestAttemptEffective ? 'Làm lại' : 'Làm quiz'}</Text>
          </View>
        )}
      </View>
    ) : isVideo ? (
      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentScrollInner}>
        <Text style={styles.mainTitle}>{currentLesson?.title}</Text>
        {lessonContent?.videoUrl ? (
          <>
            <TouchableOpacity style={styles.videoPlaceholder} onPress={openVideoUrl}>
              <Ionicons name="play-circle" size={56} color={COLORS.white} />
              <Text style={styles.videoPlaceholderText}>Nhấn để mở video</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>Video mở trong trình duyệt hoặc app hỗ trợ.</Text>
          </>
        ) : (
          <Text style={styles.noContent}>Chưa có video cho bài này.</Text>
        )}
        {!isCompleted && (
          <Pressable
            style={[styles.completeBtn, markingComplete && styles.completeBtnDisabled]}
            onPress={handleMarkComplete}
            disabled={markingComplete}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[styles.completeBtnText, { pointerEvents: 'none' }]}>
              {markingComplete ? 'Đang lưu...' : 'Đánh dấu hoàn thành'}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    ) : (
      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentScrollInner}>
        <Text style={styles.mainTitle}>{currentLesson?.title}</Text>
        <Text style={styles.textContent}>{(lessonContent as any)?.content || (contentData as any)?.lesson?.content || 'Chưa có nội dung.'}</Text>
        {!isCompleted && (
          <Pressable
            style={[styles.completeBtn, markingComplete && styles.completeBtnDisabled]}
            onPress={handleMarkComplete}
            disabled={markingComplete}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[styles.completeBtnText, { pointerEvents: 'none' }]}>
              {markingComplete ? 'Đang lưu...' : 'Đánh dấu hoàn thành'}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    );

  const renderLessonList = (onSelectLesson?: (id: string) => void) => (
    <>
      <Text style={styles.sidebarTitle}>Nội dung</Text>
      {lessons.map((lesson: Lesson, idx: number) => {
        const completed = !!progressByLessonId[lesson._id]?.isCompleted;
        const active = lesson._id === selectedLessonId;
        const isQuizLesson = lesson.type === 'quiz';
        const displayTitle = isQuizLesson ? 'Quiz' : (lesson.title || `Bài ${idx + 1}`);
        const onPress = () => {
          setSelectedLessonId(lesson._id);
          onSelectLesson?.(lesson._id);
        };
        return (
          <TouchableOpacity
            key={lesson._id}
            style={[styles.lessonRow, active && styles.lessonRowActive]}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <View style={styles.lessonRowLeft}>
              {completed ? (
                <Ionicons name="checkmark-circle" size={22} color="#10B981" />
              ) : isQuizLesson ? (
                <Ionicons name="help-buoy" size={22} color={COLORS.gray500} />
              ) : (
                <Ionicons name="play-circle-outline" size={22} color={COLORS.gray500} />
              )}
              <Text style={[styles.lessonRowTitle, active && styles.lessonRowTitleActive]} numberOfLines={2}>
                {displayTitle}
              </Text>
            </View>
            <Text style={styles.lessonRowType}>{isQuizLesson ? 'Quiz' : String(idx + 1)}</Text>
          </TouchableOpacity>
        );
      })}
    </>
  );

  return (
    <View style={[styles.container, { paddingTop }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate(ROUTES.COURSE_DETAIL, { courseId });
          }}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.gray800} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.courseTitle} numberOfLines={1}>{learningData?.course?.title ?? 'Khóa học'}</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${completionPercentage}%` as const }]} />
          </View>
          <Text style={styles.progressText}>{completionPercentage}% hoàn thành</Text>
        </View>
        {isMobile && (
          <TouchableOpacity
            style={styles.headerMenuBtn}
            onPress={() => setCurriculumModalVisible(true)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="list" size={24} color={COLORS.gray800} />
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.body, isMobile && styles.bodyMobile]}>
        {!isMobile && (
          <ScrollView style={styles.sidebar} contentContainerStyle={styles.sidebarContent} showsVerticalScrollIndicator={false}>
            {renderLessonList()}
          </ScrollView>
        )}
        <View style={[styles.main, Platform.OS === 'web' && styles.mainWeb]}>
          {mainContent}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: (insets?.bottom ?? 0) + SPACING[3] }]}>
        <TouchableOpacity
          style={[styles.navBtn, currentIndex <= 0 && styles.navBtnDisabled]}
          onPress={goPrev}
          disabled={currentIndex <= 0}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={22} color={currentIndex <= 0 ? COLORS.gray400 : COLORS.gray700} />
          <Text style={[styles.navBtnText, currentIndex <= 0 && styles.navBtnTextDisabled]}>{isMobile ? 'Bài trước' : 'Trước'}</Text>
        </TouchableOpacity>
        <Text style={styles.footerIndex}>
          {currentIndex + 1} / {lessons.length}
        </Text>
        {currentIndex >= lessons.length - 1 ? (
          <TouchableOpacity
            style={[styles.navBtn, generatingCertificate && styles.navBtnDisabled]}
            onPress={async () => {
              if (!courseId) return;
              try {
                // Idempotent: backend sẽ trả lại chứng chỉ đã cấp nếu có.
                await generateCertificate({ courseId }).unwrap();
              } catch {
                // Nếu chưa đủ điều kiện (vd cần pass quiz) thì vẫn cho user vào Profile để xem trạng thái.
              } finally {
                // Profile nằm trong TabNavigator (nested dưới MainTabs)
                navigation.navigate('MainTabs', { screen: ROUTES.PROFILE, params: { highlightCourseId: courseId } });
              }
            }}
            disabled={generatingCertificate}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.navBtnText}>{generatingCertificate ? 'Đang cấp...' : 'Xem chứng chỉ'}</Text>
            <Ionicons name="trophy-outline" size={20} color={COLORS.gray700} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.navBtn}
            onPress={goNext}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.navBtnText}>{isMobile ? 'Bài tiếp' : 'Tiếp'}</Text>
            <Ionicons name="chevron-forward" size={22} color={COLORS.gray700} />
          </TouchableOpacity>
        )}
      </View>

      {curriculumModalVisible && (
        <Modal
          visible
          animationType="slide"
          transparent
          onRequestClose={() => setCurriculumModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setCurriculumModalVisible(false)}>
            <Pressable style={[styles.modalSheet, { paddingTop: insets.top + SPACING[2], maxHeight: '80%' }]} onPress={e => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nội dung khóa học</Text>
                <TouchableOpacity onPress={() => setCurriculumModalVisible(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={28} color={COLORS.gray700} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll} contentContainerStyle={styles.sidebarContent} showsVerticalScrollIndicator={true}>
                {renderLessonList(() => setCurriculumModalVisible(false))}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {videoModalVisible && (
        <Modal
          visible
          animationType="slide"
          onRequestClose={() => {
            setVideoModalVisible(false);
            setVideoUrlToPlay(null);
          }}
        >
          <View style={[styles.videoModalRoot, { paddingTop: insets.top }]}>
            <View style={styles.videoModalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setVideoModalVisible(false);
                  setVideoUrlToPlay(null);
                }}
                style={styles.videoModalClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={26} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.videoModalTitle} numberOfLines={1}>
                {currentLesson?.title ?? 'Video'}
              </Text>
              <View style={{ width: 40 }} />
            </View>
            {videoUrlToPlay ? (
              <WebView
                source={{ uri: videoUrlToPlay }}
                style={styles.videoWebView}
                allowsFullscreenVideo
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
                originWhitelist={['*']}
                onError={() => {
                  Alert.alert(
                    'Không phát được video trong app',
                    'Video này có thể chặn phát trong WebView. Bạn có muốn mở bằng YouTube không?',
                    [
                      { text: 'Hủy', style: 'cancel' },
                      {
                        text: 'Mở YouTube',
                        onPress: () => {
                          const original = String((lessonContent as any)?.videoUrl || '');
                          if (original) Linking.openURL(original).catch(() => {});
                        },
                      },
                    ]
                  );
                }}
              />
            ) : (
              <View style={styles.centeredMain}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            )}
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  screenRoot: { backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING[5], backgroundColor: COLORS.background },
  errText: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textSecondary, textAlign: 'center' },
  link: { ...TYPOGRAPHY.bodyMedium, color: COLORS.primary, fontWeight: '600', marginTop: SPACING[2] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backBtn: { padding: SPACING[2], marginRight: SPACING[2] },
  headerCenter: { flex: 1 },
  courseTitle: { ...TYPOGRAPHY.label, color: COLORS.textPrimary, marginBottom: 4 },
  progressBarBg: { height: 6, backgroundColor: COLORS.surfaceSecondary, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  progressText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  headerMenuBtn: { padding: SPACING[2], marginLeft: SPACING[1] },
  body: { flex: 1, flexDirection: 'row' },
  bodyMobile: { flexDirection: 'column' },
  sidebar: { width: 280, borderRightWidth: 1, borderRightColor: COLORS.border, backgroundColor: COLORS.background },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[6],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING[3],
    paddingBottom: SPACING[2],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary },
  modalCloseBtn: { padding: SPACING[2] },
  modalScroll: { maxHeight: 400 },
  sidebarContent: { padding: SPACING[4], paddingBottom: SPACING[8] },
  sidebarTitle: { ...TYPOGRAPHY.label, color: COLORS.textSecondary, marginBottom: SPACING[3] },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[2],
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 2,
  },
  lessonRowActive: { backgroundColor: COLORS.primaryLight + '25' },
  lessonRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: SPACING[2] },
  lessonRowTitle: { ...TYPOGRAPHY.bodySmall, color: COLORS.textPrimary, flex: 1 },
  lessonRowTitleActive: { fontWeight: '600', color: COLORS.primary },
  lessonRowType: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  main: { flex: 1, backgroundColor: COLORS.background },
  mainWeb: Platform.select({ web: { position: 'relative' as const, zIndex: 1 }, default: {} }),
  centeredMain: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING[6] },
  centeredMainWeb: Platform.select({ web: { pointerEvents: 'box-none' as const }, default: {} }),
  mainTitle: { ...TYPOGRAPHY.h4, color: COLORS.textPrimary, marginBottom: SPACING[3] },
  mainSubtitle: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textSecondary, marginBottom: SPACING[6], textAlign: 'center' },
  quizBtn: {
    minWidth: 160,
    minHeight: 48,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizBtnWeb: Platform.select({ web: { cursor: 'pointer' as const }, default: {} }),
  quizBtnText: { ...TYPOGRAPHY.button, color: COLORS.white },
  quizInfoCard: {
    marginTop: SPACING[3],
    marginBottom: SPACING[4],
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    maxWidth: 360,
  },
  quizInfoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING[2] },
  quizInfoText: { ...TYPOGRAPHY.bodySmall, color: COLORS.textPrimary, flexShrink: 1 },
  quizInfoScore: { fontWeight: '800', color: COLORS.primary },
  contentScroll: { flex: 1 },
  contentScrollInner: { padding: SPACING[5], paddingBottom: SPACING[8] },
  videoPlaceholder: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[4],
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  videoPlaceholderText: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textPrimary, marginTop: SPACING[2] },
  hint: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, marginBottom: SPACING[4] },
  noContent: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textSecondary, marginBottom: SPACING[4] },
  textContent: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textPrimary, lineHeight: 24, marginBottom: SPACING[6] },
  completeBtn: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeBtnDisabled: { opacity: 0.7 },
  completeBtnText: { ...TYPOGRAPHY.button, color: COLORS.white },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[5],
    paddingTop: SPACING[3],
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: SPACING[3], paddingHorizontal: SPACING[4], minHeight: 44 },
  navBtnDisabled: { opacity: 0.6 },
  navBtnText: { ...TYPOGRAPHY.bodyMedium, color: COLORS.textSecondary },
  navBtnTextDisabled: { color: COLORS.gray400 },
  footerIndex: { ...TYPOGRAPHY.caption, color: COLORS.gray600 },

  videoModalRoot: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  videoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  videoModalClose: { padding: SPACING[2] },
  videoModalTitle: { ...TYPOGRAPHY.label, color: COLORS.textPrimary, flex: 1, textAlign: 'center' },
  videoWebView: { flex: 1, backgroundColor: COLORS.background },
});
