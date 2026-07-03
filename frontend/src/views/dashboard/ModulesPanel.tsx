import React, { useState } from 'react';
import { Plus, Play, Trash2, Zap, RotateCcw, FileText, X, Search, Edit2, Check, MoreVertical, Calendar, ExternalLink, Trophy, Globe, Download, History, Bookmark } from 'lucide-react';
import type { Module, User, ModuleResponse, QuizQuestionResponse, ExamDeadline, QuizAttempt, View } from '../../types';
import { API_BASE_URL } from '../../config';
import { HistoryPanel } from './HistoryPanel';

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
    correctAnswerIndex: q.correct_answer_index,
    explanation: q.explanation,
    hint: q.hint,
    questionType: q.question_type,
    reference: q.reference
  })) : [],
  lastScore: m.last_score,
  difficulty: m.difficulty,
  isPublic: m.is_public || false
});

interface ModulesPanelProps {
  modules: Module[];
  user: User;
  setModules: React.Dispatch<React.SetStateAction<Module[]>>;
  showToast: (type: 'success' | 'error', message: string) => void;
  selectedSubject: string;
  subjects: string[];
  setSelectedSubject: (v: string) => void;
  startQuiz: (module: Module) => void;
  handleDeleteModule: (id: number) => void;
  setIsUploadOpen: (v: boolean) => void;
  moduleScores: { [moduleId: number]: string };
  onFileDropped?: (file: File) => void;
  onCreateFolder?: (name: string) => void;
  onMoveModule?: (moduleId: number, folderName: string) => void;
  onRenameFolder?: (oldName: string, newName: string) => void;
  onDeleteFolder?: (folderName: string) => void;
  onAddExamToCalendar?: (title: string, subject: string, date: string, priority: string) => void;
  exams?: ExamDeadline[];
  handleLinkExamToQuiz?: (examId: number, quizName: string) => void;
  initialViewMode?: 'quizzes' | 'exams' | 'history' | 'public';
  quizAttempts?: QuizAttempt[];
  setView?: (view: View) => void;
}

export const ModulesPanel: React.FC<ModulesPanelProps> = ({
  modules, user, setModules, showToast, selectedSubject, subjects,
  setSelectedSubject, startQuiz, handleDeleteModule, setIsUploadOpen,
  moduleScores, onFileDropped, onCreateFolder, onMoveModule,
  onRenameFolder, onDeleteFolder, onAddExamToCalendar, exams, handleLinkExamToQuiz,
  initialViewMode = 'quizzes', quizAttempts = [], setView,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [openMenuModuleId, setOpenMenuModuleId] = useState<number | null>(null);

  const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>([]);
  const [examName, setExamName] = useState('');
  const [examDifficulty, setExamDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    user.is_premium ? 'medium' : 'easy'
  );
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const [linkToCalendar, setLinkToCalendar] = useState(false);
  const [calendarExamDate, setCalendarExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [calendarExamPriority, setCalendarExamPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [linkMode, setLinkMode] = useState<'create' | 'existing'>('create');
  const [linkedExamId, setLinkedExamId] = useState<number | null>(null);
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [editModuleName, setEditModuleName] = useState('');
  const [viewMode, setViewMode] = useState<'quizzes' | 'exams' | 'history' | 'public'>(initialViewMode);

  const [publicModules, setPublicModules] = useState<Module[]>([]);
  const [publicSearchQuery, setPublicSearchQuery] = useState('');
  const [isFetchingPublic, setIsFetchingPublic] = useState(false);
  const [pdfThumbnails, setPdfThumbnails] = useState<{ [moduleId: number]: string }>({});
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // User modules pagination state
  const [userModulesList, setUserModulesList] = useState<Module[]>([]);
  const userPageRef = React.useRef(0);
  const [hasMoreUser, setHasMoreUser] = useState(true);
  const [isFetchingUser, setIsFetchingUser] = useState(false);

  // Public modules pagination state
  const publicPageRef = React.useRef(0);
  const [hasMorePublic, setHasMorePublic] = useState(true);

  // Cache for source files: module.id -> cached object URL or text content
  const fileCacheRef = React.useRef<{ [moduleId: number]: { blobUrl?: string; sourceContent?: string } }>({});

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadPdfJs = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).pdfjsLib) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
      script.onload = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        resolve(pdfjsLib);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const generatePdfThumbnail = React.useCallback(async (moduleId: number): Promise<string> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Unauthorized');

    const res = await fetch(`${API_BASE_URL}/api/modules/${moduleId}/file`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch file');
    const blob = await res.blob();
    const arrayBuffer = await blob.arrayBuffer();

    const pdfjsLib = await loadPdfJs();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 0.6 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to get 2d context');

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    pdf.destroy();
    return dataUrl;
  }, []);

  React.useEffect(() => {
    loadPdfJs().catch(err => console.error('Failed to pre-load PDF.js:', err));
  }, []);

  React.useEffect(() => {
    if (viewMode === 'public') {
      publicModules.forEach((m) => {
        const isPdf = m.sourceFilename?.toLowerCase().endsWith('.pdf');
        if (isPdf && !pdfThumbnails[m.id]) {
          generatePdfThumbnail(m.id)
            .then((dataUrl) => {
              setPdfThumbnails((prev) => ({ ...prev, [m.id]: dataUrl }));
            })
            .catch((err) => {
              console.error(`Failed to generate thumbnail for module ${m.id}:`, err);
            });
        }
      });
    }
  }, [publicModules, viewMode, pdfThumbnails, generatePdfThumbnail]);

  const fetchPublicModules = React.useCallback((queryStr: string = '', pageNum: number = 0, append: boolean = false) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsFetchingPublic(true);
    const limit = 10;
    const skip = pageNum * limit;
    fetch(`${API_BASE_URL}/api/modules/public?search=${encodeURIComponent(queryStr)}&skip=${skip}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.ok ? res.json() : [])
    .then((data: ModuleResponse[]) => {
      const mapped = data.map(mapModule);
      if (append) {
        setPublicModules(prev => {
          const existingIds = new Set(prev.map(x => x.id));
          const filtered = mapped.filter(x => !existingIds.has(x.id));
          return [...prev, ...filtered];
        });
      } else {
        setPublicModules(mapped);
      }
      setHasMorePublic(data.length === limit);
      setIsFetchingPublic(false);
    })
    .catch(err => {
      console.error('Error fetching public modules:', err);
      setIsFetchingPublic(false);
    });
  }, []);

  const fetchUserModules = React.useCallback((pageNum: number = 0, append: boolean = false, currentSearch: string = searchQuery, currentSubject: string = selectedSubject) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsFetchingUser(true);
    const limit = 10;
    const skip = pageNum * limit;
    
    let url = `${API_BASE_URL}/api/modules?skip=${skip}&limit=${limit}`;
    if (currentSearch) {
      url += `&search=${encodeURIComponent(currentSearch)}`;
    }
    if (currentSubject && currentSubject !== 'All') {
      url += `&subject=${encodeURIComponent(currentSubject)}`;
    }

    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.ok ? res.json() : [])
    .then((data: ModuleResponse[]) => {
      const mapped = data.map(mapModule);
      if (append) {
        setUserModulesList(prev => {
          const existingIds = new Set(prev.map(x => x.id));
          const filtered = mapped.filter(x => !existingIds.has(x.id));
          return [...prev, ...filtered];
        });
      } else {
        setUserModulesList(mapped);
      }
      setHasMoreUser(data.length === limit);
      setIsFetchingUser(false);
    })
    .catch(err => {
      console.error('Error fetching user modules:', err);
      setIsFetchingUser(false);
    });
  }, [searchQuery, selectedSubject]);

  const handleCopyPublicModule = (m: Module) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    fetch(`${API_BASE_URL}/api/modules/${m.id}/copy`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Failed to copy module');
      const newModule = mapModule(data);
      setModules(prev => [newModule, ...prev]);
      showToast('success', `Successfully imported "${m.name}" to your library!`);
    })
    .catch(err => {
      console.error('Error importing module:', err);
      showToast('error', err.message || 'Failed to import module');
    });
  };

  const handleTogglePublic = (m: Module) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const newStatus = !m.isPublic;
    fetch(`${API_BASE_URL}/api/modules/${m.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ is_public: newStatus })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Failed to update module visibility');
      const updated = mapModule(data);
      setModules(prev => prev.map(x => x.id === m.id ? updated : x));
      showToast('success', `Module is now ${newStatus ? 'Public' : 'Private'}`);
    })
    .catch(err => {
      console.error('Error toggling public status:', err);
      showToast('error', err.message || 'Failed to update module visibility');
    });
  };

  // Sync state during render if initialViewMode changes to avoid useEffect state cascades
  const [prevInitialViewMode, setPrevInitialViewMode] = useState(initialViewMode);
  if (initialViewMode !== prevInitialViewMode) {
    setPrevInitialViewMode(initialViewMode);
    setViewMode(initialViewMode);
  }

  // Trigger fetches and reset page when viewMode changes
  React.useEffect(() => {
    if (viewMode === 'public') {
      publicPageRef.current = 0;
      fetchPublicModules(publicSearchQuery, 0, false);
    } else {
      userPageRef.current = 0;
      fetchUserModules(0, false, searchQuery, selectedSubject);
    }
  }, [viewMode, fetchUserModules, fetchPublicModules]);

  // Reset/fetch user modules when search or subject filters change
  React.useEffect(() => {
    if (viewMode !== 'public') {
      userPageRef.current = 0;
      fetchUserModules(0, false, searchQuery, selectedSubject);
    }
  }, [searchQuery, selectedSubject, viewMode]);

  // Reset/fetch public modules when publicSearchQuery changes
  React.useEffect(() => {
    if (viewMode === 'public') {
      publicPageRef.current = 0;
      fetchPublicModules(publicSearchQuery, 0, false);
    }
  }, [publicSearchQuery, viewMode]);

  // Sync edits/CRUD actions from parent modules state into paginated local state
  React.useEffect(() => {
    setUserModulesList(prev => {
      const parentMap = new Map(modules.map(m => [m.id, m]));
      
      const updated = prev
        .filter(m => parentMap.has(m.id))
        .map(m => parentMap.get(m.id)!);
        
      const existingIds = new Set(prev.map(m => m.id));
      const newlyAdded = modules.filter(m => !existingIds.has(m.id));
      
      if (newlyAdded.length > 0) {
        return [...newlyAdded, ...updated];
      }
      return updated;
    });
  }, [modules]);

  // Scroll event listener for infinite scrolling
  React.useEffect(() => {
    const handleScroll = () => {
      const threshold = 150;
      const totalHeight = document.documentElement.scrollHeight;
      const scrollPosition = window.innerHeight + window.scrollY;
      
      if (totalHeight - scrollPosition <= threshold) {
        if (viewMode === 'public') {
          if (hasMorePublic && !isFetchingPublic) {
            publicPageRef.current += 1;
            fetchPublicModules(publicSearchQuery, publicPageRef.current, true);
          }
        } else if (viewMode === 'quizzes' || viewMode === 'exams') {
          if (hasMoreUser && !isFetchingUser) {
            userPageRef.current += 1;
            fetchUserModules(userPageRef.current, true, searchQuery, selectedSubject);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [viewMode, hasMorePublic, isFetchingPublic, publicSearchQuery, hasMoreUser, isFetchingUser, searchQuery, selectedSubject, fetchUserModules, fetchPublicModules]);

  // Daily exam generation limit tracking
  const dailyExamLimit = user.is_premium ? 5 : 1;
  const getDailyExamKey = () => {
    const today = new Date().toISOString().split('T')[0];
    return `lumio_exam_gen_${today}`;
  };
  const getDailyExamCount = (): number => {
    const key = getDailyExamKey();
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored, 10) || 0 : 0;
  };
  const dailyExamCount = getDailyExamCount();
  const dailyExamRemaining = Math.max(0, dailyExamLimit - dailyExamCount);


  const toggleModuleSelection = (id: number) => {
    const mod = modules.find(m => m.id === id);
    if (mod && (mod.subject === 'Consolidated Exam' || (mod.questionsCount >= 50 && !mod.hasSourceFile))) return;
    setSelectedModuleIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleGenerateExam = async () => {
    if (selectedModuleIds.length < 2) {
      showToast('error', 'Please select at least 2 modules to generate an exam.');
      return;
    }

    // Check daily generation limit
    if (dailyExamRemaining <= 0) {
      showToast('error', `Daily exam generation limit reached. ${user.is_premium ? 'Pro' : 'Free'} users can generate ${dailyExamLimit} exam(s) per day.`);
      return;
    }

    setIsGeneratingExam(true);
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('error', 'You must be logged in to generate an exam.');
      setIsGeneratingExam(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/modules/generate-consolidated-exam`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          module_ids: selectedModuleIds,
          name: examName.trim() || undefined,
          difficulty: examDifficulty
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate consolidated exam');
      }

      const newModuleData = await response.json();
      const mapped = mapModule(newModuleData);

      setModules(prev => [...prev, mapped]);

      if (linkToCalendar) {
        if (linkMode === 'existing' && linkedExamId && handleLinkExamToQuiz) {
          const quizName = examName.trim() || mapped.name;
          handleLinkExamToQuiz(linkedExamId, quizName);
          showToast('success', 'Linked to exam on calendar!');
        } else if (linkMode === 'create' && onAddExamToCalendar) {
          const examTitle = (examName.trim() || mapped.name) + ' (Generated Exam)';
          onAddExamToCalendar(examTitle, 'Consolidated Exam', calendarExamDate, calendarExamPriority);
        }
        setLinkToCalendar(false);
        setLinkedExamId(null);
      }

      setSelectedModuleIds([]);
      setExamName('');

      // Update daily generation count
      const key = getDailyExamKey();
      const newCount = dailyExamCount + 1;
      localStorage.setItem(key, newCount.toString());

      showToast('success', '50-question consolidated exam generated successfully!');
    } catch (err: unknown) {
      console.error('Error generating consolidated exam:', err);
      showToast('error', (err instanceof Error ? err.message : null) || 'Failed to generate consolidated exam');
    } finally {
      setIsGeneratingExam(false);
    }
  };

  const handleRenameModule = (moduleId: number, newName: string) => {
    if (!newName.trim() || newName.trim() === modules.find(m => m.id === moduleId)?.name) {
      setEditingModuleId(null);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setModules(prev => prev.map(m => m.id === moduleId ? { ...m, name: newName.trim() } : m));
      setEditingModuleId(null);
      return;
    }
    fetch(`${API_BASE_URL}/api/modules/${moduleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: newName.trim() })
    })
    .then(async res => {
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail || 'Failed to rename module');
      setModules(prev => prev.map(m => m.id === moduleId ? { ...m, name: newName.trim() } : m));
      setEditingModuleId(null);
      showToast('success', 'Module renamed!');
    })
    .catch(err => {
      console.error('Error renaming module:', err);
      showToast('error', 'Failed to rename module');
      setEditingModuleId(null);
    });
  };

  React.useEffect(() => {
    const handleCloseMenu = () => setOpenMenuModuleId(null);
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, []);

  const isExam = (m: Module) =>
    m.subject === 'Consolidated Exam' || (m.questionsCount >= 50 && !m.hasSourceFile);

  const displayedModules = userModulesList
    .filter(m => viewMode === 'quizzes' ? !isExam(m) : isExam(m));
  const [activeScoreModule, setActiveScoreModule] = useState<Module | null>(null);

  const handleOpenSourceInNewTab = (m: Module) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const cached = fileCacheRef.current[m.id];

    // If cached PDF blob URL exists
    if (m.sourceFilename?.toLowerCase().endsWith('.pdf') && cached?.blobUrl) {
      window.open(cached.blobUrl, '_blank');
      return;
    }

    // If cached text/json source exists
    if (!m.sourceFilename?.toLowerCase().endsWith('.pdf') && cached?.sourceContent) {
      const newTab = window.open('', '_blank');
      if (newTab) {
        newTab.document.write(`
          <html>
            <head>
              <title>${m.name} - Source File</title>
              <style>
                body {
                  background: #181818;
                  color: #e0e0e0;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                  margin: 0;
                  padding: 24px;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  min-height: 100vh;
                }
                .container {
                  width: 100%;
                  max-width: 900px;
                  background: #202020;
                  border: 1px solid #333;
                  border-radius: 12px;
                  padding: 40px;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                  box-sizing: border-box;
                }
                h1 {
                  font-size: 24px;
                  margin-top: 0;
                  margin-bottom: 8px;
                  color: #fff;
                }
                .filename {
                  font-size: 14px;
                  color: #888;
                  margin-bottom: 24px;
                }
                pre {
                  white-space: pre-wrap;
                  word-wrap: break-word;
                  font-size: 14px;
                  line-height: 1.6;
                  margin: 0;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>${m.name}</h1>
                <div class="filename">${m.sourceFilename || ''}</div>
                <pre>${cached.sourceContent}</pre>
              </div>
            </body>
          </html>
        `);
        newTab.document.close();
      }
      return;
    }

    const newTab = window.open('', '_blank');
    if (newTab) {
      newTab.document.write(`
        <html>
          <head>
            <title>${m.name} - Source File</title>
            <style>
              body {
                background: #181818;
                color: #e0e0e0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 24px;
                display: flex;
                flex-direction: column;
                align-items: center;
                min-height: 100vh;
              }
              .container {
                width: 100%;
                max-width: 900px;
                background: #202020;
                border: 1px solid #333;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                box-sizing: border-box;
              }
              h1 {
                font-size: 24px;
                margin-top: 0;
                margin-bottom: 8px;
                color: #fff;
              }
              .filename {
                font-size: 14px;
                color: #888;
                margin-bottom: 24px;
              }
              pre {
                white-space: pre-wrap;
                word-wrap: break-word;
                font-size: 14px;
                line-height: 1.6;
                margin: 0;
              }
              .loading {
                font-size: 16px;
                color: #888;
                margin-top: 40vh;
              }
            </style>
          </head>
          <body>
            <div id="loader" class="loading">Loading source file content...</div>
            <div id="content" class="container" style="display: none;">
              <h1 id="title">${m.name}</h1>
              <div class="filename">${m.sourceFilename || ''}</div>
              <pre id="pre"></pre>
            </div>
          </body>
        </html>
      `);
      newTab.document.close();
    }

    if (m.sourceFilename?.toLowerCase().endsWith('.pdf')) {
      fetch(`${API_BASE_URL}/api/modules/${m.id}/file`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('No file');
        return res.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        fileCacheRef.current[m.id] = { blobUrl: url };
        if (newTab) {
          newTab.location.href = url;
        }
      })
      .catch(() => {
        fetch(`${API_BASE_URL}/api/modules/${m.id}/source`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && newTab) {
            fileCacheRef.current[m.id] = { sourceContent: data.source_content || '' };
            const loader = newTab.document.getElementById('loader');
            const content = newTab.document.getElementById('content');
            const pre = newTab.document.getElementById('pre');
            if (loader) loader.style.display = 'none';
            if (content) content.style.display = 'block';
            if (pre) pre.textContent = data.source_content || '';
          }
        })
        .catch(() => {
          if (newTab) newTab.close();
        });
      });
    } else {
      fetch(`${API_BASE_URL}/api/modules/${m.id}/source`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && newTab) {
          fileCacheRef.current[m.id] = { sourceContent: data.source_content || '' };
          const loader = newTab.document.getElementById('loader');
          const content = newTab.document.getElementById('content');
          const pre = newTab.document.getElementById('pre');
          if (loader) loader.style.display = 'none';
          if (content) content.style.display = 'block';
          if (pre) pre.textContent = data.source_content || '';
        }
      })
      .catch(() => {
        if (newTab) newTab.close();
      });
    }
  };

  return (
    <div className="bg-card border border-line rounded-xl p-5 max-md:p-4">
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap max-md:flex-col max-md:items-stretch max-md:gap-3">
        <h3 className="text-[1.15rem] flex items-center gap-2 m-0 shrink-0">
          {viewMode === 'public' ? (
            'Public Explorer'
          ) : viewMode === 'history' ? (
            'Quiz History'
          ) : (
            <>
              My Study Modules {modules.length > 0 && <span className="text-[0.85rem] text-ink-muted font-normal">({modules.length})</span>}
            </>
          )}
        </h3>
        {viewMode !== 'public' && viewMode !== 'history' && (
          <>
            <div className="flex items-center gap-3 flex-1 max-w-[320px] max-md:max-w-none md:ml-auto">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-2 pl-9 pr-3 bg-input border border-line rounded-lg text-ink text-xs transition-all duration-150 outline-none focus:border-primary focus:bg-app"
                />
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
              </div>
            </div>
            <button onClick={() => setIsUploadOpen(true)} className="btn btn-primary shrink-0 max-md:w-full max-md:justify-center">
              <Plus size={18} /> Add Module
            </button>
          </>
        )}
      </div>

      {viewMode !== 'public' && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setViewMode('quizzes')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'quizzes'
                ? 'bg-primary text-ink-on-primary shadow-sm'
                : 'bg-app border border-line text-ink-muted hover:text-ink hover:border-primary/50'
            }`}
          >
            <Zap size={13} /> Quizzes
          </button>
          <button
            onClick={() => setViewMode('exams')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'exams'
                ? 'bg-primary text-ink-on-primary shadow-sm'
                : 'bg-app border border-line text-ink-muted hover:text-ink hover:border-primary/50'
            }`}
          >
            <Calendar size={13} /> Exams
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'history'
                ? 'bg-primary text-ink-on-primary shadow-sm'
                : 'bg-app border border-line text-ink-muted hover:text-ink hover:border-primary/50'
            }`}
          >
            <History size={13} /> Quiz History
          </button>
        </div>
      )}

      {viewMode !== 'public' && viewMode !== 'history' && (
        <div className="flex gap-2 mb-6 flex-wrap items-center">
          {subjects.map((subj) => {
            const isActive = selectedSubject === subj;
            const isSystem = subj === 'All' || subj === 'General';
            const isEditing = editingFolder === subj;

            return (
              <div
                key={subj}
                className={`px-3.5 py-1.5 text-xs rounded-full border transition-all duration-200 font-bold flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary text-ink-on-primary border-primary'
                    : 'bg-glass border-line text-ink-muted hover:text-ink hover:bg-glass-strong'
                }`}
              >
                {isEditing ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (editingFolderName.trim() && onRenameFolder && editingFolderName.trim() !== subj) {
                        onRenameFolder(subj, editingFolderName.trim());
                      }
                      setEditingFolder(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1"
                  >
                    <input
                      type="text"
                      value={editingFolderName}
                      onChange={(e) => setEditingFolderName(e.target.value)}
                      className="text-xs bg-transparent text-ink-on-primary font-bold outline-none max-w-22.5 border-b border-ink-on-primary/30 py-0 px-0"
                      autoFocus
                    />
                    <button type="submit" className="p-0.5 text-ink-on-primary hover:scale-110 transition-transform cursor-pointer">
                      <Check size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingFolder(null);
                      }}
                      className="p-0.5 text-ink-on-primary hover:scale-110 transition-transform cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </form>
                ) : (
                  <>
                    <span
                      onClick={() => setSelectedSubject(subj)}
                      className="cursor-pointer select-none"
                    >
                      {subj === 'All' ? 'All Folders' : subj}
                    </span>
                    {!isSystem && isActive && (
                      <div className="flex items-center gap-0.5 ml-1 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFolder(subj);
                            setEditingFolderName(subj);
                          }}
                          className="p-0.5 rounded-full hover:bg-black/15 text-ink-on-primary cursor-pointer"
                          title="Rename folder"
                        >
                          <Edit2 size={10} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete the folder "${subj}"? Any modules inside will be moved to the General folder.`)) {
                              if (onDeleteFolder) onDeleteFolder(subj);
                            }
                          }}
                          className="p-0.5 rounded-full hover:bg-black/15 text-ink-on-primary cursor-pointer"
                          title="Delete folder"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {isCreatingFolder ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newFolderName.trim() && onCreateFolder) {
                  onCreateFolder(newFolderName.trim());
                  setNewFolderName('');
                  setIsCreatingFolder(false);
                }
              }}
              className="flex items-center gap-1.5 bg-input border border-line rounded-full pl-3 pr-1 py-0.5"
            >
              <input
                type="text"
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="text-xs bg-transparent text-ink outline-none max-w-30 py-1 border-0"
                autoFocus
              />
              <button type="submit" className="px-2.5 py-1 bg-primary text-ink-on-primary text-[10px] rounded-full font-bold cursor-pointer hover:bg-primary-hover transition-colors">
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }}
                className="p-1 text-ink-muted hover:text-ink cursor-pointer rounded-full hover:bg-glass"
              >
                <X size={12} />
              </button>
            </form>
          ) : (
            onCreateFolder && (
              <button
                onClick={() => setIsCreatingFolder(true)}
                className="px-3.5 py-1.5 text-xs rounded-full border border-dashed border-line text-ink-muted hover:text-ink hover:border-primary hover:bg-glass transition-all duration-200 cursor-pointer font-medium flex items-center gap-1"
              >
                <Plus size={12} /> Add Folder
              </button>
            )
          )}
        </div>
      )}

      {viewMode === 'public' ? (
        <div className="flex flex-col gap-5 mt-4">
          <div className="flex flex-col gap-2 bg-app/20 border border-line rounded-xl p-4">
            <div className="relative w-full max-w-[400px]">
              <input
                type="text"
                placeholder="Search public modules..."
                value={publicSearchQuery}
                onChange={(e) => setPublicSearchQuery(e.target.value)}
                className="w-full py-2 pl-9 pr-3 bg-input border border-line rounded-lg text-ink text-xs transition-all duration-150 outline-none focus:border-primary focus:bg-app"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
            </div>
            <p className="text-xs text-ink-muted m-0">Explore and practice public study modules created by other students. Click import to add them to your collection.</p>
          </div>

          {isFetchingPublic ? (
            <div className="text-center p-8 text-ink-muted">
              <span className="inline-block animate-pulse">Loading public modules...</span>
            </div>
          ) : publicModules.length === 0 ? (
            <div className="text-center p-12 text-ink-muted bg-app/20 border border-dashed border-line rounded-xl">
              {publicSearchQuery ? 'No public modules match your search.' : 'No public modules available right now.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
              {publicModules.map((m) => {
                const isOwnModule = modules.some(own => own.id === m.id);
                const isDoc = m.hasSourceFile || m.sourceFilename;
                
                // Deterministic gradient styles for non-doc covers
                const gradients = [
                  'from-purple-600/90 to-indigo-800/90',
                  'from-orange-500/90 to-red-700/90',
                  'from-teal-500/90 to-cyan-700/90',
                  'from-pink-500/90 to-rose-700/90'
                ];
                const gradientClass = gradients[m.id % gradients.length];

                return (
                  <div
                    key={`public-${m.id}`}
                    className="flex flex-col bg-card border border-line rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group relative"
                    onClick={() => {
                      if (!user.is_premium) {
                        setIsUpgradeModalOpen(true);
                      } else {
                        startQuiz(m);
                      }
                    }}
                  >
                    {/* Cover Preview Area */}
                    <div className="relative aspect-[4/3] w-full bg-app overflow-hidden border-b border-line flex items-center justify-center select-none">
                      {pdfThumbnails[m.id] ? (
                        <img 
                          src={pdfThumbnails[m.id]} 
                          alt={m.name} 
                          className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : isDoc ? (
                        /* Mock Document page preview */
                        <div className="w-[70%] h-[85%] bg-white rounded shadow-lg border border-gray-200/50 p-3.5 flex flex-col justify-between text-left relative transform rotate-1 group-hover:rotate-0 transition-transform duration-200">
                          <div className="flex flex-col gap-1.5">
                            <div className="text-[10px] text-gray-800 font-extrabold line-clamp-3 leading-snug font-serif mb-1">
                              {m.name}
                            </div>
                            <div className="w-full h-1 bg-gray-100 rounded" />
                            <div className="w-4/5 h-1 bg-gray-100 rounded" />
                            <div className="w-11/12 h-1 bg-gray-100 rounded" />
                          </div>
                          <div className="flex justify-between items-center mt-auto">
                            <span className="text-[7px] text-gray-400 font-mono uppercase tracking-widest">LUMIO STUDY</span>
                            <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                              <FileText size={8} className="text-primary" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Vibrant Gradient Cover preview */
                        <div className={`w-full h-full bg-gradient-to-br ${gradientClass} flex flex-col p-4 justify-between text-left relative overflow-hidden`}>
                          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl transform translate-x-4 -translate-y-4" />
                          <div className="text-white font-black text-sm line-clamp-4 leading-snug font-sans tracking-wide">
                            {m.name}
                          </div>
                          <div className="text-[8px] text-white/60 font-medium tracking-wider uppercase mt-auto">
                            Interactive Quiz
                          </div>
                        </div>
                      )}

                      {/* Floating bookmark badge on top right */}
                      <div 
                        className="absolute top-2.5 right-2.5 p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full text-white/90 hover:text-white transition-colors z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user.is_premium) {
                            setIsUpgradeModalOpen(true);
                            return;
                          }
                          if (!isOwnModule) {
                            handleCopyPublicModule(m);
                          }
                        }}
                        title={isOwnModule ? "You own this module" : "Save/Import this module"}
                      >
                        <Bookmark size={12} fill={isOwnModule ? "currentColor" : "none"} />
                      </div>

                      {/* Floating type badges on top left */}
                      <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 z-10">
                        <span className="text-[8px] bg-black/55 text-white font-extrabold px-1.5 py-0.5 rounded backdrop-blur-xs uppercase border border-white/10">
                          {isDoc ? 'PDF' : 'Quiz'}
                        </span>
                        {m.subject && (
                          <span className="text-[8px] bg-primary/80 text-white font-extrabold px-1.5 py-0.5 rounded backdrop-blur-xs uppercase truncate max-w-20">
                            {m.subject}
                          </span>
                        )}
                      </div>

                      {/* Hover Actions Overlay */}
                      <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20">
                        {isDoc && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!user.is_premium) {
                                setIsUpgradeModalOpen(true);
                              } else {
                                handleOpenSourceInNewTab(m);
                              }
                            }}
                            className="w-[80%] btn btn-outline flex items-center justify-center gap-1.5 py-2 text-xs cursor-pointer text-white border-white/30 hover:border-white hover:bg-white/10"
                          >
                            <ExternalLink size={13} /> View PDF Source
                          </button>
                        )}
                        {isOwnModule ? (
                          <span className="w-[80%] text-[10px] bg-primary/20 text-primary-light border border-primary/30 py-2 rounded-lg font-bold text-center">
                            Your Module
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!user.is_premium) {
                                setIsUpgradeModalOpen(true);
                              } else {
                                handleCopyPublicModule(m);
                              }
                            }}
                            className="w-[80%] btn btn-outline flex items-center justify-center gap-1.5 py-2 text-xs cursor-pointer text-white border-white/30 hover:border-white hover:bg-white/10"
                          >
                            <Download size={13} /> Import Module
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!user.is_premium) {
                              setIsUpgradeModalOpen(true);
                            } else {
                              startQuiz(m);
                            }
                          }}
                          className="w-[80%] btn btn-primary flex items-center justify-center gap-1.5 py-2 text-xs cursor-pointer"
                        >
                          <Play size={13} fill="currentColor" /> Practice Quiz
                        </button>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex flex-col flex-1 gap-1.5 text-left">
                      <h4 className="font-bold text-sm text-ink line-clamp-1 group-hover:text-primary transition-colors m-0">
                        {m.name}
                      </h4>
                      <p className="text-[11px] text-ink-muted line-clamp-2 leading-relaxed m-0">
                        {isDoc ? 'A complete reviewer compiled from the uploaded PDF document source.' : 'Interactive concept practice and mock test module generated using AI.'}
                      </p>
                      
                      {/* Glow Match pill footer */}
                      <div className="mt-auto flex items-center justify-between border-t border-line/40 pt-2.5">
                        <span className="text-[9px] bg-amber-500/10 text-amber-500 font-black tracking-wider uppercase px-2 py-0.5 rounded border border-amber-500/20 shadow-sm animate-pulse">
                          PRO 100% MATCH
                        </span>
                        <span className="text-[10px] text-ink-muted font-medium">
                          {m.questionsCount} Questions
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {isFetchingPublic && publicModules.length > 0 && (
            <div className="text-center py-4 text-xs text-ink-muted animate-pulse">
              Loading more public modules...
            </div>
          )}
        </div>
      ) : viewMode === 'history' ? (
        <HistoryPanel attempts={quizAttempts} />
      ) : (
        <>
          {/* Quiz Dropzone */}
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              console.log('Drag enter: module dragged over dropzone');
              setIsDragOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              console.log('Drag leave: module dragged out of dropzone');
              setIsDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              try {
                // Check if files were dropped from local machine
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const file = e.dataTransfer.files[0];
                  console.log('File dropped in Instant Quiz Dropzone:', file.name);
                  if (onFileDropped) {
                    onFileDropped(file);
                  }
                  return;
                }

                const rawData = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text');
                console.log('Drop event triggered. Raw data retrieved:', rawData);
                if (rawData) {
                  const id = parseInt(rawData, 10);
                  console.log('Parsed module ID from drop:', id);
                  const module = modules.find(x => x.id === id);
                  console.log('Found matching module in list:', module);
                  if (module) {
                    console.log('Initiating quiz for module:', module.name);
                    startQuiz(module);
                  } else {
                    console.warn('Could not find module matching ID:', id);
                  }
                } else {
                  console.warn('Drop event did not contain valid dataTransfer text data');
                }
              } catch (err) {
                console.error('Error handling dropped module:', err);
              }
            }}
            className={`border-2 border-dashed rounded-xl p-6 max-md:p-4 mb-6 text-center transition-all duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer select-none ${
              isDragOver
                ? 'border-primary bg-primary-soft/30 scale-[1.01] shadow-glow-primary-soft'
                : 'border-line bg-app/40 hover:bg-app/60 hover:border-primary/40'
            }`}
          >
            <div className={`p-2.5 rounded-lg w-fit transition-all duration-300 pointer-events-none ${isDragOver ? 'bg-primary/20 text-primary animate-bounce' : 'bg-primary-soft text-primary'}`}>
              <Zap size={22} fill="currentColor" />
            </div>
            <div className="font-bold text-sm text-ink pointer-events-none">Instant Quiz Dropzone</div>
            <div className="text-xs text-ink-muted pointer-events-none">Drag & drop any module card below here to launch its practice quiz!</div>
          </div>

          <div className="flex flex-col gap-3">
            {displayedModules.length === 0 ? (
              <div className="text-center p-8 text-ink-muted">
                {searchQuery ? 'No modules match your search.' : `No modules found in folder "${selectedSubject}".`}
              </div>
            ) : (
              displayedModules.map((m) => {
                const moduleScore = moduleScores[m.id];
                const isSelected = selectedModuleIds.includes(m.id);
                return (
                  <div
                    draggable
                    onDragStart={(e) => {
                      console.log('Drag start: user started dragging module:', m.name, 'with ID:', m.id);
                      e.dataTransfer.setData('text/plain', m.id.toString());
                      e.dataTransfer.setData('text', m.id.toString());
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    onClick={() => {
                      if (isExam(m)) {
                        startQuiz(m);
                      } else {
                        setActiveScoreModule(m);
                      }
                    }}
                    className={`flex max-md:flex-col max-md:items-stretch max-md:gap-3 md:justify-between md:items-center bg-app border rounded-lg p-4 max-md:p-3.5 md:px-5 cursor-pointer md:hover:scale-[1.005] transition-all duration-200 select-none relative ${
                      openMenuModuleId === m.id ? 'z-30 shadow-lg' : 'z-0'
                    } ${isSelected ? 'border-primary bg-primary-soft/10' : 'border-line hover:border-primary/50'}`}
                    key={m.id}
                  >
                    <div className="flex items-center min-w-0 flex-1 gap-3">
                      {!isExam(m) && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleModuleSelection(m.id);
                          }}
                          className="flex items-center justify-center p-1 rounded hover:bg-glass shrink-0"
                          title={isSelected ? "Deselect module" : "Select module"}
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-primary border-primary text-ink-on-primary'
                              : 'border-line text-transparent hover:border-primary'
                          }`}>
                            <Check size={12} strokeWidth={3} />
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5 pointer-events-none min-w-0 flex-1">
                        {editingModuleId === m.id ? (
                          <input
                            type="text"
                            value={editModuleName}
                            onChange={(e) => setEditModuleName(e.target.value)}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === 'Enter') handleRenameModule(m.id, editModuleName);
                              if (e.key === 'Escape') setEditingModuleId(null);
                            }}
                            onBlur={() => handleRenameModule(m.id, editModuleName)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold text-base max-md:text-[0.95rem] text-left w-full bg-input border border-primary rounded-md px-2 py-1 text-ink outline-none pointer-events-auto"
                          />
                        ) : (
                          <span className="font-bold text-base max-md:text-[0.95rem] text-left wrap-break-word leading-snug flex items-center gap-1.5">
                            {(m.hasSourceFile || m.sourceFilename) && <FileText size={16} className="text-primary shrink-0" />}
                            {m.name}
                          </span>
                        )}
                        <div className="text-[0.8rem] max-md:text-[0.75rem] text-ink-muted flex items-center gap-x-4 gap-y-1.5 flex-wrap">
                          <span>Date: {m.date}</span>
                          <span>Size: {m.size}</span>
                          <span>Questions: {m.questionsCount}</span>
                          {selectedSubject === 'All' && m.subject && (
                            <span className="flex items-center gap-1 bg-glass border border-line text-ink-muted text-[0.7rem] font-bold px-2 py-0.5 rounded">
                              Folder: {m.subject}
                            </span>
                          )}
                          {m.difficulty && (
                            <span className={`flex items-center gap-1 text-[0.7rem] font-bold px-2 py-0.5 rounded border capitalize ${
                              m.difficulty === 'easy' ? 'bg-primary-soft text-primary border-primary-line' :
                              m.difficulty === 'hard' ? 'bg-danger-soft text-danger border-danger-line' :
                              'bg-warning-soft text-warning border-warning-line'
                            }`}>
                              {m.difficulty}
                            </span>
                          )}
                          {m.isPublic !== undefined && (
                            <span className={`flex items-center gap-1 text-[0.7rem] font-bold px-2 py-0.5 rounded border capitalize ${
                              m.isPublic
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                : 'bg-glass border-line text-ink-muted'
                            }`}>
                              <Globe size={11} /> {m.isPublic ? 'Public' : 'Private'}
                            </span>
                          )}
                          {moduleScore && (
                            <span className="flex items-center gap-1 bg-primary-soft text-primary text-[0.75rem] font-bold px-2 py-0.5 rounded border border-primary-line">
                              Last Score: {moduleScore}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2.5 items-center shrink-0 max-md:w-full max-md:pt-0.5">
                      {(m.hasSourceFile || m.sourceFilename) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSourceInNewTab(m);
                          }}
                          className="btn btn-outline flex items-center gap-1.5 py-2 px-3 hover:border-primary transition-all text-xs"
                          title="View source file in a new tab"
                        >
                          <ExternalLink size={13} /> View File
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startQuiz(m);
                        }}
                        className="btn btn-primary max-md:flex-1 max-md:justify-center max-md:py-2.5"
                      >
                        {isExam(m) ? (
                          <>
                            <Zap size={14} fill="currentColor" /> Start Exam
                          </>
                        ) : moduleScore ? (
                          <>
                            <RotateCcw size={14} /> Retake Quiz
                          </>
                        ) : (
                          <>
                            <Play size={14} fill="currentColor" /> Practice Quiz
                          </>
                        )}
                      </button>

                      <div className="relative shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuModuleId(openMenuModuleId === m.id ? null : m.id);
                          }}
                          className="btn btn-outline p-2 max-md:p-2.5 bg-transparent border-line text-ink-muted hover:text-ink hover:bg-glass"
                          title="More Options"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {openMenuModuleId === m.id && (
                          <div
                            className="absolute right-0 top-full mt-2 w-48 bg-card border border-line rounded-lg shadow-lg py-1.5 z-20 transition-all duration-150 ease-out"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {onMoveModule && !isExam(m) && (
                              <div className="px-3 py-2 border-b border-line">
                                <label className="block text-[10px] text-ink-muted uppercase font-extrabold mb-1">Move to Folder</label>
                                <select
                                  value={m.subject || 'General'}
                                  onChange={(e) => {
                                    onMoveModule(m.id, e.target.value);
                                    setOpenMenuModuleId(null);
                                  }}
                                  className="w-full bg-input border border-line text-ink text-xs rounded px-2.5 py-1.5 outline-none cursor-pointer focus:border-primary transition-colors"
                                >
                                  {subjects.filter(s => s !== 'All').map(subj => (
                                    <option key={subj} value={subj} className="bg-card text-ink">{subj}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {(m.hasSourceFile || m.sourceFilename) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenSourceInNewTab(m);
                                  setOpenMenuModuleId(null);
                                }}
                                className="w-full text-left px-3.5 py-2.5 text-xs text-ink hover:bg-glass transition-colors font-bold flex items-center gap-2 cursor-pointer"
                              >
                                <ExternalLink size={12} /> View Source File
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePublic(m);
                                setOpenMenuModuleId(null);
                              }}
                              className="w-full text-left px-3.5 py-2.5 text-xs text-ink hover:bg-glass transition-colors font-bold flex items-center gap-2 cursor-pointer"
                            >
                              <Globe size={12} /> {m.isPublic ? 'Make Private' : 'Make Public'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingModuleId(m.id);
                                setEditModuleName(m.name);
                                setOpenMenuModuleId(null);
                              }}
                              className="w-full text-left px-3.5 py-2.5 text-xs text-ink hover:bg-glass transition-colors font-bold flex items-center gap-2 cursor-pointer"
                            >
                              <Edit2 size={12} /> Rename
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteModule(m.id);
                                setOpenMenuModuleId(null);
                              }}
                              className="w-full text-left px-3.5 py-2.5 text-xs text-danger hover:bg-danger-soft transition-colors font-bold flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 size={12} /> Delete Module
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {isFetchingUser && userModulesList.length > 0 && (
              <div className="text-center py-4 text-xs text-ink-muted animate-pulse">
                Loading more study modules...
              </div>
            )}
          </div>
        </>
      )}

      {/* Module Score Modal */}
      {activeScoreModule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-3000 flex items-center justify-center p-4">
          <div className="bg-card border border-line rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 p-6 text-center">
            <button
              onClick={() => setActiveScoreModule(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg bg-transparent border-0 text-ink-muted hover:text-ink hover:bg-glass transition-colors cursor-pointer"
              title="Close"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center mt-2">
              <div className="bg-primary-soft text-primary p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <Trophy size={28} />
              </div>
              
              <h3 className="text-xl font-bold mb-1.5 text-ink">{activeScoreModule.name}</h3>
              <p className="text-xs text-ink-muted mb-6">Quiz Results & Diagnostics</p>

              {moduleScores[activeScoreModule.id] ? (
                (() => {
                  const scoreVal = moduleScores[activeScoreModule.id]; // e.g. "8/10"
                  const [correct, total] = scoreVal.split('/').map(Number);
                  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
                  
                  let rating = "Review and try again!";
                  let ratingColor = "text-danger";
                  if (percentage >= 85) {
                    rating = "Outstanding Mastery!";
                    ratingColor = "text-primary";
                  } else if (percentage >= 70) {
                    rating = "Great Job!";
                    ratingColor = "text-accent-cyan";
                  } else if (percentage >= 50) {
                    rating = "Good Effort!";
                    ratingColor = "text-warning";
                  }

                  return (
                    <>
                      {/* Big Score Circle */}
                      <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="54"
                            stroke="var(--border)"
                            strokeWidth="8"
                            fill="transparent"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="54"
                            stroke="var(--color-primary)"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={339.292}
                            strokeDashoffset={339.292 - (339.292 * percentage) / 100}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-3xl font-black text-ink">{percentage}%</span>
                          <span className="text-xs text-ink-muted font-bold mt-0.5">{correct} / {total} Correct</span>
                        </div>
                      </div>

                      <div className={`text-base font-bold mb-6 ${ratingColor}`}>
                        {rating}
                      </div>
                    </>
                  );
                })()
              ) : (
                <div className="bg-app border border-line rounded-xl p-6 mb-6 w-full text-center">
                  <p className="text-sm text-ink-muted m-0">No score recorded yet. Complete the practice quiz to track your progress and see performance insights.</p>
                </div>
              )}

              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setActiveScoreModule(null)}
                  className="btn btn-outline flex-1 py-2 h-10"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const m = activeScoreModule;
                    setActiveScoreModule(null);
                    startQuiz(m);
                  }}
                  className="btn btn-primary flex-1 py-2 h-10"
                >
                  {moduleScores[activeScoreModule.id] ? "Retake Quiz" : "Start Quiz"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Exam Configuration Bar */}
      {selectedModuleIds.length >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl bg-card/95 backdrop-blur-md border border-line rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Selection Info & Input */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {selectedModuleIds.length} Selected
                </span>
                <span className="text-[11px] text-ink-muted">Consolidated 50-Question Exam</span>
              </div>
              <input
                type="text"
                placeholder="Enter exam name (optional)..."
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                className="w-full bg-input border border-line rounded-lg px-3 py-2 text-xs text-ink outline-none focus:border-primary transition-colors"
              />
            </div>
            
            {/* Config & Actions */}
            <div className="flex items-center gap-3 max-md:justify-between shrink-0">
              {/* Difficulty Selector */}
              <div className="flex items-center gap-1 bg-input border border-line rounded-lg p-0.5">
                {(['easy', 'medium', 'hard'] as const).map((diff) => {
                  const isLocked = !user.is_premium && diff !== 'easy';
                  const isSelected = examDifficulty === diff;
                  return (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => {
                        if (isLocked) {
                          showToast('error', 'Medium and Hard difficulty are restricted to Pro Student accounts.');
                          return;
                        }
                        setExamDifficulty(diff);
                      }}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold capitalize transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-ink-on-primary shadow-sm'
                          : 'text-ink-muted hover:text-ink'
                      } ${isLocked ? 'opacity-50' : ''}`}
                    >
                      {diff}
                      {isLocked && <Zap size={10} className="text-warning fill-warning" />}
                    </button>
                  );
                })}
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedModuleIds([])}
                  className="btn btn-outline border-line text-ink-muted hover:text-ink hover:bg-glass p-2 rounded-lg"
                  title="Cancel selection"
                >
                  <X size={14} />
                </button>
                
                <button
                  onClick={handleGenerateExam}
                  disabled={isGeneratingExam || dailyExamRemaining <= 0}
                  className="btn btn-primary font-bold text-xs py-2 px-3.5 rounded-lg flex items-center gap-1.5"
                >
                  {isGeneratingExam ? (
                    <>
                      <div className="w-3 h-3 border-2 border-ink-on-primary/30 border-t-ink-on-primary rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap size={12} fill="currentColor" />
                      Generate 50-Q Exam
                    </>
                  )}
                </button>
                <span className="text-[10px] text-ink-muted ml-1">
                  {dailyExamRemaining} / {dailyExamLimit} left today
                </span>
              </div>
            </div>
          </div>

          {/* Link to Exam Calendar */}
          <div className="pt-2 border-t border-line mt-2">
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={linkToCalendar}
                onChange={(e) => setLinkToCalendar(e.target.checked)}
                className="w-3.5 h-3.5 accent-primary"
              />
              <Calendar size={13} className="text-ink-muted" />
              <span className="text-[11px] font-semibold text-ink">Add to Exam Calendar</span>
            </label>
            {linkToCalendar && (
              <div className="flex flex-wrap items-center gap-2 ml-5">
                <button
                  type="button"
                  onClick={() => setLinkMode('existing')}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                    linkMode === 'existing'
                      ? 'bg-primary text-ink-on-primary'
                      : 'bg-input text-ink-muted hover:text-ink border border-line'
                  }`}
                >
                  Link Existing
                </button>
                <button
                  type="button"
                  onClick={() => setLinkMode('create')}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                    linkMode === 'create'
                      ? 'bg-primary text-ink-on-primary'
                      : 'bg-input text-ink-muted hover:text-ink border border-line'
                  }`}
                >
                  Create New
                </button>
                {linkMode === 'create' ? (
                  <>
                    <input
                      type="date"
                      value={calendarExamDate}
                      onChange={(e) => setCalendarExamDate(e.target.value)}
                      className="bg-input border border-line rounded-lg px-2.5 py-1.5 text-[11px] text-ink outline-none focus:border-primary transition-colors"
                    />
                    <select
                      value={calendarExamPriority}
                      onChange={(e) => setCalendarExamPriority(e.target.value as 'high' | 'medium' | 'low')}
                      className="bg-input border border-line rounded-lg px-2.5 py-1.5 text-[11px] text-ink outline-none focus:border-primary transition-colors"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </>
                ) : exams && exams.length > 0 ? (
                  <select
                    value={linkedExamId ?? ''}
                    onChange={(e) => setLinkedExamId(Number(e.target.value) || null)}
                    className="bg-input border border-line rounded-lg px-2.5 py-1.5 text-[11px] text-ink outline-none focus:border-primary transition-colors"
                  >
                    <option value="">Select an exam...</option>
                    {exams.map(exam => (
                      <option key={exam.id} value={exam.id}>
                        {exam.title} — {exam.subject}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-[10px] text-ink-muted">No upcoming exams available</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upgrade Pro Modal */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-line rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            {/* Premium Gold Icon */}
            <div className="w-14 h-14 rounded-full bg-warning/10 flex items-center justify-center mb-4 text-warning shadow-glow-warning-soft">
              <Zap size={28} className="fill-warning" />
            </div>
            
            <h3 className="text-lg font-bold text-ink mb-2">Upgrade to Pro Student</h3>
            <p className="text-xs text-ink-muted leading-relaxed mb-6">
              Interacting with public study modules is a premium feature restricted to Pro Student accounts. Upgrade to unlock full public explorer access, mock exam generation, advanced AI tutoring, and more!
            </p>
            
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => {
                  setIsUpgradeModalOpen(false);
                  if (setView) setView('pricing');
                }}
                className="w-full btn btn-primary py-2.5 text-xs font-bold justify-center cursor-pointer"
              >
                Upgrade Now
              </button>
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="w-full btn btn-outline py-2.5 text-xs font-bold justify-center cursor-pointer"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
