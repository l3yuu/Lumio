import React, { useState } from 'react';
import { 
  Layers, Play, FileText, Plus, Trash2, Trophy, Users, Clock, ChevronRight, Settings, Flame,
  Calendar, Search, MessageSquare, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

interface GroupQuizRank {
  name: string;
  score: string;
  percentage: number;
  time: string;
  isUser: boolean;
}

interface GroupQuizSession {
  id: number;
  moduleName: string;
  date: string;
  avgScore: string;
  rankings: GroupQuizRank[];
}

interface Module {
  id: number;
  name: string;
  date: string;
  size: string;
  questionsCount: number;
  subject?: string;
  questions: QuizQuestion[];
}

interface GroupMember {
  name: string;
  email: string;
  online: boolean;
}

interface StudyGroup {
  id: number;
  name: string;
  members: GroupMember[];
  modules: Module[];
  quizSessions: GroupQuizSession[];
}

interface DashboardViewProps {
  user: { name: string; email: string };
  modules: Module[];
  groups: StudyGroup[];
  setModules: React.Dispatch<React.SetStateAction<Module[]>>;
  setGroups: React.Dispatch<React.SetStateAction<StudyGroup[]>>;
  setIsUploadOpen: (open: boolean) => void;
  setIsGroupModalOpen: (open: boolean) => void;
  studyTools: { title: string; desc: string; icon: React.ReactNode }[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  modules,
  groups,
  setModules,
  setGroups,
  setIsUploadOpen,
  setIsGroupModalOpen,
  studyTools
}) => {
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'modules' | 'groups' | 'tools' | 'settings'>('overview');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  // Filter States
  const [selectedSubject, setSelectedSubject] = useState<string>('All');

  // AI Tutor Search State
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<{ query: string; answer: string } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Quiz Simulator State
  const [activeQuizModule, setActiveQuizModule] = useState<Module | null>(null);
  const [isGroupQuizMode, setIsGroupQuizMode] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: number]: number }>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [activeQuizSession, setActiveQuizSession] = useState<GroupQuizSession | null>(null);

  // Mock Spaced Repetition items
  const spacedRepetitionList = [
    { id: 1, name: 'Cell Biology & Genetics - Chapter 3', subject: 'Biology', dueIn: '2 hours', progress: 85 },
    { id: 2, name: 'Introduction to Microeconomics', subject: 'Economics', dueIn: '1 day', progress: 60 },
    { id: 3, name: 'Calculus I - Integration Outlines', subject: 'Mathematics', dueIn: '3 days', progress: 45 }
  ];

  // Mock Study Activity Heatmap Data (last 14 days)
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

  // Get color for activity levels
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

  const activeGroup = groups.find(g => g.id === selectedGroupId);

  // Extract unique subjects from modules list for folder filtering
  const subjects = ['All', ...Array.from(new Set(modules.map(m => m.subject).filter(Boolean))) as string[]];

  const filteredModules = selectedSubject === 'All' 
    ? modules 
    : modules.filter(m => m.subject === selectedSubject);

  return (
    <div className="dashboard-grid">
      {/* Sidebar Panel */}
      <aside className="dashboard-sidebar">
        <div style={{ padding: '0 0.5rem 1.5rem 0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>STUDENT ACCOUNT</span>
          <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>{user.email}</span>
        </div>

        <button 
          className={`sidebar-link ${dashboardTab === 'overview' && selectedGroupId === null ? 'active' : ''}`}
          onClick={() => { setDashboardTab('overview'); setActiveQuizModule(null); setSelectedGroupId(null); }}
        >
          <Layers size={18} /> Overview Panels
        </button>

        <button 
          className={`sidebar-link ${dashboardTab === 'modules' && selectedGroupId === null ? 'active' : ''}`}
          onClick={() => { setDashboardTab('modules'); setActiveQuizModule(null); setSelectedGroupId(null); }}
        >
          <FileText size={18} /> My Study Modules
        </button>

        <button 
          className={`sidebar-link ${dashboardTab === 'groups' || selectedGroupId !== null ? 'active' : ''}`}
          onClick={() => { setDashboardTab('groups'); setActiveQuizModule(null); setSelectedGroupId(null); }}
        >
          <Users size={18} /> Collaborative Circles
        </button>

        <button 
          className={`sidebar-link ${dashboardTab === 'tools' && selectedGroupId === null ? 'active' : ''}`}
          onClick={() => { setDashboardTab('tools'); setActiveQuizModule(null); setSelectedGroupId(null); }}
        >
          <Plus size={18} /> study Tools
        </button>

        <button 
          className={`sidebar-link ${dashboardTab === 'settings' && selectedGroupId === null ? 'active' : ''}`}
          onClick={() => { setDashboardTab('settings'); setActiveQuizModule(null); setSelectedGroupId(null); }}
        >
          <Settings size={18} /> Settings
        </button>
      </aside>

      {/* Main Panel Content */}
      <main className="dashboard-main">
        {activeQuizModule ? (
          /* Quiz Simulator View */
          <div className="quiz-container">
            <div className="quiz-header">
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                  {isGroupQuizMode ? 'Group Quiz Session' : 'Individual Practice Quiz'}
                </h3>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Module: {activeQuizModule.name} {isGroupQuizMode && activeGroup && ` | Group: ${activeGroup.name}`}
                </span>
              </div>
              <button 
                onClick={() => {
                  setActiveQuizModule(null);
                  setIsGroupQuizMode(false);
                }} 
                className="btn btn-outline" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                Exit Quiz
              </button>
            </div>

            {!showQuizResults ? (
              <>
                {activeQuizModule.questions.map((q, qIndex) => (
                  <div className="quiz-question-card" key={q.id}>
                    <div className="quiz-question-text">
                      {qIndex + 1}. {q.question}
                    </div>
                    <div className="quiz-options-list">
                      {q.options.map((option, optIdx) => (
                        <button
                          key={optIdx}
                          className={`quiz-option ${selectedAnswers[q.id] === optIdx ? 'selected' : ''}`}
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
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '1rem', marginTop: '1rem' }}
                >
                  Submit & Grade {isGroupQuizMode ? 'Group Results' : 'Quiz'} &rarr;
                </button>
              </>
            ) : (
              /* Quiz Score Results & Group Scorecard */
              <div className="quiz-results-card">
                {isGroupQuizMode && activeQuizSession ? (
                  <div className="scorecard-container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.5rem', color: 'var(--primary)' }}>
                      <Trophy size={32} />
                      <h4 style={{ fontSize: '1.75rem', margin: 0 }}>Group Quiz Scorecard</h4>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                      Session on: {activeQuizSession.moduleName} | {activeQuizSession.date}
                    </p>
                    
                    <div className="scorecard-stats">
                      <div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                          {activeQuizSession.avgScore}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Group Average Accuracy</span>
                      </div>
                      <div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                          {quizScore} / {activeQuizModule.questions.length}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Your Score</span>
                      </div>
                    </div>

                    <table className="scorecard-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Name</th>
                          <th>Score</th>
                          <th>Accuracy</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeQuizSession.rankings.map((rank, rankIdx) => {
                          const isCurrentUser = rank.isUser;
                          return (
                            <tr key={rankIdx} className={`scorecard-row ${isCurrentUser ? 'user-row' : ''}`}>
                              <td>
                                <div className={`rank-badge rank-${rankIdx + 1 <= 3 ? rankIdx + 1 : 'other'}`}>
                                  {rankIdx + 1}
                                </div>
                              </td>
                              <td style={{ fontWeight: isCurrentUser ? 700 : 500 }}>
                                {rank.name}
                              </td>
                              <td>{rank.score}</td>
                              <td style={{ color: rank.percentage >= 70 ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 'bold' }}>
                                {rank.percentage}%
                              </td>
                              <td>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
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
                    <div className="score-badge">
                      {quizScore} / {activeQuizModule.questions.length}
                    </div>
                    <h4 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                      {quizScore === activeQuizModule.questions.length ? 'Perfect Score! 🎉' : 'Keep Studying! 📚'}
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
                      You scored {(quizScore / activeQuizModule.questions.length * 100).toFixed(0)}% accuracy on this test.
                    </p>
                  </>
                )}

                {/* Question Reviews */}
                <div style={{ textAlign: 'left', marginBottom: '3rem' }}>
                  <h5 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Question Review</h5>
                  {activeQuizModule.questions.map((q, qIndex) => {
                    const selected = selectedAnswers[q.id];
                    const correct = q.correctAnswerIndex;
                    return (
                      <div className="quiz-question-card" key={q.id}>
                        <div className="quiz-question-text" style={{ fontSize: '1.15rem' }}>
                          {qIndex + 1}. {q.question}
                        </div>
                        <div className="quiz-options-list">
                          {q.options.map((option, optIdx) => {
                            let statusClass = '';
                            if (optIdx === correct) statusClass = 'correct-reveal';
                            else if (optIdx === selected && selected !== correct) statusClass = 'incorrect-reveal';
                            
                            return (
                              <div key={optIdx} className={`quiz-option ${statusClass}`} style={{ cursor: 'default' }}>
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

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
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
          /* Regular Layout Panels */
          <>
            {dashboardTab === 'overview' && selectedGroupId === null && (
              <>
                {/* Welcome Banner */}
                <div className="welcome-banner" style={{ marginBottom: '2rem' }}>
                  <h2 className="welcome-title">Welcome back, {user.name}!</h2>
                  <p className="welcome-desc">
                    Track your daily progress, query topics instantly with the AI tutor, and practice scheduled card recall modules.
                  </p>
                </div>

                {/* Grid Container for Layout Widgets */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                  
                  {/* Left Column: Stats & Progress Heatmap */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Stats Matrix Grid */}
                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                      <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
                        <div style={{ background: 'rgba(62, 207, 142, 0.1)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '8px' }}>
                          <Flame size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>5 Days</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Streak</div>
                        </div>
                      </div>
                      <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
                        <div style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent)', padding: '0.5rem', borderRadius: '8px' }}>
                          <Users size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{groups.length} Circles</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Groups</div>
                        </div>
                      </div>
                      <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '8px' }}>
                          <Trophy size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>12 Results</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Quizzes</div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Heatmap Widget */}
                    <div className="dashboard-card" style={{ padding: '1.5rem' }}>
                      <h3 className="dashboard-card-title" style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                        <Calendar size={18} color="var(--primary)" /> Activity Progress Intensity
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                        Visualizing mock study hours and generated syllabus reviews over the last two weeks.
                      </p>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {heatmapData.map((data, index) => (
                          <div 
                            key={index} 
                            style={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center',
                              flex: 1,
                              minWidth: '32px'
                            }}
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
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{data.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Spaced Repetition & AI Tutor Search */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* AI Quick Search & Tutor */}
                    <div className="dashboard-card" style={{ padding: '1.5rem' }}>
                      <h3 className="dashboard-card-title" style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                        <Search size={18} color="var(--primary)" /> AI Concept Tutor
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Query textbook topics to extract explanations from notes.
                      </p>
                      
                      <form onSubmit={handleAiSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <input 
                          type="text" 
                          placeholder="Search 'mitochondria' or 'demand'..." 
                          className="form-input" 
                          style={{ margin: 0, fontSize: '0.85rem', padding: '0.5rem 0.75rem', height: '38px' }}
                          value={aiSearchQuery}
                          onChange={(e) => setAiSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary" style={{ padding: '0 1rem', height: '38px', flexShrink: 0 }}>
                          Ask AI
                        </button>
                      </form>

                      <AnimatePresence mode="wait">
                        {isAiLoading && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Sparkles size={14} className="animate-spin" /> Fetching concept maps...
                          </motion.div>
                        )}

                        {aiResponse && !isAiLoading && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            style={{ 
                              background: 'var(--bg-app)', 
                              border: '1px solid var(--border)', 
                              borderRadius: '8px', 
                              padding: '0.85rem',
                              fontSize: '0.85rem'
                            }}
                          >
                            <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MessageSquare size={14} /> Topic: "{aiResponse.query}"
                            </div>
                            <p style={{ color: 'var(--text-primary)', fontSize: '0.8rem', lineHeight: '1.4', margin: 0 }}>
                              {aiResponse.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Spaced Repetition Schedule widget */}
                    <div className="dashboard-card" style={{ padding: '1.5rem' }}>
                      <h3 className="dashboard-card-title" style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                        <Clock size={18} color="var(--primary)" /> Spaced Recall Calendar
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {spacedRepetitionList.map((item) => (
                          <div 
                            key={item.id} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between', 
                              padding: '0.75rem', 
                              background: 'var(--bg-app)', 
                              border: '1px solid var(--border)', 
                              borderRadius: '8px' 
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Recall Strength: {item.progress}%</span>
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

                {/* Quick Module Practice list */}
                <div className="dashboard-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 className="dashboard-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={20} color="var(--primary)" /> Recent Outline Modules
                    </h3>
                    <button onClick={() => setIsUploadOpen(true)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                      <Plus size={16} /> Add Module
                    </button>
                  </div>

                  <div className="module-list">
                    {modules.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No study modules uploaded. Click "Add Module" to upload textbooks!
                      </div>
                    ) : (
                      modules.map((m) => (
                        <div className="module-item" key={m.id}>
                          <div className="module-info">
                            <span className="module-name">{m.name}</span>
                            <div className="module-meta">
                              <span>Uploaded: {m.date}</span>
                              <span>Size: {m.size}</span>
                              <span>Questions: {m.questionsCount}</span>
                              {m.subject && <span style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '4px', padding: '0 0.4rem', fontSize: '0.7rem', fontWeight: 600 }}>{m.subject}</span>}
                            </div>
                          </div>
                          <div className="module-actions">
                            <button onClick={() => startQuiz(m)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                              Practice Quiz
                            </button>
                            <button onClick={() => handleDeleteModule(m.id)} className="btn btn-outline" style={{ padding: '0.5rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }} aria-label="Delete module">
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
              <div className="dashboard-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 className="dashboard-card-title" style={{ margin: 0 }}>My Study Modules</h3>
                  <button onClick={() => setIsUploadOpen(true)} className="btn btn-primary">
                    <Plus size={18} /> Add Module
                  </button>
                </div>

                {/* Subject Folder Filter Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
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
                    >
                      {subj === 'All' ? '📂 All Folders' : `🏷️ ${subj}`}
                    </button>
                  ))}
                </div>

                <div className="module-list">
                  {filteredModules.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No modules found in folder "{selectedSubject}".
                    </div>
                  ) : (
                    filteredModules.map((m) => (
                      <div className="module-item" key={m.id}>
                        <div className="module-info">
                          <span className="module-name">{m.name}</span>
                          <div className="module-meta">
                            <span>Date: {m.date}</span>
                            <span>Size: {m.size}</span>
                            <span>Practice Questions: {m.questionsCount}</span>
                          </div>
                        </div>
                        <div className="module-actions">
                          <button onClick={() => startQuiz(m)} className="btn btn-primary">
                            <Play size={14} fill="currentColor" style={{ marginRight: '4px' }} /> Practice Quiz
                          </button>
                          <button onClick={() => handleDeleteModule(m.id)} className="btn btn-outline" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 className="dashboard-card-title" style={{ margin: 0 }}>My Study Groups</h3>
                  <button onClick={() => setIsGroupModalOpen(true)} className="btn btn-primary">
                    <Plus size={18} /> Create Study Group
                  </button>
                </div>

                <div className="group-grid">
                  {groups.map((group) => (
                    <div className="dashboard-card" key={group.id} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{group.name}</h4>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {group.members.length} Members | {group.modules.length} Shared Modules
                      </span>
                      
                      <div className="member-avatars">
                        <div className="member-avatar online" style={{ background: 'var(--primary)', color: '#121212' }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        {group.members.map((m, idx) => (
                          <div 
                            className={`member-avatar ${m.online ? 'online' : ''}`} 
                            key={idx}
                            title={`${m.name} (${m.online ? 'Online' : 'Offline'})`}
                          >
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                        ))}
                      </div>

                      <div style={{ marginTop: 'auto', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => setSelectedGroupId(group.id)} 
                          className="btn btn-outline" 
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
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
              /* Group Specific Panel Details */
              <div>
                {/* Header Banner */}
                <div className="group-header-banner">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <button 
                        onClick={() => setSelectedGroupId(null)} 
                        className="btn btn-outline" 
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', marginBottom: '1rem', border: 'none', background: 'none' }}
                      >
                        &larr; Back to Groups
                      </button>
                      <h2 style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>{activeGroup.name}</h2>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Collaborative Study Room</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <span className="badge badge-online">Group Active</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{activeGroup.members.length + 1} online study partners</span>
                    </div>
                  </div>

                  <div className="member-avatars">
                    <div className="member-avatar online" style={{ background: 'var(--primary)', color: '#121212' }} title={`${user.name} (You)`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    {activeGroup.members.map((m, idx) => (
                      <div 
                        className={`member-avatar ${m.online ? 'online' : ''}`} 
                        key={idx}
                        title={`${m.name} (${m.online ? 'Online' : 'Offline'})`}
                      >
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  {/* Left: Shared Modules */}
                  <div className="dashboard-card">
                    <h3 className="dashboard-card-title" style={{ marginBottom: '1.25rem' }}>Shared Modules</h3>
                    {activeGroup.modules.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No shared modules in this group yet. Add a module to start studying together!
                      </div>
                    ) : (
                      <div className="module-list">
                        {activeGroup.modules.map((m) => (
                          <div className="module-item" key={m.id} style={{ padding: '1rem 1.25rem' }}>
                            <div className="module-info">
                              <span className="module-name" style={{ fontSize: '1rem' }}>{m.name}</span>
                              <div className="module-meta" style={{ fontSize: '0.75rem' }}>
                                <span>Questions: {m.questionsCount}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => startGroupQuiz(m, activeGroup.id)} 
                              className="btn btn-primary" 
                              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                            >
                              Take Group Quiz
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Group Scorecards History */}
                  <div className="dashboard-card">
                    <h3 className="dashboard-card-title" style={{ marginBottom: '1.25rem' }}>Group Scorecards</h3>
                    {activeGroup.quizSessions.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No group quizzes taken yet. Launch a Group Quiz session to view scoreboard history!
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {activeGroup.quizSessions.map((s, idx) => (
                          <div key={idx} style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{s.moduleName}</span>
                              <span className="badge badge-online" style={{ textTransform: 'none' }}>Avg: {s.avgScore}</span>
                            </div>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                              {s.rankings.map((rank, rankIdx) => (
                                <span 
                                  key={rankIdx} 
                                  style={{ fontSize: '0.75rem', background: 'var(--glass-bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.2rem 0.5rem' }}
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
              <div className="dashboard-card">
                <h3 className="dashboard-card-title">Study Utilities</h3>
                <div className="tools-grid">
                  {studyTools.map((t, idx) => (
                    <div className="tool-card" key={idx} onClick={() => alert(`Launching: ${t.title}`)}>
                      <div className="tool-icon">{t.icon}</div>
                      <div className="tool-title">{t.title}</div>
                      <div className="tool-desc">{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dashboardTab === 'settings' && selectedGroupId === null && (
              <div className="dashboard-card">
                <h3 className="dashboard-card-title">Settings</h3>
                <div className="form-group" style={{ maxWidth: '300px' }}>
                  <label className="form-label">Display Name</label>
                  <input type="text" className="form-input" style={{ paddingLeft: '1rem' }} value={user.name} disabled />
                </div>
                <div className="form-group" style={{ maxWidth: '300px' }}>
                  <label className="form-label">Email Address</label>
                  <input type="text" className="form-input" style={{ paddingLeft: '1rem' }} value={user.email} disabled />
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
