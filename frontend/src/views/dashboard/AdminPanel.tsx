import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Users, Layers, Activity, Search, Loader2, CheckCircle2, XCircle, Trash2, X, AlertTriangle, MessageSquare, Sparkles, Calendar, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../../config';
import type { User, DashboardTab, Module, QuizQuestionResponse } from '../../types';

const BAN_REASONS = [
  "Inappropriate discussion or posts",
  "Spamming or advertising",
  "Harassment or user complaints",
  "Sharing copyrighted exam answers"
];

const DELETE_REASONS = [
  "Duplicate/Inactive study group",
  "Severe violations of Terms of Service",
  "Spam/Ad campaign circle",
  "Requested by group creator"
];

interface HealthData {
  status: string;
  uptime_seconds: number;
  database: {
    status: string;
    latency_ms: number;
  };
  gemini?: {
    status: string;
    error: string | null;
  };
  counts: {
    users: number;
    modules: number;
    groups: number;
    exams: number;
  };
}

interface AdminExam {
  id: number;
  title: string;
  subject: string;
  date: string;
  priority: string;
  completed: boolean;
  score: string | null;
  days_remaining: number;
  owner_email: string;
  owner_name: string;
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
  has_source_file?: boolean;
}

interface AdminGroupMember {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AdminGroup {
  id: number;
  name: string;
  creator_email: string;
  creator_name: string;
  members_count: number;
  modules_count: number;
  is_banned?: boolean;
  members?: AdminGroupMember[];
}

interface GroupPost {
  id: number;
  group_id: number;
  user_id: number | null;
  user_name: string;
  user_avatar?: string | null;
  content: string;
  created_at: string;
  is_ai: boolean;
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
  const [exams, setExams] = useState<AdminExam[]>([]);
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [sales, setSales] = useState<AdminSales | null>(null);
  const [deleteConfirmModule, setDeleteConfirmModule] = useState<AdminModule | null>(null);
  const [deleteConfirmExam, setDeleteConfirmExam] = useState<AdminExam | null>(null);
  const [activeManageGroup, setActiveManageGroup] = useState<AdminGroup | null>(null);
  const [manageAction, setManageAction] = useState<'menu' | 'confirm-ban' | 'confirm-delete'>('menu');
  const [actionReason, setActionReason] = useState('');
  const [roleChangeTarget, setRoleChangeTarget] = useState<{ userId: number; targetRole: string; userName: string } | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [suspendConfirmTarget, setSuspendConfirmTarget] = useState<{ userId: number; isSuspended: boolean; userName: string } | null>(null);
  const [selectedViewModule, setSelectedViewModule] = useState<Module | null>(null);
  const [loadingModuleDetail, setLoadingModuleDetail] = useState(false);

  const [selectedChatGroup, setSelectedChatGroup] = useState<AdminGroup | null>(null);
  const [chatMessages, setChatMessages] = useState<GroupPost[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const fetchAdminData = useCallback(async () => {
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

      if (currentTab === 'admin-exams') {
        const examsRes = await fetch(`${API_BASE_URL}/api/admin/exams`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!examsRes.ok) throw new Error('Failed to fetch exams list.');
        const examsJson = await examsRes.json();
        setExams(examsJson);
      }

      if (currentTab === 'admin-groups') {
        const groupsRes = await fetch(`${API_BASE_URL}/api/admin/groups`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!groupsRes.ok) throw new Error('Failed to fetch groups list.');
        const groupsJson = await groupsRes.json();
        setGroups(groupsJson);
      }

    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [currentTab]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAdminData();
    setSearchQuery('');
  }, [currentTab, fetchAdminData]);

  // Live uptime increment and silent background sync for admin overview stats
  useEffect(() => {
    if (currentTab !== 'admin-overview') return;

    // 1. Tick up uptime seconds every second locally
    const tickInterval = setInterval(() => {
      setHealth(prev => prev ? {
        ...prev,
        uptime_seconds: prev.uptime_seconds + 1
      } : null);
    }, 1000);

    // 2. Poll the health endpoint silently every 30 seconds to keep stats fresh
    const syncInterval = setInterval(async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const healthRes = await fetch(`${API_BASE_URL}/api/admin/health`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (healthRes.ok) {
          const healthJson = await healthRes.json();
          setHealth(healthJson);
        }
      } catch (err) {
        console.error('Silent health poll failed:', err);
      }
    }, 30000);

    return () => {
      clearInterval(tickInterval);
      clearInterval(syncInterval);
    };
  }, [currentTab]);

  const handleUpdateRole = async (userId: number, targetRole: string) => {
    if (userId === currentUser.id && targetRole !== 'superadmin') {
      alert("You cannot demote yourself from superadmin!");
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
        body: JSON.stringify({ role: targetRole })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || 'Failed to update user role.');
      }

      const updatedUser = await res.json();
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: updatedUser.role } : u));
      setRoleChangeTarget(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating role.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (userId === currentUser.id) {
      alert("You cannot delete your own superadmin account!");
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
      setDeleteConfirmUser(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting user.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleUpdateSuspension = async (userId: number, isSuspended: boolean) => {
    if (userId === currentUser.id) {
      alert("You cannot suspend your own superadmin account!");
      return;
    }

    setSubmittingId(userId);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/suspend`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_suspended: isSuspended })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || 'Failed to update user suspension status.');
      }

      const updatedUser = await res.json();
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_suspended: updatedUser.is_suspended } : u));
      setSuspendConfirmTarget(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating suspension status.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDeleteModule = async (moduleId: number) => {
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
      setDeleteConfirmModule(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting module.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleViewModule = async (moduleId: number) => {
    setLoadingModuleDetail(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/modules/${moduleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch module details.');
      }
      const moduleData = await res.json();
      const mappedModule: Module = {
        id: moduleData.id,
        name: moduleData.name,
        subject: moduleData.subject,
        date: moduleData.date,
        size: moduleData.size,
        questionsCount: moduleData.questions_count || (moduleData.questions ? moduleData.questions.length : 0),
        questions: (moduleData.questions || []).map((q: QuizQuestionResponse) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correctAnswerIndex: q.correct_answer_index
        })),
        difficulty: moduleData.difficulty
      };
      setSelectedViewModule(mappedModule);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error fetching module details.');
    } finally {
      setLoadingModuleDetail(false);
    }
  };

  const handleOpenAdminSourceInNewTab = (m: AdminModule) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const newTab = window.open('', '_blank');
    if (newTab) {
      newTab.document.write(`
        <html>
          <head>
            <title>${m.name} - Source File</title>
            <style>
              body {
                background: #181818;
                color: #e0e0e0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 24px;
                display: flex;
                flex-direction: column;
                align-items: center;
                min-height: 100vh;
              }
              .container {
                width: 100%;
                max-width: 900px;
                background: #202020;
                border: 1px solid #333;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                box-sizing: border-box;
              }
              h1 {
                font-size: 24px;
                margin-top: 0;
                margin-bottom: 8px;
                color: #fff;
              }
              .filename {
                font-size: 14px;
                color: #888;
                margin-bottom: 24px;
              }
              pre {
                white-space: pre-wrap;
                word-wrap: break-word;
                font-size: 14px;
                line-height: 1.6;
                margin: 0;
              }
              .loading {
                font-size: 16px;
                color: #888;
                margin-top: 40vh;
              }
            </style>
          </head>
          <body>
            <div id="loader" class="loading">Loading source file content...</div>
            <div id="content" class="container" style="display: none;">
              <h1 id="title">${m.name}</h1>
              <div class="filename">${m.name}</div>
              <pre id="pre"></pre>
            </div>
          </body>
        </html>
      `);
      newTab.document.close();
    }

    fetch(`${API_BASE_URL}/api/admin/modules/${m.id}/file`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(async res => {
      if (!res.ok) throw new Error('No source file associated with this module or not found');
      const contentType = res.headers.get('content-type') || '';
      
      if (contentType.includes('pdf') || contentType.includes('image') || contentType.includes('text/html')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (newTab) {
          newTab.location.href = url;
        }
      } else {
        const text = await res.text();
        if (newTab) {
          const loader = newTab.document.getElementById('loader');
          const content = newTab.document.getElementById('content');
          const pre = newTab.document.getElementById('pre');
          if (loader) loader.style.display = 'none';
          if (content) content.style.display = 'block';
          if (pre) pre.textContent = text;
        }
      }
    })
    .catch((err) => {
      console.error('Error fetching admin module source file:', err);
      if (newTab) {
        newTab.document.body.innerHTML = `<div style="color: #ef4444; font-family: sans-serif; text-align: center; margin-top: 40vh; padding: 20px;">Failed to load file. ${err.message || ''}</div>`;
      }
    });
  };

  const handleDeleteExam = async (examId: number) => {
    setSubmittingId(examId);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/exams/${examId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || 'Failed to delete exam.');
      }

      setExams(prev => prev.filter(e => e.id !== examId));
      setDeleteConfirmExam(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting exam.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    setSubmittingId(groupId);
    const token = localStorage.getItem('token');
    const reasonParam = actionReason.trim() ? `?reason=${encodeURIComponent(actionReason.trim())}` : '';

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/groups/${groupId}${reasonParam}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || 'Failed to delete group.');
      }

      setGroups(prev => prev.filter(g => g.id !== groupId));
      setActiveManageGroup(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting group.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleViewChat = async (group: AdminGroup) => {
    setSelectedChatGroup(group);
    setLoadingChat(true);
    setChatError(null);
    setChatMessages([]);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/groups/${group.id}/discussion`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch group chat history.');
      }
      const data = await res.json();
      setChatMessages(data);
    } catch (err: unknown) {
      setChatError(err instanceof Error ? err.message : 'Failed to load chat.');
    } finally {
      setLoadingChat(false);
    }
  };

  const handleOpenManageGroup = (group: AdminGroup) => {
    setActiveManageGroup(group);
    setManageAction('menu');
    setActionReason('');
  };

  const handleToggleBanGroup = async (groupId: number, currentBanStatus: boolean) => {
    setSubmittingId(groupId);
    const token = localStorage.getItem('token');
    const actionText = currentBanStatus ? 'unban' : 'ban';

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/groups/${groupId}/ban`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          is_banned: !currentBanStatus,
          reason: actionReason.trim() || null
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || `Failed to ${actionText} study group.`);
      }

      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, is_banned: !currentBanStatus } : g));
      setActiveManageGroup(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : `Error during ${actionText} action.`);
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

  const renderSkeleton = () => {
    if (currentTab === 'admin-overview') {
      return (
        <div className="flex flex-col gap-6 animate-pulse-soft">
          {/* Metric Row Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card border border-line rounded-xl p-5 flex flex-col gap-4 h-[130px]">
                <div className="h-4 bg-line rounded w-2/3" />
                <div className="h-8 bg-line rounded w-1/2 mt-1" />
                <div className="h-3 bg-line rounded w-3/4 mt-auto" />
              </div>
            ))}
          </div>

          {/* Records Dashboard Summary Skeleton */}
          <div className="bg-card border border-line rounded-xl p-6 flex flex-col gap-6">
            <div className="h-4 bg-line rounded w-32 border-b border-line pb-2" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-input/40 border border-line rounded-lg p-5 flex items-center gap-4 h-[86px]">
                  <div className="w-11 h-11 rounded-full bg-line shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="h-3 bg-line rounded w-3/4" />
                    <div className="h-6 bg-line rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Table view skeleton (users, sales, modules, exams, groups)
    return (
      <div className="flex-1 flex flex-col bg-card border border-line rounded-xl overflow-hidden shadow-lg animate-pulse-soft">
        <div className="p-4 border-b border-line bg-input/40 flex items-center h-[60px]">
          <div className="h-8 bg-line rounded w-full max-w-[400px]" />
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="flex flex-col gap-4">
            {/* Header row placeholder */}
            <div className="flex justify-between border-b border-line pb-3">
              <div className="h-4 bg-line rounded w-1/4" />
              <div className="h-4 bg-line rounded w-1/6" />
              <div className="h-4 bg-line rounded w-1/6" />
              <div className="h-4 bg-line rounded w-1/6" />
            </div>
            {/* Table row placeholders */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex justify-between items-center py-4 border-b border-line/40">
                <div className="flex flex-col gap-2 w-1/4">
                  <div className="h-4 bg-line rounded w-3/4" />
                  <div className="h-3 bg-line rounded w-1/2" />
                </div>
                <div className="h-4 bg-line rounded w-1/6" />
                <div className="h-4 bg-line rounded w-1/6" />
                <div className="h-6 bg-line rounded w-[80px]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full text-ink p-6 max-md:p-4 overflow-y-auto">
      {/* ─── Role Change Confirmation Modal ───────────────────── */}
      <AnimatePresence>
        {roleChangeTarget && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-3000 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-card border border-line rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
            >
              {/* Close icon button */}
              <button
                type="button"
                onClick={() => setRoleChangeTarget(null)}
                className="absolute top-4 right-4 bg-transparent border-0 text-ink-muted hover:text-ink p-1 rounded-lg transition-colors cursor-pointer"
                aria-label="Cancel"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                  <Shield size={24} />
                </div>
                <h3 className="text-lg font-bold text-ink">Update User Role</h3>
                <p className="text-xs text-ink-muted mt-2 leading-relaxed">
                  Are you sure you want to change the role of <span className="font-semibold text-ink">"{roleChangeTarget.userName}"</span> to <span className="font-semibold text-primary">"{roleChangeTarget.targetRole}"</span>?
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setRoleChangeTarget(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-line text-ink hover:bg-glass font-semibold text-sm transition cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingId === roleChangeTarget.userId}
                  onClick={() => handleUpdateRole(roleChangeTarget.userId, roleChangeTarget.targetRole)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-ink-on-primary font-semibold text-sm transition cursor-pointer text-center flex items-center justify-center gap-2"
                >
                  {submittingId === roleChangeTarget.userId ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <span>Confirm Change</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Delete User Confirmation Modal ───────────────────── */}
      <AnimatePresence>
        {deleteConfirmUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-3000 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-card border border-line rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
            >
              {/* Close icon button */}
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="absolute top-4 right-4 bg-transparent border-0 text-ink-muted hover:text-ink p-1 rounded-lg transition-colors cursor-pointer"
                aria-label="Cancel"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-ink">Delete User Account</h3>
                <p className="text-xs text-ink-muted mt-2 leading-relaxed">
                  Are you sure you want to permanently delete the account for <span className="font-semibold text-ink">"{deleteConfirmUser.name}"</span> ({deleteConfirmUser.email})?
                  This will remove all associated study modules, metadata, and folders. This action is irreversible!
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmUser(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-line text-ink hover:bg-glass font-semibold text-sm transition cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingId === deleteConfirmUser.id}
                  onClick={() => deleteConfirmUser.id && handleDeleteUser(deleteConfirmUser.id)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition cursor-pointer text-center flex items-center justify-center gap-2"
                >
                  {submittingId === deleteConfirmUser.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <span>Delete User</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Suspend User Confirmation Modal ─────────────────── */}
      <AnimatePresence>
        {suspendConfirmTarget && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-3000 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-card border border-line rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
            >
              {/* Close icon button */}
              <button
                type="button"
                onClick={() => setSuspendConfirmTarget(null)}
                className="absolute top-4 right-4 bg-transparent border-0 text-ink-muted hover:text-ink p-1 rounded-lg transition-colors cursor-pointer"
                aria-label="Cancel"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-ink">
                  {suspendConfirmTarget.isSuspended ? 'Suspend User Account' : 'Unsuspend User Account'}
                </h3>
                <p className="text-xs text-ink-muted mt-2 leading-relaxed">
                  {suspendConfirmTarget.isSuspended ? (
                    <>
                      Are you sure you want to suspend the account for <span className="font-semibold text-ink">"{suspendConfirmTarget.userName}"</span>?
                      This user will be immediately logged out and blocked from logging in or making API requests.
                    </>
                  ) : (
                    <>
                      Are you sure you want to unsuspend the account for <span className="font-semibold text-ink">"{suspendConfirmTarget.userName}"</span>?
                      This user will regain access to their account and all features.
                    </>
                  )}
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setSuspendConfirmTarget(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-line text-ink hover:bg-glass font-semibold text-sm transition cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingId === suspendConfirmTarget.userId}
                  onClick={() => handleUpdateSuspension(suspendConfirmTarget.userId, suspendConfirmTarget.isSuspended)}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition cursor-pointer text-center flex items-center justify-center gap-2 ${
                    suspendConfirmTarget.isSuspended
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {submittingId === suspendConfirmTarget.userId ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <span>{suspendConfirmTarget.isSuspended ? 'Suspend User' : 'Unsuspend User'}</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── View Module Details Modal ───────────────────────── */}
      <AnimatePresence>
        {selectedViewModule && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-3000 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-card border border-line rounded-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative flex flex-col"
            >
              {/* Close icon button */}
              <button
                type="button"
                onClick={() => { setSelectedViewModule(null); }}
                className="absolute top-4 right-4 bg-transparent border-0 text-ink-muted hover:text-ink p-1 rounded-lg transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <div className="mb-6 border-b border-line pb-4 shrink-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-0.5 rounded text-[0.7rem] font-bold bg-primary-soft text-primary border border-primary-line">
                    {selectedViewModule.subject || 'General'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[0.7rem] font-bold uppercase ${
                    selectedViewModule.difficulty === 'hard'
                      ? 'bg-red-500/10 text-red-400'
                      : selectedViewModule.difficulty === 'medium'
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'bg-green-500/10 text-green-400'
                  }`}>
                    {selectedViewModule.difficulty || 'medium'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-ink">{selectedViewModule.name}</h3>
                <p className="text-xs text-ink-muted mt-1">
                  Generated on {selectedViewModule.date} • {selectedViewModule.questions?.length || 0} Questions
                </p>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-6 pr-1">
                  {selectedViewModule.questions?.map((q, idx) => (
                    <div key={q.id || idx} className="bg-input/20 border border-line rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex gap-2">
                        <span className="font-bold text-primary text-sm shrink-0">Q{idx + 1}.</span>
                        <span className="font-semibold text-ink text-sm">{q.question}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 pl-6">
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = oIdx === q.correctAnswerIndex;
                          return (
                            <div
                              key={oIdx}
                              className={`px-3 py-2 rounded-lg text-xs border transition-colors ${
                                isCorrect
                                  ? 'bg-green-500/10 text-green-400 border-green-500/30 font-semibold'
                                  : 'bg-transparent text-ink-muted border-line/55'
                              }`}
                            >
                              <span className="font-bold mr-1">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>

              <div className="flex justify-end mt-6 border-t border-line pt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedViewModule(null)}
                  className="py-2.5 px-6 rounded-xl bg-primary hover:bg-primary-hover text-ink-on-primary font-semibold text-sm transition cursor-pointer text-center"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Loading Module Details Overlay ───────────────────── */}
      {loadingModuleDetail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-3000 flex items-center justify-center">
          <div className="bg-card border border-line rounded-2xl p-6 flex flex-col items-center gap-3 shadow-2xl">
            <Loader2 className="animate-spin text-primary" size={32} />
            <span className="text-xs text-ink-muted font-bold uppercase tracking-wider">Fetching module details...</span>
          </div>
        </div>
      )}

      {/* ─── Delete Module Confirmation Modal ─────────────────── */}
      <AnimatePresence>
        {deleteConfirmModule && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-3000 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-card border border-line rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
            >
              {/* Close icon button */}
              <button
                type="button"
                onClick={() => setDeleteConfirmModule(null)}
                className="absolute top-4 right-4 bg-transparent border-0 text-ink-muted hover:text-ink p-1 rounded-lg transition-colors cursor-pointer"
                aria-label="Cancel"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-ink">Delete AI Module</h3>
                <p className="text-xs text-ink-muted mt-2 leading-relaxed">
                  Are you sure you want to permanently delete <span className="font-semibold text-ink">"{deleteConfirmModule.name}"</span>? 
                  This will remove all questions, historical scores, and user stats associated with it. This action is irreversible!
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmModule(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-line text-ink hover:bg-glass font-semibold text-sm transition cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingId === deleteConfirmModule.id}
                  onClick={() => handleDeleteModule(deleteConfirmModule.id)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition cursor-pointer text-center flex items-center justify-center gap-2"
                >
                  {submittingId === deleteConfirmModule.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <span>Delete Module</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Delete Exam Confirmation Modal ───────────────────── */}
      <AnimatePresence>
        {deleteConfirmExam && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-3000 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-card border border-line rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
            >
              {/* Close icon button */}
              <button
                type="button"
                onClick={() => setDeleteConfirmExam(null)}
                className="absolute top-4 right-4 bg-transparent border-0 text-ink-muted hover:text-ink p-1 rounded-lg transition-colors cursor-pointer"
                aria-label="Cancel"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-ink">Delete Scheduled Exam</h3>
                <p className="text-xs text-ink-muted mt-2 leading-relaxed">
                  Are you sure you want to permanently delete <span className="font-semibold text-ink">"{deleteConfirmExam.title}"</span>? 
                  This will remove the exam deadline, study targets, and progress tracker associated with it. This action is irreversible!
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmExam(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-line text-ink hover:bg-glass font-semibold text-sm transition cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingId === deleteConfirmExam.id}
                  onClick={() => handleDeleteExam(deleteConfirmExam.id)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition cursor-pointer text-center flex items-center justify-center gap-2"
                >
                  {submittingId === deleteConfirmExam.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <span>Delete Exam</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Manage Study Group Options Modal ─────────────────── */}
      <AnimatePresence>
        {activeManageGroup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-3000 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-card border border-line rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-left"
            >
              {/* Close icon button */}
              <button
                type="button"
                onClick={() => setActiveManageGroup(null)}
                className="absolute top-4 right-4 bg-transparent border-0 text-ink-muted hover:text-ink p-1 rounded-lg transition-colors cursor-pointer"
                aria-label="Cancel"
              >
                <X size={20} />
              </button>

              {manageAction === 'menu' && (
                <div className="flex flex-col gap-6">
                  <div className="border-b border-line pb-4">
                    <h3 className="text-lg font-bold text-ink">Manage Study Group</h3>
                    <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                      Select an administrative action for <span className="font-semibold text-ink">"{activeManageGroup.name}"</span>.
                    </p>
                  </div>
                  {/* Group Members List */}
                  <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto border border-line rounded-xl p-3 bg-input/15 mb-2">
                    <span className="text-xs font-bold text-ink-muted uppercase tracking-wider block mb-1">
                      Group Members ({activeManageGroup.members?.length || 0})
                    </span>
                    {activeManageGroup.members && activeManageGroup.members.length > 0 ? (
                      activeManageGroup.members.map((m) => (
                        <div key={m.id} className="flex flex-col py-1.5 border-b border-line/40 last:border-0 text-xs gap-0.5">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-ink">{m.name}</span>
                            <span className="px-1 py-0.2 rounded text-[0.6rem] bg-input border border-line capitalize font-medium text-ink-muted">{m.role}</span>
                          </div>
                          <span className="text-[0.7rem] text-ink-muted">{m.email}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-ink-muted italic">No active members in group.</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* Ban/Unban Option */}
                    <button
                      type="button"
                      onClick={() => setManageAction('confirm-ban')}
                      className={`w-full py-3 px-4 rounded-xl border font-semibold text-sm transition cursor-pointer text-center flex items-center justify-center gap-2 ${
                        activeManageGroup.is_banned
                          ? 'bg-[rgba(16,185,129,0.1)] text-emerald-400 border-emerald-500/20 hover:bg-[rgba(16,185,129,0.2)]'
                          : 'bg-red-600/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                      }`}
                    >
                      {activeManageGroup.is_banned ? 'Unban Study Group' : 'Ban Study Group'}
                    </button>

                    {/* Delete Option */}
                    <button
                      type="button"
                      onClick={() => setManageAction('confirm-delete')}
                      className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition cursor-pointer text-center flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      <span>Delete Study Group</span>
                    </button>
                  </div>

                  <div className="flex gap-3 justify-end border-t border-line pt-4">
                    <button
                      type="button"
                      onClick={() => setActiveManageGroup(null)}
                      className="py-2 px-6 rounded-xl border border-line text-ink hover:bg-glass font-semibold text-sm transition cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {manageAction === 'confirm-ban' && (
                <div className="flex flex-col gap-6 text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                    activeManageGroup.is_banned ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-ink">
                      {activeManageGroup.is_banned ? 'Unban Study Group?' : 'Ban Study Group?'}
                    </h3>
                    <p className="text-xs text-ink-muted mt-2 leading-relaxed">
                      {activeManageGroup.is_banned ? (
                        <>
                          Are you sure you want to unban <span className="font-semibold text-ink">"{activeManageGroup.name}"</span>? 
                          Members will regain access to the study group dashboard, discussion logs, and modules.
                        </>
                      ) : (
                        <>
                          Are you sure you want to ban <span className="font-semibold text-ink">"{activeManageGroup.name}"</span>? 
                          Members will lose access and it will be hidden from their active study groups list.
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-semibold text-ink-muted">Reason (Optional)</label>
                    <textarea
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="Add a reason to explain to members..."
                      className="w-full min-h-[70px] py-2 px-3 bg-input border border-line rounded-lg text-xs text-ink outline-none focus:border-primary transition"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {BAN_REASONS.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setActionReason(r)}
                          className="px-2 py-1 bg-glass hover:bg-glass-strong border border-line rounded text-[0.68rem] text-ink-muted hover:text-ink transition cursor-pointer"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setManageAction('menu')}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-line text-ink hover:bg-glass font-semibold text-sm transition cursor-pointer text-center"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={submittingId === activeManageGroup.id}
                      onClick={() => handleToggleBanGroup(activeManageGroup.id, !!activeManageGroup.is_banned)}
                      className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition cursor-pointer text-center flex items-center justify-center gap-2 text-white ${
                        activeManageGroup.is_banned
                          ? 'bg-emerald-600 hover:bg-emerald-500'
                          : 'bg-red-600 hover:bg-red-500'
                      }`}
                    >
                      {submittingId === activeManageGroup.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <span>{activeManageGroup.is_banned ? 'Confirm Unban' : 'Confirm Ban'}</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {manageAction === 'confirm-delete' && (
                <div className="flex flex-col gap-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-ink">Delete Study Group?</h3>
                    <p className="text-xs text-ink-muted mt-2 leading-relaxed">
                      Are you sure you want to permanently delete <span className="font-semibold text-ink">"{activeManageGroup.name}"</span>? 
                      This will remove all group posts, study materials, and memberships. This action is irreversible!
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-semibold text-ink-muted">Reason (Optional)</label>
                    <textarea
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="Add a reason to explain to members..."
                      className="w-full min-h-[70px] py-2 px-3 bg-input border border-line rounded-lg text-xs text-ink outline-none focus:border-primary transition"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {DELETE_REASONS.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setActionReason(r)}
                          className="px-2 py-1 bg-glass hover:bg-glass-strong border border-line rounded text-[0.68rem] text-ink-muted hover:text-ink transition cursor-pointer"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setManageAction('menu')}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-line text-ink hover:bg-glass font-semibold text-sm transition cursor-pointer text-center"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={submittingId === activeManageGroup.id}
                      onClick={() => handleDeleteGroup(activeManageGroup.id)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition cursor-pointer text-center flex items-center justify-center gap-2"
                    >
                      {submittingId === activeManageGroup.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <span>Confirm Delete</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Group Chat Viewer Modal ─────────────────── */}
      <AnimatePresence>
        {selectedChatGroup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-3000 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-card border border-line rounded-2xl p-6 sm:p-8 max-w-2xl w-full h-[80vh] flex flex-col shadow-2xl relative"
            >
              {/* Close icon button */}
              <button
                type="button"
                onClick={() => setSelectedChatGroup(null)}
                className="absolute top-4 right-4 bg-transparent border-0 text-ink-muted hover:text-ink p-1 rounded-lg transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <div className="border-b border-line pb-4 mb-4 shrink-0 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center text-primary shadow-glow-primary-soft">
                  <MessageSquare size={20} />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <h3 className="text-lg font-bold text-ink truncate">{selectedChatGroup.name} Chat History</h3>
                  <p className="text-xs text-ink-muted mt-0.5 truncate">
                    Creator: <span className="font-semibold text-ink">{selectedChatGroup.creator_name}</span> ({selectedChatGroup.creator_email})
                  </p>
                </div>
              </div>

              {/* Chat Content Area */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-1 min-h-0">
                {loadingChat ? (
                  <div className="flex flex-col items-center justify-center h-full text-ink-muted gap-2">
                    <Loader2 size={30} className="animate-spin text-primary" />
                    <span className="text-xs">Loading chat logs...</span>
                  </div>
                ) : chatError ? (
                  <div className="flex flex-col items-center justify-center h-full text-danger gap-2">
                    <XCircle size={30} />
                    <span className="text-sm font-semibold">{chatError}</span>
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-ink-muted p-8 text-center gap-2">
                    <MessageSquare size={36} className="opacity-40" />
                    <span className="font-semibold text-sm">No messages yet</span>
                    <span className="text-xs max-w-xs leading-relaxed">This group has no discussions recorded yet.</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatMessages.map((msg) => {
                      const isAi = msg.is_ai;
                      return (
                        <div key={msg.id} className="flex flex-col w-full items-start">
                          <div
                            className={`flex items-start gap-3 p-3.5 rounded-xl w-full text-left ${
                              isAi
                                ? 'bg-[linear-gradient(135deg,rgba(62,207,142,0.06),rgba(6,182,212,0.06))] border border-primary-line/45'
                                : 'bg-input border border-line'
                            }`}
                          >
                            {isAi ? (
                              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[linear-gradient(135deg,var(--primary),var(--accent-cyan))] text-ink-on-primary font-bold shadow-md shrink-0">
                                <Sparkles size={16} />
                              </div>
                            ) : msg.user_avatar ? (
                              <img
                                src={msg.user_avatar}
                                alt={msg.user_name}
                                className="w-8 h-8 rounded-full object-cover shrink-0 border border-line"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border border-line bg-glass-strong text-ink">
                                {msg.user_name.charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline mb-1 gap-2 flex-wrap justify-between">
                                <span className="text-xs font-bold text-ink flex items-center gap-1.5 truncate">
                                  {msg.user_name}
                                  {isAi && (
                                    <span className="text-[0.62rem] font-bold bg-[linear-gradient(135deg,var(--primary),var(--accent-cyan))] text-ink-on-primary px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-[0.9] origin-left">
                                      AI Tutor
                                    </span>
                                  )}
                                </span>
                                <span className="text-[0.65rem] text-ink-muted">
                                  {msg.created_at}
                                </span>
                              </div>
                              <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap select-text selection:bg-primary-soft text-left break-words">
                                {msg.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-line shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedChatGroup(null)}
                  className="py-2 px-6 rounded-xl border border-line text-ink hover:bg-glass font-semibold text-sm transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              {currentTab === 'admin-exams' && 'Scheduled Exams'}
              {currentTab === 'admin-groups' && 'Collaborative Circles'}
            </h2>
            <span className="text-xs text-ink-muted">
              {currentTab === 'admin-overview' && 'System statistics, database status, and API health metrics'}
              {currentTab === 'admin-users' && 'Manage registered accounts, modify roles, and administrative cleanups'}
              {currentTab === 'admin-sales' && 'Track platform revenue subscriptions, payouts, and transactions history'}
              {currentTab === 'admin-modules' && 'View all AI-generated module summaries created across the platform'}
              {currentTab === 'admin-exams' && 'Monitor exam schedules, priorities, due dates, and completion status'}
              {currentTab === 'admin-groups' && 'Monitor all collaborative circles, group sizes, and creators'}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Error banner */}
      {error && (
        <div className="bg-danger-soft border border-danger-line text-danger p-4 rounded-xl flex items-center gap-3 shrink-0">
          <XCircle size={20} className="shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Loading State Skeleton */}
      {loading && !error && renderSkeleton()}

      {/* Content Renderers */}
      {!loading && !error && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* TAB 1: OVERVIEW */}
          {currentTab === 'admin-overview' && health && (
            <div className="flex flex-col gap-6">
              {/* Metric Row */}
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

              {/* Records Dashboard Summary */}
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

                  <div onClick={() => {
                    setDashboardTab('admin-modules');
                  }} className="bg-input/40 border border-line rounded-lg p-5 flex items-center gap-4 cursor-pointer hover:bg-glass-strong transition-all duration-150">
                    <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Layers size={22} />
                    </div>
                    <div>
                      <span className="text-xs text-ink-muted block font-medium">AI Study Modules</span>
                      <span className="text-2xl font-extrabold">{health.counts.modules}</span>
                    </div>
                  </div>

                  <div onClick={() => {
                    setDashboardTab('admin-exams');
                  }} className="bg-input/40 border border-line rounded-lg p-5 flex items-center gap-4 cursor-pointer hover:bg-glass-strong transition-all duration-150">
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
                      !u.email.toLowerCase().endsWith('@example.com') && (
                        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()))
                      )
                    ).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-ink-muted text-sm">
                          No users matched search criteria.
                        </td>
                      </tr>
                    ) : (
                      users.filter(u => 
                        !u.email.toLowerCase().endsWith('@example.com') && (
                          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()))
                        )
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
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-[0.7rem] font-extrabold tracking-wide uppercase ${
                                item.role === 'superadmin'
                                  ? 'bg-primary/10 text-primary border border-primary/20'
                                  : item.role === 'premium'
                                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                  : 'bg-line text-ink-muted'
                              }`}>
                                {item.role || 'user'}
                              </span>
                              {item.is_suspended && (
                                <span className="px-2 py-0.5 rounded text-[0.7rem] font-extrabold tracking-wide uppercase bg-red-500/10 text-red-500 border border-red-500/20">
                                  Suspended
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="font-bold">Lvl {item.level || 1}</span>
                            <span className="text-[0.7rem] text-ink-muted block">{item.xp || 0} XP</span>
                          </td>
                          <td className="p-4 text-center font-bold text-orange-500">
                            {item.streak || 0} 🔥
                          </td>
                          <td className="p-4 pr-6 text-right flex items-center justify-end gap-2.5">
                            {/* Pro Status Toggle */}
                            {item.role !== 'superadmin' && (
                              <button
                                disabled={submittingId === item.id}
                                onClick={() => item.id && setRoleChangeTarget({ userId: item.id, targetRole: item.role === 'premium' ? 'user' : 'premium', userName: item.name })}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer disabled:opacity-40 ${
                                  item.role === 'premium'
                                    ? 'bg-transparent text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/10'
                                    : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-500'
                                }`}
                              >
                                {item.role === 'premium' ? 'Remove Pro' : 'Make Pro'}
                              </button>
                            )}

                            {/* Admin Status Toggle */}
                            <button
                              disabled={submittingId === item.id || item.id === currentUser.id}
                              onClick={() => item.id && setRoleChangeTarget({ userId: item.id, targetRole: item.role === 'superadmin' ? 'user' : 'superadmin', userName: item.name })}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer disabled:opacity-40 ${
                                item.role === 'superadmin'
                                  ? 'bg-transparent text-primary border-primary/20 hover:bg-primary-soft'
                                  : 'bg-primary text-ink-on-primary border-primary hover:bg-primary-hover'
                              }`}
                            >
                              {item.role === 'superadmin' ? 'Demote Admin' : 'Promote Admin'}
                            </button>

                            {/* Suspend Status Toggle */}
                            {item.id !== currentUser.id && (
                              <button
                                disabled={submittingId === item.id}
                                onClick={() => item.id && setSuspendConfirmTarget({ userId: item.id, isSuspended: !item.is_suspended, userName: item.name })}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer disabled:opacity-40 ${
                                  item.is_suspended
                                    ? 'bg-transparent text-amber-500 border-amber-500/20 hover:bg-amber-500/10'
                                    : 'bg-amber-600 text-white border-amber-600 hover:bg-amber-500'
                                }`}
                                title={item.is_suspended ? 'Unsuspend User' : 'Suspend User'}
                              >
                                {item.is_suspended ? 'Unsuspend' : 'Suspend'}
                              </button>
                            )}

                            {/* Delete User */}
                            <button
                              disabled={submittingId === item.id || item.id === currentUser.id}
                              onClick={() => item.id && setDeleteConfirmUser(item)}
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
                        <tr
                          key={item.id}
                          onClick={() => handleViewModule(item.id)}
                          className="border-b border-line/60 hover:bg-glass/5 transition-colors cursor-pointer"
                        >
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
                          <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              {item.has_source_file && (
                                <button
                                  onClick={() => handleOpenAdminSourceInNewTab(item)}
                                  className="p-1.5 rounded-lg border border-primary-line text-primary hover:bg-primary-soft/20 transition cursor-pointer"
                                  title="View Source File"
                                >
                                  <FileText size={14} />
                                </button>
                              )}
                              <button
                                disabled={submittingId === item.id}
                                onClick={() => setDeleteConfirmModule(item)}
                                className="p-1.5 rounded-lg border border-danger-line text-danger hover:bg-danger-soft transition cursor-pointer disabled:opacity-40"
                                title="Delete Module"
                              >
                                {submittingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4b: SCHEDULED EXAMS */}
          {currentTab === 'admin-exams' && (
            <div className="flex-1 flex flex-col bg-card border border-line rounded-xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-line shrink-0 flex items-center bg-input/40 relative">
                <Search size={16} className="absolute left-7 text-ink-muted" />
                <input
                  type="text"
                  placeholder="Filter scheduled exams by title, creator, or subject..."
                  className="w-full py-2.5 pl-11 pr-4 bg-input border border-line rounded-lg text-sm text-ink outline-none transition focus:border-primary focus:bg-app"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs font-semibold text-ink-muted bg-input/20">
                      <th className="p-4 pl-6">Exam Title</th>
                      <th className="p-4">Subject</th>
                      <th className="p-4">Creator / Owner</th>
                      <th className="p-4 text-center">Remaining</th>
                      <th className="p-4 text-center">Priority</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.filter(e =>
                      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      e.owner_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      e.owner_name.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-ink-muted text-sm">
                          No scheduled exams found.
                        </td>
                      </tr>
                    ) : (
                      exams.filter(e =>
                        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        e.owner_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        e.owner_name.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((item) => (
                        <tr key={item.id} className="border-b border-line/60 hover:bg-glass/5 transition-colors">
                          <td className="p-4 pl-6">
                            <span className="font-semibold text-ink block">{item.title}</span>
                            <span className="text-xs text-ink-muted block">Due {item.date}</span>
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
                          <td className="p-4 text-center font-bold">
                            {item.completed ? (
                              <span className="text-xs text-ink-muted">-</span>
                            ) : (
                              <span>{item.days_remaining} {item.days_remaining === 1 ? 'day' : 'days'}</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[0.7rem] font-bold uppercase ${
                              item.priority === 'high'
                                ? 'bg-danger/10 text-danger'
                                : item.priority === 'medium'
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-primary-soft text-primary border border-primary-line'
                            }`}>
                              {item.priority}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {item.completed ? (
                              <span className="px-2 py-0.5 rounded text-[0.7rem] font-bold bg-success/10 text-success uppercase">
                                Completed {item.score ? `(${item.score})` : ''}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[0.7rem] font-bold bg-glass text-ink-muted uppercase">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <button
                              disabled={submittingId === item.id}
                              onClick={() => setDeleteConfirmExam(item)}
                              className="p-1.5 rounded-lg border border-danger-line text-danger hover:bg-danger-soft transition cursor-pointer disabled:opacity-40"
                              title="Delete Exam"
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
                      g.creator_email !== "System/Unknown" &&
                      !g.creator_email.toLowerCase().endsWith('@example.com') && (
                        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        g.creator_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        g.creator_email.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                    ).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-ink-muted text-sm">
                          No collaborative study groups found.
                        </td>
                      </tr>
                    ) : (
                      groups.filter(g =>
                        g.creator_email !== "System/Unknown" &&
                        !g.creator_email.toLowerCase().endsWith('@example.com') && (
                          g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.creator_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.creator_email.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                      ).map((item) => (
                        <tr key={item.id} className="border-b border-line/60 hover:bg-glass/5 transition-colors">
                          <td className="p-4 pl-6">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-ink">{item.name}</span>
                              {item.is_banned && (
                                <span className="px-1.5 py-0.5 rounded text-[0.62rem] font-extrabold tracking-wide uppercase bg-danger/15 text-danger border border-danger-line/30">
                                  Banned
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold block text-ink">{item.creator_name}</span>
                            <span className="text-xs text-ink-muted block">{item.creator_email}</span>
                          </td>
                          <td className="p-4 text-center font-bold">{item.members_count} Members</td>
                          <td className="p-4 text-center font-bold">{item.modules_count} Modules</td>
                          <td className="p-4 pr-6 text-right flex items-center justify-end gap-2.5">
                            {/* Manage Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenManageGroup(item)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-line text-ink-muted hover:text-primary hover:bg-primary-soft transition cursor-pointer"
                              title="Manage Study Group"
                            >
                              Manage
                            </button>

                            <button
                              type="button"
                              onClick={() => handleViewChat(item)}
                              className="p-1.5 rounded-lg border border-line text-ink-muted hover:text-primary hover:bg-primary-soft transition cursor-pointer"
                              title="View Group Chat"
                            >
                              <MessageSquare size={14} />
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
