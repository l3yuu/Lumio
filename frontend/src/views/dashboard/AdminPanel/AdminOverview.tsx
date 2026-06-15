import { Activity, CheckCircle2, Sparkles, Users, Layers, Calendar } from 'lucide-react';
import type { DashboardTab } from '../../../types';
import type { HealthData } from './types';

interface Props {
  health: HealthData | null;
  setDashboardTab: (tab: DashboardTab) => void;
}

const formatUptime = (seconds: number) => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const dDisplay = d > 0 ? `${d}d ` : "";
  const hDisplay = h > 0 ? `${h}h ` : "";
  const mDisplay = m > 0 ? `${m}m ` : "";
  const sDisplay = `${s}s`;
  return `${dDisplay}${hDisplay}${mDisplay}${sDisplay}`;
};

export const AdminOverview = ({ health, setDashboardTab }: Props) => {
  if (!health) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-line rounded-xl p-5 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-xs text-ink-muted uppercase tracking-wider font-semibold">Database Response</span>
            <Activity size={18} className="text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">
              {health.database.latency_ms >= 0 ? `${health.database.latency_ms} ms` : 'Offline'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2.5 h-2.5 rounded-full ${health.database.status === 'connected' ? 'bg-success' : 'bg-danger'}`} />
            <span className="font-semibold uppercase text-ink-muted tracking-wide text-[0.7rem]">
              {health.database.status === 'connected' ? 'Connected' : 'Connection Error'}
            </span>
          </div>
        </div>

        <div className="bg-card border border-line rounded-xl p-5 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-xs text-ink-muted uppercase tracking-wider font-semibold">Uptime Status</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">
              {formatUptime(health.uptime_seconds)}
            </span>
          </div>
          <span className="text-xs text-ink-muted">FastAPI container server process running</span>
        </div>

        <div className="bg-card border border-line rounded-xl p-5 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-xs text-ink-muted uppercase tracking-wider font-semibold">API Health Status</span>
            <CheckCircle2 size={18} className="text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">Active</span>
          </div>
          <span className="text-xs text-ink-muted">Responding to live HTTP & WebSocket requests</span>
        </div>

        <div className="bg-card border border-line rounded-xl p-5 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-xs text-ink-muted uppercase tracking-wider font-semibold">Gemini AI Engine</span>
            <Sparkles size={18} className={health.gemini?.status === 'healthy' ? 'text-primary' : 'text-danger'} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">
              {health.gemini?.status === 'healthy' ? 'Healthy' : 'Unhealthy'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2.5 h-2.5 rounded-full ${health.gemini?.status === 'healthy' ? 'bg-success' : 'bg-danger'}`} />
            <span className="font-semibold uppercase text-ink-muted tracking-wide text-[0.7rem] max-w-[200px] truncate" title={health.gemini?.error || ''}>
              {health.gemini?.status === 'healthy' ? 'Active & Ready' : health.gemini?.error || 'Service Down'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-card border border-line rounded-xl p-6 flex flex-col gap-6">
        <h3 className="text-sm font-bold text-ink uppercase tracking-wider border-b border-line pb-2">Platform Totals</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div onClick={() => setDashboardTab('admin-users')} className="bg-input/40 border border-line rounded-lg p-5 flex items-center gap-4 cursor-pointer hover:bg-glass-strong transition-all duration-150">
            <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users size={22} />
            </div>
            <div>
              <span className="text-xs text-ink-muted block font-medium">Registered Accounts</span>
              <span className="text-2xl font-extrabold">{health.counts.users}</span>
            </div>
          </div>

          <div onClick={() => setDashboardTab('admin-modules')} className="bg-input/40 border border-line rounded-lg p-5 flex items-center gap-4 cursor-pointer hover:bg-glass-strong transition-all duration-150">
            <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Layers size={22} />
            </div>
            <div>
              <span className="text-xs text-ink-muted block font-medium">AI Study Modules</span>
              <span className="text-2xl font-extrabold">{health.counts.modules}</span>
            </div>
          </div>

          <div onClick={() => setDashboardTab('admin-exams')} className="bg-input/40 border border-line rounded-lg p-5 flex items-center gap-4 cursor-pointer hover:bg-glass-strong transition-all duration-150">
            <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Calendar size={22} />
            </div>
            <div>
              <span className="text-xs text-ink-muted block font-medium">Scheduled Exams</span>
              <span className="text-2xl font-extrabold">{health.counts.exams || 0}</span>
            </div>
          </div>

          <div onClick={() => setDashboardTab('admin-groups')} className="bg-input/40 border border-line rounded-lg p-5 flex items-center gap-4 cursor-pointer hover:bg-glass-strong transition-all duration-150">
            <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div>
              <span className="text-xs text-ink-muted block font-medium">Study Circles Created</span>
              <span className="text-2xl font-extrabold">{health.counts.groups}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
