import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertTriangle, Globe, BookOpen, Target, Clock, User as UserIcon, AtSign, Trash2, ShieldAlert } from 'lucide-react';
import type { User } from '../../types';

interface SettingsPanelProps {
  user: User;
  setUser: (user: User | null) => void;
  handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  completeQuest: (actionType: 'custom', customId?: string) => void;
  notifStudyGroup: boolean;
  notifQuizReminders: boolean;
  notifSounds: boolean;
  notifEmails: boolean;
  setNotifStudyGroup: (v: boolean) => void;
  setNotifQuizReminders: (v: boolean) => void;
  setNotifSounds: (v: boolean) => void;
  setNotifEmails: (v: boolean) => void;
}

const GRADE_LEVELS = ['High School', 'Undergraduate', 'Graduate', 'PhD / Doctorate', 'Self-Learner', 'Professional'];
const STUDY_GOALS = ['🎓 Exam Prep', '📈 Skill Building', '🏫 Course Work', '📝 Certification', '🔬 Research', '💼 Career Growth'];
const LANGUAGES = ['English', 'Filipino', 'Spanish', 'French', 'German', 'Japanese', 'Mandarin', 'Arabic', 'Portuguese'];
const STREAK_GOALS = [15, 30, 60, 90, 120];
const TIMEZONES = [
  'UTC−12:00', 'UTC−11:00', 'UTC−10:00', 'UTC−9:00', 'UTC−8:00', 'UTC−7:00',
  'UTC−6:00', 'UTC−5:00', 'UTC−4:00', 'UTC−3:00', 'UTC−2:00', 'UTC−1:00',
  'UTC+0:00', 'UTC+1:00', 'UTC+2:00', 'UTC+3:00', 'UTC+4:00', 'UTC+5:00',
  'UTC+5:30', 'UTC+6:00', 'UTC+7:00', 'UTC+8:00 (PHT)', 'UTC+9:00', 'UTC+10:00',
  'UTC+11:00', 'UTC+12:00',
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80',
];

type ToastType = 'success' | 'error';
interface Toast { type: ToastType; message: string; }

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  user, setUser, handleAvatarUpload, completeQuest,
  notifStudyGroup, notifQuizReminders, notifSounds, notifEmails,
  setNotifStudyGroup, setNotifQuizReminders, setNotifSounds, setNotifEmails,
}) => {
  // Local draft for profile — saved explicitly via "Save Changes"
  const [draft, setDraft] = useState<User>(user);
  const [toast, setToast] = useState<Toast | null>(null);
  const [bioLen, setBioLen] = useState(draft.bio?.length ?? 0);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  // Keep draft in sync if user changes externally (e.g., avatar preset click)
  useEffect(() => { setDraft(u => ({ ...u, avatar: user.avatar })); }, [user.avatar]);

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3200);
  };

  const handleSaveProfile = () => {
    setUser({ ...user, ...draft });
    completeQuest('custom', 'custom_avatar');
    showToast('success', 'Profile updated successfully!');
  };

  const handleDeleteModules = () => {
    showToast('success', 'All modules have been deleted.');
  };

  const handleDeleteAccount = () => {
    if (deleteInput !== user.email) {
      showToast('error', 'Email does not match. Account not deleted.');
      return;
    }
    setUser(null);
  };

  return (
    <>
      {/* ─── Save Toast ─────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="settings-toast"
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border backdrop-blur-xl text-sm font-semibold ${
              toast.type === 'success'
                ? 'bg-[rgba(18,18,18,0.9)] border-primary/40 text-primary'
                : 'bg-[rgba(18,18,18,0.9)] border-red-500/40 text-red-400'
            }`}
          >
            {toast.type === 'success'
              ? <Check size={16} className="shrink-0" />
              : <AlertTriangle size={16} className="shrink-0" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Profile Settings ───────────────────────────── */}
      <div className="bg-card border border-line rounded-xl p-6 flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <UserIcon size={17} className="text-primary" />
          <h3 className="text-[1.1rem] font-bold m-0">Profile Settings</h3>
        </div>

        {/* Avatar */}
        <div>
          <label className="text-[0.85rem] font-semibold text-ink mb-3 block">Profile Picture</label>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="relative shrink-0">
              {draft.avatar ? (
                <img src={draft.avatar} alt={draft.name} className="w-20 h-20 rounded-full object-cover border-2 border-primary shadow-[0_0_14px_rgba(62,207,142,0.25)]" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary text-ink-on-primary flex items-center justify-center text-3xl font-bold">
                  {draft.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[0.78rem] text-ink-muted">Choose a preset or upload your own:</span>
              <div className="flex items-center gap-3 flex-wrap">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { setUser({ ...user, avatar: url }); setDraft(d => ({ ...d, avatar: url })); }}
                    className={`p-0 rounded-full cursor-pointer w-10 h-10 overflow-hidden transition-all duration-200 border-2 ${draft.avatar === url ? 'border-primary scale-110' : 'border-transparent hover:border-primary/50'}`}
                  >
                    <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
                <label className="btn btn-outline px-3 py-2 text-[0.78rem] rounded-full cursor-pointer inline-flex items-center gap-1 h-10 box-border">
                  <span>+ Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { handleAvatarUpload(e); }} />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Row 1: Display Name + Username + Email */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.85rem] font-semibold text-ink">Display Name</label>
            <input
              type="text"
              className="w-full py-2 px-3 bg-input border border-line rounded-lg text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app"
              value={draft.name}
              onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
              placeholder="Your full name"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.85rem] font-semibold text-ink flex items-center gap-1.5">
              <AtSign size={13} className="text-ink-muted" /> Username
            </label>
            <input
              type="text"
              className="w-full py-2 px-3 bg-input border border-line rounded-lg text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app"
              value={draft.username ?? ''}
              onChange={e => setDraft(d => ({ ...d, username: e.target.value.replace(/\s/g, '') }))}
              placeholder="@handle shown in groups"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.85rem] font-semibold text-ink">Email Address</label>
            <input
              type="text"
              className="w-full py-2 px-3 bg-input border border-line rounded-lg text-ink text-sm opacity-55 cursor-not-allowed"
              value={user.email}
              disabled
            />
          </div>
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[0.85rem] font-semibold text-ink">Bio</label>
            <span className={`text-[0.75rem] ${bioLen > 145 ? 'text-yellow-400' : 'text-ink-muted'}`}>{bioLen}/160</span>
          </div>
          <textarea
            className="w-full py-2.5 px-3 bg-input border border-line rounded-lg text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app resize-none leading-relaxed"
            rows={3}
            maxLength={160}
            value={draft.bio ?? ''}
            onChange={e => { setDraft(d => ({ ...d, bio: e.target.value })); setBioLen(e.target.value.length); }}
            placeholder="A short intro about yourself — shows on your group profile card…"
          />
        </div>

        {/* Row 2: School + Grade Level */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.85rem] font-semibold text-ink">School / Institution</label>
            <input
              type="text"
              className="w-full py-2 px-3 bg-input border border-line rounded-lg text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app"
              value={draft.school ?? ''}
              onChange={e => setDraft(d => ({ ...d, school: e.target.value }))}
              placeholder="e.g. University of the Philippines"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.85rem] font-semibold text-ink">Grade Level / Year</label>
            <select
              className="w-full py-2 px-3 bg-input border border-line rounded-lg text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app cursor-pointer"
              value={draft.gradeLevel ?? ''}
              onChange={e => setDraft(d => ({ ...d, gradeLevel: e.target.value }))}
            >
              <option value="">Select level…</option>
              {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        {/* Row 3: Study Goal + Language + Timezone */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.85rem] font-semibold text-ink flex items-center gap-1.5">
              <Target size={13} className="text-ink-muted" /> Study Goal
            </label>
            <select
              className="w-full py-2 px-3 bg-input border border-line rounded-lg text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app cursor-pointer"
              value={draft.studyGoal ?? ''}
              onChange={e => setDraft(d => ({ ...d, studyGoal: e.target.value }))}
            >
              <option value="">Select goal…</option>
              {STUDY_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.85rem] font-semibold text-ink flex items-center gap-1.5">
              <BookOpen size={13} className="text-ink-muted" /> Study Language
            </label>
            <select
              className="w-full py-2 px-3 bg-input border border-line rounded-lg text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app cursor-pointer"
              value={draft.studyLanguage ?? ''}
              onChange={e => setDraft(d => ({ ...d, studyLanguage: e.target.value }))}
            >
              <option value="">Select language…</option>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.85rem] font-semibold text-ink flex items-center gap-1.5">
              <Globe size={13} className="text-ink-muted" /> Timezone
            </label>
            <select
              className="w-full py-2 px-3 bg-input border border-line rounded-lg text-ink text-sm transition-all duration-150 outline-none focus:border-primary focus:bg-app cursor-pointer"
              value={draft.timezone ?? 'UTC+8:00 (PHT)'}
              onChange={e => setDraft(d => ({ ...d, timezone: e.target.value }))}
            >
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
        </div>

        {/* Daily Streak Goal */}
        <div className="flex flex-col gap-2">
          <label className="text-[0.85rem] font-semibold text-ink flex items-center gap-1.5">
            <Clock size={13} className="text-ink-muted" /> Daily Study Goal
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            {STREAK_GOALS.map(mins => (
              <button
                key={mins}
                type="button"
                onClick={() => setDraft(d => ({ ...d, streakGoal: mins }))}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-150 cursor-pointer ${
                  draft.streakGoal === mins
                    ? 'bg-primary-soft border-primary text-primary'
                    : 'bg-input border-line text-ink-muted hover:border-primary/50'
                }`}
              >
                {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
              </button>
            ))}
            <span className="text-[0.75rem] text-ink-muted ml-1">per day</span>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-1 border-t border-line">
          <button
            type="button"
            onClick={handleSaveProfile}
            className="btn btn-primary px-6 py-2.5 text-[0.88rem] font-bold flex items-center gap-2"
          >
            <Check size={15} />
            Save Changes
          </button>
        </div>
      </div>

      {/* ─── Notification Settings ──────────────────────── */}
      <div className="bg-card border border-line rounded-xl p-6 flex flex-col gap-5 mt-6">
        <h3 className="text-[1.1rem] font-bold flex items-center gap-2 m-0">
          Notification Settings
        </h3>

        {[
          { label: 'Study Group Activity', desc: 'Notify me when members share new modules or start sessions', value: notifStudyGroup, set: setNotifStudyGroup },
          { label: 'Practice Quiz Reminders', desc: 'Remind me of due spaced repetition cards and revision targets', value: notifQuizReminders, set: setNotifQuizReminders },
          { label: 'Notification Sound Alerts', desc: 'Play a subtle sound when a new alert dropdown pops up', value: notifSounds, set: setNotifSounds },
          { label: 'Email Digest Reports', desc: 'Receive a weekly recap of your study hours, progress and group stats', value: notifEmails, set: setNotifEmails },
        ].map((item, i, arr) => (
          <div key={item.label} className={`flex justify-between items-center ${i < arr.length - 1 ? 'pb-4 border-b border-line' : ''}`}>
            <div>
              <div className="font-semibold text-[0.88rem] text-ink">{item.label}</div>
              <div className="text-[0.75rem] text-ink-muted mt-0.5">{item.desc}</div>
            </div>
            <label className="toggle-switch shrink-0 ml-4">
              <input type="checkbox" checked={item.value} onChange={e => item.set(e.target.checked)} />
              <span className="toggle-slider"></span>
            </label>
          </div>
        ))}
      </div>

      {/* ─── Security Settings ──────────────────────────── */}
      <div className="bg-card border border-line rounded-xl p-6 flex flex-col gap-5 mt-6">
        <h3 className="text-[1.1rem] font-bold flex items-center gap-2 m-0">Security Settings</h3>

        <form
          onSubmit={e => { e.preventDefault(); showToast('success', 'Password updated successfully!'); (e.target as HTMLFormElement).reset(); }}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.85rem] font-semibold text-ink">Current Password</label>
              <input type="password" className="w-full py-2 px-3 bg-input border border-line rounded-lg text-ink text-sm outline-none focus:border-primary focus:bg-app transition-all" placeholder="••••••••" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.85rem] font-semibold text-ink">New Password</label>
              <input type="password" className="w-full py-2 px-3 bg-input border border-line rounded-lg text-ink text-sm outline-none focus:border-primary focus:bg-app transition-all" placeholder="••••••••" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.85rem] font-semibold text-ink">Confirm New Password</label>
              <input type="password" className="w-full py-2 px-3 bg-input border border-line rounded-lg text-ink text-sm outline-none focus:border-primary focus:bg-app transition-all" placeholder="••••••••" required />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn btn-outline px-5 py-2.5 text-[0.85rem]">Update Password</button>
          </div>
        </form>
      </div>

      {/* ─── Danger Zone ────────────────────────────────── */}
      <div className="border border-red-500/30 bg-red-500/5 rounded-xl p-6 flex flex-col gap-5 mt-6">
        <div className="flex items-center gap-2">
          <ShieldAlert size={17} className="text-red-400" />
          <h3 className="text-[1.1rem] font-bold text-red-400 m-0">Danger Zone</h3>
        </div>
        <p className="text-[0.8rem] text-ink-muted m-0">These actions are irreversible. Please proceed with caution.</p>

        {/* Delete all modules */}
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-red-500/20 flex-wrap">
          <div>
            <div className="font-semibold text-[0.88rem] text-ink flex items-center gap-1.5">
              <Trash2 size={14} className="text-red-400" /> Delete All Modules
            </div>
            <div className="text-[0.75rem] text-ink-muted mt-0.5">Permanently removes all uploaded study modules and quiz data.</div>
          </div>
          <button
            type="button"
            onClick={handleDeleteModules}
            className="px-4 py-2 text-[0.82rem] font-semibold rounded-lg border border-red-500/40 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all duration-150 cursor-pointer shrink-0"
          >
            Delete All Modules
          </button>
        </div>

        {/* Delete account */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="font-semibold text-[0.88rem] text-red-400 flex items-center gap-1.5">
              <AlertTriangle size={14} /> Delete Account
            </div>
            <div className="text-[0.75rem] text-ink-muted mt-0.5">Permanently deletes your account, all data, and removes you from all groups.</div>
          </div>

          {!deleteConfirm ? (
            <button
              type="button"
              onClick={() => setDeleteConfirm(true)}
              className="self-start px-4 py-2 text-[0.82rem] font-semibold rounded-lg border border-red-500/50 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all duration-150 cursor-pointer"
            >
              I want to delete my account
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30"
            >
              <p className="text-[0.8rem] text-red-300 m-0">
                Type your email <span className="font-bold text-red-200">{user.email}</span> to confirm deletion:
              </p>
              <input
                type="email"
                className="w-full py-2 px-3 bg-[rgba(0,0,0,0.3)] border border-red-500/40 rounded-lg text-ink text-sm outline-none focus:border-red-400 transition-all"
                placeholder={user.email}
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 text-[0.82rem] font-bold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all duration-150 cursor-pointer"
                >
                  Permanently Delete Account
                </button>
                <button
                  type="button"
                  onClick={() => { setDeleteConfirm(false); setDeleteInput(''); }}
                  className="px-4 py-2 text-[0.82rem] font-semibold rounded-lg border border-line text-ink-muted hover:text-ink transition-all duration-150 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};
