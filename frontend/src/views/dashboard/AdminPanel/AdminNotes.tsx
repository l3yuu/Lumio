import React, { useState, useEffect, useRef } from 'react';
import { Search, RefreshCw, MessageSquare, Notebook } from 'lucide-react';
import { API_BASE_URL } from '../../../config';

interface AdminNote {
  id: number;
  user_id: number;
  title: string;
  content: string;
  subject: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  owner_email: string;
  owner_name: string;
}

export const AdminNotes = () => {
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [hasMoreNotes, setHasMoreNotes] = useState(true);
  const [isFetchingNotes, setIsFetchingNotes] = useState(false);
  const notesPageRef = useRef(0);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const fetchNotes = React.useCallback(async (pageNum: number = 0, append: boolean = false) => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = API_BASE_URL.replace(/\/+$/, '');
      const limit = 10;
      const skip = pageNum * limit;
      
      const res = await fetch(`${baseUrl}/api/admin/notes?skip=${skip}&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }
      const data = await res.json();
      if (append) {
        setNotes(prev => {
          const existingIds = new Set(prev.map(x => x.id));
          return [...prev, ...data.filter((x: AdminNote) => !existingIds.has(x.id))];
        });
      } else {
        setNotes(data);
      }
      setHasMoreNotes(data.length === limit);
    } catch (err) {
      console.error('Error fetching admin notes:', err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setTimeout(() => {
      setLoading(true);
    }, 0);
    notesPageRef.current = 0;
    
    fetchNotes(0, false).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [refreshKey, fetchNotes]);

  // Scroll listener
  useEffect(() => {
    const container = listContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const threshold = 100;
      const totalHeight = container.scrollHeight;
      const scrollPosition = container.clientHeight + container.scrollTop;
      
      if (totalHeight - scrollPosition <= threshold) {
        if (hasMoreNotes && !isFetchingNotes) {
          setIsFetchingNotes(true);
          notesPageRef.current += 1;
          fetchNotes(notesPageRef.current, true).finally(() => setIsFetchingNotes(false));
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMoreNotes, isFetchingNotes, fetchNotes]);

  const uniqueUsers = [...new Set(notes.map(n => n.owner_email))];

  const filtered = notes.filter(n => {
    const q = search.toLowerCase();
    const matchesSearch = !q || n.title?.toLowerCase().includes(q) || n.subject?.toLowerCase().includes(q) || n.owner_name?.toLowerCase().includes(q) || n.owner_email?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q);
    const matchesUser = !selectedUser || n.owner_email === selectedUser;
    return matchesSearch && matchesUser;
  });

  return (
    <div className="flex-1 flex flex-col bg-card border border-line rounded-xl overflow-hidden shadow-lg">
      <div className="p-4 border-b border-line shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Notebook size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-ink m-0">User Notes</h2>
            {notes.length > 0 && (
              <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-semibold">
                {notes.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setRefreshKey(k => k + 1);
            }}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink bg-transparent border border-line rounded-lg px-3 py-1.5 cursor-pointer transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Search by user, title, or subject..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-input border border-line rounded-lg pl-9 pr-3 py-2 text-sm text-ink outline-none focus:border-primary transition-colors"
          />
        </div>

        {uniqueUsers.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className={`text-xs px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
                selectedUser === null
                  ? 'bg-primary text-ink-on-primary border-primary'
                  : 'bg-transparent text-ink-muted border-line hover:border-primary/50'
              }`}
            >
              All
            </button>
            {uniqueUsers.map(email => (
              <button
                key={email}
                type="button"
                onClick={() => setSelectedUser(email)}
                className={`text-xs px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
                  selectedUser === email
                    ? 'bg-primary text-ink-on-primary border-primary'
                    : 'bg-transparent text-ink-muted border-line hover:border-primary/50'
                }`}
              >
                {notes.find(n => n.owner_email === email)?.owner_name || email}
              </button>
            ))}
          </div>
        )}
      </div>

      <div ref={listContainerRef} className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-ink-muted text-sm">
            <RefreshCw size={16} className="animate-spin mr-2" />
            Loading notes...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-ink-muted">
            <MessageSquare size={40} className="opacity-30 mb-3" />
            <p className="text-sm">No notes found</p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {filtered.map(note => (
              <div key={note.id} className="transition-colors hover:bg-input/20">
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === note.id ? null : note.id)}
                  className="w-full flex items-start gap-3 p-4 bg-transparent border-0 cursor-pointer text-left"
                >
                  <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary mt-0.5">
                    {note.owner_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink truncate">{note.title}</span>
                      {note.is_pinned && (
                        <span className="text-[0.6rem] bg-yellow-400/15 text-yellow-400 px-1.5 py-0.5 rounded-full font-bold">PINNED</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ink-muted mt-0.5">
                      <span className="font-medium">{note.owner_name}</span>
                      <span>·</span>
                      <span>{note.subject}</span>
                      <span>·</span>
                      <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-ink-muted mt-1 line-clamp-2 leading-relaxed">
                      {note.content?.slice(0, 200) || <span className="italic">Empty note</span>}
                    </p>
                  </div>
                  <div className="shrink-0 text-ink-muted mt-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${expandedId === note.id ? 'rotate-180' : ''}`}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </button>
                {expandedId === note.id && (
                  <div className="px-4 pb-4 pt-0 border-t border-line">
                    <div className="mt-3 p-3 bg-app rounded-lg">
                      <pre className="text-sm text-ink whitespace-pre-wrap font-sans leading-relaxed m-0">{note.content || <span className="italic text-ink-muted">No content</span>}</pre>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-ink-muted">
                      <span>User: {note.owner_name} ({note.owner_email})</span>
                      <span>Created: {new Date(note.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {isFetchingNotes && notes.length > 0 && (
          <div className="text-center py-4 text-xs text-ink-muted animate-pulse">
            Loading more notes...
          </div>
        )}
      </div>
    </div>
  );
};
