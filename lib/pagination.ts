import { supabase } from './supabase';

export interface CursorPage<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Cursor-based pagination for React Native / Supabase.
 * Uses created_at DESC as cursor — avoids OFFSET which scans full table.
 */
export async function fetchPage<T = Record<string, unknown>>(
  table: string,
  filters: Record<string, unknown>,
  cursor?: string,
  limit = 25
): Promise<CursorPage<T>> {
  let query = supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      query = query.eq(key, value as string);
    }
  }

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const items = (data ?? []) as T[];
  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;

  const lastItem = page[page.length - 1] as Record<string, unknown> | undefined;
  const nextCursor = hasMore && lastItem
    ? (lastItem.created_at as string)
    : null;

  return { data: page, nextCursor, hasMore };
}
