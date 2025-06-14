import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';

// Create the context
const OfflineContext = createContext();

// Database name and store name
const DB_NAME = 'smart_pension_offline_db';
const VERIFICATION_STORE = 'verification_queue';

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [db, setDb] = useState(null);

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = async () => {
      try {
        const request = indexedDB.open(DB_NAME, 1);
        
        request.onerror = (event) => {
          console.error('Error opening IndexedDB:', event.target.error);
          toast.error('Failed to initialize offline storage. Some features may not work offline.');
        };
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          // Create object store for verification queue if it doesn't exist
          if (!db.objectStoreNames.contains(VERIFICATION_STORE)) {
            const store = db.createObjectStore(VERIFICATION_STORE, { keyPath: 'id', autoIncrement: true });
            store.createIndex('status', 'status', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
        
        request.onsuccess = (event) => {
          setDb(event.target.result);
          console.log('IndexedDB initialized successfully');
          loadPendingVerifications(event.target.result);
        };
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
      }
    };
    
    initDB();
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.info('You are back online. Syncing pending verifications...');
      syncPendingVerifications();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline. Verifications will be queued and synced when you reconnect.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [db]);

  // Load pending verifications from IndexedDB
  const loadPendingVerifications = async (database) => {
    if (!database) return;
    
    try {
      const transaction = database.transaction(VERIFICATION_STORE, 'readonly');
      const store = transaction.objectStore(VERIFICATION_STORE);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const pendingItems = request.result.filter(item => item.status === 'pending');
        setPendingVerifications(pendingItems);
      };
      
      request.onerror = (event) => {
        console.error('Error loading pending verifications:', event.target.error);
      };
    } catch (error) {
      console.error('Failed to load pending verifications:', error);
    }
  };

  // Queue a verification for later sync
  const queueVerification = async (verificationData) => {
    if (!db) {
      toast.error('Offline storage is not available');
      return false;
    }
    
    try {
      const transaction = db.transaction(VERIFICATION_STORE, 'readwrite');
      const store = transaction.objectStore(VERIFICATION_STORE);
      
      const item = {
        ...verificationData,
        status: 'pending',
        timestamp: new Date().getTime(),
        attempts: 0
      };
      
      const request = store.add(item);
      
      request.onsuccess = () => {
        toast.success('Verification queued for later sync');
        loadPendingVerifications(db);
      };
      
      request.onerror = (event) => {
        console.error('Error queuing verification:', event.target.error);
        toast.error('Failed to queue verification');
      };
      
      return true;
    } catch (error) {
      console.error('Failed to queue verification:', error);
      toast.error('Failed to queue verification');
      return false;
    }
  };

  // Sync all pending verifications when online
  const syncPendingVerifications = async () => {
    if (!isOnline || !db || syncing || pendingVerifications.length === 0) return;
    
    setSyncing(true);
    
    try {
      toast.info(`Syncing ${pendingVerifications.length} pending verifications...`);
      
      // Process each pending verification
      for (const verification of pendingVerifications) {
        try {
          // Call API to sync verification
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/sync-verification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(verification),
            credentials: 'include'
          });
          
          if (response.ok) {
            // Update status to 'completed' in IndexedDB
            const transaction = db.transaction(VERIFICATION_STORE, 'readwrite');
            const store = transaction.objectStore(VERIFICATION_STORE);
            verification.status = 'completed';
            store.put(verification);
          } else {
            // Increment attempt count and update in IndexedDB
            const transaction = db.transaction(VERIFICATION_STORE, 'readwrite');
            const store = transaction.objectStore(VERIFICATION_STORE);
            verification.attempts = (verification.attempts || 0) + 1;
            
            // If too many attempts, mark as failed
            if (verification.attempts >= 3) {
              verification.status = 'failed';
            }
            
            store.put(verification);
          }
        } catch (error) {
          console.error(`Failed to sync verification ${verification.id}:`, error);
        }
      }
      
      // Reload pending verifications
      loadPendingVerifications(db);
      toast.success('Verification sync completed');
    } catch (error) {
      console.error('Failed to sync verifications:', error);
      toast.error('Failed to sync some verifications');
    } finally {
      setSyncing(false);
    }
  };

  // Clear completed or failed verifications
  const clearVerifications = async (status) => {
    if (!db) return false;
    
    try {
      const transaction = db.transaction(VERIFICATION_STORE, 'readwrite');
      const store = transaction.objectStore(VERIFICATION_STORE);
      const index = store.index('status');
      const request = index.openCursor(IDBKeyRange.only(status));
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        }
      };
      
      transaction.oncomplete = () => {
        toast.info(`Cleared ${status} verifications`);
        loadPendingVerifications(db);
      };
      
      return true;
    } catch (error) {
      console.error(`Failed to clear ${status} verifications:`, error);
      return false;
    }
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        pendingVerifications,
        syncing,
        queueVerification,
        syncPendingVerifications,
        clearVerifications
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

// Custom hook for using the context
export const useOffline = () => useContext(OfflineContext); 