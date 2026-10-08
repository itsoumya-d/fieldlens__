import type { QueuedOperation } from './offlineQueue';

type WriteResult = { error: unknown };
type FilteredWrite = { eq(column: string, value: string | number): PromiseLike<WriteResult> };

/** Only the write operations needed by the queue, compatible with Supabase. */
export interface QueueSyncClient {
  from(table: string): {
    insert(payload: Record<string, unknown>): PromiseLike<WriteResult>;
    update(payload: Record<string, unknown>): FilteredWrite;
    delete(): FilteredWrite;
  };
}

/**
 * Shared create/update/delete dispatch. The client reports request success via
 * `error`; affected-row verification and server idempotency are separate concerns.
 */
export function createOfflineSyncHandler(client: QueueSyncClient) {
  return async (op: QueuedOperation): Promise<boolean> => {
    try {
      if (op.type === 'create') {
        const { error } = await client.from(op.table).insert(op.payload);
        return !error;
      }
      if (op.type === 'update' || op.type === 'delete') {
        const { id, ...data } = op.payload;
        // Never issue a mutation without a usable row filter.
        if (!(typeof id === 'string' && id.length > 0)
          && !(typeof id === 'number' && Number.isFinite(id))) return false;
        const query = client.from(op.table);
        const write = op.type === 'update' ? query.update(data) : query.delete();
        const { error } = await write.eq('id', id);
        return !error;
      }
      return false;
    } catch {
      return false;
    }
  };
}
