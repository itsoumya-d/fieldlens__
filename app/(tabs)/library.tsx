import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '@/components/EmptyState';
import { useTranslation } from 'react-i18next';

type Filter = 'All' | 'Rough-In' | 'Install' | 'Repair' | 'Maintenance' | 'Emergency' | 'Code';

const FILTERS: Filter[] = ['All', 'Rough-In', 'Install', 'Repair', 'Maintenance', 'Emergency', 'Code'];

const TASK_GUIDES = [
  {
    id: '1',
    title: 'Install PVC P-Trap',
    category: 'Install',
    trade: 'plumbing',
    difficulty: 'beginner',
    estimatedMinutes: 25,
    stepCount: 8,
    isPremium: false,
    description: 'Step-by-step guide for installing a standard 1-1/2" PVC P-trap under a sink.',
  },
  {
    id: '2',
    title: 'GFCI Outlet Replacement',
    category: 'Install',
    trade: 'electrical',
    difficulty: 'intermediate',
    estimatedMinutes: 35,
    stepCount: 12,
    isPremium: false,
    description: 'Replace a standard outlet with a GFCI outlet for bathroom or kitchen use.',
  },
  {
    id: '3',
    title: 'Rough-In Drain Stack',
    category: 'Rough-In',
    trade: 'plumbing',
    difficulty: 'advanced',
    estimatedMinutes: 90,
    stepCount: 18,
    isPremium: true,
    description: 'Complete rough-in installation for a 3" drain stack with venting.',
  },
  {
    id: '4',
    title: 'HVAC Ductwork Tie-In',
    category: 'Install',
    trade: 'hvac',
    difficulty: 'intermediate',
    estimatedMinutes: 45,
    stepCount: 10,
    isPremium: false,
    description: 'Connect new branch ductwork to an existing trunk line.',
  },
  {
    id: '5',
    title: 'Supply Line Installation',
    category: 'Rough-In',
    trade: 'plumbing',
    difficulty: 'beginner',
    estimatedMinutes: 20,
    stepCount: 7,
    isPremium: false,
    description: 'Install flexible braided supply lines for sink faucets and toilets.',
  },
  {
    id: '6',
    title: 'Breaker Panel Inspection',
    category: 'Maintenance',
    trade: 'electrical',
    difficulty: 'advanced',
    estimatedMinutes: 60,
    stepCount: 15,
    isPremium: true,
    description: 'Complete safety inspection checklist for residential breaker panels.',
  },
  {
    id: '7',
    title: 'Emergency Pipe Repair',
    category: 'Emergency',
    trade: 'plumbing',
    difficulty: 'intermediate',
    estimatedMinutes: 30,
    stepCount: 9,
    isPremium: false,
    description: 'Quick repair procedures for burst or leaking pipes.',
  },
  {
    id: '8',
    title: 'Thermostat Wiring',
    category: 'Install',
    trade: 'hvac',
    difficulty: 'beginner',
    estimatedMinutes: 25,
    stepCount: 8,
    isPremium: false,
    description: 'Wire a new programmable or smart thermostat to an HVAC system.',
  },
];

const tradeIcons: Record<string, string> = {
  plumbing: 'water',
  electrical: 'flash',
  hvac: 'thermometer',
};

const difficultyColors = {
  beginner: { bg: 'rgba(45, 138, 78, 0.15)', text: '#2D8A4E' },
  intermediate: { bg: 'rgba(249, 168, 37, 0.15)', text: '#F9A825' },
  advanced: { bg: 'rgba(211, 47, 47, 0.15)', text: '#D32F2F' },
};

export default function LibraryScreen() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  const toggleBookmark = (id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredTasks = TASK_GUIDES.filter((task) => {
    const matchesSearch =
      search === '' ||
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'All' || task.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const renderTask = ({ item: task }: { item: typeof TASK_GUIDES[0] }) => {
    const diffStyle = difficultyColors[task.difficulty as keyof typeof difficultyColors];
    const isBookmarked = bookmarks.has(task.id);

    return (
      <TouchableOpacity accessibilityRole="button"        onPress={() => router.push(`/(tabs)/library/${task.id}` as any)}
        style={{
          backgroundColor: '#2C2C2E',
          borderRadius: 16,
          marginBottom: 12,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: '#3A3A3C',
          flexDirection: 'row',
        }}
      >
        {/* Thumbnail */}
        <View
          style={{
            width: 90,
            backgroundColor: '#3A3A3C',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={(tradeIcons[task.trade] || 'construct') as any}
            size={36}
            color="rgba(232, 113, 26, 0.5)"
          />
          {task.isPremium && (
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: 'rgba(232, 113, 26, 0.9)',
                borderRadius: 4,
                paddingHorizontal: 5,
                paddingVertical: 2,
              }}
            >
              <Ionicons name="star" size={10} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={{ flex: 1, padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text
              style={{ flex: 1, fontSize: 15, color: '#FFFFFF', fontWeight: '700', marginRight: 8 }}
              numberOfLines={2}
            >
              {task.title}
            </Text>
            <TouchableOpacity accessibilityRole="button" onPress={() => toggleBookmark(task.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={isBookmarked ? '#E8711A' : '#8E8E93'}
              />
            </TouchableOpacity>
          </View>

          {/* Category + Difficulty row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <View
              style={{
                backgroundColor: 'rgba(58, 80, 107, 0.3)',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 9999,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#6A8CB0' }}>{task.category}</Text>
            </View>
            <View
              style={{ backgroundColor: diffStyle.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999 }}
            >
              <Text style={{ color: diffStyle.text, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' }}>
                {task.difficulty}
              </Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="time-outline" size={12} color="#636366" />
              <Text style={{ color: '#636366', fontSize: 12 }}>{task.estimatedMinutes}m</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="list-outline" size={12} color="#636366" />
              <Text style={{ color: '#636366', fontSize: 12 }}>{task.stepCount} {t('library.steps')}</Text>
            </View>
            {task.isPremium && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="lock-closed" size={12} color="#E8711A" />
                <Text style={{ color: '#E8711A', fontSize: 12, fontWeight: '600' }}>{t('library.pro')}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1C1C1E' }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
        <Text style={{ fontSize: 28, color: '#FFFFFF', fontWeight: '800', marginBottom: 16 }}>
          {t('library.title')}
        </Text>

        {/* Search bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#2C2C2E',
            borderRadius: 12,
            paddingHorizontal: 14,
            borderWidth: 1.5,
            borderColor: search ? '#E8711A' : '#3A3A3C',
            gap: 10,
          }}
        >
          <Ionicons name="search" size={18} color="#8E8E93" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('library.searchTasks')}
            placeholderTextColor="#636366"
            style={{ flex: 1, paddingVertical: 12, fontSize: 15, color: '#FFFFFF' }}
          />
          {search.length > 0 && (
            <TouchableOpacity accessibilityRole="button" onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 48, marginBottom: 8 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: 'center' }}
      >
        {FILTERS.map((filter) => (
          <TouchableOpacity accessibilityRole="button"            key={filter}
            onPress={() => setActiveFilter(filter)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 9999,
              backgroundColor: activeFilter === filter ? '#E8711A' : '#2C2C2E',
              borderWidth: 1,
              borderColor: activeFilter === filter ? '#E8711A' : '#3A3A3C',
            }}
          >
            <Text
              style={{
                color: activeFilter === filter ? '#FFFFFF' : '#8E8E93',
                fontSize: 13,
                fontWeight: '600',
              }}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results count */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <Text style={{ color: '#636366', fontSize: 13 }}>
          {filteredTasks.length === 1 ? t('library.taskCount', { count: filteredTasks.length }) : t('library.tasksCount', { count: filteredTasks.length })}
          {activeFilter !== 'All' ? ` ${t('library.inCategory', { category: activeFilter })}` : ''}
        </Text>
      </View>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon="list-outline"
          title={t('library.libraryEmpty')}
          description={t('library.completedTasksAppear')}
          actionLabel={t('library.clearFilters')}
          onAction={() => { setSearch(''); setActiveFilter('All'); }}
        />
      ) : (
        <FlatList
      windowSize={5}
      initialNumToRender={10}
      maxToRenderPerBatch={5}
      removeClippedSubviews={true}
      data={filteredTasks}
          renderItem={renderTask}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
