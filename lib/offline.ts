import { useEffect, useState, useCallback, useRef } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createOfflineQueue, type QueuedOperation } from './offlineQueue';

export type { QueuedOperation } from './offlineQueue';

// ── Network status ────────────────────────────────────────────────
export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return (state.isConnected === true) && (state.isInternetReachable !== false);
}

/**
 * React hook for reactive network status.
 * Returns { isConnected, isInternetReachable, type }.
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState<{
    isConnected: boolean;
    isInternetReachable: boolean;
    type: string;
  }>({ isConnected: true, isInternetReachable: true, type: 'unknown' });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
      });
    });
    return () => unsubscribe();
  }, []);

  return status;
}

// ── Offline Queue ─────────────────────────────────────────────────
// All callers in this JS runtime share one mutation lock and one sync pass.
// AsyncStorage itself does not provide a cross-tab/process transaction here.
export const {
  enqueueOperation,
  getQueue,
  dequeueOperation,
  clearQueue,
  processQueue,
} = createOfflineQueue(AsyncStorage, isOnline);

// ── Local Cache ───────────────────────────────────────────────────
const CACHE_PREFIX = '@cache_';

/**
 * Cache data locally with optional TTL (in ms).
 * Use for caching API responses for offline access.
 */
export async function cacheData(
  key: string,
  data: unknown,
  ttlMs?: number
): Promise<void> {
  const entry = {
    data,
    timestamp: Date.now(),
    expiresAt: ttlMs ? Date.now() + ttlMs : null,
  };
  await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
}

/**
 * Retrieve cached data. Returns null if expired or not found.
 */
export async function getCachedData<T = unknown>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    return entry.data as T;
  } catch {
    return null;
  }
}

/** Remove a specific cache entry. */
export async function clearCachedData(key: string): Promise<void> {
  await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
}

// ── Hook: useOfflineFirst ──────────────────────────────────────────
/**
 * Hook for offline-first data fetching.
 * Returns cached data immediately, then fetches fresh data when online.
 */
export function useOfflineFirst<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000 // 5 minute default cache
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try cache first
      const cached = await getCachedData<T>(cacheKey);
      if (cached && mountedRef.current) {
        setData(cached);
        setIsStale(true);
        setLoading(false);
      }

      // Fetch fresh data if online
      const online = await isOnline();
      if (online) {
        const fresh = await fetcher();
        if (mountedRef.current) {
          setData(fresh);
          setIsStale(false);
          setLoading(false);
          await cacheData(cacheKey, fresh, ttlMs);
        }
      } else if (!cached) {
        // No cache and offline
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Fetch failed'));
        setLoading(false);
      }
    }
  }, [cacheKey, fetcher, ttlMs]);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  return { data, loading, error, isStale, refresh };
}

// ── Auto-sync on reconnect ────────────────────────────────────────
/**
 * Hook that triggers sync when device reconnects.
 * Pass your sync handler to process queued operations automatically.
 */
export function useAutoSync(
  syncHandler: (op: QueuedOperation) => Promise<boolean>
) {
  const { isConnected } = useNetworkStatus();
  const wasOfflineRef = useRef(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isConnected) {
      wasOfflineRef.current = true;
      return;
    }

    // Just came back online — process queue
    if (wasOfflineRef.current && isConnected) {
      wasOfflineRef.current = false;
      setSyncing(true);
      setError(null);
      processQueue(syncHandler)
        .then(() => {
          setLastSync(new Date());
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err : new Error('Offline sync failed'));
        })
        .finally(() => {
          setSyncing(false);
        });
    }
  }, [isConnected, syncHandler]);

  return { syncing, lastSync, error };
}
