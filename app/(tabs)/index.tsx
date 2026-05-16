import { ScrollView, View, Text, Alert, RefreshControl } from 'react-native';
import { SkeletonFeed, SkeletonKPI } from '@/components/SkeletonLoader';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { getTasks, getUserProgress, getTodayTotal, getAIDailyBriefing, getUserXP, getTodayTimeEntries, type AIDailyBriefing } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import TimeTracker from '@/components/TimeTracker';
import Toast from '@/components/Toast';
import { useTranslation } from 'react-i18next';
import Reanimated, {
  FadeInDown,
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import PressableScale from '@/components/PressableScale';
import GradientCard from '@/components/GradientCard';

const QUICK_ACTIONS = [
  { id: 'camera', icon: 'camera', label: 'AI Camera', color: '#E8711A', route: '/(tabs)/camera' },
  { id: 'tasks', icon: 'library', label: 'Browse Tasks', color: '#1976D2', route: '/(tabs)/library' },
  { id: 'progress', icon: 'trending-up', label: 'My Progress', color: '#2D8A4E', route: '/(tabs)/progress' },
  { id: 'photos', icon: 'images', label: 'My Photos', color: '#9C27B0', route: '/(tabs)/photos' },
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

interface TimeEntryRow {
  id: string;
  started_at: string;
  ended_at?: string | null;
  tasks?: { name?: string | null; trade?: string | null } | null;
}

interface SiteCheckinRow {
  id: string;
  name?: string | null;
  user_name?: string | null;
  trade?: string | null;
  status?: string | null;
  current_task?: string | null;
  task?: string | null;
  checked_in_at?: string | null;
}

// Weather data interface
interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  windMph: number;
  visibility: 'excellent' | 'good' | 'fair' | 'poor';
}

const FALLBACK_WEATHER: WeatherData = {
  temp: 70,
  condition: 'Clear',
  icon: '☀️',
  windMph: 0,
  visibility: 'good',
};

function owmConditionToFieldLens(id: number): { condition: string; icon: string } {
  if (id >= 200 && id < 300) return { condition: 'Thunderstorm', icon: '⛈️' };
  if (id >= 300 && id < 400) return { condition: 'Drizzle', icon: '🌦️' };
  if (id >= 500 && id < 600) return { condition: 'Rain', icon: '🌧️' };
  if (id >= 600 && id < 700) return { condition: 'Snow', icon: '🌨️' };
  if (id >= 700 && id < 800) return { condition: 'Foggy', icon: '🌫️' };
  if (id === 800) return { condition: 'Clear', icon: '☀️' };
  if (id === 801) return { condition: 'Partly Cloudy', icon: '⛅' };
  return { condition: 'Cloudy', icon: '☁️' };
}

function metersToVisibility(v: number): WeatherData['visibility'] {
  if (v >= 9000) return 'excellent';
  if (v >= 6000) return 'good';
  if (v >= 3000) return 'fair';
  return 'poor';
}

async function fetchFieldWeather(lat: number, lon: number): Promise<WeatherData | null> {
  const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`
    );
    if (!res.ok) return null;
    const json = await res.json();
    const { condition, icon } = owmConditionToFieldLens(json.weather?.[0]?.id ?? 800);
    return {
      temp: Math.round(json.main?.temp ?? 70),
      condition,
      icon,
      windMph: Math.round(json.wind?.speed ?? 0),
      visibility: metersToVisibility(json.visibility ?? 10000),
    };
  } catch {
    return null;
  }
}

// Compute consecutive-day streak from activity log
function computeStreak(activity: ProgressRow[]): number {
  if (!activity.length) return 0;
  const uniqueDates = [...new Set(
    activity
      .map(a => a.completed_at ? new Date(a.completed_at).toDateString() : null)
      .filter(Boolean) as string[]
  )];
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (uniqueDates.includes(d.toDateString())) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

interface SiteCheckin {
  id: string;
  name: string;
  initials: string;
  trade: string;
  status: 'on-site' | 'off-site';
  task: string | null;
  checkedInAt: string | null;
}

function TeamPresence() {
  const { user } = useAuthStore();
  const [team, setTeam] = useState<SiteCheckin[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('site_checkins')
      .select('*')
      .order('checked_in_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) {
          setTeam((data as SiteCheckinRow[]).map(m => {
            const fullName: string = m.name ?? m.user_name ?? 'Team Member';
            const parts = fullName.trim().split(' ');
            const initials = parts.length >= 2
              ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
              : fullName.slice(0, 2).toUpperCase();
            return {
              id: m.id,
              name: fullName,
              initials,
              trade: m.trade ?? 'General',
              status: m.status === 'on-site' ? 'on-site' : 'off-site',
              task: m.current_task ?? m.task ?? null,
              checkedInAt: m.checked_in_at
                ? new Date(m.checked_in_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                : null,
            };
          }));
        }
      });
  }, [user]);

  const onSiteCount = team.filter(m => m.status === 'on-site').length;
  return (
    <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
      <Reanimated.View
        entering={FadeInDown.delay(0).duration(300).springify()}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}
      >
        <Text style={{ fontSize: 15, color: '#8E8E93', fontWeight: '600' }}>Team on Site</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#2D8A4E' }} />
          <Text style={{ fontSize: 12, color: '#2D8A4E', fontWeight: '700' }}>{onSiteCount} checked in</Text>
        </View>
      </Reanimated.View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {team.map((member, index) => {
          const isOnSite = member.status === 'on-site';
          return (
            <Reanimated.View
              key={member.id}
              entering={FadeInDown.delay(index * 40).duration(250)}
              style={{
                backgroundColor: '#2C2C2E',
                borderRadius: 14,
                padding: 12,
                width: 130,
                borderWidth: 1,
                borderColor: isOnSite ? 'rgba(45,138,78,0.35)' : '#3A3A3C',
              }}
            >
              <View style={{ position: 'relative', marginBottom: 8, alignSelf: 'flex-start' }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: isOnSite ? 'rgba(45,138,78,0.2)' : '#3A3A3C',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 2, borderColor: isOnSite ? '#2D8A4E' : '#636366',
                }}>
                  <Text style={{ color: isOnSite ? '#2D8A4E' : '#636366', fontSize: 12, fontWeight: '800' }}>
                    {member.initials}
                  </Text>
                </View>
                <View style={{
                  width: 9, height: 9, borderRadius: 5,
                  backgroundColor: isOnSite ? '#2D8A4E' : '#636366',
                  position: 'absolute', bottom: 0, right: -1,
                  borderWidth: 1.5, borderColor: '#2C2C2E',
                }} />
              </View>
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{member.name}</Text>
              <Text style={{ color: '#8E8E93', fontSize: 11 }}>{member.trade}</Text>
              {isOnSite && member.task ? (
                <Text style={{ color: '#E8711A', fontSize: 10, fontWeight: '600', marginTop: 4 }} numberOfLines={1}>
                  {member.task}
                </Text>
              ) : !isOnSite ? (
                <Text style={{ color: '#636366', fontSize: 10, marginTop: 4 }}>Off site</Text>
              ) : null}
            </Reanimated.View>
          );
        })}
      </ScrollView>
    </View>
  );
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
  const { t } = useTranslation();
  const color = checkedIn ? '#2D8A4E' : '#EF4444';
  const bgColor = checkedIn ? 'rgba(45,138,78,0.15)' : 'rgba(239,68,68,0.12)';
  const borderColor = checkedIn ? 'rgba(45,138,78,0.35)' : 'rgba(239,68,68,0.3)';
  return (
    <PressableScale
      haptic="medium"
      accessibilityRole="button"
      accessibilityLabel={checkedIn ? 'Check out of site' : 'Check in to site'}
      onPress={onPress}
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
    </PressableScale>
  );
}

// Weather widget with outdoor visibility rating
function WeatherWidget({ weather }: { weather: WeatherData }) {
  const vc = visColor(weather.visibility);
  const visWidth = weather.visibility === 'excellent' ? '100%' : weather.visibility === 'good' ? '75%' : weather.visibility === 'fair' ? '50%' : '25%';
  return (
    <GradientCard
      color="#2563EB"
      style={{
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 14,
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
    </GradientCard>
  );
}

// Large-tap schedule time block (min 64px)
function ScheduleTimeBlock({ block }: { block: ScheduleBlock }) {
  const isActive = block.status === 'active';
  const isDone = block.status === 'done';
  return (
    <PressableScale
      haptic="light"
      accessibilityRole="button"
      accessibilityLabel={block.title}
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
    </PressableScale>
  );
}

// Animated quick action button with scale press + haptics
function QuickActionButton({ action }: { action: typeof QUICK_ACTIONS[number] }) {
  return (
    <PressableScale
      haptic="light"
      accessibilityRole="button"
      accessibilityLabel={action.label}
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
    </PressableScale>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user, trade } = useAuthStore();
  const { activeSession, analysisCount, dailyLimit } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recommendedTasks, setRecommendedTasks] = useState<TaskRow[]>([]);
  const [recentActivity, setRecentActivity] = useState<ProgressRow[]>([]);
  const [checkedIn, setCheckedIn] = useState(false);
  const [todayHours, setTodayHours] = useState(0);
  const [todaySchedule, setTodaySchedule] = useState<ScheduleBlock[]>([]);
  const [briefing, setBriefing] = useState<AIDailyBriefing | null>(null);
  const [briefingExpanded, setBriefingExpanded] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'warning' }>({ visible: false, message: '', type: 'error' });
  const [weather, setWeather] = useState<WeatherData>(FALLBACK_WEATHER);

  const displayName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
  const greeting = getHoursGreeting();
  const streak = computeStreak(recentActivity);

  // Live weather from GPS
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const data = await fetchFieldWeather(loc.coords.latitude, loc.coords.longitude);
      if (data) setWeather(data);
    })();
  }, []);

  // Streak counting animation
  const streakAnimVal = useSharedValue(0);
  const [displayedStreak, setDisplayedStreak] = useState(0);
  useEffect(() => {
    if (streak === 0) return;
    streakAnimVal.value = 0;
    streakAnimVal.value = withTiming(streak, { duration: 800 });
    let start: number | null = null;
    const duration = 800;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayedStreak(Math.round(progress * streak));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [streak]); // eslint-disable-line react-hooks/exhaustive-deps

  // XP progress bar animation
  const xpBarWidth = useSharedValue(0);
  const xpBarStyle = useAnimatedStyle(() => ({ width: `${xpBarWidth.value}%` as any }));
  useEffect(() => {
    if (!activeSession) return;
    const target = (activeSession.currentStep / activeSession.totalSteps) * 100;
    xpBarWidth.value = withTiming(target, { duration: 900 });
  }, [activeSession]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const currentTrade = trade ?? 'plumbing';
    Promise.all([
      getTasks(currentTrade).then(({ data }) => { if (data) setRecommendedTasks(data as TaskRow[]); }),
      getUserProgress(user.id).then(({ data }) => { if (data) setRecentActivity(data as ProgressRow[]); }),
      getTodayTotal(user.id).then((hours) => setTodayHours(hours)),
      getTodayTimeEntries(user.id).then(({ data }) => {
        if (data && data.length > 0) {
          setTodaySchedule((data as TimeEntryRow[]).map(e => {
            const start = new Date(e.started_at);
            const end = e.ended_at ? new Date(e.ended_at) : null;
            const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            const status: ScheduleBlock['status'] = e.ended_at ? 'done' : 'active';
            return {
              id: e.id,
              time: fmt(start),
              endTime: end ? fmt(end) : '—',
              title: e.tasks?.name ?? 'Task',
              location: e.tasks?.trade ?? currentTrade,
              status,
            };
          }));
        }
      }),
    ])
      .catch(() => setToast({ visible: true, message: t('common.loadError', { defaultValue: 'Failed to load dashboard data' }), type: 'error' }))
      .finally(() => setLoading(false));
  }, [user, trade]);

  // Load AI briefing once after main data loads
  useEffect(() => {
    if (!user || loading) return;
    const streak = computeStreak(recentActivity);
    const todayTasks = recentActivity.filter(a => a.completed_at && new Date(a.completed_at).toDateString() === new Date().toDateString()).length;
    getUserXP(user.id).then(({ data: xpData }) => {
      getAIDailyBriefing({
        trade: trade ?? 'general',
        streakDays: streak,
        tasksCompletedToday: todayTasks,
        totalXp: xpData?.total_xp ?? 0,
        level: xpData?.level ?? 1,
      }).then(b => setBriefing(b));
    });
  }, [loading, user, trade]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshTodayHours = () => {
    if (user) getTodayTotal(user.id).then((hours) => setTodayHours(hours));
  };

  const onRefresh = () => {
    if (!user) return;
    setRefreshing(true);
    const currentTrade = trade ?? 'plumbing';
    Promise.all([
      getTasks(currentTrade).then(({ data }) => { if (data) setRecommendedTasks(data as TaskRow[]); }),
      getUserProgress(user.id).then(({ data }) => { if (data) setRecentActivity(data as ProgressRow[]); }),
      getTodayTotal(user.id).then((hours) => setTodayHours(hours)),
      getTodayTimeEntries(user.id).then(({ data }) => {
        if (data && data.length > 0) {
          setTodaySchedule((data as TimeEntryRow[]).map(e => {
            const start = new Date(e.started_at);
            const end = e.ended_at ? new Date(e.ended_at) : null;
            const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            return {
              id: e.id,
              time: fmt(start),
              endTime: end ? fmt(end) : '—',
              title: e.tasks?.name ?? 'Task',
              location: e.tasks?.trade ?? currentTrade,
              status: (e.ended_at ? 'done' : 'active') as ScheduleBlock['status'],
            };
          }));
        }
      }),
    ])
      .catch(() => setToast({ visible: true, message: t('common.refreshError', { defaultValue: 'Refresh failed. Check your connection.' }), type: 'warning' }))
      .finally(() => setRefreshing(false));
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8711A" colors={['#E8711A']} />}
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
            <PressableScale
              haptic="light"
              accessibilityRole="button"
              accessibilityLabel="Open settings"
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
            </PressableScale>
          </View>
        </View>

        {/* Greeting + Stats */}
        <Reanimated.View
          entering={FadeInDown.delay(80).duration(500).springify()}
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
              <Text style={{ fontSize: 18, color: '#E8711A', fontWeight: '800' }}>{displayedStreak}</Text>
              <Text style={{ fontSize: 10, color: '#8E8E93', fontWeight: '600' }}>{t('home.dayStreak')}</Text>
            </View>
          </View>

          {/* Daily stats row */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { label: 'Tasks Today', value: String(recentActivity.filter(a => a.completed_at && new Date(a.completed_at).toDateString() === new Date().toDateString()).length), icon: 'checkmark-circle', color: '#2D8A4E' },
              { label: 'AI Analyses', value: `${analysisCount}/${dailyLimit}`, icon: 'camera', color: '#E8711A' },
              { label: 'Hours', value: String(todayHours), icon: 'time', color: '#1976D2' },
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
        </Reanimated.View>

        {/* Weather Widget */}
        <WeatherWidget weather={weather} />

        {/* AI Coach Daily Briefing */}
        {briefing && (
          <PressableScale
            haptic="light"
            accessibilityRole="button"
            accessibilityLabel={briefingExpanded ? 'Collapse AI Coach briefing' : 'Expand AI Coach briefing'}
            onPress={() => setBriefingExpanded(e => !e)}
            style={{
              marginHorizontal: 20,
              marginBottom: 16,
              borderRadius: 14,
              backgroundColor: '#2C2C2E',
              borderWidth: 1,
              borderColor: 'rgba(232,113,26,0.35)',
              overflow: 'hidden',
            }}
          >
            {/* Header row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, paddingBottom: briefingExpanded ? 8 : 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(232,113,26,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 18 }}>🤖</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#E8711A', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>AI Coach</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600', marginTop: 2 }} numberOfLines={briefingExpanded ? undefined : 1}>
                  {briefing.greeting}
                </Text>
              </View>
              <Ionicons name={briefingExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#8E8E93" />
            </View>

            {briefingExpanded && (
              <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 10 }}>
                <View style={{ borderTopWidth: 1, borderTopColor: '#3A3A3C', paddingTop: 10, gap: 10 }}>
                  {[
                    { icon: '🎯', label: 'Focus Tip', text: briefing.focusTip },
                    { icon: '⚠️', label: 'Safety', text: briefing.safetyReminder },
                    { icon: '💪', label: 'Challenge', text: briefing.challengeOfDay },
                    { icon: '⭐', label: 'XP Opportunity', text: briefing.xpOpportunity },
                  ].map(item => (
                    <View key={item.label} style={{ flexDirection: 'row', gap: 10 }}>
                      <Text style={{ fontSize: 16, width: 24 }}>{item.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#8E8E93', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 }}>{item.label}</Text>
                        <Text style={{ color: '#EBEBF5', fontSize: 13, lineHeight: 18, marginTop: 2 }}>{item.text}</Text>
                      </View>
                    </View>
                  ))}
                  <View style={{ backgroundColor: 'rgba(232,113,26,0.08)', borderRadius: 10, padding: 10, marginTop: 4 }}>
                    <Text style={{ color: '#E8711A', fontSize: 12, fontStyle: 'italic', textAlign: 'center' }}>"{briefing.motivationalQuote}"</Text>
                  </View>
                </View>
              </View>
            )}
          </PressableScale>
        )}

        {/* Team Presence */}
        <TeamPresence />

        {/* Time Tracker */}
        <TimeTracker onTotalChange={refreshTodayHours} />

        {/* Today's Schedule */}
        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
          <Reanimated.View
            entering={FadeInDown.delay(50).duration(300).springify()}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}
          >
            <Text style={{ fontSize: 15, color: '#8E8E93', fontWeight: '600' }}>{t('home.todaysSchedule')}</Text>
            <Text style={{ fontSize: 12, color: '#E8711A', fontWeight: '600' }}>
              {t('home.remaining', { count: todaySchedule.filter(b => b.status !== 'done').length })}
            </Text>
          </Reanimated.View>
          {todaySchedule.length === 0 ? (
            <View style={{ padding: 20, borderRadius: 14, backgroundColor: '#2C2C2E', borderWidth: 1, borderColor: '#3A3A3C', alignItems: 'center', gap: 8 }}>
              <Ionicons name="time-outline" size={24} color="#3A3A3C" />
              <Text style={{ color: '#64748B', fontSize: 13, textAlign: 'center' }}>No time entries today{'\n'}Start tracking a task to see your schedule</Text>
            </View>
          ) : (
            todaySchedule.map((block, index) => (
              <Reanimated.View key={block.id} entering={FadeInDown.delay(80 + index * 60).duration(350)}>
                <ScheduleTimeBlock block={block} />
              </Reanimated.View>
            ))
          )}
        </View>

        {/* Continue where you left off */}
        {activeSession && (
          <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 15, color: '#8E8E93', fontWeight: '600', marginBottom: 10 }}>
              {t('home.continueWhereLeftOff')}
            </Text>
            <PressableScale
              haptic="medium"
              accessibilityRole="button"
              accessibilityLabel={`Continue ${activeSession.taskTitle}`}
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
                  <Reanimated.View
                    style={[{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: '#E8711A',
                    }, xpBarStyle]}
                  />
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </PressableScale>
          </View>
        )}

        {/* Quick Actions */}
        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
          <Reanimated.Text
            entering={FadeInDown.delay(100).duration(300).springify()}
            style={{ fontSize: 15, color: '#8E8E93', fontWeight: '600', marginBottom: 12 }}
          >
            {t('home.quickActions')}
          </Reanimated.Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
            {QUICK_ACTIONS.map((action) => (
              <QuickActionButton key={action.id} action={action} />
            ))}
          </ScrollView>
        </View>

        {/* Recommended Tasks */}
        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
          <Reanimated.View
            entering={FadeInDown.delay(150).duration(300).springify()}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}
          >
            <Text style={{ fontSize: 15, color: '#8E8E93', fontWeight: '600' }}>
              {t('home.recommendedForYou')}
            </Text>
            <PressableScale haptic="light" accessibilityRole="button" accessibilityLabel="See all tasks" onPress={() => router.push('/(tabs)/library')}>
              <Text style={{ color: '#E8711A', fontSize: 13, fontWeight: '600' }}>{t('home.seeAll')}</Text>
            </PressableScale>
          </Reanimated.View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
            {recommendedTasks.slice(0, 5).map((task, index) => (
              <Reanimated.View
                key={task.id}
                entering={FadeInDown.delay(80 + index * 60).duration(350)}
              >
              <PressableScale
                haptic="light"
                accessibilityRole="button"
                accessibilityLabel={task.name ?? task.title}
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
              </PressableScale>
              </Reanimated.View>
            ))}
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
          <Reanimated.Text
            entering={FadeInDown.delay(200).duration(300).springify()}
            style={{ fontSize: 15, color: '#8E8E93', fontWeight: '600', marginBottom: 12 }}
          >
            {t('home.recentActivity')}
          </Reanimated.Text>
          <View style={{ gap: 8 }}>
            {recentActivity.slice(0, 5).map((activity, index) => {
              const taskName = activity.tasks?.name ?? 'Task Completed';
              const timeStr = activity.completed_at ? new Date(activity.completed_at).toLocaleDateString() : '';
              return (
                <Reanimated.View
                  key={activity.id}
                  entering={FadeInDown.delay(index * 70).duration(300)}
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
                </Reanimated.View>
              );
            })}
          </View>
        </View>

        {/* Upgrade Banner */}
        <View style={{ marginHorizontal: 20 }}>
          <PressableScale
            haptic="medium"
            accessibilityRole="button"
            accessibilityLabel="Upgrade to Pro"
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
          </PressableScale>
        </View>
      </ScrollView>

      {/* Voice Note FAB — always visible, prominent */}
      <PressableScale
        haptic="medium"
        accessibilityRole="button"
        accessibilityLabel="Record voice note"
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
      </PressableScale>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(t => ({ ...t, visible: false }))}
      />
    </SafeAreaView>
  );
}
