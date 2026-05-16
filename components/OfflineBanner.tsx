import { useEffect, useState, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus, getQueue, processQueue, QueuedOperation } from '@/lib/offline';
import { supabase } from '@/lib/supabase';

async function defaultSyncHandler(op: QueuedOperation): Promise<boolean> {
  try {
    if (op.type === 'create') {
      const { error } = await supabase.from(op.table).insert(op.payload);
      return !error;
    }
    if (op.type === 'update') {
      const { id, ...data } = op.payload;
      const { error } = await supabase.from(op.table).update(data).eq('id', id as string);
      return !error;
    }
    if (op.type === 'delete') {
      const { error } = await supabase.from(op.table).delete().eq('id', op.payload.id as string);
      return !error;
    }
    return false;
  } catch {
    return false;
  }
}

type SyncState = 'idle' | 'offline' | 'syncing' | 'synced' | 'failed';

const STATE_CONFIG: Record<Exclude<SyncState, 'idle'>, { bg: string; icon: string; color: string }> = {
  offline: { bg: '#1E293B', icon: 'cloud-offline-outline', color: '#94A3B8' },
  syncing: { bg: '#1E3A5F', icon: 'sync-outline', color: '#60A5FA' },
  synced:  { bg: '#14532D', icon: 'checkmark-circle-outline', color: '#4ADE80' },
  failed:  { bg: '#7F1D1D', icon: 'warning-outline', color: '#FCA5A5' },
};

export default function OfflineBanner() {
  const { isConnected } = useNetworkStatus();
  const [queueCount, setQueueCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const translateY = useSharedValue(-52);
  const wasOfflineRef = useRef(false);
  const autoHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    translateY.value = withSpring(0, { damping: 18, stiffness: 250 });
  };

  const hide = () => {
    translateY.value = withTiming(-52, { duration: 400 });
    setTimeout(() => setSyncState('idle'), 420);
  };

  const runSync = async () => {
    const q = await getQueue();
    if (q.length === 0) { hide(); return; }
    setSyncState('syncing');
    setQueueCount(q.length);
    const { synced, failed } = await processQueue(defaultSyncHandler);
    const remaining = await getQueue();
    setQueueCount(remaining.length);
    if (failed > 0) {
      setFailedCount(failed);
      setSyncState('failed');
    } else {
      setSyncState('synced');
      autoHideTimer.current = setTimeout(hide, 2200);
    }
  };

  // Poll queue count every 5s so the banner reflects changes
  useEffect(() => {
    const interval = setInterval(async () => {
      const q = await getQueue();
      setQueueCount(q.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoHideTimer.current) clearTimeout(autoHideTimer.current);

    if (!isConnected) {
      wasOfflineRef.current = true;
      setSyncState('offline');
      getQueue().then(q => setQueueCount(q.length));
      show();
      return;
    }

    if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      runSync();
    }
  }, [isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = () => {
    setFailedCount(0);
    runSync();
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (syncState === 'idle') return null;

  const cfg = STATE_CONFIG[syncState];
  const label =
    syncState === 'offline' ? (queueCount > 0 ? `Offline · ${queueCount} pending` : 'No connection') :
    syncState === 'syncing' ? `Syncing ${queueCount} change${queueCount !== 1 ? 's' : ''}…` :
    syncState === 'synced'  ? 'All changes saved' :
    `${failedCount} change${failedCount !== 1 ? 's' : ''} failed to sync`;

  return (
    <Animated.View style={[
      {
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 16, paddingVertical: 9, gap: 7,
        backgroundColor: cfg.bg,
      },
      animStyle,
    ]}>
      <Ionicons name={cfg.icon as any} size={15} color={cfg.color} />
      <Text style={{ color: cfg.color, fontWeight: '600', fontSize: 12 }}>{label}</Text>
      {syncState === 'failed' && (
        <Pressable
          onPress={handleRetry}
          style={{ marginLeft: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}
        >
          <Text style={{ color: '#FCA5A5', fontSize: 11, fontWeight: '700' }}>Retry</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}
