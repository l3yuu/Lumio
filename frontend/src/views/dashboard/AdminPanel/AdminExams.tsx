import React from 'react';
import { Search, Loader2, Trash2 } from 'lucide-react';
import type { AdminExam } from './types';

interface Props {
  exams: AdminExam[];
  searchQuery: string;
  submittingId: number | null;
  onSearchChange: (q: string) => void;
  onDeleteExam: (e: AdminExam) => void;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  isFetchingMore?: boolean;
}

export const AdminExams = ({
  exams, searchQuery, submittingId,
  onSearchChange, onDeleteExam,
  onScroll, isFetchingMore
}: Props) => {
  const filtered = exams.filter(e =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.owner_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.owner_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-card border border-line rounded-xl overflow-hidden shadow-lg">
      <div className="p-4 border-b border-line shrink-0 flex items-center bg-input/40 relative">
        <Search size={16} className="absolute left-7 text-ink-muted" />
        <input
          type="text"
          placeholder="Filter scheduled exams by title, creator, or subject..."
          className="w-full py-2.5 pl-11 pr-4 bg-input border border-line rounded-lg text-sm text-ink outline-none transition focus:border-primary focus:bg-app"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div onScroll={onScroll} className="flex-1 overflow-auto">
        {/* Desktop View Table */}
        <table className="hidden md:table w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-xs font-semibold text-ink-muted bg-input/20">
              <th className="p-4 pl-6">Exam Title</th>
              <th className="p-4">Subject</th>
              <th className="p-4">Creator / Owner</th>
              <th className="p-4 text-center">Remaining</th>
              <th className="p-4 text-center">Priority</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 pr-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-ink-muted text-sm">
                  No scheduled exams found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="border-b border-line/60 hover:bg-glass/5 transition-colors">
                  <td className="p-4 pl-6">
                    <span className="font-semibold text-ink block">{item.title}</span>
                    <span className="text-xs text-ink-muted block">Due {item.date}</span>
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
                  <td className="p-4 text-center font-bold">
                    {item.completed ? (
                      <span className="text-xs text-ink-muted">-</span>
                    ) : (
                      <span>{item.days_remaining} {item.days_remaining === 1 ? 'day' : 'days'}</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[0.7rem] font-bold uppercase ${
                      item.priority === 'high'
                        ? 'bg-danger/10 text-danger'
                        : item.priority === 'medium'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-primary-soft text-primary border border-primary-line'
                    }`}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {item.completed ? (
                      <span className="px-2 py-0.5 rounded text-[0.7rem] font-bold bg-success/10 text-success uppercase">
                        Completed {item.score ? `(${item.score})` : ''}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[0.7rem] font-bold bg-glass text-ink-muted uppercase">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button
                      disabled={submittingId === item.id}
                      onClick={() => onDeleteExam(item)}
                      className="p-1.5 rounded-lg border border-danger-line text-danger hover:bg-danger-soft transition cursor-pointer disabled:opacity-40"
                      title="Delete Exam"
                    >
                      {submittingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Mobile View Cards */}
        <div className="md:hidden divide-y divide-line/60">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-ink-muted text-sm">
              No scheduled exams found.
            </div>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="p-4 flex flex-col gap-3 hover:bg-glass/5 transition-colors">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-semibold text-ink block">{item.title}</span>
                    <span className="text-xs text-ink-muted block">Due {item.date}</span>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded text-[0.7rem] font-bold bg-primary-soft text-primary border border-primary-line">
                    {item.subject}
                  </span>
                </div>

                {/* Creator & Details */}
                <div className="flex flex-col gap-2 text-xs">
                  <div>
                    <span className="text-ink-muted">Creator: </span>
                    <span className="font-semibold text-ink">{item.owner_name}</span>
                    <span className="text-ink-muted block">{item.owner_email}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1">
                    <div>
                      <span className="text-ink-muted">Remaining: </span>
                      <span className="font-bold text-ink">
                        {item.completed ? (
                          <span className="text-xs text-ink-muted font-normal">—</span>
                        ) : (
                          <span>{item.days_remaining} {item.days_remaining === 1 ? 'day' : 'days'}</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-ink-muted">Priority: </span>
                      <span className={`px-2 py-0.5 rounded text-[0.7rem] font-bold uppercase ${
                        item.priority === 'high'
                          ? 'bg-danger/10 text-danger'
                          : item.priority === 'medium'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-primary-soft text-primary border border-primary-line'
                      }`}>
                        {item.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-ink-muted">Status: </span>
                      {item.completed ? (
                        <span className="px-2 py-0.5 rounded text-[0.7rem] font-bold bg-success/10 text-success uppercase">
                          Completed {item.score ? `(${item.score})` : ''}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[0.7rem] font-bold bg-glass text-ink-muted uppercase">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 mt-1 pt-2 border-t border-line/40">
                  <button
                    disabled={submittingId === item.id}
                    onClick={() => onDeleteExam(item)}
                    className="p-2 rounded-lg border border-danger-line text-danger hover:bg-danger-soft transition cursor-pointer disabled:opacity-40"
                    title="Delete Exam"
                  >
                    {submittingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        {isFetchingMore && (
          <div className="text-center py-4 text-xs text-ink-muted animate-pulse">
            Loading more exams...
          </div>
        )}
      </div>
    </div>
  );
};
