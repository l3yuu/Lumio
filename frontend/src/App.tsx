import { useEffect, useState } from 'react'
import {
  Sparkles, HelpCircle, Layers, UploadCloud, Timer, FileText, X, Loader2
} from 'lucide-react'

import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { MaintenancePage } from './components/layout/ErrorBoundary'

// Import views
import { LandingView } from './views/marketing/LandingView'
import { HowItWorksView } from './views/marketing/HowItWorksView'
import { ToolsView } from './views/marketing/ToolsView'
import { PricingView } from './views/marketing/PricingView'
import { ContactView } from './views/marketing/ContactView'
import { DocsView } from './views/marketing/DocsView'
import { AuthView } from './views/auth/AuthView'
import { PrivacyView } from './views/legal/PrivacyView'
import { TermsView } from './views/legal/TermsView'
import { FlashcardsTool } from './views/tools/FlashcardsTool'
import { EssayGraderTool } from './views/tools/EssayGraderTool'
import { CondenserTool } from './views/tools/CondenserTool'
import { PomodoroTool } from './views/tools/PomodoroTool'
import { DashboardView } from './views/dashboard/DashboardView'
import { API_BASE_URL } from './config'

import type { View, AuthTab, DashboardTab, User, Module, StudyGroup, GroupInvitation, UserResponse, ModuleResponse, QuizQuestionResponse, GroupQuizSessionResponse, GroupQuizRankResponse, StudyGroupResponse, Notification } from './types'

const mapUser = (data: UserResponse): User => ({
  id: data.id,
  name: data.name,
  email: data.email,
  avatar: data.avatar,
  school: data.school,
  username: data.username,
  bio: data.bio,
  gradeLevel: data.grade_level,
  studyGoal: data.study_goal,
  studyLanguage: data.study_language,
  streakGoal: data.streak_goal,
  timezone: data.timezone,
  is_verified: data.is_verified,
  level: data.level,
  xp: data.xp,
  streak: data.streak,
  quizzesCount: data.quizzes_count,
  quizHistory: data.quiz_history,
  studyTime: data.study_time,
  heatmapData: data.heatmap_data,
  focusAreas: data.focus_areas,
  spacedRecall: data.spaced_recall,
  quests: data.quests,
  questsDate: data.quests_date,
  lastCheckIn: data.last_check_in,
  folders: data.folders,
  role: data.role || 'user',
});

const mapModule = (m: ModuleResponse): Module => ({
  id: m.id,
  name: m.name,
  date: m.date,
  size: m.size,
  subject: m.subject || 'General',
  sourceFilename: m.source_filename,
  hasSourceFile: m.has_source_file,
  questionsCount: m.questionsCount !== undefined ? m.questionsCount : (m.questions ? m.questions.length : 0),
  questions: m.questions ? m.questions.map((q: QuizQuestionResponse) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    correctAnswerIndex: q.correct_answer_index
  })) : [],
  lastScore: m.last_score,
  difficulty: m.difficulty
});

const mapGroup = (g: StudyGroupResponse): StudyGroup => ({
  id: g.id,
  name: g.name,
  creator_id: g.creator_id,
  members: (g.members || []).map(m => ({
    id: m.id,
    name: m.name,
    email: m.email,
    avatar: m.avatar,
    online: m.online,
  })),
  modules: g.modules ? g.modules.map(mapModule) : [],
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

// ⚡ Toggle this to true to show maintenance page across the entire site
const MAINTENANCE_MODE = false;

const getPhilippineDateKey = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const getDailyGenerationQuota = (studyTime?: { [key: string]: number | string }) => {
  const quotaDate = typeof studyTime?.quota_date === 'string' ? studyTime.quota_date : '';
  const quotaUsed = quotaDate === getPhilippineDateKey() && typeof studyTime?.quota_used === 'number'
    ? studyTime.quota_used
    : 0;
  const remaining = Math.max(0, 5 - quotaUsed);
  return {
    remaining,
    isExceeded: remaining <= 0,
  };
};

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'light' ? 'light' : 'dark';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Navigation & Auth State
  const [view, setView] = useState<View>('landing');
  const [authTab, setAuthTab] = useState<AuthTab>('login');
  const [user, setUser] = useState<User | null>(null);

  // Dashboard Lifted State
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('overview');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [activeQuizModule, setActiveQuizModule] = useState<Module | null>(null);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);

  // Sidebar Collapsed State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleContent, setNewModuleContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isModalDragOver, setIsModalDragOver] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [newModuleDifficulty, setNewModuleDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [newModuleSubject, setNewModuleSubject] = useState('General');
  const [newModuleNumQuestions, setNewModuleNumQuestions] = useState<number>(10);

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMember, setNewGroupMember] = useState('');

  // Invitations
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaBanner, setShowPwaBanner] = useState(() => {
    return localStorage.getItem('dismissed-pwa-banner') !== 'true';
  });
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIosInstructionOpen, setIsIosInstructionOpen] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(ios);

    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(standalone);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handlePwaInstall = async () => {
    if (isIos) {
      setIsIosInstructionOpen(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
    }
    setDeferredPrompt(null);
  };

  const handleDismissPwaBanner = () => {
    setShowPwaBanner(false);
    localStorage.setItem('dismissed-pwa-banner', 'true');
  };

  const isPwaInstallable = !isStandalone && (!!deferredPrompt || isIos);

  const fetchNotifications = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE_URL}/api/notifications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setNotifications(data))
    .catch(err => console.error('Error fetching notifications:', err));
  };

  // Modules list
  const [modules, setModules] = useState<Module[]>([
    {
      id: 1,
      name: 'Cell Biology & Genetics - Chapter 3',
      date: 'Yesterday',
      size: '4.2 MB',
      questionsCount: 3,
      subject: 'Biology',
      questions: [
        {
          id: 101,
          question: 'Which organelle is commonly known as the powerhouse of the cell?',
          options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Lysosome'],
          correctAnswerIndex: 1
        },
        {
          id: 102,
          question: 'What is the primary cellular site of protein synthesis?',
          options: ['Ribosome', 'Golgi Apparatus', 'Endoplasmic Reticulum', 'Vacuole'],
          correctAnswerIndex: 0
        },
        {
          id: 103,
          question: 'Which process of cellular division yields 4 genetically unique haploid cells?',
          options: ['Mitosis', 'Meiosis', 'Fission', 'Budding'],
          correctAnswerIndex: 1
        }
      ]
    },
    {
      id: 2,
      name: 'Introduction to Microeconomics',
      date: '2 days ago',
      size: '1.8 MB',
      questionsCount: 2,
      subject: 'Economics',
      questions: [
        {
          id: 201,
          question: 'What happens to the demand of a normal good when its price increases, holding everything else constant?',
          options: ['It increases', 'It decreases', 'It remains unchanged', 'It drops to absolute zero'],
          correctAnswerIndex: 1
        },
        {
          id: 202,
          question: 'Which market structure is characterized by a single seller selling a unique product with no close substitutes?',
          options: ['Perfect competition', 'Oligopoly', 'Monopoly', 'Monopolistic competition'],
          correctAnswerIndex: 2
        }
      ]
    }
  ]);

  // Study Groups
  const [groups, setGroups] = useState<StudyGroup[]>([
    {
      id: 1,
      name: 'Biology 101 Midterm Study Circle',
      members: [
        { name: 'Sarah Miller', email: 'sarah@example.com', online: true },
        { name: 'Alex Johnson', email: 'alex@example.com', online: true },
        { name: 'Liam Sterling', email: 'liam@example.com', online: false }
      ],
      modules: [
        {
          id: 1,
          name: 'Cell Biology & Genetics - Chapter 3',
          date: 'Yesterday',
          size: '4.2 MB',
          questionsCount: 3,
          questions: [
            {
              id: 101,
              question: 'Which organelle is commonly known as the powerhouse of the cell?',
              options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Lysosome'],
              correctAnswerIndex: 1
            },
            {
              id: 102,
              question: 'What is the primary cellular site of protein synthesis?',
              options: ['Ribosome', 'Golgi Apparatus', 'Endoplasmic Reticulum', 'Vacuole'],
              correctAnswerIndex: 0
            },
            {
              id: 103,
              question: 'Which process of cellular division yields 4 genetically unique haploid cells?',
              options: ['Mitosis', 'Meiosis', 'Fission', 'Budding'],
              correctAnswerIndex: 1
            }
          ]
        }
      ],
      quizSessions: [
        {
          id: 501,
          moduleName: 'Cell Biology & Genetics - Chapter 3',
          date: '3 days ago',
          avgScore: '83%',
          rankings: [
            { name: 'Sarah Miller', score: '3/3', percentage: 100, time: '0m 45s', isUser: false },
            { name: 'Alex Johnson', score: '2/3', percentage: 67, time: '1m 15s', isUser: false },
            { name: 'Liam Sterling', score: '2/3', percentage: 67, time: '1m 32s', isUser: false }
          ]
        }
      ]
    },
    {
      id: 2,
      name: 'Econ Major Core Team',
      members: [
        { name: 'David Vance', email: 'david@example.com', online: true },
        { name: 'Emma Watson', email: 'emma@example.com', online: false }
      ],
      modules: [
        {
          id: 2,
          name: 'Introduction to Microeconomics',
          date: '2 days ago',
          size: '1.8 MB',
          questionsCount: 2,
          questions: [
            {
              id: 201,
              question: 'What happens to the demand of a normal good when its price increases, holding everything else constant?',
              options: ['It increases', 'It decreases', 'It remains unchanged', 'It drops to absolute zero'],
              correctAnswerIndex: 1
            },
            {
              id: 202,
              question: 'Which market structure is characterized by a single seller selling a unique product with no close substitutes?',
              options: ['Perfect competition', 'Oligopoly', 'Monopoly', 'Monopolistic competition'],
              correctAnswerIndex: 2
            }
          ]
        }
      ],
      quizSessions: []
    }
  ]);

  const checkAndJoinPendingGroup = (token: string) => {
    const pendingGroupIdStr = localStorage.getItem('pending_join_group_id');
    if (!pendingGroupIdStr) return;
    const pendingGroupId = parseInt(pendingGroupIdStr, 10);
    if (isNaN(pendingGroupId)) {
      localStorage.removeItem('pending_join_group_id');
      return;
    }

    fetch(`${API_BASE_URL}/api/groups/${pendingGroupId}/join-via-link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(async res => {
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail || 'Failed to join group via link');
      return data;
    })
    .then(joinedGroup => {
      localStorage.removeItem('pending_join_group_id');
      setGroups(prev => {
        const mapped = mapGroup(joinedGroup);
        if (prev.some(g => g.id === mapped.id)) {
          return prev.map(g => g.id === mapped.id ? mapped : g);
        }
        return [mapped, ...prev];
      });
      setView('dashboard');
      setDashboardTab('groups');
      setSelectedGroupId(joinedGroup.id);
    })
    .catch(err => {
      console.error('Error joining group via link:', err);
      localStorage.removeItem('pending_join_group_id');
    });
  };

  // Hydrate user and data from backend if token exists
  useEffect(() => {
    // Check for pending group invitation in URL
    const params = new URLSearchParams(window.location.search);
    const joinGroupId = params.get('join_group');
    if (joinGroupId) {
      localStorage.setItem('pending_join_group_id', joinGroupId);
      // Clear query parameter from the URL to keep it clean
      window.history.replaceState({}, document.title, window.location.pathname);
    }


    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Invalid token');
        return res.json();
      })
      .then(userData => {
        const mappedUser = mapUser(userData);
        setUser(mappedUser);
        setView('dashboard');
        // Superadmins go to the admin overview by default
        if (mappedUser.role === 'superadmin') {
          setDashboardTab('admin-overview');
        }

        // Fetch modules
        fetch(`${API_BASE_URL}/api/modules`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setModules(data.map(mapModule)))
        .catch(err => console.error('Error fetching modules:', err));

        // Fetch groups
        fetch(`${API_BASE_URL}/api/groups`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setGroups(data.map(mapGroup)))
        .catch(err => console.error('Error fetching groups:', err));

        // Fetch pending invitations
        fetch(`${API_BASE_URL}/api/groups/invitations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) throw new Error(data?.detail || 'Failed');
          if (!Array.isArray(data)) throw new Error('Invalid response');
          setInvitations(data);
        })
        .catch(err => console.error('Error fetching invitations:', err));

        fetchNotifications();

        // Check if there is a pending group to join
        checkAndJoinPendingGroup(token);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
        setView('landing');
      });
    } else if (joinGroupId) {
      // Redirect unauthenticated user to the auth page
      setTimeout(() => {
        setView('auth');
        setAuthTab('login');
      }, 0);
    }
  }, []);

  const handleLoginSuccess = (userData: User, token: string) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setView('dashboard');
    // Superadmins go to the admin overview by default
    if (userData.role === 'superadmin') {
      setDashboardTab('admin-overview');
    }
    
    // Fetch modules
    fetch(`${API_BASE_URL}/api/modules`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setModules(data.map(mapModule)))
    .catch(err => console.error('Error fetching modules:', err));

    // Fetch groups
    fetch(`${API_BASE_URL}/api/groups`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setGroups(data.map(mapGroup)))
    .catch(err => console.error('Error fetching groups:', err));

    // Fetch pending invitations
    fetch(`${API_BASE_URL}/api/groups/invitations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Failed');
      if (!Array.isArray(data)) throw new Error('Invalid response');
      setInvitations(data);
    })
    .catch(err => console.error('Error fetching invitations:', err));

    fetchNotifications();

    // Check if there is a pending group to join after successful login/registration
    checkAndJoinPendingGroup(token);
  };

  // Heartbeat — keeps the current user marked as online every 60s
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const ping = () =>
      fetch(`${API_BASE_URL}/api/auth/heartbeat`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => {});
    ping(); // immediate ping on login
    const id = setInterval(ping, 60_000);
    return () => clearInterval(id);
  }, [user]);

  const handleAcceptInvitation = (invitationId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE_URL}/api/groups/invitations/${invitationId}/accept`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(async res => {
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail || 'Failed to accept invitation');
      return data;
    })
    .then(newGroup => {
      // Add the new group if not already in list
      setGroups(prev => prev.some(g => g.id === newGroup.id) ? prev.map(g => g.id === newGroup.id ? mapGroup(newGroup) : g) : [mapGroup(newGroup), ...prev]);
      setInvitations(prev => prev.filter(i => i.id !== invitationId));
    })
    .catch(err => alert(err.message));
  };

  const handleDeclineInvitation = (invitationId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE_URL}/api/groups/invitations/${invitationId}/decline`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to decline invitation');
      setInvitations(prev => prev.filter(i => i.id !== invitationId));
    })
    .catch(err => alert(err.message));
  };
  
  const handleMarkNotificationRead = (notificationId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to mark as read');
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    })
    .catch(err => console.error('Error marking notification as read:', err));
  };

  const handleMarkAllNotificationsRead = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE_URL}/api/notifications/read-all`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to mark all as read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    })
    .catch(err => console.error('Error marking all as read:', err));
  };

  const handleRefreshNotifications = () => {
    fetchNotifications();
    // Also refresh invitations
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE_URL}/api/groups/invitations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.detail || 'Failed');
        if (!Array.isArray(data)) throw new Error('Invalid response');
        setInvitations(data);
      })
      .catch(err => console.error('Error refreshing invitations:', err));
    }
  };

  // Sync theme to document on every change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Scroll reveal Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, {
      threshold: 0.05,
    });

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [view]);

  // Lock window scroll on dashboard and auth views
  useEffect(() => {
    if (view === 'dashboard' || view === 'auth') {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [view]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('lumio-module-scores');
    setUser(null);
    setView('landing');
  };

  const handleFileSelection = (file: File) => {
    // 1. Validate file extension
    const allowedExtensions = ['.pdf', '.txt', '.docx'];
    const fileNameLower = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileNameLower.endsWith(ext));

    // 2. Validate MIME type
    const allowedMimeTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const hasValidMime = allowedMimeTypes.includes(file.type);

    if (!hasValidExtension || !hasValidMime) {
      alert('Security Alert: Only PDF, TXT, and DOCX files are allowed.');
      return;
    }

    // 3. Validate file size (10MB limit)
    const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert('Security Alert: File size exceeds the maximum limit of 10MB.');
      return;
    }

    setSelectedFile(file);
    if (!newModuleName) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setNewModuleName(baseName);
    }
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewModuleContent(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileDropped = (file: File) => {
    handleFileSelection(file);
    setIsUploadOpen(true);
  };

  // Add a new module
  const handleAddModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleName || isGeneratingQuiz) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const formData = new FormData();
    formData.append('name', newModuleName);
    formData.append('subject', newModuleSubject);
    formData.append('difficulty', newModuleDifficulty);
    formData.append('num_questions', String(newModuleNumQuestions));
    
    if (selectedFile) {
      formData.append('file', selectedFile);
      formData.append('size', `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`);
    } else {
      formData.append('size', `${(Math.random() * 3 + 1).toFixed(1)} MB`);
    }

    if (newModuleContent) {
      formData.append('text_content', newModuleContent);
    }

    setIsGeneratingQuiz(true);

    fetch(`${API_BASE_URL}/api/modules`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
    .then(async res => {
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error(data?.detail || 'Daily quiz generation limit reached.');
        }
        throw new Error(data?.detail || 'Failed to create module');
      }
      return data;
    })
    .then(newModule => {
      setModules([mapModule(newModule), ...modules]);
      setNewModuleName('');
      setNewModuleContent('');
      setSelectedFile(null);
      setNewModuleDifficulty('medium');
      setNewModuleSubject('General');
      setNewModuleNumQuestions(10);
      setIsUploadOpen(false);

      // Refetch user profile to update quota state
      const token = localStorage.getItem('token');
      if (token) {
        fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.ok ? res.json() : null)
        .then(userData => {
          if (userData) setUser(mapUser(userData));
        })
        .catch(err => console.error('Error refreshing user details:', err));
      }
    })
    .catch(err => {
      console.error(err);
      alert(err.message || 'Error creating module on backend');
    })
    .finally(() => {
      setIsGeneratingQuiz(false);
    });
  };

  // Create Group Action
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const payload = {
      name: newGroupName,
      members: newGroupMember ? [newGroupMember] : []
    };

    fetch(`${API_BASE_URL}/api/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to create group');
      return res.json();
    })
    .then(newGroup => {
      setGroups([mapGroup(newGroup), ...groups]);
      setNewGroupName('');
      setNewGroupMember('');
      setIsGroupModalOpen(false);
    })
    .catch(err => {
      console.error(err);
      alert('Error creating group');
    });
  };

  const studyTools = [
    { title: 'Flashcard Generator', desc: 'Auto-generate revision cards from notes.', icon: <Sparkles size={20} /> },
    { title: 'AI Essay Grader', desc: 'Get grading reviews on your practice essays.', icon: <HelpCircle size={20} /> },
    { title: 'Document Condenser', desc: 'Condense large textbooks in seconds.', icon: <Layers size={20} /> },
    { title: 'Pomodoro Focus Timer', desc: 'Track focus intervals with custom audio alerts.', icon: <Timer size={20} /> }
  ];

  return (
    MAINTENANCE_MODE
      ? <MaintenancePage onReload={() => window.location.reload()} />
      : <div className={`flex flex-col ${view === 'dashboard' ? 'h-screen overflow-hidden pt-14.5' : view === 'auth' ? 'h-screen' : 'pt-14.5 min-h-screen'}`}>
        {view !== 'auth' && (
          <Navbar
            user={user}
            theme={theme}
            view={view}
            setView={setView}
            setAuthTab={setAuthTab}
            toggleTheme={toggleTheme}
            handleLogout={handleLogout}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
            setActiveQuizModule={setActiveQuizModule}
            setSelectedGroupId={setSelectedGroupId}
            dashboardTab={dashboardTab}
            setDashboardTab={setDashboardTab}
            onToggleSidebar={handleToggleSidebar}
            isSidebarCollapsed={isSidebarCollapsed}
            notifications={notifications}
            invitations={invitations}
            onMarkNotificationRead={handleMarkNotificationRead}
            onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
            onAcceptInvitation={handleAcceptInvitation}
            onDeclineInvitation={handleDeclineInvitation}
            onToggleAiSidebar={() => setIsAiSidebarOpen(!isAiSidebarOpen)}
            isPwaInstallable={isPwaInstallable}
            onPwaInstall={handlePwaInstall}
            showPwaBanner={showPwaBanner}
            onDismissPwaBanner={handleDismissPwaBanner}
          />
        )}

        <main
          className={
            view === 'auth'
              ? "max-w-full w-full p-0 flex-1 flex flex-col overflow-hidden"
              : view === 'docs'
                ? "flex-1"
                : view === 'dashboard'
                  ? "max-w-full w-full p-0 flex-1"
                  : "max-w-300 mx-auto pt-2 max-md:pt-4 px-5 sm:px-8 pb-16 flex-1 w-full overflow-x-hidden"
          }
        >
          {view === 'landing' && (
            <LandingView
              user={user}
              setView={setView}
              setAuthTab={setAuthTab}
              isPwaInstallable={isPwaInstallable}
              onPwaInstall={handlePwaInstall}
            />
          )}

          {view === 'how-it-works' && (
            <HowItWorksView
              setView={setView}
              setAuthTab={setAuthTab}
            />
          )}

          {view === 'tools' && (
            <ToolsView setView={setView} />
          )}

          {view === 'flashcards' && (
            <FlashcardsTool setView={setView} />
          )}

          {view === 'essay-grader' && (
            <EssayGraderTool setView={setView} />
          )}

          {view === 'condenser' && (
            <CondenserTool setView={setView} />
          )}

          {view === 'pomodoro' && (
            <PomodoroTool setView={setView} />
          )}

          {view === 'pricing' && (
            <PricingView
              setView={setView}
              setAuthTab={setAuthTab}
            />
          )}

          {view === 'docs' && (
            <DocsView />
          )}

          {view === 'contact' && (
            <ContactView />
          )}

          {view === 'privacy' && (
            <PrivacyView />
          )}

          {view === 'terms' && (
            <TermsView />
          )}

          {view === 'auth' && (
            <AuthView
              authTab={authTab}
              setAuthTab={setAuthTab}
              setView={setView}
              onLoginSuccess={handleLoginSuccess}
            />
          )}

          {view === 'dashboard' && user && (
            <DashboardView
              user={user}
              setUser={setUser}
              modules={modules}
              groups={groups}
              setModules={setModules}
              setGroups={setGroups}
              setIsUploadOpen={setIsUploadOpen}
              setIsGroupModalOpen={setIsGroupModalOpen}
              studyTools={studyTools}
              dashboardTab={dashboardTab}
              setDashboardTab={setDashboardTab}
              selectedGroupId={selectedGroupId}
              setSelectedGroupId={setSelectedGroupId}
              activeQuizModule={activeQuizModule}
              setActiveQuizModule={setActiveQuizModule}
              isSidebarCollapsed={isSidebarCollapsed}
              setView={setView}
              handleLogout={handleLogout}
              invitations={invitations}
              onAcceptInvitation={handleAcceptInvitation}
              onDeclineInvitation={handleDeclineInvitation}
              notifications={notifications}
              onMarkNotificationRead={handleMarkNotificationRead}
              onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
              onRefreshNotifications={handleRefreshNotifications}
              onFileDropped={handleFileDropped}
              isAiSidebarOpen={isAiSidebarOpen}
              setIsAiSidebarOpen={setIsAiSidebarOpen}
            />
          )}
        </main>

        {/* Add Module Modal */}
        {isUploadOpen && (() => {
          const { remaining: remainingQuotas, isExceeded: isQuotaExceeded } = getDailyGenerationQuota(user?.studyTime);
          return (
            <div className="fixed inset-0 bg-[rgba(5,5,5,0.7)] backdrop-blur-sm z-3000 flex items-center justify-center p-4">
              <div className="bg-card border border-line rounded-2xl p-8 max-w-140 w-full shadow-lg max-h-[90vh] flex flex-col">
                <h3 className="text-2xl mb-6 shrink-0">Upload Study Module</h3>

                <form onSubmit={handleAddModule} className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex-1 overflow-y-auto pr-1 min-h-0 space-y-4 pb-2">
                    {/* Daily Quota Indicator */}
                    <div className="p-3.5 bg-app border border-line rounded-xl flex justify-between items-center text-xs">
                      <span className="text-ink-muted font-medium">Daily AI Generation Quota</span>
                      <span className={`font-bold ${isQuotaExceeded ? 'text-danger' : 'text-primary'}`}>
                        {remainingQuotas} / 5 remaining today
                      </span>
                    </div>

                    {isQuotaExceeded && (
                      <div className="p-3.5 bg-danger-soft border border-danger-line rounded-xl text-xs text-danger font-semibold leading-relaxed">
                        ⚠️ You have reached your daily limit of 5 quiz generations. Please wait until tomorrow or upgrade to Pro to unlock unlimited study modules.
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <label className="text-[0.9rem] font-semibold text-ink">Module Name</label>
                      <input
                        type="text"
                        placeholder="e.g. History Midterm Prep"
                        className="w-full py-2 px-3 bg-input border border-line rounded-md text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app disabled:opacity-60 disabled:cursor-not-allowed"
                        value={newModuleName}
                        onChange={(e) => setNewModuleName(e.target.value)}
                        required
                        disabled={isGeneratingQuiz || isQuotaExceeded}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[0.9rem] font-semibold text-ink">Quiz Difficulty Level</label>
                      <div className="flex gap-2">
                        {(['easy', 'medium', 'hard'] as const).map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setNewModuleDifficulty(level)}
                            disabled={isGeneratingQuiz || isQuotaExceeded}
                            className={`flex-1 py-2 rounded-md font-bold text-xs capitalize border transition-all duration-150 ${
                              newModuleDifficulty === level
                                ? 'bg-primary text-ink-on-primary border-primary shadow-glow-primary-soft'
                                : 'bg-input border-line text-ink-muted hover:text-ink hover:border-line-strong'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[0.9rem] font-semibold text-ink">Number of Questions</label>
                      <div className="flex gap-2">
                        {([10, 20, 30] as const).map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setNewModuleNumQuestions(num)}
                            disabled={isGeneratingQuiz || isQuotaExceeded}
                            className={`flex-1 py-2 rounded-md font-bold text-xs capitalize border transition-all duration-150 ${
                              newModuleNumQuestions === num
                                ? 'bg-primary text-ink-on-primary border-primary shadow-glow-primary-soft'
                                : 'bg-input border-line text-ink-muted hover:text-ink hover:border-line-strong'
                            }`}
                          >
                            {num} Questions
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[0.9rem] font-semibold text-ink">Folder (Subject)</label>
                      <select
                        value={newModuleSubject}
                        onChange={(e) => setNewModuleSubject(e.target.value)}
                        disabled={isGeneratingQuiz || isQuotaExceeded}
                        className="w-full py-2 px-3 bg-input border border-line rounded-md text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {(user?.folders || ['General']).map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    <div
                      onDragOver={(e) => {
                        if (isGeneratingQuiz || isQuotaExceeded) return;
                        e.preventDefault();
                        setIsModalDragOver(true);
                      }}
                      onDragLeave={() => {
                        if (isGeneratingQuiz || isQuotaExceeded) return;
                        setIsModalDragOver(false);
                      }}
                      onDrop={(e) => {
                        if (isGeneratingQuiz || isQuotaExceeded) return;
                        e.preventDefault();
                        setIsModalDragOver(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleFileSelection(file);
                      }}
                      onClick={() => {
                        if (!isGeneratingQuiz && !isQuotaExceeded) {
                          document.getElementById('file-loader')?.click();
                        }
                      }}
                      className={`border-2 border-dashed rounded-xl p-8 text-center bg-app flex flex-col items-center justify-center gap-3 transition-all duration-200 select-none ${
                        isGeneratingQuiz || isQuotaExceeded
                          ? 'border-line bg-input opacity-60 cursor-not-allowed'
                          : isModalDragOver
                            ? 'border-primary bg-primary-soft/20 scale-[1.01] shadow-glow-primary-soft cursor-pointer'
                            : selectedFile
                              ? 'border-primary/50 bg-primary-soft/5 hover:bg-primary-soft/10 hover:border-primary cursor-pointer'
                              : 'border-line hover:border-primary cursor-pointer'
                      }`}
                    >
                      <input
                        type="file"
                        id="file-loader"
                        className="hidden"
                        accept=".pdf,.txt,.docx"
                        disabled={isGeneratingQuiz || isQuotaExceeded}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelection(file);
                        }}
                      />
                      {selectedFile ? (
                        <div className="flex flex-col items-center gap-2 w-full">
                          <div className="flex items-center gap-3 bg-card border border-line rounded-xl p-4 w-full relative">
                            <div className="bg-primary-soft text-primary p-2.5 rounded-lg">
                              <FileText size={24} />
                            </div>
                            <div className="flex flex-col items-start overflow-hidden text-left pr-8 w-full">
                              <span className="font-semibold text-sm text-ink truncate w-full">{selectedFile.name}</span>
                              <span className="text-[0.75rem] text-ink-muted">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                            </div>
                            {!isGeneratingQuiz && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFile(null);
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 text-ink-muted hover:text-danger p-1 transition-colors cursor-pointer"
                                title="Remove file"
                              >
                                <X size={18} />
                              </button>
                            )}
                          </div>
                          <span className="text-[0.75rem] text-primary font-medium">
                            {isGeneratingQuiz ? 'Generating practice questions using AI...' : 'File attached successfully! Click "Generate Quiz" below to start.'}
                          </span>
                        </div>
                      ) : (
                        <>
                          <UploadCloud size={32} color="var(--primary)" />
                          <span className="font-semibold text-[0.95rem]">Choose a file or drag it here</span>
                          <span className="text-[0.8rem] text-ink-muted">PDF, TXT, DOCX up to 10MB</span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[0.9rem] font-semibold text-ink">Paste Text Content (Optional)</label>
                      <textarea
                        placeholder="Paste lecture transcription or syllabus outlines..."
                        className="w-full py-3 px-4 bg-input border border-line rounded-md text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app min-h-25 resize-y disabled:opacity-60 disabled:cursor-not-allowed"
                        value={newModuleContent}
                        onChange={(e) => setNewModuleContent(e.target.value)}
                        disabled={isGeneratingQuiz || isQuotaExceeded}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 justify-end mt-6 shrink-0 pt-4 border-t border-line">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUploadOpen(false);
                        setSelectedFile(null);
                      }}
                      disabled={isGeneratingQuiz}
                      className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-md font-semibold text-sm transition-all duration-200 no-underline cursor-pointer bg-transparent border border-line text-ink hover:bg-input hover:border-line-strong disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isGeneratingQuiz || !newModuleName || isQuotaExceeded}
                      className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-md font-semibold text-sm transition-all duration-200 no-underline cursor-pointer bg-primary text-ink-on-primary border border-primary hover:bg-primary-hover hover:border-primary-hover hover:shadow-glow-primary-btn disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                    >
                      {isGeneratingQuiz ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Generating...
                        </>
                      ) : (
                        'Generate Quiz'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

        {/* Create Group Modal */}
        {isGroupModalOpen && (
          <div className="fixed inset-0 bg-[rgba(5,5,5,0.7)] backdrop-blur-sm z-3000 flex items-center justify-center p-4">
            <div className="bg-card border border-line rounded-2xl p-8 max-w-140 w-full shadow-lg">
              <h3 className="text-2xl mb-6">Create Study Group</h3>

              <form onSubmit={handleCreateGroup}>
                <div className="flex flex-col gap-2 mb-4">
                  <label className="text-[0.9rem] font-semibold text-ink">Group Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Calculus Midterm Prep"
                    className="w-full py-2 px-3 bg-input border border-line rounded-md text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2 mb-4">
                  <label className="text-[0.9rem] font-semibold text-ink">Add Member (Email or Name)</label>
                  <input
                    type="text"
                    placeholder="e.g. alex@example.com"
                    className="w-full py-2 px-3 bg-input border border-line rounded-md text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app"
                    value={newGroupMember}
                    onChange={(e) => setNewGroupMember(e.target.value)}
                  />
                </div>

                <div className="flex gap-4 justify-end mt-6">
                  <button type="button" onClick={() => setIsGroupModalOpen(false)} className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-md font-semibold text-sm transition-all duration-200 no-underline cursor-pointer bg-transparent border border-line text-ink hover:bg-input hover:border-line-strong">Cancel</button>
                  <button type="submit" className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-md font-semibold text-sm transition-all duration-200 no-underline cursor-pointer bg-primary text-ink-on-primary border border-primary hover:bg-primary-hover hover:border-primary-hover hover:shadow-glow-primary-btn">Create Group</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* iOS PWA Instruction Modal */}
        {isIosInstructionOpen && (
          <div className="fixed inset-0 bg-[rgba(5,5,5,0.7)] backdrop-blur-sm z-3000 flex items-center justify-center p-4">
            <div className="bg-card border border-line rounded-2xl p-6 max-w-100 w-full shadow-lg relative text-ink">
              <button 
                onClick={() => setIsIosInstructionOpen(false)}
                className="absolute top-4 right-4 hover:bg-[rgba(255,255,255,0.05)] p-1 rounded transition text-ink-muted hover:text-ink cursor-pointer border-0 bg-transparent flex items-center justify-center"
                aria-label="Close instructions modal"
              >
                <X size={18} />
              </button>
              
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-xl font-bold">Install Lumio on iOS</h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Get a native-like experience by adding Lumio to your home screen. It takes less than 10 seconds:
                </p>
              </div>

              <div className="my-6 bg-input rounded-xl border border-line p-4 flex flex-col gap-4 text-sm">
                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-line flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  <span>Tap the <strong>Share</strong> button at the bottom of Safari (the box with an up-arrow).</span>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-line flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  <span>Scroll down the menu and select <strong>Add to Home Screen</strong>.</span>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-line flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  <span>Tap <strong>Add</strong> in the top-right corner.</span>
                </div>
              </div>

              <button
                onClick={() => setIsIosInstructionOpen(false)}
                className="w-full py-2.5 bg-primary text-ink-on-primary rounded-xl font-bold hover:bg-primary-hover hover:shadow-glow-primary-btn transition cursor-pointer border-0"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {view !== 'auth' && view !== 'dashboard' && (
          <Footer
            user={user}
            setView={setView}
          />
        )}
      </div>
  )
}

export default App
