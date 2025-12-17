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
        <h1>Welcome to Your Life Goals Blueprint</h1>
        <form onSubmit={handleLogin}>
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
            />
            {error && <div className="password-error">{error}</div>}
          </div>
          <button type="submit" className="btn primary">
            Log in
          </button>
        </form>
      </div>
    </div>
  );
}

