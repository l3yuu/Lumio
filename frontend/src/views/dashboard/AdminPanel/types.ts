import type { DashboardTab } from '../../../types';

export interface HealthData {
  status: string;
  uptime_seconds: number;
  database: {
    status: string;
    latency_ms: number;
  };
  gemini?: {
    status: string;
    error: string | null;
  };
  counts: {
    users: number;
    modules: number;
    groups: number;
    exams: number;
  };
}

export interface AdminExam {
  id: number;
  title: string;
  subject: string;
  date: string;
  priority: string;
  completed: boolean;
  score: string | null;
  days_remaining: number;
  owner_email: string;
  owner_name: string;
}

export interface AdminModule {
  id: number;
  name: string;
  subject: string;
  date: string;
  owner_email: string;
  owner_name: string;
  questions_count: number;
  difficulty: string;
  has_source_file?: boolean;
}

export interface AdminGroupMember {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface AdminGroup {
  id: number;
  name: string;
  creator_email: string;
  creator_name: string;
  members_count: number;
  modules_count: number;
  is_banned?: boolean;
  members?: AdminGroupMember[];
}

export interface GroupPost {
  id: number;
  group_id: number;
  user_id: number | null;
  user_name: string;
  user_avatar?: string | null;
  content: string;
  created_at: string;
  is_ai: boolean;
}

export interface AdminSales {
  mrr: number;
  total_revenue: number;
  premium_count: number;
  churn_rate: number;
  transactions: {
    id: number;
    user_name: string;
    user_email: string;
    plan: string;
    amount: number;
    date: string;
    status: string;
  }[];
}

export interface AdminPanelProps {
  user: import('../../../types').User;
  currentTab: string;
  setDashboardTab: (tab: DashboardTab) => void;
}

export const BAN_REASONS = [
  "Inappropriate discussion or posts",
  "Spamming or advertising",
  "Harassment or user complaints",
  "Sharing copyrighted exam answers"
];

export const DELETE_REASONS = [
  "Duplicate/Inactive study group",
  "Severe violations of Terms of Service",
  "Spam/Ad campaign circle",
  "Requested by group creator"
];
