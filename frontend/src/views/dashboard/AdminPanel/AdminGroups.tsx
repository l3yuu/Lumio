import { Search, MessageSquare } from 'lucide-react';
import type { AdminGroup } from './types';

interface Props {
  groups: AdminGroup[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onManageGroup: (g: AdminGroup) => void;
  onViewChat: (g: AdminGroup) => void;
}

export const AdminGroups = ({
  groups, searchQuery,
  onSearchChange, onManageGroup, onViewChat
}: Props) => {
  const filtered = groups.filter(g =>
    g.creator_email !== "System/Unknown" &&
    !g.creator_email.toLowerCase().endsWith('@example.com') && (
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.creator_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.creator_email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="flex-1 flex flex-col bg-card border border-line rounded-xl overflow-hidden shadow-lg">
      <div className="p-4 border-b border-line shrink-0 flex items-center bg-input/40 relative">
        <Search size={16} className="absolute left-7 text-ink-muted" />
        <input
          type="text"
          placeholder="Filter collaborative circles by name, creator, or email..."
          className="w-full py-2.5 pl-11 pr-4 bg-input border border-line rounded-lg text-sm text-ink outline-none transition focus:border-primary focus:bg-app"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-xs font-semibold text-ink-muted bg-input/20">
              <th className="p-4 pl-6">Group Name</th>
              <th className="p-4">Creator / Owner</th>
              <th className="p-4 text-center">Active Members</th>
              <th className="p-4 text-center">Linked Modules</th>
              <th className="p-4 pr-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-ink-muted text-sm">
                  No collaborative study groups found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="border-b border-line/60 hover:bg-glass/5 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{item.name}</span>
                      {item.is_banned && (
                        <span className="px-1.5 py-0.5 rounded text-[0.62rem] font-extrabold tracking-wide uppercase bg-danger/15 text-danger border border-danger-line/30">
                          Banned
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold block text-ink">{item.creator_name}</span>
                    <span className="text-xs text-ink-muted block">{item.creator_email}</span>
                  </td>
                  <td className="p-4 text-center font-bold">{item.members_count} Members</td>
                  <td className="p-4 text-center font-bold">{item.modules_count} Modules</td>
                  <td className="p-4 pr-6 text-right flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => onManageGroup(item)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-line text-ink-muted hover:text-primary hover:bg-primary-soft transition cursor-pointer"
                      title="Manage Study Group"
                    >
                      Manage
                    </button>

                    <button
                      type="button"
                      onClick={() => onViewChat(item)}
                      className="p-1.5 rounded-lg border border-line text-ink-muted hover:text-primary hover:bg-primary-soft transition cursor-pointer"
                      title="View Group Chat"
                    >
                      <MessageSquare size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
