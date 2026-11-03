import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    
    // Track error in Google Analytics if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: true,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0a0a0a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '420px' }}>
            <h1 style={{
              color: '#D9C7A6',
              fontSize: '2rem',
              fontWeight: '700',
              letterSpacing: '0.15em',
              marginBottom: '1rem',
            }}>
              VYBERA
            </h1>
            <p style={{
              color: '#999',
              fontSize: '0.875rem',
              lineHeight: '1.6',
              marginBottom: '1rem',
            }}>
              Something went wrong. Please refresh the page or try again later.
            </p>
            {this.state.error && (
              <p style={{
                color: '#e11d48',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                background: 'rgba(255,255,255,0.05)',
                padding: '8px 12px',
                borderRadius: '4px',
                marginBottom: '1.5rem',
                wordBreak: 'break-word',
              }}>
                {this.state.error.message || String(this.state.error)}
              </p>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: '#590907',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px 24px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  borderRadius: '2px',
                }}
              >
                Refresh Page
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                style={{
                  background: '#FAF5ED',
                  color: '#30231F',
                  border: '1px solid #D4BEA5',
                  padding: '12px 24px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  borderRadius: '2px',
                }}
              >
                Back to Store
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
