import React, { useState } from "react";
import {
  Users, Search, Filter, Plus, ChevronDown, MoreHorizontal, Send, Edit2,
  Sparkles, ShieldCheck, BarChart3, Activity, FileText, CheckCircle2, XCircle,
  Clock, AlertCircle, Heart, BookOpen, HandHeart, Star, Globe, MapPin,
  Calendar, Download, Share2, Bell, ArrowRight, Flame, Droplets, UsersRound,
  TrendingUp, ChevronUp, MessageCircle, Languages, Filter as FilterIcon,
  GitBranch
} from "lucide-react";
import { cn } from "./types";

// ============================================================================
// Shared primitives
// ============================================================================

export function PageHeader({
  title, subtitle, actions
}: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label, value, change, icon: Icon, tone = "default", subtitle
}: {
  label: string; value: string | number; change?: string;
  icon?: any; tone?: "default" | "blue" | "green" | "amber" | "purple" | "pink"; subtitle?: string;
}) {
  const toneClasses = {
    default: "bg-muted text-muted-foreground",
    blue:    "bg-blue-50 text-blue-600",
    green:   "bg-emerald-50 text-emerald-600",
    amber:   "bg-amber-50 text-amber-600",
    purple:  "bg-violet-50 text-violet-600",
    pink:    "bg-pink-50 text-pink-600",
  }[tone];
  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-foreground/10 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <div className={cn("w-8 h-8 rounded-md flex items-center justify-center", toneClasses)}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-foreground tracking-tight">{value}</div>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      {change && <p className="text-xs font-medium text-emerald-600 mt-2">{change}</p>}
    </div>
  );
}

export function Chip({
  children, tone = "default", className
}: { children: React.ReactNode; tone?: "default" | "green" | "blue" | "amber" | "red" | "purple" | "pink" | "slate" | "orange"; className?: string }) {
  const tones = {
    default: "bg-muted text-muted-foreground",
    green:   "bg-emerald-50 text-emerald-700",
    blue:    "bg-blue-50 text-blue-700",
    amber:   "bg-amber-50 text-amber-700",
    red:     "bg-rose-50 text-rose-700",
    purple:  "bg-violet-50 text-violet-700",
    pink:    "bg-pink-50 text-pink-700",
    slate:   "bg-slate-100 text-slate-700",
    orange:  "bg-orange-50 text-orange-700",
  }[tone];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full", tones, className)}>
      {children}
    </span>
  );
}

function Avatar({ name, tone = "blue" }: { name: string; tone?: "blue" | "green" | "amber" | "purple" | "pink" | "slate" | "rose" }) {
  const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const tones = {
    blue:    "bg-blue-100 text-blue-700",
    green:   "bg-emerald-100 text-emerald-700",
    amber:   "bg-amber-100 text-amber-700",
    purple:  "bg-violet-100 text-violet-700",
    pink:    "bg-pink-100 text-pink-700",
    slate:   "bg-slate-200 text-slate-700",
    rose:    "bg-rose-100 text-rose-700",
  }[tone];
  return (
    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0", tones)}>
      {initials}
    </div>
  );
}

function ProgressBar({ value, tone = "blue" }: { value: number; tone?: "blue" | "green" | "amber" | "red" }) {
  const tones = {
    blue:   "bg-blue-500",
    green:  "bg-emerald-500",
    amber:  "bg-amber-500",
    red:    "bg-rose-500",
  }[tone];
  return (
    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", tones)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center py-12 text-sm text-muted-foreground">{children}</div>
  );
}

// ============================================================================
// DISCIPLESHIP DASHBOARD (tab inside the main Dashboard page)
// ============================================================================

export function DiscipleshipDashboardView({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const activities = [
    { tone: "bg-emerald-500", text: "Sarah M. completed 'Foundations of Faith' campaign", when: "2m ago" },
    { tone: "bg-blue-500",    text: "New match proposed: David K. \u2192 Mentor James",     when: "15m ago" },
    { tone: "bg-rose-500",    text: "12 new seekers completed intake this week",            when: "1h ago" },
    { tone: "bg-violet-500",  text: "Content 'Finding Peace' assigned to 8 seekers",        when: "3h ago" },
  ];
  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back — here's your discipleship overview"
        actions={(
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search..."
              className="pl-8 pr-3 py-1.5 bg-card border border-border rounded-md text-sm focus:ring-1 focus:ring-ring outline-none w-[220px]"
            />
          </div>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard label="Active Seekers"    value={247}   change="+12% from last month" icon={Users}       tone="pink"   />
        <StatCard label="Active Matches"    value={89}    change="+8% from last month"  icon={GitBranch}   tone="blue"   />
        <StatCard label="Completion Rate"   value="73%"   change="+5% from last month"  icon={CheckCircle2} tone="green" />
        <StatCard label="Engagement Score"  value={82}    change="+3 pts this week"     icon={Activity}    tone="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-bold text-foreground mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {activities.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", a.tone)} />
                  <span className="text-sm text-foreground truncate">{a.text}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">{a.when}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-bold text-foreground mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <QuickAction label="New Seeker Intake" icon={Users}       primary onClick={() => onNavigate?.("seekers")} />
            <QuickAction label="Review Matches"    icon={GitBranch}            onClick={() => onNavigate?.("matches")} />
            <QuickAction label="Create Campaign"   icon={Plus}                 onClick={() => onNavigate?.("automations")} />
            <QuickAction label="Add Content"       icon={FileText}             onClick={() => onNavigate?.("content_library")} />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  label, icon: Icon, primary, onClick
}: { label: string; icon: any; primary?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-md transition-all",
        primary
          ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          : "bg-card border border-border text-foreground hover:bg-muted/50"
      )}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

// ============================================================================
// SEEKERS
// ============================================================================

type SeekerRow = {
  id: string; name: string; email: string; maturity: string; maturityTone: any;
  campaign: string; engagement: number; engagementTone: any; status: string; statusTone: any;
  avatarTone: any;
};

const SEEKERS: SeekerRow[] = [
  { id: "s1", name: "Sarah Abebe",     email: "sarah@email.com",   maturity: "New Believer", maturityTone: "green",  campaign: "Foundations of Faith", engagement: 82, engagementTone: "green", status: "Active",  statusTone: "green",  avatarTone: "rose" },
  { id: "s2", name: "David Kebede",    email: "david.k@email.com", maturity: "Seeker",       maturityTone: "amber",  campaign: "Salvation Basics",     engagement: 58, engagementTone: "amber", status: "Active",  statusTone: "green",  avatarTone: "blue" },
  { id: "s3", name: "Abigail Johnson", email: "abigail.j@email.com", maturity: "Growing",    maturityTone: "blue",   campaign: "Prayer & Worship",     engagement: 91, engagementTone: "blue",  status: "Active",  statusTone: "green",  avatarTone: "purple" },
  { id: "s4", name: "Miriam Tadesse",  email: "miriam.t@email.com", maturity: "Interested",  maturityTone: "orange", campaign: "—",                    engagement: 30, engagementTone: "red",   status: "Pending", statusTone: "amber", avatarTone: "green" },
];

export function SeekersView({ canCreate = true }: { canCreate?: boolean }) {
  const [query, setQuery] = useState("");
  const filtered = SEEKERS.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.email.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Seekers"
        subtitle="Manage and track seeker journeys"
        actions={canCreate && (
          <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-sm">
            <Plus className="w-4 h-4" /> New Seeker
          </button>
        )}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search seekers by name or email..."
            className="w-full pl-9 pr-3 py-2.5 bg-card border border-border rounded-md text-sm focus:ring-1 focus:ring-ring outline-none"
          />
        </div>
        <FilterButton label="Maturity Level" />
        <FilterButton label="Status" />
        <FilterButton label="Newest first" />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 text-left font-semibold w-10"><input type="checkbox" className="accent-primary" /></th>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Maturity</th>
              <th className="px-4 py-3 text-left font-semibold">Campaign</th>
              <th className="px-4 py-3 text-left font-semibold">Engagement</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3"><input type="checkbox" className="accent-primary" /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} tone={s.avatarTone} />
                    <div>
                      <div className="text-sm font-semibold text-foreground">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><Chip tone={s.maturityTone}>{s.maturity}</Chip></td>
                <td className="px-4 py-3 text-sm text-foreground">{s.campaign}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <div className="flex-1"><ProgressBar value={s.engagement} tone={s.engagementTone} /></div>
                    <span className="text-xs font-semibold text-foreground w-10 text-right">{s.engagement}%</span>
                  </div>
                </td>
                <td className="px-4 py-3"><Chip tone={s.statusTone}>{s.status}</Chip></td>
                <td className="px-4 py-3 text-right">
                  <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-all">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterButton({ label }: { label: string }) {
  return (
    <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-card border border-border rounded-md hover:bg-muted/50 transition-all">
      {label}
      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
    </button>
  );
}

// ============================================================================
// MENTORS
// ============================================================================

const MENTORS = [
  { id: "m1", name: "Pastor James K.",   email: "james@email.com",   specialty: "New Believers, Grief", languages: "EN, AM", capacity: "4/5",  load: 80, status: "Active",      statusTone: "green", avatarTone: "blue" as const,    experience: "Senior" },
  { id: "m2", name: "Mentor Daniel M.",  email: "daniel@email.com",  specialty: "Youth, Apologetics",   languages: "EN, AM", capacity: "3/5",  load: 60, status: "Active",      statusTone: "green", avatarTone: "purple" as const,  experience: "Experienced" },
  { id: "m3", name: "Sister Ruth B.",    email: "ruth@email.com",    specialty: "Women, Prayer",        languages: "EN, OM", capacity: "5/5",  load: 100, status: "Unavailable", statusTone: "amber", avatarTone: "rose" as const,    experience: "Experienced" },
  { id: "m4", name: "Elder Susan M.",    email: "susan@email.com",   specialty: "Bible Study",          languages: "EN",     capacity: "2/6",  load: 33, status: "Active",      statusTone: "green", avatarTone: "amber" as const,   experience: "Senior" },
];

export function MentorsView({ canCreate = true }: { canCreate?: boolean }) {
  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Mentors"
        subtitle="Manage mentor profiles, availability, and capacity"
        actions={canCreate && (
          <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-sm">
            <Plus className="w-4 h-4" /> New Mentor
          </button>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard label="Total Mentors"  value={18} icon={ShieldCheck} tone="blue"  />
        <StatCard label="Active"         value={14} icon={CheckCircle2} tone="green" />
        <StatCard label="Avg. Load"      value="68%" icon={Activity}    tone="amber" />
        <StatCard label="Available Slots" value={22} icon={Users}       tone="purple" />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 text-left font-semibold">Mentor</th>
              <th className="px-4 py-3 text-left font-semibold">Specialty Areas</th>
              <th className="px-4 py-3 text-left font-semibold">Languages</th>
              <th className="px-4 py-3 text-left font-semibold">Experience</th>
              <th className="px-4 py-3 text-left font-semibold">Capacity</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {MENTORS.map(m => (
              <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} tone={m.avatarTone} />
                    <div>
                      <div className="text-sm font-semibold text-foreground">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-foreground">{m.specialty}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{m.languages}</td>
                <td className="px-4 py-3"><Chip tone="slate">{m.experience}</Chip></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <div className="flex-1"><ProgressBar value={m.load} tone={m.load >= 90 ? "red" : m.load >= 70 ? "amber" : "green"} /></div>
                    <span className="text-xs font-semibold text-foreground">{m.capacity}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><Chip tone={m.statusTone}>{m.status}</Chip></td>
                <td className="px-4 py-3 text-right">
                  <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-all">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// MATCHES
// ============================================================================

const MATCHES = [
  { id: "mt1", score: 94, scoreTone: "green" as const, seeker: "Abigail Johnson", mentor: "Pastor James K.",  factors: [["Lang", 95, "green"], ["Interests", 88, "blue"]], status: "Proposed", statusTone: "amber" as const },
  { id: "mt2", score: 87, scoreTone: "green" as const, seeker: "David Kebede",    mentor: "Mentor Daniel M.", factors: [["Age", 92, "green"], ["Location", 85, "blue"]],  status: "Proposed", statusTone: "amber" as const },
  { id: "mt3", score: 72, scoreTone: "amber" as const, seeker: "Miriam Tadesse",  mentor: "Sister Ruth B.",   factors: [["Gender", 100, "red"], ["Lang", 70, "amber"]], status: "Accepted", statusTone: "green" as const },
];

export function MatchesView() {
  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="AI Match Proposals"
        subtitle="Review and approve AI-suggested mentor-seeker matches"
        actions={(
          <>
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-sm">
              <Sparkles className="w-4 h-4" /> Run Auto-Match
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-card border border-border rounded-md hover:bg-muted/50 transition-all">
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
          </>
        )}
      />

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 text-left font-semibold w-20">Score</th>
              <th className="px-4 py-3 text-left font-semibold">Seeker</th>
              <th className="px-4 py-3 text-left font-semibold">Suggested Mentor</th>
              <th className="px-4 py-3 text-left font-semibold">Match Factors</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {MATCHES.map(m => (
              <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <span className={cn(
                    "inline-flex items-center justify-center w-10 h-8 rounded-full text-sm font-bold",
                    m.scoreTone === "green" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  )}>{m.score}</span>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-foreground">{m.seeker}</td>
                <td className="px-4 py-3 text-sm text-foreground">{m.mentor}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {m.factors.map(([k, v, tone]: any, i: number) => (
                      <Chip key={i} tone={tone}>{k} {v}%</Chip>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3"><Chip tone={m.statusTone}>{m.status}</Chip></td>
                <td className="px-4 py-3 text-right">
                  {m.status === "Proposed" ? (
                    <div className="flex items-center justify-end gap-2">
                      <button className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-all">Accept</button>
                      <button className="px-3 py-1.5 text-xs font-semibold bg-card border border-border rounded hover:bg-muted/50 transition-all">Reject</button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Matched</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-violet-50/50 border border-violet-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-violet-600" />
          <span className="text-sm font-semibold text-violet-900">AI Match Reasoning</span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          Abigail shares strong language alignment (English, 95%) and interest overlap (Prayer, Bible Study) with Pastor James.
          Both are in the same timezone and James has capacity for 2 more seekers. Confidence: High.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// FAITH JOURNEYS (Pipeline + Milestones combined)
// ============================================================================

const PIPELINE_COLS = [
  { key: "touchpoint", label: "Touchpoint",   dot: "bg-slate-400",   count: 86,
    cards: [
      { name: "Sara Ahmed",   source: "Telegram Bot",  stage: "Bot",         indicators: 1, total: 7, tone: "slate" as const,  avatarTone: "rose" as const },
      { name: "Tadesse M.",   source: "WhatsApp",      stage: "Conversation",indicators: 2, total: 7, tone: "green" as const,  avatarTone: "blue" as const },
    ]
  },
  { key: "engaged",    label: "Engaged",      dot: "bg-amber-500",   count: 124,
    cards: [
      { name: "Abigail Johnson", source: "Self-guided",  stage: "Self-guided",  indicators: 4, total: 7, tone: "amber" as const, avatarTone: "purple" as const },
      { name: "David Kebede",    source: "Conversation", stage: "Conversation", indicators: 3, total: 7, tone: "green" as const, avatarTone: "rose" as const },
    ]
  },
  { key: "active",     label: "Active Journey", dot: "bg-blue-500",  count: 67,
    cards: [
      { name: "Miriam Haile",   source: "Conversation", stage: "Conversation", indicators: 6, total: 7, tone: "green" as const, avatarTone: "amber" as const },
    ]
  },
  { key: "decision",   label: "Decision",     dot: "bg-emerald-500", count: 89,
    cards: [
      { name: "Samuel B.",      source: "Self-guided",  stage: "Confirmed Decision", indicators: 7, total: 7, tone: "green" as const, avatarTone: "green" as const },
    ]
  },
];

export function FaithJourneysView() {
  const [tab, setTab] = useState<"pipeline" | "milestones" | "list">("pipeline");
  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Faith Journey Pipeline"
        subtitle="Track new faith journeys and their progression through indicators"
        actions={(
          <>
            <FilterButton label="Q1 2026" />
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-card border border-border rounded-md hover:bg-muted/50 transition-all">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-sm">
              <Plus className="w-4 h-4" /> New Journey
            </button>
          </>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard label="New Faith Journeys" value={342}   change="+18% this quarter"   icon={TrendingUp} tone="blue"   />
        <StatCard label="Active Journeys"    value="1,247" subtitle="across 5 platforms" icon={Activity}   tone="purple" />
        <StatCard label="Milestone Reached"  value={89}    subtitle="decisions this month" icon={CheckCircle2} tone="green" />
        <StatCard label="Avg. Indicators Met" value="4.2 / 7" change="+0.6 from last quarter" icon={Star} tone="amber" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {([
          ["pipeline",   "Pipeline"],
          ["milestones", "Spiritual Milestones"],
          ["list",       "All Journeys"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "px-4 py-2.5 text-sm font-semibold border-b-2 transition-all",
              tab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >{label}</button>
        ))}
      </div>

      {tab === "pipeline" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PIPELINE_COLS.map(col => (
            <div key={col.key} className="bg-card border border-border rounded-lg p-3 min-h-[340px]">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2.5 h-2.5 rounded-full", col.dot)} />
                  <span className="text-sm font-semibold text-foreground">{col.label}</span>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">{col.count}</span>
              </div>
              <div className="space-y-2">
                {col.cards.map((c, i) => (
                  <div key={i} className="bg-background border border-border rounded-md p-3 hover:border-foreground/10 transition-all cursor-pointer">
                    <div className="flex items-center gap-2.5 mb-2">
                      <Avatar name={c.name} tone={c.avatarTone} />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">{c.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{c.source}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: c.total }).map((_, idx) => (
                        <div key={idx} className={cn("h-1.5 flex-1 rounded-full", idx < c.indicators ? (c.tone === "green" ? "bg-emerald-500" : c.tone === "amber" ? "bg-amber-500" : "bg-blue-500") : "bg-muted")} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <Chip tone={c.tone}>{c.stage}</Chip>
                      <span className="text-xs text-muted-foreground">{c.indicators}/{c.total} indicators</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "milestones" && <MilestonesInner />}
      {tab === "list" && <JourneyListInner />}
    </div>
  );
}

// Standalone Milestones page (also reachable as a tab inside Faith Journeys)
export function MilestonesView() {
  const handleExport = () => {
    // Build a CSV from the same data shown in the cards.
    const rows = [
      ["Person", "Journey Type", "Started", "Language", "State", "Indicators", "Milestone", "Status", "Date / Note"],
      ["Abigail Johnson", "Self-guided Journey", "Jan 12, 2026", "English", "Active Journey", "6/7", "Salvation Decision", "Confirmed",   "Feb 3, 2026 — Confirmed by Pastor James K."],
      ["Abigail Johnson", "Self-guided Journey", "Jan 12, 2026", "English", "Active Journey", "6/7", "Baptism",            "Confirmed",   "Mar 15, 2026 — Public statement of faith"],
      ["Abigail Johnson", "Self-guided Journey", "Jan 12, 2026", "English", "Active Journey", "6/7", "Community",          "In Progress", "Referred to local fellowship — awaiting confirmation"],
      ["Abigail Johnson", "Self-guided Journey", "Jan 12, 2026", "English", "Active Journey", "6/7", "Growth Evidence",    "Not Started", "Prayer 0/7; Bible 0/7; Contribution not started"],
      ["David Kebede",    "Conversation-based",  "Feb 28, 2026", "Amharic", "Engaged",        "3/7", "Salvation",          "In Progress", "Indicated only — awaiting confirmation"],
      ["David Kebede",    "Conversation-based",  "Feb 28, 2026", "Amharic", "Engaged",        "3/7", "Baptism",            "Not Started", "—"],
      ["David Kebede",    "Conversation-based",  "Feb 28, 2026", "Amharic", "Engaged",        "3/7", "Community",          "Not Started", "—"],
      ["David Kebede",    "Conversation-based",  "Feb 28, 2026", "Amharic", "Engaged",        "3/7", "Growth",             "Not Started", "—"],
    ];
    const csv = rows
      .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    try {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const today = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `spiritual-milestones-${today}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // No-op: browsers in unusual environments may block the download.
    }
  };

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Spiritual Milestones"
        subtitle="Track salvation decisions, baptism, and community connection for each person"
        actions={(
          <>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-card border border-border rounded-md hover:bg-muted/50 transition-all">
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" /> Export Report
            </button>
          </>
        )}
      />
      <MilestonesInner />
    </div>
  );
}

function MilestonesInner() {
  const people = [
    {
      name: "Abigail Johnson", type: "Self-guided Journey", started: "Jan 12, 2026", lang: "English",
      state: "Active Journey", stateTone: "green" as const, indicators: "6/7 Indicators", avatarTone: "purple" as const,
      milestones: [
        { key: "salvation", label: "Salvation Decision", date: "Feb 3, 2026", state: "done", sub: ["Indicated decision (self-reported)", "Confirmed by Pastor James K."] },
        { key: "baptism",   label: "Baptism",            date: "Mar 15, 2026", state: "done", sub: ["Public statement of faith confirmed"] },
        { key: "community", label: "Community",          date: "In Progress",  state: "progress", sub: ["Referred to local fellowship", "Awaiting connection confirmation"] },
        { key: "growth",    label: "Growth Evidence",    date: "Not Started",  state: "pending", sub: ["Prayer (0/7 days)", "Bible engagement (0/7 days)", "Contribution / Serving"] },
      ]
    },
    {
      name: "David Kebede", type: "Conversation-based", started: "Feb 28, 2026", lang: "Amharic",
      state: "Engaged", stateTone: "amber" as const, indicators: "3/7 Indicators", avatarTone: "rose" as const,
      milestones: [
        { key: "salvation", label: "Salvation", date: "Indicated only — awaiting confirmation", state: "progress", sub: [] },
        { key: "baptism",   label: "Baptism",   date: "Not yet", state: "pending", sub: [] },
        { key: "community", label: "Community", date: "Not yet", state: "pending", sub: [] },
        { key: "growth",    label: "Growth",    date: "Not yet", state: "pending", sub: [] },
      ]
    },
  ];
  const stateClass = (s: string) => s === "done"
    ? "bg-emerald-50 border-emerald-200"
    : s === "progress" ? "bg-amber-50 border-amber-200" : "bg-muted/30 border-border";
  const stateIcon = (s: string) => s === "done"
    ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
    : s === "progress" ? <Clock className="w-4 h-4 text-amber-600" /> : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />;

  return (
    <div className="space-y-4">
      {people.map((p, pi) => (
        <div key={pi} className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <Avatar name={p.name} tone={p.avatarTone} />
              <div>
                <div className="text-sm font-bold text-foreground">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.type} · Started: {p.started} · {p.lang}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Chip tone={p.stateTone}>{p.state}</Chip>
              <span className="text-xs text-muted-foreground font-medium">{p.indicators}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {p.milestones.map(m => (
              <div key={m.key} className={cn("border rounded-lg p-3", stateClass(m.state))}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {stateIcon(m.state)}
                    <span className="text-sm font-semibold text-foreground">{m.label}</span>
                  </div>
                  {m.date.includes(",") ? (
                    <span className="text-xs text-muted-foreground">{m.date}</span>
                  ) : null}
                </div>
                {!m.date.includes(",") && <div className="text-xs text-muted-foreground mb-1">{m.date}</div>}
                <ul className="text-xs text-muted-foreground space-y-1 mt-1">
                  {m.sub.map((s, si) => <li key={si} className="flex items-start gap-1.5"><span className="w-1 h-1 rounded-full bg-muted-foreground/60 mt-1.5" />{s}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function JourneyListInner() {
  const rows = [
    { name: "Fatima A.",  source: "Telegram",  type: "Salvation",  stage: "Decision", stageTone: "green" as const, indicators: 5, total: 7, milestone: "Salvation Decision",  validation: "Pending",   validationTone: "amber" as const, avatarTone: "rose" as const },
    { name: "Daniel M.",  source: "WhatsApp",  type: "Baptism",    stage: "Active",   stageTone: "amber" as const, indicators: 3, total: 7, milestone: "Baptism Request",     validation: "Pending",   validationTone: "amber" as const, avatarTone: "blue" as const },
    { name: "Sara K.",    source: "Self-guided", type: "Salvation", stage: "Engaged",  stageTone: "blue" as const,  indicators: 4, total: 7, milestone: "Bible Study Started", validation: "Confirmed", validationTone: "green" as const, avatarTone: "green" as const },
    { name: "Tesfaye W.", source: "Messenger", type: "Community",  stage: "Touchpoint", stageTone: "slate" as const, indicators: 1, total: 7, milestone: "First Contact",      validation: "N/A",      validationTone: "slate" as const, avatarTone: "purple" as const },
  ];
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-muted/40 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3 text-left font-semibold">Person</th>
            <th className="px-4 py-3 text-left font-semibold">Journey Type</th>
            <th className="px-4 py-3 text-left font-semibold">Stage</th>
            <th className="px-4 py-3 text-left font-semibold">Indicators</th>
            <th className="px-4 py-3 text-left font-semibold">Last Milestone</th>
            <th className="px-4 py-3 text-left font-semibold">Validation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={r.name} tone={r.avatarTone} />
                  <div>
                    <div className="text-sm font-semibold text-foreground">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.source}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3"><Chip tone={r.type === "Salvation" ? "green" : r.type === "Baptism" ? "blue" : "purple"}>{r.type}</Chip></td>
              <td className="px-4 py-3"><Chip tone={r.stageTone}>{r.stage}</Chip></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: r.total }).map((_, idx) => (
                    <div key={idx} className={cn("w-2 h-2 rounded-full", idx < r.indicators ? "bg-emerald-500" : "bg-muted")} />
                  ))}
                  <span className="ml-2 text-xs text-muted-foreground">{r.indicators}/{r.total}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-foreground">{r.milestone}</td>
              <td className="px-4 py-3"><Chip tone={r.validationTone}>{r.validation}</Chip></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// CONTENT LIBRARY
// ============================================================================

const CONTENT = [
  { title: "Welcome to Your Faith Journey",         type: "Devotional",   typeTone: "pink"   as const, category: "Salvation",    difficulty: "Beginner",     lang: "English", status: "Published", statusTone: "green" as const },
  { title: "Finding Peace in His Presence",         type: "Study",        typeTone: "blue"   as const, category: "Prayer",       difficulty: "Intermediate", lang: "English", status: "Published", statusTone: "green" as const },
  { title: "Understanding the Holy Spirit",         type: "Guide",        typeTone: "purple" as const, category: "Holy Spirit",  difficulty: "Advanced",     lang: "Amharic", status: "Draft",     statusTone: "amber" as const },
  { title: "Understanding the Bible: A Beginner's Guide", type: "Bible Study",  typeTone: "blue" as const, category: "Bible Basics", difficulty: "Beginner", lang: "English", status: "Published", statusTone: "green" as const },
  { title: "Daily Prayer Practice",                 type: "Prayer Guide", typeTone: "pink" as const,   category: "Prayer",       difficulty: "Beginner",     lang: "English", status: "Published", statusTone: "green" as const },
  { title: "7-Day Worship Challenge",               type: "Challenge",    typeTone: "amber" as const,  category: "Worship",      difficulty: "Beginner",     lang: "English", status: "Published", statusTone: "green" as const },
];

export function ContentLibraryView({ canEdit = true }: { canEdit?: boolean }) {
  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Content Library"
        subtitle="Manage devotionals, studies, and resources for automations"
        actions={canEdit && (
          <>
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-violet-50 text-violet-700 rounded-md hover:bg-violet-100 transition-all">
              <Sparkles className="w-4 h-4" /> AI Generate
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-sm">
              <Plus className="w-4 h-4" /> Add Content
            </button>
          </>
        )}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <FilterButton label="All Types" />
        <FilterButton label="Category" />
        <FilterButton label="Difficulty" />
        <FilterButton label="Language" />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 text-left font-semibold">Title</th>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
              <th className="px-4 py-3 text-left font-semibold">Category</th>
              <th className="px-4 py-3 text-left font-semibold">Difficulty</th>
              <th className="px-4 py-3 text-left font-semibold">Language</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {CONTENT.map((c, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{c.title}</td>
                <td className="px-4 py-3"><Chip tone={c.typeTone}>{c.type}</Chip></td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{c.category}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{c.difficulty}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{c.lang}</td>
                <td className="px-4 py-3"><Chip tone={c.statusTone}>{c.status}</Chip></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// GROWTH METRICS
// ============================================================================

export function GrowthMetricsView() {
  const growers = [
    { name: "Abigail J.", prayer: "6/7", bible: "5/7", serve: "Weekly",  avatarTone: "purple" as const },
    { name: "Samuel B.",  prayer: "7/7", bible: "6/7", serve: "Daily",   avatarTone: "green" as const },
    { name: "David K.",   prayer: "3/7", bible: "2/7", serve: "Monthly", avatarTone: "rose" as const },
    { name: "Miriam H.",  prayer: "5/7", bible: "4/7", serve: "Weekly",  avatarTone: "amber" as const },
  ];
  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Growth Metrics"
        subtitle="Track prayer, Bible engagement, contribution, and spiritual fruit across all journeys"
        actions={(
          <>
            <FilterButton label="Last 30 Days" />
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-sm">
              <Download className="w-4 h-4" /> Export
            </button>
          </>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard label="Prayer"           value="4.3 days/week" change="+0.8 from last month"  icon={Heart}      tone="pink" />
        <StatCard label="Bible Engagement" value="3.7 days/week" change="+1.2 from last month"  icon={BookOpen}   tone="blue" />
        <StatCard label="Contribution"     value="Weekly"        subtitle="62% participate weekly" icon={HandHeart} tone="amber" />
        <StatCard label="Fruit of the Spirit" value="38 testimonies" change="+12 this month"    icon={Star}       tone="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">Weekly Engagement Trend</h3>
            <div className="flex items-center gap-3 text-xs">
              <LegendDot color="bg-violet-500" label="Prayer" />
              <LegendDot color="bg-blue-500"   label="Bible" />
              <LegendDot color="bg-amber-500"  label="Contribution" />
            </div>
          </div>
          <div className="flex items-end justify-around gap-6 h-52 px-4">
            {[[85, 70, 55], [90, 75, 50], [78, 82, 60], [92, 80, 65]].map((vals, wi) => (
              <div key={wi} className="flex items-end gap-1.5 h-full">
                <div className="w-6 bg-violet-500 rounded-t-md" style={{ height: `${vals[0]}%` }} />
                <div className="w-6 bg-blue-500 rounded-t-md"   style={{ height: `${vals[1]}%` }} />
                <div className="w-6 bg-amber-500 rounded-t-md"  style={{ height: `${vals[2]}%` }} />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-around mt-3">
            {["Week 1", "Week 2", "Week 3", "Week 4"].map(w => <span key={w} className="text-xs text-muted-foreground font-medium">{w}</span>)}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">Individual Growth Tracking</h3>
            <span className="text-xs font-semibold text-muted-foreground">Top Growers</span>
          </div>
          <div className="border-b border-border pb-2 mb-2 grid grid-cols-4 gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <span>Person</span><span>Prayer</span><span>Bible</span><span>Serve</span>
          </div>
          <div className="space-y-2">
            {growers.map((g, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 items-center py-1.5">
                <div className="flex items-center gap-2">
                  <Avatar name={g.name} tone={g.avatarTone} />
                  <span className="text-sm font-medium text-foreground truncate">{g.name}</span>
                </div>
                <span className="text-sm text-violet-600 font-semibold">{g.prayer}</span>
                <span className="text-sm text-blue-600 font-semibold">{g.bible}</span>
                <span className="text-sm text-amber-600 font-semibold">{g.serve}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("w-2 h-2 rounded-full", color)} />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

// ============================================================================
// VITAL ANALYTICS
// ============================================================================

export function VitalAnalyticsView() {
  const funnel = [
    { key: "V", label: "V — Volume",      value: "12,450", hint: "Touchpoints",      color: "bg-blue-500"   },
    { key: "I", label: "I — Interaction", value: "3,820",  hint: "Engaged back",     color: "bg-violet-500" },
    { key: "T", label: "T — Transaction", value: "1,247",  hint: "Faith Journey started", color: "bg-pink-500"   },
    { key: "A", label: "A — Active",      value: "342",    hint: "Active journeys",  color: "bg-amber-500"  },
    { key: "L", label: "L — Loyal",       value: "89",     hint: "Decision + connected", color: "bg-emerald-500" },
  ];
  const conversions = [
    { from: "V", to: "I", pct: "30.7%" },
    { from: "I", to: "T", pct: "32.6%" },
    { from: "T", to: "A", pct: "27.4%" },
    { from: "A", to: "L", pct: "26.0%" },
  ];
  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="VITAL Framework Analytics"
        subtitle="Volume → Interaction → Transaction → Active → Loyal — track progression from touchpoints to committed journeys"
        actions={(
          <>
            <FilterButton label="2026" />
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-sm">
              <Share2 className="w-4 h-4" /> Share Report
            </button>
          </>
        )}
      />

      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-bold text-foreground mb-4">VITAL Funnel — People Progression</h3>
        <div className="grid grid-cols-5 gap-2">
          {funnel.map(f => (
            <div key={f.key} className={cn("relative text-white rounded-lg p-4 flex flex-col items-center justify-center min-h-[110px]", f.color)}>
              <div className="text-3xl font-bold tracking-tight">{f.value}</div>
              <div className="text-xs font-semibold mt-1 opacity-95">{f.label}</div>
              <div className="text-xs opacity-80">{f.hint}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2 mt-3 px-8">
          {conversions.map((c, i) => (
            <div key={i} className="text-center">
              <div className="text-lg font-bold text-blue-600">{c.pct}</div>
              <div className="text-xs text-muted-foreground">{c.from} → {c.to}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-bold text-foreground mb-3">Platform Breakdown</h3>
          <div className="space-y-2.5">
            {[
              { label: "Telegram",  value: "4,230", dot: "bg-blue-500" },
              { label: "WhatsApp",  value: "3,810", dot: "bg-emerald-500" },
              { label: "SMS",       value: "2,150", dot: "bg-violet-500" },
              { label: "Web",       value: "1,420", dot: "bg-amber-500" },
              { label: "Messenger", value: "840",   dot: "bg-pink-500" },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", p.dot)} />
                  <span className="text-sm text-foreground">{p.label}</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{p.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-bold text-foreground mb-3">Journey Type Distribution</h3>
          <div className="space-y-2.5">
            {[
              { chip: "Bot",          chipTone: "blue"  as const, label: "Self-guided bots",   value: "58%" },
              { chip: "Conversation", chipTone: "green" as const, label: "Human-led",          value: "30%" },
              { chip: "Self-guided",  chipTone: "amber" as const, label: "Web-based",          value: "12%" },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Chip tone={p.chipTone}>{p.chip}</Chip>
                  <span className="text-sm text-muted-foreground">{p.label}</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{p.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-bold text-foreground mb-3">Demographics</h3>
          <div className="space-y-2.5">
            {[
              { label: "Top Language", value: "Amharic (42%)" },
              { label: "Top Country",  value: "Ethiopia (68%)" },
              { label: "Gender Split", value: "54% F / 46% M" },
              { label: "Avg. Age",     value: "24 years" },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{p.label}</span>
                <span className="text-sm font-semibold text-foreground">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// REPORTING (153 Collective)
// ============================================================================

export function ReportingView() {
  const [dim, setDim] = useState<"language" | "country" | "platform" | "gender" | "journey">("language");
  const rows = {
    language: [
      { label: "Amharic",     cols: ["144", "38", "29", "14"], pct: 26.4 },
      { label: "English",     cols: ["118", "31", "24", "11"], pct: 26.3 },
      { label: "Afaan Oromo", cols: ["80",  "20", "14", "8"],  pct: 25.0 },
    ],
    country: [
      { label: "Ethiopia",    cols: ["232", "62", "48", "23"], pct: 26.7 },
      { label: "Kenya",       cols: ["75",  "19", "14", "7"],  pct: 25.3 },
      { label: "Other",       cols: ["35",  "8",  "5",  "3"],  pct: 22.8 },
    ],
    platform: [
      { label: "Telegram",    cols: ["142", "36", "28", "14"], pct: 25.3 },
      { label: "WhatsApp",    cols: ["128", "35", "25", "12"], pct: 27.3 },
      { label: "SMS",         cols: ["72",  "18", "12", "6"],  pct: 25.0 },
    ],
    gender: [
      { label: "Female",      cols: ["185", "50", "38", "18"], pct: 27.0 },
      { label: "Male",        cols: ["157", "39", "29", "15"], pct: 24.8 },
    ],
    journey: [
      { label: "Salvation",   cols: ["210", "60", "45", "22"], pct: 28.6 },
      { label: "Baptism",     cols: ["70",  "17", "13", "6"],  pct: 24.3 },
      { label: "Community",   cols: ["62",  "12", "9",  "5"],  pct: 19.4 },
    ],
  }[dim];

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="153 Collective Reporting"
        subtitle="Generate standardized reports for cross-ministry comparison"
        actions={(
          <>
            <FilterButton label="Q1 2026" />
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-all shadow-sm">
              <Sparkles className="w-4 h-4" /> Generate Report
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-sm">
              <Download className="w-4 h-4" /> Export PDF
            </button>
          </>
        )}
      />

      <div className="bg-slate-900 text-white rounded-lg p-6">
        <div className="flex items-center gap-4 mb-3 flex-wrap">
          <Chip tone="blue" className="uppercase tracking-widest bg-blue-500/20 text-blue-200">153 Collective Standard</Chip>
          <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Q1 2026 Report</span>
        </div>
        <p className="text-lg font-semibold leading-snug">
          Turumba had 342 new faith journeys across its platforms in Q1 2026, with 89 confirmed decisions and 67 active journeys progressing through spiritual milestones.
        </p>
        <div className="flex items-center gap-5 mt-4 text-sm text-slate-300 flex-wrap">
          <span className="inline-flex items-center gap-1.5"><Globe className="w-4 h-4" /> 5 Platforms</span>
          <span className="inline-flex items-center gap-1.5"><Languages className="w-4 h-4" /> 3 Languages</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" /> 4 Countries</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-sm font-bold text-foreground">Breakdown by Dimension</h3>
          <div className="flex items-center gap-1 bg-muted/60 rounded-md p-0.5">
            {([
              ["language", "Language"],
              ["country",  "Country"],
              ["platform", "Platform"],
              ["gender",   "Gender"],
              ["journey",  "Journey Type"],
            ] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setDim(k)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded transition-all",
                  dim === k ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >{label}</button>
            ))}
          </div>
        </div>
        <div className="overflow-hidden">
          <div className="grid grid-cols-6 gap-2 px-3 py-2 bg-muted/40 rounded text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            <span>Dimension</span>
            <span>New Journeys</span>
            <span>Decisions</span>
            <span>Active</span>
            <span>Connected</span>
            <span>Conversion %</span>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-6 gap-2 px-3 py-3 items-center border-b border-border last:border-0">
              <span className="text-sm font-medium text-foreground">{r.label}</span>
              {r.cols.map((c, ci) => <span key={ci} className="text-sm text-foreground">{c}</span>)}
              <div className="flex items-center gap-2">
                <div className="flex-1"><ProgressBar value={r.pct * 3} tone="green" /></div>
                <span className="text-sm font-semibold text-emerald-600">{r.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VALIDATIONS
// ============================================================================

export function ValidationsView() {
  const [tab, setTab] = useState<"pending" | "confirmed" | "all">("pending");
  const rows = [
    { name: "Sara Ahmed",     email: "sara@email.com",     milestone: "Salvation Decision", milestoneTone: "green" as const, date: "Mar 28, 2026", source: "via Telegram bot",  validator: "Pastor James K.", validatorStatus: "Notified 2 days ago", status: "pending",    avatarTone: "rose" as const },
    { name: "David Kebede",   email: "david@email.com",    milestone: "Baptism",            milestoneTone: "blue" as const,  date: "Apr 2, 2026",  source: "via WhatsApp",      validator: "Mentor Daniel M.", validatorStatus: "Notified today",       status: "pending",    avatarTone: "blue" as const },
    { name: "Abigail Johnson",email: "abigail@email.com",  milestone: "Salvation Decision", milestoneTone: "green" as const, date: "Feb 3, 2026",  source: "via Self-guided",   validator: "Pastor James K.", validatorStatus: "Confirmed Feb 5",     status: "confirmed",  avatarTone: "purple" as const },
    { name: "Miriam Haile",   email: "miriam@email.com",   milestone: "Community",          milestoneTone: "purple" as const, date: "Apr 5, 2026",  source: "Referred to fellowship", validator: "Sister Ruth B.", validatorStatus: "Not yet notified",   status: "pending",    avatarTone: "amber" as const },
  ];
  const filtered = tab === "all" ? rows : rows.filter(r => r.status === tab);

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Decision Validation"
        subtitle="Two-step confirmation: self-reported decisions validated by mentors or community leaders"
        actions={(
          <>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-card border border-border rounded-md hover:bg-muted/50 transition-all">
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-all shadow-sm">
              <Bell className="w-4 h-4" /> Send Reminders
            </button>
          </>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-4">
          <div className="text-xs font-medium text-amber-700 uppercase tracking-wider">Pending Validation</div>
          <div className="text-3xl font-bold text-amber-900 mt-1">24</div>
          <div className="text-xs text-amber-700">awaiting confirmation</div>
        </div>
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-4">
          <div className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Confirmed This Month</div>
          <div className="text-3xl font-bold text-emerald-900 mt-1">18</div>
          <div className="text-xs text-emerald-700">+6 from last month</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg. Validation Time</div>
          <div className="text-3xl font-bold text-foreground mt-1">4.2 days</div>
          <div className="text-xs text-emerald-600">-1.3 days improvement</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">Validation Queue</span>
            <Chip tone="amber">24 pending</Chip>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold">
            {([
              ["pending", "Pending"], ["confirmed", "Confirmed"], ["all", "All"]
            ] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={cn("px-3 py-1 rounded transition-colors", tab === k ? "text-primary" : "text-muted-foreground hover:text-foreground")}
              >{label}</button>
            ))}
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 text-left font-semibold">Person</th>
              <th className="px-4 py-3 text-left font-semibold">Milestone</th>
              <th className="px-4 py-3 text-left font-semibold">Self-Reported</th>
              <th className="px-4 py-3 text-left font-semibold">Validator</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className={cn("border-b border-border last:border-0 transition-colors", r.status === "pending" ? "bg-amber-50/30 hover:bg-amber-50/60" : "hover:bg-muted/30")}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.name} tone={r.avatarTone} />
                    <div>
                      <div className="text-sm font-semibold text-foreground">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><Chip tone={r.milestoneTone}><Heart className="w-3 h-3" />{r.milestone}</Chip></td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-foreground">{r.date}</div>
                  <div className="text-xs text-muted-foreground">{r.source}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-foreground">{r.validator}</div>
                  <div className={cn("text-xs", r.status === "confirmed" ? "text-emerald-600" : "text-amber-700")}>{r.validatorStatus}</div>
                </td>
                <td className="px-4 py-3">
                  {r.status === "confirmed"
                    ? <Chip tone="green"><CheckCircle2 className="w-3 h-3" />Confirmed</Chip>
                    : <Chip tone="amber">Pending</Chip>}
                </td>
                <td className="px-4 py-3 text-right">
                  {r.status === "pending" ? (
                    <div className="flex items-center justify-end gap-2">
                      <button className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-all">Confirm</button>
                      <button className="px-3 py-1.5 text-xs font-semibold bg-card border border-border text-rose-600 rounded hover:bg-rose-50 transition-all">Reject</button>
                    </div>
                  ) : (
                    <button className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                      <FileText className="w-3 h-3" /> View audit trail
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
