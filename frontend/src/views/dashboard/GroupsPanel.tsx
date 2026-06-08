import React from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import type { User, Module, StudyGroup } from '../../types';

interface GroupsPanelProps {
  groups: StudyGroup[];
  user: User;
  selectedGroupId: number | null;
  setSelectedGroupId: (id: number | null) => void;
  startGroupQuiz: (module: Module, groupId: number) => void;
  completeQuest: (actionType: 'study_group') => void;
  setIsGroupModalOpen: (v: boolean) => void;
}

export const GroupsPanel: React.FC<GroupsPanelProps> = ({
  groups, user, selectedGroupId, setSelectedGroupId, startGroupQuiz, completeQuest, setIsGroupModalOpen,
}) => {
  if (selectedGroupId !== null) {
    const activeGroup = groups.find(g => g.id === selectedGroupId);
    if (!activeGroup) return null;

    return (
      <div>
        <div className="bg-[linear-gradient(135deg,rgba(62,207,142,0.04),rgba(6,182,212,0.04))] border border-line rounded-xl p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <button onClick={() => setSelectedGroupId(null)} className="btn btn-outline border-none bg-transparent hover:bg-glass text-ink-muted hover:text-ink px-3 py-1.5 text-xs mb-4 inline-flex items-center gap-1">
                &larr; Back to Groups
              </button>
              <h2 className="text-[1.8rem] mb-1">{activeGroup.name}</h2>
              <p className="text-ink-muted text-[0.9rem]">Collaborative Study Room</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="inline-flex items-center gap-1 text-[0.7rem] font-bold uppercase tracking-wider py-1 px-2.5 rounded-full border bg-primary-soft text-primary border-primary-line">Group Active</span>
              <span className="text-[0.8rem] text-ink-muted">{activeGroup.members.length + 1} online study partners</span>
            </div>
          </div>

          <div className="flex items-center">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-glass-strong border-2 border-primary -ml-2 first:ml-0 text-primary object-cover" title={`${user.name} (You)`} />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-primary text-ink-on-primary border-2 border-primary -ml-2 first:ml-0" title={`${user.name} (You)`}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            {activeGroup.members.map((m, idx) => (
              <div key={idx} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-glass-strong border-2 -ml-2 first:ml-0 ${m.online ? 'border-primary text-primary' : 'border-card text-ink'}`} title={`${m.name} (${m.online ? 'Online' : 'Offline'})`}>
                {m.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
          <div className="bg-card border border-line rounded-xl p-5">
            <h3 className="text-[1.15rem] mb-5 flex items-center gap-2">Shared Modules</h3>
            {activeGroup.modules.length === 0 ? (
              <div className="text-center p-8 text-ink-muted">No shared modules in this group yet. Add a module to start studying together!</div>
            ) : (
              <div className="flex flex-col gap-3">
                {activeGroup.modules.map((m) => (
                  <div className="flex justify-between items-center bg-app border border-line rounded-lg p-4 px-5" key={m.id}>
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-base">{m.name}</span>
                      <div className="text-[0.75rem] text-ink-muted flex gap-4"><span>Questions: {m.questionsCount}</span></div>
                    </div>
                    <button onClick={() => startGroupQuiz(m, activeGroup.id)} className="btn btn-primary px-3.5 py-2 text-[0.8rem]">Take Group Quiz</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-line rounded-xl p-5">
            <h3 className="text-[1.15rem] mb-5 flex items-center gap-2">Group Scorecards</h3>
            {activeGroup.quizSessions.length === 0 ? (
              <div className="text-center p-8 text-ink-muted">No group quizzes taken yet. Launch a Group Quiz session to view scoreboard history!</div>
            ) : (
              <div className="flex flex-col gap-4">
                {activeGroup.quizSessions.map((s, idx) => (
                  <div key={idx} className="bg-app border border-line rounded-xl p-4 px-5">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-[0.95rem]">{s.moduleName}</span>
                      <span className="inline-flex items-center gap-1 text-[0.7rem] font-bold uppercase tracking-wider py-1 px-2.5 rounded-full border bg-primary-soft text-primary border-primary-line">Avg: {s.avgScore}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {s.rankings.map((rank, rankIdx) => (
                        <span key={rankIdx} className="text-[0.75rem] bg-glass border border-line rounded-md p-1 px-2">{rank.name.split(' ')[0]}: <strong>{rank.score}</strong></span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[1.15rem] flex items-center gap-2 m-0">My Study Groups</h3>
        <button onClick={() => setIsGroupModalOpen(true)} className="btn btn-primary">
          <Plus size={18} /> Create Study Group
        </button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
        {groups.map((group) => (
          <div className="bg-card border border-line rounded-xl p-5 flex flex-col h-full" key={group.id}>
            <h4 className="text-xl mb-2">{group.name}</h4>
            <span className="text-[0.85rem] text-ink-muted">{group.members.length} Members | {group.modules.length} Shared Modules</span>

            <div className="flex items-center mt-3">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-glass-strong border-2 border-primary -ml-2 first:ml-0 text-primary object-cover" title={`${user.name} (You)`} />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-primary text-ink-on-primary border-2 border-primary -ml-2 first:ml-0" title={`${user.name} (You)`}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              {group.members.map((m, idx) => (
                <div key={idx} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-glass-strong border-2 -ml-2 first:ml-0 ${m.online ? 'border-primary text-primary' : 'border-card text-ink'}`} title={`${m.name} (${m.online ? 'Online' : 'Offline'})`}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>

            <div className="mt-auto pt-4 flex justify-end">
              <button onClick={() => { setSelectedGroupId(group.id); completeQuest('study_group'); }} className="btn btn-outline inline-flex items-center gap-1 px-4 py-2 text-[0.85rem]">
                Enter Group <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
