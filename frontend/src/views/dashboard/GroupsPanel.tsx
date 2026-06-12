import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronRight, X, Users, Mail, Check, Settings, Bell, MessageSquare, Send, Sparkles, Copy, MoreVertical, Trash2, Crown } from 'lucide-react';
import type { User, Module, StudyGroup, GroupInvitation, StudyGroupResponse, ModuleResponse, QuizQuestionResponse, GroupQuizSessionResponse, GroupQuizRankResponse, GroupMember } from '../../types';
import { API_BASE_URL, WS_BASE_URL } from '../../config';

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
  const [copiedLink, setCopiedLink] = useState(false);
  const [isRemovingMemberId, setIsRemovingMemberId] = useState<number | null>(null);
  const [openMenuMemberId, setOpenMenuMemberId] = useState<number | null>(null);
  const [removeConfirmMember, setRemoveConfirmMember] = useState<{ id: number; name: string } | null>(null);
  const [transferConfirmMember, setTransferConfirmMember] = useState<{ id: number; name: string } | null>(null);
  const [isTransferringOwnershipId, setIsTransferringOwnershipId] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<'study' | 'discussion'>('study');
  const [discussionPosts, setDiscussionPosts] = useState<GroupPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const postsEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedPostIdForTime, setSelectedPostIdForTime] = useState<number | null>(null);

  useEffect(() => {
    setTimeout(() => {
      setActiveTab('study');
      setDiscussionPosts([]);
      setSelectedPostIdForTime(null);
    }, 0);
  }, [selectedGroupId]);

  useEffect(() => {
    if (openMenuMemberId === null) return;
    const handleDocumentClick = () => {
      setOpenMenuMemberId(null);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [openMenuMemberId]);

  useEffect(() => {
    if (activeTab === 'discussion') {
      postsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [discussionPosts, activeTab]);

  useEffect(() => {
    if (selectedGroupId !== null && activeTab === 'discussion') {
      const token = localStorage.getItem('token');
      if (!token) return;

      setTimeout(() => {
        setIsLoadingPosts(true);
      }, 0);
      fetch(`${API_BASE_URL}/api/groups/${selectedGroupId}/discussion`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.ok ? res.json() : [])
      .then(posts => {
        setDiscussionPosts(posts);
      })
      .catch(err => console.error('Error fetching group posts:', err))
      .finally(() => setIsLoadingPosts(false));
    }
  }, [selectedGroupId, activeTab]);

  // Real-time WebSocket connection for live discussion board and presence
  useEffect(() => {
    if (selectedGroupId === null) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const ws = new WebSocket(`${WS_BASE_URL}/api/groups/ws/${selectedGroupId}/discussion?token=${token}`);
    socketRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'new_posts') {
          const incomingPosts = message.posts as GroupPost[];
          setDiscussionPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newUniquePosts = incomingPosts.filter(p => !existingIds.has(p.id));
            if (newUniquePosts.length === 0) return prev;
            return [...prev, ...newUniquePosts];
          });
        } else if (message.type === 'user_status') {
          setGroups(prev => prev.map(g => {
            if (g.id !== selectedGroupId) return g;
            return {
              ...g,
              members: g.members.map(m => {
                if (m.email !== message.email) return m;
                return { ...m, online: message.online };
              })
            };
          }));
        } else if (message.type === 'member_joined') {
          setGroups(prev => prev.map(g => {
            if (g.id !== selectedGroupId) return g;
            const alreadyMember = g.members.some(m => m.email === message.member.email);
            if (alreadyMember) return g;
            return {
              ...g,
              members: [...g.members, message.member]
            };
          }));
        } else if (message.type === 'member_removed') {
          if (user.id === message.user_id) {
            alert('You have been removed from the group by the owner.');
            setSelectedGroupId(null);
            setGroups(prev => prev.filter(g => g.id !== selectedGroupId));
          } else {
            setGroups(prev => prev.map(g => {
              if (g.id !== selectedGroupId) return g;
              return {
                ...g,
                members: g.members.filter(m => m.id !== message.user_id)
              };
            }));
          }
        } else if (message.type === 'ownership_transferred') {
          setGroups(prev => prev.map(g => {
            if (g.id !== selectedGroupId) return g;
            return {
              ...g,
              creator_id: message.creator_id
            };
          }));
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      console.log('Group discussion WebSocket closed');
    };

    ws.onerror = (err) => {
      console.error('Group discussion WebSocket error:', err);
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [selectedGroupId, setGroups, setSelectedGroupId, user.id]);

  const handlePostMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || isPosting || selectedGroupId === null) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setIsPosting(true);
    const contentToSend = newPostContent;
    setNewPostContent('');

    fetch(`${API_BASE_URL}/api/groups/${selectedGroupId}/discussion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content: contentToSend })
    })
    .then(async res => {
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail || 'Failed to post message');
      return data;
    })
    .then((newPosts: GroupPost[]) => {
      setDiscussionPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newUniquePosts = newPosts.filter(p => !existingIds.has(p.id));
        if (newUniquePosts.length === 0) return prev;
        return [...prev, ...newUniquePosts];
      });
    })
    .catch(err => {
      console.error('Error posting message:', err);
      alert(err.message || 'Error posting message');
      setNewPostContent(contentToSend);
    })
    .finally(() => {
      setIsPosting(false);
      inputRef.current?.focus();
    });
  };

  interface GroupPost {
    id: number;
    group_id: number;
    user_id: number;
    user_name: string;
    user_avatar?: string | null;
    content: string;
    created_at: string;
    is_ai: boolean;
  }

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

  const handleCopyInviteLink = () => {
    const activeGroup = groups.find(g => g.id === selectedGroupId);
    if (!activeGroup) return;
    const inviteLink = `${window.location.origin}/?join_group=${activeGroup.id}`;
    navigator.clipboard.writeText(inviteLink)
      .then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy link: ', err);
      });
  };

  const handleRemoveMember = (memberId: number) => {
    const activeGroup = groups.find(g => g.id === selectedGroupId);
    if (!activeGroup) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsRemovingMemberId(memberId);
    fetch(`${API_BASE_URL}/api/groups/${activeGroup.id}/members/${memberId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(async res => {
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail || 'Failed to remove member');
      return data;
    })
    .then((updatedGroup: StudyGroupResponse) => {
      const mapped: StudyGroup = {
        id: updatedGroup.id,
        name: updatedGroup.name,
        creator_id: updatedGroup.creator_id,
        members: (updatedGroup.members || []).map((m: GroupMember) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          avatar: m.avatar,
          online: m.online,
        })),
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
      setGroups(prev => prev.map(g => g.id === mapped.id ? mapped : g));
    })
    .catch(err => alert(err.message))
    .finally(() => setIsRemovingMemberId(null));
  };

  const handleTransferOwnership = (memberId: number) => {
    const activeGroup = groups.find(g => g.id === selectedGroupId);
    if (!activeGroup) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsTransferringOwnershipId(memberId);
    fetch(`${API_BASE_URL}/api/groups/${activeGroup.id}/transfer-ownership/${memberId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(async res => {
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail || 'Failed to transfer ownership');
      return data;
    })
    .then((updatedGroup: StudyGroupResponse) => {
      const mapped: StudyGroup = {
        id: updatedGroup.id,
        name: updatedGroup.name,
        creator_id: updatedGroup.creator_id,
        members: (updatedGroup.members || []).map((m: GroupMember) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          avatar: m.avatar,
          online: m.online,
        })),
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
      setGroups(prev => prev.map(g => g.id === mapped.id ? mapped : g));
    })
    .catch(err => alert(err.message))
    .finally(() => setIsTransferringOwnershipId(null));
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
    const isCurrentUserOwner = activeGroup.creator_id === user.id;

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
              <div className="flex items-center gap-2 max-w-md w-full sm:justify-end flex-wrap">
                <form onSubmit={handleInviteMember} className="flex items-center gap-2">
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

                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-semibold text-xs transition-all duration-200 cursor-pointer border ${
                    copiedLink
                      ? 'bg-emerald-500 text-white border-emerald-500 opacity-90'
                      : 'bg-glass border-line hover:bg-glass-hover text-ink hover:text-primary'
                  }`}
                >
                  {copiedLink ? (
                    <><Check size={12} /> Copied!</>
                  ) : (
                    <><Copy size={12} /> Copy Link</>
                  )}
                </button>
              </div>
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
                      <p className="text-sm font-medium text-ink truncate">
                        {user.name} <span className="text-xs text-ink-muted font-normal">(You)</span>
                        {isCurrentUserOwner && (
                          <span className="ml-1.5 text-[0.6rem] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Owner</span>
                        )}
                      </p>
                      <p className="text-xs text-ink-muted truncate">{user.email}</p>
                    </div>
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
                        <p className="text-sm font-medium text-ink truncate">
                          {m.name}
                          {activeGroup.creator_id === m.id && (
                            <span className="ml-1.5 text-[0.6rem] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Owner</span>
                          )}
                        </p>
                        <p className="text-xs text-ink-muted truncate">{m.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCurrentUserOwner && m.id && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuMemberId(openMenuMemberId === m.id ? null : m.id ?? null);
                              }}
                              disabled={isRemovingMemberId === m.id}
                              className="inline-flex items-center justify-center p-1.5 rounded hover:bg-glass text-ink-muted hover:text-ink transition-all cursor-pointer border border-line"
                              title="More Options"
                            >
                              <MoreVertical size={16} />
                            </button>
                             {openMenuMemberId === m.id && (
                              <div
                                className="absolute right-0 top-full mt-1 w-44 bg-card border border-line rounded-lg shadow-lg py-1 z-20"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTransferConfirmMember({ id: m.id!, name: m.name });
                                    setOpenMenuMemberId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs text-amber-400 hover:bg-amber-500/10 transition-colors font-semibold flex items-center gap-1.5 cursor-pointer border-b border-line"
                                >
                                  <Crown size={12} /> Transfer Ownership
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRemoveConfirmMember({ id: m.id!, name: m.name });
                                    setOpenMenuMemberId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors font-semibold flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Trash2 size={12} /> Remove Member
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
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
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-line pb-0.5 mt-6">
              <button
                type="button"
                onClick={() => setActiveTab('study')}
                className={`py-2.5 px-5 border-b-2 font-bold text-sm transition-all duration-150 cursor-pointer ${
                  activeTab === 'study'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                Study Room
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('discussion')}
                className={`py-2.5 px-5 border-b-2 font-bold text-sm transition-all duration-150 cursor-pointer flex items-center gap-2 ${
                  activeTab === 'discussion'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                <MessageSquare size={16} /> Group Discussion & AI
              </button>
            </div>

            {activeTab === 'study' ? (
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
            ) : (
              <div className="bg-card border border-line rounded-xl p-6 flex flex-col h-[550px] shadow-lg animate-in fade-in duration-200">
                <div className="flex justify-between items-center pb-3 border-b border-line mb-4 shrink-0">
                  <div>
                    <h3 className="text-[1.15rem] font-bold text-ink flex items-center gap-2 m-0">
                      <Users size={18} className="text-primary" /> Group Discussion
                    </h3>
                    <p className="text-xs text-ink-muted mt-0.5">Share notes, ask questions, or study with the AI.</p>
                  </div>
                  <div className="flex items-center gap-1 bg-primary-soft/10 text-primary border border-primary-line px-2.5 py-1 rounded-full text-xs font-semibold">
                    <Sparkles size={12} />
                    <span>AI Study Companion Active</span>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-1 min-h-0 text-left">
                  {isLoadingPosts ? (
                    <div className="flex flex-col items-center justify-center h-full text-ink-muted gap-2">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs">Loading conversation feed...</span>
                    </div>
                  ) : discussionPosts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-ink-muted p-8 text-center gap-2">
                      <MessageSquare size={36} className="opacity-40" />
                      <span className="font-semibold text-sm">No messages here yet</span>
                      <span className="text-xs max-w-xs leading-relaxed">Start the discussion with your study partners, or tag <strong className="text-primary">@ai</strong> to ask the AI Study Companion questions using your shared textbook contents!</span>
                    </div>
                  ) : (
                    discussionPosts.map((post) => {
                      const isCurrentUser = post.user_id === user.id;
                      const isAi = post.is_ai;
                      const isTimeVisible = selectedPostIdForTime === post.id;
                      return (
                        <div key={post.id} className={`flex flex-col w-full ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                          <div
                            onClick={() => setSelectedPostIdForTime(prev => prev === post.id ? null : post.id)}
                            className={`flex items-start gap-3 p-3.5 rounded-xl transition-all duration-150 max-w-[80%] cursor-pointer select-none ${
                              isAi 
                                ? 'bg-[linear-gradient(135deg,rgba(62,207,142,0.06),rgba(6,182,212,0.06))] border border-primary-line/45 shadow-sm'
                                : isCurrentUser 
                                  ? 'bg-primary-soft/10 border border-primary-line/20'
                                  : 'bg-input border border-line'
                            }`}
                          >
                            {!isCurrentUser && (
                              isAi ? (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[linear-gradient(135deg,var(--primary),var(--accent-cyan))] text-ink-on-primary font-bold shadow-md shrink-0">
                                  <Sparkles size={16} />
                                </div>
                              ) : post.user_avatar ? (
                                <img
                                  src={post.user_avatar}
                                  alt={post.user_name}
                                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-line"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border border-line bg-glass-strong text-ink">
                                  {post.user_name.charAt(0).toUpperCase()}
                                </div>
                              )
                            )}

                            <div className="flex-1 min-w-0">
                              {!isCurrentUser && (
                                <div className="flex items-baseline mb-1 gap-2 flex-wrap justify-between">
                                  <span className="text-xs font-bold text-ink flex items-center gap-1.5 truncate">
                                    {post.user_name}
                                    {isAi && (
                                      <span className="text-[0.62rem] font-bold bg-[linear-gradient(135deg,var(--primary),var(--accent-cyan))] text-ink-on-primary px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-[0.9] origin-left">
                                        AI Tutor
                                      </span>
                                    )}
                                  </span>
                                </div>
                              )}
                              <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap select-text selection:bg-primary-soft text-left">{post.content}</p>
                            </div>
                          </div>
                          {isTimeVisible && (
                            <span className={`text-[0.65rem] text-ink-muted mt-1 ${
                              isCurrentUser ? 'pr-4' : 'pl-12'
                            } transition-all duration-150 animate-in fade-in slide-in-from-top-1`}>
                              {post.created_at}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={postsEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handlePostMessage} className="flex gap-2 shrink-0 pt-3 border-t border-line">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    disabled={isPosting}
                    placeholder="Type your message... (Tag @ai to ask the AI Study Companion)"
                    className="flex-1 py-2.5 px-4 bg-input border border-line rounded-lg text-ink text-sm outline-none focus:border-primary focus:bg-app transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isPosting || !newPostContent.trim()}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4.5 rounded-lg font-bold text-sm bg-primary text-ink-on-primary hover:bg-primary-hover hover:border-primary-hover transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPosting ? (
                      <div className="w-4 h-4 border-2 border-ink-on-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Send</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </>
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

        {/* Remove Member Confirmation Modal */}
        {removeConfirmMember && (
          <div className="fixed inset-0 bg-[rgba(5,5,5,0.7)] backdrop-blur-sm z-3000 flex items-center justify-center p-4">
            <div className="bg-card border border-line rounded-2xl p-6 max-w-md w-full shadow-lg text-center">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                  Remove Group Member
                </h3>
                <button 
                  onClick={() => setRemoveConfirmMember(null)} 
                  className="bg-transparent border-0 text-ink-muted hover:text-ink cursor-pointer p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mb-6 text-left">
                <p className="text-sm text-ink-muted leading-relaxed">
                  Are you sure you want to remove <span className="font-semibold text-ink">{removeConfirmMember.name}</span> from this group? This action will immediately revoke their access to shared study modules and group discussion.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setRemoveConfirmMember(null)} 
                  className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-md font-semibold text-xs transition-all duration-200 cursor-pointer bg-transparent border border-line text-ink hover:bg-input hover:border-line-strong"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    handleRemoveMember(removeConfirmMember.id);
                    setRemoveConfirmMember(null);
                  }}
                  className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-md font-semibold text-xs transition-all duration-200 cursor-pointer bg-red-500 hover:bg-red-600 text-white border border-red-500 hover:border-red-600"
                >
                  Remove Member
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Ownership Confirmation Modal */}
        {transferConfirmMember && (
          <div className="fixed inset-0 bg-[rgba(5,5,5,0.7)] backdrop-blur-sm z-3000 flex items-center justify-center p-4">
            <div className="bg-card border border-line rounded-2xl p-6 max-w-md w-full shadow-lg text-center">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                  <Crown size={18} className="text-amber-400" /> Transfer Group Ownership
                </h3>
                <button 
                  onClick={() => setTransferConfirmMember(null)} 
                  className="bg-transparent border-0 text-ink-muted hover:text-ink cursor-pointer p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mb-6 text-left">
                <p className="text-sm text-ink-muted leading-relaxed">
                  Are you sure you want to transfer ownership of this group to <span className="font-semibold text-ink">{transferConfirmMember.name}</span>? 
                  <span className="block mt-2 font-medium text-amber-400">Warning: You will no longer be the owner and will lose creator permissions (such as removing members, inviting users, or transferring ownership).</span>
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setTransferConfirmMember(null)} 
                  disabled={isTransferringOwnershipId !== null}
                  className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-md font-semibold text-xs transition-all duration-200 cursor-pointer bg-transparent border border-line text-ink hover:bg-input hover:border-line-strong disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    handleTransferOwnership(transferConfirmMember.id);
                    setTransferConfirmMember(null);
                  }}
                  disabled={isTransferringOwnershipId !== null}
                  className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-md font-semibold text-xs transition-all duration-200 cursor-pointer bg-amber-500 hover:bg-amber-600 text-white border border-amber-500 hover:border-amber-600 disabled:opacity-50"
                >
                  {isTransferringOwnershipId === transferConfirmMember.id ? 'Transferring...' : 'Transfer Ownership'}
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
