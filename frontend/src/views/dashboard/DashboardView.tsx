import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, AlertTriangle } from 'lucide-react';
import type { User, Module, StudyGroup, GroupInvitation, GroupQuizSession, GroupQuizRank, DashboardTab, View, StudyQuest, ExamDeadline, ExamDeadlineResponse, StudyGroupResponse, Notification } from '../../types';
import { API_BASE_URL } from '../../config';

import { DashboardSidebar } from './DashboardSidebar';
import { OverviewPanel } from './OverviewPanel';
import { ModulesPanel } from './ModulesPanel';
import { GroupsPanel } from './GroupsPanel';
import { ToolsPanel } from './ToolsPanel';
import { SettingsPanel } from './SettingsPanel';
import { QuizPanel } from './QuizPanel';
import { CalendarPanel } from './CalendarPanel';
import { NotificationsPanel } from './NotificationsPanel';
import { FlashcardsTool } from '../tools/FlashcardsTool';
import { EssayGraderTool } from '../tools/EssayGraderTool';
import { CondenserTool } from '../tools/CondenserTool';
import { PomodoroTool } from '../tools/PomodoroTool';

type ActiveTool = 'flashcards' | 'essay-grader' | 'condenser' | 'pomodoro';

interface DashboardViewProps {
  user: User;
  setUser: (user: User | null) => void;
  modules: Module[];
  groups: StudyGroup[];
  setModules: React.Dispatch<React.SetStateAction<Module[]>>;
  setGroups: React.Dispatch<React.SetStateAction<StudyGroup[]>>;
  setIsUploadOpen: (open: boolean) => void;
  setIsGroupModalOpen: (open: boolean) => void;
  studyTools: { title: string; desc: string; icon: React.ReactNode }[];
  dashboardTab: DashboardTab;
  setDashboardTab: (tab: DashboardTab) => void;
  selectedGroupId: number | null;
  setSelectedGroupId: (id: number | null) => void;
  activeQuizModule: Module | null;
  setActiveQuizModule: (mod: Module | null) => void;
  isSidebarCollapsed: boolean;
  setView: (view: View) => void;
  handleLogout: () => void;
  invitations: GroupInvitation[];
  onAcceptInvitation: (id: number) => void;
  onDeclineInvitation: (id: number) => void;
  notifications: Notification[];
  onMarkNotificationRead: (id: number) => void;
  onMarkAllNotificationsRead: () => void;
  onRefreshNotifications: () => void;
  onFileDropped?: (file: File) => void;
}

const defaultHeatmap = [
  { label: 'Mon', hours: 0, level: 0 }, { label: 'Tue', hours: 0, level: 0 },
  { label: 'Wed', hours: 0, level: 0 }, { label: 'Thu', hours: 0, level: 0 },
  { label: 'Fri', hours: 0, level: 0 }, { label: 'Sat', hours: 0, level: 0 },
  { label: 'Sun', hours: 0, level: 0 }, { label: 'Mon', hours: 0, level: 0 },
  { label: 'Tue', hours: 0, level: 0 }, { label: 'Wed', hours: 0, level: 0 },
  { label: 'Thu', hours: 0, level: 0 }, { label: 'Fri', hours: 0, level: 0 },
  { label: 'Sat', hours: 0, level: 0 }, { label: 'Sun', hours: 0, level: 0 }
];

const defaultStudyTime = {
  "Biology": 0,
  "Economics": 0,
  "Mathematics": 0,
  "General Study": 0
};

const asStudyHours = (value: number | string | undefined, fallback = 0) =>
  typeof value === 'number' ? value : fallback;

const questPool: Omit<StudyQuest, 'completed'>[] = [
  { id: 'ask_ai', text: 'Query the AI Concept Tutor once', points: 50, actionType: 'ask_ai' },
  { id: 'view_settings', text: 'Review your Account Profile settings', points: 30, actionType: 'view_settings' },
  { id: 'complete_quiz', text: 'Complete any Practice Quiz', points: 70, actionType: 'complete_quiz' },
  { id: 'study_group', text: 'Visit one of your study groups', points: 40, actionType: 'study_group' },
  { id: 'add_exam', text: 'Add a new exam countdown', points: 30, actionType: 'custom' },
  { id: 'custom_avatar', text: 'Choose or upload a new profile picture', points: 40, actionType: 'custom' },
  { id: 'change_school', text: 'Set your school in settings tab', points: 30, actionType: 'custom' }
];

const getDeterministicDailyQuests = (userEmail: string, dateStr: string, pool: Omit<StudyQuest, 'completed'>[]): StudyQuest[] => {
  let hash = 0;
  const str = userEmail + dateStr;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const selected: StudyQuest[] = [];
  const tempPool = [...pool];
  for (let i = 0; i < 3; i++) {
    if (tempPool.length === 0) break;
    const index = Math.abs(hash + i) % tempPool.length;
    selected.push({ ...tempPool[index], completed: false });
    tempPool.splice(index, 1);
  }
  return selected;
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  user, setUser, modules, groups, setModules, setGroups, setIsUploadOpen, setIsGroupModalOpen,
  studyTools, dashboardTab, setDashboardTab, selectedGroupId, setSelectedGroupId,
  activeQuizModule, setActiveQuizModule, isSidebarCollapsed: isCollapsed, setView, handleLogout,
  invitations, onAcceptInvitation, onDeclineInvitation,
  notifications, onMarkNotificationRead, onMarkAllNotificationsRead, onRefreshNotifications,
  onFileDropped,
}) => {
  const [activeTool, setActiveTool] = useState<ActiveTool | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null);
  const [moduleScores, setModuleScores] = useState<{ [moduleId: number]: string }>(() => {
    const stored = localStorage.getItem('lumio-module-scores');
    return stored ? JSON.parse(stored) : {};
  });

  // Wrap setDashboardTab so switching away from 'tools' clears the active inline tool
  const handleSetDashboardTab = (tab: DashboardTab) => {
    if (tab !== 'tools') setActiveTool(null);
    setDashboardTab(tab);
  };

  // Local setView for inline tool components: 'tools' goes back to tool list, else navigates away
  const inlineToolSetView = (v: View) => {
    if (v === 'tools') setActiveTool(null);
    else setView(v);
  };
  const [level, setLevel] = useState<number>(user.level || 1);
  const [xp, setXp] = useState<number>(user.xp || 0);
  const [quizHistory, setQuizHistory] = useState<number[]>(user.quizHistory || []);
  const [insightsTab, setInsightsTab] = useState<'performance' | 'time'>('performance');

  const drawQuizHistoryPath = () => {
    if (quizHistory.length < 2) return null;
    const N = quizHistory.length;
    const points = quizHistory.map((val, i) => {
      const x = 35 + i * (345 / (N - 1));
      const y = 15 + (120 - (val / 100) * 120);
      return { x, y };
    });
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} 135 L ${points[0].x} 135 Z`;
    return { linePath, areaPath, points };
  };
  const pathData = drawQuizHistoryPath();

  const [quests, setQuests] = useState<StudyQuest[]>(() => {
    const todayStr = new Date().toDateString();
    if (!user.quests || user.quests.length === 0 || user.questsDate !== todayStr) {
      return getDeterministicDailyQuests(user.email, todayStr, questPool);
    }
    return user.quests || [];
  });

  const [prevUser, setPrevUser] = useState<User>(user);
  if (user !== prevUser) {
    setPrevUser(user);
    setLevel(user.level || 1);
    setXp(user.xp || 0);
    setQuizHistory(user.quizHistory || []);
    const todayStr = new Date().toDateString();
    if (!user.quests || user.quests.length === 0 || user.questsDate !== todayStr) {
      setQuests(getDeterministicDailyQuests(user.email, todayStr, questPool));
    } else {
      setQuests(user.quests || []);
    }
  }

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [questToast, setQuestToast] = useState<{ text: string; points: number } | null>(null);

  const syncProfile = (updatedFields: Partial<User>) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const payload: {
      level?: number;
      xp?: number;
      streak?: number;
      quizzes_count?: number;
      quiz_history?: number[];
      study_time?: { [key: string]: number | string };
      heatmap_data?: { label: string; hours: number; level: number }[];
      focus_areas?: { concept: string; subject: string; score: number; desc: string }[];
      spaced_recall?: { id: number; name: string; subject: string; dueIn: string; progress: number }[];
      quests?: StudyQuest[];
      quests_date?: string;
    } = {};
    if (updatedFields.level !== undefined) payload.level = updatedFields.level;
    if (updatedFields.xp !== undefined) payload.xp = updatedFields.xp;
    if (updatedFields.streak !== undefined) payload.streak = updatedFields.streak;
    if (updatedFields.quizzesCount !== undefined) payload.quizzes_count = updatedFields.quizzesCount;
    if (updatedFields.quizHistory !== undefined) payload.quiz_history = updatedFields.quizHistory;
    if (updatedFields.studyTime !== undefined) payload.study_time = updatedFields.studyTime;
    if (updatedFields.heatmapData !== undefined) payload.heatmap_data = updatedFields.heatmapData;
    if (updatedFields.focusAreas !== undefined) payload.focus_areas = updatedFields.focusAreas;
    if (updatedFields.spacedRecall !== undefined) payload.spaced_recall = updatedFields.spacedRecall;
    if (updatedFields.quests !== undefined) payload.quests = updatedFields.quests;
    if (updatedFields.questsDate !== undefined) payload.quests_date = updatedFields.questsDate;

    fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to update profile');
      return res.json();
    })
    .then(data => {
      setUser({
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
      });
    })
    .catch(err => console.error('Error syncing profile:', err));
  };

  const handleStreakCheckIn = () => {
    const todayStr = new Date().toDateString();
    if (user.lastCheckIn === todayStr) return;
    
    const newStreak = (user.streak !== undefined ? user.streak : 5) + 1;
    let newXp = xp + 10;
    let newLevel = level;
    const xpNeeded = newLevel * 100;
    if (newXp >= xpNeeded) {
      newLevel += 1;
      newXp = newXp - xpNeeded;
      setShowLevelUp(true);
      setLevel(newLevel);
    }
    setXp(newXp);
    
    syncProfile({
      streak: newStreak,
      level: newLevel,
      xp: newXp,
      lastCheckIn: todayStr
    });
    showQuestToast("Daily Check-in Complete!", 10);
  };

  const handleLogStudyHour = (dayIndex: number) => {
    const currentHeatmap = [...(user.heatmapData || defaultHeatmap)];
    
    if (dayIndex < 0 || dayIndex >= currentHeatmap.length) return;
    
    const dayObj = { ...currentHeatmap[dayIndex] };
    if (dayObj.hours >= 8) return;
    
    dayObj.hours += 1;
    if (dayObj.hours === 0) dayObj.level = 0;
    else if (dayObj.hours <= 2) dayObj.level = 1;
    else if (dayObj.hours <= 4) dayObj.level = 2;
    else if (dayObj.hours <= 6) dayObj.level = 3;
    else dayObj.level = 4;
    
    currentHeatmap[dayIndex] = dayObj;
    
    const currentStudyTime = { ...(user.studyTime || defaultStudyTime) };
    currentStudyTime["General Study"] = asStudyHours(currentStudyTime["General Study"]) + 1;
    
    syncProfile({
      heatmapData: currentHeatmap,
      studyTime: currentStudyTime
    });
  };

  useEffect(() => {
    const todayStr = new Date().toDateString();
    if (!user.quests || user.quests.length === 0 || user.questsDate !== todayStr) {
      syncProfile({ quests, questsDate: todayStr });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showQuestToast = (text: string, points: number) => {
    setQuestToast({ text, points });
    setTimeout(() => setQuestToast(null), 3000);
  };

  const gainXp = (points: number, updatedQuests: StudyQuest[]) => {
    let newXp = xp + points;
    let newLevel = level;
    const xpNeeded = newLevel * 100;
    
    if (newXp >= xpNeeded) {
      newLevel += 1;
      newXp = newXp - xpNeeded;
      setShowLevelUp(true);
      setLevel(newLevel);
    }
    setXp(newXp);
    
    syncProfile({
      level: newLevel,
      xp: newXp,
      quests: updatedQuests
    });
  };

  const checkAndCompleteQuest = (
    currentQuests: StudyQuest[],
    actionType: 'ask_ai' | 'view_settings' | 'complete_quiz' | 'study_group' | 'custom',
    customId?: string
  ): { updatedQuests: StudyQuest[]; pointsGained: number } | null => {
    const targetQuestIndex = currentQuests.findIndex(q =>
      (customId ? q.id === customId : q.actionType === actionType) && !q.completed
    );
    if (targetQuestIndex === -1) return null;
    const updated = [...currentQuests];
    updated[targetQuestIndex] = { ...updated[targetQuestIndex], completed: true };
    const quest = updated[targetQuestIndex];
    return { updatedQuests: updated, pointsGained: quest.points };
  };

  const completeQuest = (actionType: 'ask_ai' | 'view_settings' | 'complete_quiz' | 'study_group' | 'custom', customId?: string) => {
    const result = checkAndCompleteQuest(quests, actionType, customId);
    if (!result) return;
    
    const { updatedQuests, pointsGained } = result;
    setQuests(updatedQuests);
    
    const completedQuestText = updatedQuests.find((q, idx) => q.completed && !quests[idx]?.completed)?.text || "";
    showQuestToast(completedQuestText, pointsGained);
    gainXp(pointsGained, updatedQuests);
  };

  const handleToggleQuest = (id: string) => {
    const quest = quests.find(q => q.id === id);
    if (!quest || quest.completed) return;
    
    const updated = quests.map(q => q.id === id ? { ...q, completed: true } : q);
    setQuests(updated);
    showQuestToast(quest.text, quest.points);
    gainXp(quest.points, updated);
  };

  const handleRollNewQuests = () => {
    const shuffled = [...questPool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3).map(q => ({ ...q, completed: false }));
    const todayStr = new Date().toDateString();
    setQuests(selected);
    syncProfile({ quests: selected, questsDate: todayStr });
  };

  const calculateDaysRemaining = (targetDateStr: string) => {
    const examDateObj = new Date(targetDateStr);
    const today = new Date();
    examDateObj.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.ceil((examDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) > 0
      ? Math.ceil((examDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  };

  const [exams, setExams] = useState<ExamDeadline[]>(() => {
    const saved = localStorage.getItem('lumio_exams');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ExamDeadline[];
        return parsed.map(exam => ({ ...exam, daysRemaining: calculateDaysRemaining(exam.rawDate || exam.date) }));
      } catch (e) { console.error('Failed to parse saved exams', e); }
    }
    const today = new Date();
    const d1 = new Date(today); d1.setDate(today.getDate() + 4);
    const d2 = new Date(today); d2.setDate(today.getDate() + 8);
    const d3 = new Date(today); d3.setDate(today.getDate() + 17);
    return [
      { id: 1, title: 'Cell Biology Midterm', subject: 'Biology', date: d1.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), rawDate: d1.toISOString().split('T')[0], daysRemaining: 4, priority: 'high' as const },
      { id: 2, title: 'Macroeconomics Quiz 2', subject: 'Economics', date: d2.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), rawDate: d2.toISOString().split('T')[0], daysRemaining: 8, priority: 'medium' as const },
      { id: 3, title: 'Calculus I Final Exam', subject: 'Mathematics', date: d3.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), rawDate: d3.toISOString().split('T')[0], daysRemaining: 17, priority: 'low' as const }
    ];
  });
  const [isAddingExam, setIsAddingExam] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamSubject, setNewExamSubject] = useState('Biology');
  const [newExamDate, setNewExamDate] = useState('');
  const [newExamPriority, setNewExamPriority] = useState<'high' | 'medium' | 'low'>('medium');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE_URL}/api/exams`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch exams');
        return res.json();
      })
      .then(data => {
        const mapped: ExamDeadline[] = (data as ExamDeadlineResponse[]).map(e => ({
          id: e.id,
          title: e.title,
          subject: e.subject,
          date: e.date,
          rawDate: e.raw_date,
          daysRemaining: e.days_remaining,
          priority: e.priority as 'high' | 'medium' | 'low'
        }));
        setExams(mapped);
      })
      .catch(err => console.error('Error fetching exams:', err));
    }
  }, [user]);

  useEffect(() => { localStorage.setItem('lumio_exams', JSON.stringify(exams)); }, [exams]);

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle.trim() || !newExamDate.trim()) return;

    const token = localStorage.getItem('token');
    if (token) {
      const payload = {
        title: newExamTitle,
        subject: newExamSubject,
        date: new Date(newExamDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        raw_date: newExamDate,
        priority: newExamPriority
      };
      fetch(`${API_BASE_URL}/api/exams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to create exam');
        return res.json();
      })
      .then(newExam => {
        setExams([...exams, {
          id: newExam.id,
          title: newExam.title,
          subject: newExam.subject,
          date: newExam.date,
          rawDate: newExam.raw_date,
          daysRemaining: newExam.days_remaining,
          priority: newExam.priority as 'high' | 'medium' | 'low'
        }]);
        setNewExamTitle(''); setNewExamDate(''); setNewExamPriority('medium'); setIsAddingExam(false);
        completeQuest('custom', 'add_exam');
      })
      .catch(err => {
        console.error('Error saving exam:', err);
        alert('Failed to save exam to backend');
      });
    } else {
      setExams([...exams, {
        id: Date.now(), title: newExamTitle,
        subject: newExamSubject,
        date: new Date(newExamDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        rawDate: newExamDate, daysRemaining: calculateDaysRemaining(newExamDate), priority: newExamPriority
      }]);
      setNewExamTitle(''); setNewExamDate(''); setNewExamPriority('medium'); setIsAddingExam(false);
      completeQuest('custom', 'add_exam');
    }
  };

  const handleDeleteExam = (id: number) => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE_URL}/api/exams/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete exam');
        setExams(exams.filter(e => e.id !== id));
      })
      .catch(err => {
        console.error('Error deleting exam:', err);
        alert('Failed to delete exam from backend');
      });
    } else {
      setExams(exams.filter(e => e.id !== id));
    }
  };

  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<{ query: string; answer: string } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isGroupQuizMode, setIsGroupQuizMode] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: number]: number }>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [activeQuizSession, setActiveQuizSession] = useState<GroupQuizSession | null>(null);

  const [notifStudyGroup, setNotifStudyGroup] = useState(true);
  const [notifQuizReminders, setNotifQuizReminders] = useState(true);
  const [notifSounds, setNotifSounds] = useState(false);
  const [notifEmails, setNotifEmails] = useState(true);

  const getActivityColor = (level: number) => {
    switch (level) {
      case 0: return 'rgba(255, 255, 255, 0.04)';
      case 1: return 'rgba(16, 185, 129, 0.15)';
      case 2: return 'rgba(16, 185, 129, 0.35)';
      case 3: return 'rgba(16, 185, 129, 0.6)';
      case 4: return 'rgba(16, 185, 129, 0.9)';
      default: return 'rgba(255, 255, 255, 0.04)';
    }
  };

  const handleAiSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSearchQuery.trim()) return;
    setIsAiLoading(true);
    setAiResponse(null);
    completeQuest('ask_ai');
    setTimeout(() => {
      let answer = "I couldn't find a direct match for that term in your active study modules. Try searching for 'mitochondria', 'protein synthesis', 'demand', or 'market structure'!";
      const queryLower = aiSearchQuery.toLowerCase();
      if (queryLower.includes('mitochondria') || queryLower.includes('powerhouse')) {
        answer = "Mitochondria are double-membraned organelles found in most eukaryotic organisms. They generate most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy, earning them the nickname 'the powerhouse of the cell'.";
      } else if (queryLower.includes('protein') || queryLower.includes('ribosome')) {
        answer = "Protein synthesis is performed by ribosomes, which link amino acids together in the order specified by messenger RNA (mRNA) molecules. This occurs in the cellular cytoplasm or on the rough endoplasmic reticulum.";
      } else if (queryLower.includes('demand') || queryLower.includes('price')) {
        answer = "According to the Law of Demand, as the price of a normal good increases, the quantity demanded decreases, holding everything else constant (ceteris paribus). This creates a downward-sloping demand curve.";
      } else if (queryLower.includes('market') || queryLower.includes('monopoly')) {
        answer = "A monopoly market structure features a single supplier selling a unique product with no close substitutes and high barriers to entry. Other structures include perfect competition, oligopoly, and monopolistic competition.";
      }
      setAiResponse({ query: aiSearchQuery, answer });
      setIsAiLoading(false);
    }, 800);
  };

  const startQuiz = (module: Module) => {
    setActiveQuizModule(module);
    setIsGroupQuizMode(false);
    setSelectedGroupId(null);
    setSelectedAnswers({});
    setShowQuizResults(false);
    setQuizScore(0);
    setActiveQuizSession(null);
  };

  const startGroupQuiz = (module: Module, groupId: number) => {
    setActiveQuizModule(module);
    setIsGroupQuizMode(true);
    setSelectedGroupId(groupId);
    setSelectedAnswers({});
    setShowQuizResults(false);
    setQuizScore(0);
    setActiveQuizSession(null);
  };

  const handleSelectAnswer = (questionId: number, optionIndex: number) => {
    if (showQuizResults) return;
    setSelectedAnswers({ ...selectedAnswers, [questionId]: optionIndex });
  };

  const handleSubmitQuiz = () => {
    if (!activeQuizModule) return;
    let score = 0;
    activeQuizModule.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswerIndex) score += 1;
    });
    setQuizScore(score);
    setShowQuizResults(true);

    if (!isGroupQuizMode) {
      const storedScores = localStorage.getItem('lumio-module-scores');
      const scoresObj = storedScores ? JSON.parse(storedScores) : {};
      scoresObj[activeQuizModule.id] = `${score}/${activeQuizModule.questions.length}`;
      localStorage.setItem('lumio-module-scores', JSON.stringify(scoresObj));
      setModuleScores(scoresObj);
    }
    
    const percent = Math.round((score / activeQuizModule.questions.length) * 100);
    const newHistory = [...quizHistory, percent];
    setQuizHistory(newHistory);
    
    const newQuizzesCount = (user.quizzesCount || 0) + 1;
    
    const result = checkAndCompleteQuest(quests, 'complete_quiz');
    if (result) {
      const { updatedQuests, pointsGained } = result;
      setQuests(updatedQuests);
      
      const completedQuestText = updatedQuests.find((q, idx) => q.completed && !quests[idx]?.completed)?.text || "";
      showQuestToast(completedQuestText, pointsGained);
      
      let newXp = xp + pointsGained;
      let newLevel = level;
      const xpNeeded = newLevel * 100;
      if (newXp >= xpNeeded) {
        newLevel += 1;
        newXp = newXp - xpNeeded;
        setShowLevelUp(true);
        setLevel(newLevel);
      }
      setXp(newXp);
      
      syncProfile({
        level: newLevel,
        xp: newXp,
        quests: updatedQuests,
        quizHistory: newHistory,
        quizzesCount: newQuizzesCount
      });
    } else {
      syncProfile({
        quizHistory: newHistory,
        quizzesCount: newQuizzesCount
      });
    }

    if (isGroupQuizMode && selectedGroupId !== null) {
      const totalQuestions = activeQuizModule.questions.length;
      const targetGroup = groups.find(g => g.id === selectedGroupId);
      if (targetGroup) {
        const userPercent = Math.round((score / totalQuestions) * 100);
        const groupMembersRanks: GroupQuizRank[] = targetGroup.members.map(member => {
          const randScore = Math.floor(Math.random() * (totalQuestions + 1));
          return {
            name: member.name, score: `${randScore}/${totalQuestions}`,
            percentage: Math.round((randScore / totalQuestions) * 100),
            time: `0m ${Math.floor(Math.random() * 50) + 30}s`, isUser: false
          };
        });
        const userRank: GroupQuizRank = {
          name: `${user.name} (You)`, score: `${score}/${totalQuestions}`,
          percentage: userPercent, time: `0m ${Math.floor(Math.random() * 40) + 45}s`, isUser: true
        };
        const combinedRankings = [userRank, ...groupMembersRanks].sort((a, b) => b.percentage !== a.percentage ? b.percentage - a.percentage : a.time.localeCompare(b.time));
        const newSession: GroupQuizSession = {
          id: Date.now(), moduleName: activeQuizModule.name, date: 'Just now',
          avgScore: `${Math.round(combinedRankings.reduce((sum, r) => sum + r.percentage, 0) / combinedRankings.length)}%`,
          rankings: combinedRankings
        };
        setGroups(groups.map(g => g.id === selectedGroupId ? { ...g, quizSessions: [newSession, ...g.quizSessions] } : g));
        setActiveQuizSession(newSession);
      }
    }
  };

  const handleDeleteModule = (id: number) => {
    const targetModule = modules.find(m => m.id === id);
    if (targetModule) {
      setModuleToDelete(targetModule);
    }
  };

  const confirmDeleteModule = () => {
    if (!moduleToDelete) return;
    const id = moduleToDelete.id;

    // Clean up score
    const storedScores = localStorage.getItem('lumio-module-scores');
    if (storedScores) {
      const scoresObj = JSON.parse(storedScores);
      delete scoresObj[id];
      localStorage.setItem('lumio-module-scores', JSON.stringify(scoresObj));
      setModuleScores(scoresObj);
    }

    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE_URL}/api/modules/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete module');
        setModules(modules.filter(m => m.id !== id));
        if (activeQuizModule?.id === id) setActiveQuizModule(null);
        setModuleToDelete(null);
      })
      .catch(err => {
        console.error('Error deleting module:', err);
        alert('Failed to delete module from backend');
      });
    } else {
      setModules(modules.filter(m => m.id !== id));
      if (activeQuizModule?.id === id) setActiveQuizModule(null);
      setModuleToDelete(null);
    }
  };

  const refetchGroups = () => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_BASE_URL}/api/groups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        const mapped = (data as StudyGroupResponse[]).map(g => ({
          ...g,
          modules: g.modules ? g.modules.map(m => ({
            id: m.id,
            name: m.name,
            date: m.date,
            size: m.size,
            subject: m.subject || 'General',
            questionsCount: m.questionsCount !== undefined ? m.questionsCount : (m.questions ? m.questions.length : 0),
            questions: m.questions ? m.questions.map(q => ({
              id: q.id,
              question: q.question,
              options: q.options,
              correctAnswerIndex: q.correct_answer_index
            })) : []
          })) : [],
          quizSessions: g.quiz_sessions ? g.quiz_sessions.map(s => ({
            id: s.id,
            moduleName: s.module_name,
            date: s.date,
            avgScore: s.avg_score,
            rankings: s.rankings ? s.rankings.map(r => ({
              name: r.name,
              score: r.score,
              percentage: r.percentage,
              time: r.time,
              isUser: r.is_user
            })) : []
          })) : []
        }));
        setGroups(mapped);
      })
      .catch(err => console.error('Error refetching groups:', err));
    }
  };

  const handleExitQuiz = (mod: Module | null) => {
    setActiveQuizModule(mod);
    if (mod === null) {
      setIsGroupQuizMode(false);
      refetchGroups();
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
      if (file.size > 2 * 1024 * 1024) { alert('File size exceeds 2MB limit.'); return; }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setUser({ ...user, avatar: event.target.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const activeGroup = groups.find(g => g.id === selectedGroupId);
  const subjects = ['All', ...Array.from(new Set(modules.map(m => m.subject).filter(Boolean))) as string[]];
  const filteredModules = selectedSubject === 'All' ? modules : modules.filter(m => m.subject === selectedSubject);

  return (
    <div className={`grid max-lg:grid-cols-1 max-lg:grid-rows-[auto_1fr] h-[calc(100vh-58px)] overflow-hidden transition-[grid-template-columns] duration-280 ease-in-out ${isCollapsed ? 'lg:grid-cols-[68px_1fr]' : 'lg:grid-cols-[240px_1fr]'}`}>
      <div className="hidden lg:contents">
        <DashboardSidebar
          isCollapsed={isCollapsed}
          dashboardTab={dashboardTab}
          setDashboardTab={handleSetDashboardTab}
          selectedGroupId={selectedGroupId}
          setSelectedGroupId={setSelectedGroupId}
          setActiveQuizModule={handleExitQuiz}
          user={user}
          completeQuest={completeQuest}
          invitationCount={invitations.length}
        />
      </div>

      <div className="overflow-y-auto h-full w-full">
        {/* Render active inline tool filling the full scroll area (sidebar stays visible) */}
        {dashboardTab === 'tools' && activeTool && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTool}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {activeTool === 'flashcards' && <FlashcardsTool setView={inlineToolSetView} />}
              {activeTool === 'essay-grader' && <EssayGraderTool setView={inlineToolSetView} />}
              {activeTool === 'condenser' && <CondenserTool setView={inlineToolSetView} />}
              {activeTool === 'pomodoro' && <PomodoroTool setView={inlineToolSetView} />}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Normal dashboard main content (hidden when an inline tool is active) */}
        {!(dashboardTab === 'tools' && activeTool) && (
        <main className="flex flex-col gap-6 py-7 px-8 pb-20 max-w-275 w-full mx-auto max-lg:py-4 max-lg:px-4 max-lg:pb-16">
          {activeQuizModule ? (
            <QuizPanel
              activeQuizModule={activeQuizModule}
              isGroupQuizMode={isGroupQuizMode}
              activeGroup={activeGroup}
              selectedAnswers={selectedAnswers}
              showQuizResults={showQuizResults}
              quizScore={quizScore}
              activeQuizSession={activeQuizSession}
              setActiveQuizModule={handleExitQuiz}
              setIsGroupQuizMode={setIsGroupQuizMode}
              handleSelectAnswer={handleSelectAnswer}
              handleSubmitQuiz={handleSubmitQuiz}
              startQuiz={startQuiz}
              startGroupQuiz={startGroupQuiz}
              selectedGroupId={selectedGroupId}
            />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${dashboardTab}-${selectedGroupId ?? 'none'}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="flex flex-col gap-6 min-w-0"
              >
                {dashboardTab === 'overview' && selectedGroupId === null && (
                  <OverviewPanel
                    user={user}
                    level={level}
                    xp={xp}
                    groupsCount={groups.length}
                    quests={quests}
                    exams={exams}
                    quizHistory={quizHistory}
                    insightsTab={insightsTab}
                    isAddingExam={isAddingExam}
                    newExamTitle={newExamTitle}
                    newExamSubject={newExamSubject}
                    newExamDate={newExamDate}
                    newExamPriority={newExamPriority}
                    aiSearchQuery={aiSearchQuery}
                    aiResponse={aiResponse}
                    isAiLoading={isAiLoading}
                    spacedRepetitionList={user.spacedRecall || []}
                    heatmapData={user.heatmapData || defaultHeatmap}
                    subjects={subjects}
                    pathData={pathData}
                    setInsightsTab={setInsightsTab}
                    setIsAddingExam={setIsAddingExam}
                    setNewExamTitle={setNewExamTitle}
                    setNewExamSubject={setNewExamSubject}
                    setNewExamDate={setNewExamDate}
                    setNewExamPriority={setNewExamPriority}
                    setAiSearchQuery={setAiSearchQuery}
                    setDashboardTab={handleSetDashboardTab}
                    setSelectedSubject={setSelectedSubject}
                    handleAddExam={handleAddExam}
                    handleDeleteExam={handleDeleteExam}
                    handleToggleQuest={handleToggleQuest}
                    handleRollNewQuests={handleRollNewQuests}
                    handleAiSearch={handleAiSearch}
                    getActivityColor={getActivityColor}
                    handleStreakCheckIn={handleStreakCheckIn}
                    handleLogStudyHour={handleLogStudyHour}
                  />
                )}

                {dashboardTab === 'modules' && selectedGroupId === null && (
                  <ModulesPanel
                    modules={modules}
                    selectedSubject={selectedSubject}
                    subjects={subjects}
                    filteredModules={filteredModules}
                    setSelectedSubject={setSelectedSubject}
                    startQuiz={startQuiz}
                    handleDeleteModule={handleDeleteModule}
                    setIsUploadOpen={setIsUploadOpen}
                    moduleScores={moduleScores}
                    onFileDropped={onFileDropped}
                  />
                )}

                {dashboardTab === 'groups' && selectedGroupId === null && (
                  <GroupsPanel
                    groups={groups}
                    user={user}
                    selectedGroupId={null}
                    setSelectedGroupId={setSelectedGroupId}
                    startGroupQuiz={startGroupQuiz}
                    completeQuest={completeQuest}
                    setIsGroupModalOpen={setIsGroupModalOpen}
                    modules={modules}
                    setGroups={setGroups}
                    invitations={invitations}
                    onAcceptInvitation={onAcceptInvitation}
                    onDeclineInvitation={onDeclineInvitation}
                  />
                )}

                {selectedGroupId !== null && (
                  <GroupsPanel
                    groups={groups}
                    user={user}
                    selectedGroupId={selectedGroupId}
                    setSelectedGroupId={setSelectedGroupId}
                    startGroupQuiz={startGroupQuiz}
                    completeQuest={completeQuest}
                    setIsGroupModalOpen={setIsGroupModalOpen}
                    modules={modules}
                    setGroups={setGroups}
                    invitations={invitations}
                    onAcceptInvitation={onAcceptInvitation}
                    onDeclineInvitation={onDeclineInvitation}
                  />
                )}

                {dashboardTab === 'tools' && selectedGroupId === null && (
                  <ToolsPanel studyTools={studyTools} setActiveTool={setActiveTool} />
                )}

                {dashboardTab === 'calendar' && selectedGroupId === null && (
                  <CalendarPanel
                    exams={exams}
                    isAddingExam={isAddingExam}
                    newExamTitle={newExamTitle}
                    newExamSubject={newExamSubject}
                    newExamDate={newExamDate}
                    newExamPriority={newExamPriority}
                    subjects={subjects}
                    setIsAddingExam={setIsAddingExam}
                    setNewExamTitle={setNewExamTitle}
                    setNewExamSubject={setNewExamSubject}
                    setNewExamDate={setNewExamDate}
                    setNewExamPriority={setNewExamPriority}
                    handleAddExam={handleAddExam}
                    handleDeleteExam={handleDeleteExam}
                  />
                )}

                {dashboardTab === 'notifications' && selectedGroupId === null && (
                  <NotificationsPanel
                    notifications={notifications}
                    invitations={invitations}
                    onAcceptInvitation={onAcceptInvitation}
                    onDeclineInvitation={onDeclineInvitation}
                    onMarkAsRead={onMarkNotificationRead}
                    onMarkAllAsRead={onMarkAllNotificationsRead}
                    onRefresh={onRefreshNotifications}
                  />
                )}

                {dashboardTab === 'settings' && selectedGroupId === null && (
                  <SettingsPanel
                    user={user}
                    setUser={setUser}
                    setModules={setModules}
                    handleAvatarUpload={handleAvatarUpload}
                    completeQuest={completeQuest}
                    handleLogout={handleLogout}
                    notifStudyGroup={notifStudyGroup}
                    notifQuizReminders={notifQuizReminders}
                    notifSounds={notifSounds}
                    notifEmails={notifEmails}
                    setNotifStudyGroup={setNotifStudyGroup}
                    setNotifQuizReminders={setNotifQuizReminders}
                    setNotifSounds={setNotifSounds}
                    setNotifEmails={setNotifEmails}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}

          <AnimatePresence>
            {questToast && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className="fixed bottom-6 right-6 z-9999 w-[320px] bg-[rgba(18,18,18,0.85)] backdrop-blur-xl border border-primary-line-bold rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(62,207,142,0.15)] overflow-hidden"
              >
                <div className="quest-toast-glow"></div>
                <div className="flex items-center gap-3.5 p-4">
                  <div className="bg-primary-soft text-primary p-2 rounded-lg flex items-center justify-center shrink-0">
                    <Zap size={16} fill="var(--primary)" className="text-primary animate-pulse" />
                  </div>
                  <div>
                    <div className="text-[0.85rem] font-bold text-ink mb-0.5">Quest Completed!</div>
                    <div className="text-[0.75rem] text-ink-muted leading-tight">{questToast.text}</div>
                  </div>
                  <div className="ml-auto text-[0.75rem] font-extrabold text-primary bg-primary-soft py-1 px-2 rounded-md border border-primary-line">+{questToast.points} XP</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showLevelUp && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[rgba(5,5,5,0.85)] backdrop-blur-md z-10000 flex items-center justify-center p-6"
              >
                <motion.div
                  initial={{ scale: 0.8, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.8, y: 20 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="relative bg-[#181818] border border-glass-line rounded-3xl w-full max-w-105 py-10 px-8 text-center shadow-lg overflow-hidden"
                >
                  <div className="level-up-sparkle-glow"></div>
                  <div className="relative z-2 w-20 h-20 bg-[linear-gradient(135deg,rgba(62,207,142,0.1),rgba(6,182,212,0.1))] border-2 border-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow-primary-soft">
                    <Trophy size={48} className="text-primary animate-[trophy-bounce_1.5s_ease_infinite_alternate]" />
                  </div>
                  <h2 className="relative z-2 text-[1.8rem] font-extrabold text-white mb-2 tracking-[-0.5px]">Rank Level Up!</h2>
                  <p className="relative z-2 text-[0.85rem] text-ink-muted mb-4">You have advanced to rank status:</p>
                  <div className="relative z-2 inline-flex items-center gap-2 text-[1.15rem] font-extrabold text-ink-on-primary bg-[linear-gradient(90deg,var(--color-primary),#00e5ff)] py-2 px-5 rounded-full mb-6 shadow-glow-primary-btn">
                    <Zap size={20} fill="var(--primary)" className="text-primary" /> Level {level} Student
                  </div>
                  <p className="relative z-2 text-[0.85rem] text-ink-muted leading-relaxed mb-8">
                    Excellent study habits! Your daily quests have refreshed your cognitive focus. Keep learning!
                  </p>
                  <button onClick={() => setShowLevelUp(false)} className="btn btn-primary relative z-2 w-full py-3 text-[0.9rem] font-bold rounded-xl h-auto border-0 cursor-pointer transition-all duration-200 hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-glow-primary-btn-hover">
                    Keep Studying
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {moduleToDelete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[rgba(5,5,5,0.7)] backdrop-blur-sm z-10000 flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className="bg-card border border-line rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
                >
                  <div className="flex gap-4">
                    <div className="bg-danger/10 text-danger p-3 rounded-full h-12 w-12 flex items-center justify-center shrink-0 border border-danger-line">
                      <AlertTriangle size={24} />
                    </div>
                    <div className="flex flex-col gap-1 w-full text-left">
                      <h3 className="text-xl font-bold text-ink">Delete Study Module?</h3>
                      <p className="text-sm text-ink-muted leading-relaxed mt-2">
                        Are you sure you want to delete <span className="font-semibold text-ink">"{moduleToDelete.name}"</span>? This will permanently remove the study module and all of its generated quiz questions. This action cannot be undone.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end mt-6">
                    <button
                      type="button"
                      onClick={() => setModuleToDelete(null)}
                      className="inline-flex items-center justify-center py-2.5 px-5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer bg-transparent border border-line text-ink hover:bg-input hover:border-line-strong select-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmDeleteModule}
                      className="inline-flex items-center justify-center py-2.5 px-5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer bg-danger text-white border border-danger hover:bg-danger/90 hover:shadow-[0_4px_12px_rgba(239,68,68,0.2)] select-none"
                    >
                      Delete Module
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        )}
      </div>
    </div>
  );
};
