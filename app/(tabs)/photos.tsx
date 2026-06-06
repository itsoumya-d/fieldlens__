import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmptyState from '@/components/EmptyState';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase';
import { enqueueOperation } from '@/lib/offline';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import PressableScale from '@/components/PressableScale';

interface WorkPhoto {
  id: string;
  title: string;
  photo_url: string | null;
  trade: string;
  tags: string[];
  is_before: boolean | null;
  comparison_id: string | null;
  created_at: string;
}

interface PhotoComparison {
  id: string;
  title: string;
  trade: string;
  before_url: string | null;
  after_url: string | null;
  tags: string[];
  created_at: string;
}

type Tab = 'photos' | 'comparisons';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const TRADE_COLOR: Record<string, string> = {
  plumbing: '#1976D2',
  electrical: '#F9A825',
  hvac: '#2D8A4E',
  carpentry: '#795548',
  concrete: '#9E9E9E',
  general: '#E8711A',
};

export default function PhotosScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>('photos');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [photos, setPhotos] = useState<WorkPhoto[]>([]);
  const [comparisons, setComparisons] = useState<PhotoComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareModal, setCompareModal] = useState(false);
  const [pendingComparison, setPendingComparison] = useState<{ before?: WorkPhoto; after?: WorkPhoto }>({});
  const [selectedCompare, setSelectedCompare] = useState<PhotoComparison | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const [photosRes, comparisonsRes] = await Promise.all([
      supabase
        .from('work_photos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('photo_comparisons')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);
    setPhotos(photosRes.data ?? []);
    setComparisons(comparisonsRes.data ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const pickAndSavePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: false,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const uri = result.assets[0].uri;
    const payload = {
      user_id: user!.id,
      title: `Photo ${new Date().toLocaleTimeString()}`,
      photo_url: uri,
      trade: 'general',
      tags: [],
    };
    const { error } = await supabase.from('work_photos').insert(payload);
    if (error) await enqueueOperation('create', 'work_photos', payload);
    fetchData();
  };

  const startComparison = (photo: WorkPhoto, role: 'before' | 'after') => {
    setPendingComparison((p) => ({ ...p, [role]: photo }));
  };

  const createComparison = async () => {
    if (!pendingComparison.before && !pendingComparison.after) return;
    const payload = {
      user_id: user!.id,
      title: pendingComparison.before?.title ?? pendingComparison.after?.title ?? 'Comparison',
      trade: pendingComparison.before?.trade ?? 'general',
      before_url: pendingComparison.before?.photo_url ?? null,
      after_url: pendingComparison.after?.photo_url ?? null,
      tags: [...(pendingComparison.before?.tags ?? []), ...(pendingComparison.after?.tags ?? [])],
    };
    const { error } = await supabase.from('photo_comparisons').insert(payload);
    if (error) await enqueueOperation('create', 'photo_comparisons', payload);
    setCompareModal(false);
    setPendingComparison({});
    fetchData();
  };

  const renderPhoto = useCallback(({ item, index }: { item: WorkPhoto; index: number }) => {
    const color = TRADE_COLOR[item.trade] ?? '#E8711A';
    if (view === 'grid') {
      return (
        <Animated.View entering={FadeInDown.delay(80 + index * 60).duration(260).springify()}>
          <PressableScale
            haptic="light"
            style={s.gridCard}
            onLongPress={() => {
              Alert.alert('Add to Comparison', 'Select role for this photo', [
                { text: 'Use as Before', onPress: () => { startComparison(item, 'before'); setCompareModal(true); } },
                { text: 'Use as After', onPress: () => { startComparison(item, 'after'); setCompareModal(true); } },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
          >
            {item.photo_url ? (
              <Image source={{ uri: item.photo_url }} style={s.gridThumb} resizeMode="cover" />
            ) : (
              <View style={s.gridThumb}><Ionicons name="image" size={32} color="#3A3A3C" /></View>
            )}
            <View style={{ padding: 8 }}>
              <Text style={s.gridTitle} numberOfLines={1}>{item.title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                <Text style={{ color: '#636366', fontSize: 11 }}>{item.trade}</Text>
                {item.is_before !== null && (
                  <View style={{ backgroundColor: item.is_before ? 'rgba(25, 118, 210, 0.15)' : 'rgba(45, 138, 78, 0.15)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: item.is_before ? '#1976D2' : '#2D8A4E' }}>
                      {item.is_before ? 'BEFORE' : 'AFTER'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </PressableScale>
        </Animated.View>
      );
    }
    return (
      <Animated.View entering={FadeInDown.delay(80 + index * 60).duration(260).springify()}>
        <PressableScale haptic="light" style={s.listCard}>
          {item.photo_url ? (
            <Image source={{ uri: item.photo_url }} style={s.listThumb} resizeMode="cover" />
          ) : (
            <View style={s.listThumb}><Ionicons name="image" size={24} color="#3A3A3C" /></View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.gridTitle}>{item.title}</Text>
            <Text style={{ color: '#636366', fontSize: 12, marginTop: 2 }}>{formatDate(item.created_at)}</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
              <View style={{ backgroundColor: `${color}20`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ color, fontSize: 11, fontWeight: '600' }}>{item.trade}</Text>
              </View>
              {(item.tags ?? []).map((tag) => (
                <View key={tag} style={s.tag}><Text style={s.tagText}>{tag}</Text></View>
              ))}
            </View>
          </View>
        </PressableScale>
      </Animated.View>
    );
  }, [view, startComparison, setCompareModal]);

  const renderComparison = useCallback(({ item, index }: { item: PhotoComparison; index: number }) => (
    <Animated.View entering={FadeInDown.delay(80 + index * 60).duration(260).springify()}>
    <PressableScale
      haptic="light"
      style={{ backgroundColor: '#2C2C2E', borderRadius: 16, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#3A3A3C' }}
      onPress={() => setSelectedCompare(item)}
    >
      {/* Side by side thumbnails */}
      <View style={{ flexDirection: 'row', height: 140 }}>
        <View style={{ flex: 1, position: 'relative' }}>
          {item.before_url ? (
            <Image source={{ uri: item.before_url }} style={{ flex: 1 }} resizeMode="cover" />
          ) : (
            <View style={{ flex: 1, backgroundColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="image-outline" size={32} color="#3A3A3C" />
            </View>
          )}
          <View style={{ position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(25, 118, 210, 0.85)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>BEFORE</Text>
          </View>
        </View>
        <View style={{ width: 2, backgroundColor: '#1C1C1E' }} />
        <View style={{ flex: 1, position: 'relative' }}>
          {item.after_url ? (
            <Image source={{ uri: item.after_url }} style={{ flex: 1 }} resizeMode="cover" />
          ) : (
            <View style={{ flex: 1, backgroundColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="add-circle-outline" size={32} color="#3A3A3C" />
              <Text style={{ color: '#636366', fontSize: 11, marginTop: 4 }}>Add After</Text>
            </View>
          )}
          {item.after_url && (
            <View style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(45, 138, 78, 0.85)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>AFTER</Text>
            </View>
          )}
        </View>
      </View>
      <View style={{ padding: 14 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>{item.title}</Text>
        <Text style={{ color: '#636366', fontSize: 12, marginTop: 2 }}>{formatDate(item.created_at)}</Text>
      </View>
    </PressableScale>
    </Animated.View>
  ), [setSelectedCompare]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1C1C1E' }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFFFFF' }}>{t('photos.title')}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {tab === 'photos' && (
            <>
              <PressableScale haptic="light" onPress={() => setView('grid')} style={[s.viewBtn, view === 'grid' && s.viewActive]}>
                <Ionicons name="grid" size={18} color={view === 'grid' ? '#FFFFFF' : '#8E8E93'} />
              </PressableScale>
              <PressableScale haptic="light" onPress={() => setView('list')} style={[s.viewBtn, view === 'list' && s.viewActive]}>
                <Ionicons name="list" size={18} color={view === 'list' ? '#FFFFFF' : '#8E8E93'} />
              </PressableScale>
            </>
          )}
          <PressableScale haptic="medium" onPress={pickAndSavePhoto} style={s.addBtn}>
            <Ionicons name="add" size={20} color="#E8711A" />
          </PressableScale>
        </View>
      </View>

      {/* Tab switcher */}
      <View style={{ flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#2C2C2E', borderRadius: 12, padding: 4, marginBottom: 16 }}>
        {(['photos', 'comparisons'] as Tab[]).map((tabItem) => (
          <PressableScale
            key={tabItem}
            haptic="light"
            onPress={() => setTab(tabItem)}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: 10,
              alignItems: 'center',
              backgroundColor: tab === tabItem ? '#E8711A' : 'transparent',
            }}
          >
            <Text style={{ color: tab === tabItem ? '#FFFFFF' : '#8E8E93', fontSize: 14, fontWeight: '700', textTransform: 'capitalize' }}>
              {tabItem === 'comparisons' ? 'Before/After' : 'All Photos'}
            </Text>
          </PressableScale>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#E8711A" size="large" />
        </View>
      ) : tab === 'photos' ? (
        photos.length === 0 ? (
          <EmptyState
            icon="camera-outline"
            title={t('photos.noPhotos')}
            description={t('photos.captureProgress')}
            actionLabel="Add Photo"
            onAction={pickAndSavePhoto}
          />
        ) : (
          <FlatList
            data={photos}
            keyExtractor={(i) => i.id}
            numColumns={view === 'grid' ? 2 : 1}
            key={view}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 10 }}
            columnWrapperStyle={view === 'grid' ? { gap: 10 } : undefined}
            renderItem={renderPhoto}
            windowSize={5}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            removeClippedSubviews
          />
        )
      ) : (
        comparisons.length === 0 ? (
          <EmptyState
            icon="git-compare-outline"
            title="No Comparisons Yet"
            description="Long-press any photo and select Before or After to create a before/after comparison."
          />
        ) : (
          <FlatList
            data={comparisons}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
            renderItem={renderComparison}
          />
        )
      )}

      {/* Create Comparison Modal */}
      <Modal visible={compareModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#1C1C1E' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#3A3A3C' }}>
            <Text style={{ fontSize: 20, color: '#FFFFFF', fontWeight: '700' }}>Create Comparison</Text>
            <PressableScale haptic="light" onPress={() => { setCompareModal(false); setPendingComparison({}); }}>
              <Ionicons name="close" size={24} color="#8E8E93" />
            </PressableScale>
          </View>

          <View style={{ padding: 20, gap: 16 }}>
            {/* Before slot */}
            <View style={{ backgroundColor: '#2C2C2E', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: pendingComparison.before ? 'rgba(25, 118, 210, 0.5)' : '#3A3A3C' }}>
              <Text style={{ color: '#1976D2', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>BEFORE</Text>
              {pendingComparison.before ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name="checkmark-circle" size={28} color="#1976D2" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>{pendingComparison.before.title}</Text>
                    <Text style={{ color: '#636366', fontSize: 12 }}>{formatDate(pendingComparison.before.created_at)}</Text>
                  </View>
                  <PressableScale haptic="light" onPress={() => setPendingComparison((p) => ({ ...p, before: undefined }))}>
                    <Ionicons name="close-circle" size={20} color="#636366" />
                  </PressableScale>
                </View>
              ) : (
                <Text style={{ color: '#636366', fontSize: 14 }}>No "before" photo selected. Long-press a photo and choose "Use as Before".</Text>
              )}
            </View>

            {/* After slot */}
            <View style={{ backgroundColor: '#2C2C2E', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: pendingComparison.after ? 'rgba(45, 138, 78, 0.5)' : '#3A3A3C' }}>
              <Text style={{ color: '#2D8A4E', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>AFTER</Text>
              {pendingComparison.after ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name="checkmark-circle" size={28} color="#2D8A4E" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>{pendingComparison.after.title}</Text>
                    <Text style={{ color: '#636366', fontSize: 12 }}>{formatDate(pendingComparison.after.created_at)}</Text>
                  </View>
                  <PressableScale haptic="light" onPress={() => setPendingComparison((p) => ({ ...p, after: undefined }))}>
                    <Ionicons name="close-circle" size={20} color="#636366" />
                  </PressableScale>
                </View>
              ) : (
                <Text style={{ color: '#636366', fontSize: 14 }}>No "after" photo selected. Long-press a photo and choose "Use as After".</Text>
              )}
            </View>

            <PressableScale
              haptic="medium"
              onPress={createComparison}
              disabled={!pendingComparison.before && !pendingComparison.after}
              style={{
                backgroundColor: pendingComparison.before || pendingComparison.after ? '#E8711A' : '#3A3A3C',
                borderRadius: 14,
                paddingVertical: 15,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Save Comparison</Text>
            </PressableScale>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  viewBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#2C2C2E', alignItems: 'center', justifyContent: 'center' },
  viewActive: { backgroundColor: '#E8711A' },
  addBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(232, 113, 26, 0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(232, 113, 26, 0.3)' },
  gridCard: { flex: 1, backgroundColor: '#2C2C2E', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#3A3A3C' },
  gridThumb: { height: 110, backgroundColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center' },
  gridTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  listCard: { flexDirection: 'row', backgroundColor: '#2C2C2E', borderRadius: 14, padding: 12, gap: 12, marginBottom: 10, borderWidth: 1, borderColor: '#3A3A3C' },
  listThumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  tag: { backgroundColor: 'rgba(232, 113, 26, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tagText: { color: '#E8711A', fontSize: 11, fontWeight: '500' },
});
