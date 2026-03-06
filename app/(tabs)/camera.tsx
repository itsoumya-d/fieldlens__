import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/store/app';

const { width, height } = Dimensions.get('window');

type AssessmentResult = 'correct' | 'warning' | 'error' | 'unclear';

interface Assessment {
  result: AssessmentResult;
  message: string;
  details: string[];
  codeReference?: string;
}

const MOCK_ASSESSMENTS: Assessment[] = [
  {
    result: 'correct',
    message: 'Joint looks good',
    details: ['Pipe connection appears properly sealed', 'Slope looks adequate for drainage', 'No visible gaps detected'],
    codeReference: 'IPC 704.1',
  },
  {
    result: 'warning',
    message: 'Potential issue detected',
    details: ['Slight misalignment at the joint', 'Consider re-checking the connection', 'Monitor for leaks after installation'],
    codeReference: 'IPC 308.5',
  },
  {
    result: 'error',
    message: 'Error: Slope insufficient',
    details: ['Drainage slope appears too shallow', 'Minimum 1/4 inch per foot required', 'Re-slope before proceeding'],
    codeReference: 'IPC 704.1 — Min slope: 1/4" per foot',
  },
];

const resultConfig = {
  correct: { color: '#2D8A4E', bgColor: 'rgba(45, 138, 78, 0.15)', icon: 'checkmark-circle' as const, label: 'Looks Good' },
  warning: { color: '#F9A825', bgColor: 'rgba(249, 168, 37, 0.15)', icon: 'warning' as const, label: 'Check This' },
  error: { color: '#D32F2F', bgColor: 'rgba(211, 47, 47, 0.15)', icon: 'close-circle' as const, label: 'Issue Found' },
  unclear: { color: '#8E8E93', bgColor: 'rgba(142, 142, 147, 0.15)', icon: 'help-circle' as const, label: 'Unclear' },
};

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<'on' | 'off'>('off');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  const overlayAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const cameraRef = useRef<CameraView>(null);

  const { analysisCount, dailyLimit, incrementAnalysis, activeSession } = useAppStore();

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
        'Daily Limit Reached',
        'Upgrade to Pro for unlimited AI analyses.',
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade', onPress: () => {} },
        ]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsAnalyzing(true);
    setAssessment(null);
    setShowOverlay(false);

    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockResult = MOCK_ASSESSMENTS[Math.floor(Math.random() * MOCK_ASSESSMENTS.length)];
    setAssessment(mockResult);
    setIsAnalyzing(false);
    setShowOverlay(true);
    incrementAnalysis();

    // Haptic feedback based on result
    if (mockResult.result === 'correct') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (mockResult.result === 'error') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
          Camera Access Required
        </Text>
        <Text style={{ fontSize: 15, color: '#8E8E93', textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
          FieldLens needs camera access to analyze your work and provide AI coaching.
        </Text>
        <TouchableOpacity
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
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Grant Permission</Text>
        </TouchableOpacity>
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
            <TouchableOpacity
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
            </TouchableOpacity>

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
                {activeSession ? activeSession.taskTitle : 'Free Analysis'}
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

          {/* Viewfinder corners */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {/* Corner brackets */}
            {[
              { top: '15%', left: '8%' },
              { top: '15%', right: '8%' },
              { bottom: '20%', left: '8%' },
              { bottom: '20%', right: '8%' },
            ].map((style, i) => (
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

            {/* Analyzing indicator */}
            {isAnalyzing && (
              <View
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.75)',
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: 'center',
                  gap: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(232, 113, 26, 0.5)',
                }}
              >
                <ActivityIndicator color="#E8711A" size="large" />
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                  Analyzing your work...
                </Text>
                <Text style={{ color: '#8E8E93', fontSize: 13 }}>AI is reviewing the image</Text>
              </View>
            )}
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
              <TouchableOpacity
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
              </TouchableOpacity>

              {/* Capture button */}
              <TouchableOpacity
                onPress={handleCapture}
                disabled={isAnalyzing}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: isAnalyzing ? 'rgba(232, 113, 26, 0.5)' : '#E8711A',
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
                {isAnalyzing ? (
                  <ActivityIndicator color="#FFFFFF" size="large" />
                ) : (
                  <Ionicons name="scan" size={32} color="#FFFFFF" />
                )}
              </TouchableOpacity>

              {/* Flip camera */}
              <TouchableOpacity
                onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                }}
              >
                <Ionicons name="camera-reverse-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </CameraView>

      {/* Assessment Overlay */}
      {showOverlay && assessment && (
        <TouchableOpacity
          style={{ position: 'absolute', inset: 0 }}
          activeOpacity={1}
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
                    {resultConfig[assessment.result].label}
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
                    marginBottom: 20,
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

              {/* Action buttons */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
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
                  <Text style={{ color: '#EBEBF5', fontSize: 15, fontWeight: '600' }}>Dismiss</Text>
                </TouchableOpacity>
                <TouchableOpacity
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
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>Analyze Again</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}
