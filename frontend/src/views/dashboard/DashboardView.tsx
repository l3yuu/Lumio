import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap } from 'lucide-react';
import type { User, Module, StudyGroup, GroupQuizSession, GroupQuizRank, DashboardTab, View, StudyQuest, ExamDeadline } from '../../types';

import { DashboardSidebar } from './DashboardSidebar';
import { OverviewPanel } from './OverviewPanel';
import { ModulesPanel } from './ModulesPanel';
import { GroupsPanel } from './GroupsPanel';
import { ToolsPanel } from './ToolsPanel';
import { SettingsPanel } from './SettingsPanel';
import { QuizPanel } from './QuizPanel';
import { CalendarPanel } from './CalendarPanel';
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
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user, setUser, modules, groups, setModules, setGroups, setIsUploadOpen, setIsGroupModalOpen,
  studyTools, dashboardTab, setDashboardTab, selectedGroupId, setSelectedGroupId,
  activeQuizModule, setActiveQuizModule, isSidebarCollapsed: isCollapsed, setView,
}) => {
  const [activeTool, setActiveTool] = useState<ActiveTool | null>(null);

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

  useEffect(() => { localStorage.setItem('lumio_quiz_history', JSON.stringify(quizHistory)); }, [quizHistory]);

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
      try { return JSON.parse(savedQuests) as StudyQuest[]; }
      catch (e) { console.error('Failed to parse saved quests', e); }
    }
    const shuffled = [...questPool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3).map(q => ({ ...q, completed: false }));
    localStorage.setItem('lumio_quests_date', todayStr);
    localStorage.setItem('lumio_quests', JSON.stringify(selected));
    return selected;
  });

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [questToast, setQuestToast] = useState<{ text: string; points: number } | null>(null);

  useEffect(() => { localStorage.setItem('lumio_user_level', level.toString()); }, [level]);
  useEffect(() => { localStorage.setItem('lumio_user_xp', xp.toString()); }, [xp]);
  useEffect(() => { localStorage.setItem('lumio_quests', JSON.stringify(quests)); }, [quests]);

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
      const updated = prevQuests.map(q => q.id === id ? { ...q, completed: true } : q);
      gainXp(quest.points);
      showQuestToast(quest.text, quest.points);
      return updated;
    });
  };

  const handleRollNewQuests = () => {
    const shuffled = [...questPool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3).map(q => ({ ...q, completed: false }));
    setQuests(selected);
    localStorage.setItem('lumio_quests_date', new Date().toDateString());
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

  useEffect(() => { localStorage.setItem('lumio_exams', JSON.stringify(exams)); }, [exams]);

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle.trim() || !newExamDate.trim()) return;
    setExams([...exams, {
      id: Date.now(), title: newExamTitle,
      subject: newExamSubject,
      date: new Date(newExamDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      rawDate: newExamDate, daysRemaining: calculateDaysRemaining(newExamDate), priority: newExamPriority
    }]);
    setNewExamTitle(''); setNewExamDate(''); setNewExamPriority('medium'); setIsAddingExam(false);
    completeQuest('custom', 'add_exam');
  };

  const handleDeleteExam = (id: number) => setExams(exams.filter(e => e.id !== id));

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
    { label: 'Mon', hours: 3, level: 2 }, { label: 'Tue', hours: 0, level: 0 },
    { label: 'Wed', hours: 5, level: 3 }, { label: 'Thu', hours: 2, level: 1 },
    { label: 'Fri', hours: 1, level: 1 }, { label: 'Sat', hours: 0, level: 0 },
    { label: 'Sun', hours: 4, level: 3 }, { label: 'Mon', hours: 2, level: 1 },
    { label: 'Tue', hours: 6, level: 4 }, { label: 'Wed', hours: 1, level: 1 },
    { label: 'Thu', hours: 3, level: 2 }, { label: 'Fri', hours: 4, level: 3 },
    { label: 'Sat', hours: 0, level: 0 }, { label: 'Sun', hours: 5, level: 4 }
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
    completeQuest('complete_quiz');
    const percent = Math.round((score / activeQuizModule.questions.length) * 100);
    setQuizHistory(prev => [...prev, percent]);

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
    setModules(modules.filter(m => m.id !== id));
    if (activeQuizModule?.id === id) setActiveQuizModule(null);
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
    <div className={`grid max-md:grid-cols-1 max-md:grid-rows-[auto_1fr] h-[calc(100vh-58px)] overflow-hidden transition-[grid-template-columns] duration-280 ease-in-out ${isCollapsed ? 'md:grid-cols-[68px_1fr]' : 'md:grid-cols-[240px_1fr]'}`}>
      <DashboardSidebar
        isCollapsed={isCollapsed}
        dashboardTab={dashboardTab}
        setDashboardTab={handleSetDashboardTab}
        selectedGroupId={selectedGroupId}
        setSelectedGroupId={setSelectedGroupId}
        setActiveQuizModule={setActiveQuizModule}
        user={user}
        completeQuest={completeQuest}
      />

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
        <main className="flex flex-col gap-6 py-7 px-8 pb-20 max-w-275 w-full mx-auto max-md:py-4 max-md:px-4 max-md:pb-16">
          {activeQuizModule ? (
            <QuizPanel
              activeQuizModule={activeQuizModule}
              isGroupQuizMode={isGroupQuizMode}
              activeGroup={activeGroup}
              selectedAnswers={selectedAnswers}
              showQuizResults={showQuizResults}
              quizScore={quizScore}
              activeQuizSession={activeQuizSession}
              setActiveQuizModule={setActiveQuizModule}
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
                    spacedRepetitionList={spacedRepetitionList}
                    heatmapData={heatmapData}
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

                {dashboardTab === 'settings' && selectedGroupId === null && (
                  <SettingsPanel
                    user={user}
                    setUser={setUser}
                    handleAvatarUpload={handleAvatarUpload}
                    completeQuest={completeQuest}
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
        </main>
        )}
      </div>
    </div>
  );
};
