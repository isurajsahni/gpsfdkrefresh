import React from 'react';

/**
 * App-level error boundary.
 *
 * Without this, a single render error in any deep component (bad product data,
 * malformed price, network helper throw, etc.) crashes the whole SPA to a blank
 * white screen — there is no way for the user to even navigate away.
 *
 * This component catches the error, logs it, and shows a friendly fallback
 * with "Reload" and "Go Home" actions so users can recover.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console. If you ever wire up Sentry / Datadog / similar, push
    // the error + stack here as well.
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => {
    // Forces a fresh load — the cleanest recovery if React's tree is broken.
    if (typeof window !== 'undefined') window.location.reload();
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fffdf9',
          padding: '24px',
          fontFamily: '"DM Sans", system-ui, sans-serif',
        }}>
          <div style={{
            maxWidth: 480,
            textAlign: 'center',
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: 20,
            padding: '32px 28px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
            <h1 style={{ fontSize: 22, margin: '0 0 8px', color: '#0B5D3B' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#666', fontSize: 14, margin: '0 0 20px' }}>
              The page hit an unexpected error. Please reload — your cart is saved.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '10px 18px',
                  background: '#F15A29',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Reload
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '10px 18px',
                  background: '#fff',
                  color: '#0B5D3B',
                  border: '1.5px solid #ddd',
                  borderRadius: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Go Home
              </button>
            </div>
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <pre style={{
                marginTop: 18,
                padding: 12,
                background: '#fafafa',
                border: '1px solid #eee',
                borderRadius: 8,
                fontSize: 11,
                color: '#a33',
                textAlign: 'left',
                overflow: 'auto',
                maxHeight: 200,
              }}>
                {String(this.state.error?.stack || this.state.error)}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
