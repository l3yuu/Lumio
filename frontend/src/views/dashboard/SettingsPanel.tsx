import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertTriangle, Globe, BookOpen, Target, Clock, User as UserIcon, AtSign, Trash2, ShieldAlert, LogOut, ShieldCheck, CreditCard, Loader2, X, Camera } from 'lucide-react';
import type { User, Module, View } from '../../types';
import { API_BASE_URL } from '../../config';

interface SettingsPanelProps {
  user: User;
  setUser: (user: User | null) => void;
  setModules: React.Dispatch<React.SetStateAction<Module[]>>;
  completeQuest: (actionType: 'custom' | 'custom_bulk', customId?: string, customIds?: string[]) => void;
  handleLogout: () => void;
  notifStudyGroup: boolean;
  notifQuizReminders: boolean;
  notifSounds: boolean;
  notifEmails: boolean;
  setNotifStudyGroup: (v: boolean) => void;
  setNotifQuizReminders: (v: boolean) => void;
  setNotifSounds: (v: boolean) => void;
  setNotifEmails: (v: boolean) => void;
  setView: (view: View) => void;
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
  user, setUser, setModules, completeQuest, handleLogout,
  notifStudyGroup, notifQuizReminders, notifSounds, notifEmails,
  setNotifStudyGroup, setNotifQuizReminders, setNotifSounds, setNotifEmails,
  setView,
}) => {
  // Local draft for profile — saved explicitly via "Save Changes"
  const [draft, setDraft] = useState<User>(user);
  const [toast, setToast] = useState<Toast | null>(null);
  const [bioLen, setBioLen] = useState(draft.bio?.length ?? 0);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const [billingLoading, setBillingLoading] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [tempAvatar, setTempAvatar] = useState(draft.avatar);

  const openAvatarModal = () => {
    setTempAvatar(draft.avatar);
    setAvatarModalOpen(true);
  };

  const handleManageSubscription = () => {
    setBillingLoading(true);
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${API_BASE_URL}/api/payments/create-portal-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Failed to open billing portal');
      return data;
    })
    .then(data => {
      if (data.mock) {
        alert('You clicked "Manage Subscription" in mock mode! To downgrade, use the "Simulate Downgrade" button below.');
        setBillingLoading(false);
      } else if (data.url) {
        window.location.href = data.url;
      }
    })
    .catch(err => {
      showToast('error', err.message);
      setBillingLoading(false);
    });
  };


  const handleLocalAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
      if (file.size > 2 * 1024 * 1024) { alert('File size exceeds 2MB limit.'); return; }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const avatarUrl = event.target.result as string;
          setTempAvatar(avatarUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3200);
  };

  const handleSaveProfile = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        name: draft.name,
        avatar: draft.avatar,
        school: draft.school,
        username: draft.username,
        bio: draft.bio,
        grade_level: draft.gradeLevel,
        study_goal: draft.studyGoal,
        study_language: draft.studyLanguage,
        timezone: draft.timezone,
        streak_goal: draft.streakGoal,
      })
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to update profile');
      return res.json();
    })
    .then(data => {
      const avatarChanged = draft.avatar !== user.avatar;
      const schoolChanged = draft.school !== user.school && !!draft.school;

      setUser({
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        school: data.school,
        username: data.username,
        bio: data.bio,
        gradeLevel: data.grade_level,
        studyGoal: data.study_goal,
        studyLanguage: data.study_language,
        streakGoal: data.streak_goal,
        timezone: data.timezone,
        is_verified: data.is_verified,
        level: data.level,
        xp: data.xp,
        streak: data.streak,
        quizzesCount: data.quizzes_count,
        quizHistory: data.quiz_history,
        studyTime: data.study_time,
        heatmapData: data.heatmap_data,
        focusAreas: data.focus_areas,
        spacedRecall: data.spaced_recall,
        quests: data.quests,
        questsDate: data.quests_date,
        lastCheckIn: data.last_check_in,
        folders: data.folders,
      });

      const completedQuestIds: string[] = [];
      if (avatarChanged) completedQuestIds.push('custom_avatar');
      if (schoolChanged) completedQuestIds.push('change_school');
      if (completedQuestIds.length > 0) {
        completeQuest('custom_bulk', undefined, completedQuestIds);
      }

      showToast('success', 'Profile updated successfully!');
    })
    .catch(err => showToast('error', err.message));
  };

  const handleDeleteModules = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE_URL}/api/modules`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to delete modules');
      setModules([]);
      showToast('success', 'All modules have been deleted.');
    })
    .catch(err => showToast('error', err.message));
  };

  const handleDeleteAccount = () => {
    if (deleteInput !== user.email) {
      showToast('error', 'Email does not match. Account not deleted.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE_URL}/api/auth/account`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to delete account');
      handleLogout();
    })
    .catch(err => showToast('error', err.message));
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
            className={`fixed bottom-6 right-6 z-9999 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border backdrop-blur-xl text-sm font-semibold ${
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

      {/* ─── Avatar Select Modal ─────────────────────────── */}
      <AnimatePresence>
        {avatarModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-3000 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-card border border-line rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative flex flex-col items-center"
            >
              {/* Close button */}
              <button
                type="button"
                onClick={() => setAvatarModalOpen(false)}
                className="absolute top-4 right-4 bg-transparent border-0 text-ink-muted hover:text-ink p-1.5 rounded-lg transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>

              {/* Header */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-ink m-0">Update Profile Picture</h3>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Choose a custom photo or pick one of our default avatars.
                </p>
              </div>

              {/* Profile preview */}
              <div className="relative mb-6">
                {tempAvatar ? (
                  <img
                    src={tempAvatar}
                    alt="Preview"
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary shadow-[0_0_24px_rgba(62,207,142,0.3)]"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-primary text-ink-on-primary flex items-center justify-center text-5xl font-bold border-4 border-transparent shadow-[0_0_24px_rgba(62,207,142,0.15)]">
                    {draft.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Presets and Upload button */}
              <div className="w-full flex flex-col gap-5">
                {/* Choose a preset */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-ink-muted text-center">Presets</span>
                  <div className="flex justify-center gap-3 flex-wrap">
                    {PRESET_AVATARS.map((url, idx) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => {
                          setTempAvatar(url);
                        }}
                        className={`p-0 rounded-full cursor-pointer w-11 h-11 overflow-hidden transition-all duration-200 border-2 ${
                          tempAvatar === url ? 'border-primary scale-110' : 'border-transparent hover:border-primary/50'
                        }`}
                      >
                        <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Your Own button */}
                <div className="flex flex-col gap-3">
                  <label className="btn btn-primary w-full py-3 text-sm font-semibold rounded-xl cursor-pointer flex items-center justify-center gap-2">
                    <Camera size={16} />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        handleLocalAvatarUpload(e);
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Action buttons */}
              <div className="w-full mt-6 pt-4 border-t border-line flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setUser({ ...user, avatar: tempAvatar });
                    setDraft(d => ({ ...d, avatar: tempAvatar }));
                    setAvatarModalOpen(false);
                  }}
                  className="btn btn-primary px-5 py-2 text-sm font-semibold rounded-lg"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
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
            <button
              type="button"
              onClick={openAvatarModal}
              className="group relative shrink-0 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card transition-all duration-200"
              aria-label="Change profile picture"
            >
              {draft.avatar ? (
                <img src={draft.avatar} alt={draft.name} referrerPolicy="no-referrer" className="w-20 h-20 rounded-full object-cover border-2 border-primary shadow-[0_0_14px_rgba(62,207,142,0.25)] group-hover:opacity-85 transition-opacity" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary text-ink-on-primary flex items-center justify-center text-3xl font-bold border-2 border-transparent shadow-[0_0_14px_rgba(62,207,142,0.15)] group-hover:opacity-85 transition-opacity">
                  {draft.name.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Camera size={18} className="text-white" />
                <span className="text-[0.62rem] font-bold text-white uppercase tracking-wider">Change</span>
              </div>
            </button>
            <div className="flex flex-col gap-1">
              <span className="text-[0.88rem] font-semibold text-ink">Click your picture to edit</span>
              <span className="text-[0.78rem] text-ink-muted">Supports JPG, PNG or presets. Max size 2MB.</span>
            </div>
          </div>
        </div>

        {/* Row 1: Display Name + Username + Email */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[0.88rem] text-ink">{item.label}</div>
              <div className="text-[0.75rem] text-ink-muted mt-0.5 leading-normal">{item.desc}</div>
            </div>
            <label className="toggle-switch shrink-0 ml-4">
              <input type="checkbox" checked={item.value} onChange={e => item.set(e.target.checked)} />
              <span className="toggle-slider"></span>
            </label>
          </div>
        ))}
      </div>

      {/* ─── Account Info ──────────────────────────────── */}
      <div className="bg-card border border-line rounded-xl p-6 flex flex-col gap-5 mt-6">
        <div className="flex items-center gap-2">
          <ShieldCheck size={17} className="text-primary" />
          <h3 className="text-[1.1rem] font-bold m-0">Account</h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
          <div>
            <div className="font-semibold text-[0.88rem] text-ink">Email Verification</div>
            <div className="text-[0.75rem] text-ink-muted mt-0.5">
              {user.is_verified ? 'Your email is verified' : 'Your email is not verified'}
            </div>
          </div>
          {user.is_verified ? (
            <span className="flex items-center justify-center gap-1.5 text-[0.8rem] font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full w-fit">
              <Check size={14} /> Verified
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5 text-[0.8rem] font-semibold text-yellow-400 bg-yellow-400/10 px-3 py-1.5 rounded-full w-fit">
              <AlertTriangle size={14} /> Unverified
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-[0.88rem] text-ink">Sign Out</div>
            <div className="text-[0.75rem] text-ink-muted mt-0.5">Sign out of your account on this device</div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-4 py-2 text-[0.82rem] font-semibold rounded-lg border border-line text-ink-muted hover:text-ink hover:border-primary/50 transition-all duration-150 cursor-pointer w-full sm:w-auto"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>

      {/* ─── Subscription & Billing ────────────────────── */}
      <div className="bg-card border border-line rounded-xl p-6 flex flex-col gap-5 mt-6">
        <div className="flex items-center gap-2">
          <CreditCard size={17} className="text-primary" />
          <h3 className="text-[1.1rem] font-bold m-0">Subscription & Billing</h3>
        </div>

        {user.role === 'superadmin' ? (
          <div className="p-4 rounded-xl bg-primary-soft/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-ink flex items-center gap-2">
                Admin – Full Pro Access
                <span className="text-[0.7rem] bg-primary/20 text-primary px-2.5 py-0.5 rounded-full font-bold">Active</span>
              </div>
              <div className="text-xs text-ink-muted mt-1 leading-relaxed">
                All Pro features are unlocked by default for administrator accounts. No payment required.
              </div>
            </div>
          </div>
        ) : user.is_premium ? (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-primary-soft/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-ink flex items-center gap-2">
                  Lumio Pro Student
                  <span className="text-[0.7rem] bg-primary/20 text-primary px-2.5 py-0.5 rounded-full font-bold">Active</span>
                </div>
                <div className="text-xs text-ink-muted mt-1 leading-relaxed">
                  {user.premium_expires_at ? (
                    `Fixed-term access (GCash/Maya Pass) • Expires on ${new Date(user.premium_expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
                  ) : (
                    `Subscribed via Credit Card • Status: ${user.stripe_subscription_status || 'active'}`
                  )}
                </div>
              </div>
              <button
                type="button"
                disabled={billingLoading}
                onClick={handleManageSubscription}
                className="flex items-center justify-center gap-2 px-4 py-2 text-[0.82rem] font-semibold rounded-lg bg-primary hover:bg-primary-hover text-ink-on-primary hover:shadow-glow-primary-btn disabled:opacity-50 transition-all cursor-pointer w-full sm:w-auto"
              >
                {billingLoading ? <Loader2 size={14} className="animate-spin" /> : 'Manage Subscription'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-app border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-ink">Free Plan</div>
                <div className="text-xs text-ink-muted mt-1">Upgrade to unlock unlimited document uploads, quiz generation, and AI Concept Tutors.</div>
              </div>
              <button
                type="button"
                onClick={() => setView('pricing')}
                className="flex items-center justify-center gap-2 px-5 py-2.5 text-[0.82rem] font-bold rounded-lg bg-primary hover:bg-primary-hover text-ink-on-primary hover:shadow-glow-primary-btn transition-all cursor-pointer w-full sm:w-auto shrink-0"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Security Settings ──────────────────────────── */}
      <div className="bg-card border border-line rounded-xl p-6 flex flex-col gap-5 mt-6">
        <h3 className="text-[1.1rem] font-bold flex items-center gap-2 m-0">Security Settings</h3>

        <form
          onSubmit={e => {
            e.preventDefault();
            if (newPassword !== confirmPassword) {
              showToast('error', 'New passwords do not match');
              return;
            }
            setPasswordLoading(true);
            const token = localStorage.getItem('token');
            fetch(`${API_BASE_URL}/api/auth/change-password`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
            })
            .then(res => {
              if (!res.ok) return res.json().then(err => { throw new Error(err.detail); });
              return res.json();
            })
            .then(() => {
              showToast('success', 'Password updated successfully!');
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            })
            .catch(err => showToast('error', err.message))
            .finally(() => setPasswordLoading(false));
          }}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.85rem] font-semibold text-ink">Current Password</label>
              <input type="password" className="w-full py-2 px-3 bg-input border border-line rounded-lg text-ink text-sm outline-none focus:border-primary focus:bg-app transition-all" placeholder="••••••••" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.85rem] font-semibold text-ink">New Password</label>
              <input type="password" className="w-full py-2 px-3 bg-input border border-line rounded-lg text-ink text-sm outline-none focus:border-primary focus:bg-app transition-all" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.85rem] font-semibold text-ink">Confirm New Password</label>
              <input type="password" className="w-full py-2 px-3 bg-input border border-line rounded-lg text-ink text-sm outline-none focus:border-primary focus:bg-app transition-all" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={passwordLoading} className="btn btn-outline px-5 py-2.5 text-[0.85rem] disabled:opacity-50 w-full sm:w-auto">
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-red-500/20">
          <div>
            <div className="font-semibold text-[0.88rem] text-ink flex items-center gap-1.5">
              <Trash2 size={14} className="text-red-400" /> Delete All Modules
            </div>
            <div className="text-[0.75rem] text-ink-muted mt-0.5">Permanently removes all uploaded study modules and quiz data.</div>
          </div>
          <button
            type="button"
            onClick={handleDeleteModules}
            className="px-4 py-2 text-[0.82rem] font-semibold rounded-lg border border-red-500/40 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all duration-150 cursor-pointer shrink-0 w-full sm:w-auto text-center"
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
              className="self-start px-4 py-2 text-[0.82rem] font-semibold rounded-lg border border-red-500/50 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all duration-150 cursor-pointer w-full sm:w-auto text-center"
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
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 text-[0.82rem] font-bold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all duration-150 cursor-pointer w-full sm:w-auto text-center"
                >
                  Permanently Delete Account
                </button>
                <button
                  type="button"
                  onClick={() => { setDeleteConfirm(false); setDeleteInput(''); }}
                  className="px-4 py-2 text-[0.82rem] font-semibold rounded-lg border border-line text-ink-muted hover:text-ink transition-all duration-150 cursor-pointer w-full sm:w-auto text-center"
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
