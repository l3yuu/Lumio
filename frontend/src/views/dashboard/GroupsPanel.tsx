import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronRight, X, Users, Mail, Check, Settings, Bell, MessageSquare, Send, Sparkles, Copy, MoreVertical, Trash2, Crown, Notebook } from 'lucide-react';
import type { User, Module, Note, StudyGroup, GroupInvitation, StudyGroupResponse, ModuleResponse, QuizQuestionResponse, GroupQuizSessionResponse, GroupQuizRankResponse, GroupMember } from '../../types';
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
  notes: Note[];
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
  notes,
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
  const [isNoteShareModalOpen, setIsNoteShareModalOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [isNoteSharing, setIsNoteSharing] = useState(false);
  const [viewingSharedNote, setViewingSharedNote] = useState<Note | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [isLeaving, setIsLeaving] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState<number | null>(null);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState('');
  const [renameSuccess, setRenameSuccess] = useState(false);
  const [groupNotifsEnabled, setGroupNotifsEnabled] = useState(true);
  const [isTogglingNotifs, setIsTogglingNotifs] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isRemovingMemberId, setIsRemovingMemberId] = useState<number | null>(null);
  const [openMenuMemberId, setOpenMenuMemberId] = useState<number | null>(null);
  const [removeConfirmMember, setRemoveConfirmMember] = useState<{ id: number; name: string } | null>(null);
  const [transferConfirmMember, setTransferConfirmMember] = useState<{ id: number; name: string } | null>(null);
  const [isTransferringOwnershipId, setIsTransferringOwnershipId] = useState<number | null>(null);
  const [isRemovingModuleId, setIsRemovingModuleId] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<'study' | 'discussion'>('study');
  const [discussionPosts, setDiscussionPosts] = useState<GroupPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);
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
    if (selectedGroupId !== null) {
      const activeGroup = groups.find(g => g.id === selectedGroupId);
      if (activeGroup) {
        setTimeout(() => {
          setNewGroupName(activeGroup.name);
          setRenameError('');
          setRenameSuccess(false);
        }, 0);
      }
    }
  }, [selectedGroupId, groups]);

  const mapStudyGroup = (g: StudyGroupResponse): StudyGroup => ({
    id: g.id,
    name: g.name,
    creator_id: g.creator_id,
    isPublic: g.is_public ?? false,
    members: (g.members || []).map((m: GroupMember) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      avatar: m.avatar,
      online: m.online,
      is_premium: m.is_premium,
    })),
    modules: g.modules ? g.modules.map((m: ModuleResponse) => ({
      id: m.id,
      name: m.name,
      date: m.date,
      size: m.size,
      subject: m.subject || 'General',
      questionsCount: m.questionsCount !== undefined ? m.questionsCount : (m.questions ? m.questions.length : 0),
      userId: m.user_id,
      sharedByName: m.shared_by_name,
      questions: m.questions ? m.questions.map((q: QuizQuestionResponse) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswerIndex: q.correct_answer_index,
        explanation: q.explanation,
        hint: q.hint,
        questionType: q.question_type,
        reference: q.reference
      })) : []
    })) : [],
    notes: g.notes ? g.notes.map((n: any) => ({
      id: n.id,
      userId: n.user_id,
      title: n.title,
      content: n.content,
      subject: n.subject,
      isPinned: n.is_pinned,
      createdAt: n.created_at,
      updatedAt: n.updated_at
    })) : [],
    quizSessions: g.quiz_sessions ? g.quiz_sessions.map((s: GroupQuizSessionResponse) => ({
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
  });

  const [publicGroups, setPublicGroups] = useState<StudyGroup[]>([]);
  const publicGroupsPageRef = useRef(0);
  const [hasMorePublicGroups, setHasMorePublicGroups] = useState(true);
  const [isFetchingPublicGroups, setIsFetchingPublicGroups] = useState(false);

  const [userGroupsList, setUserGroupsList] = useState<StudyGroup[]>([]);
  const userGroupsPageRef = useRef(0);
  const [hasMoreUserGroups, setHasMoreUserGroups] = useState(true);
  const [isFetchingUserGroups, setIsFetchingUserGroups] = useState(false);

  const fetchPublicGroups = React.useCallback((pageNum: number = 0, append: boolean = false) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsFetchingPublicGroups(true);
    const limit = 10;
    const skip = pageNum * limit;
    
    fetch(`${API_BASE_URL}/api/groups/public?skip=${skip}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    })
    .then(res => res.ok ? res.json() : [])
    .then((data: StudyGroupResponse[]) => {
      const mapped = data.map(mapStudyGroup);
      if (append) {
        setPublicGroups(prev => {
          const existingIds = new Set(prev.map(x => x.id));
          const filtered = mapped.filter(x => !existingIds.has(x.id));
          return [...prev, ...filtered];
        });
      } else {
        setPublicGroups(mapped);
      }
      setHasMorePublicGroups(data.length === limit);
      setIsFetchingPublicGroups(false);
    })
    .catch(err => {
      console.error('Error fetching public groups:', err);
      setIsFetchingPublicGroups(false);
    });
  }, []);

  const fetchUserGroups = React.useCallback((pageNum: number = 0, append: boolean = false) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsFetchingUserGroups(true);
    const limit = 10;
    const skip = pageNum * limit;
    
    fetch(`${API_BASE_URL}/api/groups?skip=${skip}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    })
    .then(res => res.ok ? res.json() : [])
    .then((data: StudyGroupResponse[]) => {
      const mapped = data.map(mapStudyGroup);
      if (append) {
        setUserGroupsList(prev => {
          const existingIds = new Set(prev.map(x => x.id));
          const filtered = mapped.filter(x => !existingIds.has(x.id));
          return [...prev, ...filtered];
        });
      } else {
        setUserGroupsList(mapped);
      }
      setHasMoreUserGroups(data.length === limit);
      setIsFetchingUserGroups(false);
    })
    .catch(err => {
      console.error('Error fetching user groups:', err);
      setIsFetchingUserGroups(false);
    });
  }, []);

  // Re-fetch a single group from server and sync into parent state
  const fetchGroupById = React.useCallback((groupId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE_URL}/api/groups/${groupId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    })
    .then(res => res.ok ? res.json() : null)
    .then((data: StudyGroupResponse | null) => {
      if (!data) return;
      const mapped = mapStudyGroup(data);
      setGroups(prev => prev.map(g => g.id === mapped.id ? mapped : g));
    })
    .catch(err => console.error('Error refreshing group:', err));
  }, [mapStudyGroup, setGroups]);

  // Initial loads
  useEffect(() => {
    publicGroupsPageRef.current = 0;
    fetchPublicGroups(0, false);
    
    userGroupsPageRef.current = 0;
    fetchUserGroups(0, false);
  }, [fetchPublicGroups, fetchUserGroups]);

  // Sync edits/CRUD actions from parent groups state into paginated local state
  useEffect(() => {
    setUserGroupsList(prev => {
      const parentMap = new Map(groups.map(g => [g.id, g]));
      
      const updated = prev
        .filter(g => parentMap.has(g.id))
        .map(g => parentMap.get(g.id)!);
        
      const existingIds = new Set(prev.map(g => g.id));
      const newlyAdded = groups.filter(g => !existingIds.has(g.id));
      
      if (newlyAdded.length > 0) {
        return [...newlyAdded, ...updated];
      }
      return updated;
    });
  }, [groups]);

  // Scroll listener for infinite scrolling
  useEffect(() => {
    const handleScroll = () => {
      const threshold = 150;
      const totalHeight = document.documentElement.scrollHeight;
      const scrollPosition = window.innerHeight + window.scrollY;
      
      if (totalHeight - scrollPosition <= threshold) {
        if (selectedGroupId === null) {
          // Load public groups if they are visible
          if (publicGroups.length > 0 && hasMorePublicGroups && !isFetchingPublicGroups) {
            publicGroupsPageRef.current += 1;
            fetchPublicGroups(publicGroupsPageRef.current, true);
          }
          
          // Load user groups
          if (hasMoreUserGroups && !isFetchingUserGroups) {
            userGroupsPageRef.current += 1;
            fetchUserGroups(userGroupsPageRef.current, true);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedGroupId, publicGroups.length, hasMorePublicGroups, isFetchingPublicGroups, hasMoreUserGroups, isFetchingUserGroups, fetchPublicGroups, fetchUserGroups]);

  const handleJoinPublicGroup = (groupId: number) => {
    if (isJoiningGroup !== null) return;
    setIsJoiningGroup(groupId);
    const token = localStorage.getItem('token');
    if (!token) { setIsJoiningGroup(null); return; }

    fetch(`${API_BASE_URL}/api/groups/${groupId}/join`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Failed to join group');
      return data as StudyGroupResponse;
    })
    .then(group => {
      setPublicGroups(prev => prev.filter(g => g.id !== groupId));
      setGroups(prev => [{
        id: group.id,
        name: group.name,
        creator_id: group.creator_id,
        isPublic: group.is_public ?? false,
        members: (group.members || []).map((m: GroupMember) => ({
          id: m.id, name: m.name, email: m.email, avatar: m.avatar, online: m.online, is_premium: m.is_premium,
        })),
        modules: group.modules ? group.modules.map((m: ModuleResponse) => ({
          id: m.id, name: m.name, date: m.date, size: m.size, subject: m.subject || 'General',
          questionsCount: m.questionsCount !== undefined ? m.questionsCount : (m.questions ? m.questions.length : 0),
          questions: m.questions ? m.questions.map((q: QuizQuestionResponse) => ({
            id: q.id, question: q.question, options: q.options, correctAnswerIndex: q.correct_answer_index,
            explanation: q.explanation, hint: q.hint, questionType: q.question_type, reference: q.reference
          })) : []
        })) : [],
        notes: group.notes ? group.notes.map((n: { id: number; user_id: number; title: string; content: string; subject: string; is_pinned: boolean; created_at: string; updated_at: string }) => ({
          id: n.id, userId: n.user_id, title: n.title, content: n.content, subject: n.subject,
          isPinned: n.is_pinned, createdAt: n.created_at, updatedAt: n.updated_at
        })) : [],
        quizSessions: group.quiz_sessions ? group.quiz_sessions.map((s: GroupQuizSessionResponse) => ({
          id: s.id, moduleName: s.module_name, date: s.date, avgScore: s.avg_score,
          rankings: s.rankings ? s.rankings.map((r: GroupQuizRankResponse) => ({
            name: r.name, score: r.score, percentage: r.percentage, time: r.time, isUser: r.is_user
          })) : []
        })) : []
      }, ...prev]);
    })
    .catch(err => alert(err.message))
    .finally(() => setIsJoiningGroup(null));
  };
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);
  const [isJoiningGroup, setIsJoiningGroup] = useState<number | null>(null);

  const handleToggleGroupVisibility = () => {
    if (selectedGroupId === null || isTogglingVisibility) return;
    const currentGroup = groups.find(g => g.id === selectedGroupId);
    if (!currentGroup) return;
    setIsTogglingVisibility(true);
    const token = localStorage.getItem('token');
    if (!token) { setIsTogglingVisibility(false); return; }

    fetch(`${API_BASE_URL}/api/groups/${selectedGroupId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: currentGroup.name, is_public: !currentGroup.isPublic }),
      cache: 'no-store'
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Failed to update group visibility');
      return data as StudyGroupResponse;
    })
    .then(() => {
      fetchGroupById(selectedGroupId!);
    })
    .catch(err => alert(err.message))
    .finally(() => setIsTogglingVisibility(false));
  };

  const handleRenameGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || selectedGroupId === null) return;

    setIsRenaming(true);
    setRenameError('');
    setRenameSuccess(false);
    const token = localStorage.getItem('token');

    fetch(`${API_BASE_URL}/api/groups/${selectedGroupId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: newGroupName.trim() }),
      cache: 'no-store'
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Failed to rename group');
      return data as StudyGroupResponse;
    })
    .then(() => {
      fetchGroupById(selectedGroupId!);
      setRenameSuccess(true);
    })
    .catch(err => {
      setRenameError(err.message);
    })
    .finally(() => {
      setIsRenaming(false);
    });
  };

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
  }, [discussionPosts, activeTab, isAiResponding]);

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
        } else if (message.type === 'group_renamed') {
          setGroups(prev => prev.map(g => {
            if (g.id !== selectedGroupId) return g;
            return {
              ...g,
              name: message.name
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
        const ws = socketRef.current;
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => {
            ws.close();
          };
        } else {
          ws.close();
        }
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
    const isAi = contentToSend.toLowerCase().includes('@ai') || contentToSend.toLowerCase().includes('@tutor');
    if (isAi) {
      setIsAiResponding(true);
    }
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
      setIsAiResponding(false);
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
    const isOwner = activeGroup.creator_id === user.id;
    fetch(`${API_BASE_URL}/api/groups/${activeGroup.id}/leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: isOwner ? JSON.stringify({ new_owner_id: selectedNewOwnerId }) : undefined
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
    .finally(() => { setIsLeaving(false); setConfirmLeave(false); setGroupSettingsOpen(false); setSelectedNewOwnerId(null); });
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
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    })
    .then(async res => {
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail || 'Failed to remove member');
    })
    .then(() => {
      fetchGroupById(activeGroup.id!);
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
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    })
    .then(async res => {
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail || 'Failed to transfer ownership');
    })
    .then(() => {
      fetchGroupById(activeGroup.id!);
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
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    })
    .then(async res => {
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail || 'Failed to share module with group');
    })
    .then(() => {
      fetchGroupById(activeGroup.id!);
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

  const handleShareNote = () => {
    if (selectedNoteId === null || isNoteSharing) return;
    const activeGroup = groups.find(g => g.id === selectedGroupId);
    if (!activeGroup) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setIsNoteSharing(true);
    fetch(`${API_BASE_URL}/api/groups/${activeGroup.id}/share-note/${selectedNoteId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    })
    .then(async res => {
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail || 'Failed to share note with group');
    })
    .then(() => {
      fetchGroupById(activeGroup.id!);
      setSelectedNoteId(null);
      setIsNoteShareModalOpen(false);
    })
    .catch(err => {
      console.error(err);
      alert(err.message || 'Error sharing note');
    })
    .finally(() => setIsNoteSharing(false));
  };

  const handleRemoveModuleFromGroup = (moduleId: number) => {
    const activeGroup = groups.find(g => g.id === selectedGroupId);
    if (!activeGroup) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsRemovingModuleId(moduleId);
    fetch(`${API_BASE_URL}/api/groups/${activeGroup.id}/remove-module/${moduleId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    })
    .then(async res => {
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail || 'Failed to remove module from group');
    })
    .then(() => {
      fetchGroupById(activeGroup.id!);
    })
    .catch(err => alert(err.message))
    .finally(() => setIsRemovingModuleId(null));
  };

  if (selectedGroupId !== null) {
    const activeGroup = groups.find(g => g.id === selectedGroupId);
    if (!activeGroup) return null;
    const isCurrentUserOwner = activeGroup.creator_id === user.id;

    return (
      <div>
        <div className="bg-[linear-gradient(135deg,rgba(62,207,142,0.04),rgba(6,182,212,0.04))] border border-line rounded-xl p-6 max-md:p-4 mb-8">
          <div className="flex justify-between items-start gap-4 flex-wrap max-md:flex-col max-md:gap-3">
            <div className="min-w-0">
              <button onClick={() => { setSelectedGroupId(null); setConfirmLeave(false); setGroupSettingsOpen(false); }} className="btn btn-outline border-none bg-transparent hover:bg-glass text-ink-muted hover:text-ink px-3 py-1.5 text-xs mb-4 inline-flex items-center gap-1">
                ← Back to Groups
              </button>
              <h2 className="text-[1.8rem] max-md:text-[1.4rem] mb-1 wrap-break-word">{activeGroup.name}</h2>
              <p className="text-ink-muted text-[0.9rem]">Collaborative Study Room</p>
            </div>
            <div className="flex flex-col items-end gap-2 text-right max-md:items-start max-md:text-left max-md:w-full">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[0.7rem] font-bold uppercase tracking-wider py-1 px-2.5 rounded-full border bg-primary-soft text-primary border-primary-line">Group Active</span>
                <button
                  onClick={() => setIsMembersModalOpen(true)}
                  className="p-1.5 rounded-lg border transition-all duration-200 bg-transparent border-line text-ink-muted hover:bg-glass hover:text-ink"
                  title="Group Members"
                >
                  <Users size={14} />
                </button>
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

          <div className="flex justify-between items-center mt-6 pt-4 border-t border-line flex-wrap gap-4 max-md:flex-col max-md:items-stretch">
            <div className="flex items-center max-md:overflow-x-auto max-md:pb-1 max-md:-mx-1 max-md:px-1">
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

            <div className="flex flex-col items-end gap-1.5 max-md:items-stretch max-md:w-full">
              <div className="flex items-center gap-2 max-w-md w-full sm:justify-end flex-wrap max-md:flex-col max-md:items-stretch">
                <form onSubmit={handleInviteMember} className="flex items-center gap-2 max-md:flex-col max-md:w-full max-md:items-stretch">
                  <input
                    type="email"
                    placeholder="Partner's email..."
                    value={inviteEmail}
                    onChange={(e) => { setInviteEmail(e.target.value); setInviteError(''); }}
                    disabled={isInviting || inviteSuccess}
                    className="py-1.5 px-3 text-xs bg-input border border-line rounded-lg text-ink transition-all duration-150 outline-none focus:border-primary w-45 max-md:w-full disabled:opacity-60 disabled:cursor-not-allowed"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isInviting || inviteSuccess}
                    className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-semibold text-xs transition-all duration-200 cursor-pointer border disabled:cursor-not-allowed max-md:w-full ${
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
                  className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-semibold text-xs transition-all duration-200 cursor-pointer border max-md:w-full ${
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
          <div className="bg-card border border-line rounded-xl p-5 max-md:p-4 mt-6">
            <h3 className="text-[1.15rem] mb-5 flex items-center gap-2">
              <Settings size={18} /> Group Settings
            </h3>
            <div className="flex flex-col gap-4">
              {/* Edit Group Name (Owner only) */}
              {isCurrentUserOwner && (
                <div className="p-4 bg-app border border-line rounded-lg">
                  <p className="text-sm font-semibold text-ink mb-2">Edit Group Name</p>
                  <form onSubmit={handleRenameGroup} className="flex gap-2 max-md:flex-col">
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Enter new group name"
                      className="flex-1 bg-input border border-line rounded-md p-2.5 text-ink text-[0.85rem] outline-none focus:border-primary transition-colors"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isRenaming}
                      className="px-4 py-2 bg-primary hover:bg-primary-hover text-ink-on-primary font-bold text-xs rounded-md cursor-pointer transition-colors disabled:opacity-60 shrink-0"
                    >
                      {isRenaming ? 'Saving...' : 'Save'}
                    </button>
                  </form>
                  {renameError && <p className="text-red-400 text-[0.72rem] mt-1.5">{renameError}</p>}
                  {renameSuccess && <p className="text-primary font-semibold text-[0.72rem] mt-1.5">Group name updated successfully!</p>}
                </div>
              )}

              {/* Group Visibility (Owner only) */}
              {isCurrentUserOwner && (
                <div className="flex items-center justify-between p-4 bg-app border border-line rounded-lg max-md:flex-col max-md:items-stretch max-md:gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">Public Group</p>
                    <p className="text-xs text-ink-muted mt-0.5">Anyone can discover and join this group</p>
                  </div>
                  <button
                    onClick={handleToggleGroupVisibility}
                    disabled={isTogglingVisibility}
                    className={`relative w-11 h-6 rounded-full transition-all duration-200 cursor-pointer shrink-0 self-end max-md:self-start ${
                      activeGroup.isPublic ? 'bg-primary' : 'bg-input border border-line'
                    } ${isTogglingVisibility ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
                      activeGroup.isPublic ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              )}

              {/* Notification Toggle */}
              <div className="flex items-center justify-between p-4 bg-app border border-line rounded-lg max-md:flex-col max-md:items-stretch max-md:gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Bell size={18} className="text-ink-muted" />
                  <div>
                    <p className="text-sm font-semibold text-ink">Group Notifications</p>
                    <p className="text-xs text-ink-muted mt-0.5">Receive updates when members share modules or take quizzes.</p>
                  </div>
                </div>
                <button
                  onClick={handleToggleNotifs}
                  disabled={isTogglingNotifs}
                  className={`relative w-11 h-6 rounded-full transition-all duration-200 cursor-pointer shrink-0 self-end max-md:self-start ${
                    groupNotifsEnabled ? 'bg-primary' : 'bg-input border border-line'
                  } ${isTogglingNotifs ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
                    groupNotifsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Leave Group */}
              <div className="p-4 bg-app border border-line rounded-lg max-md:flex-col max-md:items-stretch max-md:gap-3">
                <div className="min-w-0 mb-3">
                  <p className="text-sm font-semibold text-ink">Leave this group</p>
                  <p className="text-xs text-ink-muted mt-0.5">You will lose access to shared modules and scorecards.</p>
                </div>
                {!confirmLeave ? (
                  <button
                    onClick={() => setConfirmLeave(true)}
                    className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-[0.75rem] font-semibold bg-transparent border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-all duration-200 shrink-0 max-md:w-full max-md:justify-center"
                  >
                    <X size={12} /> Leave Group
                  </button>
                ) : (
                  <div className="flex flex-col gap-3">
                    {activeGroup && isCurrentUserOwner && activeGroup.members.length > 1 && (
                      <div>
                        <label className="text-xs font-semibold text-ink mb-1.5 block">Transfer ownership to:</label>
                        <select
                          value={selectedNewOwnerId ?? ''}
                          onChange={(e) => setSelectedNewOwnerId(e.target.value ? Number(e.target.value) : null)}
                          className="w-full bg-input border border-line rounded-md p-2 text-ink text-[0.85rem] outline-none focus:border-primary transition-colors"
                        >
                          <option value="">Select a member...</option>
                          {activeGroup.members
                            .filter((m: GroupMember) => m.id !== user.id)
                            .map((m: GroupMember) => (
                              <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                            ))}
                        </select>
                      </div>
                    )}
                    <div className="flex items-center gap-2 max-md:w-full">
                      <button
                        onClick={() => { setConfirmLeave(false); setSelectedNewOwnerId(null); }}
                        className="py-1.5 px-3 rounded-lg text-[0.72rem] font-semibold bg-transparent border border-line text-ink-muted hover:bg-glass transition-all max-md:flex-1"
                      >Cancel</button>
                      <button
                        onClick={handleLeaveGroup}
                        disabled={isLeaving || (isCurrentUserOwner && activeGroup && activeGroup.members.length > 1 && !selectedNewOwnerId)}
                        className="py-1.5 px-3 rounded-lg text-[0.72rem] font-semibold bg-red-500 text-white border border-red-500 hover:bg-red-600 transition-all disabled:opacity-60 max-md:flex-1"
                      >
                        {isLeaving ? 'Leaving...' : 'Yes, Leave'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-line pb-0.5 mt-6 max-md:gap-1 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('study')}
                className={`py-2.5 px-5 max-md:px-3 max-md:py-2 max-md:text-xs border-b-2 font-bold text-sm transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
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
                className={`py-2.5 px-5 max-md:px-3 max-md:py-2 max-md:text-xs border-b-2 font-bold text-sm transition-all duration-150 cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  activeTab === 'discussion'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                <MessageSquare size={16} /> Group Discussion & AI
              </button>
            </div>

            {activeTab === 'study' ? (
              <>
              <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
                <div className="bg-card border border-line rounded-xl p-5 max-md:p-4">
                  <div className="flex justify-between items-center mb-5 max-md:flex-col max-md:items-stretch max-md:gap-3">
                    <h3 className="text-[1.15rem] flex items-center gap-2 m-0">Shared Modules</h3>
                    <button 
                      type="button" 
                      onClick={() => setIsShareModalOpen(true)}
                      className="inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg font-semibold text-xs transition-all duration-200 cursor-pointer bg-transparent border border-line text-ink hover:bg-input hover:border-line-strong select-none max-md:w-full"
                    >
                      <Plus size={12} /> Share Module
                    </button>
                  </div>
                  {activeGroup.modules.length === 0 ? (
                    <div className="text-center p-8 text-ink-muted">No shared modules in this group yet. Add a module to start studying together!</div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {activeGroup.modules.map((m) => (
                        <div className="flex max-md:flex-col max-md:items-stretch max-md:gap-3 md:justify-between md:items-center bg-app border border-line rounded-lg p-4 max-md:p-3.5 md:px-5" key={m.id}>
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="font-bold text-base max-md:text-[0.95rem] text-left wrap-break-word leading-snug">{m.name}</span>
                            <div className="text-[0.75rem] text-ink-muted flex gap-3">
                              <span>Questions: {m.questionsCount}</span>
                              {(m.sharedByName || m.userId) && (
                                <span className="flex items-center gap-1">
                                  · Shared by <span className="text-ink font-medium">
                                    {m.userId === user.id
                                      ? 'You'
                                      : m.sharedByName ?? activeGroup.members.find(mem => mem.id === m.userId)?.name ?? 'Unknown'}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {(isCurrentUserOwner || m.userId === user.id) && (
                              <button
                                type="button"
                                onClick={() => handleRemoveModuleFromGroup(m.id)}
                                disabled={isRemovingModuleId === m.id}
                                className="inline-flex items-center justify-center p-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Remove from group"
                              >
                                {isRemovingModuleId === m.id ? (
                                  <span className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin inline-block" />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            )}
                            <button onClick={() => startGroupQuiz(m, activeGroup.id)} className="btn btn-primary px-3.5 py-2 text-[0.8rem] max-md:w-full max-md:justify-center max-md:py-2.5">Take Group Quiz</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-card border border-line rounded-xl p-5 max-md:p-4">
                  <h3 className="text-[1.15rem] mb-5 flex items-center gap-2">Group Scorecards</h3>
                  {activeGroup.quizSessions.length === 0 ? (
                    <div className="text-center p-8 text-ink-muted">No group quizzes taken yet. Launch a Group Quiz session to view scoreboard history!</div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {activeGroup.quizSessions.map((s, idx) => (
                        <div key={idx} className="bg-app border border-line rounded-xl p-4 max-md:p-3.5 md:px-5">
                          <div className="flex justify-between items-center mb-3 max-md:flex-col max-md:items-start max-md:gap-2">
                            <span className="font-bold text-[0.95rem] text-left wrap-break-word">{s.moduleName}</span>
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

              {/* Shared Notes */}
              <div className="bg-card border border-line rounded-xl p-5 max-md:p-4 mt-6">
                <div className="flex justify-between items-center mb-5 max-md:flex-col max-md:items-stretch max-md:gap-3">
                  <h3 className="text-[1.15rem] flex items-center gap-2 m-0"><Notebook size={18} className="text-primary" /> Shared Notes</h3>
                  <button
                    type="button"
                    onClick={() => setIsNoteShareModalOpen(true)}
                    className="inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg font-semibold text-xs transition-all duration-200 cursor-pointer bg-transparent border border-line text-ink hover:bg-input hover:border-line-strong select-none max-md:w-full"
                  >
                    <Plus size={12} /> Share Note
                  </button>
                </div>
                {(activeGroup.notes || []).length === 0 ? (
                  <div className="text-center p-8 text-ink-muted">No shared notes yet. Share a note to collaborate with your group!</div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {activeGroup.notes.map((n) => (
                      <div className="bg-app border border-line rounded-lg p-4 max-md:p-3.5 cursor-pointer hover:bg-input transition-colors duration-150" key={n.id} onClick={() => setViewingSharedNote(n)}>
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm max-md:text-[0.9rem] text-left wrap-break-word leading-snug">{n.title}</span>
                              {n.isPinned && <span className="text-[0.6rem] bg-yellow-400/15 text-yellow-400 px-1.5 py-0.5 rounded-full font-bold">PINNED</span>}
                            </div>
                            <div className="text-[0.75rem] text-ink-muted flex gap-2 mt-0.5">
                              <span>{n.subject}</span>
                              <span>·</span>
                              <span>{new Date(n.updatedAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-ink-muted mt-2 line-clamp-2 leading-relaxed">{n.content?.slice(0, 200) || 'Empty note'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </>
            ) : (
              <div className="bg-card border border-line rounded-xl p-6 max-md:p-4 flex flex-col h-137.5 max-md:h-[min(65vh,520px)] min-h-90 shadow-lg animate-in fade-in duration-200">
                <div className="flex justify-between items-center pb-3 border-b border-line mb-4 shrink-0 max-md:flex-col max-md:items-start max-md:gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[1.15rem] font-bold text-ink flex items-center gap-2 m-0">
                      <Users size={18} className="text-primary shrink-0" /> Group Discussion
                    </h3>
                    <p className="text-xs text-ink-muted mt-0.5">Share notes, ask questions, or study with the AI.</p>
                  </div>
                  <div className="flex items-center gap-1 bg-primary-soft/10 text-primary border border-primary-line px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 max-md:self-start">
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
                            className={`flex items-start gap-3 p-3.5 max-md:p-3 rounded-xl transition-all duration-150 max-w-[80%] max-md:max-w-[92%] cursor-pointer select-none ${
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

                  {isAiResponding && (
                    <div className="flex flex-col w-full items-start">
                      <div className="flex items-start gap-3 p-3.5 max-md:p-3 rounded-xl bg-[linear-gradient(135deg,rgba(62,207,142,0.06),rgba(6,182,212,0.06))] border border-primary-line/45 shadow-sm max-w-[80%] max-md:max-w-[92%] select-none text-left">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[linear-gradient(135deg,var(--primary),var(--accent-cyan))] text-ink-on-primary font-bold shadow-md shrink-0">
                          <Sparkles size={16} className="animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline mb-1 gap-2 flex-wrap justify-between">
                            <span className="text-xs font-bold text-ink flex items-center gap-1.5 truncate">
                              Lumio
                              <span className="text-[0.62rem] font-bold bg-[linear-gradient(135deg,var(--primary),var(--accent-cyan))] text-ink-on-primary px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-[0.9] origin-left animate-pulse">
                                AI Tutor typing...
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-2.5">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={postsEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handlePostMessage} className="flex gap-2 max-md:flex-col shrink-0 pt-3 border-t border-line">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    disabled={isPosting}
                    placeholder="Type your message... (Tag @ai to ask the AI Study Companion)"
                    className="flex-1 py-2.5 px-4 max-md:py-3 bg-input border border-line rounded-lg text-ink text-sm outline-none focus:border-primary focus:bg-app transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed min-w-0"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isPosting || !newPostContent.trim()}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4.5 max-md:w-full rounded-lg font-bold text-sm bg-primary text-ink-on-primary hover:bg-primary-hover hover:border-primary-hover transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
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

        {/* Share Note Modal */}
        {isNoteShareModalOpen && (
          <div className="fixed inset-0 bg-[rgba(5,5,5,0.7)] backdrop-blur-sm z-3000 flex items-center justify-center p-4">
            <div className="bg-card border border-line rounded-2xl p-8 max-w-110 w-full shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-ink flex items-center gap-2">
                  <Notebook size={20} className="text-primary" /> Share Note
                </h3>
                <button onClick={() => { setIsNoteShareModalOpen(false); setSelectedNoteId(null); }} className="bg-transparent border-0 text-ink-muted hover:text-ink cursor-pointer p-1">
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-2 mb-6 text-left">
                <label className="text-[0.9rem] font-semibold text-ink">Select Note to Share</label>
                <select
                  value={selectedNoteId ?? ''}
                  onChange={(e) => setSelectedNoteId(e.target.value ? Number(e.target.value) : null)}
                  disabled={isNoteSharing}
                  className="w-full py-2 px-3 bg-input border border-line rounded-md text-ink text-sm outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">-- Choose note --</option>
                  {notes
                    .filter(n => !(activeGroup.notes || []).some(gn => gn.id === n.id))
                    .map(n => (
                      <option key={n.id} value={n.id}>{n.title}</option>
                    ))
                  }
                </select>
                {notes.filter(n => !(activeGroup.notes || []).some(gn => gn.id === n.id)).length === 0 && (
                  <span className="text-xs text-ink-muted mt-1">No unshared notes available. Create a note first!</span>
                )}
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => { setIsNoteShareModalOpen(false); setSelectedNoteId(null); }}
                  disabled={isNoteSharing}
                  className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-md font-semibold text-xs transition-all duration-200 cursor-pointer bg-transparent border border-line text-ink hover:bg-input hover:border-line-strong disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleShareNote}
                  disabled={isNoteSharing || selectedNoteId === null}
                  className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-md font-semibold text-xs transition-all duration-200 cursor-pointer bg-primary text-ink-on-primary border border-primary hover:bg-primary-hover hover:border-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isNoteSharing ? 'Sharing...' : 'Share with Group'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Shared Note Modal */}
        {viewingSharedNote && (
          <div className="fixed inset-0 bg-[rgba(5,5,5,0.7)] backdrop-blur-sm z-3000 flex items-center justify-center p-4" onClick={() => setViewingSharedNote(null)}>
            <div className="bg-card border border-line rounded-2xl p-8 max-w-150 w-full max-h-[80vh] overflow-y-auto shadow-lg" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-6 gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold text-ink break-words">{viewingSharedNote.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-ink-muted mt-1">
                    <span>{viewingSharedNote.subject}</span>
                    <span>·</span>
                    <span>Updated {new Date(viewingSharedNote.updatedAt).toLocaleDateString()}</span>
                    {viewingSharedNote.isPinned && (
                      <>
                        <span>·</span>
                        <span className="text-yellow-400 font-bold">PINNED</span>
                      </>
                    )}
                  </div>
                </div>
                <button onClick={() => setViewingSharedNote(null)} className="bg-transparent border-0 text-ink-muted hover:text-ink cursor-pointer p-1 shrink-0">
                  <X size={20} />
                </button>
              </div>
              <div className="text-sm text-ink leading-relaxed whitespace-pre-wrap break-words">
                {viewingSharedNote.content || 'Empty note'}
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

        {/* Group Members Modal */}
        {isMembersModalOpen && (
          <div className="fixed inset-0 bg-[rgba(5,5,5,0.7)] backdrop-blur-sm z-3000 flex items-center justify-center p-4">
            <div className="bg-card border border-line rounded-2xl p-6 max-w-md w-full shadow-lg flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                  <Users size={18} className="text-primary" /> Group Members ({activeGroup.members.length})
                </h3>
                <button 
                  onClick={() => setIsMembersModalOpen(false)} 
                  className="bg-transparent border-0 text-ink-muted hover:text-ink cursor-pointer p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto pr-1 flex flex-col gap-2 mt-2 max-h-[55vh]">
                {/* Current user */}
                <div className="flex items-center gap-3 py-2.5 px-3 bg-app border border-line rounded-lg">
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
                    <p className="text-sm font-medium text-ink truncate flex items-center gap-1.5 m-0 text-left">
                      <span className="truncate">{user.name}</span>
                      <span className="text-xs text-ink-muted font-normal shrink-0">(You)</span>
                      {user.is_premium && (
                        <span className="text-[0.6rem] font-extrabold bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider leading-none shrink-0">
                          Pro
                        </span>
                      )}
                      {isCurrentUserOwner && (
                        <span className="text-[0.6rem] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded uppercase tracking-wider leading-none shrink-0">Owner</span>
                      )}
                    </p>
                    <p className="text-xs text-ink-muted truncate m-0 text-left">{user.email}</p>
                  </div>
                </div>

                {/* Other members */}
                {activeGroup.members.filter(m => m.email !== user.email).map((m, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2.5 px-3 bg-app border border-line rounded-lg">
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
                      <p className="text-sm font-medium text-ink truncate flex items-center gap-1.5 m-0 text-left">
                        <span className="truncate">{m.name}</span>
                        {m.is_premium && (
                          <span className="text-[0.6rem] font-extrabold bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider leading-none shrink-0">
                            Pro
                          </span>
                        )}
                        {activeGroup.creator_id === m.id && (
                          <span className="text-[0.6rem] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded uppercase tracking-wider leading-none shrink-0">Owner</span>
                        )}
                      </p>
                      <p className="text-xs text-ink-muted truncate m-0 text-left">{m.email}</p>
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
                              className="absolute right-0 bottom-full mb-1 w-44 bg-card border border-line rounded-lg shadow-lg py-1 z-20"
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

              <div className="flex justify-end mt-6 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsMembersModalOpen(false)}
                  className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-md font-semibold text-xs transition-all duration-200 cursor-pointer bg-primary text-ink-on-primary border border-primary hover:bg-primary-hover hover:border-primary-hover"
                >
                  Close
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
      <div className="flex justify-between items-center mb-6 max-md:flex-col max-md:items-stretch max-md:gap-3">
        <h3 className="text-[1.15rem] flex items-center gap-2 m-0">My Study Groups</h3>
        <button onClick={() => setIsGroupModalOpen(true)} className="btn btn-primary max-md:w-full max-md:justify-center">
          <Plus size={18} /> Create Study Group
        </button>
      </div>

      {/* Invitations Inbox */}
      {invitations.length > 0 && (
        <div className="mb-8">
          <h4 className="text-[0.9rem] font-semibold text-ink-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <Mail size={15} />
            Pending Invitations
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[0.65rem] font-bold">{invitations.length}</span>
          </h4>
          <div className="flex flex-col gap-3">
            {invitations.map(inv => (
              <div key={inv.id} className="bg-card border border-line rounded-xl p-4 max-md:p-3.5 flex items-center gap-4 flex-wrap max-md:flex-col max-md:items-stretch max-md:gap-3">
                {/* Inviter avatar */}
                <div className="shrink-0">
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
                <div className="flex items-center gap-2 shrink-0 max-md:w-full">
                  <button
                    onClick={() => onDeclineInvitation(inv.id)}
                    className="inline-flex items-center gap-1 py-1.5 px-3 rounded-md text-[0.8rem] font-semibold bg-transparent border border-line text-ink-muted hover:bg-glass hover:text-ink transition-all max-md:flex-1 max-md:justify-center"
                  >
                    <X size={13} /> Decline
                  </button>
                  <button
                    onClick={() => onAcceptInvitation(inv.id)}
                    className="inline-flex items-center gap-1 py-1.5 px-3 rounded-md text-[0.8rem] font-semibold bg-primary text-ink-on-primary hover:bg-primary-hover transition-all max-md:flex-1 max-md:justify-center"
                  >
                    <Check size={13} /> Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 max-md:grid-cols-1 max-md:gap-4">
        {userGroupsList.map((group) => (
          <div className="bg-card border border-line rounded-xl p-5 max-md:p-4 flex flex-col h-full" key={group.id}>
            <h4 className="text-xl max-md:text-lg mb-2 text-left wrap-break-word">{group.name}</h4>
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

            <div className="mt-auto pt-4 flex justify-end max-md:justify-stretch">
              <button onClick={() => { setSelectedGroupId(group.id); completeQuest('study_group'); }} className="btn btn-outline inline-flex items-center gap-1 px-4 py-2 text-[0.85rem] max-md:w-full max-md:justify-center">
                Enter Group <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {isFetchingUserGroups && userGroupsList.length > 0 && (
        <div className="text-center py-4 text-xs text-ink-muted animate-pulse">
          Loading more study circles...
        </div>
      )}

      {publicGroups.length > 0 && (
        <div className="mt-10">
          <h4 className="text-[1rem] font-bold text-ink-muted uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users size={16} />
            Public Groups
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary-soft text-primary text-[0.65rem] font-bold">{publicGroups.length}</span>
          </h4>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 max-md:grid-cols-1 max-md:gap-4">
            {publicGroups.map((group) => (
              <div className="bg-card border border-line rounded-xl p-5 max-md:p-4 flex flex-col h-full" key={group.id}>
                <h4 className="text-xl max-md:text-lg mb-2 text-left wrap-break-word">{group.name}</h4>
                <span className="text-[0.85rem] text-ink-muted text-left">{group.members.length} Members | {group.modules.length} Shared Modules</span>

                <div className="flex items-center mt-3">
                  {group.members.slice(0, 5).map((m, idx) => (
                    <div key={idx} className="relative -ml-2 first:ml-0">
                      {m.avatar ? (
                        <img src={m.avatar} alt={m.name} referrerPolicy="no-referrer"
                          className={`w-8 h-8 rounded-full border-2 object-cover ${m.online ? 'border-primary' : 'border-card'}`}
                          title={`${m.name} (${m.online ? 'Online' : 'Offline'})`} />
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-glass-strong border-2 ${m.online ? 'border-primary text-primary' : 'border-card text-ink'}`}
                          title={`${m.name} (${m.online ? 'Online' : 'Offline'})`}>
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  ))}
                  {group.members.length > 5 && (
                    <div className="relative -ml-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-glass-strong border-2 border-card text-ink-muted">
                      +{group.members.length - 5}
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-4 flex justify-end max-md:justify-stretch">
                  <button
                    onClick={() => handleJoinPublicGroup(group.id)}
                    disabled={isJoiningGroup === group.id}
                    className="btn btn-primary inline-flex items-center gap-1 px-4 py-2 text-[0.85rem] max-md:w-full max-md:justify-center"
                  >
                    {isJoiningGroup === group.id ? 'Joining...' : 'Join Group'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {isFetchingPublicGroups && publicGroups.length > 0 && (
            <div className="text-center py-4 text-xs text-ink-muted animate-pulse">
              Loading more public groups...
            </div>
          )}
        </div>
      )}
    </div>
  );
};
