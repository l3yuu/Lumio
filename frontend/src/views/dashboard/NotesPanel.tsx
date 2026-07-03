import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Notebook, Plus, Search, Trash2, Loader2, ChevronLeft, 
  Folder, Calendar, Check, AlertCircle, FileText, Pin, PinOff,
  Eye, Edit3, Clock, BarChart2, Download, Copy, ChevronDown,
  Sparkles, X, ExternalLink, BookOpen
} from 'lucide-react';
import type { Note } from '../../types';
import { API_BASE_URL } from '../../config';

interface NotesPanelProps {
  notes: Note[];
  selectedNoteId: number | null;
  setSelectedNoteId: (id: number | null) => void;
  onCreateNote: () => Promise<number>;
  onUpdateNote: (id: number, updatedFields: Partial<Note>) => Promise<void>;
  onDeleteNote: (id: number) => Promise<void>;
  folders: string[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatNoteDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    if (isNaN(date.getTime())) return '';
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    if (isToday) return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (isYesterday) return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return dateString; }
};

const getSubjectBadgeStyle = (subject: string) => {
  const s = subject.toLowerCase();
  if (s.includes('biol')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (s.includes('econ') || s.includes('hist')) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  if (s.includes('math') || s.includes('calc') || s.includes('phys')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  if (s.includes('lit') || s.includes('eng') || s.includes('art') || s.includes('chem')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
};

// ─── Markdown Renderer ───────────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  const html = text
    // escape HTML entities
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // fenced code blocks
    .replace(/```([\s\S]*?)```/g, '<pre class="md-pre"><code>$1</code></pre>')
    // headers
    .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')
    // blockquotes
    .replace(/^&gt; (.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>')
    // bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="md-bold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="md-italic">$1</em>')
    // inline code
    .replace(/`(.+?)`/g, '<code class="md-code">$1</code>')
    // unordered list items
    .replace(/^[-*] (.+)$/gm, '<li class="md-li">$1</li>')
    // wrap consecutive <li> in <ul>
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (m) => `<ul class="md-ul">${m}</ul>`)
    // paragraphs (double newline)
    .replace(/\n\n+/g, '</p><p class="md-p">')
    // single newline -> <br>
    .replace(/\n/g, '<br/>');
  return `<p class="md-p">${html}</p>`;
}

// ─── AI Modal ────────────────────────────────────────────────────────────────

type AiMode = 'summarize';

interface AiModalProps {
  noteContent: string;
  noteTitle: string;
  onClose: () => void;
  onAppendSummary?: (summaryBlock: string) => Promise<void>;
}

const AiModal: React.FC<AiModalProps> = ({ noteContent, noteTitle, onClose, onAppendSummary }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<{ summary?: string; takeaways?: string; title?: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [savedNote, setSavedNote] = useState(false);

  const hasFired = useRef(false);

  const handleRun = async () => {
    setStatus('loading');
    setResult(null);
    setErrorMsg('');
    const token = localStorage.getItem('token');
    if (!token) { setStatus('error'); setErrorMsg('Not authenticated.'); return; }

    try {
      const res = await fetch(`${API_BASE_URL}/api/condenser/condense`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: noteContent })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(errData.detail || 'Failed to summarize.');
      }
      const data = await res.json() as { summary: string; takeaways: string; title: string };
      setResult({ summary: data.summary, takeaways: data.takeaways, title: data.title });
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred.');
    }
  };

  // Run exactly once on mount
  useEffect(() => {
    if (!hasFired.current) {
      hasFired.current = true;
      handleRun();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveAsNote = async () => {
    if (!result?.summary || !onAppendSummary) return;
    setSavingNote(true);
    try {
      const now = new Date();
      const dateStamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      const summaryBlock = `\n\n---\n\n## 🤖 AI Summary [${dateStamp}]\n${result.summary}${
        result.takeaways ? `\n\n### Key Takeaways\n${result.takeaways}` : ''
      }`;
      await onAppendSummary(summaryBlock);
      setSavedNote(true);
    } catch { /* ignore */ }
    setSavingNote(false);
  };

  return (
    <div className="fixed inset-0 bg-[rgba(5,5,5,0.7)] backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-card border border-line rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-line shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-500/10 border border-violet-500/20 rounded-lg flex items-center justify-center">
              <BookOpen size={15} className="text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">AI Summary</h3>
              <p className="text-[10px] text-ink-muted">{noteTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-glass-strong text-ink-muted hover:text-ink border-0 cursor-pointer">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-soft flex items-center justify-center">
                <Loader2 size={22} className="text-primary animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-ink">
                  Summarizing your note...
                </p>
                <p className="text-xs text-ink-muted mt-1">This may take a few seconds</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertCircle size={18} className="text-red-400" />
              </div>
              <p className="text-sm font-semibold text-red-400">AI request failed</p>
              <p className="text-xs text-ink-muted max-w-xs">{errorMsg}</p>
              <button onClick={handleRun} className="mt-2 text-xs font-bold bg-primary text-ink-on-primary px-4 py-2 rounded-xl border-0 cursor-pointer">
                Try Again
              </button>
            </div>
          )}

          {status === 'done' && result && (
            <div className="space-y-4">
              <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-4">
                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-2">Summary</p>
                <p className="text-sm text-ink leading-relaxed">{result.summary}</p>
              </div>
              {result.takeaways && (
                <div className="bg-glass border border-line rounded-xl p-4">
                  <p className="text-[10px] font-bold text-ink-muted uppercase tracking-widest mb-2">Key Takeaways</p>
                  <p className="text-xs text-ink-muted leading-relaxed whitespace-pre-wrap">{result.takeaways}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {status === 'done' && (
          <div className="p-4 border-t border-line shrink-0 flex gap-2 justify-end">
            {onAppendSummary && (
              <button
                onClick={handleSaveAsNote}
                disabled={savingNote || savedNote}
                className="flex items-center gap-1.5 text-xs font-bold bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20 px-3 py-1.5 rounded-lg cursor-pointer disabled:opacity-50 transition-all"
              >
                {savedNote ? <><Check size={12} /> Added!</> : savingNote ? <><Loader2 size={12} className="animate-spin" /> Adding...</> : <><Plus size={12} /> Add to My Note</>}
              </button>
            )}
            <button onClick={onClose} className="text-xs font-bold bg-glass-strong text-ink-muted hover:text-ink px-3 py-1.5 rounded-lg border-0 cursor-pointer">
              Close
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ─── Note Editor ─────────────────────────────────────────────────────────────

interface NoteEditorProps {
  note: Note;
  onUpdateNote: (id: number, updatedFields: Partial<Note>) => Promise<void>;
  onDeleteNote: (id: number) => Promise<void>;
  folders: string[];
  onBack: () => void;
  onDraftChange: (title: string, content: string, subject: string) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onUpdateNote, onDeleteNote, folders, onBack, onDraftChange }) => {
  const [draftTitle, setDraftTitle] = useState(note.title);
  const [draftContent, setDraftContent] = useState(note.content);
  const [draftSubject, setDraftSubject] = useState(note.subject);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving' | 'error'>('saved');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [aiMode, setAiMode] = useState<AiMode | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const draftTitleRef = useRef(draftTitle);
  const draftContentRef = useRef(draftContent);
  const draftSubjectRef = useRef(draftSubject);
  const saveStatusRef = useRef(saveStatus);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { draftTitleRef.current = draftTitle; }, [draftTitle]);
  useEffect(() => { draftContentRef.current = draftContent; }, [draftContent]);
  useEffect(() => { draftSubjectRef.current = draftSubject; }, [draftSubject]);
  useEffect(() => { saveStatusRef.current = saveStatus; }, [saveStatus]);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Word/Char count
  const wordCount = draftContent.trim() ? draftContent.trim().split(/\s+/).length : 0;
  const charCount = draftContent.length;

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) setShowExportMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
      if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; }
      await saveNote(draftTitleRef.current, draftContentRef.current, draftSubjectRef.current);
    }
  };

  // Save on unmount
  useEffect(() => {
    const currentOnUpdate = onUpdateNote;
    const currentNoteId = note.id;
    return () => {
      if (saveTimerRef.current && saveStatusRef.current === 'unsaved') {
        clearTimeout(saveTimerRef.current);
        const title = draftTitleRef.current;
        const content = draftContentRef.current;
        const subject = draftSubjectRef.current;
        currentOnUpdate(currentNoteId, { title, content, subject }).catch(err =>
          console.error('Failed to auto-save note on unmount:', err)
        );
      }
    };
  }, [note.id, onUpdateNote]);

  const triggerDebounceSave = (title: string, content: string, subject: string) => {
    setSaveStatus('unsaved');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveNote(title, content, subject), 1000);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value; setDraftTitle(v); onDraftChange(v, draftContent, draftSubject); triggerDebounceSave(v, draftContent, draftSubject);
  };
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value; setDraftContent(v); onDraftChange(draftTitle, v, draftSubject); triggerDebounceSave(draftTitle, v, draftSubject);
  };
  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value; setDraftSubject(v); onDraftChange(draftTitle, draftContent, v); triggerDebounceSave(draftTitle, draftContent, v);
  };

  const handleDeleteClick = async () => {
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); saveTimerRef.current = null; }
    try { await onDeleteNote(note.id); } catch (error) { console.error('Failed to delete note:', error); }
  };

  const handleBackClick = async () => { await flushChanges(); onBack(); };

  const handlePinToggle = async () => {
    try { await onUpdateNote(note.id, { isPinned: !note.isPinned }); }
    catch (err) { console.error('Failed to toggle pin:', err); }
  };

  const handleInsertTimestamp = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const now = new Date();
    const stamp = `[${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}]`;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = draftContent.substring(0, start);
    const after = draftContent.substring(end);
    const newContent = before + stamp + ' ' + after;
    setDraftContent(newContent);
    triggerDebounceSave(draftTitle, newContent, draftSubject);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + stamp.length + 1, start + stamp.length + 1);
    });
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${draftTitle}\n\n${draftContent}`);
      setCopySuccess(true);
      setShowExportMenu(false);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch { /* fallback silent */ }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([`${draftTitle}\n${'='.repeat(draftTitle.length)}\n\n${draftContent}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${draftTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'note'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleAppendSummary = async (summaryBlock: string) => {
    // Append the AI summary block to the bottom of the current note content
    const newContent = draftContent + summaryBlock;
    setDraftContent(newContent);
    onDraftChange(draftTitle, newContent, draftSubject);
    // Immediately save (don't wait for debounce)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    await saveNote(draftTitle, newContent, draftSubject);
  };

  return (
    <>
      {aiMode && (
        <AnimatePresence>
          <AiModal
            noteContent={draftContent}
            noteTitle={draftTitle}
            onClose={() => setAiMode(null)}
            onAppendSummary={handleAppendSummary}
          />
        </AnimatePresence>
      )}

      <div className="flex-1 flex flex-col p-4 md:p-6 min-h-0 overflow-hidden h-full">

        {/* ── Top Workspace Bar ── */}
        <div className="flex items-center justify-between border-b border-line pb-3 mb-3 gap-2 flex-wrap">

          {/* Left: Back + Save Status */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={handleBackClick}
              className="lg:hidden flex items-center justify-center p-1.5 rounded-lg bg-glass-strong text-ink-muted hover:text-ink hover:bg-glass border-0 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Save status badge */}
            <div className="flex items-center gap-1.5">
              {/* 'saved' state is intentionally hidden — auto-save is silent */}
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full select-none">
                  <Loader2 size={10} className="animate-spin" /> Saving...
                </div>
              )}
              {/* 'unsaved' state is intentionally hidden — auto-save is silent */}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full select-none">
                  <AlertCircle size={10} /> Failed to save
                </div>
              )}
              {copySuccess && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full select-none">
                  <Check size={10} /> Copied!
                </div>
              )}
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="shrink-0 flex items-center gap-1.5">

            {/* Insert Timestamp */}
            <button
              onClick={handleInsertTimestamp}
              title="Insert timestamp at cursor"
              className="p-1.5 rounded-lg bg-glass-strong text-ink-muted hover:text-ink hover:bg-glass border-0 cursor-pointer transition-all"
            >
              <Clock size={14} />
            </button>

            {/* Pin / Unpin */}
            <button
              onClick={handlePinToggle}
              title={note.isPinned ? 'Unpin note' : 'Pin note'}
              className={`p-1.5 rounded-lg border-0 cursor-pointer transition-all ${
                note.isPinned
                  ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
                  : 'bg-glass-strong text-ink-muted hover:text-ink hover:bg-glass'
              }`}
            >
              {note.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>

            {/* AI Summarize */}
            <button
              onClick={() => setAiMode('summarize')}
              className="flex items-center gap-1.5 p-1.5 pr-2.5 rounded-lg bg-primary-soft text-primary hover:bg-primary/20 border-0 cursor-pointer transition-all text-[11px] font-bold"
              title="Summarize with AI"
            >
              <Sparkles size={13} />
              <span className="hidden sm:inline">Summarize</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(v => !v)}
                title="Export options"
                className="flex items-center gap-1 p-1.5 pr-2 rounded-lg bg-glass-strong text-ink-muted hover:text-ink hover:bg-glass border-0 cursor-pointer transition-all text-[11px] font-bold"
              >
                <ExternalLink size={13} />
                <ChevronDown size={11} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showExportMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1.5 w-44 bg-card border border-line rounded-xl shadow-2xl z-50 overflow-hidden"
                  >
                    <button
                      onClick={handleCopyToClipboard}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-ink hover:bg-glass border-0 cursor-pointer text-left transition-colors"
                    >
                      <Copy size={13} className="text-ink-muted shrink-0" /> Copy to Clipboard
                    </button>
                    <div className="border-t border-line/50" />
                    <button
                      onClick={handleDownloadTxt}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-ink hover:bg-glass border-0 cursor-pointer text-left transition-colors"
                    >
                      <Download size={13} className="text-ink-muted shrink-0" /> Download .txt
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Delete */}
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
                  <button onClick={handleDeleteClick} className="text-[10px] font-bold bg-danger text-ink-on-primary hover:bg-danger-soft hover:text-danger px-2.5 py-1 rounded border-0 transition-all cursor-pointer select-none">Yes</button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="text-[10px] font-bold bg-glass-strong text-ink-muted hover:text-ink px-2.5 py-1 rounded border-0 transition-all cursor-pointer select-none">No</button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

        {/* ── Note Meta Row (Folder + Edit/Preview Tabs) ── */}
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          {/* Folder Selector */}
          <div className="flex items-center gap-2 bg-input/40 border border-line/50 rounded-xl px-3 py-1.5 select-none">
            <Folder size={12} className="text-ink-muted" />
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Folder:</span>
            <select
              value={draftSubject}
              onChange={handleSubjectChange}
              className="bg-transparent border-0 text-ink text-xs font-semibold focus:outline-none cursor-pointer pr-1 outline-none font-sans"
            >
              {folders.map(f => <option key={f} value={f} className="bg-card text-ink">{f}</option>)}
            </select>
          </div>

          {/* Edit / Preview Tab Toggle */}
          <div className="flex items-center bg-glass-strong border border-line rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-lg border-0 cursor-pointer transition-all ${
                viewMode === 'edit'
                  ? 'bg-card text-ink shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Edit3 size={11} /> Edit
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-lg border-0 cursor-pointer transition-all ${
                viewMode === 'preview'
                  ? 'bg-card text-ink shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Eye size={11} /> Preview
            </button>
          </div>
        </div>

        {/* ── Note Title ── */}
        <input
          type="text"
          value={draftTitle}
          onChange={handleTitleChange}
          placeholder="Untitled Note"
          className="w-full bg-transparent border-0 text-xl font-bold focus:outline-none focus:ring-0 text-ink placeholder-ink-ghost py-1 mb-2 font-sans"
        />

        {/* ── Editor / Preview Body ── */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <AnimatePresence mode="wait">
            {viewMode === 'edit' ? (
              <motion.textarea
                key="edit"
                ref={textareaRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                value={draftContent}
                onChange={handleContentChange}
                placeholder="Start typing your notes here... You can use **bold**, *italic*, # Heading, - lists, > blockquotes, and `code`."
                className="w-full h-full bg-transparent border-0 resize-none focus:outline-none focus:ring-0 text-ink placeholder-ink-faint py-2 text-xs md:text-sm leading-relaxed outline-none font-sans"
              />
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-xs md:text-sm text-ink leading-relaxed prose-notes py-2"
                dangerouslySetInnerHTML={{ __html: draftContent.trim() ? renderMarkdown(draftContent) : '<p class="text-ink-muted italic">Nothing to preview yet — switch to Edit mode and start writing.</p>' }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* ── Word/Character Count Footer ── */}
        <div className="flex items-center gap-3 pt-2 mt-2 border-t border-line/50">
          <div className="flex items-center gap-1.5 text-[10px] text-ink-muted">
            <BarChart2 size={11} />
            <span><span className="font-bold text-ink">{wordCount}</span> words</span>
            <span className="text-line">·</span>
            <span><span className="font-bold text-ink">{charCount}</span> characters</span>
          </div>
          <div className="ml-auto flex items-center gap-1 text-[10px] text-ink-muted select-none">
            <Clock size={10} />
            <span>Last edited: {formatNoteDate(note.updatedAt)}</span>
          </div>
        </div>

      </div>
    </>
  );
};

// ─── Notes Panel (Root) ──────────────────────────────────────────────────────

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
  // Live draft values updated on every keystroke from NoteEditor
  const [liveDraft, setLiveDraft] = useState<{ id: number; title: string; content: string; subject: string } | null>(null);

  // Notes pagination states
  const [paginatedNotes, setPaginatedNotes] = useState<Note[]>([]);
  const notesPageRef = useRef(0);
  const [hasMoreNotes, setHasMoreNotes] = useState(true);
  const [isFetchingNotes, setIsFetchingNotes] = useState(false);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const fetchNotes = React.useCallback((pageNum: number = 0, append: boolean = false) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsFetchingNotes(true);
    const limit = 10;
    const skip = pageNum * limit;
    
    fetch(`${API_BASE_URL}/api/notes?skip=${skip}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.ok ? res.json() : [])
    .then((data) => {
      const mapped: Note[] = (data as any[]).map(item => ({
        id: item.id,
        userId: item.user_id,
        title: item.title,
        content: item.content,
        subject: item.subject,
        isPinned: item.is_pinned,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
      
      if (append) {
        setPaginatedNotes(prev => {
          const existingIds = new Set(prev.map(x => x.id));
          const filtered = mapped.filter(x => !existingIds.has(x.id));
          return [...prev, ...filtered];
        });
      } else {
        setPaginatedNotes(mapped);
      }
      setHasMoreNotes(data.length === limit);
      setIsFetchingNotes(false);
    })
    .catch(err => {
      console.error('Error fetching notes:', err);
      setIsFetchingNotes(false);
    });
  }, []);

  // Initial load
  useEffect(() => {
    notesPageRef.current = 0;
    fetchNotes(0, false);
  }, [fetchNotes]);

  // Sync edits/CRUD actions from parent notes state into paginated local state
  useEffect(() => {
    setPaginatedNotes(prev => {
      const parentMap = new Map(notes.map(n => [n.id, n]));
      
      const updated = prev
        .filter(n => parentMap.has(n.id))
        .map(n => parentMap.get(n.id)!);
        
      const existingIds = new Set(prev.map(n => n.id));
      const newlyAdded = notes.filter(n => !existingIds.has(n.id));
      
      if (newlyAdded.length > 0) {
        return [...newlyAdded, ...updated];
      }
      return updated;
    });
  }, [notes]);

  // Scroll listener for infinite scroll within listContainerRef
  useEffect(() => {
    const container = listContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const threshold = 50;
      const totalHeight = container.scrollHeight;
      const scrollPosition = container.clientHeight + container.scrollTop;
      
      if (totalHeight - scrollPosition <= threshold) {
        if (hasMoreNotes && !isFetchingNotes) {
          notesPageRef.current += 1;
          fetchNotes(notesPageRef.current, true);
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMoreNotes, isFetchingNotes, fetchNotes]);

  const activeNote = notes.find(n => n.id === selectedNoteId);

  // Reset live draft when switching notes
  const handleSetSelectedNoteId = (id: number | null) => {
    setLiveDraft(null);
    setSelectedNoteId(id);
  };

  const handleDraftChange = (title: string, content: string, subject: string) => {
    if (selectedNoteId !== null) {
      setLiveDraft({ id: selectedNoteId, title, content, subject });
    }
  };

  const handleNewNoteClick = async () => {
    setIsCreating(true);
    try {
      const newId = await onCreateNote();
      handleSetSelectedNoteId(newId);
    } catch (error) {
      console.error('Failed to create note:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Filter notes
  const filteredNotes = paginatedNotes.filter(note => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder =
      selectedFolderFilter === 'All' ||
      note.subject.toLowerCase() === selectedFolderFilter.toLowerCase();
    return matchesSearch && matchesFolder;
  });

  // Pinned first within filtered results (backend also does this, but re-sort for immediate local pin feedback)
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned === b.isPinned) return 0;
    return a.isPinned ? -1 : 1;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-14rem)] min-h-[500px]">

      {/* ── Left Sidebar (Note List) ── */}
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
            {isCreating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
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
              <X size={12} />
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

        {/* Note List */}
        <div ref={listContainerRef} className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-0">
          <AnimatePresence mode="popLayout">
            {sortedNotes.length === 0 ? (
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
              sortedNotes.map(note => {
                const isActive = note.id === selectedNoteId;
                // Use live draft values for the active note so sidebar reflects typing in real-time
                const displayTitle = isActive && liveDraft?.id === note.id ? liveDraft.title : note.title;
                const displayContent = isActive && liveDraft?.id === note.id ? liveDraft.content : note.content;
                const displaySubject = isActive && liveDraft?.id === note.id ? liveDraft.subject : note.subject;
                const snippet = displayContent
                  ? displayContent.length > 60
                    ? displayContent.substring(0, 60) + '...'
                    : displayContent
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
                    {/* Active indicator */}
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />}

                    <div className="flex items-start justify-between gap-1.5 mb-1">
                      <h4 className="text-xs font-bold text-ink truncate flex-1">
                        {displayTitle || 'Untitled Note'}
                      </h4>
                      <div className="flex items-center gap-1 shrink-0">
                        {note.isPinned && (
                          <Pin size={10} className="text-amber-400" />
                        )}
                        <span className={`text-[0.6rem] font-bold border px-1.5 py-0.5 rounded uppercase tracking-wider ${getSubjectBadgeStyle(displaySubject)}`}>
                          {displaySubject}
                        </span>
                      </div>
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
          {isFetchingNotes && paginatedNotes.length > 0 && (
            <div className="text-center py-4 text-xs text-ink-muted animate-pulse">
              Loading more notes...
            </div>
          )}
        </div>
      </div>

      {/* ── Right Workspace (Editor) ── */}
      <div className={`flex-1 flex flex-col bg-card border border-line rounded-2xl overflow-hidden h-full ${
        selectedNoteId === null ? 'hidden lg:flex' : 'flex'
      }`}>
        {selectedNoteId === null || !activeNote ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-glass-strong text-ink-muted/30 flex items-center justify-center mb-4 border border-line">
              <Notebook size={32} />
            </div>
            <h4 className="text-sm font-bold text-ink">Personal Notes Workspace</h4>
            <p className="text-xs text-ink-muted max-w-sm mt-1 leading-relaxed">
              Write down lectures, draft flashcard questions, or structure essay points. Choose an existing note or create a new one to begin.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 justify-center text-[10px] text-ink-muted">
              <div className="flex items-center gap-1 bg-glass border border-line rounded-lg px-2 py-1"><Sparkles size={10} /> AI Summarize</div>
              <div className="flex items-center gap-1 bg-glass border border-line rounded-lg px-2 py-1"><Pin size={10} /> Pin Notes</div>
              <div className="flex items-center gap-1 bg-glass border border-line rounded-lg px-2 py-1"><Eye size={10} /> Markdown Preview</div>
              <div className="flex items-center gap-1 bg-glass border border-line rounded-lg px-2 py-1"><Download size={10} /> Export</div>
            </div>
          </div>
        ) : (
          <NoteEditor
            key={activeNote.id}
            note={activeNote}
            onUpdateNote={onUpdateNote}
            onDeleteNote={onDeleteNote}
            folders={folders}
            onBack={() => handleSetSelectedNoteId(null)}
            onDraftChange={handleDraftChange}
          />
        )}
      </div>

    </div>
  );
};
