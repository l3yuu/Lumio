import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Mail, Wrench } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Lumio Error Boundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return <MaintenancePage onReload={this.handleReload} />;
    }

    return this.props.children;
  }
}

// Also exported for manual use (e.g. maintenance mode toggle)
export const MaintenancePage: React.FC<{ onReload?: () => void }> = ({ onReload }) => {
  return (
    <div className="maintenance-page">
      <div className="maintenance-bg-pattern" />
      
      <div className="maintenance-card">
        {/* Animated icon */}
        <div className="maintenance-icon-wrapper">
          <div className="maintenance-icon-ring" />
          <Wrench size={36} className="maintenance-icon" />
        </div>

        <h1 className="maintenance-title">Under Maintenance</h1>
        <p className="maintenance-subtitle">
          We're currently performing scheduled updates to improve your experience. Lumio will be back shortly.
        </p>

        <div className="maintenance-info-box">
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <p>
            Our team is working hard to bring everything back online. This usually takes just a few minutes.
          </p>
        </div>

        {onReload && (
          <button onClick={onReload} className="maintenance-reload-btn">
            <RefreshCw size={18} />
            Try Again
          </button>
        )}

        <div className="maintenance-contact">
          <Mail size={14} />
          <span>Need help? Contact us at </span>
          <a href="mailto:support.lumio@gmail.com">support.lumio@gmail.com</a>
        </div>
      </div>

      <div className="maintenance-footer-text">
        &copy; {new Date().getFullYear()} Lumio — AI Study Companion. All rights reserved.
      </div>
    </div>
  );
};
