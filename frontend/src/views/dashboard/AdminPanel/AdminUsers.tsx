import { Search, Loader2, Trash2 } from 'lucide-react';
import type { User } from '../../../types';

interface Props {
  users: User[];
  searchQuery: string;
  submittingId: number | null;
  currentUser: User;
  onSearchChange: (q: string) => void;
  onRoleChange: (userId: number, targetRole: string, userName: string) => void;
  onDeleteUser: (user: User) => void;
  onSuspend: (userId: number, isSuspended: boolean, userName: string) => void;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  isFetchingMore?: boolean;
}

export const AdminUsers = ({
  users, searchQuery, submittingId, currentUser,
  onSearchChange, onRoleChange, onDeleteUser, onSuspend,
  onScroll, isFetchingMore
}: Props) => {
  const filtered = users.filter(u =>
    !u.email.toLowerCase().endsWith('@example.com') && (
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  return (
    <div className="flex-1 flex flex-col bg-card border border-line rounded-xl overflow-hidden shadow-lg">
      <div className="p-4 border-b border-line shrink-0 flex items-center bg-input/40 relative">
        <Search size={16} className="absolute left-7 text-ink-muted" />
        <input
          type="text"
          placeholder="Search accounts by name, username, or email..."
          className="w-full py-2.5 pl-11 pr-4 bg-input border border-line rounded-lg text-sm text-ink outline-none transition focus:border-primary focus:bg-app"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div onScroll={onScroll} className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-xs font-semibold text-ink-muted bg-input/20">
              <th className="p-4 pl-6">Account User</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role Status</th>
              <th className="p-4 text-center">Score / Level</th>
              <th className="p-4 text-center">Active Streak</th>
              <th className="p-4 pr-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink-muted text-sm">
                  No users matched search criteria.
                </td>
              </tr>
            ) : (
              filtered.map(item => (
                <tr key={item.id} className="border-b border-line/60 hover:bg-glass/5 transition-colors">
                  <td className="p-4 pl-6 flex items-center gap-3">
                    <img
                      src={item.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full border border-line object-cover"
                    />
                    <div>
                      <span className="font-semibold text-ink block">{item.name}</span>
                      <span className="text-xs text-ink-muted block">@{item.username || 'user'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-ink-muted">{item.email}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[0.7rem] font-extrabold tracking-wide uppercase ${
                        item.role === 'superadmin'
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : item.role === 'premium'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-line text-ink-muted'
                      }`}>
                        {item.role || 'user'}
                      </span>
                      {item.is_suspended && (
                        <span className="px-2 py-0.5 rounded text-[0.7rem] font-extrabold tracking-wide uppercase bg-red-500/10 text-red-500 border border-red-500/20">
                          Suspended
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-bold">Lvl {item.level || 1}</span>
                    <span className="text-[0.7rem] text-ink-muted block">{item.xp || 0} XP</span>
                  </td>
                  <td className="p-4 text-center font-bold text-orange-500">
                    {item.streak || 0} 🔥
                  </td>
                  <td className="p-4 pr-6 text-right flex items-center justify-end gap-2.5">
                    {item.role !== 'superadmin' && (
                      <button
                        disabled={submittingId === item.id}
                        onClick={() => item.id && onRoleChange(item.id, item.role === 'premium' ? 'user' : 'premium', item.name)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer disabled:opacity-40 ${
                          item.role === 'premium'
                            ? 'bg-transparent text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/10'
                            : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-500'
                        }`}
                      >
                        {item.role === 'premium' ? 'Remove Pro' : 'Make Pro'}
                      </button>
                    )}

                    <button
                      disabled={submittingId === item.id || item.id === currentUser.id}
                      onClick={() => item.id && onRoleChange(item.id, item.role === 'superadmin' ? 'user' : 'superadmin', item.name)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer disabled:opacity-40 ${
                        item.role === 'superadmin'
                          ? 'bg-transparent text-primary border-primary/20 hover:bg-primary-soft'
                          : 'bg-primary text-ink-on-primary border-primary hover:bg-primary-hover'
                      }`}
                    >
                      {item.role === 'superadmin' ? 'Demote Admin' : 'Promote Admin'}
                    </button>

                    {item.id !== currentUser.id && (
                      <button
                        disabled={submittingId === item.id}
                        onClick={() => item.id && onSuspend(item.id, !item.is_suspended, item.name)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer disabled:opacity-40 ${
                          item.is_suspended
                            ? 'bg-transparent text-amber-500 border-amber-500/20 hover:bg-amber-500/10'
                            : 'bg-amber-600 text-white border-amber-600 hover:bg-amber-500'
                        }`}
                        title={item.is_suspended ? 'Unsuspend User' : 'Suspend User'}
                      >
                        {item.is_suspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                    )}

                    <button
                      disabled={submittingId === item.id || item.id === currentUser.id}
                      onClick={() => item.id && onDeleteUser(item)}
                      className="p-1.5 rounded-lg border border-danger-line text-danger hover:bg-danger-soft transition cursor-pointer disabled:opacity-40"
                      title="Delete User"
                    >
                      {submittingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {isFetchingMore && (
          <div className="text-center py-4 text-xs text-ink-muted animate-pulse">
            Loading more users...
          </div>
        )}
      </div>
    </div>
  );
};
