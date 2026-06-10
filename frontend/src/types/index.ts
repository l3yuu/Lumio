export type View =
  | 'landing'
  | 'auth'
  | 'dashboard'
  | 'how-it-works'
  | 'tools'
  | 'contact'
  | 'flashcards'
  | 'essay-grader'
  | 'condenser'
  | 'pricing'
  | 'privacy'
  | 'terms'
  | 'docs'
  | 'pomodoro';

export type AuthTab = 'login' | 'signup';

export type DashboardTab = 'overview' | 'modules' | 'groups' | 'tools' | 'settings' | 'calendar' | 'notifications';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message?: string;
  related_id?: number;
  related_type?: string;
  is_read: boolean;
  created_at: string;
}

export interface User {
  name: string;
  email: string;
  avatar?: string;
  school?: string;
  username?: string;
  bio?: string;
  gradeLevel?: string;
  studyGoal?: string;
  studyLanguage?: string;
  streakGoal?: number;
  timezone?: string;
  is_verified?: boolean;
  level: number;
  xp: number;
  streak?: number;
  quizzesCount?: number;
  quizHistory?: number[];
  studyTime?: { [key: string]: number | string };
  heatmapData?: { label: string; hours: number; level: number }[];
  focusAreas?: { concept: string; subject: string; score: number; desc: string }[];
  spacedRecall?: { id: number; name: string; subject: string; dueIn: string; progress: number }[];
  quests?: StudyQuest[];
  questsDate?: string;
  lastCheckIn?: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Module {
  id: number;
  name: string;
  date: string;
  size: string;
  questionsCount: number;
  questions: QuizQuestion[];
  subject?: string;
  sourceFilename?: string;
  hasSourceFile?: boolean;
}

export interface GroupMember {
  name: string;
  email: string;
  avatar?: string;
  online: boolean;
}

export interface GroupQuizRank {
  name: string;
  score: string;
  percentage: number;
  time: string;
  isUser: boolean;
}

export interface GroupQuizSession {
  id: number;
  moduleName: string;
  date: string;
  avgScore: string;
  rankings: GroupQuizRank[];
}

export interface StudyGroup {
  id: number;
  name: string;
  members: GroupMember[];
  modules: Module[];
  quizSessions: GroupQuizSession[];
}

export interface GroupInvitation {
  id: number;
  group_id: number;
  group_name: string;
  inviter_name: string;
  inviter_avatar?: string;
  status: string;
  created_at: string;
}

export interface StudyQuest {
  id: string;
  text: string;
  points: number;
  completed: boolean;
  actionType: 'ask_ai' | 'view_settings' | 'complete_quiz' | 'study_group' | 'custom';
}

export interface ExamDeadlineResponse {
  id: number;
  title: string;
  subject: string;
  date: string;
  raw_date?: string;
  days_remaining: number;
  priority: string;
}

export interface QuizQuestionResponse {
  id: number;
  question: string;
  options: string[];
  correct_answer_index: number;
}

export interface ModuleResponse {
  id: number;
  name: string;
  date: string;
  size: string;
  subject?: string;
  source_filename?: string;
  has_source_file?: boolean;
  questionsCount?: number;
  questions?: QuizQuestionResponse[];
}

export interface GroupQuizRankResponse {
  name: string;
  score: string;
  percentage: number;
  time: string;
  is_user: boolean;
}

export interface GroupQuizSessionResponse {
  id: number;
  module_name: string;
  date: string;
  avg_score: string;
  rankings: GroupQuizRankResponse[];
}

export interface StudyGroupResponse {
  id: number;
  name: string;
  members: GroupMember[];
  modules?: ModuleResponse[];
  quiz_sessions?: GroupQuizSessionResponse[];
}

export interface UserResponse {
  name: string;
  email: string;
  avatar?: string;
  school?: string;
  username?: string;
  bio?: string;
  grade_level?: string;
  study_goal?: string;
  study_language?: string;
  streak_goal?: number;
  timezone?: string;
  is_verified?: boolean;
  level: number;
  xp: number;
  streak?: number;
  quizzes_count?: number;
  quiz_history?: number[];
  study_time?: { [key: string]: number | string };
  heatmap_data?: { label: string; hours: number; level: number }[];
  focus_areas?: { concept: string; subject: string; score: number; desc: string }[];
  spaced_recall?: { id: number; name: string; subject: string; dueIn: string; progress: number }[];
  quests?: StudyQuest[];
  quests_date?: string;
  last_check_in?: string;
}

export interface ExamDeadline {
  id: number;
  title: string;
  subject: string;
  date: string;
  rawDate?: string;
  daysRemaining: number;
  priority: 'high' | 'medium' | 'low';
}
