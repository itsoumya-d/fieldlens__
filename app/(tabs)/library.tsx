import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import PressableScale from '@/components/PressableScale';
import { useToast } from '@/lib/useToast';
import Toast from '@/components/Toast';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import EmptyState from '@/components/EmptyState';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth';
import {
  getGuides,
  searchGuides,
  getUserBookmarkedGuides,
  toggleGuideBookmark,
  type TaskGuideRow,
} from '@/lib/api';
import { supabase } from '@/lib/supabase';

type Filter = 'All' | 'Rough-In' | 'Install' | 'Repair' | 'Maintenance' | 'Emergency' | 'Code';

const FILTERS: Filter[] = ['All', 'Rough-In', 'Install', 'Repair', 'Maintenance', 'Emergency', 'Code'];

const FILTER_LABEL_KEYS: Record<Filter, string> = {
  'All': 'library.filterAll',
  'Rough-In': 'library.filterRoughIn',
  'Install': 'library.filterInstall',
  'Repair': 'library.filterRepair',
  'Maintenance': 'library.filterMaintenance',
  'Emergency': 'library.filterEmergency',
  'Code': 'library.filterCode',
};

const tradeIcons: Record<string, string> = {
  plumbing: 'water',
  electrical: 'flash',
  hvac: 'thermometer',
  carpentry: 'hammer',
  concrete: 'layers',
};

const difficultyColors = {
  beginner: { bg: 'rgba(45, 138, 78, 0.15)', text: '#2D8A4E' },
  intermediate: { bg: 'rgba(249, 168, 37, 0.15)', text: '#F9A825' },
  advanced: { bg: 'rgba(211, 47, 47, 0.15)', text: '#D32F2F' },
};

export default function LibraryScreen() {
  const { t } = useTranslation();
  const { toast, showToast, hideToast } = useToast();
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [guides, setGuides] = useState<TaskGuideRow[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [voiceRec, setVoiceRec] = useState<Audio.Recording | null>(null);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);

  const PAGE_SIZE = 20;

  const startVoiceSearch = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') { showToast('Microphone access needed for voice search.', 'error'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setVoiceRec(recording);
      setVoiceActive(true);
    } catch { showToast('Could not start voice search.', 'error'); }
  };

  const stopVoiceSearch = async () => {
    if (!voiceRec) return;
    setVoiceActive(false);
    setVoiceLoading(true);
    try {
      await voiceRec.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = voiceRec.getURI();
      setVoiceRec(null);
      if (!uri) { setVoiceLoading(false); return; }
      const resp = await fetch(uri);
      const blob = await resp.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1] ?? '');
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const { data, error } = await supabase.functions.invoke('transcribe-audio', { body: { audioBase64: base64, mimeType: 'audio/m4a' } });
      if (!error && data?.text) setSearch(data.text.trim());
    } catch { } finally { setVoiceLoading(false); }
  };

  const loadGuides = useCallback(async (category: Filter) => {
    setLoading(true);
    setPage(0);
    setHasMore(true);
    const { data } = await getGuides(category, undefined, 0, PAGE_SIZE - 1);
    const items = data ?? [];
    setGuides(items);
    setHasMore(items.length === PAGE_SIZE);
    setLoading(false);
  }, [PAGE_SIZE]);

  const loadMore = useCallback(async (category: Filter, currentPage: number, currentSearch: string) => {
    if (loadingMore) return;
    setLoadingMore(true);
    const nextPage = currentPage + 1;
    const from = nextPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data } = currentSearch.trim()
      ? await searchGuides(currentSearch.trim(), category, from, to)
      : await getGuides(category, undefined, from, to);
    const items = data ?? [];
    setGuides(prev => [...prev, ...items]);
    setPage(nextPage);
    setHasMore(items.length === PAGE_SIZE);
    setLoadingMore(false);
  }, [loadingMore, PAGE_SIZE]);

  const loadBookmarks = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await getUserBookmarkedGuides(user.id);
    if (data) setBookmarks(new Set(data.map((r) => r.guide_id)));
  }, [user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    await Promise.all([loadGuides(activeFilter), loadBookmarks()]);
    setRefreshing(false);
  }, [loadGuides, activeFilter, loadBookmarks]);

  useEffect(() => {
    loadGuides(activeFilter);
  }, [loadGuides, activeFilter]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  // Debounced search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (search.trim() === '') {
      loadGuides(activeFilter);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setLoading(true);
      setPage(0);
      setHasMore(true);
      const { data } = await searchGuides(search.trim(), activeFilter, 0, PAGE_SIZE - 1);
      const items = data ?? [];
      setGuides(items);
      setHasMore(items.length === PAGE_SIZE);
      setLoading(false);
    }, 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search, activeFilter, loadGuides, PAGE_SIZE]);

  const handleBookmark = async (guideId: string) => {
    if (!user?.id) return;
    const isBookmarked = bookmarks.has(guideId);
    // Optimistic update
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (isBookmarked) next.delete(guideId);
      else next.add(guideId);
      return next;
    });
    const { error } = await toggleGuideBookmark(user.id, guideId, isBookmarked);
    if (error) {
      // Rollback
      setBookmarks((prev) => {
        const next = new Set(prev);
        if (isBookmarked) next.add(guideId);
        else next.delete(guideId);
        return next;
      });
    }
  };

  const renderTask = ({ item: task, index }: { item: TaskGuideRow; index: number }) => {
    const diffStyle = difficultyColors[task.difficulty as keyof typeof difficultyColors] ?? difficultyColors.beginner;
    const isBookmarked = bookmarks.has(task.id);

    return (
      <Animated.View key={task.id} entering={FadeInDown.delay(index * 45).duration(260).springify()}>
      <PressableScale
        haptic="light"
        accessibilityRole="button"
        onPress={() => router.push(`/(tabs)/library/${task.id}` as any)}
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
          {task.is_premium && (
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
            <PressableScale
              haptic="light"
              accessibilityRole="button"
              onPress={() => handleBookmark(task.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={isBookmarked ? '#E8711A' : '#8E8E93'}
              />
            </PressableScale>
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
              <Text style={{ color: '#636366', fontSize: 12 }}>{task.estimated_minutes}m</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="list-outline" size={12} color="#636366" />
              <Text style={{ color: '#636366', fontSize: 12 }}>{task.step_count} {t('library.steps')}</Text>
            </View>
            {task.is_premium && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="lock-closed" size={12} color="#E8711A" />
                <Text style={{ color: '#E8711A', fontSize: 12, fontWeight: '600' }}>{t('library.pro')}</Text>
              </View>
            )}
          </View>
        </View>
      </PressableScale>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1C1C1E' }} edges={['top']}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(80).duration(500).springify()}>
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
              placeholder={voiceActive ? 'Listening...' : t('library.searchTasks')}
              placeholderTextColor="#636366"
              style={{ flex: 1, paddingVertical: 12, fontSize: 15, color: '#FFFFFF' }}
            />
            {search.length > 0 ? (
              <PressableScale haptic="light" accessibilityRole="button" onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="#8E8E93" />
              </PressableScale>
            ) : (
              <PressableScale
                haptic="light"
                accessibilityRole="button"
                onPress={voiceActive ? stopVoiceSearch : startVoiceSearch}
                disabled={voiceLoading}
              >
                {voiceLoading ? (
                  <ActivityIndicator size="small" color="#E8711A" />
                ) : (
                  <Ionicons name={voiceActive ? 'stop-circle' : 'mic-outline'} size={20} color={voiceActive ? '#EF4444' : '#E8711A'} />
                )}
              </PressableScale>
            )}
          </View>
        </View>
      </Animated.View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 48, marginBottom: 8 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: 'center' }}
      >
        {FILTERS.map((filter) => (
          <PressableScale
            haptic="light"
            accessibilityRole="button"
            key={filter}
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
              {t(FILTER_LABEL_KEYS[filter])}
            </Text>
          </PressableScale>
        ))}
      </ScrollView>

      {/* Results count */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        {loading ? (
          <ActivityIndicator size="small" color="#E8711A" />
        ) : (
          <Text style={{ color: '#636366', fontSize: 13 }}>
            {guides.length === 1
              ? t('library.taskCount', { count: guides.length })
              : t('library.tasksCount', { count: guides.length })}
            {activeFilter !== 'All' ? ` ${t('library.inCategory', { category: activeFilter })}` : ''}
          </Text>
        )}
      </View>

      {/* Task list */}
      {!loading && guides.length === 0 ? (
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
          data={guides}
          renderItem={renderTask}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8711A" colors={['#E8711A']} />}
          onEndReached={() => { if (hasMore && !loadingMore) loadMore(activeFilter, page, search); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator color="#E8711A" style={{ marginVertical: 16 }} /> : null}
        />
      )}
      <Toast {...toast} onHide={hideToast} />
    </SafeAreaView>
  );
}
