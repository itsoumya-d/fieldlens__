import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Share,
} from 'react-native';
import PressableScale from '@/components/PressableScale';
import { useToast } from '@/lib/useToast';
import Toast from '@/components/Toast';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/app';
import { supabase } from '@/lib/supabase';
import { useSubscription } from '@/lib/useSubscription';

type TabId = 'steps' | 'tips' | 'code';

interface TaskStep {
  id: string;
  title: string;
  instruction: string;
  codeRef: string | null;
  checkMyWork: boolean;
}

interface CodeRef {
  code: string;
  description: string;
}

interface TaskStepRow {
  id: string;
  title: string;
  instructions: string;
  step_number: number;
  code_reference?: string | null;
  check_my_work?: boolean | null;
}

interface Task {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  estimatedMinutes: number;
  trade: string;
  tools: string[];
  steps: TaskStep[];
  tips: string[];
  commonMistakes: string[];
  codeRefs: CodeRef[];
}

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toast, showToast, hideToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<TabId>('steps');
  const [isTracking, setIsTracking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { setActiveSession } = useAppStore();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  // K-153: signature capture state
  const [jobComplete, setJobComplete] = useState(false);
  const [signatureDone, setSignatureDone] = useState(false);
  const { isPro } = useSubscription();

  useEffect(() => {
    async function fetchTask() {
      const { data } = await supabase
        .from('tasks')
        .select('*, task_steps(*)')
        .eq('id', id)
        .single();
      if (data) {
        setTask({
          id: data.id,
          title: data.title,
          category: data.category ?? '',
          difficulty: data.difficulty ?? 'beginner',
          estimatedMinutes: data.estimated_minutes ?? 0,
          trade: data.trade ?? '',
          tools: data.tools ?? [],
          steps: (data.task_steps ?? [])
            .sort((a: TaskStepRow, b: TaskStepRow) => a.step_number - b.step_number)
            .map((s: TaskStepRow) => ({
              id: s.id,
              title: s.title,
              instruction: s.instructions,
              codeRef: s.code_reference ?? null,
              checkMyWork: s.check_my_work ?? false,
            })),
          tips: data.tips ?? [],
          commonMistakes: data.common_mistakes ?? [],
          codeRefs: data.code_refs ?? [],
        });
      }
      setLoading(false);
    }
    fetchTask();
  }, [id]);

  useEffect(() => {
    if (isTracking) {
      intervalRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isTracking]);

  function formatElapsed(secs: number): string {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
  }

  if (loading || !task) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#F59E0B" />
      </SafeAreaView>
    );
  }

  const step = task.steps[currentStep];
  const progress = task.steps.length > 0 ? completedSteps.size / task.steps.length : 0;

  const handleStepComplete = () => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(currentStep);
    setCompletedSteps(newCompleted);

    if (currentStep < task.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // K-153: show signature capture instead of immediately navigating back
      showToast('Job saved', 'success');
      setJobComplete(true);
    }
  };

  // K-155: invoice generation
  async function generateInvoice() {
    const invoiceText = `INVOICE\n\nJob: ${task?.title}\nDate: ${new Date().toLocaleDateString()}\nStatus: Completed\n\nTotal: $${(task as any)?.price ?? '0.00'}`;
    try {
      await Share.share({ message: invoiceText, title: `Invoice - ${task?.title}` });
    } catch {
      showToast('Could not share invoice', 'error');
    }
  }

  const handleCheckMyWork = () => {
    router.push('/(tabs)/camera');
  };

  const handleStartSession = () => {
    setActiveSession({
      id: Date.now().toString(),
      taskId: task.id,
      taskTitle: task.title,
      currentStep: currentStep + 1,
      totalSteps: task.steps.length,
      startedAt: new Date(),
    });
  };

  const TABS: { id: TabId; label: string }[] = [
    { id: 'steps', label: 'Steps' },
    { id: 'tips', label: 'Tips' },
    { id: 'code', label: 'Codes' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1C1C1E' }} edges={['top']}>
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
        <PressableScale haptic="light" accessibilityRole="button"
          onPress={() => router.back()}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </PressableScale>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={{ fontSize: 17, color: '#FFFFFF', fontWeight: '700' }} numberOfLines={1}>
            {task.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <View
              style={{
                backgroundColor: 'rgba(45, 138, 78, 0.2)',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
              }}
            >
              <Text style={{ color: '#2D8A4E', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' }}>
                {task.difficulty}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Ionicons name="time-outline" size={11} color="#8E8E93" />
              <Text style={{ color: '#8E8E93', fontSize: 11 }}>{task.estimatedMinutes} min</Text>
            </View>
          </View>
        </View>
        <PressableScale haptic="light" accessibilityRole="button" onPress={handleStartSession}>
          <Ionicons name="camera" size={24} color="#E8711A" />
        </PressableScale>
      </View>

      {/* Progress Bar */}
      <View style={{ height: 3, backgroundColor: '#3A3A3C' }}>
        <View
          style={{
            height: 3,
            backgroundColor: '#E8711A',
            width: `${progress * 100}%`,
          }}
        />
      </View>
      <Text
        style={{
          textAlign: 'center',
          fontSize: 12,
          color: '#8E8E93',
          paddingVertical: 6,
        }}
      >
        {completedSteps.size} of {task.steps.length} steps complete
      </Text>

      {/* Tabs */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 20,
          marginBottom: 16,
          gap: 8,
        }}
      >
        {TABS.map((tab) => (
          <PressableScale haptic="light" accessibilityRole="button"
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 10,
              alignItems: 'center',
              backgroundColor: activeTab === tab.id ? '#E8711A' : '#2C2C2E',
              borderWidth: 1,
              borderColor: activeTab === tab.id ? '#E8711A' : '#3A3A3C',
            }}
          >
            <Text
              style={{
                color: activeTab === tab.id ? '#FFFFFF' : '#8E8E93',
                fontSize: 13,
                fontWeight: '700',
              }}
            >
              {tab.label}
            </Text>
          </PressableScale>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      >
        {activeTab === 'steps' && (
          <>
            {/* K-153/K-155: Job completion section — signature + invoice */}
            {jobComplete && (
              <>
                {!signatureDone && (
                  <View style={{ marginTop: 16, padding: 16, backgroundColor: '#1F2937', borderRadius: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 8 }}>Customer Signature</Text>
                    <Text style={{ fontSize: 13, color: '#94A3B8', marginBottom: 12 }}>
                      Have the customer sign to confirm job completion
                    </Text>
                    <PressableScale
                      haptic="medium"
                      accessibilityRole="button"
                      onPress={() => setSignatureDone(true)}
                      style={{ paddingVertical: 12, borderRadius: 10, borderWidth: 2, borderColor: '#2563EB', borderStyle: 'dashed', alignItems: 'center' }}
                    >
                      <Text style={{ color: '#2563EB', fontWeight: '600' }}>✍ Tap to Collect Signature</Text>
                    </PressableScale>
                  </View>
                )}

                {signatureDone && (
                  <>
                    <View style={{ marginTop: 16, padding: 16, backgroundColor: '#22C55E15', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#22C55E' }}>Signature collected</Text>
                    </View>
                    {/* K-155: Invoice generation (Pro gated) */}
                    <PressableScale
                      haptic="medium"
                      accessibilityRole="button"
                      onPress={() => isPro ? generateInvoice() : router.push('/(auth)/paywall' as any)}
                      style={{ marginTop: 12, padding: 14, backgroundColor: isPro ? '#2563EB' : '#1F2937', borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                    >
                      <Ionicons name="document-text-outline" size={18} color={isPro ? '#fff' : '#64748B'} />
                      <Text style={{ color: isPro ? '#fff' : '#64748B', fontWeight: '600', fontSize: 14 }}>
                        {isPro ? 'Generate Invoice' : '🔒 Generate Invoice (Pro)'}
                      </Text>
                    </PressableScale>
                    <PressableScale
                      haptic="light"
                      accessibilityRole="button"
                      onPress={() => router.back()}
                      style={{ marginTop: 12, padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#3A3A3C' }}
                    >
                      <Text style={{ color: '#8E8E93', fontWeight: '600', fontSize: 14 }}>Done</Text>
                    </PressableScale>
                  </>
                )}
              </>
            )}

            {/* On-site Timer */}
            <View
              style={{
                backgroundColor: '#2C2C2E',
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: '#3A3A3C',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Text style={{ color: '#8E8E93', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                On-Site Timer
              </Text>
              <Text style={{ color: '#FFFFFF', fontSize: 40, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: 2 }}>
                {formatElapsed(elapsed)}
              </Text>
              <PressableScale
                haptic="medium"
                accessibilityRole="button"
                accessibilityLabel={isTracking ? 'Pause timer' : 'Start job timer'}
                onPress={() => setIsTracking((v) => !v)}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 32,
                  borderRadius: 12,
                  backgroundColor: isTracking ? '#F59E0B' : '#22C55E',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  shadowColor: isTracking ? '#F59E0B' : '#22C55E',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Ionicons name={isTracking ? 'pause' : 'play'} size={18} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
                  {isTracking ? 'Pause' : 'Start Job'}
                </Text>
              </PressableScale>
            </View>

            {/* Tools Needed */}
            <View
              style={{
                backgroundColor: '#2C2C2E',
                borderRadius: 14,
                padding: 14,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: '#3A3A3C',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Ionicons name="construct" size={16} color="#E8711A" />
                <Text style={{ color: '#E8711A', fontSize: 13, fontWeight: '700' }}>
                  TOOLS NEEDED
                </Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {task.tools.map((tool) => (
                  <View
                    key={tool}
                    style={{
                      backgroundColor: '#3A3A3C',
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: '#EBEBF5', fontSize: 12, fontWeight: '500' }}>{tool}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Step Navigator */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 16, marginHorizontal: -20 }}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
            >
              {task.steps.map((s, i) => {
                const isCompleted = completedSteps.has(i);
                const isCurrent = i === currentStep;
                return (
                  <PressableScale haptic="light" accessibilityRole="button"
                    key={i}
                    onPress={() => setCurrentStep(i)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isCompleted
                        ? '#2D8A4E'
                        : isCurrent
                        ? '#E8711A'
                        : '#2C2C2E',
                      borderWidth: 2,
                      borderColor: isCompleted ? '#2D8A4E' : isCurrent ? '#E8711A' : '#3A3A3C',
                    }}
                  >
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    ) : (
                      <Text
                        style={{
                          color: isCurrent ? '#FFFFFF' : '#8E8E93',
                          fontSize: 13,
                          fontWeight: '700',
                        }}
                      >
                        {i + 1}
                      </Text>
                    )}
                  </PressableScale>
                );
              })}
            </ScrollView>

            {/* Current Step Card */}
            <View
              style={{
                backgroundColor: '#2C2C2E',
                borderRadius: 16,
                padding: 20,
                borderWidth: 2,
                borderColor: '#E8711A',
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: '#E8711A',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 6,
                }}
              >
                Step {currentStep + 1} of {task.steps.length}
              </Text>
              <Text style={{ fontSize: 18, color: '#FFFFFF', fontWeight: '700', marginBottom: 12 }}>
                {step.title}
              </Text>
              <Text style={{ fontSize: 16, color: '#EBEBF5', lineHeight: 24, marginBottom: 16 }}>
                {step.instruction}
              </Text>

              {step.codeRef && (
                <View
                  style={{
                    backgroundColor: '#1C1C1E',
                    borderRadius: 10,
                    padding: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: '#3A506B',
                  }}
                >
                  <Ionicons name="document-text-outline" size={15} color="#3A506B" />
                  <Text style={{ color: '#8E8E93', fontSize: 13, fontFamily: 'monospace' }}>
                    {step.codeRef}
                  </Text>
                </View>
              )}

              {step.checkMyWork && (
                <PressableScale haptic="medium" accessibilityRole="button"
                  onPress={handleCheckMyWork}
                  style={{
                    backgroundColor: 'rgba(58, 80, 107, 0.3)',
                    borderWidth: 1.5,
                    borderColor: '#3A506B',
                    borderRadius: 12,
                    paddingVertical: 12,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <Ionicons name="camera" size={18} color="#3A506B" />
                  <Text style={{ color: '#8E8E93', fontSize: 15, fontWeight: '600' }}>
                    Check My Work (AI Camera)
                  </Text>
                </PressableScale>
              )}
            </View>
          </>
        )}

        {activeTab === 'tips' && (
          <>
            {/* Pro Tips */}
            <Text style={{ fontSize: 15, color: '#8E8E93', fontWeight: '700', marginBottom: 12 }}>
              PRO TIPS
            </Text>
            <View style={{ gap: 10, marginBottom: 24 }}>
              {task.tips.map((tip, i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: '#2C2C2E',
                    borderRadius: 12,
                    padding: 14,
                    flexDirection: 'row',
                    gap: 12,
                    borderWidth: 1,
                    borderColor: '#3A3A3C',
                    borderLeftWidth: 3,
                    borderLeftColor: '#2D8A4E',
                  }}
                >
                  <Text style={{ color: '#2D8A4E', fontSize: 15, fontWeight: '700' }}>
                    {i + 1}
                  </Text>
                  <Text style={{ flex: 1, color: '#EBEBF5', fontSize: 14, lineHeight: 20 }}>
                    {tip}
                  </Text>
                </View>
              ))}
            </View>

            {/* Common Mistakes */}
            <Text style={{ fontSize: 15, color: '#8E8E93', fontWeight: '700', marginBottom: 12 }}>
              COMMON MISTAKES
            </Text>
            <View style={{ gap: 10 }}>
              {task.commonMistakes.map((mistake, i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: '#2C2C2E',
                    borderRadius: 12,
                    padding: 14,
                    flexDirection: 'row',
                    gap: 12,
                    borderWidth: 1,
                    borderColor: '#3A3A3C',
                    borderLeftWidth: 3,
                    borderLeftColor: '#D32F2F',
                  }}
                >
                  <Ionicons name="close-circle" size={18} color="#D32F2F" style={{ marginTop: 1 }} />
                  <Text style={{ flex: 1, color: '#EBEBF5', fontSize: 14, lineHeight: 20 }}>
                    {mistake}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab === 'code' && (
          <>
            <Text style={{ fontSize: 15, color: '#8E8E93', fontWeight: '700', marginBottom: 12 }}>
              CODE REFERENCES
            </Text>
            <View style={{ gap: 10 }}>
              {task.codeRefs.map((ref) => (
                <View
                  key={ref.code}
                  style={{
                    backgroundColor: '#2C2C2E',
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: '#3A506B',
                  }}
                >
                  <View
                    style={{
                      backgroundColor: 'rgba(58, 80, 107, 0.3)',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 6,
                      alignSelf: 'flex-start',
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: '#3A506B', fontSize: 13, fontWeight: '700', fontFamily: 'monospace' }}>
                      {ref.code}
                    </Text>
                  </View>
                  <Text style={{ color: '#EBEBF5', fontSize: 14, lineHeight: 20 }}>
                    {ref.description}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      {activeTab === 'steps' && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            paddingBottom: 32,
            paddingTop: 16,
            backgroundColor: '#1C1C1E',
            borderTopWidth: 1,
            borderTopColor: '#3A3A3C',
          }}
        >
          <PressableScale haptic="medium" accessibilityRole="button"
            onPress={handleStepComplete}
            style={{
              backgroundColor: completedSteps.has(currentStep) ? '#2D8A4E' : '#E8711A',
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              shadowColor: completedSteps.has(currentStep) ? '#2D8A4E' : '#E8711A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Ionicons
              name={completedSteps.has(currentStep) ? 'checkmark-circle' : 'arrow-forward-circle'}
              size={20}
              color="#FFFFFF"
            />
            <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>
              {completedSteps.has(currentStep)
                ? currentStep < task.steps.length - 1
                  ? 'Next Step'
                  : 'Finish Task'
                : currentStep < task.steps.length - 1
                ? 'Mark Complete & Next'
                : 'Complete Task'}
            </Text>
          </PressableScale>
        </View>
      )}
      <Toast {...toast} onHide={hideToast} />
    </SafeAreaView>
  );
}
