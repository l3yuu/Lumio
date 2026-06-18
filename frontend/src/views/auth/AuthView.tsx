import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Eye, EyeOff, Check, AlertTriangle } from 'lucide-react';
import type { View, AuthTab, User, UserResponse } from '../../types';
import { API_BASE_URL } from '../../config';

const mapUser = (data: UserResponse): User => ({
  id: data.id,
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
  role: data.role || 'user',
});

type AuthScreen = 'login' | 'signup' | 'verify' | 'forgot' | 'forgot-sent' | 'reset';

class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface AuthViewProps {
  authTab: AuthTab;
  setAuthTab: (tab: AuthTab) => void;
  setView: (view: View) => void;
  onLoginSuccess: (user: User, token: string) => void;
}

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 24 }),
  center: { opacity: 1, x: 0 },
  exit:  (dir: number) => ({ opacity: 0, x: dir * -24 }),
};

export const AuthView: React.FC<AuthViewProps> = ({ authTab, setAuthTab, setView, onLoginSuccess }) => {
  const [formName, setFormName]         = useState('');
  const [formEmail, setFormEmail]       = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [resetEmail, setResetEmail]     = useState('');
  const [resetCode, setResetCode]       = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [pendingToken, setPendingToken] = useState('');
  const [verifyCode, setVerifyCode]     = useState('');
  const [verifyEmail, setVerifyEmail]   = useState('');
  const [screen, setScreen]             = useState<AuthScreen>(authTab === 'signup' ? 'signup' : 'login');
  const [slideDir, setSlideDir]         = useState(1);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const googleInitialized = useRef(false);

  interface GoogleWindow extends Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (res: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: { theme?: string; size?: string; width?: number; type?: string; shape?: string; text?: string; logo_alignment?: string }) => void;
          prompt: () => void;
        };
      };
    };
  }

  const renderGoogleButton = useCallback(() => {
    const google = (window as GoogleWindow).google;
    if (!google?.accounts) return;
    const btnElem = document.getElementById("google-signin-button");
    if (btnElem) {
      btnElem.innerHTML = '';
      google.accounts.id.renderButton(btnElem, {
        theme: "outline",
        size: "large",
        width: btnElem.clientWidth || 380,
        type: "standard",
        shape: "rectangular",
        text: "continue_with",
        logo_alignment: "left"
      });
    }
  }, []);

  // Countdown timer for rate-limit cooldown
  useEffect(() => {
    if (cooldownUntil === null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownLeft(left);
      if (left <= 0) setCooldownUntil(null);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const go = (next: AuthScreen, dir = 1) => {
    setSlideDir(dir);
    setScreen(next);
    if (next === 'login' || next === 'signup') setAuthTab(next);
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3200);
  };

  const completeLogin = useCallback((token: string, userData?: UserResponse) => {
    if (userData) {
      onLoginSuccess(mapUser(userData), token);
      return;
    }

    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      onLoginSuccess(mapUser(data), token);
    });
  }, [onLoginSuccess]);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail || !formPassword || (screen === 'signup' && !formName)) {
      showToast('error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    const endpoint = screen === 'signup' ? '/api/auth/register' : '/api/auth/login';
    const payload = screen === 'signup'
      ? { email: formEmail, password: formPassword, name: formName }
      : { email: formEmail, password: formPassword };

    fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(async res => {
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new HttpError(data?.detail || 'Authentication failed', res.status);
      }
      return data;
    })
    .then(data => {
      if (!data) return;
      const token = data.access_token;
      
      if (screen === 'signup') {
        setPendingToken(token);
        setVerifyEmail(formEmail);
        setLoading(false);
        go('verify', 1);
        return;
      }
      
      completeLogin(token, data.user);
    })
    .catch(err => {
      if (err instanceof HttpError && err.status === 429) setCooldownUntil(Date.now() + 30000);
      setLoading(false);
      showToast('error', err.message);
    });
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetMessage('');
    fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resetEmail })
    })
    .then(async res => {
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new HttpError(data?.detail || 'Request failed', res.status);
      }
      return res.json();
    })
    .then(() => go('forgot-sent', 1))
    .catch(err => {
      if (err instanceof HttpError && err.status === 429) setCooldownUntil(Date.now() + 30000);
      showToast('error', err.message);
    });
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode || !resetPassword) return;
    setResetMessage('');
    fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resetEmail, code: resetCode, new_password: resetPassword })
    })
    .then(async res => {
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new HttpError(data?.detail || 'Reset failed', res.status);
      }
      return res.json();
    })
    .then(() => {
      setResetMessage('Password reset successfully!');
      setTimeout(() => go('login', 1), 2000);
    })
    .catch(err => {
      if (err instanceof HttpError && err.status === 429) setCooldownUntil(Date.now() + 30000);
      showToast('error', err.message);
    });
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode) return;
    fetch(`${API_BASE_URL}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: verifyEmail, code: verifyCode })
    })
    .then(async res => {
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new HttpError(data?.detail || 'Verification failed', res.status);
      }
      return res.json();
    })
    .then(data => {
      const token = data.access_token || pendingToken;
      completeLogin(token, data.user);
    })
    .catch(err => {
      if (err instanceof HttpError && err.status === 429) setCooldownUntil(Date.now() + 30000);
      showToast('error', err.message);
    });
  };

  const handleGoogleCredentialResponse = useCallback((response: { credential: string }) => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: response.credential })
    })
    .then(async res => {
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new HttpError(data?.detail || 'Google sign in failed', res.status);
      }
      return data;
    })
    .then(data => {
      if (!data) return;
      const token = data.access_token;
      completeLogin(token, data.user);
    })
    .catch(err => {
      setLoading(false);
      showToast('error', err.message);
    });
  }, [completeLogin]);

  useEffect(() => {
    if (screen !== 'login' && screen !== 'signup') return;
    
      const initializeGoogleSignIn = () => {
        if (googleInitialized.current) return;
        const google = (window as GoogleWindow).google;
        if (google && google.accounts) {
          try {
            const client_id = import.meta.env.VITE_GOOGLE_CLIENT_ID;
            if (!client_id) {
              console.error("Missing VITE_GOOGLE_CLIENT_ID. Google Sign-In requires an OAuth Web client ID.");
              return;
            }
            googleInitialized.current = true;
            google.accounts.id.initialize({
              client_id: client_id,
              callback: handleGoogleCredentialResponse,
            });
            renderGoogleButton();
          } catch (e) {
            googleInitialized.current = false;
            console.error("Failed to initialize Google Sign-In:", e);
          }
        }
      };

    const google = (window as GoogleWindow).google;
    if (google && google.accounts) {
      initializeGoogleSignIn();
      return;
    }

    const timer = setInterval(() => {
      const g = (window as GoogleWindow).google;
      if (g && g.accounts) {
        clearInterval(timer);
        initializeGoogleSignIn();
      }
    }, 500);

    return () => clearInterval(timer);
  }, [screen, handleGoogleCredentialResponse, renderGoogleButton]);

  // Re-render Google button when screen changes (AnimatePresence defers new DOM until exit animation finishes)
  useEffect(() => {
    if (screen !== 'login' && screen !== 'signup') return;
    if (!googleInitialized.current) return;
    const id = setInterval(() => {
      const btnElem = document.getElementById("google-signin-button");
      if (btnElem && btnElem.offsetParent !== null) {
        clearInterval(id);
        renderGoogleButton();
      }
    }, 50);
    return () => clearInterval(id);
  }, [screen, renderGoogleButton]);


  const formContent = () => {
    /* ── Forgot sent ── */
    if (screen === 'forgot-sent') {
      return (
        <div className="flex flex-col items-center text-center gap-5">
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
            <Mail size={28} className="text-primary" />
          </div>
          <div>
            <h1 className="text-[2rem] font-bold tracking-[-0.03em] text-ink mb-2">Check your inbox</h1>
            <p className="text-ink-muted text-[0.95rem] leading-relaxed">
              We sent a password reset link to<br />
              <span className="text-ink font-medium">{resetEmail}</span>
            </p>
          </div>
            <p className="text-ink-muted text-[0.85rem]">
              Didn't get it?{' '}
              <button
                type="button"
                onClick={() => go('forgot', -1)}
                className="bg-transparent border-0 text-primary font-medium cursor-pointer p-0"
              >
                Try again
              </button>
            </p>
            <button
              type="button"
              onClick={() => go('reset', 1)}
              className="bg-transparent border-0 text-primary font-medium cursor-pointer p-0 text-sm"
            >
              I have a reset code
            </button>
            <button
              type="button"
              onClick={() => go('login', -1)}
              className="inline-flex items-center justify-center w-full gap-2 text-sm p-[0.85rem] rounded-md font-bold transition-all duration-150 border border-transparent cursor-pointer bg-primary text-ink-on-primary hover:bg-primary-hover mt-2"
            >
              Back to Sign in
            </button>
        </div>
      );
    }

    /* ── Verify email ── */
    if (screen === 'verify') {
      return (
        <div className="flex flex-col items-center text-center gap-5">
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
            <Mail size={28} className="text-primary" />
          </div>
          <div>
            <h1 className="text-[2rem] font-bold tracking-[-0.03em] text-ink mb-2">Check your inbox</h1>
            <p className="text-ink-muted text-[0.95rem] leading-relaxed">
              We sent a 6-digit code to<br />
              <span className="text-ink font-medium">{verifyEmail}</span>
            </p>
          </div>
          <form onSubmit={handleVerifySubmit} className="flex flex-col gap-5 w-full">
            <div className="flex flex-col gap-[0.35rem]">
              <label className="block text-[0.85rem] font-medium text-ink-muted">Verification code</label>
              <input
                type="text"
                placeholder="000000"
                maxLength={6}
                autoFocus
                className="w-full bg-input border border-line rounded-md p-3 text-ink text-[0.9rem] outline-none focus:border-primary transition-colors text-center text-2xl tracking-[8px]"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
              />
            </div>
            <button
              type="submit"
              disabled={cooldownLeft > 0}
              className="inline-flex items-center justify-center w-full gap-2 text-sm p-[0.85rem] rounded-md font-bold transition-all duration-150 border border-transparent cursor-pointer bg-primary text-ink-on-primary hover:bg-primary-hover mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cooldownLeft > 0 ? `Wait ${cooldownLeft}s` : 'Verify email'}
            </button>
          </form>
          <p className="text-ink-muted text-[0.85rem]">
            Didn't get it?{' '}
            <button
              type="button"
              onClick={() => {
                fetch(`${API_BASE_URL}/api/auth/resend-code`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: verifyEmail })
                }).catch(() => {});
                showToast('success', 'A new code has been sent!');
              }}
              className="bg-transparent border-0 text-primary font-medium cursor-pointer p-0"
            >
              Resend code
            </button>
          </p>
        </div>
      );
    }

    /* ── Reset password ── */
    if (screen === 'reset') {
      return (
        <>
          <button
            type="button"
            onClick={() => go('forgot-sent', -1)}
            className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors bg-transparent border-0 cursor-pointer p-0 mb-8 self-start"
          >
            <ArrowLeft size={15} />
            Back
          </button>
          <div className="mb-8">
            <h1 className="text-[2rem] font-bold tracking-[-0.03em] text-ink mb-2">Enter reset code</h1>
            <p className="text-ink-muted text-[0.95rem]">
              Check <span className="text-ink font-medium">{resetEmail}</span> for your 6-digit code
            </p>
          </div>
          <form onSubmit={handleResetSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-[0.35rem]">
              <label className="block text-[0.85rem] font-medium text-ink-muted">Reset code</label>
              <input
                type="text"
                placeholder="000000"
                maxLength={6}
                autoFocus
                className="w-full bg-input border border-line rounded-md p-3 text-ink text-[0.9rem] outline-none focus:border-primary transition-colors"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-[0.35rem]">
              <label className="block text-[0.85rem] font-medium text-ink-muted">New password</label>
              <div className="relative">
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-input border border-line rounded-md p-3 text-ink text-[0.9rem] outline-none focus:border-primary transition-colors pr-10"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer p-0 text-ink-muted hover:text-ink"
                >
                  {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {resetMessage && (
              <p className="text-primary font-medium text-sm text-center">{resetMessage}</p>
            )}
            <button
              type="submit"
              disabled={cooldownLeft > 0}
              className="inline-flex items-center justify-center w-full gap-2 text-sm p-[0.85rem] rounded-md font-bold transition-all duration-150 border border-transparent cursor-pointer bg-primary text-ink-on-primary hover:bg-primary-hover mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cooldownLeft > 0 ? `Wait ${cooldownLeft}s` : 'Reset password'}
            </button>
          </form>
        </>
      );
    }

    /* ── Forgot password ── */
    if (screen === 'forgot') {
      return (
        <>
          <button
            type="button"
            onClick={() => go('login', -1)}
            className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors bg-transparent border-0 cursor-pointer p-0 mb-8 self-start"
          >
            <ArrowLeft size={15} />
            Back to Sign in
          </button>

          <div className="mb-8">
            <h1 className="text-[2rem] font-bold tracking-[-0.03em] text-ink mb-2">Forgot password?</h1>
            <p className="text-ink-muted text-[0.95rem]">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleForgotSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-[0.35rem]">
              <label className="block text-[0.85rem] font-medium text-ink-muted">Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                autoFocus
                className="w-full bg-input border border-line rounded-md p-3 text-ink text-[0.9rem] outline-none focus:border-primary transition-colors"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={cooldownLeft > 0}
              className="inline-flex items-center justify-center w-full gap-2 text-sm p-[0.85rem] rounded-md font-bold transition-all duration-150 border border-transparent cursor-pointer bg-primary text-ink-on-primary hover:bg-primary-hover mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cooldownLeft > 0 ? `Wait ${cooldownLeft}s` : 'Send reset link'}
            </button>
          </form>
        </>
      );
    }

    /* ── Login / Signup ── */
    return (
      <>
        <div className="mb-8 overflow-hidden text-center md:text-left">
          {/* Mobile inline logo — shown only on mobile, sits just above the heading */}
          <button
            type="button"
            onClick={() => setView('landing')}
            className="md:hidden bg-transparent border-0 cursor-pointer p-0 mb-4 block w-full text-center"
          >
            <span className="text-5xl font-bold tracking-[-0.03em] text-ink">Lumio</span>
          </button>
          <h1 className="text-[1.5rem] font-bold tracking-[-0.03em] text-ink mb-1">
            {screen === 'login' ? 'Welcome back' : 'Get started'}
          </h1>
          <p className="text-ink-muted text-[0.85rem]">
            {screen === 'login' ? 'Sign in to your account' : 'Create your student account'}
          </p>
        </div>

        <div id="google-signin-button" className="w-full flex justify-center mb-3"></div>

        <div className="flex items-center text-center text-ink-muted text-xs my-2 before:content-[''] before:flex-1 before:border-b before:border-line after:content-[''] after:flex-1 after:border-b after:border-line">
          <span className="px-3">or</span>
        </div>

        <form onSubmit={handleAuthSubmit} className="flex flex-col">
          {/* Name field — signup only */}
          <AnimatePresence initial={false}>
            {screen === 'signup' && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                animate={{ height: 'auto', opacity: 1, marginBottom: 12 }}
                exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <label className="block text-[0.8rem] font-medium mb-1 text-ink-muted">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full bg-input border border-line rounded-md p-2.5 text-ink text-[0.85rem] outline-none focus:border-primary transition-colors"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-1 mb-3">
            <label className="block text-[0.8rem] font-medium text-ink-muted">Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full bg-input border border-line rounded-md p-2.5 text-ink text-[0.85rem] outline-none focus:border-primary transition-colors"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1 mb-1">
            <label className="block text-[0.8rem] font-medium text-ink-muted">Password</label>
            <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-input border border-line rounded-md p-2.5 text-ink text-[0.85rem] outline-none focus:border-primary transition-colors pr-10"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer p-0 text-ink-muted hover:text-ink"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {screen === 'login' && (
              <div className="flex justify-end mt-1 mb-2">
                <button
                  type="button"
                  onClick={() => go('forgot', 1)}
                  className="text-[0.75rem] text-ink-muted hover:text-primary transition-colors bg-transparent border-0 cursor-pointer p-0"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || cooldownLeft > 0}
            className="inline-flex items-center justify-center w-full gap-2 text-sm p-[0.7rem] rounded-md font-bold transition-all duration-150 border border-transparent cursor-pointer bg-primary text-ink-on-primary hover:bg-primary-hover mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cooldownLeft > 0 ? (
              `Wait ${cooldownLeft}s`
            ) : loading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : screen === 'login' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        <div className="text-center mt-3 text-[0.8rem] text-ink-muted">
          {screen === 'login' ? (
            <>Don't have an account?{' '}
              <button onClick={() => go('signup', 1)} className="bg-transparent border-0 text-primary font-medium cursor-pointer p-0">Sign up</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => go('login', -1)} className="bg-transparent border-0 text-primary font-medium cursor-pointer p-0">Sign in</button>
            </>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-row-reverse h-screen w-full bg-app relative">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="auth-toast"
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

      {/* Logo — desktop only, pinned top-right */}
      <button
        onClick={() => setView('landing')}
        className="hidden md:block absolute top-6 right-8 z-50 bg-transparent border-0 cursor-pointer p-0"
      >
        <span className="text-4xl font-bold tracking-[-0.03em] text-ink">Lumio</span>
      </button>

      {/* Right side: form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 md:p-12 bg-app overflow-y-auto">
        <div className="w-full max-w-105 overflow-hidden">
          <AnimatePresence mode="wait" custom={slideDir}>
            <motion.div
              key={screen}
              custom={slideDir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col"
            >
              {formContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Left side: brand panel */}
      <div className="flex-1 flex items-center justify-center p-10 bg-card border-r border-line relative overflow-hidden max-md:hidden">
        <div className="absolute -top-20 -left-20 w-75 h-75 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-15 -right-15 w-62.5 h-62.5 rounded-full bg-primary/8 blur-3xl pointer-events-none" />

        <motion.div
          className="max-w-95 w-full flex flex-col items-start text-left gap-8"
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L4 7V12C4 16.42 7.42 20.57 12 21C16.58 20.57 20 16.42 20 12V7L12 3Z" fill="currentColor" className="text-primary" opacity="0.8"/>
              <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div>
            <h2 className="text-[2rem] font-bold tracking-[-0.02em] text-ink mb-4 leading-tight">
              Experience Lumio
            </h2>
            <p className="text-ink-muted text-[1rem] leading-relaxed">
              Test-drive our study simulator right here. Upload materials and immediately trigger automated quizzes, spaced repetition cards, and live group challenges.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full">
            {[
              { emoji: '⚡', label: 'Automated Quizzes' },
              { emoji: '🃏', label: 'Spaced Repetition Cards' },
              { emoji: '👥', label: 'Live Group Challenges' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3 bg-app/60 border border-line rounded-lg px-4 py-3">
                <span className="text-lg">{f.emoji}</span>
                <span className="text-sm font-medium text-ink">{f.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
