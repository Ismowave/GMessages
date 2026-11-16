export interface SmsMessage {
  id: string;
  text: string;
  direction?: 'incoming' | 'outgoing';
  status?: 'sent' | 'delivered' | 'read';
  readAt?: number;
  starred?: boolean;
  showTimestampBefore?: string;
  simLabel?: string;
  reaction?: string;
}

export interface SmsThread {
  id: string;
  recipientName: string;
  avatarColor: string;
  avatarType: 'initial' | 'person';
  canReply: boolean;
  isPinned?: boolean;
  unreadCount: number;
  timeLabel: string;
  isDraft?: boolean;
  draftText?: string;
  themeBubbleColor?: string;
  isArchived?: boolean;
  isBlocked?: boolean;
  participants?: string[];
  messages: SmsMessage[];
}

export interface ContactRecord {
  id: string;
  name: string;
  avatarColor: string;
  avatarType: 'initial' | 'person';
  canReply: boolean;
  updatedAt: number;
}

export interface AppPreferences {
  fontScale: number;
  longPressEnabled: boolean;
  lastSyncedAt?: number;
  userAvatar?: string;
}

export type SyncChangeType =
  | 'message:received'
  | 'message:sent'
  | 'message:read'
  | 'message:starred'
  | 'thread:created'
  | 'thread:renamed'
  | 'thread:updated'
  | 'thread:archived'
  | 'thread:deleted'
  | 'thread:blocked'
  | 'message:reacted'
  | 'message:deleted'
  | 'thread:read'
  | 'preferences:updated'
  | 'threads:reset';

export interface PendingSyncItem {
  id: string;
  type: SyncChangeType;
  threadId?: string;
  payload: Record<string, unknown>;
  createdAt: number;
}

const DB_NAME = 'gmessages_offline_db';
const DB_VERSION = 1;
const STORE_THREADS = 'threads';
const STORE_CONTACTS = 'contacts';
const STORE_PREFERENCES = 'preferences';
const STORE_SYNC_QUEUE = 'syncQueue';

export const LS_THREADS_KEY = 'gmessages_threads_offline_v4';
export const LS_LEGACY_THREADS_KEY = 'gmessages_threads_offline_v3';
export const LS_FONT_SCALE_KEY = 'gmessages_font_scale_v1';
export const LS_LONG_PRESS_KEY = 'gmessages_long_press_v1';
export const LS_SYNC_QUEUE_KEY = 'gmessages_pending_sync_v1';
export const LS_LAST_SYNC_KEY = 'gmessages_last_synced_v1';
export const LS_USER_AVATAR_KEY = 'gmessages_user_avatar_v1';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openOfflineDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_THREADS)) {
          db.createObjectStore(STORE_THREADS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_CONTACTS)) {
          db.createObjectStore(STORE_CONTACTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_PREFERENCES)) {
          db.createObjectStore(STORE_PREFERENCES, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
          db.createObjectStore(STORE_SYNC_QUEUE, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

export function mergeWithHomepageThreads(
  existing: SmsThread[] | null,
  fallbackThreads: SmsThread[],
): SmsThread[] {
  if (!existing || existing.length === 0) return fallbackThreads;
  // If an older pre-redesign cache only had thread-mpesa, merge the full homepage list
  // while keeping any custom edits/messages on thread-mpesa.
  if (existing.length === 1 && existing[0]?.id === 'thread-mpesa') {
    const existingMpesa = existing[0];
    return fallbackThreads.map((t) =>
      t.id === 'thread-mpesa'
        ? {
            ...t,
            recipientName: existingMpesa.recipientName || t.recipientName,
            messages:
              existingMpesa.messages && existingMpesa.messages.length > 0
                ? existingMpesa.messages
                : t.messages,
          }
        : t,
    );
  }
  return existing;
}

function readLocalStorageThreads(): SmsThread[] | null {
  try {
    const rawV4 = localStorage.getItem(LS_THREADS_KEY);
    if (rawV4) {
      const parsed = JSON.parse(rawV4) as SmsThread[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const rawLegacy = localStorage.getItem(LS_LEGACY_THREADS_KEY);
    if (rawLegacy) {
      const parsed = JSON.parse(rawLegacy) as SmsThread[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function readLocalStoragePreferences(): AppPreferences {
  let fontScale = 1;
  let longPressEnabled = true;
  let lastSyncedAt: number | undefined;
  let userAvatar: string | undefined;
  try {
    const savedScale = Number(localStorage.getItem(LS_FONT_SCALE_KEY));
    if (!Number.isNaN(savedScale) && savedScale >= 0.8 && savedScale <= 1.9) {
      fontScale = savedScale;
    }
    const savedLongPress = localStorage.getItem(LS_LONG_PRESS_KEY);
    if (savedLongPress === 'false') longPressEnabled = false;
    const savedSync = Number(localStorage.getItem(LS_LAST_SYNC_KEY));
    if (!Number.isNaN(savedSync) && savedSync > 0) lastSyncedAt = savedSync;
    const savedAvatar = localStorage.getItem(LS_USER_AVATAR_KEY);
    if (savedAvatar && savedAvatar.startsWith('data:image/')) {
      userAvatar = savedAvatar;
    }
  } catch {
    // Ignore
  }
  return { fontScale, longPressEnabled, lastSyncedAt, userAvatar };
}

function readLocalStorageQueue(): PendingSyncItem[] {
  try {
    const raw = localStorage.getItem(LS_SYNC_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingSyncItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalStorageQueue(items: PendingSyncItem[]) {
  try {
    localStorage.setItem(LS_SYNC_QUEUE_KEY, JSON.stringify(items));
  } catch {
    // Ignore quota errors
  }
}

function deriveContacts(threads: SmsThread[]): ContactRecord[] {
  const now = Date.now();
  return threads.map((t) => ({
    id: `contact-${t.id}`,
    name: t.recipientName,
    avatarColor: t.avatarColor,
    avatarType: t.avatarType,
    canReply: t.canReply,
    updatedAt: now,
  }));
}

async function getAllFromStore<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

export async function loadOfflineState(fallbackThreads: SmsThread[]): Promise<{
  threads: SmsThread[];
  preferences: AppPreferences;
  pendingCount: number;
}> {
  const lsThreads = mergeWithHomepageThreads(readLocalStorageThreads(), fallbackThreads);
  const lsPrefs = readLocalStoragePreferences();
  const lsQueue = readLocalStorageQueue();

  const db = await openOfflineDb();
  if (!db) {
    return {
      threads: lsThreads,
      preferences: lsPrefs,
      pendingCount: lsQueue.length,
    };
  }

  try {
    const [dbThreads, dbPrefsRows, dbQueue] = await Promise.all([
      getAllFromStore<SmsThread & { orderIndex?: number }>(db, STORE_THREADS),
      getAllFromStore<{ key: string; value: unknown }>(db, STORE_PREFERENCES),
      getAllFromStore<PendingSyncItem>(db, STORE_SYNC_QUEUE),
    ]);

    const rawDbThreads =
      dbThreads.length > 0
        ? [...dbThreads]
            .sort((a, b) => (a.orderIndex ?? 999) - (b.orderIndex ?? 999))
            .map(({ orderIndex: _ignored, ...rest }) => rest)
        : null;
    const sortedThreads = mergeWithHomepageThreads(
      rawDbThreads || lsThreads,
      fallbackThreads,
    );

    if (dbThreads.length === 0 || (rawDbThreads && rawDbThreads.length === 1 && sortedThreads.length > 1)) {
      await saveThreadsToDb(sortedThreads);
    }

    const prefMap = new Map(dbPrefsRows.map((row) => [row.key, row.value]));
    const preferences: AppPreferences = {
      fontScale:
        typeof prefMap.get('fontScale') === 'number'
          ? (prefMap.get('fontScale') as number)
          : lsPrefs.fontScale,
      longPressEnabled:
        typeof prefMap.get('longPressEnabled') === 'boolean'
          ? (prefMap.get('longPressEnabled') as boolean)
          : lsPrefs.longPressEnabled,
      lastSyncedAt:
        typeof prefMap.get('lastSyncedAt') === 'number'
          ? (prefMap.get('lastSyncedAt') as number)
          : lsPrefs.lastSyncedAt,
      userAvatar:
        typeof prefMap.get('userAvatar') === 'string'
          ? (prefMap.get('userAvatar') as string)
          : lsPrefs.userAvatar,
    };

    const mergedQueue = dbQueue.length > 0 ? dbQueue : lsQueue;
    return {
      threads: sortedThreads,
      preferences,
      pendingCount: mergedQueue.length,
    };
  } catch {
    return {
      threads: lsThreads || fallbackThreads,
      preferences: lsPrefs,
      pendingCount: lsQueue.length,
    };
  }
}

export async function saveThreadsToDb(threads: SmsThread[]): Promise<void> {
  try {
    localStorage.setItem(LS_THREADS_KEY, JSON.stringify(threads));
  } catch {
    // Ignore storage quota errors
  }

  const db = await openOfflineDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction([STORE_THREADS, STORE_CONTACTS], 'readwrite');
      const threadsStore = tx.objectStore(STORE_THREADS);
      const contactsStore = tx.objectStore(STORE_CONTACTS);

      threadsStore.clear();
      threads.forEach((thread, idx) => {
        threadsStore.put({ ...thread, orderIndex: idx });
      });

      contactsStore.clear();
      deriveContacts(threads).forEach((contact) => {
        contactsStore.put(contact);
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function savePreferencesToDb(
  prefs: Partial<AppPreferences>,
): Promise<void> {
  try {
    if (typeof prefs.fontScale === 'number') {
      localStorage.setItem(LS_FONT_SCALE_KEY, String(prefs.fontScale));
    }
    if (typeof prefs.longPressEnabled === 'boolean') {
      localStorage.setItem(LS_LONG_PRESS_KEY, String(prefs.longPressEnabled));
    }
    if (typeof prefs.lastSyncedAt === 'number') {
      localStorage.setItem(LS_LAST_SYNC_KEY, String(prefs.lastSyncedAt));
    }
    if (prefs.userAvatar !== undefined) {
      if (prefs.userAvatar) {
        localStorage.setItem(LS_USER_AVATAR_KEY, prefs.userAvatar);
      } else {
        localStorage.removeItem(LS_USER_AVATAR_KEY);
      }
    }
  } catch {
    // Ignore
  }

  const db = await openOfflineDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_PREFERENCES, 'readwrite');
      const store = tx.objectStore(STORE_PREFERENCES);
      if (typeof prefs.fontScale === 'number') {
        store.put({ key: 'fontScale', value: prefs.fontScale });
      }
      if (typeof prefs.longPressEnabled === 'boolean') {
        store.put({ key: 'longPressEnabled', value: prefs.longPressEnabled });
      }
      if (typeof prefs.lastSyncedAt === 'number') {
        store.put({ key: 'lastSyncedAt', value: prefs.lastSyncedAt });
      }
      if (prefs.userAvatar !== undefined) {
        if (prefs.userAvatar) {
          store.put({ key: 'userAvatar', value: prefs.userAvatar });
        } else {
          store.delete('userAvatar');
        }
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function getPendingSyncItems(): Promise<PendingSyncItem[]> {
  const db = await openOfflineDb();
  if (!db) return readLocalStorageQueue();
  const items = await getAllFromStore<PendingSyncItem>(db, STORE_SYNC_QUEUE);
  return items.length > 0 ? items : readLocalStorageQueue();
}

export async function enqueueSyncChange(
  type: SyncChangeType,
  payload: Record<string, unknown>,
  threadId?: string,
): Promise<number> {
  const item: PendingSyncItem = {
    id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    threadId,
    payload,
    createdAt: Date.now(),
  };

  const currentLs = readLocalStorageQueue();
  const nextLs = [...currentLs, item];
  writeLocalStorageQueue(nextLs);

  const db = await openOfflineDb();
  if (!db) return nextLs.length;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite');
      tx.objectStore(STORE_SYNC_QUEUE).put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });

  const all = await getPendingSyncItems();
  return all.length;
}

async function clearSyncedItems(ids: string[]): Promise<number> {
  const idSet = new Set(ids);
  const remainingLs = readLocalStorageQueue().filter((item) => !idSet.has(item.id));
  writeLocalStorageQueue(remainingLs);

  const db = await openOfflineDb();
  if (!db) return remainingLs.length;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORE_SYNC_QUEUE);
      ids.forEach((id) => store.delete(id));
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });

  const remaining = await getPendingSyncItems();
  return remaining.length;
}

export async function flushPendingSyncQueue(): Promise<{
  syncedCount: number;
  remainingCount: number;
  syncedAt?: number;
}> {
  const pending = await getPendingSyncItems();
  if (pending.length === 0) {
    return { syncedCount: 0, remainingCount: 0 };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { syncedCount: 0, remainingCount: pending.length };
  }

  // Android WebViewAssetLoader local mode has no backend origin; keep locally persisted
  if (
    typeof window !== 'undefined' &&
    window.location.hostname === 'appassets.androidplatform.net'
  ) {
    return { syncedCount: 0, remainingCount: pending.length };
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changes: pending }),
      signal: controller.signal,
    });

    if (response.ok) {
      const syncedAt = Date.now();
      const remainingCount = await clearSyncedItems(pending.map((p) => p.id));
      await savePreferencesToDb({ lastSyncedAt: syncedAt });
      return {
        syncedCount: pending.length,
        remainingCount,
        syncedAt,
      };
    }

    // If deployed statically without serverless /api/sync (404/405), reconcile locally
    if (response.status === 404 || response.status === 405) {
      const syncedAt = Date.now();
      const remainingCount = await clearSyncedItems(pending.map((p) => p.id));
      await savePreferencesToDb({ lastSyncedAt: syncedAt });
      return {
        syncedCount: pending.length,
        remainingCount,
        syncedAt,
      };
    }

    return { syncedCount: 0, remainingCount: pending.length };
  } catch {
    // Offline or transient network error — keep items queued safely
    return { syncedCount: 0, remainingCount: pending.length };
  } finally {
    window.clearTimeout(timeoutId);
  }
}
