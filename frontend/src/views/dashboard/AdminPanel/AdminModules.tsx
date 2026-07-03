import React from 'react';
import { Search, Loader2, Trash2, FileText } from 'lucide-react';
import type { AdminModule } from './types';

interface Props {
  modules: AdminModule[];
  searchQuery: string;
  submittingId: number | null;
  onSearchChange: (q: string) => void;
  onViewModule: (id: number) => void;
  onDeleteModule: (m: AdminModule) => void;
  onOpenSourceFile: (m: AdminModule) => void;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  isFetchingMore?: boolean;
}

export const AdminModules = ({
  modules, searchQuery, submittingId,
  onSearchChange, onViewModule, onDeleteModule, onOpenSourceFile,
  onScroll, isFetchingMore
}: Props) => {
  const filtered = modules.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.owner_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.difficulty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-card border border-line rounded-xl overflow-hidden shadow-lg">
      <div className="p-4 border-b border-line shrink-0 flex items-center bg-input/40 relative">
        <Search size={16} className="absolute left-7 text-ink-muted" />
        <input
          type="text"
          placeholder="Filter generated modules by title, creator, difficulty, or subject..."
          className="w-full py-2.5 pl-11 pr-4 bg-input border border-line rounded-lg text-sm text-ink outline-none transition focus:border-primary focus:bg-app"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div onScroll={onScroll} className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-xs font-semibold text-ink-muted bg-input/20">
              <th className="p-4 pl-6">Module Title</th>
              <th className="p-4">Subject</th>
              <th className="p-4">Creator / Owner</th>
              <th className="p-4 text-center">Questions</th>
              <th className="p-4 text-center">Difficulty</th>
              <th className="p-4 pr-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink-muted text-sm">
                  No generated modules found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onViewModule(item.id)}
                  className="border-b border-line/60 hover:bg-glass/5 transition-colors cursor-pointer"
                >
                  <td className="p-4 pl-6">
                    <span className="font-semibold text-ink block">{item.name}</span>
                    <span className="text-xs text-ink-muted block">Created {item.date}</span>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[0.7rem] font-bold bg-primary-soft text-primary border border-primary-line">
                      {item.subject}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold block text-ink">{item.owner_name}</span>
                    <span className="text-xs text-ink-muted block">{item.owner_email}</span>
                  </td>
                  <td className="p-4 text-center font-bold">{item.questions_count} Qs</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[0.7rem] font-bold uppercase ${
                      item.difficulty === 'hard'
                        ? 'bg-danger/10 text-danger'
                        : item.difficulty === 'medium'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-success/10 text-success'
                    }`}>
                      {item.difficulty}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      {item.has_source_file && (
                        <button
                          onClick={() => onOpenSourceFile(item)}
                          className="p-1.5 rounded-lg border border-primary-line text-primary hover:bg-primary-soft/20 transition cursor-pointer"
                          title="View Source File"
                        >
                          <FileText size={14} />
                        </button>
                      )}
                      <button
                        disabled={submittingId === item.id}
                        onClick={() => onDeleteModule(item)}
                        className="p-1.5 rounded-lg border border-danger-line text-danger hover:bg-danger-soft transition cursor-pointer disabled:opacity-40"
                        title="Delete Module"
                      >
                        {submittingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {isFetchingMore && (
          <div className="text-center py-4 text-xs text-ink-muted animate-pulse">
            Loading more modules...
          </div>
        )}
      </div>
    </div>
  );
};
