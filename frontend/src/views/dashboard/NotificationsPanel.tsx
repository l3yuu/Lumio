import React from 'react';
import { Bell, Check, CheckCheck, UserPlus, Share2, Trophy, X } from 'lucide-react';
import type { Notification, GroupInvitation } from '../../types';

interface NotificationsPanelProps {
  notifications: Notification[];
  invitations: GroupInvitation[];
  onAcceptInvitation: (id: number) => void;
  onDeclineInvitation: (id: number) => void;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  onRefresh: () => void;
}

const notifIcon = (type: string) => {
  switch (type) {
    case 'group_invite':
    case 'group_invite_accepted':
      return <UserPlus size={16} className="text-blue-400" />;
    case 'module_shared':
      return <Share2 size={16} className="text-purple-400" />;
    case 'quiz_completed':
      return <Trophy size={16} className="text-yellow-400" />;
    default:
      return <Bell size={16} className="text-ink-muted" />;
  }
};

const timeAgo = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return dateStr;
};

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications,
  invitations,
  onAcceptInvitation,
  onDeclineInvitation,
  onMarkAsRead,
  onMarkAllAsRead,
  onRefresh,
}) => {
  const unreadCount = notifications.filter(n => !n.is_read).length + invitations.length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-ink tracking-tight">Notifications</h2>
          {unreadCount > 0 && (
            <span className="text-xs font-bold bg-primary-soft text-primary px-2.5 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary bg-transparent border border-primary-line rounded-lg px-3 py-1.5 cursor-pointer transition-all duration-150 hover:bg-primary-soft"
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
          )}
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted bg-transparent border border-line rounded-lg px-3 py-1.5 cursor-pointer transition-all duration-150 hover:text-ink hover:bg-glass"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Pending group invitations */}
      {invitations.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-2">
            <UserPlus size={14} />
            Pending Circle Invitations
          </h3>
          {invitations.map(inv => (
            <div
              key={`inv-${inv.id}`}
              className="flex items-center gap-4 bg-card border border-line rounded-xl p-4"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                <UserPlus size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink">
                  {inv.inviter_name} invited you to <span className="text-primary">{inv.group_name}</span>
                </p>
                <p className="text-xs text-ink-muted mt-0.5">{inv.created_at}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => onAcceptInvitation(inv.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-primary text-ink-on-primary px-3 py-1.5 rounded-lg border-0 cursor-pointer transition-all duration-150 hover:bg-primary-hover"
                >
                  <Check size={14} />
                  Accept
                </button>
                <button
                  onClick={() => onDeclineInvitation(inv.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-transparent text-ink-muted border border-line px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-150 hover:text-ink hover:bg-glass"
                >
                  <X size={14} />
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* System notifications */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-2">
          <Bell size={14} />
          Activity Updates
        </h3>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell size={40} className="text-ink-muted/30 mb-3" />
            <p className="text-sm text-ink-muted">No notifications yet</p>
            <p className="text-xs text-ink-muted/60 mt-1">Activity from your groups and modules will appear here</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-150 cursor-pointer ${
                  !n.is_read
                    ? 'bg-primary-soft/30 border border-primary-line'
                    : 'bg-transparent border border-transparent hover:bg-glass'
                }`}
                onClick={() => { if (!n.is_read) onMarkAsRead(n.id); }}
              >
                <div className="mt-0.5">
                  {notifIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${!n.is_read ? 'font-bold text-ink' : 'font-medium text-ink-muted'}`}>
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
                    )}
                  </div>
                  {n.message && (
                    <p className="text-xs text-ink-muted mt-0.5 line-clamp-2">{n.message}</p>
                  )}
                  <p className="text-[0.65rem] text-ink-muted/60 mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {n.is_read ? (
                  <CheckCheck size={14} className="text-ink-muted/40 mt-1 shrink-0" />
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); onMarkAsRead(n.id); }}
                    className="bg-transparent border-0 text-ink-muted/40 hover:text-primary cursor-pointer p-0.5 mt-0.5 shrink-0 transition-colors"
                    title="Mark as read"
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
