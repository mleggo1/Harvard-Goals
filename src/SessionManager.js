// Session Manager - Single Source of Truth
// Handles the Current Session file across mobile and desktop

const SESSION_METADATA_KEY = 'conquer_session_metadata';
const SESSION_CACHE_KEY = 'conquer_session_cache';
const SCHEMA_VERSION = '1.0.0';

// Check if File System Access API is available (desktop Chrome/Edge)
function isFileSystemAccessAvailable() {
  return 'showSaveFilePicker' in window && 'showOpenFilePicker' in window;
}

// Get or create user ID
function getUserId() {
  let userId = localStorage.getItem('conquer_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('conquer_user_id', userId);
  }
  return userId;
}

// Get session metadata
export function getSessionMetadata() {
  try {
    const userId = getUserId();
    const key = `${SESSION_METADATA_KEY}_${userId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Get current save location info (for display)
export function getSaveLocationInfo() {
  const metadata = getSessionMetadata();
  if (!metadata || !metadata.saveTarget) {
    return null;
  }

  return {
    fileName: metadata.saveTarget.fileName || 'conquer-session.json',
    fullPath: metadata.saveTarget.fullPath || metadata.saveTarget.displayPath || metadata.saveTarget.fileName,
    displayPath: metadata.saveTarget.displayPath || metadata.saveTarget.fileName,
    location: metadata.saveTarget.location || (metadata.saveMethod === 'file' ? 'File System' : 'Local Storage'),
    saveMethod: metadata.saveMethod,
    lastSavedAt: metadata.lastSavedAt,
    createdAt: metadata.createdAt
  };
}

// Save session metadata
export function saveSessionMetadata(metadata) {
  try {
    const userId = getUserId();
    const key = `${SESSION_METADATA_KEY}_${userId}`;
    localStorage.setItem(key, JSON.stringify(metadata));
    return true;
  } catch {
    return false;
  }
}

// Get cached session data (fallback when file is unavailable)
export function getCachedSession() {
  try {
    const userId = getUserId();
    const key = `${SESSION_CACHE_KEY}_${userId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Cache session data
export function cacheSession(sessionData) {
  try {
    const userId = getUserId();
    const key = `${SESSION_CACHE_KEY}_${userId}`;
    localStorage.setItem(key, JSON.stringify(sessionData));
    return true;
  } catch {
    return false;
  }
}

// Initialize session structure
export function createEmptySession() {
  return {
    metadata: {
      schemaVersion: SCHEMA_VERSION,
      createdAt: new Date().toISOString(),
      lastSavedAt: null,
      saveTarget: null
    },
    currentState: {
      goals: [],
      journal: {
        entries: {},
        weeklyReviews: {},
        monthlyReviews: {}
      },
      focus: {
        vision10: '',
        focusWord: '',
        weeklyMantra: '',
        celebrationPlan: ''
      },
      metrics: {
        streak: 0,
        lastEntryDate: null
      }
    },
    history: []
  };
}

// Load session from file (desktop with File System Access API)
export async function loadSessionFromFile() {
  if (!isFileSystemAccessAvailable()) {
    // Fallback to cached session
    return getCachedSession() || createEmptySession();
  }

  try {
    const metadata = getSessionMetadata();
    if (!metadata || !metadata.saveTarget) {
      return null; // Need to set up file first
    }

    // Try to open the file using the saved file handle
    if (metadata.fileHandle) {
      const file = await metadata.fileHandle.getFile();
      const text = await file.text();
      const session = JSON.parse(text);
      
      // Update last saved timestamp
      session.metadata.lastSavedAt = new Date().toISOString();
      cacheSession(session);
      
      return session;
    }
  } catch (error) {
    console.error('Error loading session from file:', error);
    // Fallback to cache
    return getCachedSession() || createEmptySession();
  }

  return null;
}

// Save session to file
export async function saveSessionToFile(sessionData) {
  const metadata = getSessionMetadata();
  
  // Update last saved timestamp
  sessionData.metadata.lastSavedAt = new Date().toISOString();
  
  // Update saveTarget in session if metadata exists
  if (metadata && metadata.saveTarget) {
    sessionData.metadata.saveTarget = metadata.saveTarget;
  }
  
  // Always cache first (safety net)
  cacheSession(sessionData);
  
  if (!isFileSystemAccessAvailable()) {
    // Mobile/unsupported: just cache, user can export manually
    if (metadata && metadata.saveTarget) {
      saveSessionMetadata({
        ...metadata,
        lastSavedAt: sessionData.metadata.lastSavedAt,
        saveMethod: 'cache'
      });
    }
    return { success: true, method: 'cache' };
  }

  try {
    if (metadata && metadata.fileHandle) {
      // Write to existing file
      const writable = await metadata.fileHandle.createWritable();
      await writable.write(JSON.stringify(sessionData, null, 2));
      await writable.close();
      
      // Update file info
      const fileInfo = await getFullFilePath(metadata.fileHandle);
      const updatedMetadata = {
        ...metadata,
        lastSavedAt: sessionData.metadata.lastSavedAt,
        saveMethod: 'file',
        saveTarget: {
          ...metadata.saveTarget,
          fullPath: fileInfo.displayPath,
          fileName: fileInfo.fileName,
          fileSize: fileInfo.fileSize,
          lastModified: fileInfo.lastModified
        }
      };
      saveSessionMetadata(updatedMetadata);
      
      return { success: true, method: 'file', metadata: updatedMetadata };
    } else {
      // No file handle yet - need to prompt user
      return { success: false, needsSetup: true };
    }
  } catch (error) {
    console.error('Error saving session to file:', error);
    // Still cached, so data is safe
    return { success: false, error: error.message, cached: true };
  }
}

// Get full file path from file handle (if possible)
async function getFullFilePath(fileHandle) {
  try {
    // Try to get the file to extract path info
    const file = await fileHandle.getFile();
    // File System Access API doesn't expose full path for security, but we can show the name
    // For full path, we'd need to use the file's webkitRelativePath or other methods
    // On most systems, the file will be in the user's Downloads or chosen directory
    return {
      fileName: file.name,
      fileSize: file.size,
      lastModified: file.lastModified,
      // Note: Full path is not accessible via File System Access API for security reasons
      // We can only show the filename and let user know where they saved it
      displayPath: `File: ${file.name} (saved in your chosen location)`
    };
  } catch (error) {
    return {
      fileName: fileHandle.name,
      displayPath: `File: ${fileHandle.name}`
    };
  }
}

// First-time setup: Choose save location
export async function setupSaveLocation() {
  if (!isFileSystemAccessAvailable()) {
    // Mobile: use cache with export option
    const cachePath = `Local Storage Cache (User ID: ${getUserId().substring(0, 12)}...)`;
    const metadata = {
      saveTarget: {
        uri: 'cache',
        displayPath: cachePath,
        fullPath: cachePath,
        fileName: 'conquer-session.json',
        location: 'Browser Local Storage'
      },
      createdAt: new Date().toISOString(),
      saveMethod: 'cache'
    };
    saveSessionMetadata(metadata);
    return { success: true, metadata, method: 'cache' };
  }

  try {
    // Desktop: Use File System Access API
    const fileHandle = await window.showSaveFilePicker({
      suggestedName: 'conquer-session.json',
      types: [{
        description: 'Conquer Session File',
        accept: { 'application/json': ['.json'] }
      }]
    });

    const fileInfo = await getFullFilePath(fileHandle);
    
    const metadata = {
      fileHandle: fileHandle,
      saveTarget: {
        uri: fileHandle.name,
        displayPath: fileInfo.displayPath,
        fullPath: fileInfo.displayPath,
        fileName: fileInfo.fileName,
        location: 'File System (your chosen location)',
        fileSize: fileInfo.fileSize,
        lastModified: fileInfo.lastModified
      },
      createdAt: new Date().toISOString(),
      saveMethod: 'file'
    };

    saveSessionMetadata(metadata);
    
    // Create initial file
    const session = createEmptySession();
    session.metadata.saveTarget = metadata.saveTarget;
    await saveSessionToFile(session);
    
    return { success: true, metadata, method: 'file' };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { success: false, cancelled: true };
    }
    return { success: false, error: error.message };
  }
}

// Change save location
export async function changeSaveLocation() {
  return await setupSaveLocation();
}

// Export session as downloadable file
export function exportSession(sessionData) {
  const blob = new Blob([JSON.stringify(sessionData, null, 2)], { 
    type: 'application/json' 
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `conquer-session-${new Date().toISOString().split('T')[0]}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

// Import session from file
export async function importSession(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const session = JSON.parse(e.target.result);
        // Validate schema
        if (session.metadata && session.currentState) {
          // Update metadata
          session.metadata.lastSavedAt = new Date().toISOString();
          cacheSession(session);
          resolve(session);
        } else {
          reject(new Error('Invalid session file format'));
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// Add history event
export function addHistoryEvent(sessionData, eventType, eventData) {
  if (!sessionData.history) {
    sessionData.history = [];
  }
  
  sessionData.history.push({
    type: eventType,
    data: eventData,
    timestamp: new Date().toISOString()
  });
  
  // Keep last 1000 events
  if (sessionData.history.length > 1000) {
    sessionData.history = sessionData.history.slice(-1000);
  }
  
  return sessionData;
}

// Merge goals and journal into unified session
export function mergeIntoSession(sessionData, goalsData, journalData) {
  if (goalsData && goalsData.goals) {
    sessionData.currentState.goals = goalsData.goals;
  }
  
  if (journalData) {
    if (journalData.entries) {
      sessionData.currentState.journal.entries = journalData.entries;
    }
    if (journalData.weeklyReviews) {
      sessionData.currentState.journal.weeklyReviews = journalData.weeklyReviews;
    }
    if (journalData.monthlyReviews) {
      sessionData.currentState.journal.monthlyReviews = journalData.monthlyReviews;
    }
  }
  
  return sessionData;
}

// Extract goals from session
export function extractGoals(sessionData) {
  return sessionData.currentState.goals || [];
}

// Extract journal from session
export function extractJournal(sessionData) {
  return sessionData.currentState.journal || {
    entries: {},
    weeklyReviews: {},
    monthlyReviews: {}
  };
}

