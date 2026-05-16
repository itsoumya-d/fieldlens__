import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { SkeletonProfile } from '@/components/SkeletonLoader';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth';
import {
  getUserProgress,
  getWeeklyTimeEntries,
  getUserXP,
  getAllAchievements,
  getUserUnlockedAchievements,
  recordDailyActivity,
  type AchievementRow,
} from '@/lib/api';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface WeeklyBar {
  day: string;
  tasks: number;
  height: number;
}

interface RecentTask {
  id: string;
  title: string;
  completedAt: string;
  duration: string;
  aiChecks: number;
  errors: number;
  result: string;
}

interface UnlockedAchievementRow {
  achievement_key: string;
  unlocked_at: string;
}

interface ProgressEntryRow {
  id: string;
  task_id?: string | null;
  completed_at?: string | null;
  duration_minutes?: number | null;
  ai_checks?: number | null;
  errors?: number | null;
  result?: string | null;
  tasks?: { name?: string | null } | null;
}

const maxBarHeight = 120;

function WeeklyChart({ weeklyData }: { weeklyData: WeeklyBar[] }) {
  const barWidth = 28;
  const spacing = 16;
  const totalWidth = weeklyData.length * (barWidth + spacing);
  const chartHeight = 140;

  return (
    <Svg width={totalWidth} height={chartHeight}>
      {weeklyData.map((item, i) => {
        const x = i * (barWidth + spacing);
        const barHeight = item.height;
        const y = maxBarHeight - barHeight;
        const isToday = i === new Date().getDay();

        return (
          <React.Fragment key={item.day}>
            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight > 0 ? barHeight : 4}
              rx={6}
              fill={isToday ? '#E8711A' : barHeight > 0 ? '#3A506B' : '#3A3A3C'}
            />
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

// Level progress thresholds: XP needed = level^2 * 50
function xpForLevel(level: number) {
  return level * level * 50;
}

export default function ProgressScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<WeeklyBar[]>(
    DAY_LABELS.map((day) => ({ day, tasks: 0, height: 0 }))
  );
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [xpData, setXpData] = useState({ total_xp: 0, level: 1, streak_days: 0, longest_streak: 0 });
  const [achievements, setAchievements] = useState<(AchievementRow & { unlocked: boolean; unlocked_at?: string })[]>([]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    // Record today's activity (for streak tracking)
    recordDailyActivity(user.id).catch(() => {});

    Promise.all([
      getUserProgress(user.id),
      getWeeklyTimeEntries(user.id),
      getUserXP(user.id),
      getAllAchievements(),
      getUserUnlockedAchievements(user.id),
    ]).then(([progressRes, timeRes, xpRes, achRes, unlockedRes]) => {
      // XP / Streak
      if (xpRes.data) {
        setXpData({
          total_xp: xpRes.data.total_xp,
          level: xpRes.data.level,
          streak_days: xpRes.data.streak_days,
          longest_streak: xpRes.data.longest_streak,
        });
      }

      // Achievements
      const unlockedKeys = new Set((unlockedRes.data ?? []).map((u: UnlockedAchievementRow) => u.achievement_key));
      const unlockedAt: Record<string, string> = {};
      (unlockedRes.data ?? []).forEach((u: UnlockedAchievementRow) => { unlockedAt[u.achievement_key] = u.unlocked_at; });
      const mapped = (achRes.data ?? []).map((a: AchievementRow) => ({
        ...a,
        unlocked: unlockedKeys.has(a.key),
        unlocked_at: unlockedAt[a.key],
      }));
      // Show unlocked first, then locked
      mapped.sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0));
      setAchievements(mapped);

      // Recent tasks from progress entries
      if (progressRes.data) {
        const recentMapped: RecentTask[] = progressRes.data.slice(0, 4).map((entry: ProgressEntryRow) => ({
          id: entry.id,
          title: entry.tasks?.name ?? entry.task_id ?? 'Task',
          completedAt: entry.completed_at ? new Date(entry.completed_at).toLocaleDateString() : '',
          duration: entry.duration_minutes ? `${entry.duration_minutes} min` : '—',
          aiChecks: entry.ai_checks ?? 0,
          errors: entry.errors ?? 0,
          result: entry.result ?? 'correct',
        }));
        setRecentTasks(recentMapped);
      }

      // Weekly bar chart from time entries
      if (timeRes.data) {
        const counts: Record<number, number> = {};
        for (const entry of timeRes.data) {
          const dayIndex = new Date(entry.started_at).getDay();
          counts[dayIndex] = (counts[dayIndex] ?? 0) + 1;
        }
        const maxCount = Math.max(1, ...Object.values(counts));
        setWeeklyData(
          DAY_LABELS.map((day, i) => {
            const tasks = counts[i] ?? 0;
            return { day, tasks, height: Math.round((tasks / maxCount) * maxBarHeight) };
          })
        );
      }
    }).finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1C1C1E' }} edges={['top']}>
        <SkeletonProfile />
      </SafeAreaView>
    );
  }

  const currentLevel = xpData.level;
  const xpThisLevel = xpData.total_xp - xpForLevel(currentLevel - 1);
  const xpNeededForNext = xpForLevel(currentLevel) - xpForLevel(currentLevel - 1);
  const levelProgress = Math.min(1, xpThisLevel / xpNeededForNext);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1C1C1E' }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <Animated.View entering={FadeInDown.delay(80).duration(500).springify()}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 }}>
          <Text style={{ fontSize: 28, color: '#FFFFFF', fontWeight: '800' }}>{t('progress.title')}</Text>
        </View>

        {/* XP & Level card */}
        <View style={{ marginHorizontal: 20, marginBottom: 24 }}>
          <View style={{ backgroundColor: 'rgba(232, 113, 26, 0.08)', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: 'rgba(232, 113, 26, 0.3)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 11, color: '#8E8E93', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Level {currentLevel}
                </Text>
                <Text style={{ fontSize: 26, color: '#E8711A', fontWeight: '800' }}>{xpData.total_xp.toLocaleString()} XP</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: 'rgba(232, 113, 26, 0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: '#E8711A',
                  }}
                >
                  <Text style={{ fontSize: 22, fontWeight: '800', color: '#E8711A' }}>{currentLevel}</Text>
                </View>
              </View>
            </View>
            {/* Level progress bar */}
            <View style={{ height: 6, backgroundColor: '#3A3A3C', borderRadius: 3, marginBottom: 6 }}>
              <View style={{ height: 6, backgroundColor: '#E8711A', borderRadius: 3, width: `${levelProgress * 100}%` }} />
            </View>
            <Text style={{ color: '#636366', fontSize: 12 }}>
              {xpThisLevel} / {xpNeededForNext} XP to Level {currentLevel + 1}
            </Text>
          </View>
        </View>

        {/* Stats grid */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Streak */}
            <View
              style={{
                flex: 1,
                backgroundColor: xpData.streak_days >= 3 ? 'rgba(232, 113, 26, 0.08)' : '#2C2C2E',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: xpData.streak_days >= 3 ? 'rgba(232, 113, 26, 0.3)' : '#3A3A3C',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 11, color: '#8E8E93', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {t('progress.streak')}
                </Text>
                <Text style={{ fontSize: 18 }}>🔥</Text>
              </View>
              <Text style={{ fontSize: 36, color: xpData.streak_days >= 3 ? '#E8711A' : '#FFFFFF', fontWeight: '800' }}>
                {xpData.streak_days}
              </Text>
              <Text style={{ fontSize: 12, color: '#8E8E93', marginTop: 4, fontWeight: '600' }}>
                {t('progress.daysInRow')}
              </Text>
            </View>

            {/* Longest Streak */}
            <View style={{ flex: 1, backgroundColor: '#2C2C2E', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#3A3A3C' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 11, color: '#8E8E93', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Best Streak
                </Text>
                <Ionicons name="medal-outline" size={18} color="#F9A825" />
              </View>
              <Text style={{ fontSize: 36, color: '#FFFFFF', fontWeight: '800' }}>{xpData.longest_streak}</Text>
              <Text style={{ fontSize: 12, color: '#F9A825', marginTop: 4, fontWeight: '600' }}>days all-time</Text>
            </View>
          </View>
        </View>
        </Animated.View>

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
              <WeeklyChart weeklyData={weeklyData} />
            </ScrollView>
          </View>
        </View>

        {/* Recent Tasks */}
        {recentTasks.length > 0 && (
          <View style={{ marginHorizontal: 20, marginBottom: 24 }}>
            <Text style={{ fontSize: 17, color: '#FFFFFF', fontWeight: '700', marginBottom: 12 }}>
              {t('progress.recentTasks')}
            </Text>
            <View style={{ gap: 10 }}>
              {recentTasks.map((task, index) => (
                <Animated.View key={task.id} entering={FadeInDown.delay(200 + index * 60).duration(350).springify()}>
                <View
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
                      {task.aiChecks > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Ionicons name="camera-outline" size={11} color="#636366" />
                          <Text style={{ color: '#636366', fontSize: 11 }}>{t('progress.checks', { count: task.aiChecks })}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text style={{ color: '#636366', fontSize: 12 }}>{task.completedAt}</Text>
                </View>
                </Animated.View>
              ))}
            </View>
          </View>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <View style={{ marginHorizontal: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 17, color: '#FFFFFF', fontWeight: '700' }}>{t('progress.achievements')}</Text>
              <Text style={{ color: '#8E8E93', fontSize: 13 }}>
                {unlockedCount}/{achievements.length}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {achievements.map((achievement, index) => (
                <Animated.View key={achievement.key} entering={FadeInDown.delay(200 + index * 60).duration(350).springify()}>
                <View
                  style={{
                    backgroundColor: achievement.unlocked ? '#2C2C2E' : '#1C1C1E',
                    borderRadius: 14,
                    padding: 14,
                    alignItems: 'center',
                    width: '46%',
                    borderWidth: 1,
                    borderColor: achievement.unlocked ? '#3A3A3C' : '#2C2C2E',
                    opacity: achievement.unlocked ? 1 : 0.55,
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
                  {achievement.unlocked && (
                    <View style={{ marginTop: 8, backgroundColor: `${achievement.color}15`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ color: achievement.color, fontSize: 11, fontWeight: '700' }}>+{achievement.xp_reward} XP</Text>
                    </View>
                  )}
                </View>
                </Animated.View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
