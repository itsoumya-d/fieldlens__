/** Storage-only queue core, shared by the app and dependency-free regression tests. */
export interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  payload: Record<string, unknown>;
  createdAt: string;
  retries: number;
}

export interface QueueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
  removeItem(key: string): Promise<unknown>;
}

type SyncResult = { synced: number; failed: number };
type SyncHandler = (op: QueuedOperation) => Promise<boolean>;
const QUEUE_KEY = '@offline_sync_queue';

function isQueuedOperation(value: unknown): value is QueuedOperation {
  if (typeof value !== 'object' || value === null) return false;
  const op = value as Record<string, unknown>;
  return typeof op.id === 'string'
    && (op.type === 'create' || op.type === 'update' || op.type === 'delete')
    && typeof op.table === 'string'
    && typeof op.payload === 'object' && op.payload !== null && !Array.isArray(op.payload)
    && typeof op.createdAt === 'string'
    && typeof op.retries === 'number' && Number.isInteger(op.retries) && op.retries >= 0;
}

/**
 * Use one instance per queue in a JS runtime (lib/offline.ts owns the app instance).
 * This is an in-memory lock, not cross-tab/process coordination. Remote delivery
 * can repeat after interruption; handlers still need server-side idempotency.
 */
export function createOfflineQueue(storage: QueueStorage, isOnline: () => Promise<boolean>) {
  let mutationTail: Promise<void> = Promise.resolve();
  let inFlightSync: Promise<SyncResult> | null = null;

  // Keep reads and whole read-modify-write operations ordered. A rejected operation
  // reaches its caller without poisoning the lock for subsequent operations.
  function withQueueLock<T>(action: () => Promise<T>): Promise<T> {
    const result = mutationTail.then(action);
    mutationTail = result.then(() => undefined, () => undefined);
    return result;
  }

  async function readQueue(): Promise<QueuedOperation[]> {
    const raw = await storage.getItem(QUEUE_KEY);
    if (raw === null) return [];
    const queue: unknown = JSON.parse(raw);
    if (!Array.isArray(queue) || !queue.every(isQueuedOperation)) {
      throw new Error('Invalid offline queue');
    }
    return queue;
  }

  function writeQueue(queue: QueuedOperation[]) {
    return storage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }

  /** Persist a new operation without overwriting other same-runtime mutations. */
  function enqueueOperation(
    type: QueuedOperation['type'],
    table: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    return withQueueLock(async () => {
      const queue = await readQueue();
      queue.push({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type,
        table,
        payload,
        createdAt: new Date().toISOString(),
        retries: 0,
      });
      await writeQueue(queue);
    });
  }

  /** Read pending operations. Storage/parse errors reject rather than imply empty. */
  function getQueue(): Promise<QueuedOperation[]> {
    return withQueueLock(readQueue);
  }

  function dequeueOperation(id: string): Promise<void> {
    return withQueueLock(async () => {
      const queue = await readQueue();
      await writeQueue(queue.filter((op) => op.id !== id));
    });
  }

  /** Explicitly discard pending operations; this cannot cancel a remote request. */
  function clearQueue(): Promise<void> {
    return withQueueLock(async () => { await storage.removeItem(QUEUE_KEY); });
  }

  async function runSync(syncHandler: SyncHandler): Promise<SyncResult> {
    if (!await isOnline()) return { synced: 0, failed: 0 };
    const snapshot = await getQueue();
    let synced = 0;
    let failed = 0;

    for (const { id } of snapshot) {
      // An earlier handler can remove/clear later entries while network I/O is
      // pending. Never send entries that have already been removed from storage.
      const op = await withQueueLock(async () => (await readQueue()).find((item) => item.id === id));
      if (!op) continue;

      let success = false;
      try {
        // Do not hold the storage lock over network I/O: handlers may enqueue.
        success = await syncHandler(op);
      } catch {
        // A thrown request failure is retryable, like a false handler result.
      }

      // Re-read under the lock so concurrent enqueues/removals survive. Persist
      // each result before continuing; storage failures stop the pass and reject.
      await withQueueLock(async () => {
        const queue = await readQueue();
        const current = queue.find((item) => item.id === id);
        if (!current) return; // Explicit removal/clear must not resurrect work.
        if (success) {
          await writeQueue(queue.filter((item) => item.id !== id));
        } else {
          current.retries++;
          await writeQueue(queue);
        }
      });
      if (success) synced++;
      else failed++;
    }
    return { synced, failed };
  }

  /**
   * Coalesce overlapping calls into one pass using the first caller's handler.
   * Operations added after its snapshot remain queued for the next pass.
   */
  function processQueue(syncHandler: SyncHandler): Promise<SyncResult> {
    if (inFlightSync) return inFlightSync;
    const result = runSync(syncHandler);
    inFlightSync = result;
    const release = () => { inFlightSync = null; };
    result.then(release, release);
    return result;
  }

  return { enqueueOperation, getQueue, dequeueOperation, clearQueue, processQueue };
}
