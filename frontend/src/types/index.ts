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
  | 'docs';

export type AuthTab = 'login' | 'signup';

export type DashboardTab = 'overview' | 'modules' | 'groups' | 'tools' | 'settings';

export interface User {
  name: string;
  email: string;
  avatar?: string;
  school?: string;
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
}

export interface GroupMember {
  name: string;
  email: string;
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
