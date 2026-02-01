/**
 * Offline Integration Helper
 * 
 * Provides utilities for integrating offline queue and sync
 * with the application's data mutation functions.
 */

import { enqueue, type OperationType, type QueuedOperation } from './offlineQueue';
import { syncManager } from './syncManager';
import { setSyncMeta, getSyncMeta, getDB } from './indexedDB';

// ============ Types ============

export interface OfflineOperationResult<T> {
  success: boolean;
  data?: T;
  queued: boolean;
  error?: string;
}

export interface OptimisticUpdateOptions<T> {
  operationType: OperationType;
  eventId: string;
  payload: Record<string, unknown>;
  previousState: T;
  optimisticUpdate: () => void;
  rollback: () => void;
}

// ============ Initialization ============

let isInitialized = false;

/**
 * Initialize IndexedDB and sync manager
 * Should be called once at app startup
 */
export async function initOfflineSystem(): Promise<void> {
  if (isInitialized) return;
  
  try {
    // Initialize IndexedDB by getting a connection
    await getDB();
    console.log('[Offline] IndexedDB initialized');
    
    // Start auto-sync if online
    if (navigator.onLine) {
      syncManager.startAutoSync(30000); // 30 seconds interval
    }
    
    // Listen for online/offline events to start/stop auto-sync
    window.addEventListener('online', () => {
      syncManager.startAutoSync(30000);
    });
    
    window.addEventListener('offline', () => {
      syncManager.stopAutoSync();
    });
    
    isInitialized = true;
    console.log('[Offline] Offline system initialized');
  } catch (error) {
    console.error('[Offline] Failed to initialize offline system:', error);
  }
}

// ============ Optimistic Update with Offline Queue ============

/**
 * Execute an operation with optimistic update and offline queue support
 * 
 * 1. Apply optimistic update immediately
 * 2. If offline, queue the operation
 * 3. If online, try to sync
 * 4. On failure, rollback using previousState
 */
export async function executeWithOfflineSupport<T>(
  options: OptimisticUpdateOptions<T>
): Promise<OfflineOperationResult<T>> {
  const { operationType, eventId, payload, previousState, optimisticUpdate, rollback } = options;
  
  // Apply optimistic update immediately
  optimisticUpdate();
  
  // Update sync metadata to track pending changes
  await updateSyncMetadata(eventId, 'pending');
  
  // If offline, queue the operation
  if (!navigator.onLine) {
    try {
      await enqueue(
        operationType,
        eventId,
        payload,
        previousState as Record<string, unknown>
      );
      console.log('[Offline] Operation queued:', operationType);
      return { success: true, queued: true };
    } catch (error) {
      console.error('[Offline] Failed to queue operation:', error);
      rollback();
      return { success: false, queued: false, error: 'Failed to queue operation' };
    }
  }
  
  // If online, still queue but trigger immediate sync
  try {
    const queuedOp = await enqueue(
      operationType,
      eventId,
      payload,
      previousState as Record<string, unknown>
    );
    
    // Trigger sync to process the queue
    await syncManager.sync();
    
    // Update sync metadata
    await updateSyncMetadata(eventId, 'synced');
    
    return { success: true, queued: false, data: queuedOp as unknown as T };
  } catch (error) {
    console.error('[Offline] Sync failed, operation queued:', error);
    return { success: true, queued: true };
  }
}

/**
 * Simple operation that just queues without optimistic update
 */
export async function queueOperation(
  operationType: OperationType,
  eventId: string,
  payload: Record<string, unknown>,
  previousState?: Record<string, unknown>
): Promise<QueuedOperation> {
  const operation = await enqueue(operationType, eventId, payload, previousState);
  
  // Update sync metadata
  await updateSyncMetadata(eventId, 'pending');
  
  // Trigger sync if online
  if (navigator.onLine) {
    syncManager.sync().catch(console.error);
  }
  
  return operation;
}

// ============ Sync Metadata Helpers ============

async function updateSyncMetadata(
  eventId: string,
  action: 'pending' | 'synced'
): Promise<void> {
  try {
    const existing = await getSyncMeta(eventId);
    const now = Date.now();
    
    if (action === 'pending') {
      await setSyncMeta({
        id: eventId,
        lastSyncTimestamp: existing?.lastSyncTimestamp || 0,
        lastModifiedTimestamp: now,
        syncInProgress: false,
        pendingChanges: (existing?.pendingChanges || 0) + 1
      });
    } else {
      await setSyncMeta({
        id: eventId,
        lastSyncTimestamp: now,
        lastModifiedTimestamp: existing?.lastModifiedTimestamp || now,
        syncInProgress: false,
        pendingChanges: 0
      });
    }
  } catch (error) {
    console.error('[Offline] Failed to update sync metadata:', error);
  }
}

/**
 * Mark sync as in progress for an event
 */
export async function markSyncInProgress(eventId: string): Promise<void> {
  try {
    const existing = await getSyncMeta(eventId);
    await setSyncMeta({
      id: eventId,
      lastSyncTimestamp: existing?.lastSyncTimestamp || 0,
      lastModifiedTimestamp: existing?.lastModifiedTimestamp || Date.now(),
      syncInProgress: true,
      pendingChanges: existing?.pendingChanges || 0
    });
  } catch (error) {
    console.error('[Offline] Failed to mark sync in progress:', error);
  }
}

/**
 * Mark sync as complete for an event
 */
export async function markSyncComplete(eventId: string): Promise<void> {
  try {
    const existing = await getSyncMeta(eventId);
    await setSyncMeta({
      id: eventId,
      lastSyncTimestamp: Date.now(),
      lastModifiedTimestamp: existing?.lastModifiedTimestamp || Date.now(),
      syncInProgress: false,
      pendingChanges: 0
    });
  } catch (error) {
    console.error('[Offline] Failed to mark sync complete:', error);
  }
}

// ============ Rollback Helpers ============

/**
 * Create a rollback function for array state updates
 */
export function createArrayRollback<T>(
  setState: React.Dispatch<React.SetStateAction<T[]>>,
  previousState: T[]
): () => void {
  return () => {
    setState(previousState);
  };
}

/**
 * Create a snapshot of current state for rollback
 */
export function createStateSnapshot<T>(state: T): T {
  return JSON.parse(JSON.stringify(state));
}

// ============ Re-exports ============

export { syncManager } from './syncManager';
export { enqueue, getPendingOperations, getQueueState } from './offlineQueue';
