import React, { useState } from "react";
import { setupSaveLocation, getSaveLocationInfo } from "./SessionManager.js";
import "./App.css";

export default function SessionSetup({ onComplete }) {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [error, setError] = useState(null);

  const [setupComplete, setSetupComplete] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);

  const handleSetup = async () => {
    setIsSettingUp(true);
    setError(null);
    
    try {
      const result = await setupSaveLocation();
      if (result.success) {
        const locationInfo = getSaveLocationInfo();
        setFileInfo(locationInfo);
        setSetupComplete(true);
        setIsSettingUp(false);
        // Auto-complete after showing file info
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 2000);
      } else if (result.cancelled) {
        setError("Setup cancelled. You can set this up later in Settings.");
        setIsSettingUp(false);
      } else {
        setError(result.error || "Failed to set up save location");
        setIsSettingUp(false);
      }
    } catch (err) {
      setError(err.message || "An error occurred during setup");
      setIsSettingUp(false);
    }
  };

  const locationInfo = getSaveLocationInfo();
  const isFileSystem = locationInfo?.saveMethod === 'file';
  const isCache = locationInfo?.saveMethod === 'cache';

  return (
    <div className="app-root">
      <div className="app-shell" style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
        <article className="card" style={{ textAlign: 'center' }}>
          <header className="card-header">
            <div className="card-title">
              <span className="icon">📄</span>
              <span>Welcome to Conquer Journal</span>
            </div>
          </header>
          
          <div style={{ marginTop: '24px' }}>
            <p style={{ fontSize: '16px', lineHeight: '1.6', color: 'var(--text-primary)', marginBottom: '24px' }}>
              Your journal uses <strong>one master file</strong> that saves everything automatically.
            </p>
            
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px' }}>
              Choose where to save your Current Session file. This will be your single source of truth across all devices.
            </p>

            {error && (
              <div style={{ 
                padding: '12px', 
                background: 'rgba(248, 113, 113, 0.15)', 
                border: '1px solid rgba(248, 113, 113, 0.4)',
                borderRadius: '8px',
                marginBottom: '24px',
                color: 'var(--danger)',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            {setupComplete && fileInfo && (
              <div style={{ 
                padding: '16px', 
                background: 'rgba(16, 185, 129, 0.15)', 
                border: '2px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '8px',
                marginBottom: '24px'
              }}>
                <div style={{ 
                  fontWeight: 700, 
                  color: '#10b981', 
                  marginBottom: '12px',
                  fontSize: '14px'
                }}>
                  ✅ Save Location Configured!
                </div>
                <div style={{ 
                  color: 'var(--text-primary)',
                  wordBreak: 'break-all',
                  marginBottom: '8px',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '10px 12px',
                  borderRadius: '6px'
                }}>
                  {fileInfo.fullPath || fileInfo.displayPath || fileInfo.fileName}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                  <strong>File Name:</strong> {fileInfo.fileName}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                  <strong>Location:</strong> {fileInfo.location}
                </div>
                <div style={{ 
                  color: 'var(--accent)', 
                  fontSize: '12px', 
                  marginTop: '12px',
                  fontStyle: 'italic'
                }}>
                  Opening your journal...
                </div>
              </div>
            )}

            {!setupComplete && (
              <button
                className="btn primary"
                onClick={handleSetup}
                disabled={isSettingUp}
                style={{ 
                  width: '100%',
                  padding: '16px 32px',
                  fontSize: '16px',
                  marginBottom: '16px'
                }}
              >
                {isSettingUp ? 'Setting up...' : 'Choose Save Location'}
              </button>
            )}

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '24px' }}>
              <strong>Note:</strong> On mobile devices, your data will be saved locally. 
              Use Export in Settings to sync between devices.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}

