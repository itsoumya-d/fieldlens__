import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { SkeletonFeed, SkeletonKPI } from '@/components/SkeletonLoader';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { getTasks, getUserProgress } from '@/lib/api';
import { useTranslation } from 'react-i18next';

const QUICK_ACTIONS = [
  { id: 'camera', icon: 'camera', label: 'AI Camera', color: '#E8711A', route: '/(tabs)/camera' },
  { id: 'tasks', icon: 'library', label: 'Browse Tasks', color: '#1976D2', route: '/(tabs)/library' },
  { id: 'progress', icon: 'trending-up', label: 'My Progress', color: '#2D8A4E', route: '/(tabs)/progress' },
  { id: 'photos', icon: 'images', label: 'My Photos', color: '#9C27B0', route: '/(tabs)/settings' },
];

interface TaskRow {
  id: string;
  name?: string;
  title?: string;
  category?: string;
  difficulty?: string;
  estimated_time?: number;
  time?: number;
  step_count?: number;
  steps?: number;
  trade?: string;
}

interface ProgressRow {
  id: string;
  task_id?: string;
  completed_at?: string;
  tasks?: { name?: string; trade?: string };
}

// Schedule block interface
interface ScheduleBlock {
  id: string;
  time: string;
  endTime: string;
  title: string;
  location: string;
  status: 'upcoming' | 'active' | 'done';
}

// Weather data interface
interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  windMph: number;
  visibility: 'excellent' | 'good' | 'fair' | 'poor';
}

function getHoursGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function DifficultyBadge({ level }: { level: string }) {
  const colors = {
    beginner: { bg: 'rgba(45, 138, 78, 0.15)', text: '#2D8A4E' },
    intermediate: { bg: 'rgba(249, 168, 37, 0.15)', text: '#F9A825' },
    advanced: { bg: 'rgba(211, 47, 47, 0.15)', text: '#D32F2F' },
  };
  const style = colors[level as keyof typeof colors] || colors.beginner;
  return (
    <View style={{ backgroundColor: style.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999 }}>
      <Text style={{ color: style.text, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' }}>
        {level}
      </Text>
    </View>
  );
}

// Visibility rating color
function visColor(v: WeatherData['visibility']): string {
  if (v === 'excellent') return '#2D8A4E';
  if (v === 'good') return '#4CAF50';
  if (v === 'fair') return '#F9A825';
  return '#EF4444';
}

// GPS Check-in status chip — large-tap friendly
function GpsStatusChip({ checkedIn, onPress }: { checkedIn: boolean; onPress: () => void }) {
  const color = checkedIn ? '#2D8A4E' : '#EF4444';
  const bgColor = checkedIn ? 'rgba(45,138,78,0.15)' : 'rgba(239,68,68,0.12)';
  const borderColor = checkedIn ? 'rgba(45,138,78,0.35)' : 'rgba(239,68,68,0.3)';
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: bgColor,
        borderWidth: 1,
        borderColor,
        minHeight: 36,
      }}
    >
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
      <Ionicons name={checkedIn ? 'location' : 'location-outline'} size={14} color={color} />
      <Text style={{ fontSize: 12, fontWeight: '700', color }}>
        {checkedIn ? t('home.checkedIn') : t('home.checkIn')}
      </Text>
    </TouchableOpacity>
  );
}

// Weather widget with outdoor visibility rating
function WeatherWidget({ weather }: { weather: WeatherData }) {
  const vc = visColor(weather.visibility);
  const visWidth = weather.visibility === 'excellent' ? '100%' : weather.visibility === 'good' ? '75%' : weather.visibility === 'fair' ? '50%' : '25%';
  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 14,
        backgroundColor: '#2C2C2E',
        borderWidth: 1,
        borderColor: '#3A3A3C',
        overflow: 'hidden',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14 }}>
        {/* Temp + condition */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <Text style={{ fontSize: 32 }}>{weather.icon}</Text>
          <View>
            <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '800' }}>
              {weather.temp}°F
            </Text>
            <Text style={{ color: '#8E8E93', fontSize: 12 }}>{weather.condition}</Text>
          </View>
        </View>
        {/* Wind + visibility badge */}
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="flag-outline" size={13} color="#8E8E93" />
            <Text style={{ color: '#8E8E93', fontSize: 12 }}>{weather.windMph} mph</Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
              backgroundColor: `${vc}18`,
            }}
          >
            <Ionicons name="eye-outline" size={12} color={vc} />
            <Text style={{ color: vc, fontSize: 11, fontWeight: '700' }}>
              {weather.visibility.charAt(0).toUpperCase() + weather.visibility.slice(1)}
            </Text>
          </View>
        </View>
      </View>
      {/* Outdoor rating bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 12, gap: 8 }}>
        <Text style={{ fontSize: 10, color: '#636366', fontWeight: '700', letterSpacing: 0.3 }}>
          OUTDOOR RATING
        </Text>
        <View style={{ flex: 1, height: 5, backgroundColor: '#3A3A3C', borderRadius: 3, overflow: 'hidden' }}>
          <View style={{ height: '100%', borderRadius: 3, backgroundColor: vc, width: visWidth as any }} />
        </View>
        <Text style={{ fontSize: 11, color: vc, fontWeight: '700' }}>
          {weather.visibility === 'excellent' ? 'Excellent' : weather.visibility === 'good' ? 'Good' : weather.visibility === 'fair' ? 'Fair' : 'Poor'}
        </Text>
      </View>
    </View>
  );
}

// Large-tap schedule time block (min 64px)
function ScheduleTimeBlock({ block }: { block: ScheduleBlock }) {
  const isActive = block.status === 'active';
  const isDone = block.status === 'done';
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.8}
      style={{
        minHeight: 64,
        flexDirection: 'row',
        alignItems: 'stretch',
        marginBottom: 8,
        borderRadius: 14,
        backgroundColor: isActive ? 'rgba(232,113,26,0.08)' : '#2C2C2E',
        borderWidth: 1,
        borderColor: isActive ? '#E8711A' : isDone ? '#2A2A2C' : '#3A3A3C',
        overflow: 'hidden',
      }}
    >
      {/* Time column */}
      <View
        style={{
          width: 64,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 12,
          borderRightWidth: 1,
          borderRightColor: isActive ? '#E8711A40' : '#3A3A3C',
          backgroundColor: isActive ? 'rgba(232,113,26,0.1)' : '#252527',
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? '#E8711A' : isDone ? '#636366' : '#FFFFFF' }}>
          {block.time}
        </Text>
        <Text style={{ fontSize: 10, color: '#636366', marginTop: 2 }}>{block.endTime}</Text>
      </View>
      {/* Content */}
      <View style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 14, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <Text
            style={{ fontSize: 15, fontWeight: '700', color: isDone ? '#636366' : '#FFFFFF', flex: 1 }}
            numberOfLines={1}
          >
            {block.title}
          </Text>
          {isActive && (
            <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: '#E8711A20' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#E8711A' }}>NOW</Text>
            </View>
          )}
          {isDone && <Ionicons name="checkmark-circle" size={18} color="#2D8A4E" />}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="location-outline" size={12} color="#636366" />
          <Text style={{ fontSize: 12, color: '#636366' }} numberOfLines={1}>{block.location}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user, trade } = useAuthStore();
  const { activeSession, analysisCount, dailyLimit } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [recommendedTasks, setRecommendedTasks] = useState<TaskRow[]>([]);
  const [recentActivity, setRecentActivity] = useState<ProgressRow[]>([]);
  const [checkedIn, setCheckedIn] = useState(false);

  const displayName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
  const greeting = getHoursGreeting();

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const currentTrade = trade ?? 'plumbing';
    Promise.all([
      getTasks(currentTrade).then(({ data }) => { if (data) setRecommendedTasks(data as TaskRow[]); }),
      getUserProgress(user.id).then(({ data }) => { if (data) setRecentActivity(data as ProgressRow[]); }),
    ]).finally(() => setLoading(false));
  }, [user, trade]);

  // Simulated today's schedule
  const todaySchedule: ScheduleBlock[] = [
    { id: 's1', time: '8:00', endTime: '10:00', title: 'Site Safety Walkthrough', location: 'Building A — Floor 2', status: 'done' },
    { id: 's2', time: '10:30', endTime: '12:00', title: 'Pipe Installation Task', location: 'Mechanical Room B', status: 'active' },
    { id: 's3', time: '1:00', endTime: '3:00', title: 'Electrical Panel Inspection', location: 'Main Utility Corridor', status: 'upcoming' },
    { id: 's4', time: '3:30', endTime: '5:00', title: 'End-of-Day Checklist', location: 'Site Office', status: 'upcoming' },
  ];

  // Simulated weather
  const weather: WeatherData = {
    temp: 67,
    condition: 'Partly Cloudy',
    icon: '⛅',
    windMph: 8,
    visibility: 'good',
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1C1C1E' }} edges={['top']}>
        <SkeletonKPI />
        <SkeletonFeed count={4} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1C1C1E' }} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 12,
          }}
        >
          <Text style={{ fontSize: 22, color: '#FFFFFF', fontWeight: '800', letterSpacing: -0.5 }}>
            Field<Text style={{ color: '#E8711A' }}>Lens</Text>
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* GPS status chip */}
            <GpsStatusChip
              checkedIn={checkedIn}
              onPress={() =>
                Alert.alert(
                  t('home.gpsCheckIn'),
                  checkedIn ? t('home.checkOutConfirm') : t('home.checkInConfirm'),
                  [
                    { text: t('common.cancel'), style: 'cancel' },
                    { text: checkedIn ? t('home.checkOut') : t('home.checkIn'), onPress: () => setCheckedIn(!checkedIn) },
                  ]
                )
              }
            />
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => router.push('/(tabs)/settings')}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#2C2C2E',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: '#E8711A',
              }}
            >
              <Text style={{ color: '#E8711A', fontSize: 16, fontWeight: '700' }}>
                {displayName[0]?.toUpperCase() || 'U'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting + Stats */}
        <View
          style={{
            marginHorizontal: 20,
            backgroundColor: '#2C2C2E',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#3A3A3C',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View>
              <Text style={{ fontSize: 20, color: '#FFFFFF', fontWeight: '700' }}>
                {greeting}, {displayName}!
              </Text>
              {trade && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <View
                    style={{
                      backgroundColor: 'rgba(232, 113, 26, 0.15)',
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderRadius: 9999,
                    }}
                  >
                    <Text style={{ color: '#E8711A', fontSize: 12, fontWeight: '700', textTransform: 'capitalize' }}>
                      {trade}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Streak */}
            <View
              style={{
                alignItems: 'center',
                backgroundColor: 'rgba(232, 113, 26, 0.1)',
                borderRadius: 12,
                padding: 10,
                borderWidth: 1,
                borderColor: 'rgba(232, 113, 26, 0.2)',
              }}
            >
              <Text style={{ fontSize: 22, color: '#E8711A', fontWeight: '800' }}>🔥</Text>
              <Text style={{ fontSize: 18, color: '#E8711A', fontWeight: '800' }}>3</Text>
              <Text style={{ fontSize: 10, color: '#8E8E93', fontWeight: '600' }}>{t('home.dayStreak')}</Text>
            </View>
          </View>

          {/* Daily stats row */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { label: 'Tasks Today', value: String(recentActivity.filter(a => a.completed_at && new Date(a.completed_at).toDateString() === new Date().toDateString()).length), icon: 'checkmark-circle', color: '#2D8A4E' },
              { label: 'AI Analyses', value: `${analysisCount}/${dailyLimit}`, icon: 'camera', color: '#E8711A' },
              { label: 'Hours', value: '1.5', icon: 'time', color: '#1976D2' },
            ].map((stat) => (
              <View
                key={stat.label}
                style={{
                  flex: 1,
                  backgroundColor: '#3A3A3C',
                  borderRadius: 12,
                  padding: 12,
                  alignItems: 'center',
                }}
              >
                <Ionicons name={stat.icon as any} size={18} color={stat.color} style={{ marginBottom: 4 }} />
                <Text style={{ fontSize: 18, color: '#FFFFFF', fontWeight: '700' }}>{stat.value}</Text>
                <Text style={{ fontSize: 10, color: '#8E8E93', fontWeight: '500', textAlign: 'center' }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Weather Widget */}
        <WeatherWidget weather={weather} />

        {/* Today's Schedule */}
        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 15, color: '#8E8E93', fontWeight: '600' }}>{t('home.todaysSchedule')}</Text>
            <Text style={{ fontSize: 12, color: '#E8711A', fontWeight: '600' }}>
              {t('home.remaining', { count: todaySchedule.filter(b => b.status !== 'done').length })}
            </Text>
          </View>
          {todaySchedule.map((block) => (
            <ScheduleTimeBlock key={block.id} block={block} />
          ))}
        </View>

        {/* Continue where you left off */}
        {activeSession && (
          <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 15, color: '#8E8E93', fontWeight: '600', marginBottom: 10 }}>
              {t('home.continueWhereLeftOff')}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              style={{
                minHeight: 64,
                backgroundColor: '#2C2C2E',
                borderRadius: 16,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                borderWidth: 1,
                borderColor: '#E8711A',
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: 'rgba(232, 113, 26, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="construct" size={24} color="#E8711A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                  {activeSession.taskTitle}
                </Text>
                <Text style={{ color: '#8E8E93', fontSize: 13, marginTop: 2 }}>
                  Step {activeSession.currentStep} of {activeSession.totalSteps}
                </Text>
                {/* Progress bar */}
                <View style={{ height: 4, backgroundColor: '#3A3A3C', borderRadius: 2, marginTop: 8 }}>
                  <View
                    style={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: '#E8711A',
                      width: `${(activeSession.currentStep / activeSession.totalSteps) * 100}%`,
                    }}
                  />
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 15, color: '#8E8E93', fontWeight: '600', marginBottom: 12 }}>
            {t('home.quickActions')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                accessibilityRole="button"
                key={action.id}
                onPress={() => router.push(action.route as any)}
                style={{
                  minHeight: 64,
                  backgroundColor: '#2C2C2E',
                  borderRadius: 16,
                  padding: 16,
                  alignItems: 'center',
                  width: 90,
                  borderWidth: 1,
                  borderColor: '#3A3A3C',
                  gap: 8,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: `${action.color}20`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={action.icon as any} size={22} color={action.color} />
                </View>
                <Text style={{ color: '#EBEBF5', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recommended Tasks */}
        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 15, color: '#8E8E93', fontWeight: '600' }}>
              {t('home.recommendedForYou')}
            </Text>
            <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/(tabs)/library')}>
              <Text style={{ color: '#E8711A', fontSize: 13, fontWeight: '600' }}>{t('home.seeAll')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
            {recommendedTasks.slice(0, 5).map((task) => (
              <TouchableOpacity
                accessibilityRole="button"
                key={task.id}
                onPress={() => router.push(`/(tabs)/library/${task.id}` as any)}
                style={{
                  minHeight: 64,
                  backgroundColor: '#2C2C2E',
                  borderRadius: 16,
                  overflow: 'hidden',
                  width: 200,
                  borderWidth: 1,
                  borderColor: '#3A3A3C',
                }}
              >
                {/* Thumbnail placeholder */}
                <View
                  style={{
                    height: 100,
                    backgroundColor: '#3A3A3C',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name={task.trade === 'plumbing' ? 'water' : task.trade === 'electrical' ? 'flash' : 'thermometer'}
                    size={40}
                    color="rgba(232, 113, 26, 0.4)"
                  />
                </View>

                <View style={{ padding: 12 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginBottom: 6 }}>
                    {task.name ?? task.title}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <DifficultyBadge level={task.difficulty ?? 'beginner'} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="time-outline" size={12} color="#8E8E93" />
                      <Text style={{ color: '#8E8E93', fontSize: 11 }}>{task.estimated_time ?? task.time ?? 0}m</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                    <Ionicons name="list-outline" size={12} color="#8E8E93" />
                    <Text style={{ color: '#8E8E93', fontSize: 11 }}>{task.step_count ?? task.steps ?? 0} steps</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 15, color: '#8E8E93', fontWeight: '600', marginBottom: 12 }}>
            {t('home.recentActivity')}
          </Text>
          <View style={{ gap: 8 }}>
            {recentActivity.slice(0, 5).map((activity) => {
              const taskName = activity.tasks?.name ?? 'Task Completed';
              const timeStr = activity.completed_at ? new Date(activity.completed_at).toLocaleDateString() : '';
              return (
                <View
                  key={activity.id}
                  style={{
                    minHeight: 64,
                    backgroundColor: '#2C2C2E',
                    borderRadius: 12,
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    borderWidth: 1,
                    borderColor: '#3A3A3C',
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: 'rgba(45, 138, 78, 0.15)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#2D8A4E" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>{taskName}</Text>
                    <Text style={{ color: '#636366', fontSize: 12, marginTop: 2 }}>{timeStr}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#636366" />
                </View>
              );
            })}
          </View>
        </View>

        {/* Upgrade Banner */}
        <View style={{ marginHorizontal: 20 }}>
          <TouchableOpacity
            accessibilityRole="button"
            style={{
              backgroundColor: 'rgba(232, 113, 26, 0.1)',
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderWidth: 1,
              borderColor: 'rgba(232, 113, 26, 0.3)',
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: 'rgba(232, 113, 26, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="star" size={22} color="#E8711A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
                {t('home.upgradeToPro')}
              </Text>
              <Text style={{ color: '#8E8E93', fontSize: 13, marginTop: 2 }}>
                {t('home.unlimitedAiCoaching')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#E8711A" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Voice Note FAB — always visible, prominent */}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Record voice note"
        activeOpacity={0.85}
        onPress={() =>
          Alert.alert(
            t('home.voiceNote'),
            t('home.startRecordingConfirm'),
            [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('home.record'), onPress: () => {} },
            ]
          )
        }
        style={{
          position: 'absolute',
          bottom: 28,
          right: 20,
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: '#E8711A',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#E8711A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.45,
          shadowRadius: 10,
          elevation: 8,
        }}
      >
        <Ionicons name="mic" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
