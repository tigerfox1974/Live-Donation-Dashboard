/**
 * IndexedDB Wrapper for Offline Data Storage
 * 
 * Provides a simple Promise-based API for storing and retrieving data
 * with automatic serialization/deserialization.
 */

const DB_NAME = 'LiveDonationDashboard';
const DB_VERSION = 1;

// Store names
export const STORES = {
  EVENTS: 'events',
  ITEMS: 'items',
  PARTICIPANTS: 'participants',
  DONATIONS: 'donations',
  OFFLINE_QUEUE: 'offlineQueue',
  SYNC_META: 'syncMeta'
} as const;

type StoreName = typeof STORES[keyof typeof STORES];

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize and get the IndexedDB database instance
 */
export function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB open error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Events store - keyed by event ID
      if (!db.objectStoreNames.contains(STORES.EVENTS)) {
        db.createObjectStore(STORES.EVENTS, { keyPath: 'id' });
      }

      // Items store - keyed by item ID, indexed by eventId
      if (!db.objectStoreNames.contains(STORES.ITEMS)) {
        const itemsStore = db.createObjectStore(STORES.ITEMS, { keyPath: 'id' });
        itemsStore.createIndex('eventId', 'eventId', { unique: false });
      }

      // Participants store - keyed by participant ID, indexed by eventId
      if (!db.objectStoreNames.contains(STORES.PARTICIPANTS)) {
        const participantsStore = db.createObjectStore(STORES.PARTICIPANTS, { keyPath: 'id' });
        participantsStore.createIndex('eventId', 'eventId', { unique: false });
      }

      // Donations store - keyed by donation ID, indexed by eventId and itemId
      if (!db.objectStoreNames.contains(STORES.DONATIONS)) {
        const donationsStore = db.createObjectStore(STORES.DONATIONS, { keyPath: 'id' });
        donationsStore.createIndex('eventId', 'eventId', { unique: false });
        donationsStore.createIndex('itemId', 'item_id', { unique: false });
        donationsStore.createIndex('status', 'status', { unique: false });
      }

      // Offline queue store - for pending operations
      if (!db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
        const queueStore = db.createObjectStore(STORES.OFFLINE_QUEUE, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        queueStore.createIndex('status', 'status', { unique: false });
      }

      // Sync metadata store - for tracking sync state
      if (!db.objectStoreNames.contains(STORES.SYNC_META)) {
        db.createObjectStore(STORES.SYNC_META, { keyPath: 'id' });
      }
    };
  });

  return dbPromise;
}

/**
 * Generic put operation - add or update a record
 */
export async function put<T extends { id: string }>(
  storeName: StoreName,
  data: T
): Promise<T> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve(data);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic get operation - retrieve a record by key
 */
export async function get<T>(
  storeName: StoreName,
  key: string
): Promise<T | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all records from a store
 */
export async function getAll<T>(storeName: StoreName): Promise<T[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get records by index
 */
export async function getByIndex<T>(
  storeName: StoreName,
  indexName: string,
  value: IDBValidKey
): Promise<T[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a record by key
 */
export async function remove(
  storeName: StoreName,
  key: string | number
): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all records from a store
 */
export async function clear(storeName: StoreName): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Bulk put operation - add or update multiple records
 */
export async function bulkPut<T extends { id: string }>(
  storeName: StoreName,
  items: T[]
): Promise<void> {
  if (items.length === 0) return;
  
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);

    for (const item of items) {
      store.put(item);
    }
  });
}

/**
 * Delete multiple records by keys
 */
export async function bulkDelete(
  storeName: StoreName,
  keys: (string | number)[]
): Promise<void> {
  if (keys.length === 0) return;
  
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);

    for (const key of keys) {
      store.delete(key);
    }
  });
}

/**
 * Count records in a store
 */
export async function count(storeName: StoreName): Promise<number> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Check if IndexedDB is supported
 */
export function isIndexedDBSupported(): boolean {
  return typeof indexedDB !== 'undefined';
}

// ============ Sync Metadata Helpers ============

export interface SyncMetadata {
  id: string; // keyPath for IndexedDB
  lastSyncTimestamp: number;
  lastModifiedTimestamp: number;
  syncInProgress: boolean;
  pendingChanges: number;
}

export async function getSyncMeta(key: string): Promise<SyncMetadata | undefined> {
  return get<SyncMetadata>(STORES.SYNC_META, key);
}

export async function setSyncMeta(meta: SyncMetadata): Promise<SyncMetadata> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.SYNC_META, 'readwrite');
    const store = tx.objectStore(STORES.SYNC_META);
    const request = store.put(meta);
    
    request.onsuccess = () => resolve(meta);
    request.onerror = () => reject(request.error);
  });
}

// ============ Event-specific Helpers ============

export async function getEventItems<T>(eventId: string): Promise<T[]> {
  return getByIndex<T>(STORES.ITEMS, 'eventId', eventId);
}

export async function getEventParticipants<T>(eventId: string): Promise<T[]> {
  return getByIndex<T>(STORES.PARTICIPANTS, 'eventId', eventId);
}

export async function getEventDonations<T>(eventId: string): Promise<T[]> {
  return getByIndex<T>(STORES.DONATIONS, 'eventId', eventId);
}

// ============ Initialization ============

/**
 * Initialize IndexedDB - call this on app startup
 */
export async function initIndexedDB(): Promise<boolean> {
  if (!isIndexedDBSupported()) {
    console.warn('IndexedDB is not supported in this browser');
    return false;
  }

  try {
    await getDB();
    console.log('IndexedDB initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    return false;
  }
}
