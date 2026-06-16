import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Loader2, XCircle, X, AlertTriangle, MessageSquare, Sparkles, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../../config';
import type { User, DashboardTab, Module, QuizQuestionResponse } from '../../types';
import type { HealthData, AdminExam, AdminModule, AdminGroup, AdminSales, GroupPost } from './AdminPanel/types';
import { BAN_REASONS, DELETE_REASONS } from './AdminPanel/types';
import { AdminOverview } from './AdminPanel/AdminOverview';
import { AdminUsers } from './AdminPanel/AdminUsers';
import { AdminSalesView } from './AdminPanel/AdminSales';
import { AdminModules } from './AdminPanel/AdminModules';
import { AdminExams } from './AdminPanel/AdminExams';
import { AdminGroups } from './AdminPanel/AdminGroups';

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
  const [activeViewMembersGroup, setActiveViewMembersGroup] = useState<AdminGroup | null>(null);
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

    const tickInterval = setInterval(() => {
      setHealth(prev => prev ? {
        ...prev,
        uptime_seconds: prev.uptime_seconds + 1
      } : null);
    }, 1000);

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

  const renderSkeleton = () => {
    if (currentTab === 'admin-overview') {
      return (
        <div className="flex flex-col gap-6 animate-pulse-soft">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card border border-line rounded-xl p-5 flex flex-col gap-4 h-[130px]">
                <div className="h-4 bg-line rounded w-2/3" />
                <div className="h-8 bg-line rounded w-1/2 mt-1" />
                <div className="h-3 bg-line rounded w-3/4 mt-auto" />
              </div>
            ))}
          </div>

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

    return (
      <div className="flex-1 flex flex-col bg-card border border-line rounded-xl overflow-hidden shadow-lg animate-pulse-soft">
        <div className="p-4 border-b border-line bg-input/40 flex items-center h-[60px]">
          <div className="h-8 bg-line rounded w-full max-w-[400px]" />
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between border-b border-line pb-3">
              <div className="h-4 bg-line rounded w-1/4" />
              <div className="h-4 bg-line rounded w-1/6" />
              <div className="h-4 bg-line rounded w-1/6" />
              <div className="h-4 bg-line rounded w-1/6" />
            </div>
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


                  <div className="flex flex-col gap-3">
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

                    <button
                      type="button"
                      onClick={() => setManageAction('confirm-delete')}
                      className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition cursor-pointer text-center flex items-center justify-center gap-2"
                    >
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

      {/* ─── Superadmin View Group Members Modal ─────────────────── */}
      <AnimatePresence>
        {activeViewMembersGroup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-3000 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-card border border-line rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-left"
            >
              <button
                type="button"
                onClick={() => setActiveViewMembersGroup(null)}
                className="absolute top-4 right-4 bg-transparent border-0 text-ink-muted hover:text-ink p-1 rounded-lg transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <div className="border-b border-line pb-4 mb-4">
                <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                  <Users size={20} className="text-primary" /> Group Members
                </h3>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  List of members currently registered in <span className="font-semibold text-ink">"{activeViewMembersGroup.name}"</span>.
                </p>
              </div>

              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto border border-line rounded-xl p-4 bg-input/15 mb-6">
                <span className="text-xs font-bold text-ink-muted uppercase tracking-wider block mb-2">
                  Active Members ({activeViewMembersGroup.members?.length || 0})
                </span>
                {activeViewMembersGroup.members && activeViewMembersGroup.members.length > 0 ? (
                  activeViewMembersGroup.members.map((m) => (
                    <div key={m.id} className="flex flex-col py-2 border-b border-line/40 last:border-0 text-xs gap-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-ink text-sm">{m.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[0.6rem] bg-input border border-line capitalize font-medium text-ink-muted">{m.role}</span>
                      </div>
                      <span className="text-[0.75rem] text-ink-muted">{m.email}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-ink-muted italic">No active members in group.</span>
                )}
              </div>

              <div className="flex gap-3 justify-end border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setActiveViewMembersGroup(null)}
                  className="py-2 px-6 rounded-xl border border-line text-ink hover:bg-glass font-semibold text-sm transition cursor-pointer"
                >
                  Close
                </button>
              </div>
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
          {currentTab === 'admin-overview' && <AdminOverview health={health} setDashboardTab={setDashboardTab} />}
          {currentTab === 'admin-users' && (
            <AdminUsers
              users={users}
              searchQuery={searchQuery}
              submittingId={submittingId}
              currentUser={currentUser}
              onSearchChange={setSearchQuery}
              onRoleChange={(userId, targetRole, userName) => setRoleChangeTarget({ userId, targetRole, userName })}
              onDeleteUser={setDeleteConfirmUser}
              onSuspend={(userId, isSuspended, userName) => setSuspendConfirmTarget({ userId, isSuspended, userName })}
            />
          )}
          {currentTab === 'admin-sales' && <AdminSalesView sales={sales} />}
          {currentTab === 'admin-modules' && (
            <AdminModules
              modules={modules}
              searchQuery={searchQuery}
              submittingId={submittingId}
              onSearchChange={setSearchQuery}
              onViewModule={handleViewModule}
              onDeleteModule={setDeleteConfirmModule}
              onOpenSourceFile={handleOpenAdminSourceInNewTab}
            />
          )}
          {currentTab === 'admin-exams' && (
            <AdminExams
              exams={exams}
              searchQuery={searchQuery}
              submittingId={submittingId}
              onSearchChange={setSearchQuery}
              onDeleteExam={setDeleteConfirmExam}
            />
          )}
          {currentTab === 'admin-groups' && (
            <AdminGroups
              groups={groups}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onManageGroup={handleOpenManageGroup}
              onViewChat={handleViewChat}
              onViewMembers={setActiveViewMembersGroup}
            />
          )}
        </div>
      )}
    </div>
  );
};
