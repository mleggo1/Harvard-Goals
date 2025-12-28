import React, { useState } from "react";
import "./App.css";

function getCurrentPassword() {
  const month = new Date().getMonth() + 1; // getMonth() returns 0-11, so add 1
  return `MJL${month}`;
}

export default function PasswordGate({ children }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const expectedPassword = getCurrentPassword();

  function handleLogin(e) {
    e.preventDefault();
    setError("");

    const trimmed = password.trim().toUpperCase();
    const expected = expectedPassword.toUpperCase();

    if (trimmed === expected) {
      setIsAuthenticated(true);
      setPassword("");
      setError("");
    } else {
      setError("Incorrect password. Please try again.");
      setPassword("");
    }
  }

  if (isAuthenticated) {
    return children;
  }

  return (
    <div className="password-gate">
      <div className="password-gate-content">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
          <h1 style={{ 
            fontSize: 'clamp(24px, 5vw, 32px)', 
            fontWeight: 700, 
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #38bdf8, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Welcome to Your Life Goals Blueprint
          </h1>
          <p style={{ 
            fontSize: 'clamp(14px, 3vw, 16px)', 
            color: 'var(--text-muted)',
            marginTop: '8px'
          }}>
            Your private, secure goal-setting companion
          </p>
        </div>
        <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
          <div className="password-input-group">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Enter password"
              autoFocus
              className={error ? "error" : ""}
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: '16px',
                borderRadius: '12px',
                border: error ? '2px solid var(--danger)' : '2px solid var(--border)',
                background: 'rgba(15, 23, 42, 0.6)',
                color: 'var(--text-primary)',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent)';
                e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.1)';
              }}
              onBlur={(e) => {
                if (!error) {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            />
            {error && (
              <div className="password-error" style={{
                marginTop: '8px',
                padding: '12px',
                background: 'rgba(248, 113, 113, 0.1)',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                borderRadius: '8px',
                color: 'var(--danger)',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}
          </div>
          <button 
            type="submit" 
            className="btn primary"
            style={{
              width: '100%',
              marginTop: '20px',
              padding: '16px',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #38bdf8, #8b5cf6)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 16px rgba(56, 189, 248, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(56, 189, 248, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 16px rgba(56, 189, 248, 0.3)';
            }}
          >
            Unlock My Goals 🚀
          </button>
        </form>
      </div>
    </div>
  );
}

