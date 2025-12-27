import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: 'var(--page-bg, #020617)',
          color: 'var(--text-primary, #f8fafc)'
        }}>
          <div style={{
            maxWidth: '600px',
            padding: '32px',
            background: 'var(--surface, rgba(15, 23, 42, 0.75))',
            borderRadius: '16px',
            border: '2px solid var(--border, rgba(148, 163, 184, 0.2))'
          }}>
            <h1 style={{ marginTop: 0, color: '#f87171' }}>⚠️ Something went wrong</h1>
            <p>There was an error loading the app. Please try refreshing the page.</p>
            {this.state.error && (
              <details style={{ marginTop: '16px', fontSize: '12px', opacity: 0.8 }}>
                <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>Error details</summary>
                <pre style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '12px',
                  borderRadius: '8px',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '16px',
                padding: '12px 24px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 600
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

