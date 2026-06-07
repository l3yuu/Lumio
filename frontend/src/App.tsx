import { useEffect, useState } from 'react'
import { 
  Sparkles, HelpCircle, Layers, UploadCloud
} from 'lucide-react'

import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { MaintenancePage } from './components/ErrorBoundary'

// Import views
import { LandingView } from './views/LandingView'
import { HowItWorksView } from './views/HowItWorksView'
import { ToolsView } from './views/ToolsView'
import { FlashcardsTool } from './views/FlashcardsTool'
import { EssayGraderTool } from './views/EssayGraderTool'
import { CondenserTool } from './views/CondenserTool'
import { PricingView } from './views/PricingView'
import { ContactView } from './views/ContactView'
import { AuthView } from './views/AuthView'
import { DashboardView } from './views/DashboardView'
import { PrivacyView } from './views/PrivacyView'
import { TermsView } from './views/TermsView'
import { DocsView } from './views/DocsView'

// ⚡ Toggle this to true to show maintenance page across the entire site
const MAINTENANCE_MODE = false;

interface Module {
  id: number;
  name: string;
  date: string;
  size: string;
  questionsCount: number;
  questions: QuizQuestion[];
  subject?: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

interface GroupMember {
  name: string;
  email: string;
  online: boolean;
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

interface StudyGroup {
  id: number;
  name: string;
  members: GroupMember[];
  modules: Module[];
  quizSessions: GroupQuizSession[];
}

function App() {
  // Show maintenance page when enabled
  if (MAINTENANCE_MODE) {
    return <MaintenancePage onReload={() => window.location.reload()} />;
  }

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Navigation & Auth State
  const [view, setView] = useState<'landing' | 'auth' | 'dashboard' | 'how-it-works' | 'tools' | 'contact' | 'flashcards' | 'essay-grader' | 'condenser' | 'pricing' | 'privacy' | 'terms' | 'docs'>('landing');
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

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

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

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

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogout = () => {
    setUser(null);
    setView('landing');
  };

  // Add a new module
  const handleAddModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleName) return;

    const mockQuestions: QuizQuestion[] = [
      {
        id: Date.now() + 1,
        question: `Based on your module "${newModuleName}": What is the core mechanism outlined in the uploaded text?`,
        options: ['Optimal efficiency through iteration', 'Random system distribution', 'Linear thermal cooling', 'Static variable constant allocation'],
        correctAnswerIndex: 0
      },
      {
        id: Date.now() + 2,
        question: `According to your document: Which factor is critical to success?`,
        options: ['Manual input updates', 'Automated study quiz generation', 'External reference imports', 'Zero value configuration defaults'],
        correctAnswerIndex: 1
      }
    ];

    const newModule: Module = {
      id: Date.now(),
      name: newModuleName,
      date: 'Just now',
      size: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
      questionsCount: mockQuestions.length,
      questions: mockQuestions
    };

    setModules([newModule, ...modules]);
    setNewModuleName('');
    setNewModuleContent('');
    setIsUploadOpen(false);
  };

  // Create Group Action
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;

    const members: GroupMember[] = [
      { name: newGroupMember || 'Study Partner', email: 'partner@example.com', online: true }
    ];

    const newGroup: StudyGroup = {
      id: Date.now(),
      name: newGroupName,
      members: members,
      modules: [],
      quizSessions: []
    };

    setGroups([newGroup, ...groups]);
    setNewGroupName('');
    setNewGroupMember('');
    setIsGroupModalOpen(false);
  };

  const studyTools = [
    { title: 'Flashcard Generator', desc: 'Auto-generate revision cards from notes.', icon: <Sparkles size={20} /> },
    { title: 'AI Essay Grader', desc: 'Get grading reviews on your practice essays.', icon: <HelpCircle size={20} /> },
    { title: 'Document Condenser', desc: 'Condense large textbooks in seconds.', icon: <Layers size={20} /> }
  ];

  return (
    <div className="app-layout">
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
          setActiveQuizModule={() => {}}
          setSelectedGroupId={() => {}}
        />
      )}

      <main className={view === 'auth' ? "auth-main" : view === 'docs' ? "docs-main-wrapper" : "container"} style={view === 'auth' ? { flex: 1, display: 'flex', flexDirection: 'column' } : { flex: 1, paddingBottom: view === 'docs' ? '0' : '4rem' }}>
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
            setUser={setUser}
          />
        )}

        {view === 'dashboard' && user && (
          <DashboardView 
            user={user}
            modules={modules}
            groups={groups}
            setModules={setModules}
            setGroups={setGroups}
            setIsUploadOpen={setIsUploadOpen}
            setIsGroupModalOpen={setIsGroupModalOpen}
            studyTools={studyTools}
          />
        )}
      </main>

      {/* Add Module Modal */}
      {isUploadOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Upload Study Module</h3>
            
            <form onSubmit={handleAddModule}>
              <div className="form-group">
                <label className="form-label">Module Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. History Midterm Prep" 
                  className="form-input" 
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                  required
                />
              </div>

              <div className="upload-zone" onClick={() => document.getElementById('file-loader')?.click()}>
                <UploadCloud size={32} color="var(--primary)" />
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Choose a file or drag it here</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PDF, TXT, DOCX up to 10MB</span>
                <input type="file" id="file-loader" style={{ display: 'none' }} onChange={() => { if(!newModuleName) setNewModuleName('Uploaded Study Note'); }} />
              </div>

              <div className="form-group">
                <label className="form-label">Paste Text Content (Optional)</label>
                <textarea 
                  placeholder="Paste lecture transcription or syllabus outlines..." 
                  className="form-input" 
                  style={{ padding: '0.75rem 1rem', minHeight: '100px', resize: 'vertical' }}
                  value={newModuleContent}
                  onChange={(e) => setNewModuleContent(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setIsUploadOpen(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Generate Quiz</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {isGroupModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Create Study Group</h3>
            
            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label className="form-label">Group Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Calculus Midterm Prep" 
                  className="form-input" 
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Add Member (Email or Name)</label>
                <input 
                  type="text" 
                  placeholder="e.g. alex@example.com" 
                  className="form-input" 
                  value={newGroupMember}
                  onChange={(e) => setNewGroupMember(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setIsGroupModalOpen(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Group</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {view !== 'auth' && (
        <Footer 
          user={user}
          setView={setView}
        />
      )}
    </div>
  )
}

export default App
