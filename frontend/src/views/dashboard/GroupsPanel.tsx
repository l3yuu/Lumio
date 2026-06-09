import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight, X, Users, Mail, Check, Settings, Bell } from 'lucide-react';
import type { User, Module, StudyGroup, GroupInvitation, StudyGroupResponse, ModuleResponse, QuizQuestionResponse, GroupQuizSessionResponse, GroupQuizRankResponse } from '../../types';
import { API_BASE_URL } from '../../config';

interface GroupsPanelProps {
  groups: StudyGroup[];
  user: User;
  selectedGroupId: number | null;
  setSelectedGroupId: (id: number | null) => void;
  startGroupQuiz: (module: Module, groupId: number) => void;
  completeQuest: (actionType: 'study_group') => void;
  setIsGroupModalOpen: (v: boolean) => void;
  modules: Module[];
  setGroups: React.Dispatch<React.SetStateAction<StudyGroup[]>>;
  invitations: GroupInvitation[];
  onAcceptInvitation: (id: number) => void;
  onDeclineInvitation: (id: number) => void;
}

export const GroupsPanel: React.FC<GroupsPanelProps> = ({
  groups,
  user,
  selectedGroupId,
  setSelectedGroupId,
  startGroupQuiz,
  completeQuest,
  setIsGroupModalOpen,
  modules,
  setGroups,
  invitations,
  onAcceptInvitation,
  onDeclineInvitation,
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [isLeaving, setIsLeaving] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [groupNotifsEnabled, setGroupNotifsEnabled] = useState(true);
  const [isTogglingNotifs, setIsTogglingNotifs] = useState(false);

  useEffect(() => {
    if (!groupSettingsOpen || selectedGroupId === null) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE_URL}/api/groups/${selectedGroupId}/notification-pref`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data) setGroupNotifsEnabled(data.enabled);
    })
    .catch(() => {});
  }, [groupSettingsOpen, selectedGroupId]);

  const handleToggleNotifs = () => {
    if (selectedGroupId === null) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsTogglingNotifs(true);
    fetch(`${API_BASE_URL}/api/groups/${selectedGroupId}/notifications/toggle`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data) setGroupNotifsEnabled(data.enabled);
    })
    .catch(() => {})
    .finally(() => setIsTogglingNotifs(false));
  };

  const handleLeaveGroup = () => {
    const activeGroup = groups.find(g => g.id === selectedGroupId);
    if (!activeGroup) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsLeaving(true);
    fetch(`${API_BASE_URL}/api/groups/${activeGroup.id}/leave`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(async res => {
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || 'Failed to leave group');
      }
      setGroups(prev => prev.filter(g => g.id !== activeGroup.id));
      setSelectedGroupId(null);
    })
    .catch(err => alert(err.message))
    .finally(() => { setIsLeaving(false); setConfirmLeave(false); setGroupSettingsOpen(false); });
  };

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || isInviting) return;
    const activeGroup = groups.find(g => g.id === selectedGroupId);
    if (!activeGroup) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setIsInviting(true);
    setInviteError('');
    setInviteSuccess(false);

    fetch(`${API_BASE_URL}/api/groups/${activeGroup.id}/invite`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: inviteEmail.trim() })
    })
    .then(async res => {
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail || 'Failed to send invitation');
      return data;
    })
    .then(() => {
      setInviteEmail('');
      setInviteSuccess(true);
      setTimeout(() => setInviteSuccess(false), 3000);
    })
    .catch(err => {
      setInviteError(err.message || 'Error sending invitation');
    })
    .finally(() => {
      setIsInviting(false);
    });
  };

  const handleShareModule = () => {
    if (!selectedModuleId || isSharing) return;
    const activeGroup = groups.find(g => g.id === selectedGroupId);
    if (!activeGroup) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setIsSharing(true);
    fetch(`${API_BASE_URL}/api/groups/${activeGroup.id}/share-module/${selectedModuleId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(async res => {
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.detail || 'Failed to share module with group');
      }
      return data;
    })
    .then((updatedGroup: StudyGroupResponse) => {
      const mapped: StudyGroup = {
        id: updatedGroup.id,
        name: updatedGroup.name,
        members: updatedGroup.members || [],
        modules: updatedGroup.modules ? updatedGroup.modules.map((m: ModuleResponse) => ({
          id: m.id,
          name: m.name,
          date: m.date,
          size: m.size,
          subject: m.subject || 'General',
          questionsCount: m.questionsCount !== undefined ? m.questionsCount : (m.questions ? m.questions.length : 0),
          questions: m.questions ? m.questions.map((q: QuizQuestionResponse) => ({
            id: q.id,
            question: q.question,
            options: q.options,
            correctAnswerIndex: q.correct_answer_index
          })) : []
        })) : [],
        quizSessions: updatedGroup.quiz_sessions ? updatedGroup.quiz_sessions.map((s: GroupQuizSessionResponse) => ({
          id: s.id,
          moduleName: s.module_name,
          date: s.date,
          avgScore: s.avg_score,
          rankings: s.rankings ? s.rankings.map((r: GroupQuizRankResponse) => ({
            name: r.name,
            score: r.score,
            percentage: r.percentage,
            time: r.time,
            isUser: r.is_user
          })) : []
        })) : []
      };
      setGroups(groups.map(g => g.id === mapped.id ? mapped : g));
      setSelectedModuleId('');
      setIsShareModalOpen(false);
    })
    .catch(err => {
      console.error(err);
      alert(err.message || 'Error sharing module');
    })
    .finally(() => {
      setIsSharing(false);
    });
  };

  if (selectedGroupId !== null) {
    const activeGroup = groups.find(g => g.id === selectedGroupId);
    if (!activeGroup) return null;

    return (
      <div>
        <div className="bg-[linear-gradient(135deg,rgba(62,207,142,0.04),rgba(6,182,212,0.04))] border border-line rounded-xl p-6 mb-8">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <button onClick={() => { setSelectedGroupId(null); setConfirmLeave(false); setGroupSettingsOpen(false); }} className="btn btn-outline border-none bg-transparent hover:bg-glass text-ink-muted hover:text-ink px-3 py-1.5 text-xs mb-4 inline-flex items-center gap-1">
                ← Back to Groups
              </button>
              <h2 className="text-[1.8rem] mb-1">{activeGroup.name}</h2>
              <p className="text-ink-muted text-[0.9rem]">Collaborative Study Room</p>
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[0.7rem] font-bold uppercase tracking-wider py-1 px-2.5 rounded-full border bg-primary-soft text-primary border-primary-line">Group Active</span>
                <button
                  onClick={() => setGroupSettingsOpen(!groupSettingsOpen)}
                  className={`p-1.5 rounded-lg border transition-all duration-200 ${groupSettingsOpen ? 'bg-primary text-ink-on-primary border-primary' : 'bg-transparent border-line text-ink-muted hover:bg-glass hover:text-ink'}`}
                  title="Group Settings"
                >
                  <Settings size={14} />
                </button>
              </div>
              <span className="text-[0.8rem] text-ink-muted">{activeGroup.members.filter(m => m.email !== user.email && m.online).length + 1} online study partners</span>
            </div>
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t border-line flex-wrap gap-4">
            <div className="flex items-center">
              {/* Current user */}
              <div className="relative -ml-2 first:ml-0">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border-2 border-primary object-cover"
                    title={`${user.name} (You)`} />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-primary text-ink-on-primary border-2 border-primary"
                    title={`${user.name} (You)`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Always online dot for yourself */}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-app ring-0" />
              </div>
              {activeGroup.members.filter(m => m.email !== user.email).map((m, idx) => (
                <div key={idx} className="relative -ml-2">
                  {m.avatar ? (
                    <img src={m.avatar} alt={m.name} referrerPolicy="no-referrer"
                      className={`w-8 h-8 rounded-full border-2 object-cover ${
                        m.online ? 'border-primary' : 'border-card'
                      }`}
                      title={`${m.name} (${m.online ? 'Online' : 'Offline'})`} />
                  ) : (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-glass-strong border-2 ${
                        m.online ? 'border-primary text-primary' : 'border-card text-ink'
                      }`}
                      title={`${m.name} (${m.online ? 'Online' : 'Offline'})`}>
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Online / Offline status dot */}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-app ${
                    m.online
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-zinc-500'
                  }`} title={m.online ? 'Online' : 'Offline'} />
                </div>
              ))}
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <form onSubmit={handleInviteMember} className="flex items-center gap-2 max-w-sm w-full sm:justify-end">
                <input
                  type="email"
                  placeholder="Partner's email..."
                  value={inviteEmail}
                  onChange={(e) => { setInviteEmail(e.target.value); setInviteError(''); }}
                  disabled={isInviting || inviteSuccess}
                  className="py-1.5 px-3 text-xs bg-input border border-line rounded-lg text-ink transition-all duration-150 outline-none focus:border-primary w-[180px] disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                />
                <button
                  type="submit"
                  disabled={isInviting || inviteSuccess}
                  className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-semibold text-xs transition-all duration-200 cursor-pointer border disabled:cursor-not-allowed ${
                    inviteSuccess
                      ? 'bg-emerald-500 text-white border-emerald-500 opacity-90'
                      : 'bg-primary text-ink-on-primary border-primary hover:bg-primary-hover hover:border-primary-hover disabled:opacity-60'
                  }`}
                >
                  {inviteSuccess ? (
                    <><Check size={12} /> Invitation sent!</>
                  ) : (
                    <><Plus size={12} /> Send Invite</>
                  )}
                </button>
              </form>
              {inviteError && (
                <span className="text-[0.72rem] text-red-400">{inviteError}</span>
              )}
            </div>
          </div>
        </div>

        {groupSettingsOpen ? (
          <div className="bg-card border border-line rounded-xl p-5 mt-6">
            <h3 className="text-[1.15rem] mb-5 flex items-center gap-2">
              <Settings size={18} /> Group Settings
            </h3>
            <div className="flex flex-col gap-4">
              {/* Notification Toggle */}
              <div className="flex items-center justify-between p-4 bg-app border border-line rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell size={18} className="text-ink-muted" />
                  <div>
                    <p className="text-sm font-semibold text-ink">Group Notifications</p>
                    <p className="text-xs text-ink-muted mt-0.5">Receive updates when members share modules or take quizzes.</p>
                  </div>
                </div>
                <button
                  onClick={handleToggleNotifs}
                  disabled={isTogglingNotifs}
                  className={`relative w-11 h-6 rounded-full transition-all duration-200 cursor-pointer ${
                    groupNotifsEnabled ? 'bg-primary' : 'bg-input border border-line'
                  } ${isTogglingNotifs ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
                    groupNotifsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Member List */}
              <div className="p-4 bg-app border border-line rounded-lg">
                <p className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                  <Users size={16} /> Members ({activeGroup.members.length})
                </p>
                <div className="flex flex-col gap-2">
                  {/* Current user */}
                  <div className="flex items-center gap-3 py-2 px-3 bg-card rounded-lg">
                    <div className="relative">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border-2 border-primary" />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-primary text-ink-on-primary border-2 border-primary">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-app" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{user.name} <span className="text-xs text-ink-muted font-normal">(You)</span></p>
                      <p className="text-xs text-ink-muted truncate">{user.email}</p>
                    </div>
                    <span className="text-[0.65rem] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">Online</span>
                  </div>
                  {/* Other members (excluding current user) */}
                  {activeGroup.members.filter(m => m.email !== user.email).map((m, idx) => (
                    <div key={idx} className="flex items-center gap-3 py-2 px-3 bg-card rounded-lg">
                      <div className="relative">
                        {m.avatar ? (
                          <img src={m.avatar} alt={m.name} referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover border-2 border-card" />
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-glass-strong border-2 border-card text-ink">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-app ${
                          m.online ? 'bg-emerald-400' : 'bg-zinc-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{m.name}</p>
                        <p className="text-xs text-ink-muted truncate">{m.email}</p>
                      </div>
                      <span className={`text-[0.65rem] font-semibold px-2 py-0.5 rounded-full ${
                        m.online ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-400 bg-zinc-400/10'
                      }`}>{m.online ? 'Online' : 'Offline'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leave Group */}
              <div className="flex items-center justify-between p-4 bg-app border border-line rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-ink">Leave this group</p>
                  <p className="text-xs text-ink-muted mt-0.5">You will lose access to shared modules and scorecards.</p>
                </div>
                {!confirmLeave ? (
                  <button
                    onClick={() => setConfirmLeave(true)}
                    className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-[0.75rem] font-semibold bg-transparent border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-all duration-200"
                  >
                    <X size={12} /> Leave Group
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConfirmLeave(false)}
                      className="py-1.5 px-3 rounded-lg text-[0.72rem] font-semibold bg-transparent border border-line text-ink-muted hover:bg-glass transition-all"
                    >Cancel</button>
                    <button
                      onClick={handleLeaveGroup}
                      disabled={isLeaving}
                      className="py-1.5 px-3 rounded-lg text-[0.72rem] font-semibold bg-red-500 text-white border border-red-500 hover:bg-red-600 transition-all disabled:opacity-60"
                    >
                      {isLeaving ? 'Leaving...' : 'Yes, Leave'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
          <div className="bg-card border border-line rounded-xl p-5">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[1.15rem] flex items-center gap-2 m-0">Shared Modules</h3>
              <button 
                type="button" 
                onClick={() => setIsShareModalOpen(true)}
                className="inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg font-semibold text-xs transition-all duration-200 cursor-pointer bg-transparent border border-line text-ink hover:bg-input hover:border-line-strong select-none"
              >
                <Plus size={12} /> Share Module
              </button>
            </div>
            {activeGroup.modules.length === 0 ? (
              <div className="text-center p-8 text-ink-muted">No shared modules in this group yet. Add a module to start studying together!</div>
            ) : (
              <div className="flex flex-col gap-3">
                {activeGroup.modules.map((m) => (
                  <div className="flex justify-between items-center bg-app border border-line rounded-lg p-4 px-5" key={m.id}>
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-base text-left">{m.name}</span>
                      <div className="text-[0.75rem] text-ink-muted flex gap-4"><span>Questions: {m.questionsCount}</span></div>
                    </div>
                    <button onClick={() => startGroupQuiz(m, activeGroup.id)} className="btn btn-primary px-3.5 py-2 text-[0.8rem]">Take Group Quiz</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-line rounded-xl p-5">
            <h3 className="text-[1.15rem] mb-5 flex items-center gap-2">Group Scorecards</h3>
            {activeGroup.quizSessions.length === 0 ? (
              <div className="text-center p-8 text-ink-muted">No group quizzes taken yet. Launch a Group Quiz session to view scoreboard history!</div>
            ) : (
              <div className="flex flex-col gap-4">
                {activeGroup.quizSessions.map((s, idx) => (
                  <div key={idx} className="bg-app border border-line rounded-xl p-4 px-5">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-[0.95rem] text-left">{s.moduleName}</span>
                      <span className="inline-flex items-center gap-1 text-[0.7rem] font-bold uppercase tracking-wider py-1 px-2.5 rounded-full border bg-primary-soft text-primary border-primary-line">Avg: {s.avgScore}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {s.rankings.map((rank, rankIdx) => (
                        <span key={rankIdx} className="text-[0.75rem] bg-glass border border-line rounded-md p-1 px-2">{rank.name.split(' ')[0]}: <strong>{rank.score}</strong></span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Share Module Modal */}
        {isShareModalOpen && (
          <div className="fixed inset-0 bg-[rgba(5,5,5,0.7)] backdrop-blur-sm z-3000 flex items-center justify-center p-4">
            <div className="bg-card border border-line rounded-2xl p-8 max-w-110 w-full shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-ink flex items-center gap-2">
                  <Users size={20} className="text-primary" /> Share Study Module
                </h3>
                <button onClick={() => { setIsShareModalOpen(false); setSelectedModuleId(''); }} className="bg-transparent border-0 text-ink-muted hover:text-ink cursor-pointer p-1">
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-2 mb-6 text-left">
                <label className="text-[0.9rem] font-semibold text-ink">Select Module to Share</label>
                <select
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  disabled={isSharing}
                  className="w-full py-2 px-3 bg-input border border-line rounded-md text-ink text-sm outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">-- Choose module --</option>
                  {modules
                    .filter(m => !activeGroup.modules.some(gm => gm.id === m.id))
                    .map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))
                  }
                </select>
                {modules.filter(m => !activeGroup.modules.some(gm => gm.id === m.id)).length === 0 && (
                  <span className="text-xs text-ink-muted mt-1">No unshared modules available. Create a new module first!</span>
                )}
              </div>

              <div className="flex gap-4 justify-end">
                <button 
                  type="button" 
                  onClick={() => { setIsShareModalOpen(false); setSelectedModuleId(''); }} 
                  disabled={isSharing}
                  className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-md font-semibold text-xs transition-all duration-200 cursor-pointer bg-transparent border border-line text-ink hover:bg-input hover:border-line-strong disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleShareModule} 
                  disabled={isSharing || !selectedModuleId}
                  className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-md font-semibold text-xs transition-all duration-200 cursor-pointer bg-primary text-ink-on-primary border border-primary hover:bg-primary-hover hover:border-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSharing ? 'Sharing...' : 'Share with Group'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[1.15rem] flex items-center gap-2 m-0">My Study Groups</h3>
        <button onClick={() => setIsGroupModalOpen(true)} className="btn btn-primary">
          <Plus size={18} /> Create Study Group
        </button>
      </div>

      {/* Invitations Inbox */}
      {invitations.length > 0 && (
        <div className="mb-8">
          <h4 className="text-[0.9rem] font-semibold text-ink-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <Mail size={15} />
            Pending Invitations
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[0.65rem] font-bold">{invitations.length}</span>
          </h4>
          <div className="flex flex-col gap-3">
            {invitations.map(inv => (
              <div key={inv.id} className="bg-card border border-line rounded-xl p-4 flex items-center gap-4 flex-wrap">
                {/* Inviter avatar */}
                <div className="flex-shrink-0">
                  {inv.inviter_avatar && inv.inviter_avatar !== '' ? (
                    <img
                      src={inv.inviter_avatar}
                      alt={inv.inviter_name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border-2 border-primary"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-10 h-10 rounded-full items-center justify-center text-sm font-bold bg-primary-soft text-primary border-2 border-primary-line ${inv.inviter_avatar && inv.inviter_avatar !== '' ? 'hidden' : 'flex'}`}
                  >
                    {inv.inviter_name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.9rem] font-medium text-ink leading-snug">
                    <span className="text-primary font-semibold">{inv.inviter_name}</span> invited you to join
                  </p>
                  <p className="text-[1rem] font-bold text-ink mt-0.5 flex items-center gap-1.5">
                    <Users size={14} className="text-primary" />
                    {inv.group_name}
                  </p>
                  <p className="text-[0.75rem] text-ink-muted mt-0.5">{inv.created_at}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => onDeclineInvitation(inv.id)}
                    className="inline-flex items-center gap-1 py-1.5 px-3 rounded-md text-[0.8rem] font-semibold bg-transparent border border-line text-ink-muted hover:bg-glass hover:text-ink transition-all"
                  >
                    <X size={13} /> Decline
                  </button>
                  <button
                    onClick={() => onAcceptInvitation(inv.id)}
                    className="inline-flex items-center gap-1 py-1.5 px-3 rounded-md text-[0.8rem] font-semibold bg-primary text-ink-on-primary hover:bg-primary-hover transition-all"
                  >
                    <Check size={13} /> Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
        {groups.map((group) => (
          <div className="bg-card border border-line rounded-xl p-5 flex flex-col h-full" key={group.id}>
            <h4 className="text-xl mb-2 text-left">{group.name}</h4>
            <span className="text-[0.85rem] text-ink-muted text-left">{group.members.filter(m => m.email !== user.email).length + 1} Members | {group.modules.length} Shared Modules</span>

            <div className="flex items-center mt-3">
              {/* Current user avatar */}
              <div className="relative -ml-2 first:ml-0">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border-2 border-primary object-cover"
                    title={`${user.name} (You)`} />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-primary text-ink-on-primary border-2 border-primary"
                    title={`${user.name} (You)`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-card" />
              </div>
              {group.members.filter(m => m.email !== user.email).map((m, idx) => (
                <div key={idx} className="relative -ml-2">
                  {m.avatar ? (
                    <img src={m.avatar} alt={m.name} referrerPolicy="no-referrer"
                      className={`w-8 h-8 rounded-full border-2 object-cover ${
                        m.online ? 'border-primary' : 'border-card'
                      }`}
                      title={`${m.name} (${m.online ? 'Online' : 'Offline'})`} />
                  ) : (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-glass-strong border-2 ${
                        m.online ? 'border-primary text-primary' : 'border-card text-ink'
                      }`}
                      title={`${m.name} (${m.online ? 'Online' : 'Offline'})`}>
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${
                    m.online ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                  }`} title={m.online ? 'Online' : 'Offline'} />
                </div>
              ))}
            </div>

            <div className="mt-auto pt-4 flex justify-end">
              <button onClick={() => { setSelectedGroupId(group.id); completeQuest('study_group'); }} className="btn btn-outline inline-flex items-center gap-1 px-4 py-2 text-[0.85rem]">
                Enter Group <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
