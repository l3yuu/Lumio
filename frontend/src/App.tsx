import { useEffect, useState } from 'react'
import {
  Sparkles, HelpCircle, Layers, UploadCloud, Timer
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

import type { View, AuthTab, DashboardTab, User, Module, StudyGroup, UserResponse, ModuleResponse, QuizQuestionResponse, GroupQuizSessionResponse, GroupQuizRankResponse, StudyGroupResponse } from './types'

const mapUser = (data: UserResponse): User => ({
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
});

const mapModule = (m: ModuleResponse): Module => ({
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
});

const mapGroup = (g: StudyGroupResponse): StudyGroup => ({
  id: g.id,
  name: g.name,
  members: g.members || [],
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

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMember, setNewGroupMember] = useState('');

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

  // Hydrate user and data from backend if token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://127.0.0.1:8000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Invalid token');
        return res.json();
      })
      .then(userData => {
        setUser(mapUser(userData));
        setView('dashboard');
        
        // Fetch modules
        fetch('http://127.0.0.1:8000/api/modules', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setModules(data.map(mapModule)))
        .catch(err => console.error('Error fetching modules:', err));

        // Fetch groups
        fetch('http://127.0.0.1:8000/api/groups', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setGroups(data.map(mapGroup)))
        .catch(err => console.error('Error fetching groups:', err));
      })
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
        setView('landing');
      });
    }
  }, []);

  const handleLoginSuccess = (userData: User, token: string) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setView('dashboard');
    
    // Fetch modules
    fetch('http://127.0.0.1:8000/api/modules', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setModules(data.map(mapModule)))
    .catch(err => console.error('Error fetching modules:', err));

    // Fetch groups
    fetch('http://127.0.0.1:8000/api/groups', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setGroups(data.map(mapGroup)))
    .catch(err => console.error('Error fetching groups:', err));
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
    setUser(null);
    setView('landing');
  };

  // Add a new module
  const handleAddModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleName) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const mockQuestions = [
      {
        question: `Based on your module "${newModuleName}": What is the core mechanism outlined in the uploaded text?`,
        options: ['Optimal efficiency through iteration', 'Random system distribution', 'Linear thermal cooling', 'Static variable constant allocation'],
        correctAnswerIndex: 0
      },
      {
        question: `According to your document: Which factor is critical to success?`,
        options: ['Manual input updates', 'Automated study quiz generation', 'External reference imports', 'Zero value configuration defaults'],
        correctAnswerIndex: 1
      }
    ];

    const payload = {
      name: newModuleName,
      subject: 'General',
      size: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
      questions: mockQuestions
    };

    fetch('http://127.0.0.1:8000/api/modules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to create module');
      return res.json();
    })
    .then(newModule => {
      setModules([mapModule(newModule), ...modules]);
      setNewModuleName('');
      setNewModuleContent('');
      setIsUploadOpen(false);
    })
    .catch(err => {
      console.error(err);
      alert('Error creating module on backend');
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

    fetch('http://127.0.0.1:8000/api/groups', {
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
                  : "max-w-300 mx-auto pt-4 px-4 sm:px-8 pb-16 flex-1 w-full overflow-x-hidden"
          }
        >
          {view === 'landing' && (
            <LandingView
              user={user}
              setView={setView}
              setAuthTab={setAuthTab}
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
            />
          )}
        </main>

        {/* Add Module Modal */}
        {isUploadOpen && (
          <div className="fixed inset-0 bg-[rgba(5,5,5,0.7)] backdrop-blur-sm z-3000 flex items-center justify-center p-4">
            <div className="bg-card border border-line rounded-2xl p-8 max-w-140 w-full shadow-lg">
              <h3 className="text-2xl mb-6">Upload Study Module</h3>

              <form onSubmit={handleAddModule}>
                <div className="flex flex-col gap-2 mb-4">
                  <label className="text-[0.9rem] font-semibold text-ink">Module Name</label>
                  <input
                    type="text"
                    placeholder="e.g. History Midterm Prep"
                    className="w-full py-2 px-3 bg-input border border-line rounded-md text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app"
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    required
                  />
                </div>

                <div className="border-2 border-dashed border-line rounded-lg p-8 text-center cursor-pointer bg-app flex flex-col items-center gap-3 mb-6 hover:border-primary" onClick={() => document.getElementById('file-loader')?.click()}>
                  <UploadCloud size={32} color="var(--primary)" />
                  <span className="font-semibold text-[0.95rem]">Choose a file or drag it here</span>
                  <span className="text-[0.8rem] text-ink-muted">PDF, TXT, DOCX up to 10MB</span>
                  <input type="file" id="file-loader" className="hidden" onChange={() => { if(!newModuleName) setNewModuleName('Uploaded Study Note'); }} />
                </div>

                <div className="flex flex-col gap-2 mb-4">
                  <label className="text-[0.9rem] font-semibold text-ink">Paste Text Content (Optional)</label>
                  <textarea
                    placeholder="Paste lecture transcription or syllabus outlines..."
                    className="w-full py-3 px-4 bg-input border border-line rounded-md text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app min-h-25 resize-y"
                    value={newModuleContent}
                    onChange={(e) => setNewModuleContent(e.target.value)}
                  />
                </div>

                <div className="flex gap-4 justify-end mt-6">
                  <button type="button" onClick={() => setIsUploadOpen(false)} className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-md font-semibold text-sm transition-all duration-200 no-underline cursor-pointer bg-transparent border border-line text-ink hover:bg-input hover:border-line-strong">Cancel</button>
                  <button type="submit" className="inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-md font-semibold text-sm transition-all duration-200 no-underline cursor-pointer bg-primary text-ink-on-primary border border-primary hover:bg-primary-hover hover:border-primary-hover hover:shadow-glow-primary-btn">Generate Quiz</button>
                </div>
              </form>
            </div>
          </div>
        )}

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
