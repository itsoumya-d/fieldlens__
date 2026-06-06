import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  type ViewStyle,
} from 'react-native';
import Reanimated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  FadeIn,
  FadeOut,
  Easing,
} from 'react-native-reanimated';
import PressableScale from '@/components/PressableScale';
import { useToast } from '@/lib/useToast';
import Toast from '@/components/Toast';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/store/app';
import { analyzeImage, addUserXP, unlockAchievement, getUserXP, getAllAchievements, getUserUnlockedAchievements } from '@/lib/api';
import { compressToBase64 } from '@/lib/imageUtils';
import { supabase } from '@/lib/supabase';
import { enqueueOperation } from '@/lib/offline';
import { useTranslation } from 'react-i18next';
import { triggerReview } from '@/lib/review';
import * as Speech from 'expo-speech';

const { width, height } = Dimensions.get('window');

type AssessmentResult = 'correct' | 'warning' | 'error' | 'unclear';
type AIAnalysisStage = 'idle' | 'capturing' | 'uploading' | 'analyzing' | 'complete' | 'error';

interface Assessment {
  result: AssessmentResult;
  message: string;
  details: string[];
  codeReference?: string | null;
  recommendation?: string | null;
}

const resultConfig = {
  correct: { color: '#2D8A4E', bgColor: 'rgba(45, 138, 78, 0.15)', icon: 'checkmark-circle' as const, labelKey: 'camera.resultLooksGood' },
  warning: { color: '#F9A825', bgColor: 'rgba(249, 168, 37, 0.15)', icon: 'warning' as const, labelKey: 'camera.resultCheckThis' },
  error: { color: '#D32F2F', bgColor: 'rgba(211, 47, 47, 0.15)', icon: 'close-circle' as const, labelKey: 'camera.resultIssueFound' },
  unclear: { color: '#8E8E93', bgColor: 'rgba(142, 142, 147, 0.15)', icon: 'help-circle' as const, labelKey: 'camera.resultUnclear' },
};

// Offline fallback for when network is unavailable (Task 9)
const OFFLINE_RESULT = {
  result: 'unclear' as const,
  message: 'Offline — manual review required',
  details: [
    'No network connection detected.',
    'AI analysis requires an internet connection.',
    'Review your work manually using the task guide steps.',
  ],
  codeReference: null,
  recommendation: 'Connect to the internet to use AI analysis, or continue following the step-by-step guide.',
};

// XP milestone achievement keys (matching the achievements table)
const ACHIEVEMENT_KEYS = {
  FIRST_CHECK: 'first_check',
  TEN_CHECKS: 'ten_checks',
  FIFTY_CHECKS: 'fifty_checks',
  LEVEL_5: 'level_5',
  STREAK_7: 'streak_7',
};

async function awardXPAndCheckAchievements(userId: string, xpAmount: number) {
  try {
    await addUserXP(userId, xpAmount);
    const { data: xpRow } = await getUserXP(userId);
    if (!xpRow) return;

    // Check achievement unlocks
    const { data: allAch } = await getAllAchievements();
    const { data: unlockedAch } = await getUserUnlockedAchievements(userId);
    const unlockedKeys = new Set((unlockedAch ?? []).map((u: { achievement_key: string }) => u.achievement_key));

    const candidates = (allAch ?? []).filter((a: { key: string }) => !unlockedKeys.has(a.key));
    for (const ach of candidates) {
      let shouldUnlock = false;
      switch (ach.key) {
        case ACHIEVEMENT_KEYS.FIRST_CHECK:
          shouldUnlock = (xpRow.total_xp ?? 0) >= 10;
          break;
        case ACHIEVEMENT_KEYS.TEN_CHECKS:
          shouldUnlock = (xpRow.total_xp ?? 0) >= 100;
          break;
        case ACHIEVEMENT_KEYS.FIFTY_CHECKS:
          shouldUnlock = (xpRow.total_xp ?? 0) >= 500;
          break;
        case ACHIEVEMENT_KEYS.LEVEL_5:
          shouldUnlock = (xpRow.level ?? 1) >= 5;
          break;
        case ACHIEVEMENT_KEYS.STREAK_7:
          shouldUnlock = (xpRow.streak_days ?? 0) >= 7;
          break;
      }
      if (shouldUnlock) {
        unlockAchievement(userId, ach.key).catch(() => {});
      }
    }
  } catch {
    // Non-critical — don't surface XP errors to user
  }
}

export default function CameraScreen() {
  const { t } = useTranslation();
  const { toast, showToast, hideToast } = useToast();
  // Task 6: guided mode params from library detail screen
  const { guideTitle, stepTitle, stepIndex } = useLocalSearchParams<{
    guideTitle?: string;
    stepTitle?: string;
    stepIndex?: string;
  }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<'on' | 'off'>('off');
  const [analysisStage, setAnalysisStage] = useState<AIAnalysisStage>('idle');
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  // Before / After photo slots
  const [activeSlot, setActiveSlot] = useState<'before' | 'after'>('before');
  const [beforeUri, setBeforeUri] = useState<string | null>(null);
  const [afterUri, setAfterUri] = useState<string | null>(null);

  const stageProgress = useSharedValue(0);
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cameraRef = useRef<CameraView>(null);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${stageProgress.value}%` as unknown as number,
  }));

  const { analysisCount, dailyLimit, incrementAnalysis, activeSession } = useAppStore();
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  useEffect(() => {
    if (showOverlay) {
      Animated.spring(overlayAnim, {
        toValue: 1,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showOverlay]);

  const handleCapture = async () => {
    if (analysisCount >= dailyLimit) {
      Alert.alert(
        t('camera.dailyLimitReached'),
        t('camera.upgradeForUnlimited'),
        [
          { text: t('camera.maybeLater'), style: 'cancel' },
          { text: t('camera.upgrade'), onPress: () => router.push('/(auth)/paywall') },
        ]
      );
      return;
    }

    if (!cameraRef.current) return;

    // Stage: capturing — immediately on shutter tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAnalysisStage('capturing');
    stageProgress.value = 0;
    setAssessment(null);
    setShowOverlay(false);

    try {
      // Task 9: Offline fallback — check connectivity before calling AI
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        setAnalysisStage('complete');
        stageProgress.value = withTiming(100, { duration: 300 });
        setAssessment(OFFLINE_RESULT);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setTimeout(() => {
          setAnalysisStage('idle');
          setShowOverlay(true);
        }, 400);
        return;
      }

      // Take a full-quality photo then compress before sending to the Vision API
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false,
        skipProcessing: false,
      });

      if (!photo?.uri) throw new Error('No image data captured');

      // Save to before / after slot
      if (activeSlot === 'before') {
        setBeforeUri(photo.uri);
      } else {
        setAfterUri(photo.uri);
      }

      // Stage: uploading — compression + sending begins
      setAnalysisStage('uploading');
      stageProgress.value = withTiming(40, { duration: 800, easing: Easing.out(Easing.ease) });
      const base64 = await compressToBase64(photo.uri);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Stage: analyzing — API call in flight, animate to 90 and hold
      setAnalysisStage('analyzing');
      stageProgress.value = withTiming(90, { duration: 2000, easing: Easing.out(Easing.ease) });

      // Call real GPT-4o Vision analysis
      const result = await analyzeImage(user.id, base64, activeSession?.trade ?? 'general');

      // Stage: complete — result arrived
      setAssessment(result);
      setAnalysisStage('complete');
      stageProgress.value = withTiming(100, { duration: 300 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Persist result to ai_analyses; enqueue offline if insert fails
      const analysisPayload = {
        user_id: user.id,
        session_id: activeSession?.id ?? null,
        trade: activeSession?.trade ?? 'general',
        result: result.result,
        message: result.message,
        details: result.details,
        code_reference: result.codeReference ?? null,
        recommendation: result.recommendation ?? null,
      };
      const { error: insertErr } = await supabase.from('ai_analyses').insert(analysisPayload);
      if (insertErr) {
        await enqueueOperation('create', 'ai_analyses', analysisPayload);
      }

      incrementAnalysis();
      triggerReview();

      if (result.result === 'correct') {
        awardXPAndCheckAchievements(user.id, 10);
      } else if (result.result === 'warning') {
        awardXPAndCheckAchievements(user.id, 5);
      }

      // Voice feedback (Task 5)
      if (voiceEnabled) {
        const prefix =
          result.result === 'correct' ? 'Looks good. ' :
          result.result === 'error'   ? 'Issue found. ' :
          result.result === 'warning' ? 'Check this. ' : '';
        const spoken = `${prefix}${result.message}${result.recommendation ? '. ' + result.recommendation : ''}`;
        Speech.speak(spoken, { rate: 0.95, pitch: 1.0 });
      }

      // Auto-dismiss stage overlay after 400ms, then show result sheet
      setTimeout(() => {
        setAnalysisStage('idle');
        setShowOverlay(true);
      }, 400);
    } catch (err) {
      setAnalysisStage('error');
      stageProgress.value = withTiming(0, { duration: 200 });
      showToast(t('camera.couldNotAnalyze'), 'error');
      setTimeout(() => {
        setAnalysisStage('idle');
      }, 1500);
    }
  };

  const handleDismiss = () => {
    setShowOverlay(false);
    setAssessment(null);
  };

  // Permission not yet determined
  if (!permission) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#E8711A" size="large" />
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: 'rgba(211, 47, 47, 0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <Ionicons name="camera-outline" size={40} color="#D32F2F" />
        </View>
        <Text style={{ fontSize: 22, color: '#FFFFFF', fontWeight: '700', textAlign: 'center', marginBottom: 12 }}>
          {t('camera.cameraAccessRequired')}
        </Text>
        <Text style={{ fontSize: 15, color: '#8E8E93', textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
          {t('camera.cameraPermissionDesc')}
        </Text>
        <PressableScale haptic="medium" accessibilityRole="button"
          onPress={requestPermission}
          style={{
            backgroundColor: '#E8711A',
            paddingVertical: 15,
            paddingHorizontal: 40,
            borderRadius: 12,
            shadowColor: '#E8711A',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>{t('camera.grantPermission')}</Text>
        </PressableScale>
      </View>
    );
  }

  const overlayTranslateY = overlayAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      {/* Camera */}
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
        flash={flash}
      >
        {/* Top overlay */}
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: 12,
            }}
          >
            {/* Back button */}
            <PressableScale haptic="light" accessibilityRole="button"
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.2)',
              }}
            >
              <Ionicons name="chevron-down" size={22} color="#FFFFFF" />
            </PressableScale>

            {/* Task indicator */}
            <View
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 9999,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.15)',
              }}
            >
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#E8711A' }} />
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>
                {activeSession ? activeSession.taskTitle : t('home.freeAnalysis')}
              </Text>
            </View>

            {/* Analysis counter */}
            <View
              style={{
                backgroundColor: analysisCount >= dailyLimit ? 'rgba(211, 47, 47, 0.7)' : 'rgba(0, 0, 0, 0.5)',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 9999,
                borderWidth: 1,
                borderColor: analysisCount >= dailyLimit ? 'rgba(211, 47, 47, 0.5)' : 'rgba(255, 255, 255, 0.15)',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
                {analysisCount}/{dailyLimit}
              </Text>
            </View>
          </View>

          {/* Task 6: Guided mode — step context banner */}
          {guideTitle && stepTitle && (
            <View
              style={{
                marginHorizontal: 16,
                marginBottom: 8,
                backgroundColor: 'rgba(0, 0, 0, 0.72)',
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: 'rgba(232, 113, 26, 0.4)',
                gap: 4,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="book-outline" size={14} color="#E8711A" />
                <Text style={{ color: '#E8711A', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {guideTitle}{stepIndex ? ` · Step ${stepIndex}` : ''}
                </Text>
              </View>
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }} numberOfLines={2}>{stepTitle}</Text>
              <Text style={{ color: '#8E8E93', fontSize: 12 }}>Point camera at your work to verify this step</Text>
            </View>
          )}

          {/* Viewfinder corners */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {/* Corner brackets */}
            {([
              { top: '15%', left: '8%' },
              { top: '15%', right: '8%' },
              { bottom: '20%', left: '8%' },
              { bottom: '20%', right: '8%' },
            ] as ViewStyle[]).map((style, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  ...style,
                  width: 32,
                  height: 32,
                  borderColor: '#E8711A',
                  borderTopWidth: i < 2 ? 3 : 0,
                  borderBottomWidth: i >= 2 ? 3 : 0,
                  borderLeftWidth: i % 2 === 0 ? 3 : 0,
                  borderRightWidth: i % 2 === 1 ? 3 : 0,
                }}
              />
            ))}

            {/* AI Analysis Stage Overlay */}
            {analysisStage !== 'idle' && (
              <Reanimated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.85)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 32,
                }}
              >
                {/* Stage label */}
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>
                  {analysisStage === 'capturing'  ? '📸 Capturing...'
                  : analysisStage === 'uploading' ? '⬆️ Uploading photo...'
                  : analysisStage === 'analyzing' ? '🤖 Analyzing for code violations...'
                  : analysisStage === 'complete'  ? '✅ Analysis complete'
                  : '❌ Analysis failed'}
                </Text>

                {/* Secondary hint for analyzing stage */}
                {analysisStage === 'analyzing' && (
                  <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 20, textAlign: 'center' }}>
                    {'AI is reviewing ' + (activeSession?.trade ?? 'general') + ' compliance standards'}
                  </Text>
                )}
                {analysisStage !== 'analyzing' && <View style={{ height: 20 }} />}

                {/* Progress bar track */}
                <View
                  style={{
                    width: '100%',
                    height: 40,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <Reanimated.View
                    style={[
                      {
                        height: 40,
                        backgroundColor: analysisStage === 'error' ? '#D32F2F' : '#E8711A',
                        borderRadius: 4,
                      },
                      progressBarStyle,
                    ]}
                  />
                </View>
              </Reanimated.View>
            )}
          </View>

          {/* Before / After slot selector + thumbnails */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            {/* Slot toggle */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
              {(['before', 'after'] as const).map((slot) => {
                const isActive = activeSlot === slot;
                const thumbUri = slot === 'before' ? beforeUri : afterUri;
                return (
                  <PressableScale
                    key={slot}
                    haptic="light"
                    accessibilityRole="button"
                    accessibilityLabel={`Capture ${slot} photo`}
                    onPress={() => setActiveSlot(slot)}
                    style={{ flex: 1, alignItems: 'center', gap: 6 }}
                  >
                    <Text style={{ color: isActive ? '#FFFFFF' : '#8E8E93', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {slot}
                    </Text>
                    <View
                      style={{
                        width: '100%',
                        height: 64,
                        borderRadius: 10,
                        overflow: 'hidden',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        borderWidth: 2,
                        borderColor: isActive ? '#2563EB' : 'rgba(255,255,255,0.15)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {thumbUri ? (
                        // eslint-disable-next-line @typescript-eslint/no-require-imports
                        <View style={{ flex: 1, width: '100%' }}>
                          {/* Show retake overlay */}
                          <View style={{ flex: 1, backgroundColor: 'rgba(37,99,235,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="checkmark-circle" size={28} color="#2563EB" />
                          </View>
                          <View style={{ position: 'absolute', bottom: 4, alignSelf: 'center' }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>Retake</Text>
                          </View>
                        </View>
                      ) : (
                        <Ionicons name={slot === 'before' ? 'camera-outline' : 'camera'} size={22} color={isActive ? '#2563EB' : '#8E8E93'} />
                      )}
                    </View>
                  </PressableScale>
                );
              })}
            </View>
          </View>

          {/* Bottom controls */}
          <View
            style={{
              paddingBottom: Platform.OS === 'ios' ? 30 : 20,
              paddingHorizontal: 40,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {/* Flash toggle */}
              <PressableScale haptic="light" accessibilityRole="button"
                onPress={() => setFlash(flash === 'on' ? 'off' : 'on')}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: flash === 'on' ? 'rgba(249, 168, 37, 0.3)' : 'rgba(0, 0, 0, 0.5)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: flash === 'on' ? '#F9A825' : 'rgba(255, 255, 255, 0.2)',
                }}
              >
                <Ionicons name={flash === 'on' ? 'flash' : 'flash-off'} size={24} color={flash === 'on' ? '#F9A825' : '#FFFFFF'} />
              </PressableScale>

              {/* Capture button */}
              <PressableScale haptic="medium" accessibilityRole="button"
                onPress={handleCapture}
                disabled={analysisStage !== 'idle'}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: analysisStage !== 'idle' ? 'rgba(232, 113, 26, 0.5)' : '#E8711A',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 4,
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  shadowColor: '#E8711A',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 12,
                  elevation: 10,
                }}
              >
                <Ionicons name="scan" size={32} color="#FFFFFF" />
              </PressableScale>

              {/* Voice toggle */}
              <PressableScale haptic="light" accessibilityRole="button"
                onPress={() => { Speech.stop(); setVoiceEnabled((v) => !v); }}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: voiceEnabled ? 'rgba(45, 138, 78, 0.3)' : 'rgba(0, 0, 0, 0.5)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: voiceEnabled ? '#2D8A4E' : 'rgba(255, 255, 255, 0.2)',
                }}
              >
                <Ionicons name={voiceEnabled ? 'volume-high' : 'volume-mute'} size={24} color={voiceEnabled ? '#2D8A4E' : '#FFFFFF'} />
              </PressableScale>
            </View>
          </View>
        </SafeAreaView>
      </CameraView>

      {/* Assessment Overlay */}
      {showOverlay && assessment && (
        <PressableScale haptic="light" accessibilityRole="button"
          style={{ position: 'absolute', inset: 0 }}
          onPress={handleDismiss}
        >
          <View style={{ flex: 1 }}>
            {/* Backdrop */}
            <View style={{ flex: 1 }} />

            {/* Overlay panel */}
            <Animated.View
              style={{
                transform: [{ translateY: overlayTranslateY }],
                backgroundColor: '#1C1C1E',
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                paddingTop: 16,
                paddingBottom: Platform.OS === 'ios' ? 40 : 28,
                paddingHorizontal: 24,
                borderTopWidth: 1,
                borderTopColor: resultConfig[assessment.result].color + '40',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -10 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
                elevation: 20,
              }}
            >
              {/* Handle */}
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#3A3A3C',
                  alignSelf: 'center',
                  marginBottom: 20,
                }}
              />

              {/* Result header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: resultConfig[assessment.result].bgColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: resultConfig[assessment.result].color + '60',
                  }}
                >
                  <Ionicons
                    name={resultConfig[assessment.result].icon}
                    size={28}
                    color={resultConfig[assessment.result].color}
                  />
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 11,
                      color: resultConfig[assessment.result].color,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      marginBottom: 2,
                    }}
                  >
                    {t(resultConfig[assessment.result].labelKey)}
                  </Text>
                  <Text style={{ fontSize: 20, color: '#FFFFFF', fontWeight: '700' }}>
                    {assessment.message}
                  </Text>
                </View>
              </View>

              {/* Details */}
              <View style={{ gap: 8, marginBottom: 16 }}>
                {assessment.details.map((detail, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: resultConfig[assessment.result].color,
                        marginTop: 7,
                      }}
                    />
                    <Text style={{ flex: 1, color: '#EBEBF5', fontSize: 14, lineHeight: 20 }}>{detail}</Text>
                  </View>
                ))}
              </View>

              {/* Code Reference */}
              {assessment.codeReference && (
                <View
                  style={{
                    backgroundColor: '#2C2C2E',
                    borderRadius: 10,
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: '#3A3A3C',
                  }}
                >
                  <Ionicons name="document-text-outline" size={16} color="#8E8E93" />
                  <Text style={{ color: '#8E8E93', fontSize: 13, fontFamily: 'monospace' }}>
                    {assessment.codeReference}
                  </Text>
                </View>
              )}

              {/* Recommendation */}
              {assessment.recommendation && (
                <View
                  style={{
                    backgroundColor: 'rgba(232, 113, 26, 0.1)',
                    borderRadius: 10,
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 8,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: 'rgba(232, 113, 26, 0.3)',
                  }}
                >
                  <Ionicons name="bulb-outline" size={16} color="#E8711A" style={{ marginTop: 1 }} />
                  <Text style={{ color: '#EBEBF5', fontSize: 13, flex: 1, lineHeight: 18 }}>
                    {assessment.recommendation}
                  </Text>
                </View>
              )}

              {/* Action buttons */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <PressableScale haptic="light" accessibilityRole="button"
                  onPress={handleDismiss}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                    backgroundColor: '#2C2C2E',
                    borderWidth: 1,
                    borderColor: '#3A3A3C',
                  }}
                >
                  <Text style={{ color: '#EBEBF5', fontSize: 15, fontWeight: '600' }}>{t('camera.dismiss')}</Text>
                </PressableScale>
                <PressableScale haptic="medium" accessibilityRole="button"
                  onPress={handleCapture}
                  style={{
                    flex: 2,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                    backgroundColor: '#E8711A',
                    shadowColor: '#E8711A',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 10,
                    elevation: 6,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Ionicons name="camera" size={18} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>{t('camera.analyzeAgain')}</Text>
                </PressableScale>
              </View>
            </Animated.View>
          </View>
        </PressableScale>
      )}
      <Toast {...toast} onHide={hideToast} />
    </View>
  );
}
