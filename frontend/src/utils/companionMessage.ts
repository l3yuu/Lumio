import type { User, StudyQuest, ExamDeadline, DashboardTab } from '../types';

export type CompanionMood = 'urgent' | 'celebrate' | 'motivate' | 'warm' | 'neutral';

export interface CompanionMessage {
  greeting: string;
  message: string;
  mood: CompanionMood;
  actionLabel?: string;
  actionTab?: DashboardTab;
}

export interface RecentExamFinish {
  title: string;
  score?: string;
  date: string;
}

export interface CompanionContext {
  user: User;
  exams: ExamDeadline[];
  quests: StudyQuest[];
  quizHistory: number[];
  heatmapData: { label: string; hours: number; level: number }[];
  spacedRepetitionList: { id: number; name: string; subject: string; dueIn: string; progress: number }[];
  recentExamFinish?: RecentExamFinish | null;
}

const WARM_MESSAGES = [
  'Small sessions add up — even 15 minutes of focus today moves you forward.',
  'Your AI tutor is ready whenever you want to clarify a tricky concept.',
  'Consistency beats cramming. What would you like to tackle first today?',
  'Every quiz you take sharpens your recall. Pick a module and give it a go.',
];

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 22) return 'Good evening';
  return 'Welcome back';
}

function isCheckedInToday(user: User): boolean {
  return user.lastCheckIn === new Date().toDateString();
}

export function getRecentExamFinish(): { title: string; score?: string; date: string } | null {
  try {
    const raw = localStorage.getItem('lumio_recent_exam_finish');
    if (!raw) return null;
    const data = JSON.parse(raw) as { title: string; score?: string; date: string };
    const today = new Date().toISOString().split('T')[0];
    if (data.date === today) return data;
    return null;
  } catch {
    return null;
  }
}

export function storeRecentExamFinish(title: string, score?: string) {
  localStorage.setItem(
    'lumio_recent_exam_finish',
    JSON.stringify({ title, score, date: new Date().toISOString().split('T')[0] }),
  );
}

function parseScorePercent(score?: string): number | null {
  if (!score) return null;
  const pct = score.match(/(\d+)\s*%/);
  if (pct) return parseInt(pct[1], 10);
  const frac = score.match(/(\d+)\s*\/\s*(\d+)/);
  if (frac) return Math.round((parseInt(frac[1], 10) / parseInt(frac[2], 10)) * 100);
  const num = score.match(/^(\d+)$/);
  if (num) return parseInt(num[1], 10);
  return null;
}

function isRecallDue(dueIn: string): boolean {
  const d = dueIn.toLowerCase();
  return d.includes('today') || d.includes('now') || d.includes('overdue') || d.startsWith('0');
}

function recentStudyActivity(heatmapData: CompanionContext['heatmapData']): number {
  return heatmapData.slice(-7).reduce((sum, day) => sum + day.level, 0);
}

function quizTrendingUp(history: number[]): boolean {
  if (history.length < 2) return false;
  const recent = history.slice(-3);
  return recent.length >= 2 && recent[recent.length - 1] > recent[0];
}

export function getCompanionMessage(ctx: CompanionContext): CompanionMessage {
  const { user, exams, quests, quizHistory, heatmapData, spacedRepetitionList } = ctx;
  const greeting = getTimeGreeting();
  const streak = user.streak ?? 0;

  const examToday = exams.find(e => e.daysRemaining === 0);
  if (examToday) {
    return {
      greeting,
      mood: 'urgent',
      message: `Your "${examToday.title}" exam is today! You've put in the work — trust yourself. A quick ${examToday.subject} review could help you feel even more ready.`,
      actionLabel: 'Review modules',
      actionTab: 'modules',
    };
  }

  const recentFinish = ctx.recentExamFinish ?? getRecentExamFinish();
  if (recentFinish) {
    const pct = parseScorePercent(recentFinish.score);
    const scorePart = recentFinish.score ? ` (${recentFinish.score})` : '';
    if (pct !== null && pct >= 70) {
      return {
        greeting,
        mood: 'celebrate',
        message: `You finished "${recentFinish.title}"${scorePart}! That's a strong result — take a well-deserved break, then celebrate the effort you put in.`,
      };
    }
    return {
      greeting,
      mood: 'celebrate',
      message: `You completed "${recentFinish.title}"${scorePart}! Showing up and finishing is what counts. Rest up — I'm proud of the work you put in.`,
    };
  }

  const soonExam = exams
    .filter(e => e.daysRemaining > 0 && e.daysRemaining <= 3)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)[0];
  if (soonExam) {
    const dayLabel = soonExam.daysRemaining === 1 ? 'tomorrow' : `in ${soonExam.daysRemaining} days`;
    return {
      greeting,
      mood: 'motivate',
      message: `"${soonExam.title}" is ${dayLabel}. Want to squeeze in a focused review on ${soonExam.subject}? A short session now can make exam day feel easier.`,
      actionLabel: 'Open calendar',
      actionTab: 'calendar',
    };
  }

  const dueRecalls = spacedRepetitionList.filter(r => isRecallDue(r.dueIn));
  if (dueRecalls.length > 0) {
    const first = dueRecalls[0];
    const extra = dueRecalls.length > 1 ? ` You have ${dueRecalls.length} modules ready for recall.` : '';
    return {
      greeting,
      mood: 'motivate',
      message: `"${first.name}" is due for spaced recall.${extra} A quick review now will lock it in before you forget.`,
      actionLabel: 'Study modules',
      actionTab: 'modules',
    };
  }

  if (streak > 0 && !isCheckedInToday(user)) {
    return {
      greeting,
      mood: 'motivate',
      message: `You're on a ${streak}-day streak — don't let it slip! Tap your streak card to check in and keep the momentum going.`,
    };
  }

  const pendingQuests = quests.filter(q => !q.completed).length;
  if (pendingQuests > 0) {
    return {
      greeting,
      mood: 'warm',
      message: `You still have ${pendingQuests} daily quest${pendingQuests > 1 ? 's' : ''} waiting. They're quick wins — finish them for bonus XP before the day ends.`,
    };
  }

  if (streak >= 7) {
    return {
      greeting,
      mood: 'celebrate',
      message: `${streak} days of consistency — that's real discipline. Your brain is building habits that'll carry you through exam season. Keep the rhythm today.`,
    };
  }

  if (quizTrendingUp(quizHistory)) {
    return {
      greeting,
      mood: 'celebrate',
      message: 'Your quiz scores are trending up lately. That progress is real — keep challenging yourself with another practice round.',
      actionLabel: 'Take a quiz',
      actionTab: 'modules',
    };
  }

  if (recentStudyActivity(heatmapData) === 0 && heatmapData.length > 0) {
    return {
      greeting,
      mood: 'warm',
      message: "I haven't seen much study activity this week. No pressure — even 15 minutes today can restart your momentum.",
      actionLabel: 'Browse modules',
      actionTab: 'modules',
    };
  }

  if (exams.length === 0) {
    return {
      greeting,
      mood: 'warm',
      message: 'No exams on the horizon right now — a great window to get ahead. Explore a module or try the AI tutor on something new.',
      actionLabel: 'Log an exam',
      actionTab: 'calendar',
    };
  }

  const dayIndex = new Date().getDay();
  const warmMessage = WARM_MESSAGES[dayIndex % WARM_MESSAGES.length];

  return {
    greeting,
    mood: 'neutral',
    message: warmMessage,
  };
}
