/**
 * Sync Manager
 * 
 * Handles synchronization between local IndexedDB and the server/localStorage.
 * Implements conflict resolution and automatic sync when coming online.
 */

import {
  getPendingOperations,
  updateOperationStatus,
  dequeue,
  getQueueState,
  type QueuedOperation
} from './offlineQueue';
import {
  put as idbPut,
  bulkPut as idbBulkPut,
  getEventItems,
  getEventParticipants,
  getEventDonations,
  STORES,
  setSyncMeta,
  getSyncMeta
} from './indexedDB';
import { requestSync } from './serviceWorkerRegistration';

// ============ Types ============

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  isOnline: boolean;
  lastSyncTime: number | null;
  pendingOperations: number;
  failedOperations: number;
  error?: string;
}

export interface ConflictResolution {
  strategy: 'local-wins' | 'remote-wins' | 'merge' | 'manual';
  resolved: boolean;
  resolvedData?: unknown;
}

export interface SyncEventDetail {
  type: 'sync-start' | 'sync-complete' | 'sync-error' | 'online' | 'offline' | 'conflict';
  data?: unknown;
}

// ============ Sync Manager Class ============

class SyncManager {
  private state: SyncState = {
    status: 'idle',
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastSyncTime: null,
    pendingOperations: 0,
    failedOperations: 0
  };

  private listeners: Set<(state: SyncState) => void> = new Set();
  private syncInProgress = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private conflictResolver: ((conflict: ConflictInfo) => Promise<ConflictResolution>) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupEventListeners();
    }
  }

  // ============ Event Listeners ============

  private setupEventListeners(): void {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Listen for visibility changes to sync when tab becomes visible
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private handleOnline = async (): Promise<void> => {
    this.updateState({ isOnline: true, status: 'idle' });
    this.emit({ type: 'online' });
    
    // Trigger sync when coming online
    await this.sync();
  };

  private handleOffline = (): void => {
    this.updateState({ isOnline: false, status: 'offline' });
    this.emit({ type: 'offline' });
  };

  private handleVisibilityChange = async (): Promise<void> => {
    if (document.visibilityState === 'visible' && this.state.isOnline) {
      await this.sync();
    }
  };

  // ============ State Management ============

  private updateState(partial: Partial<SyncState>): void {
    this.state = { ...this.state, ...partial };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  private emit(event: SyncEventDetail): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sync-event', { detail: event }));
    }
  }

  // ============ Public API ============

  /**
   * Subscribe to sync state changes
   */
  subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state); // Immediate callback with current state
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    return { ...this.state };
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return this.state.isOnline;
  }

  /**
   * Set custom conflict resolver
   */
  setConflictResolver(resolver: (conflict: ConflictInfo) => Promise<ConflictResolution>): void {
    this.conflictResolver = resolver;
  }

  /**
   * Start automatic sync interval
   */
  startAutoSync(intervalMs: number = 30000): void {
    this.stopAutoSync();
    this.syncInterval = setInterval(() => {
      if (this.state.isOnline) {
        this.sync();
      }
    }, intervalMs);
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Trigger manual sync
   */
  async sync(): Promise<boolean> {
    if (this.syncInProgress || !this.state.isOnline) {
      return false;
    }

    this.syncInProgress = true;
    this.updateState({ status: 'syncing' });
    this.emit({ type: 'sync-start' });

    try {
      // Process pending operations
      await this.processPendingOperations();

      // Update sync metadata
      const queueState = await getQueueState();
      this.updateState({
        status: 'idle',
        lastSyncTime: Date.now(),
        pendingOperations: queueState.pendingCount,
        failedOperations: queueState.failedCount,
        error: undefined
      });

      this.emit({ type: 'sync-complete', data: { timestamp: Date.now() } });

      // Schedule background sync for retry resilience
      requestSync('sync-donations').catch(() => {
        // Background sync not supported or SW not active, ignore
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      this.updateState({
        status: 'error',
        error: errorMessage
      });
      this.emit({ type: 'sync-error', data: { error: errorMessage } });
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Force sync a specific event's data
   */
  async syncEvent(eventId: string): Promise<void> {
    // Get data from IndexedDB
    const items = await getEventItems(eventId);
    const participants = await getEventParticipants(eventId);
    const donations = await getEventDonations(eventId);

    // Update localStorage (or would update server in a real app)
    const itemsKey = `event_${eventId}_items`;
    const participantsKey = `event_${eventId}_participants`;
    const donationsKey = `event_${eventId}_donations`;

    if (items.length > 0) {
      localStorage.setItem(itemsKey, JSON.stringify(items));
    }
    if (participants.length > 0) {
      localStorage.setItem(participantsKey, JSON.stringify(participants));
    }
    if (donations.length > 0) {
      localStorage.setItem(donationsKey, JSON.stringify(donations));
    }

    // Update sync metadata
    await setSyncMeta({
      id: eventId,
      lastSyncTimestamp: Date.now(),
      lastModifiedTimestamp: Date.now(),
      syncInProgress: false,
      pendingChanges: 0
    });
  }

  // ============ Private Methods ============

  private async processPendingOperations(): Promise<void> {
    const operations = await getPendingOperations();

    for (const operation of operations) {
      if (!operation.id) continue;

      try {
        await updateOperationStatus(operation.id, 'processing');
        
        // Check for conflicts before processing
        const conflict = await this.detectConflict(operation);
        if (conflict) {
          const resolution = await this.resolveConflict(conflict);
          if (!resolution.resolved) {
            await updateOperationStatus(operation.id, 'failed', 'Conflict not resolved');
            continue;
          }
          // Apply resolution
          operation.payload = resolution.resolvedData as Record<string, unknown>;
        }

        // Process the operation
        await this.processOperation(operation);
        
        // Mark as completed and remove from queue
        await updateOperationStatus(operation.id, 'completed');
        await dequeue(operation.id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await updateOperationStatus(operation.id, 'failed', errorMessage);
        
        // If max retries reached, leave in failed state
        if (operation.retryCount >= operation.maxRetries) {
          console.error(`Operation ${operation.id} failed after ${operation.maxRetries} retries:`, errorMessage);
        }
      }
    }
  }

  private async processOperation(operation: QueuedOperation): Promise<void> {
    const { type, eventId, payload } = operation;

    switch (type) {
      case 'ADD_DONATION':
      case 'APPROVE_DONATION':
      case 'REJECT_DONATION':
        await this.syncDonation(eventId, payload);
        break;
        
      case 'ADD_PARTICIPANT':
      case 'UPDATE_PARTICIPANT':
      case 'DELETE_PARTICIPANT':
        await this.syncParticipant(eventId, payload, type);
        break;
        
      case 'ADD_ITEM':
      case 'UPDATE_ITEM':
      case 'DELETE_ITEM':
        await this.syncItem(eventId, payload, type);
        break;
        
      case 'REORDER_ITEMS':
        await this.syncItemOrder(eventId, payload);
        break;
    }
  }

  private async syncDonation(eventId: string, payload: Record<string, unknown>): Promise<void> {
    // Save to IndexedDB
    const donationWithEvent = { ...payload, eventId } as { id: string; eventId: string };
    await idbPut(STORES.DONATIONS, donationWithEvent);

    // Update localStorage
    const key = `event_${eventId}_donations`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const index = existing.findIndex((d: { id: string }) => d.id === payload.id);
    
    if (index >= 0) {
      existing[index] = payload;
    } else {
      existing.push(payload);
    }
    
    localStorage.setItem(key, JSON.stringify(existing));
  }

  private async syncParticipant(
    eventId: string, 
    payload: Record<string, unknown>,
    type: 'ADD_PARTICIPANT' | 'UPDATE_PARTICIPANT' | 'DELETE_PARTICIPANT'
  ): Promise<void> {
    const key = `event_${eventId}_participants`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');

    if (type === 'DELETE_PARTICIPANT') {
      const filtered = existing.filter((p: { id: string }) => p.id !== payload.id);
      localStorage.setItem(key, JSON.stringify(filtered));
    } else {
      const participantWithEvent = { ...payload, eventId } as { id: string; eventId: string };
      await idbPut(STORES.PARTICIPANTS, participantWithEvent);

      const index = existing.findIndex((p: { id: string }) => p.id === payload.id);
      if (index >= 0) {
        existing[index] = payload;
      } else {
        existing.push(payload);
      }
      localStorage.setItem(key, JSON.stringify(existing));
    }
  }

  private async syncItem(
    eventId: string,
    payload: Record<string, unknown>,
    type: 'ADD_ITEM' | 'UPDATE_ITEM' | 'DELETE_ITEM'
  ): Promise<void> {
    const key = `event_${eventId}_items`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');

    if (type === 'DELETE_ITEM') {
      const filtered = existing.filter((i: { id: string }) => i.id !== payload.id);
      localStorage.setItem(key, JSON.stringify(filtered));
    } else {
      const itemWithEvent = { ...payload, eventId } as { id: string; eventId: string };
      await idbPut(STORES.ITEMS, itemWithEvent);

      const index = existing.findIndex((i: { id: string }) => i.id === payload.id);
      if (index >= 0) {
        existing[index] = payload;
      } else {
        existing.push(payload);
      }
      localStorage.setItem(key, JSON.stringify(existing));
    }
  }

  private async syncItemOrder(eventId: string, payload: Record<string, unknown>): Promise<void> {
    const items = payload.items as Array<{ id: string; eventId?: string }>;
    if (!items) return;

    // Add eventId to each item and save to IndexedDB
    const itemsWithEvent = items.map(item => ({ ...item, eventId }));
    await idbBulkPut(STORES.ITEMS, itemsWithEvent as Array<{ id: string }>);

    // Update localStorage
    const key = `event_${eventId}_items`;
    localStorage.setItem(key, JSON.stringify(items));
  }

  // ============ Conflict Detection & Resolution ============

  private async detectConflict(operation: QueuedOperation): Promise<ConflictInfo | null> {
    // Get the last sync metadata for this event
    const syncMeta = await getSyncMeta(operation.eventId);
    
    if (!syncMeta) return null;

    // Check if the data was modified after our operation was created
    if (syncMeta.lastModifiedTimestamp > operation.timestamp) {
      // Potential conflict detected
      const remoteData = await this.getRemoteData(operation);
      
      return {
        operation,
        localData: operation.payload,
        remoteData,
        localTimestamp: operation.timestamp,
        remoteTimestamp: syncMeta.lastModifiedTimestamp
      };
    }

    return null;
  }

  private async getRemoteData(operation: QueuedOperation): Promise<unknown> {
    // In a real app, this would fetch from server
    // Here we use localStorage as "remote"
    const { type, eventId, payload } = operation;
    
    let key: string;
    switch (type) {
      case 'ADD_DONATION':
      case 'APPROVE_DONATION':
      case 'REJECT_DONATION':
        key = `event_${eventId}_donations`;
        break;
      case 'ADD_PARTICIPANT':
      case 'UPDATE_PARTICIPANT':
      case 'DELETE_PARTICIPANT':
        key = `event_${eventId}_participants`;
        break;
      default:
        key = `event_${eventId}_items`;
    }

    const allData = JSON.parse(localStorage.getItem(key) || '[]');
    return allData.find((item: { id: string }) => item.id === payload.id);
  }

  private async resolveConflict(conflict: ConflictInfo): Promise<ConflictResolution> {
    // If custom resolver is set, use it
    if (this.conflictResolver) {
      return this.conflictResolver(conflict);
    }

    // Default strategy: Last write wins (local wins since we're processing now)
    return {
      strategy: 'local-wins',
      resolved: true,
      resolvedData: conflict.localData
    };
  }

  // ============ Cleanup ============

  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    this.stopAutoSync();
    this.listeners.clear();
  }
}

// ============ Conflict Info Type ============

export interface ConflictInfo {
  operation: QueuedOperation;
  localData: unknown;
  remoteData: unknown;
  localTimestamp: number;
  remoteTimestamp: number;
}

// ============ Singleton Instance ============

export const syncManager = new SyncManager();

// ============ React Hook ============

import { useState, useEffect, useCallback } from 'react';

export function useSyncState(): SyncState & { sync: () => Promise<boolean> } {
  const [state, setState] = useState<SyncState>(syncManager.getState());

  useEffect(() => {
    return syncManager.subscribe(setState);
  }, []);

  const sync = useCallback(() => syncManager.sync(), []);

  return { ...state, sync };
}

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
