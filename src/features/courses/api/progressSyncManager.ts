/**
 * Progress Sync Manager
 * Handles offline progress caching and synchronization
 * Uses IndexedDB for persistent local storage
 */

const DB_NAME = 'courseProgressDB';
const DB_VERSION = 1;
const STORE_NAME = 'progressQueue';

class ProgressSyncManager {
  constructor() {
    this.db = null;
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.listeners = new Set();
    
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Initialize database
    this.initDB();
  }

  // Initialize IndexedDB
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('📦 IndexedDB initialized for offline progress');
        resolve(this.db);
        
        // Sync any pending items if online
        if (this.isOnline) {
          this.syncPendingProgress();
        }
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
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
  async handleOnline() {
    this.isOnline = true;
    console.log('🌐 Back online - syncing progress...');
    this.notifyListeners({ type: 'online' });
    await this.syncPendingProgress();
  }

  // Handle going offline
  handleOffline() {
    this.isOnline = false;
    console.log('📴 Offline - progress will be cached locally');
    this.notifyListeners({ type: 'offline' });
  }

  // Add listener for sync events
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  notifyListeners(event) {
    this.listeners.forEach(callback => callback(event));
  }

  // Queue progress update for sync
  async queueProgress(type, data) {
    if (!this.db) await this.initDB();

    const item = {
      type,
      data,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(item);

      request.onsuccess = () => {
        console.log('📝 Progress queued:', type);
        resolve(request.result);
        
        // Try to sync immediately if online
        if (this.isOnline) {
          this.syncPendingProgress();
        }
      };

      request.onerror = () => {
        console.error('Failed to queue progress:', request.error);
        reject(request.error);
      };
    });
  }

  // Get all pending progress items
  async getPendingProgress() {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const pending = request.result.filter(item => !item.synced);
        resolve(pending);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Sync all pending progress to server
  async syncPendingProgress() {
    if (this.syncInProgress || !this.isOnline) return;
    
    this.syncInProgress = true;
    this.notifyListeners({ type: 'syncStart' });

    try {
      const pending = await this.getPendingProgress();
      
      if (pending.length === 0) {
        this.syncInProgress = false;
        return;
      }

      console.log(`🔄 Syncing ${pending.length} pending progress items...`);
      
      let synced = 0;
      let failed = 0;

      for (const item of pending) {
        try {
          await this.syncItem(item);
          await this.markSynced(item.id);
          synced++;
        } catch (error) {
          console.error('Failed to sync item:', error);
          await this.incrementRetry(item.id);
          failed++;
        }
      }

      console.log(`✅ Sync complete: ${synced} synced, ${failed} failed`);
      this.notifyListeners({ type: 'syncComplete', synced, failed });

      // Clean up old synced items
      await this.cleanupSyncedItems();

    } catch (error) {
      console.error('Sync error:', error);
      this.notifyListeners({ type: 'syncError', error });
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync individual item to server
  async syncItem(item) {
    const { courseProgressService } = await import('./courseProgressService');
    
    switch (item.type) {
      case 'videoPosition':
        return courseProgressService.saveVideoPosition(
          item.data.studentId,
          item.data.courseId,
          item.data.lessonId,
          item.data.position,
          item.data.duration
        );
      
      case 'lessonStatus':
        return courseProgressService.updateLessonStatus(
          item.data.studentId,
          item.data.courseId,
          item.data.lessonId,
          item.data.status
        );
      
      case 'timeSpent':
        return courseProgressService.saveTimeSpent(
          item.data.studentId,
          item.data.courseId,
          item.data.lessonId,
          item.data.seconds
        );
      
      case 'restorePoint':
        return courseProgressService.saveRestorePoint(
          item.data.studentId,
          item.data.courseId,
          item.data.moduleIndex,
          item.data.lessonIndex,
          item.data.lessonId,
          item.data.videoPosition
        );
      
      case 'quizAnswer':
        return courseProgressService.saveQuizAnswer(
          item.data.studentId,
          item.data.quizId,
          item.data.attemptNumber,
          item.data.questionId,
          item.data.answer
        );
      
      default:
        console.warn('Unknown progress type:', item.type);
        return Promise.resolve();
    }
  }

  // Mark item as synced
  async markSynced(id) {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const item = request.result;
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
  async incrementRetry(id) {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const item = request.result;
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
  async cleanupSyncedItems() {
    if (!this.db) return;

    const cutoff = Date.now() - (24 * 60 * 60 * 1000);

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.synced && cursor.value.syncedAt < cutoff) {
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
  async getSyncStatus() {
    const pending = await this.getPendingProgress();
    return {
      isOnline: this.isOnline,
      pendingCount: pending.length,
      syncInProgress: this.syncInProgress
    };
  }

  // Force sync now
  async forceSync() {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }
    return this.syncPendingProgress();
  }
}

// Singleton instance
export const progressSyncManager = new ProgressSyncManager();
export default progressSyncManager;
