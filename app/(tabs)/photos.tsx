import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmptyState from '@/components/EmptyState';
import { SkeletonCard } from '@/components/SkeletonLoader';

const PHOTOS = [
  { id: '1', title: 'Foundation Inspection', date: 'Mar 5, 2026', tags: ['Foundation', 'Before'], thumbnail: null },
  { id: '2', title: 'Framing Progress', date: 'Mar 4, 2026', tags: ['Framing', 'Progress'], thumbnail: null },
  { id: '3', title: 'Electrical Rough-In', date: 'Mar 3, 2026', tags: ['Electrical'], thumbnail: null },
  { id: '4', title: 'Plumbing Install', date: 'Mar 2, 2026', tags: ['Plumbing', 'After'], thumbnail: null },
  { id: '5', title: 'Roof Truss Placement', date: 'Mar 1, 2026', tags: ['Roofing', 'Progress'], thumbnail: null },
  { id: '6', title: 'Site Overview', date: 'Feb 28, 2026', tags: ['Overview'], thumbnail: null },
];

export default function PhotosScreen() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [photos, setPhotos] = useState(PHOTOS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
        <ScrollView className="flex-1 px-4 pt-4">
          <View className="flex-row flex-wrap gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <View style={s.header}>
        <Text style={s.title}>Photo Docs</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity accessibilityRole="button" onPress={() => setView('grid')} style={[s.viewBtn, view === 'grid' && s.viewActive]}>
            <Ionicons name="grid" size={18} color={view === 'grid' ? '#FFFFFF' : '#94A3B8'} />
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => setView('list')} style={[s.viewBtn, view === 'list' && s.viewActive]}>
            <Ionicons name="list" size={18} color={view === 'list' ? '#FFFFFF' : '#94A3B8'} />
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={s.exportBtn}>
            <Ionicons name="share-outline" size={18} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>
      {photos.length === 0 ? (
        <EmptyState
          icon="camera-outline"
          title="No photos yet"
          description="Capture site photos to track progress"
        />
      ) : (
      <FlatList
      windowSize={5}
      initialNumToRender={10}
      maxToRenderPerBatch={5}
      removeClippedSubviews={true}
      data={photos}
        keyExtractor={i => i.id}
        numColumns={view === 'grid' ? 2 : 1}
        key={view}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        columnWrapperStyle={view === 'grid' ? { gap: 10 } : undefined}
        renderItem={({ item }) => view === 'grid' ? (
          <TouchableOpacity accessibilityRole="button" style={s.gridCard}>
            <View style={s.gridThumb}><Ionicons name="image" size={32} color="#334155" /></View>
            <Text style={s.gridTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={s.gridDate}>{item.date}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity accessibilityRole="button" style={s.listCard}>
            <View style={s.listThumb}><Ionicons name="image" size={24} color="#334155" /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.gridTitle}>{item.title}</Text>
              <Text style={s.gridDate}>{item.date}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                {item.tags.map(t => <View key={t} style={s.tag}><Text style={s.tagText}>{t}</Text></View>)}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  viewBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center' },
  viewActive: { backgroundColor: '#3B82F6' },
  exportBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#3B82F620', alignItems: 'center', justifyContent: 'center' },
  gridCard: { flex: 1, backgroundColor: '#1E293B', borderRadius: 12, overflow: 'hidden' },
  gridThumb: { height: 100, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
  gridTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', padding: 10, paddingBottom: 2 },
  gridDate: { color: '#94A3B8', fontSize: 12, paddingHorizontal: 10, paddingBottom: 10 },
  listCard: { flexDirection: 'row', backgroundColor: '#1E293B', borderRadius: 12, padding: 12, gap: 12, marginBottom: 2 },
  listThumb: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
  tag: { backgroundColor: '#3B82F620', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tagText: { color: '#3B82F6', fontSize: 11, fontWeight: '500' },
});
