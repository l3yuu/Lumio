import React, { useState, useEffect } from 'react';
import {
  Layers, Play, FileText, Plus, Trash2, Trophy, Users, Clock, ChevronRight, Settings, Flame,
  Calendar, Search, MessageSquare, Sparkles, CheckCircle2, RotateCcw, Award, Zap, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User, Module, StudyGroup, GroupQuizSession, GroupQuizRank, DashboardTab } from '../../types';

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
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  setUser,
  modules,
  groups,
  setModules,
  setGroups,
  setIsUploadOpen,
  setIsGroupModalOpen,
  studyTools,
  dashboardTab,
  setDashboardTab,
  selectedGroupId,
  setSelectedGroupId,
  activeQuizModule,
  setActiveQuizModule,
  isSidebarCollapsed: isCollapsed,
}) => {


  const [level, setLevel] = useState<number>(() => {
    const saved = localStorage.getItem('lumio_user_level');
    return saved ? parseInt(saved, 10) : 1;
  });

  const [xp, setXp] = useState<number>(() => {
    const saved = localStorage.getItem('lumio_user_xp');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [quizHistory, setQuizHistory] = useState<number[]>(() => {
    const saved = localStorage.getItem('lumio_quiz_history');
    return saved ? JSON.parse(saved) : [65, 80, 70, 95, 75, 90];
  });

  const [insightsTab, setInsightsTab] = useState<'performance' | 'time'>('performance');

  useEffect(() => {
    localStorage.setItem('lumio_quiz_history', JSON.stringify(quizHistory));
  }, [quizHistory]);

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

  interface StudyQuest {
    id: string;
    text: string;
    points: number;
    completed: boolean;
    actionType: 'ask_ai' | 'view_settings' | 'complete_quiz' | 'study_group' | 'custom';
  }

  const questPool: Omit<StudyQuest, 'completed'>[] = [
    { id: 'ask_ai', text: 'Query the AI Concept Tutor once', points: 50, actionType: 'ask_ai' },
    { id: 'view_settings', text: 'Review your Account Profile settings', points: 30, actionType: 'view_settings' },
    { id: 'complete_quiz', text: 'Complete any Practice Quiz', points: 70, actionType: 'complete_quiz' },
    { id: 'study_group', text: 'Visit one of your study groups', points: 40, actionType: 'study_group' },
    { id: 'add_exam', text: 'Add a new exam countdown', points: 30, actionType: 'custom' },
    { id: 'custom_avatar', text: 'Choose or upload a new profile picture', points: 40, actionType: 'custom' },
    { id: 'change_school', text: 'Set your school in settings tab', points: 30, actionType: 'custom' }
  ];

  const [quests, setQuests] = useState<StudyQuest[]>(() => {
    const savedQuests = localStorage.getItem('lumio_quests');
    const savedDate = localStorage.getItem('lumio_quests_date');
    const todayStr = new Date().toDateString();

    if (savedQuests && savedDate === todayStr) {
      try {
        return JSON.parse(savedQuests) as StudyQuest[];
      } catch (e) {
        console.error('Failed to parse saved quests', e);
      }
    }

    const shuffled = [...questPool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3).map(q => ({ ...q, completed: false }));
    localStorage.setItem('lumio_quests_date', todayStr);
    localStorage.setItem('lumio_quests', JSON.stringify(selected));
    return selected;
  });

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [questToast, setQuestToast] = useState<{ text: string; points: number } | null>(null);

  useEffect(() => {
    localStorage.setItem('lumio_user_level', level.toString());
  }, [level]);

  useEffect(() => {
    localStorage.setItem('lumio_user_xp', xp.toString());
  }, [xp]);

  useEffect(() => {
    localStorage.setItem('lumio_quests', JSON.stringify(quests));
  }, [quests]);

  const showQuestToast = (text: string, points: number) => {
    setQuestToast({ text, points });
    setTimeout(() => setQuestToast(null), 3000);
  };

  const gainXp = (points: number) => {
    setXp(prevXp => {
      const newXp = prevXp + points;
      const xpNeeded = level * 100;
      if (newXp >= xpNeeded) {
        setLevel(l => l + 1);
        setShowLevelUp(true);
        return newXp - xpNeeded;
      }
      return newXp;
    });
  };

  const completeQuest = (actionType: 'ask_ai' | 'view_settings' | 'complete_quiz' | 'study_group' | 'custom', customId?: string) => {
    setQuests(prevQuests => {
      const targetQuestIndex = prevQuests.findIndex(q =>
        (customId ? q.id === customId : q.actionType === actionType) && !q.completed
      );
      if (targetQuestIndex === -1) return prevQuests;

      const updated = [...prevQuests];
      updated[targetQuestIndex] = { ...updated[targetQuestIndex], completed: true };
      const quest = updated[targetQuestIndex];

      gainXp(quest.points);
      showQuestToast(quest.text, quest.points);
      return updated;
    });
  };

  const handleToggleQuest = (id: string) => {
    setQuests(prevQuests => {
      const quest = prevQuests.find(q => q.id === id);
      if (!quest || quest.completed) return prevQuests;

      const updated = prevQuests.map(q => {
        if (q.id === id) {
          return { ...q, completed: true };
        }
        return q;
      });

      gainXp(quest.points);
      showQuestToast(quest.text, quest.points);
      return updated;
    });
  };

  const handleRollNewQuests = () => {
    const shuffled = [...questPool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3).map(q => ({ ...q, completed: false }));
    setQuests(selected);
    const todayStr = new Date().toDateString();
    localStorage.setItem('lumio_quests_date', todayStr);
  };

  const calculateDaysRemaining = (targetDateStr: string) => {
    const examDateObj = new Date(targetDateStr);
    const today = new Date();
    examDateObj.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = examDateObj.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  interface ExamDeadline {
    id: number;
    title: string;
    subject: string;
    date: string;
    rawDate?: string;
    daysRemaining: number;
    priority: 'high' | 'medium' | 'low';
  }

  const [exams, setExams] = useState<ExamDeadline[]>(() => {
    const saved = localStorage.getItem('lumio_exams');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ExamDeadline[];
        return parsed.map(exam => ({
          ...exam,
          daysRemaining: calculateDaysRemaining(exam.rawDate || exam.date)
        }));
      } catch (e) {
        console.error('Failed to parse saved exams', e);
      }
    }

    const today = new Date();

    const d1 = new Date(today);
    d1.setDate(today.getDate() + 4);
    const d2 = new Date(today);
    d2.setDate(today.getDate() + 8);
    const d3 = new Date(today);
    d3.setDate(today.getDate() + 17);

    return [
      {
        id: 1,
        title: 'Cell Biology Midterm',
        subject: 'Biology',
        date: d1.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        rawDate: d1.toISOString().split('T')[0],
        daysRemaining: 4,
        priority: 'high'
      },
      {
        id: 2,
        title: 'Macroeconomics Quiz 2',
        subject: 'Economics',
        date: d2.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        rawDate: d2.toISOString().split('T')[0],
        daysRemaining: 8,
        priority: 'medium'
      },
      {
        id: 3,
        title: 'Calculus I Final Exam',
        subject: 'Mathematics',
        date: d3.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        rawDate: d3.toISOString().split('T')[0],
        daysRemaining: 17,
        priority: 'low'
      }
    ];
  });
  const [isAddingExam, setIsAddingExam] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamSubject, setNewExamSubject] = useState('Biology');
  const [newExamDate, setNewExamDate] = useState('');
  const [newExamPriority, setNewExamPriority] = useState<'high' | 'medium' | 'low'>('medium');

  useEffect(() => {
    localStorage.setItem('lumio_exams', JSON.stringify(exams));
  }, [exams]);

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle.trim() || !newExamDate.trim()) return;

    const diffDays = calculateDaysRemaining(newExamDate);

    const newExam: ExamDeadline = {
      id: Date.now(),
      title: newExamTitle,
      subject: newExamSubject,
      date: new Date(newExamDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      rawDate: newExamDate,
      daysRemaining: diffDays,
      priority: newExamPriority
    };

    setExams([...exams, newExam]);
    setNewExamTitle('');
    setNewExamDate('');
    setNewExamPriority('medium');
    setIsAddingExam(false);
    completeQuest('custom', 'add_exam');
  };

  const handleDeleteExam = (id: number) => {
    setExams(exams.filter(e => e.id !== id));
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

  const spacedRepetitionList = [
    { id: 1, name: 'Cell Biology & Genetics - Chapter 3', subject: 'Biology', dueIn: '2 hours', progress: 85 },
    { id: 2, name: 'Introduction to Microeconomics', subject: 'Economics', dueIn: '1 day', progress: 60 },
    { id: 3, name: 'Calculus I - Integration Outlines', subject: 'Mathematics', dueIn: '3 days', progress: 45 }
  ];

  const heatmapData = [
    { label: 'Mon', hours: 3, level: 2 },
    { label: 'Tue', hours: 0, level: 0 },
    { label: 'Wed', hours: 5, level: 3 },
    { label: 'Thu', hours: 2, level: 1 },
    { label: 'Fri', hours: 1, level: 1 },
    { label: 'Sat', hours: 0, level: 0 },
    { label: 'Sun', hours: 4, level: 3 },
    { label: 'Mon', hours: 2, level: 1 },
    { label: 'Tue', hours: 6, level: 4 },
    { label: 'Wed', hours: 1, level: 1 },
    { label: 'Thu', hours: 3, level: 2 },
    { label: 'Fri', hours: 4, level: 3 },
    { label: 'Sat', hours: 0, level: 0 },
    { label: 'Sun', hours: 5, level: 4 }
  ];

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
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: optionIndex
    });
  };

  const handleSubmitQuiz = () => {
    if (!activeQuizModule) return;

    let score = 0;
    activeQuizModule.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswerIndex) {
        score += 1;
      }
    });

    setQuizScore(score);
    setShowQuizResults(true);
    completeQuest('complete_quiz');

    const percent = Math.round((score / activeQuizModule.questions.length) * 100);
    setQuizHistory(prev => [...prev, percent]);

    if (isGroupQuizMode && selectedGroupId !== null) {
      const totalQuestions = activeQuizModule.questions.length;
      const targetGroup = groups.find(g => g.id === selectedGroupId);

      if (targetGroup) {
        const userPercent = Math.round((score / totalQuestions) * 100);

        const groupMembersRanks: GroupQuizRank[] = targetGroup.members.map((member) => {
          const randScore = Math.floor(Math.random() * (totalQuestions + 1));
          const randPercent = Math.round((randScore / totalQuestions) * 100);
          const randSecs = Math.floor(Math.random() * 50) + 30;
          return {
            name: member.name,
            score: `${randScore}/${totalQuestions}`,
            percentage: randPercent,
            time: `0m ${randSecs}s`,
            isUser: false
          };
        });

        const userSecs = Math.floor(Math.random() * 40) + 45;
        const userRank: GroupQuizRank = {
          name: `${user.name} (You)`,
          score: `${score}/${totalQuestions}`,
          percentage: userPercent,
          time: `0m ${userSecs}s`,
          isUser: true
        };

        const combinedRankings = [userRank, ...groupMembersRanks].sort((a, b) => {
          if (b.percentage !== a.percentage) {
            return b.percentage - a.percentage;
          }
          return a.time.localeCompare(b.time);
        });

        const sumPercentage = combinedRankings.reduce((sum, r) => sum + r.percentage, 0);
        const groupAverage = `${Math.round(sumPercentage / combinedRankings.length)}%`;

        const newSession: GroupQuizSession = {
          id: Date.now(),
          moduleName: activeQuizModule.name,
          date: 'Just now',
          avgScore: groupAverage,
          rankings: combinedRankings
        };

        const updatedGroups = groups.map(g => {
          if (g.id === selectedGroupId) {
            return {
              ...g,
              quizSessions: [newSession, ...g.quizSessions]
            };
          }
          return g;
        });
        setGroups(updatedGroups);
        setActiveQuizSession(newSession);
      }
    }
  };

  const handleDeleteModule = (id: number) => {
    setModules(modules.filter(m => m.id !== id));
    if (activeQuizModule?.id === id) {
      setActiveQuizModule(null);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB limit.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUser({
            ...user,
            avatar: event.target.result as string
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const activeGroup = groups.find(g => g.id === selectedGroupId);

  const subjects = ['All', ...Array.from(new Set(modules.map(m => m.subject).filter(Boolean))) as string[]];

  const filteredModules = selectedSubject === 'All'
    ? modules
    : modules.filter(m => m.subject === selectedSubject);

  return (
    <div className={`grid md:grid-cols-[220px_1fr] max-md:grid-cols-1 max-md:grid-rows-[auto_1fr] h-[calc(100vh-58px)] overflow-hidden transition-[grid-template-columns] duration-300 ${isCollapsed ? 'md:grid-cols-[72px_1fr]' : ''}`}>
      <aside className={`flex md:flex-col max-md:flex-row md:gap-1 max-md:gap-2 h-full max-md:h-auto bg-card max-md:bg-app border-line md:border-r max-md:border-r-0 md:border-b-0 max-md:border-b md:py-6 max-md:py-3 md:px-3 max-md:px-4 overflow-hidden md:box-border max-md:overflow-x-auto transition-all duration-300 scrollbar-none ${isCollapsed ? 'md:py-6 md:px-2 md:items-stretch' : ''}`}>
        <div className={`px-2 pb-6 mb-6 border-b border-line max-h-25ity-100 overflow-hidden transition-all duration-300 max-md:hidden ${isCollapsed ? 'md:max-h-0 md:mb-0 md:p-0 md:opacity-0 md:border-b-0' : ''}`}>
          <span className="text-[0.8rem] text-ink-muted font-medium block mb-1">STUDENT ACCOUNT</span>
          <span className="text-[0.95rem] text-ink font-semibold block overflow-hidden text-ellipsis whitespace-nowrap">{user.email}</span>
        </div>

        <button
          className={`flex items-center gap-3 py-3 px-2 rounded-lg text-ink-muted no-underline font-semibold text-[0.95rem] bg-transparent border-0 w-full text-left cursor-pointer transition-all duration-150 hover:text-primary hover:bg-glass max-md:w-auto max-md:whitespace-nowrap max-md:py-2.5 max-md:px-4 max-md:shrink-0 max-md:justify-center max-md:text-[0.85rem] [&_svg]:shrink-0 ${dashboardTab === 'overview' && selectedGroupId === null ? 'text-primary bg-glass' : ''} ${isCollapsed ? 'md:py-3 md:px-0 md:justify-center md:gap-0' : ''}`}
          onClick={() => { setDashboardTab('overview'); setActiveQuizModule(null); setSelectedGroupId(null); }}
        >
          <Layers size={18} /> <span className={`transition-all duration-200 max-w-37.5 opacity-100 whitespace-nowrap inline-block overflow-hidden ${isCollapsed ? 'md:max-w-0 md:opacity-0' : ''}`}>Overview Panels</span>
        </button>

        <button
          className={`flex items-center gap-3 py-3 px-2 rounded-lg text-ink-muted no-underline font-semibold text-[0.95rem] bg-transparent border-0 w-full text-left cursor-pointer transition-all duration-150 hover:text-primary hover:bg-glass max-md:w-auto max-md:whitespace-nowrap max-md:py-2.5 max-md:px-4 max-md:shrink-0 max-md:justify-center max-md:text-[0.85rem] [&_svg]:shrink-0 ${dashboardTab === 'modules' && selectedGroupId === null ? 'text-primary bg-glass' : ''} ${isCollapsed ? 'md:py-3 md:px-0 md:justify-center md:gap-0' : ''}`}
          onClick={() => { setDashboardTab('modules'); setActiveQuizModule(null); setSelectedGroupId(null); }}
        >
          <FileText size={18} /> <span className={`transition-all duration-200 max-w-37.5 opacity-100 whitespace-nowrap inline-block overflow-hidden ${isCollapsed ? 'md:max-w-0 md:opacity-0' : ''}`}>My Study Modules</span>
        </button>

        <button
          className={`flex items-center gap-3 py-3 px-2 rounded-lg text-ink-muted no-underline font-semibold text-[0.95rem] bg-transparent border-0 w-full text-left cursor-pointer transition-all duration-150 hover:text-primary hover:bg-glass max-md:w-auto max-md:whitespace-nowrap max-md:py-2.5 max-md:px-4 max-md:shrink-0 max-md:justify-center max-md:text-[0.85rem] [&_svg]:shrink-0 ${dashboardTab === 'groups' || selectedGroupId !== null ? 'text-primary bg-glass' : ''} ${isCollapsed ? 'md:py-3 md:px-0 md:justify-center md:gap-0' : ''}`}
          onClick={() => { setDashboardTab('groups'); setActiveQuizModule(null); setSelectedGroupId(null); }}
        >
          <Users size={18} /> <span className={`transition-all duration-200 max-w-37.5 opacity-100 whitespace-nowrap inline-block overflow-hidden ${isCollapsed ? 'md:max-w-0 md:opacity-0' : ''}`}>Collaborative Circles</span>
        </button>

        <button
          className={`flex items-center gap-3 py-3 px-2 rounded-lg text-ink-muted no-underline font-semibold text-[0.95rem] bg-transparent border-0 w-full text-left cursor-pointer transition-all duration-150 hover:text-primary hover:bg-glass max-md:w-auto max-md:whitespace-nowrap max-md:py-2.5 max-md:px-4 max-md:shrink-0 max-md:justify-center max-md:text-[0.85rem] [&_svg]:shrink-0 ${dashboardTab === 'tools' && selectedGroupId === null ? 'text-primary bg-glass' : ''} ${isCollapsed ? 'md:py-3 md:px-0 md:justify-center md:gap-0' : ''}`}
          onClick={() => { setDashboardTab('tools'); setActiveQuizModule(null); setSelectedGroupId(null); }}
        >
          <Plus size={18} /> <span className={`transition-all duration-200 max-w-37.5 opacity-100 whitespace-nowrap inline-block overflow-hidden ${isCollapsed ? 'md:max-w-0 md:opacity-0' : ''}`}>study Tools</span>
        </button>

        <button
          className={`flex items-center gap-3 py-3 px-2 rounded-lg text-ink-muted no-underline font-semibold text-[0.95rem] bg-transparent border-0 w-full text-left cursor-pointer transition-all duration-150 hover:text-primary hover:bg-glass max-md:w-auto max-md:whitespace-nowrap max-md:py-2.5 max-md:px-4 max-md:shrink-0 max-md:justify-center max-md:text-[0.85rem] [&_svg]:shrink-0 mt-auto max-md:mt-0 ${dashboardTab === 'settings' && selectedGroupId === null ? 'text-primary bg-glass' : ''} ${isCollapsed ? 'md:py-3 md:px-0 md:justify-center md:gap-0 md:mt-0' : ''}`}
          onClick={() => { setDashboardTab('settings'); setActiveQuizModule(null); setSelectedGroupId(null); completeQuest('view_settings'); }}
        >
          <Settings size={18} /> <span className={`transition-all duration-200 max-w-37.5 opacity-100 whitespace-nowrap inline-block overflow-hidden ${isCollapsed ? 'md:max-w-0 md:opacity-0' : ''}`}>Settings</span>
        </button>
      </aside>

      <div className="overflow-y-auto h-full w-full scrollbar-thin">
        <main className="flex flex-col gap-10 py-8 px-12 pb-24 max-w-275 w-full mx-auto max-md:py-4 max-md:px-6 max-md:pb-16">
        {activeQuizModule ? (
          <div className="bg-card border border-line rounded-2xl p-10 shadow-lg">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-line">
              <div>
                <h3 className="text-2xl mb-1">
                  {isGroupQuizMode ? 'Group Quiz Session' : 'Individual Practice Quiz'}
                </h3>
                <span className="text-ink-muted text-[0.9rem]">
                  Module: {activeQuizModule.name} {isGroupQuizMode && activeGroup && ` | Group: ${activeGroup.name}`}
                </span>
              </div>
              <button
                onClick={() => {
                  setActiveQuizModule(null);
                  setIsGroupQuizMode(false);
                }}
                className="btn btn-outline px-4 py-2 text-[0.85rem]"
              >
                Exit Quiz
              </button>
            </div>

            {!showQuizResults ? (
              <>
                {activeQuizModule.questions.map((q, qIndex) => (
                  <div className="mb-10" key={q.id}>
                    <div className="text-xl leading-snug mb-5 font-bold">
                      {qIndex + 1}. {q.question}
                    </div>
                    <div className="flex flex-col gap-3">
                      {q.options.map((option, optIdx) => (
                        <button
                          key={optIdx}
                          className={`flex items-center py-4 px-5 rounded-lg border border-line bg-app text-ink cursor-pointer font-medium transition-all duration-150 text-left hover:border-primary hover:bg-glass ${selectedAnswers[q.id] === optIdx ? 'border-primary bg-[rgba(62,207,142,0.05)]' : ''}`}
                          onClick={() => handleSelectAnswer(q.id, optIdx)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleSubmitQuiz}
                  className="btn btn-primary w-full justify-center p-4 mt-4"
                >
                  Submit &amp; Grade {isGroupQuizMode ? 'Group Results' : 'Quiz'} &rarr;
                </button>
              </>
            ) : (
              <div className="quiz-results-card">
                {isGroupQuizMode && activeQuizSession ? (
                  <div className="text-center mt-6">
                    <div className="flex items-center gap-2 justify-center mb-2 text-primary">
                      <Trophy size={32} />
                      <h4 className="text-[1.75rem] m-0">Group Quiz Scorecard</h4>
                    </div>
                    <p className="text-ink-muted mb-6">
                      Session on: {activeQuizSession.moduleName} | {activeQuizSession.date}
                    </p>

                    <div className="grid grid-cols-2 gap-6 my-6 p-6 bg-app border border-line rounded-xl">
                      <div>
                        <div className="text-[1.75rem] font-bold text-accent-cyan">
                          {activeQuizSession.avgScore}
                        </div>
                        <span className="text-[0.8rem] text-ink-muted">Group Average Accuracy</span>
                      </div>
                      <div>
                        <div className="text-[1.75rem] font-bold text-primary">
                          {quizScore} / {activeQuizModule.questions.length}
                        </div>
                        <span className="text-[0.8rem] text-ink-muted">Your Score</span>
                      </div>
                    </div>

                    <table className="w-full border-collapse mt-4">
                      <thead>
                        <tr>
                          <th className="text-left py-2 px-3 text-[0.8rem] font-semibold text-ink-muted border-b border-line">Rank</th>
                          <th className="text-left py-2 px-3 text-[0.8rem] font-semibold text-ink-muted border-b border-line">Name</th>
                          <th className="text-left py-2 px-3 text-[0.8rem] font-semibold text-ink-muted border-b border-line">Score</th>
                          <th className="text-left py-2 px-3 text-[0.8rem] font-semibold text-ink-muted border-b border-line">Accuracy</th>
                          <th className="text-left py-2 px-3 text-[0.8rem] font-semibold text-ink-muted border-b border-line">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeQuizSession.rankings.map((rank, rankIdx) => {
                          const isCurrentUser = rank.isUser;
                          return (
                            <tr key={rankIdx} className={`hover:bg-glass transition-colors duration-150 ${isCurrentUser ? 'bg-primary-tint-1' : ''}`}>
                              <td className="py-3 px-3 text-sm border-b border-line">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mx-auto text-sm ${rankIdx + 1 === 1 ? 'bg-primary text-ink-on-primary' : rankIdx + 1 === 2 ? 'bg-rank-2 text-white' : rankIdx + 1 === 3 ? 'bg-rank-3 text-white' : 'bg-ink-soft text-ink-muted'}`}>
                                  {rankIdx + 1}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-sm border-b border-line" style={{ fontWeight: isCurrentUser ? 700 : 500 }}>
                                {rank.name}
                              </td>
                              <td className="py-3 px-3 text-sm border-b border-line">{rank.score}</td>
                              <td className="py-3 px-3 text-sm border-b border-line" style={{ color: rank.percentage >= 70 ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 'bold' }}>
                                {rank.percentage}%
                              </td>
                              <td className="py-3 px-3 text-sm border-b border-line">
                                <span className="inline-flex items-center gap-1 text-[0.85rem] text-ink-muted">
                                  <Clock size={12} /> {rank.time}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <>
                    <div className="text-[3.5rem] font-extrabold text-primary mb-3">
                      {quizScore} / {activeQuizModule.questions.length}
                    </div>
                    <h4 className="text-2xl mb-4">
                      {quizScore === activeQuizModule.questions.length ? 'Perfect Score! 🎉' : 'Keep Studying! 📚'}
                    </h4>
                    <p className="text-ink-muted mb-10">
                      You scored {(quizScore / activeQuizModule.questions.length * 100).toFixed(0)}% accuracy on this test.
                    </p>
                  </>
                )}

                <div className="text-left mb-12">
                  <h5 className="text-[1.2rem] mb-6 border-b border-line pb-2">Question Review</h5>
                  {activeQuizModule.questions.map((q, qIndex) => {
                    const selected = selectedAnswers[q.id];
                    const correct = q.correctAnswerIndex;
                    return (
                      <div className="mb-10" key={q.id}>
                        <div className="text-xl leading-snug mb-5 font-bold text-[1.15rem]">
                          {qIndex + 1}. {q.question}
                        </div>
                        <div className="flex flex-col gap-3">
                          {q.options.map((option, optIdx) => {
                            let statusClass = '';
                            if (optIdx === correct) statusClass = '!border-primary !bg-[rgba(62,207,142,0.1)] !text-primary';
                            else if (optIdx === selected && selected !== correct) statusClass = '!border-danger !bg-[rgba(239,68,68,0.1)] !text-danger';

                            return (
                              <div key={optIdx} className={`flex items-center py-4 px-5 rounded-lg border border-line bg-app text-ink cursor-pointer font-medium transition-all duration-150 text-left hover:border-primary hover:bg-glass ${statusClass}`} style={{ cursor: 'default' }}>
                                {option}
                                {optIdx === correct && ' (Correct Answer)'}
                                {optIdx === selected && selected !== correct && ' (Your Choice)'}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => {
                      if (isGroupQuizMode) {
                        startGroupQuiz(activeQuizModule, selectedGroupId!);
                      } else {
                        startQuiz(activeQuizModule);
                      }
                    }}
                    className="btn btn-primary"
                  >
                    Retake Quiz
                  </button>
                  <button
                    onClick={() => {
                      setActiveQuizModule(null);
                      setIsGroupQuizMode(false);
                    }}
                    className="btn btn-outline"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {dashboardTab === 'overview' && selectedGroupId === null && (
              <>
                <div className="bg-[linear-gradient(135deg,rgba(62,207,142,0.04)_0%,rgba(6,182,212,0.04)_100%)] border border-line rounded-xl p-10 mb-8">
                  <h2 className="text-[2rem] mb-2">Welcome back, {user.name}!</h2>
                  <p className="text-ink-muted text-base leading-relaxed">
                    Track your daily progress, query topics instantly with the AI tutor, and practice scheduled card recall modules.
                  </p>
                </div>

                <div className="grid grid-cols-[1.2fr_1fr] gap-8 mb-8 max-md:grid-cols-1">
                  <div className="flex flex-col gap-8">
                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      <div className="bg-card border border-line rounded-xl flex items-center gap-3 p-4">
                        <div className="bg-primary-soft text-primary p-2 rounded-lg">
                          <Flame size={20} />
                        </div>
                        <div>
                          <div className="text-xl font-bold">5 Days</div>
                          <div className="text-[0.75rem] text-ink-muted">Streak</div>
                        </div>
                      </div>
                      <div className="bg-card border border-line rounded-xl flex items-center gap-3 p-4">
                        <div className="bg-cyan-soft-2 text-accent-cyan p-2 rounded-lg">
                          <Users size={20} />
                        </div>
                        <div>
                          <div className="text-xl font-bold">{groups.length} Circles</div>
                          <div className="text-[0.75rem] text-ink-muted">Groups</div>
                        </div>
                      </div>
                      <div className="bg-card border border-line rounded-xl flex items-center gap-3 p-4">
                        <div className="bg-success/10 text-primary p-2 rounded-lg">
                          <Trophy size={20} />
                        </div>
                        <div>
                          <div className="text-xl font-bold">12 Results</div>
                          <div className="text-[0.75rem] text-ink-muted">Quizzes</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card border border-line rounded-xl p-6">
                      <h3 className="text-[1.1rem] mb-5 flex items-center gap-2 m-0">
                        <Calendar size={18} className="text-primary" /> Activity Progress Intensity
                      </h3>
                      <p className="text-[0.8rem] text-ink-muted mb-5">
                        Visualizing mock study hours and generated syllabus reviews over the last two weeks.
                      </p>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {heatmapData.map((data, index) => (
                          <div
                            key={index}
                            className="flex flex-col items-center flex-1 min-w-8"
                          >
                            <div
                              style={{
                                width: '100%',
                                height: '36px',
                                borderRadius: '6px',
                                background: getActivityColor(data.level),
                                border: '1px solid var(--border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                color: data.level > 2 ? '#121212' : 'var(--text-primary)',
                                fontWeight: 'bold',
                                transition: 'all 0.2s ease'
                              }}
                              title={`${data.hours} study hours on ${data.label}`}
                            >
                              {data.hours > 0 && `${data.hours}h`}
                            </div>
                            <span className="text-[0.7rem] text-ink-muted mt-1">{data.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-card border border-line rounded-xl p-6 mt-8">
                      <div className="flex justify-between items-center mb-5">
                        <h3 className="text-[1.1rem] mb-5 flex items-center gap-2 m-0">
                          <Calendar size={18} className="text-primary" /> Upcoming Exam Countdowns
                        </h3>
                        <button
                          onClick={() => setIsAddingExam(!isAddingExam)}
                          className="btn btn-outline px-2 py-1 text-[0.75rem] h-7 flex items-center gap-0.5"
                        >
                          <Plus size={12} /> Add Exam
                        </button>
                      </div>

                      <AnimatePresence>
                        {isAddingExam && (
                          <motion.form
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            onSubmit={handleAddExam}
                            className="bg-app border border-line rounded-lg p-4 mb-5 flex flex-col gap-3 overflow-hidden"
                          >
                            <div className="text-[0.9rem] font-bold border-b border-line pb-1">
                              Add New Exam Countdown
                            </div>

                            <div className="flex gap-3">
                              <div className="flex-1">
                                <label className="text-[0.75rem] font-semibold text-ink mb-1">Exam Name</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Biology Final"
                                  className="w-full bg-input border border-line rounded-md text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app m-0 text-[0.8rem] py-1.5 px-2 h-8"
                                  value={newExamTitle}
                                  onChange={(e) => setNewExamTitle(e.target.value)}
                                  required
                                />
                              </div>
                              <div className="w-30">
                                <label className="text-[0.75rem] font-semibold text-ink mb-1">Subject Folder</label>
                                <select
                                  className="w-full bg-input border border-line rounded-md text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app m-0 text-[0.8rem] py-1.5 px-2 h-8"
                                  value={newExamSubject}
                                  onChange={(e) => setNewExamSubject(e.target.value)}
                                >
                                  {subjects.map(subj => (
                                    <option key={subj} value={subj === 'All' ? 'General' : subj}>{subj === 'All' ? 'General' : subj}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="flex gap-3 items-end">
                              <div className="flex-1">
                                <label className="text-[0.75rem] font-semibold text-ink mb-1">Exam Date</label>
                                <input
                                  type="date"
                                  className="w-full bg-input border border-line rounded-md text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app m-0 text-[0.8rem] py-1.5 px-2 h-8"
                                  value={newExamDate}
                                  onChange={(e) => setNewExamDate(e.target.value)}
                                  required
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-[0.75rem] font-semibold text-ink mb-1">Priority</label>
                                <select
                                  className="w-full bg-input border border-line rounded-md text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app m-0 text-[0.8rem] py-1.5 px-2 h-8"
                                  value={newExamPriority}
                                  onChange={(e) => setNewExamPriority(e.target.value as 'high' | 'medium' | 'low')}
                                >
                                  <option value="high">🔥 High</option>
                                  <option value="medium">⚡ Medium</option>
                                  <option value="low">❄️ Low</option>
                                </select>
                              </div>
                            </div>

                            <div className="flex gap-2 justify-end mt-1">
                              <button
                                type="button"
                                className="btn btn-outline px-3 py-1 text-[0.75rem] h-7"
                                onClick={() => setIsAddingExam(false)}
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="btn btn-primary px-3 py-1 text-[0.75rem] h-7"
                              >
                                Save
                              </button>
                            </div>
                          </motion.form>
                        )}
                      </AnimatePresence>

                      <div className="flex flex-col gap-5 relative pl-2">
                        {exams.length > 0 && <div className="absolute left-2.75 top-2 bottom-2 w-0.5 bg-line z-1"></div>}
                        {exams.length === 0 ? (
                          <div className="text-center p-4 text-ink-muted text-[0.85rem]">
                            No upcoming exams. Click "Add Exam" to schedule one!
                          </div>
                        ) : (
                          exams.map((exam) => (
                            <div className="flex items-start gap-4 relative z-2" key={exam.id}>
                              <div className={`w-3.5 h-3.5 rounded-full bg-line border-[3px] border-card mt-1.25 shrink-0 z-3 transition-all duration-200 ${exam.priority === 'high' ? 'bg-danger' : exam.priority === 'medium' ? 'bg-warning' : 'bg-accent-cyan'}`}></div>
                              <div className="flex grow items-center justify-between bg-app border border-line rounded-lg p-3 px-4 transition-all duration-200 hover:translate-x-1 hover:border-primary">
                                <div className="flex flex-col gap-1">
                                  <span className="text-[0.9rem] font-bold text-ink">{exam.title}</span>
                                  <div className="text-[0.75rem] text-ink-muted flex items-center gap-2">
                                    <span>📅 {exam.date}</span>
                                    <span className="opacity-50">•</span>
                                    <span
                                      onClick={() => {
                                        setDashboardTab('modules');
                                        setSelectedSubject(exam.subject === 'General' ? 'All' : exam.subject);
                                      }}
                                      className="timeline-subject-tag text-primary font-semibold cursor-pointer inline-flex items-center gap-0.5 p-0.5 px-1.5 rounded bg-primary-tint-5 transition-all duration-200 hover:bg-primary-soft-2 hover:text-primary-hover"
                                      title={`Click to review ${exam.subject} modules`}
                                    >
                                      🏷️ {exam.subject}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[0.75rem] font-bold rounded px-2 py-0.5 whitespace-nowrap ${exam.priority === 'high' ? 'bg-danger-soft text-danger border border-danger-line' : exam.priority === 'medium' ? 'bg-warning-soft text-warning border border-warning-line' : 'bg-cyan-soft-2 text-accent-cyan border border-cyan-line'}`}>
                                    {exam.daysRemaining === 0 ? 'Today! 🚨' : `${exam.daysRemaining} days left`}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteExam(exam.id)}
                                    className="bg-transparent border-0 text-ink-muted cursor-pointer p-0.5 flex items-center opacity-60 hover:opacity-100 transition-opacity duration-200"
                                    title="Delete countdown"
                                    type="button"
                                  >
                                    <Trash2 size={14} className="text-danger" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="bg-card border border-line rounded-xl p-6 mt-8">
                      <div className="flex justify-between items-center mb-5">
                        <h3 className="text-[1.1rem] mb-5 flex items-center gap-2 m-0">
                          <Layers size={18} className="text-primary" /> Insights &amp; Analytics
                        </h3>

                        <div className="flex bg-ink-tint-1 border border-line rounded-md p-0.5">
                          <button
                            className={`bg-transparent border-0 text-[0.7rem] font-semibold text-ink-muted py-1 px-2 rounded cursor-pointer transition-all duration-200 hover:text-ink ${insightsTab === 'performance' ? 'bg-glass-strong text-primary shadow-pop' : ''}`}
                            onClick={() => setInsightsTab('performance')}
                            type="button"
                          >
                            Quiz Accuracy
                          </button>
                          <button
                            className={`bg-transparent border-0 text-[0.7rem] font-semibold text-ink-muted py-1 px-2 rounded cursor-pointer transition-all duration-200 hover:text-ink ${insightsTab === 'time' ? 'bg-glass-strong text-primary shadow-pop' : ''}`}
                            onClick={() => setInsightsTab('time')}
                            type="button"
                          >
                            Study Time
                          </button>
                        </div>
                      </div>

                      {insightsTab === 'performance' ? (
                        <div>
                          <p className="text-[0.8rem] text-ink-muted mb-4">
                            Live quiz score percentages tracked over your active study sessions.
                          </p>

                          <div className="h-40 bg-[rgba(5,5,5,0.2)] border border-line rounded-lg p-4 pb-2 relative flex items-center justify-center">
                            <svg viewBox="0 0 400 160" width="100%" height="100%" style={{ overflow: 'visible' }}>
                              <defs>
                                <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                                </linearGradient>
                                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="var(--primary)" />
                                  <stop offset="100%" stopColor="#06b6d4" />
                                </linearGradient>
                              </defs>

                              <line x1="35" y1="15" x2="380" y2="15" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
                              <line x1="35" y1="75" x2="380" y2="75" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
                              <line x1="35" y1="135" x2="380" y2="135" stroke="var(--border)" strokeWidth="1" />

                              <text x="25" y="19" fill="var(--text-secondary)" fontSize="10" textAnchor="end">100%</text>
                              <text x="25" y="79" fill="var(--text-secondary)" fontSize="10" textAnchor="end">50%</text>
                              <text x="25" y="139" fill="var(--text-secondary)" fontSize="10" textAnchor="end">0%</text>

                              {quizHistory.length >= 2 ? (
                                <>
                                  {pathData && pathData.areaPath && (
                                    <path d={pathData.areaPath} fill="url(#chartGlow)" />
                                  )}

                                  {pathData && pathData.linePath && (
                                    <path
                                      d={pathData.linePath}
                                      fill="none"
                                      stroke="url(#lineGrad)"
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  )}

                                  {pathData && pathData.points && pathData.points.map((p, i) => (
                                    <g key={i} className="chart-point-group">
                                      <line x1={p.x} y1="15" x2={p.x} y2="135" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" className="hover-guide" />
                                      <circle cx={p.x} cy={p.y} r="6" fill="var(--primary)" opacity="0.3" className="chart-point-glow" />
                                      <circle cx={p.x} cy={p.y} r="4" fill="#181818" stroke="var(--primary)" strokeWidth="2.5" />

                                      <g className="chart-tooltip">
                                        <rect x={p.x - 25} y={p.y - 28} width="50" height="20" rx="4" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="1" />
                                        <text x={p.x} y={p.y - 15} fill="var(--text-primary)" fontSize="10" fontWeight="bold" textAnchor="middle">{quizHistory[i]}%</text>
                                      </g>

                                      <text x={p.x} y="152" fill="var(--text-secondary)" fontSize="9" textAnchor="middle">Q{i+1}</text>
                                    </g>
                                  ))}
                                </>
                              ) : (
                                <text x="200" y="80" fill="var(--text-secondary)" fontSize="12" textAnchor="middle">Complete quizzes to generate performance graphs.</text>
                              )}
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[0.8rem] text-ink-muted mb-5">
                            Breakdown of study hours spent per subject category.
                          </p>

                          <div className="flex flex-col gap-3.5">
                            {[
                              { subject: 'Biology', hours: 14, color: 'linear-gradient(90deg, #3ECF8E, #30B378)' },
                              { subject: 'Economics', hours: 9, color: 'linear-gradient(90deg, #f59e0b, #d97706)' },
                              { subject: 'Mathematics', hours: 6, color: 'linear-gradient(90deg, #06b6d4, #0891b2)' },
                              { subject: 'General Study', hours: 4, color: 'linear-gradient(90deg, #a855f7, #9333ea)' },
                            ].map((item, idx) => (
                              <div key={idx} className="flex flex-col">
                                <div className="flex justify-between text-[0.75rem] mb-1.5">
                                  <span className="font-semibold text-ink">{item.subject}</span>
                                  <span className="text-ink-muted text-[0.7rem]">{item.hours} hours ({Math.round((item.hours / 33) * 100)}%)</span>
                                </div>
                                <div className="h-1.5 bg-ink-tint-1 rounded-sm overflow-hidden border border-ink-soft">
                                  <div
                                    className="h-full rounded-sm transition-all duration-500"
                                    style={{
                                      width: `${(item.hours / 14) * 100}%`,
                                      background: item.color
                                    }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-6 border-t border-line pt-5">
                        <div className="text-[0.8rem] font-bold text-ink mb-3 flex items-center gap-1">
                          <Target size={14} className="text-warning" /> Recommended Focus Areas
                        </div>

                        <div className="flex flex-col gap-3">
                          {[
                            { concept: 'Mitochondria function', subject: 'Biology', score: 60, desc: 'Scores are low in Quiz 1. Review flashcards.' },
                            { concept: 'Law of Demand curves', subject: 'Economics', score: 70, desc: 'Practice study modules to lift core concepts.' }
                          ].map((rec, i) => (
                            <div key={i} className="flex items-center justify-between gap-4 p-2.5 px-3 bg-amber-bg border border-amber-border rounded-lg transition-all duration-200 hover:bg-amber-border hover:border-amber-border-strong hover:-translate-y-px">
                              <div className="grow">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-[0.8rem] font-bold text-ink">{rec.concept}</span>
                                  <span className="text-[0.65rem] font-semibold bg-warning-soft text-warning py-0.5 px-1.5 rounded border border-warning-line">{rec.score}% accuracy</span>
                                </div>
                                <p className="text-[0.75rem] text-ink-muted m-0">{rec.desc}</p>
                              </div>
                              <button
                                onClick={() => {
                                  setDashboardTab('modules');
                                  setSelectedSubject(rec.subject);
                                }}
                                className="btn btn-outline px-2 py-1 text-[0.7rem] h-6 shrink-0"
                                type="button"
                              >
                                Review
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-8">
                    <div className="bg-card border border-line rounded-xl p-6 relative overflow-hidden">
                      <div className="flex justify-between items-center mb-5">
                        <h3 className="text-[1.1rem] mb-5 flex items-center gap-2 m-0">
                          <Award size={18} className="text-primary" /> Daily Study Quests
                        </h3>
                        <span className="inline-flex items-center gap-1 text-[0.75rem] font-bold text-primary bg-primary-soft py-1 px-2 rounded-full border border-primary-line">
                          <Zap size={12} fill="var(--primary)" className="text-primary" /> Level {level}
                        </span>
                      </div>

                      <div className="mb-6">
                        <div className="flex justify-between items-center text-[0.75rem] mb-2">
                          <span className="text-ink-muted font-medium">Rank Progression</span>
                          <span className="text-primary font-bold">
                            {xp} / {level * 100} XP ({Math.round((xp / (level * 100)) * 100)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-ink-soft rounded overflow-hidden border border-line relative">
                          <div
                            className="h-full bg-[linear-gradient(90deg,var(--color-primary),#06b6d4)] rounded transition-all duration-400"
                            style={{ width: `${Math.min(100, Math.round((xp / (level * 100)) * 100))}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        {quests.map((quest) => (
                          <div
                            key={quest.id}
                            className={`flex items-center gap-3 py-2.5 px-3 bg-app border border-line rounded-lg cursor-pointer transition-all duration-200 hover:border-primary-line-bold hover:bg-primary-tint-1 ${quest.completed ? 'opacity-65 bg-ink-soft border-line cursor-default' : ''}`}
                            onClick={() => {
                              if (!quest.completed) {
                                handleToggleQuest(quest.id);
                              }
                            }}
                          >
                            <div className="flex items-center justify-center shrink-0">
                              {quest.completed ? (
                                <CheckCircle2 size={16} className="text-primary animate-[pop-check_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)]" />
                              ) : (
                                <Target size={16} className="text-ink-muted" />
                              )}
                            </div>
                            <div className="grow text-[0.8rem] text-ink font-medium leading-tight">
                              <span className={`transition-all duration-200 ${quest.completed ? 'line-through text-ink-muted' : ''}`}>{quest.text}</span>
                            </div>
                            <span className={`text-[0.7rem] font-bold bg-cyan-soft-2 text-accent-cyan py-0.5 px-2 rounded border border-cyan-line whitespace-nowrap ${quest.completed ? 'bg-ink-soft text-ink-muted border-line' : ''}`}>
                              +{quest.points} XP
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end mt-6 border-t border-line pt-4">
                        <button
                          onClick={handleRollNewQuests}
                          className="btn btn-outline px-2 py-1 text-[0.75rem] h-7 flex items-center gap-1"
                          title="Generate a new set of challenges"
                        >
                          <RotateCcw size={12} /> Roll New Quests
                        </button>
                      </div>
                    </div>

                    <div className="bg-card border border-line rounded-xl p-6">
                      <h3 className="text-[1.1rem] mb-5 flex items-center gap-2 m-0">
                        <Search size={18} className="text-primary" /> AI Concept Tutor
                      </h3>
                      <p className="text-[0.8rem] text-ink-muted mb-4">
                        Query textbook topics to extract explanations from notes.
                      </p>

                      <form onSubmit={handleAiSearch} className="flex gap-2 mb-4">
                        <input
                          type="text"
                          placeholder="Search 'mitochondria' or 'demand'..."
                          className="w-full bg-input border border-line rounded-md text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app m-0 text-[0.85rem] py-2 px-3 h-9.5"
                          value={aiSearchQuery}
                          onChange={(e) => setAiSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary px-4 h-9.5 shrink-0">
                          Ask AI
                        </button>
                      </form>

                      <AnimatePresence mode="wait">
                        {isAiLoading && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-[0.8rem] text-ink-muted italic flex items-center gap-1.5"
                          >
                            <Sparkles size={14} className="animate-spin" /> Fetching concept maps...
                          </motion.div>
                        )}

                        {aiResponse && !isAiLoading && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-app border border-line rounded-lg p-3.5 text-[0.85rem]"
                          >
                            <div className="font-semibold text-primary mb-1 flex items-center gap-1">
                              <MessageSquare size={14} /> Topic: "{aiResponse.query}"
                            </div>
                            <p className="text-ink text-[0.8rem] leading-snug m-0">
                              {aiResponse.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="bg-card border border-line rounded-xl p-6">
                      <h3 className="text-[1.1rem] mb-5 flex items-center gap-2 m-0">
                        <Clock size={18} className="text-primary" /> Spaced Recall Calendar
                      </h3>
                      <div className="flex flex-col gap-3">
                        {spacedRepetitionList.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-app border border-line rounded-lg"
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[0.85rem] font-semibold text-ink">{item.name}</span>
                              <span className="text-[0.7rem] text-ink-muted">Recall Strength: {item.progress}%</span>
                            </div>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                background: item.dueIn.includes('hours') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                color: item.dueIn.includes('hours') ? '#ef4444' : 'var(--text-secondary)',
                                border: '1px solid currentColor',
                                borderRadius: '4px',
                                padding: '0.15rem 0.4rem',
                                fontWeight: 'bold'
                              }}
                            >
                              Due in {item.dueIn}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-line rounded-xl p-7">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-[1.15rem] mb-5 flex items-center gap-2 m-0">
                      <FileText size={20} className="text-primary" /> Recent Outline Modules
                    </h3>
                    <button onClick={() => setIsUploadOpen(true)} className="btn btn-primary px-4 py-2 text-[0.85rem]">
                      <Plus size={16} /> Add Module
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {modules.length === 0 ? (
                      <div className="text-center p-8 text-ink-muted">
                        No study modules uploaded. Click "Add Module" to upload textbooks!
                      </div>
                    ) : (
                      modules.map((m) => (
                        <div className="flex justify-between items-center bg-app border border-line rounded-lg p-4 px-5" key={m.id}>
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-base">{m.name}</span>
                            <div className="text-[0.8rem] text-ink-muted flex gap-4">
                              <span>Uploaded: {m.date}</span>
                              <span>Size: {m.size}</span>
                              <span>Questions: {m.questionsCount}</span>
                              {m.subject && <span className="bg-glass-strong border border-line rounded px-1.5 text-[0.7rem] font-semibold">{m.subject}</span>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => startQuiz(m)} className="btn btn-primary px-4 py-2 text-[0.85rem]">
                              Practice Quiz
                            </button>
                            <button onClick={() => handleDeleteModule(m.id)} className="btn btn-outline p-2 text-danger border-danger-line" aria-label="Delete module">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

            {dashboardTab === 'modules' && selectedGroupId === null && (
              <div className="bg-card border border-line rounded-xl p-7">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[1.15rem] mb-5 flex items-center gap-2 m-0">My Study Modules</h3>
                  <button onClick={() => setIsUploadOpen(true)} className="btn btn-primary">
                    <Plus size={18} /> Add Module
                  </button>
                </div>

                <div className="flex gap-2 mb-6 flex-wrap">
                  {subjects.map((subj) => (
                    <button
                      key={subj}
                      onClick={() => setSelectedSubject(subj)}
                      style={{
                        padding: '0.35rem 0.85rem',
                        fontSize: '0.8rem',
                        borderRadius: '20px',
                        background: selectedSubject === subj ? 'var(--primary)' : 'rgba(255,255,255,0.04)',
                        color: selectedSubject === subj ? '#121212' : 'var(--text-secondary)',
                        border: selectedSubject === subj ? 'none' : '1px solid var(--border)',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease'
                      }}
                      className="transition-all duration-200"
                    >
                      {subj === 'All' ? '📂 All Folders' : `🏷️ ${subj}`}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  {filteredModules.length === 0 ? (
                    <div className="text-center p-8 text-ink-muted">
                      No modules found in folder "{selectedSubject}".
                    </div>
                  ) : (
                    filteredModules.map((m) => (
                      <div className="flex justify-between items-center bg-app border border-line rounded-lg p-4 px-5" key={m.id}>
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-base">{m.name}</span>
                          <div className="text-[0.8rem] text-ink-muted flex gap-4">
                            <span>Date: {m.date}</span>
                            <span>Size: {m.size}</span>
                            <span>Practice Questions: {m.questionsCount}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => startQuiz(m)} className="btn btn-primary">
                            <Play size={14} fill="currentColor" className="mr-1" /> Practice Quiz
                          </button>
                          <button onClick={() => handleDeleteModule(m.id)} className="btn btn-outline text-danger border-danger-line">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {dashboardTab === 'groups' && selectedGroupId === null && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[1.15rem] mb-5 flex items-center gap-2 m-0">My Study Groups</h3>
                  <button onClick={() => setIsGroupModalOpen(true)} className="btn btn-primary">
                    <Plus size={18} /> Create Study Group
                  </button>
                </div>

                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
                  {groups.map((group) => (
                    <div className="bg-card border border-line rounded-xl p-7 flex flex-col h-full" key={group.id}>
                      <h4 className="text-xl mb-2">{group.name}</h4>
                      <span className="text-[0.85rem] text-ink-muted">
                        {group.members.length} Members | {group.modules.length} Shared Modules
                      </span>

                      <div className="flex items-center mt-3">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-glass-strong border-2 border-primary -ml-2 first:ml-0 text-primary object-cover"
                            title={`${user.name} (You)`}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-primary text-ink-on-primary border-2 border-primary -ml-2 first:ml-0" title={`${user.name} (You)`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {group.members.map((m, idx) => (
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-glass-strong border-2 -ml-2 first:ml-0 ${m.online ? 'border-primary text-primary' : 'border-card text-ink'}`}
                            key={idx}
                            title={`${m.name} (${m.online ? 'Online' : 'Offline'})`}
                          >
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                        ))}
                      </div>

                      <div className="mt-auto pt-6 flex justify-end">
                        <button
                          onClick={() => { setSelectedGroupId(group.id); completeQuest('study_group'); }}
                          className="btn btn-outline inline-flex items-center gap-1 px-4 py-2 text-[0.85rem]"
                        >
                          Enter Group <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedGroupId !== null && activeGroup && (
              <div>
                <div className="bg-[linear-gradient(135deg,rgba(62,207,142,0.04),rgba(6,182,212,0.04))] border border-line rounded-xl p-6 mb-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <button
                        onClick={() => setSelectedGroupId(null)}
                        className="btn btn-outline px-3 py-2 text-[0.8rem] mb-4 border-0 bg-transparent"
                      >
                        &larr; Back to Groups
                      </button>
                      <h2 className="text-[1.8rem] mb-1">{activeGroup.name}</h2>
                      <p className="text-ink-muted text-[0.9rem]">Collaborative Study Room</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="inline-flex items-center gap-1 text-[0.7rem] font-bold uppercase tracking-wider py-1 px-2.5 rounded-full border bg-primary-soft text-primary border-primary-line">Group Active</span>
                      <span className="text-[0.8rem] text-ink-muted">{activeGroup.members.length + 1} online study partners</span>
                    </div>
                  </div>

                  <div className="flex items-center">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-glass-strong border-2 border-primary -ml-2 first:ml-0 text-primary object-cover"
                        title={`${user.name} (You)`}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-primary text-ink-on-primary border-2 border-primary -ml-2 first:ml-0" title={`${user.name} (You)`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {activeGroup.members.map((m, idx) => (
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-glass-strong border-2 -ml-2 first:ml-0 ${m.online ? 'border-primary text-primary' : 'border-card text-ink'}`}
                        key={idx}
                        title={`${m.name} (${m.online ? 'Online' : 'Offline'})`}
                      >
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 max-md:grid-cols-1">
                  <div className="bg-card border border-line rounded-xl p-7">
                    <h3 className="text-[1.15rem] mb-5 flex items-center gap-2">Shared Modules</h3>
                    {activeGroup.modules.length === 0 ? (
                      <div className="text-center p-8 text-ink-muted">
                        No shared modules in this group yet. Add a module to start studying together!
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {activeGroup.modules.map((m) => (
                          <div className="flex justify-between items-center bg-app border border-line rounded-lg p-4 px-5" key={m.id}>
                            <div className="flex flex-col gap-1">
                              <span className="font-bold text-base">{m.name}</span>
                              <div className="text-[0.75rem] text-ink-muted flex gap-4">
                                <span>Questions: {m.questionsCount}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => startGroupQuiz(m, activeGroup.id)}
                              className="btn btn-primary px-3.5 py-2 text-[0.8rem]"
                            >
                              Take Group Quiz
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-card border border-line rounded-xl p-7">
                    <h3 className="text-[1.15rem] mb-5 flex items-center gap-2">Group Scorecards</h3>
                    {activeGroup.quizSessions.length === 0 ? (
                      <div className="text-center p-8 text-ink-muted">
                        No group quizzes taken yet. Launch a Group Quiz session to view scoreboard history!
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {activeGroup.quizSessions.map((s, idx) => (
                          <div key={idx} className="bg-app border border-line rounded-xl p-4 px-5">
                            <div className="flex justify-between items-center mb-3">
                              <span className="font-bold text-[0.95rem]">{s.moduleName}</span>
                              <span className="inline-flex items-center gap-1 text-[0.7rem] font-bold uppercase tracking-wider py-1 px-2.5 rounded-full border bg-primary-soft text-primary border-primary-line">Avg: {s.avgScore}</span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {s.rankings.map((rank, rankIdx) => (
                                <span
                                  key={rankIdx}
                                  className="text-[0.75rem] bg-glass border border-line rounded-md p-1 px-2"
                                >
                                  {rank.name.split(' ')[0]}: <strong>{rank.score}</strong>
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {dashboardTab === 'tools' && selectedGroupId === null && (
              <div className="bg-card border border-line rounded-xl p-7">
                <h3 className="text-[1.15rem] mb-5 flex items-center gap-2">Study Utilities</h3>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
                  {studyTools.map((t, idx) => (
                    <div className="bg-app border border-line rounded-lg p-6 cursor-pointer text-center transition-all duration-200 hover:border-primary hover:bg-glass" key={idx} onClick={() => alert(`Launching: ${t.title}`)}>
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-soft text-primary mb-3 mx-auto">{t.icon}</div>
                      <div className="text-[0.95rem] font-bold mb-2">{t.title}</div>
                      <div className="text-[0.8rem] text-ink-muted">{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dashboardTab === 'settings' && selectedGroupId === null && (
              <>
                <div className="bg-card border border-line rounded-xl p-7 flex flex-col gap-6">
                  <h3 className="text-[1.15rem] mb-5 flex items-center gap-2">Profile Settings</h3>

                  <div>
                    <label className="text-[0.9rem] font-semibold text-ink mb-3">Profile Picture</label>
                    <div className="flex items-center gap-6 flex-wrap">
                      <div className="relative">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-primary text-ink-on-primary flex items-center justify-center text-3xl font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className="text-[0.8rem] text-ink-muted">Choose an avatar or upload your own:</span>
                        <div className="flex items-center gap-3 flex-wrap">
                          {[
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
                            'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80',
                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
                            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
                            'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80'
                          ].map((url, idx) => (
                            <button
                              key={idx}
                              onClick={() => { setUser({ ...user, avatar: url }); completeQuest('custom', 'custom_avatar'); }}
                              style={{
                                border: user.avatar === url ? '2px solid var(--primary)' : '2px solid transparent',
                                background: 'none'
                              }}
                              className="p-0 rounded-full cursor-pointer w-10 h-10 overflow-hidden transition-all duration-200"
                            >
                              <img src={url} alt={`Avatar option ${idx + 1}`} className="w-full h-full object-cover" />
                            </button>
                          ))}

                          <label
                            className="btn btn-outline px-3 py-2 text-[0.8rem] rounded-full cursor-pointer inline-flex items-center gap-1 h-10 box-border"
                          >
                            <Plus size={14} /> Upload Custom
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleAvatarUpload}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-6 flex-wrap">
                    <div className="flex flex-col gap-2 mb-4 flex-1 min-w-60 m-0">
                      <label className="text-[0.9rem] font-semibold text-ink">Display Name</label>
                      <input
                        type="text"
                        className="w-full py-2 px-3 bg-input border border-line rounded-md text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app pl-4"
                        value={user.name}
                        onChange={(e) => setUser({ ...user, name: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-2 mb-4 flex-1 min-w-60 m-0">
                      <label className="text-[0.9rem] font-semibold text-ink">Email Address</label>
                      <input
                        type="text"
                        className="w-full py-2 px-3 bg-input border border-line rounded-md text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app pl-4 opacity-70"
                        value={user.email}
                        disabled
                      />
                    </div>
                    <div className="flex flex-col gap-2 mb-4 flex-1 min-w-60 m-0">
                        <label className="text-[0.9rem] font-semibold text-ink">School / Institution</label>
                        <input
                          type="text"
                          className="w-full py-2 px-3 bg-input border border-line rounded-md text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app pl-4"
                          value={user.school || ''}
                          onChange={(e) => {
                            const newSchool = e.target.value;
                            setUser({ ...user, school: newSchool });
                            if (newSchool && newSchool !== 'State University') {
                              completeQuest('custom', 'change_school');
                            }
                          }}
                          placeholder="e.g. State University"
                        />
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-line rounded-xl p-7 flex flex-col gap-6 mt-6">
                  <h3 className="text-[1.15rem] mb-5 flex items-center gap-2">Notification Settings</h3>

                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center pb-3 border-b border-line">
                      <div>
                        <div className="font-semibold text-[0.9rem] text-ink">Study Group Activity</div>
                        <div className="text-[0.75rem] text-ink-muted">Notify me when members share new modules or start sessions</div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={notifStudyGroup}
                          onChange={(e) => setNotifStudyGroup(e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="flex justify-between items-center pb-3 border-b border-line">
                      <div>
                        <div className="font-semibold text-[0.9rem] text-ink">Practice Quiz Reminders</div>
                        <div className="text-[0.75rem] text-ink-muted">Remind me of due spaced repetition cards and revision targets</div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={notifQuizReminders}
                          onChange={(e) => setNotifQuizReminders(e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="flex justify-between items-center pb-3 border-b border-line">
                      <div>
                        <div className="font-semibold text-[0.9rem] text-ink">Notification Sound Alerts</div>
                        <div className="text-[0.75rem] text-ink-muted">Play a subtle sound when a new alert dropdown pops up</div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={notifSounds}
                          onChange={(e) => setNotifSounds(e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-[0.9rem] text-ink">Email Digest Reports</div>
                        <div className="text-[0.75rem] text-ink-muted">Receive a weekly recap of your study hours, progress and group stats</div>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={notifEmails}
                          onChange={(e) => setNotifEmails(e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-line rounded-xl p-7 flex flex-col gap-6 mt-6">
                  <h3 className="text-[1.15rem] mb-5 flex items-center gap-2">Security Settings</h3>

                  <form onSubmit={(e) => { e.preventDefault(); alert('Password successfully updated!'); }} className="flex flex-col gap-5">
                    <div className="flex gap-6 flex-wrap">
                      <div className="flex flex-col gap-2 mb-4 flex-1 min-w-50 m-0">
                        <label className="text-[0.9rem] font-semibold text-ink">Current Password</label>
                        <input
                          type="password"
                          className="w-full py-2 px-3 bg-input border border-line rounded-md text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app pl-4"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2 mb-4 flex-1 min-w-50 m-0">
                        <label className="text-[0.9rem] font-semibold text-ink">New Password</label>
                        <input
                          type="password"
                          className="w-full py-2 px-3 bg-input border border-line rounded-md text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app pl-4"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2 mb-4 flex-1 min-w-50 m-0">
                        <label className="text-[0.9rem] font-semibold text-ink">Confirm New Password</label>
                        <input
                          type="password"
                          className="w-full py-2 px-3 bg-input border border-line rounded-md text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app pl-4"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button type="submit" className="btn btn-primary px-5 py-2.5 text-[0.85rem]">
                        Reset Password
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </>
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
                  <Zap size={20} fill="var(--primary)" className="text-primary" />
                  Level {level} Student
                </div>

                <p className="relative z-2 text-[0.85rem] text-ink-muted leading-relaxed mb-8">
                  Excellent study habits! Your daily quests have refreshed your cognitive focus. Keep learning!
                </p>

                <button
                  onClick={() => setShowLevelUp(false)}
                  className="btn btn-primary relative z-2 w-full py-3 text-[0.9rem] font-bold rounded-xl h-auto border-0 cursor-pointer transition-all duration-200 hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-glow-primary-btn-hover"
                >
                  Keep Studying
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
