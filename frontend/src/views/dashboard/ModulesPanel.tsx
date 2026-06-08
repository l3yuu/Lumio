import React from 'react';
import { Plus, Play, Trash2 } from 'lucide-react';
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
}

export const ModulesPanel: React.FC<ModulesPanelProps> = ({
  modules, selectedSubject, subjects, filteredModules,
  setSelectedSubject, startQuiz, handleDeleteModule, setIsUploadOpen,
}) => {
  return (
    <div className="bg-card border border-line rounded-xl p-5">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[1.15rem] flex items-center gap-2 m-0">
          My Study Modules {modules.length > 0 && <span className="text-[0.85rem] text-ink-muted font-normal">({modules.length})</span>}
        </h3>
        <button onClick={() => setIsUploadOpen(true)} className="btn btn-primary">
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

      <div className="flex flex-col gap-3">
        {filteredModules.length === 0 ? (
          <div className="text-center p-8 text-ink-muted">
            No modules found in folder "{selectedSubject}".
          </div>
        ) : (
          filteredModules.map((m) => (
            <div className="flex justify-between items-center bg-app border border-line rounded-lg p-4 px-5 hover:border-primary/50 transition-all duration-200" key={m.id}>
              <div className="flex flex-col gap-1">
                <span className="font-bold text-base">{m.name}</span>
                <div className="text-[0.8rem] text-ink-muted flex gap-4">
                  <span>Date: {m.date}</span>
                  <span>Size: {m.size}</span>
                  <span>Questions: {m.questionsCount}</span>
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
  );
};
