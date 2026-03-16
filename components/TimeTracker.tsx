import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { startTimeEntry, stopTimeEntry, getActiveTimeEntry } from '@/lib/api';
import { useTranslation } from 'react-i18next';

interface TimeTrackerProps {
  taskName?: string;
  taskId?: string;
  jobId?: string;
  onTotalChange?: () => void;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TimeTracker({ taskName, taskId, jobId, onTotalChange }: TimeTrackerProps) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<Date | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulsing green dot animation
  useEffect(() => {
    if (!isRunning) {
      pulseAnim.setValue(1);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [isRunning, pulseAnim]);

  // Tick the timer
  useEffect(() => {
    if (isRunning && startedAtRef.current) {
      intervalRef.current = setInterval(() => {
        const now = new Date();
        setElapsed(Math.floor((now.getTime() - startedAtRef.current!.getTime()) / 1000));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // On mount, check for active entry and resume
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await getActiveTimeEntry(user.id);
      if (data) {
        setActiveEntryId(data.id);
        startedAtRef.current = new Date(data.started_at);
        setElapsed(Math.floor((Date.now() - new Date(data.started_at).getTime()) / 1000));
        setIsRunning(true);
      }
    })();
  }, [user]);

  const handleStart = useCallback(async () => {
    if (!user) return;
    const { data, error } = await startTimeEntry(user.id, taskId, jobId);
    if (error || !data) return;
    setActiveEntryId(data.id);
    startedAtRef.current = new Date(data.started_at);
    setElapsed(0);
    setIsRunning(true);
  }, [user, taskId, jobId]);

  const handleStop = useCallback(async () => {
    if (!activeEntryId) return;
    await stopTimeEntry(activeEntryId);
    setIsRunning(false);
    setActiveEntryId(null);
    startedAtRef.current = null;
    if (intervalRef.current) clearInterval(intervalRef.current);
    onTotalChange?.();
  }, [activeEntryId, onTotalChange]);

  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 16,
        backgroundColor: '#2C2C2E',
        borderWidth: 1,
        borderColor: isRunning ? '#2D8A4E' : '#3A3A3C',
        padding: 16,
      }}
    >
      {/* Header row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        {isRunning && (
          <Animated.View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#2D8A4E',
              marginRight: 8,
              opacity: pulseAnim,
            }}
          />
        )}
        <Ionicons name="timer-outline" size={18} color={isRunning ? '#2D8A4E' : '#8E8E93'} />
        <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginLeft: 8, flex: 1 }}>
          {t('home.timeTracker', 'Time Tracker')}
        </Text>
        {taskName && (
          <View
            style={{
              backgroundColor: 'rgba(232, 113, 26, 0.15)',
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 9999,
            }}
          >
            <Text style={{ color: '#E8711A', fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
              {taskName}
            </Text>
          </View>
        )}
      </View>

      {/* Timer display */}
      <Text
        style={{
          color: isRunning ? '#FFFFFF' : '#636366',
          fontSize: 40,
          fontWeight: '200',
          textAlign: 'center',
          fontVariant: ['tabular-nums'],
          letterSpacing: 2,
          marginBottom: 16,
        }}
      >
        {formatElapsed(elapsed)}
      </Text>

      {/* Controls */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
        {!isRunning ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Start timer"
            onPress={handleStart}
            activeOpacity={0.8}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: '#2D8A4E',
              borderRadius: 12,
              paddingVertical: 14,
              minHeight: 48,
            }}
          >
            <Ionicons name="play" size={18} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
              {t('home.startTimer', 'Start')}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Stop timer"
            onPress={handleStop}
            activeOpacity={0.8}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: '#EF4444',
              borderRadius: 12,
              paddingVertical: 14,
              minHeight: 48,
            }}
          >
            <Ionicons name="stop" size={18} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
              {t('home.stopTimer', 'Stop')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
