import { ScrollView, View, Text, TouchableOpacity, FlatList } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';

const QUICK_ACTIONS = [
  { id: 'camera', icon: 'camera', label: 'AI Camera', color: '#E8711A', route: '/(tabs)/camera' },
  { id: 'tasks', icon: 'library', label: 'Browse Tasks', color: '#1976D2', route: '/(tabs)/library' },
  { id: 'progress', icon: 'trending-up', label: 'My Progress', color: '#2D8A4E', route: '/(tabs)/progress' },
  { id: 'photos', icon: 'images', label: 'My Photos', color: '#9C27B0', route: '/(tabs)/settings' },
];

const RECOMMENDED_TASKS = [
  {
    id: '1',
    title: 'Install PVC Trap',
    category: 'Rough-In',
    difficulty: 'beginner',
    time: 25,
    steps: 8,
    trade: 'plumbing',
  },
  {
    id: '2',
    title: 'GFCI Outlet Install',
    category: 'Install',
    difficulty: 'intermediate',
    time: 35,
    steps: 12,
    trade: 'electrical',
  },
  {
    id: '3',
    title: 'Ductwork Connection',
    category: 'Install',
    difficulty: 'intermediate',
    time: 45,
    steps: 10,
    trade: 'hvac',
  },
];

const RECENT_ACTIVITY = [
  {
    id: '1',
    type: 'completed',
    title: 'Supply Line Installation',
    time: '2 hours ago',
    result: 'correct',
  },
  {
    id: '2',
    type: 'error_caught',
    title: 'AI caught: Insufficient slope',
    time: 'Yesterday',
    result: 'error',
  },
  {
    id: '3',
    type: 'completed',
    title: 'P-Trap Assembly',
    time: '2 days ago',
    result: 'correct',
  },
];

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

export default function HomeScreen() {
  const { user, trade } = useAuthStore();
  const { activeSession, analysisCount, dailyLimit } = useAppStore();

  const displayName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
  const greeting = getHoursGreeting();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1C1C1E' }} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 16,
          }}
        >
          <View>
            <Text style={{ fontSize: 22, color: '#FFFFFF', fontWeight: '800', letterSpacing: -0.5 }}>
              Field<Text style={{ color: '#E8711A' }}>Lens</Text>
            </Text>
          </View>
          <TouchableOpacity
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

        {/* Greeting + Stats */}
        <View
          style={{
            marginHorizontal: 20,
            backgroundColor: '#2C2C2E',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#3A3A3C',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View>
              <Text style={{ fontSize: 22, color: '#FFFFFF', fontWeight: '700' }}>
                {greeting}, {displayName}!
              </Text>
              {trade && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 6,
                  }}
                >
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
              <Text style={{ fontSize: 10, color: '#8E8E93', fontWeight: '600' }}>DAY STREAK</Text>
            </View>
          </View>

          {/* Daily stats row */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { label: 'Tasks Today', value: '2', icon: 'checkmark-circle', color: '#2D8A4E' },
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

        {/* Continue where you left off */}
        {activeSession && (
          <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 15, color: '#8E8E93', fontWeight: '600', marginBottom: 10 }}>
              CONTINUE WHERE YOU LEFT OFF
            </Text>
            <TouchableOpacity
              style={{
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
            QUICK ACTIONS
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                onPress={() => router.push(action.route as any)}
                style={{
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
              RECOMMENDED FOR YOU
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/library')}>
              <Text style={{ color: '#E8711A', fontSize: 13, fontWeight: '600' }}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
            {RECOMMENDED_TASKS.map((task) => (
              <TouchableOpacity
                key={task.id}
                onPress={() => router.push(`/(tabs)/library/${task.id}` as any)}
                style={{
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
                    {task.title}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <DifficultyBadge level={task.difficulty} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="time-outline" size={12} color="#8E8E93" />
                      <Text style={{ color: '#8E8E93', fontSize: 11 }}>{task.time}m</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                    <Ionicons name="list-outline" size={12} color="#8E8E93" />
                    <Text style={{ color: '#8E8E93', fontSize: 11 }}>{task.steps} steps</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 15, color: '#8E8E93', fontWeight: '600', marginBottom: 12 }}>
            RECENT ACTIVITY
          </Text>
          <View style={{ gap: 8 }}>
            {RECENT_ACTIVITY.map((activity) => (
              <View
                key={activity.id}
                style={{
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
                    backgroundColor: activity.result === 'correct' ? 'rgba(45, 138, 78, 0.15)' : 'rgba(211, 47, 47, 0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name={activity.result === 'correct' ? 'checkmark-circle' : 'alert-circle'}
                    size={20}
                    color={activity.result === 'correct' ? '#2D8A4E' : '#D32F2F'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>{activity.title}</Text>
                  <Text style={{ color: '#636366', fontSize: 12, marginTop: 2 }}>{activity.time}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#636366" />
              </View>
            ))}
          </View>
        </View>

        {/* Upgrade Banner */}
        <View style={{ marginHorizontal: 20 }}>
          <TouchableOpacity
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
                Upgrade to Pro
              </Text>
              <Text style={{ color: '#8E8E93', fontSize: 13, marginTop: 2 }}>
                Unlimited AI analyses + voice coaching
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#E8711A" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
