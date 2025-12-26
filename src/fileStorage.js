// Cross-platform file storage service
// Uses File System Access API on desktop, IndexedDB on mobile

const FILE_HANDLE_KEY = 'harvard_goals_file_handle';
const FILE_PATH_KEY = 'harvard_goals_file_path';
const FILE_NAME = 'goals-blueprint.json';
const IDB_DB_NAME = 'harvard_goals_db';
const IDB_STORE_NAME = 'goals_data';

// Check if File System Access API is supported
function supportsFileSystemAccess() {
  return 'showSaveFilePicker' in window && 'showOpenFilePicker' in window;
}

// IndexedDB setup
function openIDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME);
      }
    };
  });
}

// Save to IndexedDB (mobile fallback)
async function saveToIDB(data) {
  try {
    const db = await openIDB();
    const transaction = db.transaction([IDB_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(IDB_STORE_NAME);
    await store.put(data, 'planner');
    return true;
  } catch (error) {
    console.error('Error saving to IndexedDB:', error);
    return false;
  }
}

// Load from IndexedDB (mobile fallback)
async function loadFromIDB() {
  try {
    const db = await openIDB();
    const transaction = db.transaction([IDB_STORE_NAME], 'readonly');
    const store = transaction.objectStore(IDB_STORE_NAME);
    return new Promise((resolve, reject) => {
      const request = store.get('planner');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error loading from IndexedDB:', error);
    return null;
  }
}

// Save file handle to localStorage (for persistence across sessions)
// Note: File handles can't be directly serialized, but we can use the File System Access API's
// permission persistence feature by storing a flag that we had a handle
function saveFileHandle(handle) {
  if (handle) {
    // Store that we have a handle (though we can't restore it directly)
    localStorage.setItem(FILE_HANDLE_KEY, 'has_handle');
    if (handle.name) {
      localStorage.setItem(FILE_PATH_KEY, handle.name);
    }
    // Try to persist the handle using the permission API
    if (handle.queryPermission) {
      handle.queryPermission({ mode: 'readwrite' }).then(permission => {
        if (permission === 'granted') {
          // Permission is granted, handle should persist
        }
      });
    }
  } else {
    localStorage.removeItem(FILE_HANDLE_KEY);
    localStorage.removeItem(FILE_PATH_KEY);
  }
}

// Get stored file path
function getStoredFilePath() {
  return localStorage.getItem(FILE_PATH_KEY) || null;
}

// Save using File System Access API
async function saveToFile(data, fileHandle = null) {
  try {
    // Always save to IndexedDB as backup/cache
    await saveToIDB(data);

    if (!supportsFileSystemAccess()) {
      // Mobile: only use IndexedDB
      return { success: true, method: 'indexeddb', path: 'Browser Storage (Mobile)' };
    }

    let handle = fileHandle;
    
    // If no handle provided, check if we should prompt
    if (!handle) {
      const handleData = localStorage.getItem(FILE_HANDLE_KEY);
      if (handleData !== 'has_handle') {
        // No handle stored, but don't prompt automatically - just use IndexedDB
        // User can manually choose location via "Change Location" button
        return { success: true, method: 'indexeddb', path: 'Browser Storage (Not set)' };
      }
      // We had a handle before, but can't restore it directly
      // Just use IndexedDB for now - user can reopen file manually
      return { success: true, method: 'indexeddb', path: getStoredFilePath() || 'Browser Storage' };
    }

    // We have a handle - write to file
    try {
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();

      const path = handle.name;
      saveFileHandle(handle);

      return { success: true, method: 'file', path, handle };
    } catch (error) {
      // Handle permission errors
      if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
        // Permission lost, fall back to IndexedDB
        return { success: true, method: 'indexeddb', path: getStoredFilePath() || 'Browser Storage' };
      }
      throw error;
    }
  } catch (error) {
    console.error('Error saving file:', error);
    // Fallback to IndexedDB
    await saveToIDB(data);
    return { success: true, method: 'indexeddb', path: 'Browser Storage (Error Fallback)' };
  }
}

// Load from file
async function loadFromFile(fileHandle = null) {
  try {
    if (!supportsFileSystemAccess()) {
      // Fallback to IndexedDB
      return await loadFromIDB();
    }

    let handle = fileHandle;

    // If no handle, prompt user to open file
    if (!handle) {
      try {
        const [selectedHandle] = await window.showOpenFilePicker({
          types: [{
            description: 'Goals Blueprint',
            accept: { 'application/json': ['.json'] }
          }]
        });
        handle = selectedHandle;
        saveFileHandle(handle);
      } catch (error) {
        if (error.name === 'AbortError') {
          // User cancelled
          return null;
        }
        // Fallback to IndexedDB
        return await loadFromIDB();
      }
    }

    // Read from file
    const file = await handle.getFile();
    const text = await file.text();
    const data = JSON.parse(text);
    
    saveFileHandle(handle);
    return data;
  } catch (error) {
    console.error('Error loading file:', error);
    // Fallback to IndexedDB
    return await loadFromIDB();
  }
}

// Change save location
async function changeSaveLocation(data) {
  try {
    if (!supportsFileSystemAccess()) {
      // On mobile, we can't change location, but we can clear and let user save again
      localStorage.removeItem(FILE_HANDLE_KEY);
      localStorage.removeItem(FILE_PATH_KEY);
      await saveToIDB(data);
      return { success: true, method: 'indexeddb', path: 'Browser Storage (Mobile)' };
    }

    // Prompt for new location
    const handle = await window.showSaveFilePicker({
      suggestedName: FILE_NAME,
      types: [{
        description: 'Goals Blueprint',
        accept: { 'application/json': ['.json'] }
      }]
    });

    // Write to the new file
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();

    // Also save to IndexedDB as backup
    await saveToIDB(data);

    // Update stored handle and path
    saveFileHandle(handle);
    const path = handle.name;

    return { success: true, method: 'file', path, handle };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { success: false, cancelled: true };
    }
    console.error('Error changing save location:', error);
    // Fallback to IndexedDB
    await saveToIDB(data);
    return { success: true, method: 'indexeddb', path: 'Browser Storage (Error Fallback)' };
  }
}

// Auto-save with debouncing
let saveTimeout = null;
let lastSavedData = null;

async function autoSave(data, onSaveComplete = null) {
  // Clear existing timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  // Debounce: wait 1 second after last change
  saveTimeout = setTimeout(async () => {
    try {
      // Only save if data actually changed
      const dataString = JSON.stringify(data);
      if (dataString === lastSavedData) {
        return;
      }

      const result = await saveToFile(data);
      lastSavedData = dataString;

      if (onSaveComplete) {
        onSaveComplete(result);
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      if (onSaveComplete) {
        onSaveComplete({ success: false, error: error.message });
      }
    }
  }, 1000);
}

// Initialize: try to load from file on startup
async function initialize() {
  try {
    // Always try IndexedDB first (it's the most reliable for auto-loading)
    const idbData = await loadFromIDB();
    if (idbData) {
      const path = getStoredFilePath() || 'Browser Storage';
      return { data: idbData, path, method: 'indexeddb' };
    }

    // If no IndexedDB data, check if we have a file path stored
    if (supportsFileSystemAccess()) {
      const storedPath = getStoredFilePath();
      if (storedPath) {
        // We have a path but no data - user will need to open the file
        return { data: null, path: storedPath, method: 'file', needsOpen: true };
      }
    }

    return { data: null, path: null, method: null };
  } catch (error) {
    console.error('Initialization error:', error);
    return { data: null, path: null, method: null };
  }
}

// Get current save path for display
function getCurrentSavePath() {
  if (supportsFileSystemAccess()) {
    const path = getStoredFilePath();
    if (path) {
      return path;
    }
  }
  return 'Browser Storage (Not set)';
}

// Check if file system is available
function isFileSystemAvailable() {
  return supportsFileSystemAccess();
}

export {
  saveToFile,
  loadFromFile,
  changeSaveLocation,
  autoSave,
  initialize,
  getCurrentSavePath,
  isFileSystemAvailable,
  supportsFileSystemAccess,
  saveToIDB,
  saveFileHandle
};

