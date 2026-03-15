import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { SkeletonProfile } from '@/components/SkeletonLoader';
import { useTranslation } from 'react-i18next';

const WEEKLY_DATA = [
  { day: 'Mon', tasks: 2, height: 60 },
  { day: 'Tue', tasks: 0, height: 0 },
  { day: 'Wed', tasks: 3, height: 90 },
  { day: 'Thu', tasks: 1, height: 30 },
  { day: 'Fri', tasks: 4, height: 120 },
  { day: 'Sat', tasks: 2, height: 60 },
  { day: 'Sun', tasks: 0, height: 0 },
];

const RECENT_TASKS = [
  {
    id: '1',
    title: 'Install PVC P-Trap',
    completedAt: '2 hours ago',
    duration: '28 min',
    aiChecks: 3,
    errors: 0,
    result: 'correct',
  },
  {
    id: '2',
    title: 'Supply Line Installation',
    completedAt: 'Yesterday',
    duration: '22 min',
    aiChecks: 2,
    errors: 1,
    result: 'warning',
  },
  {
    id: '3',
    title: 'GFCI Outlet Replacement',
    completedAt: '2 days ago',
    duration: '35 min',
    aiChecks: 4,
    errors: 0,
    result: 'correct',
  },
  {
    id: '4',
    title: 'Drain Stack Rough-In',
    completedAt: '3 days ago',
    duration: '85 min',
    aiChecks: 6,
    errors: 2,
    result: 'warning',
  },
];

const ACHIEVEMENTS = [
  { id: '1', icon: 'ribbon', title: 'First Task', description: 'Completed your first task', unlocked: true, color: '#2D8A4E' },
  { id: '2', icon: 'flame', title: '3-Day Streak', description: '3 consecutive days of work', unlocked: true, color: '#E8711A' },
  { id: '3', icon: 'eye', title: 'AI Learner', description: '10 AI analyses performed', unlocked: true, color: '#1976D2' },
  { id: '4', icon: 'star', title: 'Master Plumber', description: 'Complete 20 plumbing tasks', unlocked: false, color: '#9C27B0' },
  { id: '5', icon: 'shield-checkmark', title: 'Code Compliant', description: 'No code errors in 10 tasks', unlocked: false, color: '#F9A825' },
  { id: '6', icon: 'trophy', title: 'Speed Runner', description: 'Complete a task in record time', unlocked: false, color: '#D32F2F' },
];

const maxBarHeight = 120;

function WeeklyChart() {
  const barWidth = 28;
  const spacing = 16;
  const totalWidth = WEEKLY_DATA.length * (barWidth + spacing);
  const chartHeight = 140;

  return (
    <Svg width={totalWidth} height={chartHeight}>
      {WEEKLY_DATA.map((item, i) => {
        const x = i * (barWidth + spacing);
        const barHeight = item.height;
        const y = maxBarHeight - barHeight;
        const isToday = i === new Date().getDay() - 1;

        return (
          <React.Fragment key={item.day}>
            {/* Bar */}
            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight > 0 ? barHeight : 4}
              rx={6}
              fill={isToday ? '#E8711A' : barHeight > 0 ? '#3A506B' : '#3A3A3C'}
            />
            {/* Day label */}
            <SvgText
              x={x + barWidth / 2}
              y={chartHeight - 4}
              fontSize="11"
              fill={isToday ? '#E8711A' : '#8E8E93'}
              fontWeight={isToday ? '700' : '500'}
              textAnchor="middle"
            >
              {item.day}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

export default function ProgressScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1C1C1E' }} edges={['top']}>
        <SkeletonProfile />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1C1C1E' }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 }}>
          <Text style={{ fontSize: 28, color: '#FFFFFF', fontWeight: '800' }}>{t('progress.title')}</Text>
          <Text style={{ fontSize: 14, color: '#8E8E93', marginTop: 4 }}>
            Week of March 3 – 9, 2026
          </Text>
        </View>

        {/* Hero stats grid */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            {/* Tasks Completed */}
            <View
              style={{
                flex: 1,
                backgroundColor: '#2C2C2E',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: '#3A3A3C',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 11, color: '#8E8E93', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {t('progress.tasksDone')}
                </Text>
                <Ionicons name="checkmark-circle" size={18} color="#2D8A4E" />
              </View>
              <Text style={{ fontSize: 36, color: '#FFFFFF', fontWeight: '800' }}>12</Text>
              <Text style={{ fontSize: 12, color: '#2D8A4E', marginTop: 4, fontWeight: '600' }}>
                {t('progress.thisWeekCount', { count: 3 })}
              </Text>
            </View>

            {/* Errors Caught */}
            <View
              style={{
                flex: 1,
                backgroundColor: '#2C2C2E',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: '#3A3A3C',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 11, color: '#8E8E93', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {t('progress.errorsCaught')}
                </Text>
                <Ionicons name="shield-checkmark" size={18} color="#E8711A" />
              </View>
              <Text style={{ fontSize: 36, color: '#FFFFFF', fontWeight: '800' }}>5</Text>
              <Text style={{ fontSize: 12, color: '#E8711A', marginTop: 4, fontWeight: '600' }}>
                {t('progress.savedHoursRework')}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Hours */}
            <View
              style={{
                flex: 1,
                backgroundColor: '#2C2C2E',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: '#3A3A3C',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 11, color: '#8E8E93', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {t('progress.hoursLogged')}
                </Text>
                <Ionicons name="time" size={18} color="#1976D2" />
              </View>
              <Text style={{ fontSize: 36, color: '#FFFFFF', fontWeight: '800' }}>8.5</Text>
              <Text style={{ fontSize: 12, color: '#1976D2', marginTop: 4, fontWeight: '600' }}>
                {t('progress.totalTracked')}
              </Text>
            </View>

            {/* Streak */}
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(232, 113, 26, 0.08)',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: 'rgba(232, 113, 26, 0.3)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 11, color: '#8E8E93', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {t('progress.streak')}
                </Text>
                <Text style={{ fontSize: 18 }}>🔥</Text>
              </View>
              <Text style={{ fontSize: 36, color: '#E8711A', fontWeight: '800' }}>3</Text>
              <Text style={{ fontSize: 12, color: '#8E8E93', marginTop: 4, fontWeight: '600' }}>
                {t('progress.daysInRow')}
              </Text>
            </View>
          </View>
        </View>

        {/* Weekly Activity Chart */}
        <View style={{ marginHorizontal: 20, marginBottom: 24 }}>
          <View style={{ backgroundColor: '#2C2C2E', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#3A3A3C' }}>
            <Text style={{ fontSize: 15, color: '#FFFFFF', fontWeight: '700', marginBottom: 4 }}>
              {t('progress.weeklyActivity')}
            </Text>
            <Text style={{ fontSize: 12, color: '#8E8E93', marginBottom: 20 }}>
              {t('progress.tasksPerDay')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 4 }}>
              <WeeklyChart />
            </ScrollView>
          </View>
        </View>

        {/* Recent Tasks */}
        <View style={{ marginHorizontal: 20, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 17, color: '#FFFFFF', fontWeight: '700' }}>{t('progress.recentTasks')}</Text>
            <TouchableOpacity>
              <Text style={{ color: '#E8711A', fontSize: 13, fontWeight: '600' }}>{t('progress.viewAll')}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 10 }}>
            {RECENT_TASKS.map((task) => (
              <View
                key={task.id}
                style={{
                  backgroundColor: '#2C2C2E',
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: '#3A3A3C',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: task.result === 'correct' ? 'rgba(45, 138, 78, 0.15)' : 'rgba(249, 168, 37, 0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name={task.result === 'correct' ? 'checkmark-circle' : 'warning'}
                    size={20}
                    color={task.result === 'correct' ? '#2D8A4E' : '#F9A825'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>{task.title}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Ionicons name="time-outline" size={11} color="#636366" />
                      <Text style={{ color: '#636366', fontSize: 11 }}>{task.duration}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Ionicons name="camera-outline" size={11} color="#636366" />
                      <Text style={{ color: '#636366', fontSize: 11 }}>{t('progress.checks', { count: task.aiChecks })}</Text>
                    </View>
                    {task.errors > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Ionicons name="alert-circle-outline" size={11} color="#D32F2F" />
                        <Text style={{ color: '#D32F2F', fontSize: 11 }}>{t('progress.caught', { count: task.errors })}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={{ color: '#636366', fontSize: 12 }}>{task.completedAt}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Achievements */}
        <View style={{ marginHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 17, color: '#FFFFFF', fontWeight: '700' }}>{t('progress.achievements')}</Text>
            <Text style={{ color: '#8E8E93', fontSize: 13 }}>
              {ACHIEVEMENTS.filter((a) => a.unlocked).length}/{ACHIEVEMENTS.length}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {ACHIEVEMENTS.map((achievement) => (
              <View
                key={achievement.id}
                style={{
                  backgroundColor: achievement.unlocked ? '#2C2C2E' : '#1C1C1E',
                  borderRadius: 14,
                  padding: 14,
                  alignItems: 'center',
                  width: '46%',
                  borderWidth: 1,
                  borderColor: achievement.unlocked ? '#3A3A3C' : '#2C2C2E',
                  opacity: achievement.unlocked ? 1 : 0.6,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: achievement.unlocked ? `${achievement.color}20` : '#2C2C2E',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                    borderWidth: achievement.unlocked ? 2 : 1,
                    borderColor: achievement.unlocked ? achievement.color : '#3A3A3C',
                  }}
                >
                  {achievement.unlocked ? (
                    <Ionicons name={achievement.icon as any} size={24} color={achievement.color} />
                  ) : (
                    <Ionicons name="lock-closed" size={20} color="#636366" />
                  )}
                </View>
                <Text
                  style={{
                    color: achievement.unlocked ? '#FFFFFF' : '#636366',
                    fontSize: 13,
                    fontWeight: '700',
                    textAlign: 'center',
                    marginBottom: 4,
                  }}
                >
                  {achievement.title}
                </Text>
                <Text style={{ color: '#8E8E93', fontSize: 11, textAlign: 'center', lineHeight: 15 }}>
                  {achievement.description}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
