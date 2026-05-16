import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import PressableScale from '@/components/PressableScale';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { toggleGuideBookmark, getUserBookmarkedGuides, type TaskGuideRow } from '@/lib/api';

type GuideStep = {
  order: number;
  title: string;
  description: string;
  tip?: string;
  warning?: string;
};

export default function TaskDetailScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const user = useAuthStore((s) => s.user);
  const [guide, setGuide] = useState<TaskGuideRow | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGuide() {
      const { data } = await supabase
        .from('task_guides')
        .select('*')
        .eq('id', taskId)
        .single();
      setGuide(data ?? null);
      setLoading(false);
    }
    fetchGuide();
  }, [taskId]);

  useEffect(() => {
    if (!user?.id) return;
    getUserBookmarkedGuides(user.id).then(({ data }) => {
      if (data) setIsBookmarked(data.some((r) => r.guide_id === taskId));
    });
  }, [user?.id, taskId]);

  const handleBookmark = async () => {
    if (!user?.id) return;
    setIsBookmarked((v) => !v);
    const { error } = await toggleGuideBookmark(user.id, taskId!, isBookmarked);
    if (error) setIsBookmarked((v) => !v); // rollback
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#E8711A" />
      </SafeAreaView>
    );
  }

  if (!guide) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <Ionicons name="alert-circle-outline" size={48} color="#D32F2F" />
        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginTop: 16 }}>Guide not found</Text>
        <PressableScale
          haptic="light"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={{ marginTop: 20, backgroundColor: '#E8711A', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Go Back</Text>
        </PressableScale>
      </SafeAreaView>
    );
  }

  const steps: GuideStep[] = Array.isArray(guide.steps) ? guide.steps : [];
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const progress = steps.length > 0 ? (currentStep + 1) / steps.length : 0;

  const markStepComplete = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (!isLastStep) {
      setCurrentStep((s) => s + 1);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1C1C1E' }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#3A3A3C',
        }}
      >
        <PressableScale
          haptic="light"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#2C2C2E',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        </PressableScale>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, color: '#FFFFFF', fontWeight: '700' }} numberOfLines={1}>
            {guide.title}
          </Text>
          <Text style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>
            Step {currentStep + 1} of {steps.length}
          </Text>
        </View>

        <PressableScale haptic="light" accessibilityRole="button" onPress={handleBookmark} style={{ padding: 8 }}>
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={isBookmarked ? '#E8711A' : '#8E8E93'}
          />
        </PressableScale>
      </View>

      {/* Progress bar */}
      <View style={{ height: 4, backgroundColor: '#2C2C2E' }}>
        <View style={{ height: 4, backgroundColor: '#E8711A', width: `${progress * 100}%` }} />
      </View>

      {/* Step indicators */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 52, borderBottomWidth: 1, borderBottomColor: '#3A3A3C' }}
        contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center', gap: 8 }}
      >
        {steps.map((s, i) => {
          const isCompleted = completedSteps.has(i);
          const isCurrent = i === currentStep;
          return (
            <PressableScale haptic="light" accessibilityRole="button" key={i} onPress={() => setCurrentStep(i)}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isCompleted
                    ? 'rgba(45, 138, 78, 0.2)'
                    : isCurrent
                    ? 'rgba(232, 113, 26, 0.2)'
                    : '#2C2C2E',
                  borderWidth: 2,
                  borderColor: isCompleted ? '#2D8A4E' : isCurrent ? '#E8711A' : '#3A3A3C',
                }}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={16} color="#2D8A4E" />
                ) : (
                  <Text style={{ fontSize: 13, fontWeight: '700', color: isCurrent ? '#E8711A' : '#8E8E93' }}>
                    {i + 1}
                  </Text>
                )}
              </View>
            </PressableScale>
          );
        })}
      </ScrollView>

      {/* Step content */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {step ? (
          <>
            <Animated.View entering={FadeInDown.delay(80).duration(500).springify()}>
            {/* Step header */}
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: '#E8711A',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>{step.order}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 22, color: '#FFFFFF', fontWeight: '700' }}>{step.title}</Text>
            </View>

            {/* Description */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 15, color: '#EBEBF5', lineHeight: 24 }}>{step.description}</Text>
            </View>
            </Animated.View>

            {/* Tip */}
            {step.tip && (
              <PressableScale
                haptic="light"
                accessibilityRole="button"
                onPress={() => setExpandedSection(expandedSection === 'tip' ? null : 'tip')}
                style={{
                  backgroundColor: '#2C2C2E',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: '#3A3A3C',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="bulb-outline" size={18} color="#F9A825" />
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Pro Tip</Text>
                </View>
                <Ionicons name={expandedSection === 'tip' ? 'chevron-up' : 'chevron-down'} size={18} color="#8E8E93" />
              </PressableScale>
            )}
            {expandedSection === 'tip' && step.tip && (
              <View style={{ backgroundColor: '#2C2C2E', borderRadius: 12, padding: 16, marginTop: -4, marginBottom: 12, borderWidth: 1, borderColor: '#3A3A3C' }}>
                <Text style={{ color: '#EBEBF5', fontSize: 14, lineHeight: 20 }}>{step.tip}</Text>
              </View>
            )}

            {/* Warning */}
            {step.warning && (
              <View
                style={{
                  backgroundColor: 'rgba(211, 47, 47, 0.08)',
                  borderRadius: 12,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(211, 47, 47, 0.3)',
                  marginBottom: 12,
                }}
              >
                <Ionicons name="warning-outline" size={18} color="#D32F2F" style={{ marginTop: 1 }} />
                <Text style={{ flex: 1, color: '#EBEBF5', fontSize: 14, lineHeight: 20 }}>{step.warning}</Text>
              </View>
            )}

            {/* Code Reference */}
            {guide.code_reference && (
              <View
                style={{
                  backgroundColor: 'rgba(58, 80, 107, 0.2)',
                  borderRadius: 12,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(58, 80, 107, 0.4)',
                  marginBottom: 12,
                }}
              >
                <Ionicons name="document-text-outline" size={18} color="#6A8CB0" />
                <Text style={{ flex: 1, color: '#6A8CB0', fontSize: 13, fontFamily: 'monospace' }}>
                  {guide.code_reference}
                </Text>
              </View>
            )}

            {/* Tools & Materials */}
            {(guide.tools_required?.length > 0 || guide.materials?.length > 0) && (
              <View
                style={{
                  backgroundColor: '#2C2C2E',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: '#3A3A3C',
                }}
              >
                {guide.tools_required?.length > 0 && (
                  <>
                    <Text style={{ fontSize: 11, color: '#8E8E93', fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Tools Needed
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: guide.materials?.length > 0 ? 14 : 0 }}>
                      {guide.tools_required.map((tool) => (
                        <View
                          key={tool}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#3A3A3C', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
                        >
                          <Ionicons name="hammer-outline" size={13} color="#8E8E93" />
                          <Text style={{ color: '#EBEBF5', fontSize: 13 }}>{tool}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
                {guide.materials?.length > 0 && (
                  <>
                    <Text style={{ fontSize: 11, color: '#8E8E93', fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Materials
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {guide.materials.map((mat) => (
                        <View
                          key={mat}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#3A3A3C', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
                        >
                          <Ionicons name="cube-outline" size={13} color="#8E8E93" />
                          <Text style={{ color: '#EBEBF5', fontSize: 13 }}>{mat}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}
          </>
        ) : (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Ionicons name="checkmark-circle" size={64} color="#2D8A4E" />
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 16 }}>Guide Complete!</Text>
            <Text style={{ color: '#8E8E93', fontSize: 14, marginTop: 8, textAlign: 'center' }}>
              You've completed all steps for {guide.title}.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom action bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#1C1C1E',
          borderTopWidth: 1,
          borderTopColor: '#3A3A3C',
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 32,
          flexDirection: 'row',
          gap: 12,
        }}
      >
        <PressableScale
          haptic="light"
          accessibilityRole="button"
          onPress={() => !isFirstStep && setCurrentStep((s) => s - 1)}
          disabled={isFirstStep}
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: isFirstStep ? '#3A3A3C' : '#2C2C2E',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: isFirstStep ? '#3A3A3C' : '#636366',
          }}
        >
          <Ionicons name="chevron-back" size={22} color={isFirstStep ? '#636366' : '#EBEBF5'} />
        </PressableScale>

        {/* Check My Work — passes guided mode context (Task 6) */}
        <PressableScale
          haptic="light"
          accessibilityRole="button"
          onPress={() => {
            const params: Record<string, string> = {};
            if (guide && step) {
              params.guideTitle = guide.title;
              params.stepTitle = step.title;
              params.stepIndex = String(step.order);
            }
            router.push({ pathname: '/(tabs)/camera', params } as any);
          }}
          style={{
            flex: 1,
            paddingVertical: 13,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: '#2C2C2E',
            borderWidth: 1.5,
            borderColor: '#E8711A',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Ionicons name="camera-outline" size={18} color="#E8711A" />
          <Text style={{ color: '#E8711A', fontSize: 14, fontWeight: '700' }}>Check My Work</Text>
        </PressableScale>

        {/* Next / Complete */}
        <PressableScale
          haptic="medium"
          accessibilityRole="button"
          onPress={markStepComplete}
          style={{
            flex: 1,
            paddingVertical: 13,
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
          <Ionicons name={isLastStep ? 'checkmark-circle' : 'chevron-forward'} size={18} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
            {isLastStep ? 'Complete' : 'Next'}
          </Text>
        </PressableScale>
      </View>
    </SafeAreaView>
  );
}
