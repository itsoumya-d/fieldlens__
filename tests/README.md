# Offline queue regression tests

Run the focused suite with Node.js 24:

```sh
npm run test:offline
```

No dependency installation, provider credentials, Expo account, or network access
is needed for these tests. Node's built-in test runner strips the TypeScript types
from `lib/offlineQueue.ts`, the same storage-only implementation instantiated once
by `lib/offline.ts`. This is not a type check. A harmless module-type detection
warning can appear because the Expo app does not declare its package as ESM.

The fixture implements AsyncStorage's string read/write boundary with an in-memory
map. Each read parses persisted JSON; retry assertions cannot pass merely because
a mock retained a mutated object reference. Deferred promises control in-flight
writes and requests without wall-clock sleeps.

## What is covered

- Concurrent enqueues, removals, and clear/write ordering within one queue instance.
- Persisted retry increments for handlers returning false or throwing.
- Removal after a successful handler without losing newly enqueued work.
- One in-flight sync pass, shared by overlapping calls using its first handler.
- Repeated sync, offline startup, and queue changes made from inside handlers.
- Storage read/write failure recovery and preservation of malformed stored data.
- Interrupted local acknowledgement and retry after reconstructing the queue.

`getQueue`, read-dependent mutations, and synchronization reject on unreadable or
malformed stored data. Explicit `clearQueue` can discard even malformed data. They never interpret such data as an empty queue and then overwrite it.
A storage failure stops a sync pass before the next operation; its promise rejects.
The banner offers retry, shows remaining work instead of claiming everything is
saved, and `useAutoSync` exposes an additive `error` result.
A failed remote handler instead increments `failed`, persists that operation's
retry count, and continues to the next snapshot entry.

## Guarantees and limits

- Serialization and sync coalescing apply only to one factory instance. The app
  exports one shared instance per loaded JS runtime. Separate browser tabs,
  processes, JS runtimes, or independently created instances are not coordinated.
- A sync pass processes its initial snapshot. New work waits for a later pass.
  Entries removed before their turn are skipped. Clearing cannot cancel a remote
  request that has already started.
- Remote success and local removal are not one transaction. If the app or storage
  fails between them, a later pass may send the same operation again. The test for
  this window explicitly expects a repeated send. Exactly-once delivery requires
  a server-side idempotency contract; this change does not add one.
- These tests do not validate native AsyncStorage, browser multi-tab behavior,
  React hooks/banner rendering, Supabase policies, end-to-end reconnects, durable
  device writes, user/account queue isolation, or an Expo build.
- Existing Jest tests under `__tests__` are separate. This focused script does not
  run or replace them. No existing check or EAS workflow is changed.
