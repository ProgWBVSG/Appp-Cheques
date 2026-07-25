import { StrictMode, Component } from 'react'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class ErrorBoundary extends Component<{children: ReactNode}, {error: Error | null}> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{color: 'red', padding: 20, background: '#1e293b', minHeight: '100vh', fontFamily: 'monospace'}}>
          <h2>Crash de React:</h2>
          <pre style={{whiteSpace: 'pre-wrap', color: '#f8fafc'}}>{this.state.error.message}</pre>
          <pre style={{whiteSpace: 'pre-wrap', color: '#f8fafc', marginTop: 10}}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
