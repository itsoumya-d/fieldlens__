import { createOfflineSyncHandler } from './offlineSync';
import { supabase } from './supabase';

// Both reconnect entry points import this same handler, so sync coalescing never
// chooses between different create/update/delete capabilities.
export const syncQueuedOperation = createOfflineSyncHandler(supabase);
