import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Sparkles, Activity, CalendarDays, Clock, Users, ArrowLeft, Hash, Zap, Search, ChevronDown, ChevronUp, MessageSquare, TrendingUp } from 'lucide-react';
import { API_BASE_URL } from '../../../config';

interface AiUsageData {
  total_requests: number;
  requests_today: number;
  requests_this_week: number;
  requests_this_month: number;
  total_tokens_used: number;
  tokens_per_minute: number;
  by_feature: { feature: string; count: number }[];
  by_day: { date: string; total?: number; [key: string]: unknown }[];
  by_hour: { date: string; hour: string; count: number }[];
  top_users: { user_id: number; name: string; email: string; count: number }[];
}

interface RecentRequest {
  id: number;
  feature: string;
  model: string;
  prompt: string;
  response: string;
  tokens_used: number;
  created_at: string;
}

interface UserAiUsageDetail {
  user_id: number;
  name: string;
  email: string;
  total_requests: number;
  requests_today: number;
  requests_this_week: number;
  requests_this_month: number;
  total_tokens_used: number;
  by_feature: { feature: string; count: number }[];
  by_day: { date: string; total?: number; [key: string]: unknown }[];
  recent_requests: RecentRequest[];
}

const FEATURE_COLORS: Record<string, string> = {
  tutor: '#3ECF8E',
  quiz: '#8B5CF6',
  flashcard: '#F59E0B',
  condenser: '#06B6D4',
  essay_grader: '#F97316',
  consolidated_exam: '#EC4899',
};

const FEATURE_LABELS: Record<string, string> = {
  tutor: 'AI Tutor',
  quiz: 'Quiz Generator',
  flashcard: 'Flashcards',
  condenser: 'Summarizer',
  essay_grader: 'Essay Grader',
  consolidated_exam: 'Consolidated Exam',
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#1F2937] border border-[#374151] rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-[#F3F4F6] font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-[#D1D5DB]">{p.value.toLocaleString()} requests</p>
      ))}
    </div>
  );
};

const Overview = ({ data, onSelectUser }: { data: AiUsageData; onSelectUser: (userId: number) => void }) => {
  const pieData = data.by_feature.map(f => ({
    name: FEATURE_LABELS[f.feature] || f.feature,
    value: f.count,
    color: FEATURE_COLORS[f.feature] || '#6B7280',
  }));

  const aggregateHourly = () => {
    const hourTotals: Record<string, number> = {};
    for (const h of data.by_hour) {
      hourTotals[h.hour] = (hourTotals[h.hour] || 0) + h.count;
    }
    return Object.entries(hourTotals).sort(([a], [b]) => a.localeCompare(b)).map(([hour, count]) => ({
      hour: `${hour}:00`,
      count,
    }));
  };

  const hourlyData = aggregateHourly();

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-line rounded-xl p-5 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-xs text-ink-muted uppercase tracking-wider font-semibold">Total Requests</span>
            <Sparkles size={18} className="text-primary" />
          </div>
          <div className="text-3xl font-extrabold tracking-tight">{data.total_requests.toLocaleString()}</div>
          <span className="text-xs text-ink-muted">All-time AI requests</span>
        </div>
        <div className="bg-card border border-line rounded-xl p-5 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-xs text-ink-muted uppercase tracking-wider font-semibold">Today</span>
            <Activity size={18} className="text-primary" />
          </div>
          <div className="text-3xl font-extrabold tracking-tight">{data.requests_today.toLocaleString()}</div>
          <span className="text-xs text-ink-muted">Requests today</span>
        </div>
        <div className="bg-card border border-line rounded-xl p-5 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-xs text-ink-muted uppercase tracking-wider font-semibold">This Week</span>
            <CalendarDays size={18} className="text-primary" />
          </div>
          <div className="text-3xl font-extrabold tracking-tight">{data.requests_this_week.toLocaleString()}</div>
          <span className="text-xs text-ink-muted">Requests this week</span>
        </div>
        <div className="bg-card border border-line rounded-xl p-5 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <span className="text-xs text-ink-muted uppercase tracking-wider font-semibold">This Month</span>
            <Clock size={18} className="text-primary" />
          </div>
          <div className="text-3xl font-extrabold tracking-tight">{data.requests_this_month.toLocaleString()}</div>
          <span className="text-xs text-ink-muted">Requests this month</span>
        </div>
        <div className="bg-card border border-line rounded-xl p-5 flex flex-col gap-4 border-amber-400/25 bg-amber-400/5">
          <div className="flex justify-between items-start">
            <span className="text-xs text-amber-400 uppercase tracking-wider font-semibold">Total Tokens Used</span>
            <Zap size={18} className="text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-amber-400">{data.total_tokens_used.toLocaleString()}</div>
          <span className="text-xs text-ink-muted">Cumulative estimated tokens</span>
        </div>
        <div className="bg-card border border-line rounded-xl p-5 flex flex-col gap-4 border-indigo-400/25 bg-indigo-400/5">
          <div className="flex justify-between items-start">
            <span className="text-xs text-indigo-400 uppercase tracking-wider font-semibold">Tokens / Min</span>
            <TrendingUp size={18} className="text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-indigo-400">{data.tokens_per_minute.toLocaleString()}</div>
          <span className="text-xs text-ink-muted">Rolling 60-min avg rate</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-line rounded-xl p-6 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Requests per Day (30 days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.by_day}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} stroke="#4B5563" tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} stroke="#4B5563" allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="total" stroke="#3ECF8E" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-line rounded-xl p-6 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Requests by Feature</h3>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  cornerRadius={6}
                  labelLine={{ stroke: '#6B7280', strokeWidth: 1.5 }}
                  label={({ name, percent, x, y, cx }) => {
                    const textOffset = x > cx ? 10 : -10;
                    return (
                      <text x={x + textOffset} y={y} textAnchor={x > cx ? 'start' : 'end'} fill="#D1D5DB" fontSize={11} fontWeight={500}>
                        {name} ({(percent ?? 0) * 100 < 1 ? '<1' : ((percent ?? 0) * 100).toFixed(0)}%)
                      </text>
                    );
                  }}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '13px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                  itemStyle={{ color: '#D1D5DB' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="text-2xl font-extrabold text-ink">{data.total_requests.toLocaleString()}</span>
                <span className="block text-[0.6rem] text-ink-muted uppercase tracking-wider font-semibold">Total</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-line rounded-xl p-6 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Requests by Hour (7 days)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9CA3AF' }} stroke="#4B5563" />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} stroke="#4B5563" allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-line rounded-xl p-6 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Top Users</h3>
          <div className="flex flex-col gap-2">
            {data.top_users.map((u, i) => (
              <button
                key={u.user_id}
                onClick={() => onSelectUser(u.user_id)}
                className="flex items-center gap-3 py-2 px-3 bg-input/40 border border-line rounded-lg hover:bg-glass-strong hover:border-primary/30 transition-all duration-150 cursor-pointer text-left w-full"
              >
                <span className="w-5 text-xs font-bold text-ink-muted text-center shrink-0">{i + 1}</span>
                <Users size={14} className="text-ink-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-ink truncate block">{u.name}</span>
                  <span className="text-[0.65rem] text-ink-muted truncate block">{u.email}</span>
                </div>
                <span className="text-sm font-bold text-primary">{u.count}</span>
              </button>
            ))}
            {data.top_users.length === 0 && (
              <span className="text-sm text-ink-muted">No AI usage data yet.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Prompt History Tab ────────────────────────────────────────────────────────

const PromptHistoryTab = ({ requests }: { requests: RecentRequest[] }) => {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [featureFilter, setFeatureFilter] = useState<string>('all');

  const features = Array.from(new Set(requests.map(r => r.feature)));

  const filtered = requests.filter(r => {
    const matchesFeature = featureFilter === 'all' || r.feature === featureFilter;
    const matchesSearch = search.trim() === '' ||
      r.prompt.toLowerCase().includes(search.toLowerCase()) ||
      r.response.toLowerCase().includes(search.toLowerCase());
    return matchesFeature && matchesSearch;
  });

  const totalTokens = filtered.reduce((sum, r) => sum + (r.tokens_used || 0), 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Search prompts or AI responses…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-input border border-line rounded-lg text-ink placeholder:text-ink-muted focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFeatureFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${featureFilter === 'all' ? 'bg-primary text-white border-primary' : 'bg-transparent border-line text-ink-muted hover:border-primary/40'}`}
          >
            All
          </button>
          {features.map(f => (
            <button
              key={f}
              onClick={() => setFeatureFilter(featureFilter === f ? 'all' : f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${featureFilter === f ? 'border-transparent text-white' : 'bg-transparent border-line text-ink-muted hover:border-primary/40'}`}
              style={featureFilter === f ? { background: FEATURE_COLORS[f] || '#6B7280', borderColor: 'transparent' } : {}}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: FEATURE_COLORS[f] || '#6B7280' }} />
              {FEATURE_LABELS[f] || f}
            </button>
          ))}
        </div>
      </div>

      {/* Summary row */}
      <div className="flex items-center gap-4 text-xs text-ink-muted">
        <span><span className="font-semibold text-ink">{filtered.length}</span> prompts</span>
        <span>·</span>
        <span><span className="font-semibold text-ink">{totalTokens.toLocaleString()}</span> est. tokens</span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="bg-card border border-line rounded-xl py-12 text-center text-ink-muted text-sm">
            {search ? 'No prompts match your search.' : 'No prompt history yet.'}
          </div>
        )}
        {filtered.map(r => {
          const isExpanded = expandedId === r.id;
          return (
            <div
              key={r.id}
              className="bg-card border border-line rounded-xl overflow-hidden transition-all duration-200"
            >
              {/* Header row */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-glass-strong transition-colors select-none"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                {/* Feature badge */}
                <span
                  className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[0.65rem] font-bold text-white"
                  style={{ background: FEATURE_COLORS[r.feature] || '#6B7280' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                  {FEATURE_LABELS[r.feature] || r.feature}
                </span>

                {/* Prompt preview */}
                <p className="flex-1 min-w-0 text-sm text-ink truncate">
                  {r.prompt || <span className="text-ink-muted italic">No prompt recorded</span>}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-3 shrink-0">
                  {r.tokens_used > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-semibold">
                      <Zap size={10} />
                      {r.tokens_used.toLocaleString()}
                    </span>
                  )}
                  <span className="text-xs text-ink-muted font-mono whitespace-nowrap">{r.created_at}</span>
                  <span className="text-ink-muted">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-line">
                  {/* User prompt */}
                  {r.prompt && (
                    <div className="px-4 py-3 border-b border-line/50">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                          <Users size={11} className="text-primary" />
                        </div>
                        <span className="text-[0.65rem] font-bold text-primary uppercase tracking-wider">User Prompt</span>
                      </div>
                      <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap pl-7">{r.prompt}</p>
                    </div>
                  )}

                  {/* AI response */}
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-5 h-5 rounded-full bg-[#3ECF8E]/15 flex items-center justify-center">
                        <Sparkles size={11} className="text-[#3ECF8E]" />
                      </div>
                      <span className="text-[0.65rem] font-bold text-[#3ECF8E] uppercase tracking-wider">AI Response</span>
                    </div>
                    {r.response ? (
                      <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap pl-7">{r.response}</p>
                    ) : (
                      <p className="text-sm text-ink-muted italic pl-7">No response recorded (logged before this feature was enabled).</p>
                    )}
                  </div>

                  {/* Footer meta */}
                  <div className="px-4 py-2 border-t border-line/50 bg-input/20 flex items-center gap-4 text-xs text-ink-muted">
                    <span className="font-mono">{r.model || 'Unknown model'}</span>
                    <span>·</span>
                    {r.tokens_used > 0 ? (
                      <span className="flex items-center gap-1 text-amber-400 font-semibold">
                        <Zap size={10} /> {r.tokens_used.toLocaleString()} est. tokens
                      </span>
                    ) : (
                      <span>No token estimate</span>
                    )}
                    <span>·</span>
                    <span>{r.created_at}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── User Detail ───────────────────────────────────────────────────────────────

const UserDetail = ({ userId, onBack }: { userId: number; onBack: () => void }) => {
  const [detail, setDetail] = useState<UserAiUsageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'prompts'>('overview');

  useEffect(() => {
    const token = localStorage.getItem('token');
    setLoading(true);
    fetch(`${API_BASE_URL}/api/admin/ai-usage/user/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setDetail)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!detail) {
    return <div className="text-ink-muted text-sm">Failed to load user details.</div>;
  }

  const userPieData = detail.by_feature.map(f => ({
    name: FEATURE_LABELS[f.feature] || f.feature,
    value: f.count,
    color: FEATURE_COLORS[f.feature] || '#6B7280',
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink bg-transparent border border-line rounded-lg px-3 py-1.5 cursor-pointer transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Users size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink">{detail.name}</h3>
            <span className="text-[0.65rem] text-ink-muted">{detail.email}</span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-card border border-line rounded-xl p-5 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <span className="text-xs text-ink-muted uppercase tracking-wider font-semibold">Total Requests</span>
            <Hash size={16} className="text-primary" />
          </div>
          <div className="text-2xl font-extrabold tracking-tight">{detail.total_requests.toLocaleString()}</div>
          <span className="text-xs text-ink-muted">All-time AI requests</span>
        </div>
        <div className="bg-card border border-line rounded-xl p-5 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <span className="text-xs text-ink-muted uppercase tracking-wider font-semibold">Today</span>
            <Activity size={16} className="text-primary" />
          </div>
          <div className="text-2xl font-extrabold tracking-tight">{detail.requests_today.toLocaleString()}</div>
          <span className="text-xs text-ink-muted">Requests today</span>
        </div>
        <div className="bg-card border border-line rounded-xl p-5 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <span className="text-xs text-ink-muted uppercase tracking-wider font-semibold">This Week</span>
            <CalendarDays size={16} className="text-primary" />
          </div>
          <div className="text-2xl font-extrabold tracking-tight">{detail.requests_this_week.toLocaleString()}</div>
          <span className="text-xs text-ink-muted">Requests this week</span>
        </div>
        <div className="bg-card border border-line rounded-xl p-5 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <span className="text-xs text-ink-muted uppercase tracking-wider font-semibold">This Month</span>
            <Clock size={16} className="text-primary" />
          </div>
          <div className="text-2xl font-extrabold tracking-tight">{detail.requests_this_month.toLocaleString()}</div>
          <span className="text-xs text-ink-muted">Requests this month</span>
        </div>
        <div className="bg-card border border-line rounded-xl p-5 flex flex-col gap-3 border-amber-400/20 bg-amber-400/5">
          <div className="flex justify-between items-start">
            <span className="text-xs text-amber-400 uppercase tracking-wider font-semibold">Est. Tokens</span>
            <Zap size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-amber-400">{detail.total_tokens_used.toLocaleString()}</div>
          <span className="text-xs text-ink-muted">Total estimated tokens</span>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-input/40 border border-line rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${activeTab === 'overview' ? 'bg-primary text-white shadow-sm' : 'text-ink-muted hover:text-ink'}`}
        >
          <Activity size={14} />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('prompts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${activeTab === 'prompts' ? 'bg-primary text-white shadow-sm' : 'text-ink-muted hover:text-ink'}`}
        >
          <MessageSquare size={14} />
          Prompt History
          <span className={`text-[0.6rem] px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'prompts' ? 'bg-white/20 text-white' : 'bg-primary/15 text-primary'}`}>
            {detail.recent_requests.length}
          </span>
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-line rounded-xl p-6 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Feature Breakdown</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userPieData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} stroke="#4B5563" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} stroke="#4B5563" width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {userPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card border border-line rounded-xl p-6 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Daily Activity (30 days)</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={detail.by_day}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} stroke="#4B5563" tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} stroke="#4B5563" allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="total" stroke="#3ECF8E" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-card border border-line rounded-xl p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Recent Requests</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-line text-ink-muted uppercase tracking-wider font-semibold">
                    <th className="text-left py-2 pr-4">Feature</th>
                    <th className="text-left py-2 pr-4">Model</th>
                    <th className="text-right py-2 pr-4">Est. Tokens</th>
                    <th className="text-left py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.recent_requests.slice(0, 10).map(r => (
                    <tr key={r.id} className="border-b border-line/50 text-ink">
                      <td className="py-2 pr-4">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: FEATURE_COLORS[r.feature] || '#6B7280' }} />
                          {FEATURE_LABELS[r.feature] || r.feature}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-ink-muted font-mono">{r.model}</td>
                      <td className="py-2 pr-4 text-right">
                        {r.tokens_used > 0 ? (
                          <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                            <Zap size={10} />
                            {r.tokens_used.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-ink-muted">—</span>
                        )}
                      </td>
                      <td className="py-2 text-ink-muted">{r.created_at}</td>
                    </tr>
                  ))}
                  {detail.recent_requests.length === 0 && (
                    <tr><td colSpan={4} className="py-4 text-center text-ink-muted">No requests recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'prompts' && (
        <PromptHistoryTab requests={detail.recent_requests} />
      )}
    </div>
  );
};

// ─── Root ──────────────────────────────────────────────────────────────────────

export const AdminAiUsage = () => {
  const [data, setData] = useState<AiUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE_URL}/api/admin/ai-usage`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-ink-muted text-sm">Failed to load AI usage data.</div>;
  }

  if (selectedUserId) {
    return <UserDetail userId={selectedUserId} onBack={() => setSelectedUserId(null)} />;
  }

  return <Overview data={data} onSelectUser={setSelectedUserId} />;
};