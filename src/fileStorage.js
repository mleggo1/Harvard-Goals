// Unified single-file storage system
// Always saves to and loads from one file location

const FILE_HANDLE_KEY = 'harvard_goals_file_handle';
const FILE_PATH_KEY = 'harvard_goals_file_path';
const FILE_NAME_KEY = 'harvard_goals_file_name';
const FILE_FULL_PATH_KEY = 'harvard_goals_file_full_path';
const HAS_FILE_LOCATION_KEY = 'harvard_goals_has_file_location';

// Store file handle reference (for desktop File System Access API)
let currentFileHandle = null;

// Check if File System Access API is supported
function supportsFileSystemAccess() {
  return 'showSaveFilePicker' in window && 'showOpenFilePicker' in window;
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
      // Mobile: We can't write to the file directly
      // Save to IndexedDB and return the stored path
      await saveToIDB(data);
      const storedPath = getStoredFilePath();
      return { 
        success: true, 
        method: 'indexeddb', 
        path: storedPath || 'Mobile Storage',
        needsReopen: true // User needs to download/export to update the file
      };
    }

    // Desktop: Try to use stored file handle
    if (!handle) {
      // Try to restore handle
      handle = await tryRestoreFileHandle();
    }
    
    if (!handle) {
      // Handle was lost (page reload, etc.)
      // We need to ask user to reopen the file
      const storedPath = getStoredFilePath();
      return { 
        success: false, 
        error: 'File handle lost. Please reopen your file.',
        path: storedPath,
        needsReopen: true
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

      // Also save to IndexedDB as backup
      await saveToIDB(data);

      const path = getStoredFilePath() || handle.name;
      return { success: true, method: 'file', path, handle };
    } catch (error) {
      // Handle permission/file errors
      if (error.name === 'NotAllowedError' || error.name === 'SecurityError' || error.name === 'NotFoundError') {
        const storedPath = getStoredFilePath();
        return { 
          success: false, 
          error: 'File access error. Please reopen your file.',
          path: storedPath,
          needsReopen: true
        };
      }
      throw error;
    }
  } catch (error) {
    console.error('Error saving file:', error);
    const storedPath = getStoredFilePath();
    return { 
      success: false, 
      error: error.message || 'Unknown error saving file',
      path: storedPath,
      needsReopen: true
    };
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
      // Handle was lost, need to reopen file
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
    
    // Store file name
    const fileName = file.name || 'goals-blueprint.json';
    localStorage.setItem(FILE_NAME_KEY, fileName);
    localStorage.setItem(FILE_PATH_KEY, fileName);
    localStorage.setItem(FILE_FULL_PATH_KEY, fileName);
    localStorage.setItem(FILE_HANDLE_KEY, 'has_path');
    setHasFileLocation(true);
    
    // Save to IndexedDB
    await saveToIDB(data);
    
    return data;
  } catch (error) {
    console.error('Error loading from file input:', error);
    throw error;
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
    // Check if we have a file location set
    if (!hasFileLocation()) {
      // First time - no file location set
      return { 
        needsLocation: true,
        path: null,
        data: null
      };
    }

    // We have a file location - try to load from it
    const loadResult = await loadFromFile();
    
    if (loadResult.success) {
      return {
        data: loadResult.data,
        path: loadResult.path || getCurrentSavePath(),
        method: loadResult.method || 'file'
      };
    } else {
      // Could not load - return error info
      return {
        needsReopen: loadResult.needsReopen || false,
        error: loadResult.error,
        path: loadResult.path || getCurrentSavePath()
      };
    }
  } catch (error) {
    console.error('Initialization error:', error);
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
  setFilePath
};
