import React from "react";
import { getSaveLocationInfo, changeSaveLocation, exportSession } from "./SessionManager.js";
import { getCachedSession } from "./SessionManager.js";

export default function SaveLocationDisplay({ sessionData, onLocationChange }) {
  const locationInfo = getSaveLocationInfo();
  const [isChanging, setIsChanging] = React.useState(false);

  if (!locationInfo) {
    return null;
  }

  const handleChangeLocation = async () => {
    setIsChanging(true);
    try {
      const result = await changeSaveLocation();
      if (result.success && onLocationChange) {
        onLocationChange(result.metadata);
        // Refresh location info
        window.location.reload();
      }
    } catch (error) {
      console.error('Error changing location:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const handleExport = () => {
    const session = sessionData || getCachedSession();
    if (session) {
      exportSession(session);
    }
  };

  const isFileSystem = locationInfo.saveMethod === 'file';
  const isCache = locationInfo.saveMethod === 'cache';

  return (
    <div style={{
      padding: '12px 16px',
      background: 'rgba(56, 189, 248, 0.1)',
      border: '1px solid rgba(56, 189, 248, 0.3)',
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize: '12px'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ 
            fontWeight: 600, 
            color: 'var(--accent)', 
            marginBottom: '6px',
            fontSize: '13px'
          }}>
            📄 CURRENT SESSION FILE:
          </div>
          <div style={{ 
            color: 'var(--text-primary)',
            wordBreak: 'break-all',
            marginBottom: '6px',
            fontFamily: 'monospace',
            fontSize: '12px',
            fontWeight: 600,
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '8px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(56, 189, 248, 0.3)'
          }}>
            {locationInfo.fullPath || locationInfo.displayPath || locationInfo.fileName}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>
            <strong>File Name:</strong> {locationInfo.fileName}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
            <strong>Location:</strong> {locationInfo.location}
          </div>
          {locationInfo.lastSavedAt && (
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
              <strong>Last Saved:</strong> {new Date(locationInfo.lastSavedAt).toLocaleString()}
            </div>
          )}
          {isCache && (
            <div style={{ 
              color: 'var(--text-muted)', 
              fontSize: '11px', 
              marginTop: '4px',
              fontStyle: 'italic'
            }}>
              💡 Tip: Export to sync between devices
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {isFileSystem && (
            <button
              className="btn btn-ghost"
              onClick={handleChangeLocation}
              disabled={isChanging}
              style={{ fontSize: '11px', padding: '6px 12px' }}
              title="Change save location"
            >
              {isChanging ? 'Changing...' : 'Change Location'}
            </button>
          )}
          <button
            className="btn btn-ghost"
            onClick={handleExport}
            style={{ fontSize: '11px', padding: '6px 12px' }}
            title="Export session file"
          >
            📥 Export
          </button>
        </div>
      </div>
    </div>
  );
}

