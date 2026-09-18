/**
 * Progress Sync Manager
 * Handles offline progress caching and synchronization
 * Uses IndexedDB for persistent local storage
 */

import { getLogger } from '@/shared/config/logging';
import { courseProgressService } from './courseProgressService';

const DB_NAME = 'courseProgressDB';
const DB_VERSION = 1;
const STORE_NAME = 'progressQueue';
const logger = getLogger('progress-sync-manager');

export interface SyncItem {
  id?: number;
  type: 'videoPosition' | 'lessonStatus' | 'timeSpent' | 'restorePoint' | 'quizAnswer' | string;
  data: any;
  timestamp: number;
  synced: boolean;
  syncedAt?: number;
  retryCount: number;
  lastRetry?: number;
}

export type SyncEventType = 'online' | 'offline' | 'syncStart' | 'syncComplete' | 'syncError';

export interface SyncEvent {
  type: SyncEventType;
  synced?: number;
  failed?: number;
  error?: unknown;
}

export type SyncListener = (event: SyncEvent) => void;

export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  syncInProgress: boolean;
}

class ProgressSyncManager {
  private db: IDBDatabase | null = null;
  public isOnline: boolean;
  public syncInProgress: boolean = false;
  private listeners: Set<SyncListener> = new Set();

  constructor() {
    this.db = null;
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.syncInProgress = false;
    this.listeners = new Set();

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }

    // Initialize database
    if (typeof indexedDB !== 'undefined') {
      this.initDB();
    }
  }

  // Initialize IndexedDB
  async initDB(): Promise<IDBDatabase | null> {
    if (typeof indexedDB === 'undefined') {
      return null;
    }
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        logger.error('Failed to open IndexedDB', request.error instanceof Error ? request.error : new Error(String(request.error)));
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);

        // Sync any pending items if online
        if (this.isOnline) {
          void this.syncPendingProgress();
        }
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  // Handle coming online
  async handleOnline(): Promise<void> {
    this.isOnline = true;
    this.notifyListeners({ type: 'online' });
    await this.syncPendingProgress();
  }

  // Handle going offline
  handleOffline(): void {
    this.isOnline = false;
    this.notifyListeners({ type: 'offline' });
  }

  // Add listener for sync events
  addListener(callback: SyncListener): () => boolean {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  notifyListeners(event: SyncEvent): void {
    this.listeners.forEach(callback => callback(event));
  }

  // Queue progress update for sync
  async queueProgress(type: string, data: any): Promise<IDBValidKey | null> {
    if (!this.db) await this.initDB();
    if (!this.db) {
      logger.warn('Cannot queue progress: IndexedDB not available');
      return null;
    }

    const item: SyncItem = {
      type,
      data,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0
    };

    return new Promise<IDBValidKey>((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(item);

      request.onsuccess = () => {
        resolve(request.result);

        // Try to sync immediately if online
        if (this.isOnline) {
          void this.syncPendingProgress();
        }
      };

      request.onerror = () => {
        logger.error('Failed to queue progress', request.error instanceof Error ? request.error : new Error(String(request.error)));
        reject(request.error);
      };
    });
  }

  // Get all pending progress items
  async getPendingProgress(): Promise<SyncItem[]> {
    if (!this.db) await this.initDB();
    if (!this.db) return [];

    return new Promise<SyncItem[]>((resolve, reject) => {
      if (!this.db) {
        resolve([]);
        return;
      }
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = (request.result as SyncItem[]) || [];
        const pending = items.filter(item => !item.synced);
        resolve(pending);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Sync all pending progress to server
  async syncPendingProgress(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) return;

    this.syncInProgress = true;
    this.notifyListeners({ type: 'syncStart' });

    try {
      const pending = await this.getPendingProgress();

      if (pending.length === 0) {
        this.syncInProgress = false;
        return;
      }

      let synced = 0;
      let failed = 0;

      for (const item of pending) {
        try {
          await this.syncItem(item);
          if (item.id !== undefined) {
            await this.markSynced(item.id);
          }
          synced++;
        } catch (error) {
          logger.error('Failed to sync item', error instanceof Error ? error : new Error(String(error)));
          if (item.id !== undefined) {
            await this.incrementRetry(item.id);
          }
          failed++;
        }
      }

      this.notifyListeners({ type: 'syncComplete', synced, failed });

      // Clean up old synced items
      await this.cleanupSyncedItems();

    } catch (error) {
      logger.error('Sync error', error instanceof Error ? error : new Error(String(error)));
      this.notifyListeners({ type: 'syncError', error });
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync individual item to server
  async syncItem(item: SyncItem): Promise<any> {
    switch (item.type) {
      case 'videoPosition':
        return courseProgressService.saveVideoPosition(
          item.data.learnerId,
          item.data.courseId,
          item.data.lessonId,
          item.data.position,
          item.data.duration
        );

      case 'lessonStatus':
        return courseProgressService.updateLessonStatus(
          item.data.learnerId,
          item.data.courseId,
          item.data.lessonId,
          item.data.status
        );

      case 'timeSpent':
        return courseProgressService.saveTimeSpent(
          item.data.learnerId,
          item.data.courseId,
          item.data.lessonId,
          item.data.seconds
        );

      case 'restorePoint':
        return courseProgressService.saveRestorePoint(
          item.data.learnerId,
          item.data.courseId,
          item.data.moduleIndex,
          item.data.lessonIndex,
          item.data.lessonId,
          item.data.videoPosition
        );

      case 'quizAnswer':
        return courseProgressService.saveQuizAnswer(
          item.data.learnerId,
          item.data.quizId,
          item.data.attemptNumber,
          item.data.questionId,
          item.data.answer
        );

      default:
        return Promise.resolve();
    }
  }

  // Mark item as synced
  async markSynced(id: number | IDBValidKey): Promise<void> {
    if (!this.db) return;

    return new Promise<void>((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const item = request.result as SyncItem | undefined;
        if (item) {
          item.synced = true;
          item.syncedAt = Date.now();
          store.put(item);
        }
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Increment retry count for failed item
  async incrementRetry(id: number | IDBValidKey): Promise<void> {
    if (!this.db) return;

    return new Promise<void>((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const item = request.result as SyncItem | undefined;
        if (item) {
          item.retryCount = (item.retryCount || 0) + 1;
          item.lastRetry = Date.now();

          // Remove items that have failed too many times
          if (item.retryCount >= 5) {
            store.delete(id);
          } else {
            store.put(item);
          }
        }
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Clean up old synced items (older than 24 hours)
  async cleanupSyncedItems(): Promise<void> {
    if (!this.db) return;

    const cutoff = Date.now() - (24 * 60 * 60 * 1000);

    return new Promise<void>((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          const val = cursor.value as SyncItem;
          if (val.synced && val.syncedAt && val.syncedAt < cutoff) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Get sync status
  async getSyncStatus(): Promise<SyncStatus> {
    const pending = await this.getPendingProgress();
    return {
      isOnline: this.isOnline,
      pendingCount: pending.length,
      syncInProgress: this.syncInProgress
    };
  }

  // Force sync now
  async forceSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }
    return this.syncPendingProgress();
  }
}

// Singleton instance
export const progressSyncManager = new ProgressSyncManager();
export default progressSyncManager;

