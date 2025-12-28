// Unified single-file storage system
// Always saves to and loads from one file location

const FILE_HANDLE_KEY = 'harvard_goals_file_handle';
const FILE_PATH_KEY = 'harvard_goals_file_path';
const FILE_NAME_KEY = 'harvard_goals_file_name';
const FILE_FULL_PATH_KEY = 'harvard_goals_file_full_path';
const HAS_FILE_LOCATION_KEY = 'harvard_goals_has_file_location';
const SYNC_MODE_KEY = 'harvard_goals_sync_mode'; // 'AUTO_SYNC_SUPPORTED' or 'MANUAL_SYNC_REQUIRED'
const LAST_IMPORTED_FILE_NAME_KEY = 'harvard_goals_last_imported_file_name';
const LAST_IMPORTED_TIMESTAMP_KEY = 'harvard_goals_last_imported_timestamp';
const LAST_LOCAL_SAVE_AT_KEY = 'harvard_goals_last_local_save_at';
const LAST_MANUAL_EXPORT_AT_KEY = 'harvard_goals_last_manual_export_at';

// Store file handle reference (for desktop File System Access API)
let currentFileHandle = null;

// Check if File System Access API is supported
function supportsFileSystemAccess() {
  return 'showSaveFilePicker' in window && 'showOpenFilePicker' in window;
}

// Check if we can maintain persistent file handle (for auto-sync)
async function canMaintainPersistentFileHandle() {
  if (!supportsFileSystemAccess()) {
    return false;
  }
  
  // On mobile Safari, even if the API exists, we usually can't maintain persistent handles
  // Check if we're on mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    // On mobile, we can't reliably maintain persistent file handles
    return false;
  }
  
  // On desktop, if File System Access API is supported, we can try to maintain handles
  return true;
}

// Get current sync mode
function getSyncMode() {
  return localStorage.getItem(SYNC_MODE_KEY) || 'MANUAL_SYNC_REQUIRED';
}

// Set sync mode
function setSyncMode(mode) {
  if (mode === 'AUTO_SYNC_SUPPORTED' || mode === 'MANUAL_SYNC_REQUIRED') {
    localStorage.setItem(SYNC_MODE_KEY, mode);
  }
}

// Get last imported file name
function getLastImportedFileName() {
  return localStorage.getItem(LAST_IMPORTED_FILE_NAME_KEY) || null;
}

// Set last imported file info
function setLastImportedFileInfo(fileName) {
  if (fileName) {
    localStorage.setItem(LAST_IMPORTED_FILE_NAME_KEY, fileName);
    localStorage.setItem(LAST_IMPORTED_TIMESTAMP_KEY, Date.now().toString());
  }
}

// Get last local save timestamp
function getLastLocalSaveAt() {
  const timestamp = localStorage.getItem(LAST_LOCAL_SAVE_AT_KEY);
  return timestamp ? parseInt(timestamp, 10) : null;
}

// Set last local save timestamp
function setLastLocalSaveAt() {
  localStorage.setItem(LAST_LOCAL_SAVE_AT_KEY, Date.now().toString());
}

// Get last manual export timestamp
function getLastManualExportAt() {
  const timestamp = localStorage.getItem(LAST_MANUAL_EXPORT_AT_KEY);
  return timestamp ? parseInt(timestamp, 10) : null;
}

// Set last manual export timestamp
function setLastManualExportAt() {
  localStorage.setItem(LAST_MANUAL_EXPORT_AT_KEY, Date.now().toString());
}

// Check if there are unsaved changes (dirty)
function hasUnsavedChanges() {
  const lastLocalSave = getLastLocalSaveAt();
  const lastManualExport = getLastManualExportAt();
  
  if (!lastLocalSave) {
    return false; // No local saves yet
  }
  
  if (!lastManualExport) {
    return true; // Never exported, so there are unsaved changes
  }
  
  return lastLocalSave > lastManualExport;
}

// Check if we have a file location set
function hasFileLocation() {
  return localStorage.getItem(HAS_FILE_LOCATION_KEY) === 'true';
}

// Set that we have a file location
function setHasFileLocation(value) {
  if (value) {
    localStorage.setItem(HAS_FILE_LOCATION_KEY, 'true');
  } else {
    localStorage.removeItem(HAS_FILE_LOCATION_KEY);
  }
}

// Save file handle and path permanently
function saveFileLocation(handle, fullPath, fileName) {
  currentFileHandle = handle;
  
  if (handle && fullPath) {
    // Store file handle flag
    localStorage.setItem(FILE_HANDLE_KEY, 'has_handle');
    // Store full path
    localStorage.setItem(FILE_FULL_PATH_KEY, fullPath);
    // Store file name
    if (fileName) {
      localStorage.setItem(FILE_NAME_KEY, fileName);
    } else {
      // Extract filename from path
      const name = fullPath.split(/[/\\]/).pop() || 'goals-blueprint.json';
      localStorage.setItem(FILE_NAME_KEY, name);
    }
    // Store path (for backward compatibility)
    localStorage.setItem(FILE_PATH_KEY, fullPath);
    
    // Mark that we have a file location
    setHasFileLocation(true);
    
    // Request persistent permission
    if (handle.queryPermission) {
      handle.queryPermission({ mode: 'readwrite' }).then(permission => {
        if (permission === 'granted' && handle.requestPermission) {
          handle.requestPermission({ mode: 'readwrite' });
        }
      });
    }
  }
}

// Get stored file path
function getStoredFilePath() {
  return localStorage.getItem(FILE_FULL_PATH_KEY) || localStorage.getItem(FILE_PATH_KEY) || null;
}

// Get stored file name
function getStoredFileName() {
  return localStorage.getItem(FILE_NAME_KEY) || null;
}

// Get current file handle
function getCurrentFileHandle() {
  return currentFileHandle;
}

// Get current save path for display (full path with filename)
function getCurrentSavePath() {
  const fullPath = getStoredFilePath();
  if (fullPath) {
    return fullPath;
  }
  return null; // No file location set yet
}

// Clear file location (when user wants to change it)
function clearFileLocation() {
  currentFileHandle = null;
  localStorage.removeItem(FILE_HANDLE_KEY);
  localStorage.removeItem(FILE_PATH_KEY);
  localStorage.removeItem(FILE_NAME_KEY);
  localStorage.removeItem(FILE_FULL_PATH_KEY);
  setHasFileLocation(false);
}

// Try to restore file handle on desktop
async function tryRestoreFileHandle() {
  if (!supportsFileSystemAccess()) {
    return null;
  }
  
  const hasHandle = localStorage.getItem(FILE_HANDLE_KEY) === 'has_handle';
  const storedPath = getStoredFilePath();
  
  if (hasHandle && storedPath) {
    // We had a handle before, but can't restore it directly
    // The browser may remember permissions, but we need to prompt user to reopen
    return null;
  }
  
  return null;
}

// Prompt user to choose file location and name (first time setup)
async function chooseFileLocation(data = null) {
  try {
    if (!supportsFileSystemAccess()) {
      // Mobile: Use file input to let user select a file
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';
        document.body.appendChild(input);
        
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (file) {
            // Read the file
            const text = await file.text();
            const fileData = JSON.parse(text);
            
            // Store file name (we can't store full path on mobile)
            const fileName = file.name || 'goals-blueprint.json';
            localStorage.setItem(FILE_NAME_KEY, fileName);
            localStorage.setItem(FILE_PATH_KEY, fileName);
            localStorage.setItem(FILE_FULL_PATH_KEY, fileName);
            localStorage.setItem(FILE_HANDLE_KEY, 'has_path');
            setHasFileLocation(true);
            
            document.body.removeChild(input);
            
            // If we have data to save, save it
            if (data) {
              // On mobile, we can't write back to the file, so we'll use IndexedDB
              await saveToIDB(data);
            }
            
            resolve({ 
              success: true, 
              data: fileData,
              path: fileName,
              method: 'mobile',
              needsReopen: true // Mobile needs to reopen file each time
            });
          } else {
            document.body.removeChild(input);
            resolve({ success: false, cancelled: true });
          }
        };
        
        input.oncancel = () => {
          document.body.removeChild(input);
          resolve({ success: false, cancelled: true });
        };
        
        input.click();
      });
    }

    // Desktop: Use File System Access API
    const handle = await window.showSaveFilePicker({
      suggestedName: 'goals-blueprint.json',
      types: [{
        description: 'Goals Blueprint',
        accept: { 'application/json': ['.json'] }
      }]
    });

    // Get the file name
    const fileName = handle.name;
    
    // Try to get full path (may not be available in all browsers)
    let fullPath = fileName;
    try {
      const file = await handle.getFile();
      // On some browsers, we can get more path info
      if (file.webkitRelativePath) {
        fullPath = file.webkitRelativePath;
      }
    } catch (e) {
      // Use just the filename
      fullPath = fileName;
    }

    // Save the location
    saveFileLocation(handle, fullPath, fileName);

    // If we have data to save, write it
    if (data) {
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
    }

    return { 
      success: true, 
      handle,
      path: fullPath,
      fileName,
      method: 'file'
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { success: false, cancelled: true };
    }
    console.error('Error choosing file location:', error);
    return { success: false, error: error.message };
  }
}

// Save to the stored file location
async function saveToFile(data) {
  try {
    if (!hasFileLocation()) {
      return { 
        success: false, 
        error: 'No file location set. Please choose a file location first.',
        needsLocation: true
      };
    }

    // Try to get file handle
    let handle = getCurrentFileHandle();
    
    if (!supportsFileSystemAccess()) {
      // Mobile: We can't write directly to files
      // Save to IndexedDB (this is our source of truth on mobile)
      // The Save button will download the file with the stored filename
      await saveToIDB(data);
      const storedPath = getStoredFilePath();
      return { 
        success: true, 
        method: 'indexeddb', 
        path: storedPath || 'Mobile Storage',
        savedToIDB: true // Data saved to IndexedDB, Save button will download file
      };
    }

    // Desktop: Try to use stored file handle
    if (!handle) {
      // Try to restore handle
      handle = await tryRestoreFileHandle();
    }
    
    if (!handle) {
      // Handle was lost (page reload, browser restart, etc.)
      // Silently save to IndexedDB - this provides seamless experience
      // On next save, we'll try to restore the handle automatically
      await saveToIDB(data);
      const storedPath = getStoredFilePath();
      
      // Try to silently restore handle by attempting to open the file
      // This happens in the background - user doesn't need to know
      try {
        const storedFileName = getStoredFileName();
        if (storedFileName && window.showOpenFilePicker) {
          // Try to open the file silently (this will prompt user, so we skip it for now)
          // Instead, just save to IndexedDB and restore on next explicit save
        }
      } catch (e) {
        // Ignore - we'll restore on next save
      }
      
      return { 
        success: true, 
        method: 'indexeddb',
        path: storedPath || 'Browser Storage',
        savedToIDB: true,
        needsReopen: true // Flag that handle needs restoration, but don't show error
      };
    }

    // We have a handle - write to file
    try {
      // Check permission
      if (handle.queryPermission) {
        const permission = await handle.queryPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
          // Permission lost, request it
          if (handle.requestPermission) {
            const newPermission = await handle.requestPermission({ mode: 'readwrite' });
            if (newPermission !== 'granted') {
              // Permission denied
              const storedPath = getStoredFilePath();
              return { 
                success: false, 
                error: 'Permission denied. Please reopen your file.',
                path: storedPath,
                needsReopen: true
              };
            }
          }
        }
      }
      
      // Write to file
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();

      // Restore handle in storage (in case it was lost and just restored)
      const fileName = handle.name;
      saveFileLocation(handle, fileName, fileName);

      // Also save to IndexedDB as backup
      await saveToIDB(data);

      const path = getStoredFilePath() || handle.name;
      return { success: true, method: 'file', path, handle };
    } catch (error) {
      // Handle permission/file errors - save to IndexedDB for seamless experience
      console.error('Error writing to file:', error);
      const storedPath = getStoredFilePath();
      
      // Save to IndexedDB as fallback - user doesn't need to know
      try {
        await saveToIDB(data);
        return { 
          success: true, 
          method: 'indexeddb',
          path: storedPath || 'Browser Storage',
          savedToIDB: true,
          needsReopen: true // Handle needs restoration but data is safe
        };
      } catch (idbError) {
        console.error('Error saving to IndexedDB:', idbError);
        // Only show error if IndexedDB also fails
        return { 
          success: false, 
          error: 'Error saving file: ' + error.message,
          path: storedPath,
          needsReopen: true
        };
      }
    }
  } catch (error) {
    console.error('Error saving file:', error);
    const storedPath = getStoredFilePath();
    
    // Last resort: try to save to IndexedDB
    try {
      await saveToIDB(data);
      return { 
        success: true, 
        method: 'indexeddb',
        path: storedPath || 'Browser Storage',
        savedToIDB: true,
        needsReopen: true
      };
    } catch (idbError) {
      return { 
        success: false, 
        error: error.message || 'Unknown error saving file',
        path: storedPath,
        needsReopen: true
      };
    }
  }
}

// Load from the stored file location
async function loadFromFile() {
  try {
    if (!hasFileLocation()) {
      return { 
        success: false, 
        error: 'No file location set. Please choose a file location first.',
        needsLocation: true
      };
    }

    if (!supportsFileSystemAccess()) {
      // Mobile: Load from IndexedDB (we can't read the file directly)
      const data = await loadFromIDB();
      if (data) {
        const storedPath = getStoredFilePath();
        return { 
          success: true, 
          data, 
          path: storedPath,
          method: 'indexeddb'
        };
      }
      // No data in IndexedDB, need to import file
      return { 
        success: false, 
        error: 'No data found. Please import your file.',
        needsReopen: true
      };
    }

    // Desktop: Try to use stored file handle
    let handle = getCurrentFileHandle();
    
    if (!handle) {
      // Handle was lost - try to auto-open silently using IndexedDB as fallback
      // This provides seamless experience - user doesn't need to reopen manually
      const idbData = await loadFromIDB();
      if (idbData) {
        // We have data in IndexedDB, use that for seamless experience
        const storedPath = getStoredFilePath();
        return {
          success: true,
          data: idbData,
          path: storedPath || getCurrentSavePath(),
          method: 'indexeddb',
          needsReopen: true // Flag that file handle needs to be restored on next save
        };
      }
      
      // No IndexedDB data - need to prompt user to reopen file
      const storedPath = getStoredFilePath();
      
      // Try to prompt user to reopen the same file
      try {
        const [selectedHandle] = await window.showOpenFilePicker({
          types: [{
            description: 'Goals Blueprint',
            accept: { 'application/json': ['.json'] }
          }],
          suggestedName: getStoredFileName() || 'goals-blueprint.json'
        });
        handle = selectedHandle;
        
        // Verify it's the same file (by name)
        const fileName = handle.name;
        const storedFileName = getStoredFileName();
        if (storedFileName && fileName !== storedFileName) {
          // User selected a different file
          const useNew = confirm(`You selected "${fileName}" but your saved file is "${storedFileName}". Do you want to use this new file instead?`);
          if (!useNew) {
            return { success: false, cancelled: true };
          }
          // Update to new file
          saveFileLocation(handle, fileName, fileName);
        } else {
          // Same file, restore handle
          saveFileLocation(handle, fileName, fileName);
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          return { success: false, cancelled: true };
        }
        return { 
          success: false, 
          error: 'Could not open file. Please try again.',
          needsReopen: true
        };
      }
    }

    // Read from file
    try {
      const file = await handle.getFile();
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Restore handle and path
      const fileName = file.name || handle.name;
      saveFileLocation(handle, fileName, fileName);
      
      // Also save to IndexedDB as backup
      await saveToIDB(data);
      
      return { success: true, data, path: fileName, method: 'file' };
    } catch (error) {
      console.error('Error reading file:', error);
      return { 
        success: false, 
        error: 'Error reading file: ' + error.message,
        needsReopen: true
      };
    }
  } catch (error) {
    console.error('Error loading file:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error loading file',
      needsReopen: true
    };
  }
}

// Change save location (user explicitly wants to change it)
async function changeSaveLocation(data) {
  try {
    // Clear old location
    clearFileLocation();
    
    // Choose new location
    const result = await chooseFileLocation(data);
    
    if (result.success) {
      return { 
        success: true, 
        path: result.path || result.fileName,
        handle: result.handle,
        method: result.method || 'file'
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error changing save location:', error);
    return { success: false, error: error.message };
  }
}

// IndexedDB functions (for backup and mobile)
function openIDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('harvard_goals_db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('goals_data')) {
        db.createObjectStore('goals_data');
      }
    };
  });
}

async function saveToIDB(data) {
  try {
    const db = await openIDB();
    const transaction = db.transaction(['goals_data'], 'readwrite');
    const store = transaction.objectStore('goals_data');
    await store.put(data, 'planner');
    
    // Track last local save timestamp
    setLastLocalSaveAt();
    
    return true;
  } catch (error) {
    console.error('Error saving to IndexedDB:', error);
    return false;
  }
}

async function loadFromIDB() {
  try {
    const db = await openIDB();
    const transaction = db.transaction(['goals_data'], 'readonly');
    const store = transaction.objectStore('goals_data');
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

// Load from file input (for mobile import)
async function loadFromFileInput(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Check if mobile
    const isMobile = !supportsFileSystemAccess();
    
    if (isMobile) {
      // MOBILE: Just save to IndexedDB immediately (this is our source of truth)
      // No need to track file location or sync mode - OneDrive is manual backup only
      await saveToIDB(data);
      setLastLocalSaveAt();
      return data;
    } else {
      // DESKTOP: Store file info and handle sync mode
      const fileName = file.name || 'goals-blueprint.json';
      localStorage.setItem(FILE_NAME_KEY, fileName);
      localStorage.setItem(FILE_PATH_KEY, fileName);
      localStorage.setItem(FILE_FULL_PATH_KEY, fileName);
      localStorage.setItem(FILE_HANDLE_KEY, 'has_path');
      
      // IMPORTANT: Set that we have a file location - this prevents popup from showing again
      setHasFileLocation(true);
      
      // Store imported file info
      setLastImportedFileInfo(fileName);
      
      // Detect sync mode: Check if we can maintain persistent file handle
      const canAutoSync = await canMaintainPersistentFileHandle();
      if (canAutoSync) {
        setSyncMode('AUTO_SYNC_SUPPORTED');
      } else {
        setSyncMode('MANUAL_SYNC_REQUIRED');
      }
      
      // Save to IndexedDB as backup
      await saveToIDB(data);
      setLastLocalSaveAt();
      
      return data;
    }
  } catch (error) {
    console.error('Error loading from file input:', error);
    throw error;
  }
}

// Save a Copy (mobile) - uses iOS share sheet for manual backup
async function saveCopyToShareSheet(data) {
  try {
    // Create timestamped backup filename
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
    const fileName = `Goals_Blueprint_${dateStr}_${timeStr}.json`;
    
    // Create a Blob with the JSON data
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create a File object (for better compatibility with share sheet)
    const file = new File([blob], fileName, { type: 'application/json' });
    
    // Check if Web Share API is available (iOS Safari supports this)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Save Goals Blueprint',
          text: 'Save your goals blueprint to OneDrive or Files'
        });
        
        return { success: true, method: 'share', fileName };
      } catch (shareError) {
        if (shareError.name === 'AbortError') {
          return { success: false, cancelled: true };
        }
        // Fall through to download method
        console.log('Share API failed, using download fallback:', shareError);
      }
    }
    
    // Fallback: Create download link (user can then use iOS share sheet manually)
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return { success: true, method: 'download', fileName };
  } catch (error) {
    console.error('Error saving copy:', error);
    return { success: false, error: error.message };
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
        if (onSaveComplete) {
          onSaveComplete({ success: true, skipped: true });
        }
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

// Initialize: Check if we have a file location and try to load
async function initialize() {
  try {
    // Check if mobile
    const isMobile = !supportsFileSystemAccess();
    
    // MOBILE: Always load from IndexedDB first, never block
    if (isMobile) {
      const idbData = await loadFromIDB();
      if (idbData) {
        // We have local data - restore the session
        return {
          data: idbData,
          path: 'Local Storage',
          method: 'indexeddb'
        };
      } else {
        // No local data - start fresh, app will auto-save as user works
        return {
          data: null,
          path: 'Local Storage',
          method: 'indexeddb',
          isNewSession: true
        };
      }
    }
    
    // DESKTOP: Check if we have a file location set
    const hasLocation = hasFileLocation();
    const storedPath = getStoredFilePath();
    
    // Also check if we have data in IndexedDB (means file was set before)
    const hasData = await loadFromIDB();
    
    // If we have data in IndexedDB, we definitely had a file location before
    // Set the location flag to prevent popup from showing
    if (hasData && !hasLocation && storedPath) {
      setHasFileLocation(true);
    }
    
    if (!hasLocation && !storedPath && !hasData) {
      // First time - no file location set at all, and no data
      return { 
        needsLocation: true,
        path: null,
        data: null
      };
    }

    // Desktop: Try to load from file
    const loadResult = await loadFromFile();
    
    if (loadResult.success) {
      return {
        data: loadResult.data,
        path: loadResult.path || getCurrentSavePath(),
        method: loadResult.method || 'file'
      };
    } else {
      // Could not load - but we have a location set
      // Try IndexedDB as fallback
      const idbData = await loadFromIDB();
      if (idbData) {
        return {
          data: idbData,
          path: loadResult.path || getCurrentSavePath(),
          method: 'indexeddb'
        };
      }
      
      // No data anywhere - return error info
      return {
        needsReopen: loadResult.needsReopen || false,
        error: loadResult.error || 'Could not load file',
        path: loadResult.path || getCurrentSavePath()
      };
    }
  } catch (error) {
    console.error('Initialization error:', error);
    // Try IndexedDB as last resort
    const idbData = await loadFromIDB();
    if (idbData) {
      return {
        data: idbData,
        path: getCurrentSavePath() || 'Browser Storage',
        method: 'indexeddb'
      };
    }
    return { 
      error: error.message,
      path: getCurrentSavePath()
    };
  }
}

// Check if file system is available
function isFileSystemAvailable() {
  return supportsFileSystemAccess();
}

// Legacy function for backward compatibility
function setFilePath(fullPath) {
  if (fullPath) {
    localStorage.setItem(FILE_FULL_PATH_KEY, fullPath);
    localStorage.setItem(FILE_PATH_KEY, fullPath);
    const fileName = fullPath.split(/[/\\]/).pop() || 'goals-blueprint.json';
    localStorage.setItem(FILE_NAME_KEY, fileName);
    localStorage.setItem(FILE_HANDLE_KEY, 'has_path');
    setHasFileLocation(true);
  }
}

export {
  chooseFileLocation,
  saveToFile,
  loadFromFile,
  loadFromFileInput,
  changeSaveLocation,
  autoSave,
  initialize,
  getCurrentSavePath,
  getStoredFilePath,
  getStoredFileName,
  hasFileLocation,
  isFileSystemAvailable,
  supportsFileSystemAccess,
  saveToIDB,
  loadFromIDB,
  getCurrentFileHandle,
  clearFileLocation,
  setFilePath,
  saveFileLocation,
  // New mobile sync functions
  saveCopyToShareSheet,
  getSyncMode,
  setSyncMode,
  getLastImportedFileName,
  canMaintainPersistentFileHandle,
  hasUnsavedChanges,
  getLastLocalSaveAt,
  getLastManualExportAt
};
