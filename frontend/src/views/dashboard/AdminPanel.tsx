import React, { useState, useEffect } from 'react';
import { Shield, Users, Layers, Activity, Search, Loader2, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import type { User, DashboardTab } from '../../types';

interface HealthData {
  status: string;
  uptime_seconds: number;
  database: {
    status: string;
    latency_ms: number;
  };
  counts: {
    users: number;
    modules: number;
    groups: number;
  };
}

interface AdminModule {
  id: number;
  name: string;
  subject: string;
  date: string;
  owner_email: string;
  owner_name: string;
  questions_count: number;
  difficulty: string;
}

interface AdminGroup {
  id: number;
  name: string;
  creator_email: string;
  creator_name: string;
  members_count: number;
  modules_count: number;
}

interface AdminSales {
  mrr: number;
  total_revenue: number;
  premium_count: number;
  churn_rate: number;
  transactions: {
    id: number;
    user_name: string;
    user_email: string;
    plan: string;
    amount: number;
    date: string;
    status: string;
  }[];
}

interface AdminPanelProps {
  user: User;
  currentTab: string;
  setDashboardTab: (tab: DashboardTab) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ user: currentUser, currentTab, setDashboardTab }) => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [sales, setSales] = useState<AdminSales | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      if (currentTab === 'admin-overview') {
        const healthRes = await fetch(`${API_BASE_URL}/api/admin/health`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!healthRes.ok) throw new Error('Failed to fetch API health stats.');
        const healthJson = await healthRes.json();
        setHealth(healthJson);
      }

      if (currentTab === 'admin-users') {
        const usersRes = await fetch(`${API_BASE_URL}/api/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!usersRes.ok) throw new Error('Failed to fetch user list.');
        const usersJson = await usersRes.json();
        setUsers(usersJson);
      }

      if (currentTab === 'admin-sales') {
        const salesRes = await fetch(`${API_BASE_URL}/api/admin/sales`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!salesRes.ok) throw new Error('Failed to fetch sales statistics.');
        const salesJson = await salesRes.json();
        setSales(salesJson);
      }

      if (currentTab === 'admin-modules') {
        const modulesRes = await fetch(`${API_BASE_URL}/api/admin/modules`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!modulesRes.ok) throw new Error('Failed to fetch modules list.');
        const modulesJson = await modulesRes.json();
        setModules(modulesJson);
      }

      if (currentTab === 'admin-groups') {
        const groupsRes = await fetch(`${API_BASE_URL}/api/admin/groups`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!groupsRes.ok) throw new Error('Failed to fetch groups list.');
        const groupsJson = await groupsRes.json();
        setGroups(groupsJson);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    // Reset search query when tab changes
    setSearchQuery('');
  }, [currentTab]);

  const handleUpdateRole = async (userId: number, currentRole: string) => {
    const nextRole = currentRole === 'superadmin' ? 'user' : 'superadmin';
    if (userId === currentUser.id) {
      alert("You cannot demote yourself from superadmin!");
      return;
    }

    if (!confirm(`Are you sure you want to change this user's role to '${nextRole}'?`)) {
      return;
    }

    setSubmittingId(userId);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: nextRole })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || 'Failed to update user role.');
      }

      const updatedUser = await res.json();
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: updatedUser.role } : u));
    } catch (err: any) {
      alert(err.message || 'Error updating role.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (userId === currentUser.id) {
      alert("You cannot delete your own superadmin account!");
      return;
    }

    if (!confirm("Are you sure you want to permanently delete this user and all their associated modules and metadata? This action is irreversible!")) {
      return;
    }

    setSubmittingId(userId);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || 'Failed to delete user.');
      }

      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      alert(err.message || 'Error deleting user.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDeleteModule = async (moduleId: number) => {
    if (!confirm("Are you sure you want to permanently delete this AI module?")) {
      return;
    }

    setSubmittingId(moduleId);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/modules/${moduleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || 'Failed to delete module.');
      }

      setModules(prev => prev.filter(m => m.id !== moduleId));
    } catch (err: any) {
      alert(err.message || 'Error deleting module.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm("Are you sure you want to permanently delete this study group?")) {
      return;
    }

    setSubmittingId(groupId);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/groups/${groupId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || 'Failed to delete group.');
      }

      setGroups(prev => prev.filter(g => g.id !== groupId));
    } catch (err: any) {
      alert(err.message || 'Error deleting group.');
    } finally {
      setSubmittingId(null);
    }
  };

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

  return (
    <div className="flex flex-col gap-6 w-full h-full text-ink p-6 max-md:p-4 overflow-y-auto">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-line pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center text-primary shadow-glow-primary-soft">
            <Shield size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {currentTab === 'admin-overview' && 'Admin Overview'}
              {currentTab === 'admin-users' && 'User Management'}
              {currentTab === 'admin-sales' && 'Sales & Revenue'}
              {currentTab === 'admin-modules' && 'Modules Generated'}
              {currentTab === 'admin-groups' && 'Collaborative Circles'}
            </h2>
            <span className="text-xs text-ink-muted">
              {currentTab === 'admin-overview' && 'System statistics, database status, and API health metrics'}
              {currentTab === 'admin-users' && 'Manage registered accounts, modify roles, and administrative cleanups'}
              {currentTab === 'admin-sales' && 'Track platform revenue subscriptions, payouts, and transactions history'}
              {currentTab === 'admin-modules' && 'View all AI-generated module summaries created across the platform'}
              {currentTab === 'admin-groups' && 'Monitor all collaborative circles, group sizes, and creators'}
            </span>
          </div>
        </div>
        
        <button 
          onClick={fetchAdminData}
          disabled={loading}
          className="px-4 py-2 border border-line rounded-lg text-sm font-medium hover:bg-glass-strong hover:text-ink transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Refresh Console
        </button>
      </div>

      {/* Admin Error banner */}
      {error && (
        <div className="bg-danger-soft border border-danger-line text-danger p-4 rounded-xl flex items-center gap-3 shrink-0">
          <XCircle size={20} className="shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Loading State Overlay */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
          <Loader2 size={36} className="animate-spin text-primary" />
          <span className="text-sm text-ink-muted">Loading administration metrics...</span>
        </div>
      )}

      {/* Content Renderers */}
      {!loading && !error && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* TAB 1: OVERVIEW */}
          {currentTab === 'admin-overview' && health && (
            <div className="flex flex-col gap-6">
              {/* Metric Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              </div>

              {/* Records Dashboard Summary */}
              <div className="bg-card border border-line rounded-xl p-6 flex flex-col gap-6">
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider border-b border-line pb-2">Platform Totals</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {currentTab === 'admin-users' && (
            <div className="flex-1 flex flex-col bg-card border border-line rounded-xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-line shrink-0 flex items-center bg-input/40 relative">
                <Search size={16} className="absolute left-7 text-ink-muted" />
                <input
                  type="text"
                  placeholder="Search accounts by name, username, or email..."
                  className="w-full py-2.5 pl-11 pr-4 bg-input border border-line rounded-lg text-sm text-ink outline-none transition focus:border-primary focus:bg-app"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs font-semibold text-ink-muted bg-input/20">
                      <th className="p-4 pl-6">Account User</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role Status</th>
                      <th className="p-4 text-center">Score / Level</th>
                      <th className="p-4 text-center">Active Streak</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => 
                      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()))
                    ).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-ink-muted text-sm">
                          No users matched search criteria.
                        </td>
                      </tr>
                    ) : (
                      users.filter(u => 
                        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()))
                      ).map(item => (
                        <tr key={item.id} className="border-b border-line/60 hover:bg-glass/5 transition-colors">
                          <td className="p-4 pl-6 flex items-center gap-3">
                            <img
                              src={item.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'}
                              alt="Avatar"
                              className="w-8 h-8 rounded-full border border-line object-cover"
                            />
                            <div>
                              <span className="font-semibold text-ink block">{item.name}</span>
                              <span className="text-xs text-ink-muted block">@{item.username || 'user'}</span>
                            </div>
                          </td>
                          <td className="p-4 text-ink-muted">{item.email}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[0.7rem] font-extrabold tracking-wide uppercase ${
                              item.role === 'superadmin' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-line text-ink-muted'
                            }`}>
                              {item.role || 'user'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="font-bold">Lvl {item.level || 1}</span>
                            <span className="text-[0.7rem] text-ink-muted block">{item.xp || 0} XP</span>
                          </td>
                          <td className="p-4 text-center font-bold text-orange-500">
                            {item.streak || 0} 🔥
                          </td>
                          <td className="p-4 pr-6 text-right flex items-center justify-end gap-2.5">
                            <button
                              disabled={submittingId === item.id || item.id === currentUser.id}
                              onClick={() => item.id && handleUpdateRole(item.id, item.role || 'user')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer disabled:opacity-40 ${
                                item.role === 'superadmin'
                                  ? 'bg-transparent text-primary border-primary/20 hover:bg-primary-soft'
                                  : 'bg-primary text-ink-on-primary border-primary hover:bg-primary-hover'
                              }`}
                            >
                              {item.role === 'superadmin' ? 'Demote User' : 'Promote Admin'}
                            </button>

                            <button
                              disabled={submittingId === item.id || item.id === currentUser.id}
                              onClick={() => item.id && handleDeleteUser(item.id)}
                              className="p-1.5 rounded-lg border border-danger-line text-danger hover:bg-danger-soft transition cursor-pointer disabled:opacity-40"
                              title="Delete User"
                            >
                              {submittingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SALES & REVENUE */}
          {currentTab === 'admin-sales' && sales && (
            <div className="flex flex-col gap-6">
              {/* Financial metric overview cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-card border border-line rounded-xl p-5 flex flex-col gap-3">
                  <span className="text-xs text-ink-muted uppercase tracking-wider font-semibold">Monthly Recurring Revenue</span>
                  <span className="text-3xl font-extrabold tracking-tight text-primary">${sales.mrr.toLocaleString()}</span>
                  <span className="text-xs text-ink-muted">Based on subscription plans</span>
                </div>

                <div className="bg-card border border-line rounded-xl p-5 flex flex-col gap-3">
                  <span className="text-xs text-ink-muted uppercase tracking-wider font-semibold">Total Revenue Gained</span>
                  <span className="text-3xl font-extrabold tracking-tight text-primary">${sales.total_revenue.toLocaleString()}</span>
                  <span className="text-xs text-ink-muted">Historical cumulative sales</span>
                </div>

                <div className="bg-card border border-line rounded-xl p-5 flex flex-col gap-3">
                  <span className="text-xs text-ink-muted uppercase tracking-wider font-semibold">Premium Subscribers</span>
                  <span className="text-3xl font-extrabold tracking-tight text-primary">{sales.premium_count} Users</span>
                  <span className="text-xs text-ink-muted">With active premium tiers</span>
                </div>

                <div className="bg-card border border-line rounded-xl p-5 flex flex-col gap-3">
                  <span className="text-xs text-ink-muted uppercase tracking-wider font-semibold">User Churn Rate</span>
                  <span className="text-3xl font-extrabold tracking-tight text-danger">{sales.churn_rate}%</span>
                  <span className="text-xs text-ink-muted">Average cancellations monthly</span>
                </div>
              </div>

              {/* Transactions logs table */}
              <div className="bg-card border border-line rounded-xl overflow-hidden shadow-lg">
                <div className="p-4 border-b border-line bg-input/20">
                  <h3 className="text-sm font-bold uppercase tracking-wider">Recent Subscription Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-line text-xs font-semibold text-ink-muted bg-input/20">
                        <th className="p-4 pl-6">Transaction ID</th>
                        <th className="p-4">Subscriber User</th>
                        <th className="p-4">Subscription Plan</th>
                        <th className="p-4">Billing Date</th>
                        <th className="p-4">Paid Amount</th>
                        <th className="p-4 pr-6 text-right">Payment Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-line/60 hover:bg-glass/5 transition-colors">
                          <td className="p-4 pl-6 font-bold text-ink-muted">#TXN{tx.id}</td>
                          <td className="p-4">
                            <span className="font-semibold block text-ink">{tx.user_name}</span>
                            <span className="text-xs text-ink-muted block">{tx.user_email}</span>
                          </td>
                          <td className="p-4 font-medium">{tx.plan}</td>
                          <td className="p-4 text-ink-muted">{tx.date}</td>
                          <td className="p-4 font-bold text-primary">${tx.amount.toFixed(2)}</td>
                          <td className="p-4 pr-6 text-right">
                            <span className={`px-2 py-0.5 rounded text-[0.7rem] font-bold uppercase ${
                              tx.status === 'completed'
                                ? 'bg-success/15 text-success border border-success/20'
                                : 'bg-danger/15 text-danger border border-danger/20'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MODULES CREATED */}
          {currentTab === 'admin-modules' && (
            <div className="flex-1 flex flex-col bg-card border border-line rounded-xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-line shrink-0 flex items-center bg-input/40 relative">
                <Search size={16} className="absolute left-7 text-ink-muted" />
                <input
                  type="text"
                  placeholder="Filter generated modules by title, creator, difficulty, or subject..."
                  className="w-full py-2.5 pl-11 pr-4 bg-input border border-line rounded-lg text-sm text-ink outline-none transition focus:border-primary focus:bg-app"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs font-semibold text-ink-muted bg-input/20">
                      <th className="p-4 pl-6">Module Title</th>
                      <th className="p-4">Subject</th>
                      <th className="p-4">Creator / Owner</th>
                      <th className="p-4 text-center">Questions</th>
                      <th className="p-4 text-center">Difficulty</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.filter(m =>
                      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      m.owner_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      m.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      m.difficulty.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-ink-muted text-sm">
                          No generated modules found.
                        </td>
                      </tr>
                    ) : (
                      modules.filter(m =>
                        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        m.owner_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        m.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        m.difficulty.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((item) => (
                        <tr key={item.id} className="border-b border-line/60 hover:bg-glass/5 transition-colors">
                          <td className="p-4 pl-6">
                            <span className="font-semibold text-ink block">{item.name}</span>
                            <span className="text-xs text-ink-muted block">Created {item.date}</span>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded text-[0.7rem] font-bold bg-primary-soft text-primary border border-primary-line">
                              {item.subject}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold block text-ink">{item.owner_name}</span>
                            <span className="text-xs text-ink-muted block">{item.owner_email}</span>
                          </td>
                          <td className="p-4 text-center font-bold">{item.questions_count} Qs</td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[0.7rem] font-bold uppercase ${
                              item.difficulty === 'hard'
                                ? 'bg-danger/10 text-danger'
                                : item.difficulty === 'medium'
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-success/10 text-success'
                            }`}>
                              {item.difficulty}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <button
                              disabled={submittingId === item.id}
                              onClick={() => handleDeleteModule(item.id)}
                              className="p-1.5 rounded-lg border border-danger-line text-danger hover:bg-danger-soft transition cursor-pointer disabled:opacity-40"
                              title="Delete Module"
                            >
                              {submittingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: GROUPS CREATED */}
          {currentTab === 'admin-groups' && (
            <div className="flex-1 flex flex-col bg-card border border-line rounded-xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-line shrink-0 flex items-center bg-input/40 relative">
                <Search size={16} className="absolute left-7 text-ink-muted" />
                <input
                  type="text"
                  placeholder="Filter collaborative circles by name, creator, or email..."
                  className="w-full py-2.5 pl-11 pr-4 bg-input border border-line rounded-lg text-sm text-ink outline-none transition focus:border-primary focus:bg-app"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs font-semibold text-ink-muted bg-input/20">
                      <th className="p-4 pl-6">Group Name</th>
                      <th className="p-4">Creator / Owner</th>
                      <th className="p-4 text-center">Active Members</th>
                      <th className="p-4 text-center">Linked Modules</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.filter(g =>
                      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      g.creator_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      g.creator_email.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-ink-muted text-sm">
                          No collaborative study groups found.
                        </td>
                      </tr>
                    ) : (
                      groups.filter(g =>
                        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        g.creator_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        g.creator_email.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((item) => (
                        <tr key={item.id} className="border-b border-line/60 hover:bg-glass/5 transition-colors">
                          <td className="p-4 pl-6 font-semibold text-ink">{item.name}</td>
                          <td className="p-4">
                            <span className="font-semibold block text-ink">{item.creator_name}</span>
                            <span className="text-xs text-ink-muted block">{item.creator_email}</span>
                          </td>
                          <td className="p-4 text-center font-bold">{item.members_count} Members</td>
                          <td className="p-4 text-center font-bold">{item.modules_count} Modules</td>
                          <td className="p-4 pr-6 text-right">
                            <button
                              disabled={submittingId === item.id}
                              onClick={() => handleDeleteGroup(item.id)}
                              className="p-1.5 rounded-lg border border-danger-line text-danger hover:bg-danger-soft transition cursor-pointer disabled:opacity-40"
                              title="Delete Study Group"
                            >
                              {submittingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
