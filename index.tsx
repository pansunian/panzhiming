import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('App render failed:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-texture flex items-start justify-center px-4 pt-16 text-ink">
          <div className="w-full max-w-[420px] bg-paper px-6 py-8 text-center">
            <p className="font-mono text-[10px] tracking-[0.2em] text-stone-400 mb-3">RENDER ERROR</p>
            <p className="font-serif text-lg">页面内容加载异常，请刷新重试。</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
const Router = window.location.protocol === 'file:' ? HashRouter : BrowserRouter;

root.render(
  <React.StrictMode>
    <Router>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </Router>
  </React.StrictMode>
);
