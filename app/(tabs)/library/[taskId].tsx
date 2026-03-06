import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const MOCK_STEPS = [
  {
    stepNumber: 1,
    title: 'Gather Tools & Materials',
    instructions:
      'Before starting, gather all necessary tools and materials. Lay them out on a clean surface. This prevents mid-task interruptions and ensures you have everything needed for a quality installation.',
    tools: ['Pipe wrench', 'Channel-lock pliers', 'Teflon tape', 'Bucket', 'Towel'],
    estimatedMinutes: 5,
    tips: [
      'Use a 5-gallon bucket to catch residual water',
      'Have extra Teflon tape on hand',
    ],
    commonMistakes: [
      'Forgetting to turn off the water supply',
      'Not having a towel ready for drips',
    ],
    codeReference: null,
  },
  {
    stepNumber: 2,
    title: 'Shut Off Water Supply',
    instructions:
      'Locate the shut-off valve under the sink and turn it clockwise until fully closed. Open the faucet to release any remaining pressure in the line. Use the bucket to catch any residual water.',
    tools: ['Adjustable wrench', 'Bucket'],
    estimatedMinutes: 5,
    tips: [
      'Turn the handle fully — some valves need multiple turns',
      'Verify no water flows from the faucet before proceeding',
    ],
    commonMistakes: [
      'Not fully closing the valve',
      'Skipping the faucet test',
    ],
    codeReference: 'IPC 606.1 — Shutoff valves required',
  },
  {
    stepNumber: 3,
    title: 'Remove Old Trap',
    instructions:
      'Place the bucket under the trap. Use channel-lock pliers to unscrew the slip nuts on both ends of the P-trap. Turn counterclockwise. Remove the trap and let remaining water drain into the bucket.',
    tools: ['Channel-lock pliers', 'Bucket'],
    estimatedMinutes: 8,
    tips: [
      'Hand-tight is often enough on slip nuts',
      'Inspect old trap for cracks or damage',
    ],
    commonMistakes: [
      'Over-tightening causing cracked fittings',
      'Losing the slip nut washers',
    ],
    codeReference: null,
  },
  {
    stepNumber: 4,
    title: 'Install New P-Trap',
    instructions:
      'Slide the slip nuts and washers onto the drain pipes first. Position the new P-trap, aligning the inlet with the sink drain and the outlet with the wall drain. Hand-tighten the slip nuts.',
    tools: ['New P-trap kit', 'Channel-lock pliers'],
    estimatedMinutes: 10,
    tips: [
      'Ensure the trap arm has the proper slope toward the drain',
      '1/4" per foot slope is required for proper drainage',
    ],
    commonMistakes: [
      'Installing trap arm with reverse slope',
      'Forgetting washers on slip nuts',
    ],
    codeReference: 'IPC 704.1 — Horizontal drain slope: 1/4" per foot',
  },
  {
    stepNumber: 5,
    title: 'Test for Leaks',
    instructions:
      'Turn the water supply back on slowly. Fill the sink and then release the water. Observe all connections for at least 2 minutes. Check for drips at every joint. Tighten as needed.',
    tools: ['Flashlight', 'Paper towels'],
    estimatedMinutes: 10,
    tips: [
      'Use dry paper towels to detect small drips',
      'Check after 30 minutes as thermal changes can cause leaks',
    ],
    commonMistakes: [
      'Declaring success before a full 2-minute observation',
      'Over-tightening leaking joints (hand-tight + 1/4 turn is usually sufficient)',
    ],
    codeReference: 'IPC 312.1 — Required leak test',
  },
];

export default function TaskDetailScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const [currentStep, setCurrentStep] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const step = MOCK_STEPS[currentStep];
  const isLastStep = currentStep === MOCK_STEPS.length - 1;
  const isFirstStep = currentStep === 0;
  const progress = (currentStep + 1) / MOCK_STEPS.length;

  const markStepComplete = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (!isLastStep) {
      setCurrentStep((s) => s + 1);
    } else {
      // Task complete
      router.back();
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
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
        <TouchableOpacity
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
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, color: '#FFFFFF', fontWeight: '700' }} numberOfLines={1}>
            Install PVC P-Trap
          </Text>
          <Text style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>
            Step {currentStep + 1} of {MOCK_STEPS.length}
          </Text>
        </View>

        <TouchableOpacity onPress={() => setIsBookmarked(!isBookmarked)} style={{ padding: 8 }}>
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={isBookmarked ? '#E8711A' : '#8E8E93'}
          />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={{ height: 4, backgroundColor: '#2C2C2E' }}>
        <View
          style={{
            height: 4,
            backgroundColor: '#E8711A',
            width: `${progress * 100}%`,
          }}
        />
      </View>

      {/* Step indicators */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 52, borderBottomWidth: 1, borderBottomColor: '#3A3A3C' }}
        contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center', gap: 8 }}
      >
        {MOCK_STEPS.map((s, i) => {
          const isCompleted = completedSteps.has(i);
          const isCurrent = i === currentStep;
          return (
            <TouchableOpacity key={i} onPress={() => setCurrentStep(i)}>
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
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: isCurrent ? '#E8711A' : '#8E8E93',
                    }}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Step content */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {/* Step header */}
        <View style={{ marginBottom: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 6,
            }}
          >
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
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>
                {step.stepNumber}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: 'rgba(232, 113, 26, 0.1)',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 9999,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Ionicons name="time-outline" size={12} color="#E8711A" />
              <Text style={{ color: '#E8711A', fontSize: 12, fontWeight: '600' }}>
                {step.estimatedMinutes} min
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 22, color: '#FFFFFF', fontWeight: '700' }}>{step.title}</Text>
        </View>

        {/* Image placeholder */}
        <View
          style={{
            height: 180,
            backgroundColor: '#2C2C2E',
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#3A3A3C',
          }}
        >
          <Ionicons name="image-outline" size={48} color="#636366" />
          <Text style={{ color: '#636366', fontSize: 13, marginTop: 8 }}>Step illustration</Text>
        </View>

        {/* Instructions */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 15, color: '#EBEBF5', lineHeight: 24 }}>{step.instructions}</Text>
        </View>

        {/* Tools */}
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
          <Text style={{ fontSize: 13, color: '#8E8E93', fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            Tools Needed
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {step.tools.map((tool) => (
              <View
                key={tool}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: '#3A3A3C',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}
              >
                <Ionicons name="hammer-outline" size={13} color="#8E8E93" />
                <Text style={{ color: '#EBEBF5', fontSize: 13 }}>{tool}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tips (expandable) */}
        <TouchableOpacity
          onPress={() => toggleSection('tips')}
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
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
              Pro Tips ({step.tips.length})
            </Text>
          </View>
          <Ionicons
            name={expandedSection === 'tips' ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#8E8E93"
          />
        </TouchableOpacity>
        {expandedSection === 'tips' && (
          <View style={{ backgroundColor: '#2C2C2E', borderRadius: 12, padding: 16, marginTop: -4, marginBottom: 12, borderWidth: 1, borderColor: '#3A3A3C', gap: 8 }}>
            {step.tips.map((tip, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#F9A825', marginTop: 7 }} />
                <Text style={{ flex: 1, color: '#EBEBF5', fontSize: 14, lineHeight: 20 }}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Common Mistakes (expandable) */}
        <TouchableOpacity
          onPress={() => toggleSection('mistakes')}
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
            <Ionicons name="warning-outline" size={18} color="#D32F2F" />
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
              Common Mistakes ({step.commonMistakes.length})
            </Text>
          </View>
          <Ionicons
            name={expandedSection === 'mistakes' ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#8E8E93"
          />
        </TouchableOpacity>
        {expandedSection === 'mistakes' && (
          <View style={{ backgroundColor: '#2C2C2E', borderRadius: 12, padding: 16, marginTop: -4, marginBottom: 12, borderWidth: 1, borderColor: '#3A3A3C', gap: 8 }}>
            {step.commonMistakes.map((mistake, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#D32F2F', marginTop: 7 }} />
                <Text style={{ flex: 1, color: '#EBEBF5', fontSize: 14, lineHeight: 20 }}>{mistake}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Code Reference */}
        {step.codeReference && (
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
            }}
          >
            <Ionicons name="document-text-outline" size={18} color="#3A506B" style={{ color: '#6A8CB0' }} />
            <Text style={{ flex: 1, color: '#6A8CB0', fontSize: 13, fontFamily: 'monospace' }}>
              {step.codeReference}
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
        {/* Previous */}
        <TouchableOpacity
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
        </TouchableOpacity>

        {/* Check My Work */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/camera')}
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
        </TouchableOpacity>

        {/* Next / Complete */}
        <TouchableOpacity
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
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
