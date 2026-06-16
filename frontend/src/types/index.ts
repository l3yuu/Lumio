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

export type DashboardTab = 'overview' | 'modules' | 'groups' | 'tools' | 'settings' | 'calendar' | 'notifications' | 'history' | 'notes' | 'admin' | 'admin-overview' | 'admin-users' | 'admin-sales' | 'admin-modules' | 'admin-exams' | 'admin-groups' | 'tool-flashcards' | 'tool-essay' | 'tool-condenser' | 'tool-pomodoro';

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

export interface StudyTime {
  // Numeric hour/minute fields (subjects + accumulated time)
  accumulated_minutes?: number;
  Biology?: number;
  Economics?: number;
  Mathematics?: number;
  'General Study'?: number;
  // Flashcard quota fields
  flashcard_quota_used?: number;
  flashcard_quota_date?: string;
  // Exam quota fields
  exam_quota_used?: number;
  exam_quota_date?: string;
  // Tutor chat history (array of timestamps)
  tutor_chat_history?: number[];
  // Allow arbitrary extra server fields
  [key: string]: number | string | number[] | undefined;
}

export interface User {
  id?: number;
  role?: string;
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
  studyTime?: StudyTime;
  heatmapData?: { label: string; hours: number; level: number; date?: string }[];
  focusAreas?: { concept: string; subject: string; score: number; desc: string }[];
  spacedRecall?: { id: number; name: string; subject: string; dueIn: string; progress: number }[];
  quests?: StudyQuest[];
  questsDate?: string;
  lastCheckIn?: string;
  folders?: string[];
  is_premium?: boolean;
  is_suspended?: boolean;
  stripe_subscription_status?: string;
  premium_expires_at?: string;
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
  lastScore?: string;
  difficulty?: string;
}

export interface GroupMember {
  id?: number;
  name: string;
  email: string;
  avatar?: string;
  online: boolean;
  is_premium?: boolean;
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
  creator_id?: number;
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
  completed?: boolean;
  score?: string;
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
  last_score?: string;
  difficulty?: string;
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
  creator_id?: number;
  members: GroupMember[];
  modules?: ModuleResponse[];
  quiz_sessions?: GroupQuizSessionResponse[];
}

export interface UserResponse {
  id?: number;
  role?: string;
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
  heatmap_data?: { label: string; hours: number; level: number; date?: string }[];
  focus_areas?: { concept: string; subject: string; score: number; desc: string }[];
  spaced_recall?: { id: number; name: string; subject: string; dueIn: string; progress: number }[];
  quests?: StudyQuest[];
  quests_date?: string;
  last_check_in?: string;
  folders?: string[];
  is_premium?: boolean;
  is_suspended?: boolean;
  stripe_subscription_status?: string;
  premium_expires_at?: string;
}

export interface ExamTopic {
  text: string;
  completed: boolean;
}

export interface ExamQuizAttempt {
  score: string;
  date: string;
  quizName: string;
}

export interface ExamQuizLink {
  attempts: ExamQuizAttempt[];
}

export interface ExamDeadline {
  id: number;
  title: string;
  subject: string;
  date: string;
  rawDate?: string;
  daysRemaining: number;
  priority: 'high' | 'medium' | 'low';
  completed?: boolean;
  score?: string;
  topics?: ExamTopic[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: Date;
}

export interface QuizAttempt {
  id: number;
  userId: number;
  title: string;
  attemptType: 'study_module' | 'exam' | 'group_quiz';
  score: string;
  percentage: number;
  date: string;
}

export interface Note {
  id: number;
  userId: number;
  title: string;
  content: string;
  subject: string;
  createdAt: string;
  updatedAt: string;
}


