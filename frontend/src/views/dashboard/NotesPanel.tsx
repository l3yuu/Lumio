import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Notebook, Plus, Search, Trash2, Loader2, ChevronLeft, 
  Folder, Calendar, Check, AlertCircle, FileText 
} from 'lucide-react';
import type { Note } from '../../types';

interface NotesPanelProps {
  notes: Note[];
  selectedNoteId: number | null;
  setSelectedNoteId: (id: number | null) => void;
  onCreateNote: () => Promise<number>;
  onUpdateNote: (id: number, updatedFields: Partial<Note>) => Promise<void>;
  onDeleteNote: (id: number) => Promise<void>;
  folders: string[];
}

const formatNoteDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    
    if (isNaN(date.getTime())) return '';
    
    const isToday = date.toDateString() === now.toDateString();
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (isYesterday) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateString;
  }
};

const getSubjectBadgeStyle = (subject: string) => {
  const s = subject.toLowerCase();
  if (s.includes('biol')) {
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  }
  if (s.includes('econ') || s.includes('hist')) {
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }
  if (s.includes('math') || s.includes('calc') || s.includes('phys')) {
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  }
  if (s.includes('lit') || s.includes('eng') || s.includes('art') || s.includes('chem')) {
    return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  }
  return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
};

interface NoteEditorProps {
  note: Note;
  onUpdateNote: (id: number, updatedFields: Partial<Note>) => Promise<void>;
  onDeleteNote: (id: number) => Promise<void>;
  folders: string[];
  onBack: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  onUpdateNote,
  onDeleteNote,
  folders,
  onBack
}) => {
  const [draftTitle, setDraftTitle] = useState(note.title);
  const [draftContent, setDraftContent] = useState(note.content);
  const [draftSubject, setDraftSubject] = useState(note.subject);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving' | 'error'>('saved');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const draftTitleRef = useRef(draftTitle);
  const draftContentRef = useRef(draftContent);
  const draftSubjectRef = useRef(draftSubject);
  const saveStatusRef = useRef(saveStatus);

  useEffect(() => { draftTitleRef.current = draftTitle; }, [draftTitle]);
  useEffect(() => { draftContentRef.current = draftContent; }, [draftContent]);
  useEffect(() => { draftSubjectRef.current = draftSubject; }, [draftSubject]);
  useEffect(() => { saveStatusRef.current = saveStatus; }, [saveStatus]);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const saveNote = async (title: string, content: string, subject: string) => {
    setSaveStatus('saving');
    try {
      await onUpdateNote(note.id, { title, content, subject });
      setSaveStatus('saved');
    } catch (err) {
      console.error('Error auto-saving note:', err);
      setSaveStatus('error');
    }
  };

  const flushChanges = async () => {
    if (saveStatusRef.current === 'unsaved') {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      await saveNote(draftTitleRef.current, draftContentRef.current, draftSubjectRef.current);
    }
  };

  // Save changes on unmount
  useEffect(() => {
    const currentOnUpdate = onUpdateNote;
    const currentNoteId = note.id;

    return () => {
      if (saveTimerRef.current && saveStatusRef.current === 'unsaved') {
        clearTimeout(saveTimerRef.current);
        const title = draftTitleRef.current;
        const content = draftContentRef.current;
        const subject = draftSubjectRef.current;
        
        currentOnUpdate(currentNoteId, { title, content, subject }).catch(err => {
          console.error("Failed to auto-save note on unmount:", err);
        });
      }
    };
  }, [note.id, onUpdateNote]);

  const triggerDebounceSave = (title: string, content: string, subject: string) => {
    setSaveStatus('unsaved');
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveNote(title, content, subject);
    }, 1000);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setDraftTitle(newTitle);
    triggerDebounceSave(newTitle, draftContent, draftSubject);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setDraftContent(newContent);
    triggerDebounceSave(draftTitle, newContent, draftSubject);
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSubject = e.target.value;
    setDraftSubject(newSubject);
    triggerDebounceSave(draftTitle, draftContent, newSubject);
  };

  const handleDeleteClick = async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    try {
      await onDeleteNote(note.id);
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  const handleBackClick = async () => {
    await flushChanges();
    onBack();
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 min-h-0 overflow-hidden h-full">
      {/* Top Workspace Bar */}
      <div className="flex items-center justify-between border-b border-line pb-4 mb-4 gap-4">
        
        {/* Left Bar Section */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={handleBackClick}
            className="lg:hidden flex items-center justify-center p-1.5 rounded-lg bg-glass-strong text-ink-muted hover:text-ink hover:bg-glass border-0 cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          
          {/* Sync status indicator */}
          <div className="flex items-center gap-1.5">
            {saveStatus === 'saved' && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full select-none">
                <Check size={10} />
                Saved
              </div>
            )}
            {saveStatus === 'saving' && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full select-none">
                <Loader2 size={10} className="animate-spin" />
                Saving...
              </div>
            )}
            {saveStatus === 'unsaved' && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Unsaved changes
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full select-none">
                <AlertCircle size={10} />
                Failed to save
              </div>
            )}
          </div>
        </div>

        {/* Right Bar Section: Delete Actions */}
        <div className="shrink-0 flex items-center">
          <AnimatePresence mode="wait">
            {!showDeleteConfirm ? (
              <motion.button
                key="delete-btn"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 rounded-lg bg-danger-soft text-danger hover:bg-danger hover:text-ink-on-primary border-0 transition-all cursor-pointer flex items-center justify-center"
                title="Delete Note"
              >
                <Trash2 size={14} />
              </motion.button>
            ) : (
              <motion.div
                key="delete-confirm"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-1.5 bg-glass-strong border border-line rounded-lg p-1"
              >
                <span className="text-[10px] font-semibold text-ink-muted px-1.5">Delete?</span>
                <button
                  onClick={handleDeleteClick}
                  className="text-[10px] font-bold bg-danger text-ink-on-primary hover:bg-danger-soft hover:text-danger px-2.5 py-1 rounded border-0 transition-all cursor-pointer select-none"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-[10px] font-bold bg-glass-strong text-ink-muted hover:text-ink px-2.5 py-1 rounded border-0 transition-all cursor-pointer select-none"
                >
                  No
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Note Meta Controls (Dropdown Selector) */}
      <div className="flex items-center gap-2 mb-4 bg-input/40 border border-line/50 rounded-xl px-3 py-1.5 self-start select-none">
        <Folder size={12} className="text-ink-muted" />
        <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Folder:</span>
        <select
          value={draftSubject}
          onChange={handleSubjectChange}
          className="bg-transparent border-0 text-ink text-xs font-semibold focus:outline-none cursor-pointer pr-1 outline-none font-sans"
        >
          {folders.map(f => (
            <option key={f} value={f} className="bg-card text-ink">
              {f}
            </option>
          ))}
        </select>
      </div>

      {/* Note Title Input */}
      <input
        type="text"
        value={draftTitle}
        onChange={handleTitleChange}
        placeholder="Untitled Note"
        className="w-full bg-transparent border-0 text-xl font-bold focus:outline-none focus:ring-0 text-ink placeholder-ink-ghost py-1 mb-2 font-sans"
      />

      {/* Editor Body Textarea */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        <textarea
          value={draftContent}
          onChange={handleContentChange}
          placeholder="Start typing your notes here..."
          className="w-full h-full bg-transparent border-0 resize-none focus:outline-none focus:ring-0 text-ink placeholder-ink-faint py-2 text-xs md:text-sm leading-relaxed outline-none min-h-[300px] font-sans"
        />
      </div>
    </div>
  );
};

export const NotesPanel: React.FC<NotesPanelProps> = ({
  notes,
  selectedNoteId,
  setSelectedNoteId,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  folders
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderFilter, setSelectedFolderFilter] = useState('All');

  const activeNote = notes.find(n => n.id === selectedNoteId);

  const handleNewNoteClick = async () => {
    setIsCreating(true);
    try {
      const newId = await onCreateNote();
      setSelectedNoteId(newId);
    } catch (error) {
      console.error("Failed to create note:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Filter notes
  const filteredNotes = notes.filter(note => {
    const matchesSearch = 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFolder = 
      selectedFolderFilter === 'All' || 
      note.subject.toLowerCase() === selectedFolderFilter.toLowerCase();
      
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-14rem)] min-h-[500px]">
      
      {/* Left Sidebar (Note List) */}
      <div className={`w-full lg:w-80 flex flex-col bg-card border border-line rounded-2xl p-4 overflow-hidden h-full shrink-0 ${
        selectedNoteId !== null ? 'hidden lg:flex' : 'flex'
      }`}>
        
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-4 gap-2">
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <Notebook className="text-primary" size={18} />
            My Notes
          </h3>
          <button
            onClick={handleNewNoteClick}
            disabled={isCreating}
            className="flex items-center gap-1.5 text-xs font-bold bg-primary text-ink-on-primary hover:bg-primary-hover px-3 py-1.5 rounded-xl border-0 shadow-sm shadow-primary/10 transition-all cursor-pointer disabled:opacity-50 select-none"
          >
            {isCreating ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Plus size={12} />
            )}
            New Note
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3.5">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-input border border-line hover:border-line-strong focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-1.5 pl-9 pr-8 text-xs text-ink placeholder-ink-muted transition-all outline-none"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-0 text-ink-muted hover:text-ink cursor-pointer p-0.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none select-none">
          {['All', ...folders].map(folder => {
            const isActive = selectedFolderFilter === folder;
            return (
              <button
                key={folder}
                onClick={() => setSelectedFolderFilter(folder)}
                className={`text-[0.7rem] font-bold px-3 py-1.5 rounded-lg border-0 cursor-pointer whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-primary text-ink-on-primary shadow-sm'
                    : 'bg-glass-strong text-ink-muted border border-line hover:bg-glass hover:text-ink'
                }`}
              >
                {folder}
              </button>
            );
          })}
        </div>

        {/* Note List Scroll View */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
          <AnimatePresence mode="popLayout">
            {filteredNotes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center text-ink-muted flex-1"
              >
                <FileText size={24} className="opacity-20 mb-2" />
                <p className="text-xs">No notes found</p>
                <p className="text-[10px] opacity-75 mt-0.5">
                  {notes.length === 0 ? 'Create a note to start typing!' : 'Try clearing your filters.'}
                </p>
              </motion.div>
            ) : (
              filteredNotes.map(note => {
                const isActive = note.id === selectedNoteId;
                const snippet = note.content 
                  ? note.content.length > 50 
                    ? note.content.substring(0, 50) + '...'
                    : note.content
                  : 'No content yet...';
                
                return (
                  <motion.div
                    key={note.id}
                    layoutId={`note-card-${note.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setSelectedNoteId(note.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 select-none group relative overflow-hidden ${
                      isActive 
                        ? 'bg-primary-soft border-primary-line-strong' 
                        : 'bg-glass border-line hover:border-line-strong hover:bg-glass-strong'
                    }`}
                  >
                    {/* Visual active side bar indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />
                    )}

                    <div className="flex items-start justify-between gap-1.5 mb-1">
                      <h4 className="text-xs font-bold text-ink truncate flex-1">
                        {note.title || 'Untitled Note'}
                      </h4>
                      <span className={`text-[0.6rem] font-bold border px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${getSubjectBadgeStyle(note.subject)}`}>
                        {note.subject}
                      </span>
                    </div>

                    <p className="text-[11px] text-ink-muted line-clamp-2 leading-relaxed mb-1.5">
                      {snippet}
                    </p>

                    <span className="text-[9px] text-ink-muted flex items-center gap-1 select-none">
                      <Calendar size={10} />
                      {formatNoteDate(note.updatedAt)}
                    </span>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Workspace (Editor) */}
      <div className={`flex-1 flex flex-col bg-card border border-line rounded-2xl overflow-hidden h-full ${
        selectedNoteId === null ? 'hidden lg:flex' : 'flex'
      }`}>
        {selectedNoteId === null || !activeNote ? (
          /* Empty Workspace Graphic */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-glass-strong text-ink-muted/30 flex items-center justify-center mb-4 border border-line">
              <Notebook size={32} />
            </div>
            <h4 className="text-sm font-bold text-ink">Personal Notes Workspace</h4>
            <p className="text-xs text-ink-muted max-w-sm mt-1 leading-relaxed">
              Write down lectures, draft flashcard questions, or structure essay points. Choose an existing note or create a new one to begin.
            </p>
          </div>
        ) : (
          /* Workspace Editor Container reset by key */
          <NoteEditor
            key={activeNote.id}
            note={activeNote}
            onUpdateNote={onUpdateNote}
            onDeleteNote={onDeleteNote}
            folders={folders}
            onBack={() => setSelectedNoteId(null)}
          />
        )}
      </div>

    </div>
  );
};
