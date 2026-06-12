import React, { useState } from 'react';
import { Plus, Play, Trash2, Zap, RotateCcw, FileText, X, ZoomIn, ZoomOut, Download, MessageSquare, AudioLines, Search, Edit2, Check, MoreVertical } from 'lucide-react';
import type { Module } from '../../types';
import { API_BASE_URL } from '../../config';

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
  onCreateFolder?: (name: string) => void;
  onMoveModule?: (moduleId: number, folderName: string) => void;
  onRenameFolder?: (oldName: string, newName: string) => void;
  onDeleteFolder?: (folderName: string) => void;
}

export const ModulesPanel: React.FC<ModulesPanelProps> = ({
  modules, selectedSubject, subjects, filteredModules,
  setSelectedSubject, startQuiz, handleDeleteModule, setIsUploadOpen,
  moduleScores, onFileDropped, onCreateFolder, onMoveModule,
  onRenameFolder, onDeleteFolder,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [openMenuModuleId, setOpenMenuModuleId] = useState<number | null>(null);

  React.useEffect(() => {
    const handleCloseMenu = () => setOpenMenuModuleId(null);
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, []);

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
      fetch(`${API_BASE_URL}/api/modules/${m.id}/file`, {
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
        fetch(`${API_BASE_URL}/api/modules/${m.id}/source`, {
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
      fetch(`${API_BASE_URL}/api/modules/${m.id}/source`, {
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
    <div className="bg-card border border-line rounded-xl p-5 max-md:p-4">
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap max-md:flex-col max-md:items-stretch max-md:gap-3">
        <h3 className="text-[1.15rem] flex items-center gap-2 m-0 shrink-0">
          My Study Modules {modules.length > 0 && <span className="text-[0.85rem] text-ink-muted font-normal">({modules.length})</span>}
        </h3>
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
      </div>

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
            return (
              <div
                draggable
                onDragStart={(e) => {
                  console.log('Drag start: user started dragging module:', m.name, 'with ID:', m.id);
                  e.dataTransfer.setData('text/plain', m.id.toString());
                  e.dataTransfer.setData('text', m.id.toString());
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => handleViewSource(m)}
                className={`flex max-md:flex-col max-md:items-stretch max-md:gap-3 md:justify-between md:items-center bg-app border border-line rounded-lg p-4 max-md:p-3.5 md:px-5 hover:border-primary/50 cursor-pointer md:hover:scale-[1.005] transition-all duration-200 select-none relative ${
                  openMenuModuleId === m.id ? 'z-30 shadow-lg' : 'z-0'
                }`}
                key={m.id}
              >
                <div className="flex flex-col gap-1.5 pointer-events-none min-w-0 flex-1">
                  <span className="font-bold text-base max-md:text-[0.95rem] text-left wrap-break-word leading-snug">{m.name}</span>
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
                    {moduleScore && (
                      <span className="flex items-center gap-1 bg-primary-soft text-primary text-[0.75rem] font-bold px-2 py-0.5 rounded border border-primary-line">
                        Last Score: {moduleScore}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2.5 items-center shrink-0 max-md:w-full max-md:pt-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startQuiz(m);
                    }}
                    className="btn btn-primary max-md:flex-1 max-md:justify-center max-md:py-2.5"
                  >
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
                        {onMoveModule && (
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete the module "${m.name}"?`)) {
                              handleDeleteModule(m.id);
                            }
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
      </div>

      {/* Source Content Modal */}
      {viewSourceModule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-3000 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#323639] border border-white/10 rounded-2xl w-full max-w-237.5 h-[85vh] flex flex-col overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
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
                  <span className="text-sm font-medium text-white max-w-50 sm:max-w-[320px] truncate">{viewSourceModule.name}</span>
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
                  className="bg-white rounded shadow-2xl overflow-hidden transition-transform duration-200 origin-top my-4 w-full max-w-212.5"
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
                  className="bg-white rounded shadow-[0_4px_24px_rgba(0,0,0,0.25)] p-12 sm:p-16 w-full max-w-212.5 min-h-[calc(85vh-120px)] my-4 text-gray-900 font-sans transition-transform duration-200 origin-top text-left"
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
