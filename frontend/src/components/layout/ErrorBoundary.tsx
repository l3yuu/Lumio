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

export const MaintenancePage: React.FC<{ onReload?: () => void; onAdminLogin?: () => void }> = ({ onReload, onAdminLogin }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-[#f5f5f5] p-8 relative overflow-hidden">
      <div className="maintenance-bg-pattern" />

      <div className="relative z-10 max-w-[480px] w-full bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-12 shadow-card text-center">
        <div className="relative inline-flex items-center justify-center w-20 h-20 mb-7">
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary-tint-7 animate-[maintenance-spin_2.5s_linear_infinite]" />
          <Wrench size={36} className="text-primary animate-[maintenance-wobble_3s_ease-in-out_infinite]" />
        </div>

        <h1 className="text-[1.75rem] font-extrabold tracking-[-0.03em] mb-3 bg-gradient-to-br from-white to-primary bg-clip-text text-transparent">Under Maintenance</h1>
        <p className="text-base text-ink-dim leading-relaxed mb-8">
          We're currently performing scheduled updates to improve your experience. Lumio will be back shortly.
        </p>

        <div className="flex items-start gap-3 bg-primary-tint-4 border border-primary-tint-6 rounded-xl p-4 mb-8 text-left text-ink-dim text-sm leading-relaxed">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <p>
            Our team is working hard to bring everything back online. This usually takes just a few minutes.
          </p>
        </div>

        {onReload && (
          <button onClick={onReload} className="inline-flex items-center gap-2 py-3.5 px-8 bg-primary text-ink-on-primary font-bold text-[0.95rem] border-none rounded-xl cursor-pointer transition-all duration-150 shadow-glow-primary-btn hover:-translate-y-0.5 hover:shadow-glow-primary-btn-hover hover:bg-[#4de09f]">
            <RefreshCw size={18} />
            Try Again
          </button>
        )}

        <div className="flex items-center justify-center gap-2 mt-7 text-xs text-ink-faint flex-wrap">
          <Mail size={14} />
          <span>Need help? Contact us at </span>
          <a href="mailto:support.lumio@gmail.com">support.lumio@gmail.com</a>
        </div>

        {onAdminLogin && (
          <div className="mt-6 border-t border-white/[0.06] pt-5">
            <button
              onClick={onAdminLogin}
              className="text-xs text-white/30 hover:text-primary transition-colors cursor-pointer bg-transparent border-none outline-none font-semibold underline"
            >
              Superadmin Access
            </button>
          </div>
        )}
      </div>

      <div className="relative z-10 mt-12 text-xs text-ink-ghost">
        &copy; {new Date().getFullYear()} Lumio — AI Study Companion. All rights reserved.
      </div>
    </div>
  );
};
