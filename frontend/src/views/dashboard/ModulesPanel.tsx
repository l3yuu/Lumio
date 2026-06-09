import React, { useState } from 'react';
import { Plus, Play, Trash2, Zap, RotateCcw, FileText, X, ZoomIn, ZoomOut, Download, MessageSquare, AudioLines, Search } from 'lucide-react';
import type { Module } from '../../types';

interface ModulesPanelProps {
  modules: Module[];
  selectedSubject: string;
  subjects: string[];
  filteredModules: Module[];
  setSelectedSubject: (v: string) => void;
  startQuiz: (module: Module) => void;
  handleDeleteModule: (id: number) => void;
  setIsUploadOpen: (v: boolean) => void;
  moduleScores: { [moduleId: number]: string };
  onFileDropped?: (file: File) => void;
}

export const ModulesPanel: React.FC<ModulesPanelProps> = ({
  modules, selectedSubject, subjects, filteredModules,
  setSelectedSubject, startQuiz, handleDeleteModule, setIsUploadOpen,
  moduleScores, onFileDropped,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const displayedModules = filteredModules.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const [viewSourceModule, setViewSourceModule] = useState<Module | null>(null);
  const [sourceContent, setSourceContent] = useState('');
  const [isLoadingSource, setIsLoadingSource] = useState(false);
  const [sourceFileUrl, setSourceFileUrl] = useState('');
  const [pdfZoom, setPdfZoom] = useState(100);

  const handleViewSource = (m: Module) => {
    setViewSourceModule(m);
    setSourceContent('');
    setPdfZoom(100);
    if (sourceFileUrl) URL.revokeObjectURL(sourceFileUrl);
    setSourceFileUrl('');
    setIsLoadingSource(true);
    const token = localStorage.getItem('token');
    if (!token) return;

    if (m.sourceFilename?.toLowerCase().endsWith('.pdf')) {
      fetch(`http://127.0.0.1:8000/api/modules/${m.id}/file`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('No file');
        return res.blob();
      })
      .then(blob => {
        setSourceFileUrl(URL.createObjectURL(blob));
      })
      .catch(() => {
        fetch(`http://127.0.0.1:8000/api/modules/${m.id}/source`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setSourceContent(data.source_content || '');
        })
        .catch(() => {});
      })
      .finally(() => setIsLoadingSource(false));
    } else {
      fetch(`http://127.0.0.1:8000/api/modules/${m.id}/source`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setSourceContent(data.source_content || '');
      })
      .catch(() => {})
      .finally(() => setIsLoadingSource(false));
    }
  };

  return (
    <div className="bg-card border border-line rounded-xl p-5">
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <h3 className="text-[1.15rem] flex items-center gap-2 m-0 shrink-0">
          My Study Modules {modules.length > 0 && <span className="text-[0.85rem] text-ink-muted font-normal">({modules.length})</span>}
        </h3>
        <div className="flex items-center gap-3 flex-1 max-w-[320px] md:ml-auto">
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
        <button onClick={() => setIsUploadOpen(true)} className="btn btn-primary shrink-0">
          <Plus size={18} /> Add Module
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {subjects.map((subj) => (
          <button
            key={subj}
            onClick={() => setSelectedSubject(subj)}
            className={`px-3.5 py-1.5 text-xs rounded-full border transition-all duration-200 cursor-pointer font-bold ${
              selectedSubject === subj
                ? 'bg-primary text-ink-on-primary border-primary'
                : 'bg-glass border-line text-ink-muted hover:text-ink hover:bg-glass-strong'
            }`}
          >
            {subj === 'All' ? 'All Folders' : subj}
          </button>
        ))}
      </div>

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
        className={`border-2 border-dashed rounded-xl p-6 mb-6 text-center transition-all duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer select-none ${
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
            return (
              <div
                draggable
                onDragStart={(e) => {
                  console.log('Drag start: user started dragging module:', m.name, 'with ID:', m.id);
                  e.dataTransfer.setData('text/plain', m.id.toString());
                  e.dataTransfer.setData('text', m.id.toString());
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                className="flex justify-between items-center bg-app border border-line rounded-lg p-4 px-5 hover:border-primary/50 cursor-grab active:cursor-grabbing hover:scale-[1.005] transition-all duration-200 select-none"
                key={m.id}
              >
                <div className="flex flex-col gap-1 pointer-events-none">
                  <span className="font-bold text-base text-left">{m.name}</span>
                  <div className="text-[0.8rem] text-ink-muted flex items-center gap-4 flex-wrap">
                    <span>Date: {m.date}</span>
                    <span>Size: {m.size}</span>
                    <span>Questions: {m.questionsCount}</span>
                    {moduleScore && (
                      <span className="flex items-center gap-1 bg-primary-soft text-primary text-[0.75rem] font-bold px-2 py-0.5 rounded border border-primary-line">
                        Last Score: {moduleScore}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startQuiz(m)} className="btn btn-primary">
                    {moduleScore ? (
                      <>
                        <RotateCcw size={14} /> Retake Quiz
                      </>
                    ) : (
                      <>
                        <Play size={14} fill="currentColor" /> Practice Quiz
                      </>
                    )}
                  </button>
                  {m.sourceFilename && (
                    <button onClick={() => handleViewSource(m)} className="btn btn-outline bg-transparent border-line text-ink-muted hover:text-ink hover:bg-glass" title="View Source">
                      <FileText size={16} />
                    </button>
                  )}
                  <button onClick={() => handleDeleteModule(m.id)} className="btn btn-outline text-danger border-danger-line">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Source Content Modal */}
      {viewSourceModule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-3000 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#323639] border border-white/10 rounded-2xl w-full max-w-[950px] h-[85vh] flex flex-col overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#202124] border-b border-[#1c1d20] shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { if (sourceFileUrl) URL.revokeObjectURL(sourceFileUrl); setViewSourceModule(null); }}
                  className="p-1.5 rounded-lg bg-transparent border-0 text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X size={18} />
                </button>
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-red-400" />
                  <span className="text-sm font-medium text-white max-w-[200px] sm:max-w-[320px] truncate">{viewSourceModule.name}</span>
                </div>
                {viewSourceModule.sourceFilename && (
                  <span className="text-xs text-gray-400 hidden sm:inline">{viewSourceModule.sourceFilename}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {/* Zoom controls */}
                <button
                  onClick={() => setPdfZoom(z => Math.max(50, z - 10))}
                  className="p-1.5 rounded-lg bg-transparent border-0 text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Zoom out"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs text-white/90 w-12 text-center font-mono font-medium">{pdfZoom}%</span>
                <button
                  onClick={() => setPdfZoom(z => Math.min(200, z + 10))}
                  className="p-1.5 rounded-lg bg-transparent border-0 text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Zoom in"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={() => setPdfZoom(100)}
                  className="px-2 py-1 rounded-lg bg-transparent border-0 text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-xs"
                  title="Reset zoom"
                >
                  Fit
                </button>
                <div className="w-px h-5 bg-white/10 mx-1" />
                {/* Action buttons */}
                <button
                  className="p-1.5 rounded-lg bg-transparent border-0 text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Comment"
                >
                  <MessageSquare size={16} />
                </button>
                <button
                  className="p-1.5 rounded-lg bg-transparent border-0 text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Audio overview"
                >
                  <AudioLines size={16} />
                </button>
                <div className="w-px h-5 bg-white/10 mx-1" />
                {sourceFileUrl && (
                  <a
                    href={sourceFileUrl}
                    download={viewSourceModule.sourceFilename || 'file'}
                    className="p-1.5 rounded-lg bg-transparent border-0 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                    title="Download"
                  >
                    <Download size={16} />
                  </a>
                )}
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-auto flex items-start justify-center p-6 bg-[#323639]">
              {viewSourceModule.sourceFilename?.toLowerCase().endsWith('.pdf') && sourceFileUrl ? (
                <div
                  className="bg-white rounded shadow-2xl overflow-hidden transition-transform duration-200 origin-top my-4 w-full max-w-[850px]"
                  style={{ transform: `scale(${pdfZoom / 100})` }}
                >
                  <iframe
                    src={`${sourceFileUrl}#toolbar=0&navpanes=0`}
                    className="w-full border-0"
                    style={{ height: 'calc(85vh - 120px)' }}
                    title={viewSourceModule.sourceFilename}
                  />
                </div>
              ) : (
                <div
                  className="bg-white rounded shadow-[0_4px_24px_rgba(0,0,0,0.25)] p-12 sm:p-16 w-full max-w-[850px] min-h-[calc(85vh-120px)] my-4 text-gray-900 font-sans transition-transform duration-200 origin-top text-left"
                  style={{ transform: `scale(${pdfZoom / 100})` }}
                >
                  {isLoadingSource ? (
                    <div className="text-center py-24 text-gray-400 font-medium">Loading source content...</div>
                  ) : sourceContent ? (
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">{sourceContent}</pre>
                  ) : (
                    <div className="text-center py-24 text-gray-400 font-medium">No source content available for this module.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
