import React, { useMemo, useState } from "react";
import {
  Users, Search, Filter, Plus, ChevronDown, MoreHorizontal, Send, Edit2,
  Sparkles, ShieldCheck, BarChart3, Activity, FileText, CheckCircle2, XCircle,
  Clock, AlertCircle, Heart, BookOpen, HandHeart, Star, Globe, MapPin,
  Calendar, Download, Share2, Bell, ArrowRight, Flame, Droplets, UsersRound,
  TrendingUp, ChevronUp, MessageCircle, Languages, Filter as FilterIcon,
  GitBranch
} from "lucide-react";
import { cn } from "./types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from "./ui/dropdown-menu";
import { Modal } from "./shared-ui";
import { toast } from "sonner";
import { ArrowLeft, Eye, Trash2, MessageSquare as MessageSquareIcon, Archive, RefreshCw } from "lucide-react";
import {
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

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
  // Thin wrapper around shadcn Badge so we keep the tone API but inherit the
  // shadcn sizing, radius, and focus ring system.
  return (
    <Badge variant="outline" className={cn("border-transparent font-semibold", tones, className)}>
      {children}
    </Badge>
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

// ---------------------------------------------------------------------------
// Discipleship Dashboard — bold editorial layout
//
// Aesthetic direction: "Editorial modern" — DM Sans paired with a 2px corner
// system reads sharper and more designed than typical SaaS rounding. Each
// surface uses a layered gradient + soft shadow rather than flat white, and
// every metric card carries a 2px color accent bar so the eye can scan the
// palette instantly. Charts use recharts with custom gradient fills. Quick
// actions become tile cards instead of list rows for visual weight.
// ---------------------------------------------------------------------------

const ENGAGEMENT_30D = [
  { day: "W1 Mon", active: 180, decisions: 4  },
  { day: "W1 Thu", active: 195, decisions: 7  },
  { day: "W2 Mon", active: 212, decisions: 9  },
  { day: "W2 Thu", active: 205, decisions: 11 },
  { day: "W3 Mon", active: 228, decisions: 14 },
  { day: "W3 Thu", active: 241, decisions: 16 },
  { day: "W4 Mon", active: 247, decisions: 19 },
  { day: "W4 Thu", active: 247, decisions: 22 },
];

const JOURNEY_DIST = [
  { name: "Self-guided bots", value: 58, fill: "#2563eb" },
  { name: "Human-led",        value: 30, fill: "#8b5cf6" },
  { name: "Web-based",        value: 12, fill: "#f59e0b" },
];

const PLATFORM_MIX = [
  { label: "Telegram",  pct: 34, dot: "bg-sky-500",     color: "bg-sky-500" },
  { label: "WhatsApp",  pct: 31, dot: "bg-emerald-500", color: "bg-emerald-500" },
  { label: "SMS",       pct: 17, dot: "bg-violet-500",  color: "bg-violet-500" },
  { label: "Web",       pct: 11, dot: "bg-amber-500",   color: "bg-amber-500" },
  { label: "Messenger", pct:  7, dot: "bg-pink-500",    color: "bg-pink-500" },
];

export function DiscipleshipDashboardView({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const activities = [
    { tone: "bg-emerald-500", icon: CheckCircle2, text: "Sarah M. completed", highlight: "'Foundations of Faith' campaign", when: "2m ago",  meta: "Milestone" },
    { tone: "bg-blue-500",    icon: GitBranch,    text: "New match proposed:", highlight: "David K. → Mentor James",        when: "15m ago", meta: "94 score" },
    { tone: "bg-pink-500",    icon: Users,        text: "",                     highlight: "12 new seekers completed intake this week", when: "1h ago", meta: "Intake" },
    { tone: "bg-violet-500",  icon: Sparkles,     text: "AI assigned",          highlight: "'Finding Peace' to 8 seekers",  when: "3h ago",  meta: "Content" },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-6 space-y-5 bg-gradient-to-br from-slate-50 via-background to-violet-50/40 min-h-full">
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden rounded-sm bg-slate-950 text-white p-8 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.55)]">
        {/* Decorative gradient blobs */}
        <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-blue-500/40 to-violet-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-gradient-to-tr from-pink-500/30 to-violet-500/5 blur-3xl pointer-events-none" />
        {/* Fine grid overlay for texture */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)", backgroundSize: "64px 64px" }}
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-6 items-end">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-300 uppercase tracking-[0.18em]">Live · Turumba Discipleship</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05]">
              {greeting}, <span className="text-blue-300">Samson</span>.
            </h1>
            <p className="text-base text-slate-300 mt-3 max-w-2xl leading-relaxed">
              <span className="font-semibold text-white">247 seekers</span> are journeying with you this month.
              <span className="mx-2 text-slate-500">·</span>
              <span className="font-semibold text-emerald-300">22</span> decisions confirmed.
              <span className="mx-2 text-slate-500">·</span>
              <span className="font-semibold text-pink-300">+18%</span> this quarter.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                placeholder="Search seekers, mentors..."
                className="pl-8 pr-3 py-2 text-sm bg-white/10 text-white placeholder:text-slate-400 border border-white/10 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400/60 w-[260px] backdrop-blur-sm"
              />
            </div>
            <Button
              className="bg-white text-slate-900 hover:bg-slate-100 shadow-lg"
              onClick={() => onNavigate?.("seekers")}
            >
              <Plus className="w-3.5 h-3.5" /> New Seeker Intake
            </Button>
          </div>
        </div>
      </section>

      {/* ---------- HEADLINE METRICS ---------- */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <HeroStat
          accent="from-blue-500 to-blue-600"
          tintClass="bg-blue-50"
          iconBg="bg-blue-500"
          icon={Users}
          label="Active Seekers"
          value="247"
          delta="+12%"
          deltaTone="up"
          sparkColor="#2563eb"
          sparkData={[180, 195, 212, 205, 228, 241, 247]}
        />
        <HeroStat
          accent="from-violet-500 to-fuchsia-500"
          tintClass="bg-violet-50"
          iconBg="bg-violet-500"
          icon={GitBranch}
          label="Active Matches"
          value="89"
          delta="+8%"
          deltaTone="up"
          sparkColor="#8b5cf6"
          sparkData={[65, 68, 74, 76, 81, 85, 89]}
        />
        <HeroStat
          accent="from-emerald-500 to-teal-500"
          tintClass="bg-emerald-50"
          iconBg="bg-emerald-500"
          icon={CheckCircle2}
          label="Completion Rate"
          value="73%"
          delta="+5%"
          deltaTone="up"
          sparkColor="#10b981"
          sparkData={[62, 64, 66, 68, 70, 71, 73]}
        />
        <HeroStat
          accent="from-pink-500 to-rose-500"
          tintClass="bg-pink-50"
          iconBg="bg-pink-500"
          icon={Activity}
          label="Engagement Score"
          value="82"
          delta="+3 pts"
          deltaTone="up"
          sparkColor="#ec4899"
          sparkData={[74, 76, 78, 79, 80, 81, 82]}
        />
      </section>

      {/* ---------- CHARTS ROW ---------- */}
      <section className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-4">
        {/* Line / area chart — engagement trend */}
        <div className="relative rounded-sm bg-card border border-border shadow-[0_12px_36px_-22px_rgba(15,23,42,0.25)] overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500" />
          <div className="p-5 pb-2 flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.14em]">Engagement · 30 days</p>
              <h3 className="text-xl font-bold text-foreground mt-1">Seekers active across the journey</h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <LegendDotBold color="#2563eb" label="Active seekers" />
              <LegendDotBold color="#10b981" label="Decisions" />
            </div>
          </div>
          <div className="px-2 pb-4 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ENGAGEMENT_30D} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="activeArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="decisionArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={36} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "none", borderRadius: 2, color: "white", fontSize: 12 }}
                  labelStyle={{ color: "#cbd5e1", fontSize: 11 }}
                  cursor={{ stroke: "#cbd5e1", strokeDasharray: 3 }}
                />
                <Area type="monotone" dataKey="active"    stroke="#2563eb" strokeWidth={2.5} fill="url(#activeArea)" />
                <Area type="monotone" dataKey="decisions" stroke="#10b981" strokeWidth={2.5} fill="url(#decisionArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut chart — journey type */}
        <div className="relative rounded-sm bg-card border border-border shadow-[0_12px_36px_-22px_rgba(15,23,42,0.25)] overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-amber-500" />
          <div className="p-5 pb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.14em]">Journey mix</p>
            <h3 className="text-xl font-bold text-foreground mt-1">How seekers engage</h3>
          </div>
          <div className="flex items-center gap-4 px-5 pb-5">
            <div className="relative w-[140px] h-[140px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={JOURNEY_DIST} cx="50%" cy="50%" innerRadius={42} outerRadius={66} paddingAngle={2} dataKey="value" stroke="none">
                    {JOURNEY_DIST.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums leading-none">1,247</span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">Active</span>
              </div>
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              {JOURNEY_DIST.map((j, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: j.fill }} />
                      <span className="text-xs text-foreground truncate">{j.name}</span>
                    </div>
                    <span className="text-xs font-bold text-foreground tabular-nums">{j.value}%</span>
                  </div>
                  <div className="h-0.5 bg-muted rounded-full overflow-hidden mt-1">
                    <div className="h-full rounded-full" style={{ width: `${j.value}%`, background: j.fill }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- QUICK ACTIONS ---------- */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-[0.14em]">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickActionTile
            icon={Users}
            title="New Seeker"
            description="Start an intake"
            gradient="from-blue-500 to-blue-600"
            onClick={() => onNavigate?.("seekers")}
          />
          <QuickActionTile
            icon={GitBranch}
            title="Review Matches"
            description="5 proposals pending"
            gradient="from-violet-500 to-fuchsia-500"
            onClick={() => onNavigate?.("matches")}
          />
          <QuickActionTile
            icon={Sparkles}
            title="Create Campaign"
            description="Automate your drip"
            gradient="from-amber-500 to-orange-500"
            onClick={() => onNavigate?.("automations")}
          />
          <QuickActionTile
            icon={BookOpen}
            title="Add Content"
            description="Devotionals, studies"
            gradient="from-emerald-500 to-teal-500"
            onClick={() => onNavigate?.("content_library")}
          />
        </div>
      </section>

      {/* ---------- RECENT ACTIVITY + PLATFORM MIX ---------- */}
      <section className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-4">
        <div className="relative rounded-sm bg-card border border-border shadow-[0_12px_36px_-22px_rgba(15,23,42,0.25)] overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-violet-500" />
          <div className="p-5 pb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.14em]">The last few hours</p>
              <h3 className="text-xl font-bold text-foreground mt-1">Recent activity</h3>
            </div>
            <button className="text-xs font-semibold text-primary hover:underline">View all →</button>
          </div>
          <ol className="relative px-5 pb-5 space-y-4">
            <div className="absolute left-[29px] top-2 bottom-2 w-px bg-border" aria-hidden />
            {activities.map((a, i) => {
              const Icon = a.icon;
              return (
                <li key={i} className="relative flex items-start gap-3 pl-0">
                  <span className={cn("w-6 h-6 rounded-sm flex items-center justify-center text-white shrink-0 ring-4 ring-background relative z-10", a.tone)}>
                    <Icon className="w-3 h-3" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-relaxed">
                      {a.text && <span className="text-muted-foreground">{a.text} </span>}
                      <span className="font-semibold text-foreground">{a.highlight}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{a.when}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{a.meta}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="relative rounded-sm bg-card border border-border shadow-[0_12px_36px_-22px_rgba(15,23,42,0.25)] overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-500 via-emerald-500 to-pink-500" />
          <div className="p-5 pb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.14em]">Where they come from</p>
            <h3 className="text-xl font-bold text-foreground mt-1">Platforms</h3>
          </div>
          <div className="px-5 pb-5 space-y-3">
            {PLATFORM_MIX.map((p, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-sm", p.dot)} />
                    <span className="text-sm text-foreground">{p.label}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground tabular-nums">{p.pct}%</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", p.color)} style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper components for the dashboard
// ---------------------------------------------------------------------------

function HeroStat({
  accent, tintClass, iconBg, icon: Icon, label, value, delta, deltaTone, sparkColor, sparkData,
}: {
  accent: string;
  tintClass: string;
  iconBg: string;
  icon: any;
  label: string;
  value: string;
  delta: string;
  deltaTone: "up" | "down";
  sparkColor: string;
  sparkData: number[];
}) {
  const data = sparkData.map((v, i) => ({ i, v }));
  return (
    <div className="relative rounded-sm bg-card border border-border overflow-hidden shadow-[0_8px_30px_-18px_rgba(15,23,42,0.25)] hover:shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35)] transition-all group">
      {/* 2px color accent strip */}
      <div className={cn("absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r", accent)} />
      {/* Soft tinted wash */}
      <div className={cn("absolute inset-0 opacity-50 pointer-events-none", tintClass)} style={{ maskImage: "linear-gradient(to bottom right, black, transparent 60%)", WebkitMaskImage: "linear-gradient(to bottom right, black, transparent 60%)" }} />

      <div className="relative p-5">
        <div className="flex items-start justify-between mb-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.12em]">{label}</span>
          <span className={cn("w-8 h-8 rounded-sm flex items-center justify-center text-white shadow-md", iconBg)}>
            <Icon className="w-4 h-4" />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-foreground tracking-tight tabular-nums">{value}</span>
          <span className={cn(
            "text-xs font-bold px-1.5 py-0.5 rounded-sm",
            deltaTone === "up" ? "bg-emerald-500/10 text-emerald-700" : "bg-rose-500/10 text-rose-700"
          )}>{deltaTone === "up" ? "↑" : "↓"} {delta}</span>
        </div>
        {/* Sparkline */}
        <div className="h-10 -mx-1 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={sparkColor} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={2} fill={`url(#spark-${label})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function QuickActionTile({
  icon: Icon, title, description, gradient, onClick,
}: {
  icon: any; title: string; description: string; gradient: string; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative rounded-sm bg-card border border-border p-4 text-left shadow-[0_8px_24px_-18px_rgba(15,23,42,0.25)] hover:shadow-[0_18px_40px_-18px_rgba(15,23,42,0.4)] hover:-translate-y-0.5 transition-all overflow-hidden"
    >
      {/* gradient backdrop that only shows on hover */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-[0.04] transition-opacity", gradient)} />
      <div className="relative">
        <span className={cn("inline-flex w-10 h-10 rounded-sm items-center justify-center text-white mb-3 shadow-md bg-gradient-to-br", gradient)}>
          <Icon className="w-4 h-4" />
        </span>
        <p className="text-base font-bold text-foreground tracking-tight">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          Open <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </button>
  );
}

function LegendDotBold({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-sm" style={{ background: color }} />
      <span className="text-muted-foreground font-medium">{label}</span>
    </span>
  );
}

// Legacy helper kept for older callers.
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

// Maturity progression per the spec (pre_seeker → leader). Plus "Interested"
// which appears in the seed data for demo.
const MATURITY_LEVELS = ["Interested", "Pre-Seeker", "Seeker", "New Believer", "Growing", "Mature", "Leader"] as const;
const STATUSES        = ["Active", "Pending", "Inactive", "Graduated", "Archived"] as const;
type SortKey = "newest" | "oldest" | "name" | "engagement_high" | "engagement_low";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest",          label: "Newest first" },
  { key: "oldest",          label: "Oldest first" },
  { key: "name",            label: "Name (A–Z)" },
  { key: "engagement_high", label: "Engagement (high → low)" },
  { key: "engagement_low",  label: "Engagement (low → high)" },
];

export function SeekersView({ canCreate = true }: { canCreate?: boolean }) {
  const [query, setQuery]         = useState("");
  const [seekers, setSeekers]     = useState<SeekerRow[]>(SEEKERS);
  const [maturity, setMaturity]   = useState<string>("all");
  const [status, setStatus]       = useState<string>("all");
  const [sort, setSort]           = useState<SortKey>("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNewOpen, setIsNewOpen] = useState(false);

  const selected = seekers.find(s => s.id === selectedId) || null;

  // Filter + sort pipeline. Kept local to this component since we drive off
  // the seed SEEKERS array; swap for API-backed data later without changing
  // the UI.
  const filtered = useMemo(() => {
    let list = seekers.filter(s => {
      const matchesQ = !query || s.name.toLowerCase().includes(query.toLowerCase()) || s.email.toLowerCase().includes(query.toLowerCase());
      const matchesM = maturity === "all" || s.maturity === maturity;
      const matchesS = status === "all" || s.status === status;
      return matchesQ && matchesM && matchesS;
    });
    const byIndex = (a: SeekerRow, b: SeekerRow) => seekers.indexOf(a) - seekers.indexOf(b);
    if (sort === "newest")          list = [...list].sort(byIndex);
    else if (sort === "oldest")     list = [...list].sort((a, b) => -byIndex(a, b));
    else if (sort === "name")       list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "engagement_high") list = [...list].sort((a, b) => b.engagement - a.engagement);
    else if (sort === "engagement_low")  list = [...list].sort((a, b) => a.engagement - b.engagement);
    return list;
  }, [seekers, query, maturity, status, sort]);

  // Drill into a single seeker's profile — full-page replacement of the list.
  if (selected) {
    return <SeekerDetailView seeker={selected} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Seekers"
        subtitle="Manage and track seeker journeys"
        actions={canCreate && (
          <Button onClick={() => setIsNewOpen(true)}>
            <Plus className="w-4 h-4" /> New Seeker
          </Button>
        )}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search seekers by name or email..."
            className="pl-9 h-10"
          />
        </div>

        <FilterDropdown
          label="Maturity"
          value={maturity}
          onChange={setMaturity}
          options={[{ value: "all", label: "All maturity levels" }, ...MATURITY_LEVELS.map(m => ({ value: m, label: m }))]}
        />
        <FilterDropdown
          label="Status"
          value={status}
          onChange={setStatus}
          options={[{ value: "all", label: "All statuses" }, ...STATUSES.map(s => ({ value: s, label: s }))]}
        />
        <FilterDropdown
          label="Sort"
          value={sort}
          onChange={(v) => setSort(v as SortKey)}
          options={SORT_OPTIONS.map(s => ({ value: s.key, label: s.label }))}
        />
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
              <th className="px-4 py-3 text-right font-semibold w-10">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No seekers match your filters.
                </td>
              </tr>
            ) : filtered.map(s => (
              <tr
                key={s.id}
                className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => setSelectedId(s.id)}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" className="accent-primary" />
                </td>
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
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <SeekerActionsMenu
                    seeker={s}
                    onView={() => setSelectedId(s.id)}
                    onMessage={() => toast.success(`Opening chat with ${s.name}`)}
                    onReclassify={() => toast.success(`Re-running AI classification for ${s.name}`)}
                    onArchive={() => {
                      setSeekers(list => list.map(x => x.id === s.id ? { ...x, status: "Archived", statusTone: "slate" } : x));
                      toast.success(`${s.name} archived`);
                    }}
                    onDelete={() => {
                      setSeekers(list => list.filter(x => x.id !== s.id));
                      toast.success(`${s.name} deleted`);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NewSeekerIntakeModal
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        onSubmit={(draft) => {
          const newRow: SeekerRow = {
            id: `s-${Date.now()}`,
            name: draft.name,
            email: draft.email || "—",
            maturity: "Interested",
            maturityTone: "orange",
            campaign: "—",
            engagement: 0,
            engagementTone: "red",
            status: "Pending",
            statusTone: "amber",
            avatarTone: "blue",
          };
          setSeekers(list => [newRow, ...list]);
          toast.success(`${draft.name} added — AI classification pending`);
          setIsNewOpen(false);
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Seeker detail — AI Classification, AI Summary, Journey Timeline
// ---------------------------------------------------------------------------

function SeekerDetailView({
  seeker, onBack,
}: { seeker: SeekerRow; onBack: () => void }) {
  // Mock profile derived from the seed row. In production this would be fetched
  // from the intelligence + classification APIs keyed by seeker.id.
  const profile = {
    engagement: seeker.engagement,
    mentor: seeker.campaign === "—" ? "—" : "Pastor James K.",
    joined: "Mar 15, 2026",
    maturityLevel: seeker.maturity,
    confidence: 92,
    needs: ["Foundation Building"],
    interests: ["Prayer", "Bible Study", "Community"] as const,
    summary: `${seeker.name.split(" ")[0]} is a recently converted new believer who came to faith through a friend's invitation. She shows strong interest in prayer and building a foundational understanding of the Bible. She responds well to community-oriented content and benefits from structured guidance. Recommended focus areas: daily devotionals, prayer guides, and small group connection.`,
    timeline: [
      { tone: "bg-emerald-500", text: "Completed intake form",           date: "Mar 15, 2026" },
      { tone: "bg-emerald-500", text: `AI classified as ${seeker.maturity}`, date: "Mar 15, 2026" },
      { tone: "bg-blue-500",    text: "Matched with Pastor James K.",    date: "Mar 16, 2026" },
      { tone: "bg-rose-500",    text: "Enrolled in 'Foundations of Faith'", date: "Mar 17, 2026" },
      { tone: "bg-violet-500",  text: "Completed Step 3: Prayer Guide",  date: "Mar 22, 2026" },
    ],
  };

  const interestTones: Record<string, "pink" | "blue" | "purple" | "amber"> = {
    Prayer: "pink", "Bible Study": "blue", Community: "purple", Worship: "amber",
  };

  return (
    <div className="p-6 space-y-4">
      {/* Compact back bar so the page still feels like it belongs in the Seekers section */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Seekers
      </button>

      {/* Header — avatar, name + meta, actions */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xl font-bold shrink-0">
            {seeker.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{seeker.name}</h1>
              <Chip tone={seeker.maturityTone}>
                <Star className="w-3 h-3" /> {seeker.maturity}
              </Chip>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              <span>Engagement: <span className="font-semibold text-foreground">{profile.engagement}/100</span></span>
              <span className="mx-2">·</span>
              <span>Mentor: <span className="font-semibold text-foreground">{profile.mentor}</span></span>
              <span className="mx-2">·</span>
              <span>Joined: {profile.joined}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => toast.success(`Opening chat with ${seeker.name}`)}>
            <Send className="w-3.5 h-3.5" /> Message
          </Button>
          <Button variant="outline" onClick={() => toast.info("Edit coming soon")}>
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </Button>
        </div>
      </div>

      {/* Two-column layout: classification + summary on left, timeline on right */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-4">
        <div className="space-y-4">
          {/* AI Classification */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">AI Classification</h3>
              <Chip tone="green">
                <CheckCircle2 className="w-3 h-3" /> {profile.confidence}% confidence
              </Chip>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Maturity Level</p>
                <p className="text-sm font-bold text-foreground">{profile.maturityLevel}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Identified Needs</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {profile.needs.map(n => <Chip key={n} tone="amber">{n}</Chip>)}
                </div>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Key Interests</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {profile.interests.map(i => <Chip key={i} tone={interestTones[i] ?? "slate"}>{i}</Chip>)}
                </div>
              </div>
            </div>
          </div>

          {/* AI Summary */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <h3 className="text-base font-bold text-foreground">AI Summary</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.summary}</p>
          </div>

          {/* Intelligence quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Dropout Risk"   value="Low"        subtitle="Improving trend"         icon={Activity}  tone="green" />
            <StatCard label="Learning Pace"  value="Moderate"   subtitle="On schedule"              icon={Clock}     tone="blue" />
            <StatCard label="Sentiment"      value="Improving"  subtitle="Last 3 cycles"            icon={TrendingUp} tone="purple" />
            <StatCard label="Topic Affinity" value="Prayer"     subtitle="0.9 weight"               icon={Heart}     tone="pink" />
          </div>
        </div>

        {/* Journey Timeline */}
        <div className="bg-card border border-border rounded-xl p-5 h-fit">
          <h3 className="text-base font-bold text-foreground mb-4">Journey Timeline</h3>
          <ol className="space-y-4 relative">
            <div className="absolute left-[5px] top-1 bottom-1 w-px bg-border" aria-hidden />
            {profile.timeline.map((t, i) => (
              <li key={i} className="relative flex items-start gap-3 pl-0">
                <span className={cn("w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ring-2 ring-background relative z-10", t.tone)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{t.text}</p>
                  <p className="text-xs text-muted-foreground">{t.date}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row actions dropdown
// ---------------------------------------------------------------------------

function SeekerActionsMenu({
  seeker, onView, onMessage, onReclassify, onArchive, onDelete,
}: {
  seeker: SeekerRow;
  onView: () => void;
  onMessage: () => void;
  onReclassify: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center justify-center h-8 w-8 rounded-md",
          "text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring"
        )}
        aria-label={`Actions for ${seeker.name}`}
      >
        <MoreHorizontal className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={onView}>
          <Eye className="w-3.5 h-3.5" /> View profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onMessage}>
          <MessageSquareIcon className="w-3.5 h-3.5" /> Message
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onReclassify}>
          <RefreshCw className="w-3.5 h-3.5" /> Re-classify
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onArchive}>
          <Archive className="w-3.5 h-3.5" /> Archive
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// Filter dropdown
// ---------------------------------------------------------------------------

function FilterDropdown({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const current = options.find(o => o.value === value)?.label ?? label;
  const isDefault = value === "all" || value === options[0]?.value;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1.5 h-10 px-3 rounded-md border text-sm font-medium transition-colors outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring",
          isDefault
            ? "border-border bg-background text-foreground hover:bg-muted/50"
            : "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
        )}
      >
        {isDefault ? label : <span className="font-semibold">{current}</span>}
        <ChevronDown className="w-3.5 h-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{label}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {options.map(opt => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value}>
              {opt.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// New Seeker — 4-step intake modal per the spec (Welcome · Background · Interests · Preferences)
// ---------------------------------------------------------------------------

interface IntakeDraft {
  // Step 1 — Welcome
  name: string;
  email: string;
  consent: boolean;
  language: "en" | "am" | "om";
  // Step 2 — Background
  spiritualBackground: string;
  location: string;
  timezone: string;
  // Step 3 — Interests
  interests: string[];
  questions: string;
  // Step 4 — Preferences
  preferredChannel: "telegram" | "whatsapp" | "sms" | "web";
  mentorGender: "any" | "female" | "male";
  availability: string;
}

const INTAKE_STEPS = [
  { id: 1, title: "Welcome",     description: "Let's start with the basics." },
  { id: 2, title: "Background",  description: "A little about you so we can match you well." },
  { id: 3, title: "Interests",   description: "What are you curious about?" },
  { id: 4, title: "Preferences", description: "How would you like to stay in touch?" },
];

const INTEREST_OPTIONS = ["Prayer", "Bible Study", "Community", "Worship", "Apologetics", "Serving"];

function NewSeekerIntakeModal({
  isOpen, onClose, onSubmit,
}: { isOpen: boolean; onClose: () => void; onSubmit: (draft: IntakeDraft) => void }) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<IntakeDraft>({
    name: "", email: "", consent: false, language: "en",
    spiritualBackground: "", location: "", timezone: "Africa/Addis_Ababa",
    interests: [], questions: "",
    preferredChannel: "telegram", mentorGender: "any", availability: "",
  });
  const update = <K extends keyof IntakeDraft>(key: K, value: IntakeDraft[K]) =>
    setDraft(d => ({ ...d, [key]: value }));

  const toggleInterest = (v: string) => {
    setDraft(d => ({ ...d, interests: d.interests.includes(v) ? d.interests.filter(i => i !== v) : [...d.interests, v] }));
  };

  const canAdvance =
    step === 1 ? draft.name.trim().length > 0 && draft.consent :
    step === 2 ? draft.spiritualBackground.trim().length > 0 :
    step === 3 ? draft.interests.length > 0 :
    true;

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const handleSubmit = () => {
    onSubmit(draft);
    // Reset for next time
    setStep(1);
    setDraft({
      name: "", email: "", consent: false, language: "en",
      spiritualBackground: "", location: "", timezone: "Africa/Addis_Ababa",
      interests: [], questions: "",
      preferredChannel: "telegram", mentorGender: "any", availability: "",
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Seeker Intake" size="lg">
      <div className="space-y-5">
        {/* Step indicator — horizontal segmented progress */}
        <div className="flex items-center gap-2">
          {INTAKE_STEPS.map((s, i) => {
            const isDone   = step > s.id;
            const isActive = step === s.id;
            return (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2 flex-1">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border",
                    isDone ? "bg-primary border-primary text-primary-foreground"
                      : isActive ? "bg-primary/10 border-primary text-primary"
                      : "bg-muted border-border text-muted-foreground"
                  )}>
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.id}
                  </div>
                  <div className="hidden sm:block min-w-0">
                    <p className={cn("text-xs font-semibold truncate", isActive || isDone ? "text-foreground" : "text-muted-foreground")}>{s.title}</p>
                  </div>
                </div>
                {i < INTAKE_STEPS.length - 1 && <div className={cn("h-px flex-1 min-w-[12px]", isDone ? "bg-primary" : "bg-border")} />}
              </div>
            );
          })}
        </div>

        <div>
          <h3 className="text-base font-bold text-foreground">{INTAKE_STEPS[step - 1].title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{INTAKE_STEPS[step - 1].description}</p>
        </div>

        {/* Step bodies */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Full name <span className="text-destructive">*</span></Label>
              <Input value={draft.name} onChange={(e) => update("name", e.target.value)} placeholder="Abigail Johnson" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input value={draft.email} onChange={(e) => update("email", e.target.value)} placeholder="abigail@example.com" type="email" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Preferred language</Label>
              <div className="flex items-center gap-1 bg-muted/60 rounded-md p-0.5 w-fit">
                {([["en", "English"], ["am", "Amharic"], ["om", "Afaan Oromoo"]] as const).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => update("language", k)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold rounded transition-all",
                      draft.language === k ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >{label}</button>
                ))}
              </div>
            </div>
            <label className="flex items-start gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.consent}
                onChange={(e) => update("consent", e.target.checked)}
                className="mt-0.5 accent-primary"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                I give consent for this person to participate in the discipleship process and receive messages on their preferred channel.
              </span>
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Spiritual background <span className="text-destructive">*</span></Label>
              <Textarea
                value={draft.spiritualBackground}
                onChange={(e) => update("spiritualBackground", e.target.value)}
                placeholder="Church history, faith experience, current beliefs..."
                className="min-h-[90px] text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Location</Label>
                <Input value={draft.location} onChange={(e) => update("location", e.target.value)} placeholder="Addis Ababa, Ethiopia" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Timezone</Label>
                <Input value={draft.timezone} onChange={(e) => update("timezone", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-xs font-semibold">Topics of interest <span className="text-destructive">*</span></Label>
              <div className="flex flex-wrap gap-1.5">
                {INTEREST_OPTIONS.map(o => {
                  const isOn = draft.interests.includes(o);
                  return (
                    <button
                      key={o}
                      type="button"
                      onClick={() => toggleInterest(o)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                        isOn ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      {isOn && <CheckCircle2 className="inline w-3 h-3 mr-1" />}
                      {o}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">Pick one or more.</p>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Questions they want explored</Label>
              <Textarea
                value={draft.questions}
                onChange={(e) => update("questions", e.target.value)}
                placeholder="e.g. Who is Jesus? How do I pray? What is the Bible?"
                className="min-h-[80px] text-sm"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-xs font-semibold">Preferred channel</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  ["telegram", "Telegram"], ["whatsapp", "WhatsApp"], ["sms", "SMS"], ["web", "Web"],
                ] as const).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => update("preferredChannel", k)}
                    className={cn(
                      "px-3 py-2 rounded-md text-xs font-semibold border transition-all",
                      draft.preferredChannel === k ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:bg-muted/50"
                    )}
                  >{label}</button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-semibold">Mentor gender preference</Label>
              <div className="flex items-center gap-1 bg-muted/60 rounded-md p-0.5 w-fit">
                {([["any", "No preference"], ["female", "Female"], ["male", "Male"]] as const).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => update("mentorGender", k)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold rounded transition-all",
                      draft.mentorGender === k ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >{label}</button>
                ))}
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Availability</Label>
              <Textarea
                value={draft.availability}
                onChange={(e) => update("availability", e.target.value)}
                placeholder="e.g. Monday evenings, Saturday mornings"
                className="min-h-[60px] text-sm"
              />
            </div>
          </div>
        )}

        {/* Footer nav */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (step === 1 ? handleClose() : setStep(step - 1))}
          >
            {step === 1 ? "Cancel" : <><ArrowLeft className="w-3.5 h-3.5" /> Back</>}
          </Button>
          {step < INTAKE_STEPS.length ? (
            <Button size="sm" disabled={!canAdvance} onClick={() => setStep(step + 1)}>
              Continue
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit}>
              <Sparkles className="w-3.5 h-3.5" /> Submit & classify
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function FilterButton({ label }: { label: string }) {
  return (
    <Button variant="outline" size="sm" className="font-medium">
      {label}
      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
    </Button>
  );
}

// ============================================================================
// MENTORS
// ============================================================================

type MentorRow = {
  id: string; name: string; email: string;
  specialty: string;        // comma-separated string shown in the table
  languages: string;        // comma-separated short codes: EN, AM, OM
  capacity: string;         // "4/5"
  load: number;             // 0-100 percentage
  status: "Active" | "Unavailable" | "On leave" | "Retired";
  statusTone: any;
  avatarTone: "blue" | "purple" | "rose" | "amber" | "green" | "slate";
  experience: "Beginner" | "Intermediate" | "Experienced" | "Senior";
  gender: "female" | "male";
  strengths: string[];      // eg ["Empathy", "Bible knowledge", "Prayer"]
  bio: string;
  joined: string;
};

const INITIAL_MENTORS_DATA: MentorRow[] = [
  { id: "m1", name: "Pastor James K.",   email: "james@email.com",   specialty: "New Believers, Grief", languages: "EN, AM", capacity: "4/5", load: 80,  status: "Active",       statusTone: "green", avatarTone: "blue",   experience: "Senior",       gender: "male",   strengths: ["Empathy", "Bible knowledge", "Prayer"],  bio: "20+ years walking alongside new believers and those in grief. Passionate about foundational discipleship and the quiet work of scripture.", joined: "Jan 10, 2024" },
  { id: "m2", name: "Mentor Daniel M.",  email: "daniel@email.com",  specialty: "Youth, Apologetics",   languages: "EN, AM", capacity: "3/5", load: 60,  status: "Active",       statusTone: "green", avatarTone: "purple", experience: "Experienced",  gender: "male",   strengths: ["Patience", "Apologetics", "Storytelling"], bio: "Loves wrestling through hard questions with curious young adults. Former youth pastor.", joined: "Mar 2, 2024" },
  { id: "m3", name: "Sister Ruth B.",    email: "ruth@email.com",    specialty: "Women, Prayer",        languages: "EN, OM", capacity: "5/5", load: 100, status: "Unavailable",  statusTone: "amber", avatarTone: "rose",   experience: "Experienced",  gender: "female", strengths: ["Prayer", "Counseling", "Pastoral care"], bio: "Women's ministry leader. Specialises in prayer accompaniment and seasons of transition.", joined: "May 18, 2024" },
  { id: "m4", name: "Elder Susan M.",    email: "susan@email.com",   specialty: "Bible Study",          languages: "EN",     capacity: "2/6", load: 33,  status: "Active",       statusTone: "green", avatarTone: "amber",  experience: "Senior",       gender: "female", strengths: ["Bible knowledge", "Teaching", "Study planning"], bio: "Retired teacher who now leads small groups. Equips seekers to read scripture themselves.", joined: "Feb 5, 2024" },
];

const MENTOR_STATUSES = ["Active", "Unavailable", "On leave", "Retired"] as const;
const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Experienced", "Senior"] as const;
const ALL_LANGUAGES = [
  { code: "EN", label: "English" }, { code: "AM", label: "Amharic" }, { code: "OM", label: "Afaan Oromoo" },
];
const ALL_SPECIALTIES = ["New Believers", "Youth", "Women", "Men", "Grief", "Prayer", "Apologetics", "Bible Study", "Marriage", "Addiction recovery"];
const ALL_STRENGTHS  = ["Empathy", "Bible knowledge", "Prayer", "Patience", "Counseling", "Apologetics", "Teaching", "Storytelling", "Pastoral care", "Study planning"];

export function MentorsView({ canCreate = true }: { canCreate?: boolean }) {
  const [mentors, setMentors] = useState<MentorRow[]>(INITIAL_MENTORS_DATA);
  const [query, setQuery]     = useState("");
  const [status, setStatus]   = useState<string>("all");
  const [exp, setExp]         = useState<string>("all");
  const [sort, setSort]       = useState<"name" | "load_low" | "load_high" | "newest">("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const selected = mentors.find(m => m.id === selectedId) || null;
  const editing  = mentors.find(m => m.id === editingId) || null;

  const filtered = useMemo(() => {
    let list = mentors.filter(m => {
      const q = query.toLowerCase();
      const matchesQ = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.specialty.toLowerCase().includes(q);
      const matchesS = status === "all" || m.status === status;
      const matchesE = exp === "all" || m.experience === exp;
      return matchesQ && matchesS && matchesE;
    });
    if (sort === "name")       list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "load_low")  list = [...list].sort((a, b) => a.load - b.load);
    else if (sort === "load_high") list = [...list].sort((a, b) => b.load - a.load);
    return list;
  }, [mentors, query, status, exp, sort]);

  // Drill into a profile — full-page replacement.
  if (selected) {
    return (
      <MentorDetailView
        mentor={selected}
        onBack={() => setSelectedId(null)}
        onEdit={() => { setEditingId(selected.id); setSelectedId(null); }}
        onStatusChange={(s) => setMentors(list => list.map(x => x.id === selected.id ? { ...x, status: s, statusTone: s === "Active" ? "green" : s === "Retired" ? "slate" : "amber" } : x))}
      />
    );
  }

  const totalActive     = mentors.filter(m => m.status === "Active").length;
  const avgLoad         = mentors.length === 0 ? 0 : Math.round(mentors.reduce((s, m) => s + m.load, 0) / mentors.length);
  const availableSlots  = mentors.reduce((acc, m) => {
    const [cur, max] = m.capacity.split("/").map(Number);
    return acc + Math.max(0, (max || 0) - (cur || 0));
  }, 0);

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Mentors"
        subtitle="Manage mentor profiles, availability, and capacity"
        actions={canCreate && (
          <Button onClick={() => setIsNewOpen(true)}>
            <Plus className="w-4 h-4" /> New Mentor
          </Button>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard label="Total Mentors"   value={mentors.length} icon={ShieldCheck}  tone="blue" />
        <StatCard label="Active"          value={totalActive}    icon={CheckCircle2} tone="green" />
        <StatCard label="Avg. Load"       value={`${avgLoad}%`}  icon={Activity}     tone="amber" />
        <StatCard label="Available Slots" value={availableSlots} icon={Users}        tone="purple" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or specialty..."
            className="pl-9 h-10"
          />
        </div>
        <FilterDropdown
          label="Status"
          value={status}
          onChange={setStatus}
          options={[{ value: "all", label: "All statuses" }, ...MENTOR_STATUSES.map(s => ({ value: s, label: s }))]}
        />
        <FilterDropdown
          label="Experience"
          value={exp}
          onChange={setExp}
          options={[{ value: "all", label: "All experience" }, ...EXPERIENCE_LEVELS.map(s => ({ value: s, label: s }))]}
        />
        <FilterDropdown
          label="Sort"
          value={sort}
          onChange={(v) => setSort(v as typeof sort)}
          options={[
            { value: "newest",    label: "Newest first" },
            { value: "name",      label: "Name (A–Z)" },
            { value: "load_low",  label: "Load (low → high)" },
            { value: "load_high", label: "Load (high → low)" },
          ]}
        />
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
              <th className="px-4 py-3 text-right font-semibold w-10">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No mentors match your filters.
                </td>
              </tr>
            ) : filtered.map(m => (
              <tr
                key={m.id}
                className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => setSelectedId(m.id)}
              >
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
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <MentorActionsMenu
                    mentor={m}
                    onView={() => setSelectedId(m.id)}
                    onEdit={() => setEditingId(m.id)}
                    onMessage={() => toast.success(`Messaging ${m.name}`)}
                    onToggleStatus={() => {
                      setMentors(list => list.map(x => x.id === m.id
                        ? { ...x, status: x.status === "Active" ? "Unavailable" : "Active", statusTone: x.status === "Active" ? "amber" : "green" }
                        : x
                      ));
                      toast.success(`${m.name} is now ${m.status === "Active" ? "Unavailable" : "Active"}`);
                    }}
                    onDelete={() => {
                      setMentors(list => list.filter(x => x.id !== m.id));
                      toast.success(`${m.name} removed`);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create + Edit share the same modal to keep the form logic in one place */}
      <MentorFormModal
        key={editing?.id ?? "new"}
        isOpen={isNewOpen || editing !== null}
        initial={editing ?? undefined}
        onClose={() => { setIsNewOpen(false); setEditingId(null); }}
        onSubmit={(draft) => {
          if (editing) {
            setMentors(list => list.map(x => x.id === editing.id ? { ...x, ...draft } : x));
            toast.success(`${draft.name} updated`);
          } else {
            setMentors(list => [{ ...draft, id: `m-${Date.now()}` }, ...list]);
            toast.success(`${draft.name} added`);
          }
          setIsNewOpen(false);
          setEditingId(null);
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mentor actions menu
// ---------------------------------------------------------------------------

function MentorActionsMenu({
  mentor, onView, onEdit, onMessage, onToggleStatus, onDelete,
}: {
  mentor: MentorRow;
  onView: () => void;
  onEdit: () => void;
  onMessage: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center justify-center h-8 w-8 rounded-md",
          "text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring"
        )}
        aria-label={`Actions for ${mentor.name}`}
      >
        <MoreHorizontal className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={onView}>
          <Eye className="w-3.5 h-3.5" /> View profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onEdit}>
          <Edit2 className="w-3.5 h-3.5" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onMessage}>
          <MessageSquareIcon className="w-3.5 h-3.5" /> Message
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onToggleStatus}>
          <Clock className="w-3.5 h-3.5" />
          {mentor.status === "Active" ? "Mark unavailable" : "Mark active"}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 className="w-3.5 h-3.5" /> Remove mentor
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// Mentor profile detail
// ---------------------------------------------------------------------------

function MentorDetailView({
  mentor, onBack, onEdit, onStatusChange,
}: {
  mentor: MentorRow;
  onBack: () => void;
  onEdit: () => void;
  onStatusChange: (s: MentorRow["status"]) => void;
}) {
  const [curLoad, maxCap] = mentor.capacity.split("/").map(Number);
  const availSlots = Math.max(0, (maxCap || 0) - (curLoad || 0));
  const aiSummary = `${mentor.name.split(" ").slice(-1)[0]} brings ${mentor.experience.toLowerCase()} experience with particular strength in ${mentor.strengths.slice(0, 2).join(" and ")}. Best suited for seekers seeking ${mentor.specialty.toLowerCase()}. Culturally fluent in ${mentor.languages}.`;
  const weeklySchedule = [
    { day: "Mon", slots: ["9:00 – 12:00"] },
    { day: "Tue", slots: [] },
    { day: "Wed", slots: ["14:00 – 17:00"] },
    { day: "Thu", slots: [] },
    { day: "Fri", slots: [] },
    { day: "Sat", slots: ["10:00 – 15:00"] },
    { day: "Sun", slots: [] },
  ];
  const activeMentees = [
    { name: "Abigail Johnson", maturity: "New Believer", maturityTone: "green" as const, engagement: 78, avatarTone: "purple" as const },
    { name: "David Kebede",    maturity: "Seeker",       maturityTone: "amber" as const, engagement: 58, avatarTone: "blue" as const },
    { name: "Miriam Tadesse",  maturity: "Interested",   maturityTone: "orange" as const, engagement: 30, avatarTone: "green" as const },
  ].slice(0, curLoad || 0);

  return (
    <div className="p-6 space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Mentors
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold shrink-0">
            {mentor.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{mentor.name}</h1>
              <Chip tone={mentor.statusTone}>{mentor.status}</Chip>
              <Chip tone="slate">{mentor.experience}</Chip>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              <span>{mentor.email}</span>
              <span className="mx-2">·</span>
              <span>{mentor.gender === "female" ? "Female" : "Male"}</span>
              <span className="mx-2">·</span>
              <span>Joined {mentor.joined}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => toast.success(`Messaging ${mentor.name}`)}>
            <Send className="w-3.5 h-3.5" /> Message
          </Button>
          <Button variant="outline" onClick={onEdit}>
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Change status</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={mentor.status} onValueChange={(v) => onStatusChange(v as MentorRow["status"])}>
                {MENTOR_STATUSES.map(s => (
                  <DropdownMenuRadioItem key={s} value={s}>{s}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active Mentees" value={curLoad || 0}          subtitle={`of ${maxCap || 0} capacity`} icon={Users}        tone="blue" />
        <StatCard label="Available Slots" value={availSlots}           subtitle={`${Math.round(mentor.load)}% load`}             icon={Activity}     tone="green" />
        <StatCard label="Completed"       value={12}                   subtitle="seekers graduated"                              icon={CheckCircle2} tone="purple" />
        <StatCard label="Avg. Response"   value="2.4h"                 subtitle="rolling 30 days"                                icon={Clock}        tone="amber" />
      </div>

      {/* Body: bio + expertise + availability on left, AI summary + mentees on right */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-4">
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-base font-bold text-foreground mb-2">Bio</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{mentor.bio}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-foreground">Expertise</h3>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Specialty areas</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {mentor.specialty.split(",").map(s => <Chip key={s} tone="blue">{s.trim()}</Chip>)}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Strengths</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {mentor.strengths.map(s => <Chip key={s} tone="purple">{s}</Chip>)}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Languages</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {mentor.languages.split(",").map(l => {
                  const code = l.trim();
                  const label = ALL_LANGUAGES.find(x => x.code === code)?.label ?? code;
                  return <Chip key={code} tone="green">{label}</Chip>;
                })}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-base font-bold text-foreground mb-4">Weekly availability</h3>
            <div className="grid grid-cols-7 gap-2">
              {weeklySchedule.map(d => (
                <div key={d.day} className="text-center">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">{d.day}</p>
                  <div className={cn(
                    "rounded-md py-2 px-1 text-xs font-medium min-h-[56px] flex flex-col items-center justify-center gap-0.5",
                    d.slots.length > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {d.slots.length > 0 ? d.slots.map(s => <span key={s}>{s}</span>) : <span>—</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <h3 className="text-base font-bold text-foreground">AI Profile Summary</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{aiSummary}</p>
            <p className="text-xs text-muted-foreground mt-3 italic">Used by the matching algorithm to pair with the right seekers.</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-foreground">Active Mentees</h3>
              <span className="text-xs font-semibold text-muted-foreground">{activeMentees.length}/{maxCap || 0}</span>
            </div>
            {activeMentees.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active mentees right now.</p>
            ) : (
              <ul className="space-y-2">
                {activeMentees.map((am, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Avatar name={am.name} tone={am.avatarTone} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{am.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Chip tone={am.maturityTone}>{am.maturity}</Chip>
                        <span className="text-xs text-muted-foreground">{am.engagement}% engaged</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mentor form modal — 3-step onboarding (reused for edit)
// ---------------------------------------------------------------------------

const MENTOR_STEPS = [
  { id: 1, title: "Identity",     description: "Who is this mentor?" },
  { id: 2, title: "Expertise",    description: "Strengths, specialties, and languages." },
  { id: 3, title: "Availability", description: "Capacity and weekly schedule." },
];

function MentorFormModal({
  isOpen, initial, onClose, onSubmit,
}: {
  isOpen: boolean;
  initial?: MentorRow;
  onClose: () => void;
  onSubmit: (draft: Omit<MentorRow, "id">) => void;
}) {
  const isEdit = !!initial;
  const [step, setStep] = useState(1);

  const [name, setName]             = useState(initial?.name ?? "");
  const [email, setEmail]           = useState(initial?.email ?? "");
  const [gender, setGender]         = useState<MentorRow["gender"]>(initial?.gender ?? "female");
  const [experience, setExperience] = useState<MentorRow["experience"]>(initial?.experience ?? "Intermediate");
  const [bio, setBio]               = useState(initial?.bio ?? "");
  const [specialties, setSpecialties] = useState<string[]>(initial?.specialty ? initial.specialty.split(",").map(s => s.trim()) : []);
  const [strengths, setStrengths]     = useState<string[]>(initial?.strengths ?? []);
  const [languages, setLanguages]     = useState<string[]>(initial?.languages ? initial.languages.split(",").map(s => s.trim()) : ["EN"]);
  const [maxCap, setMaxCap]           = useState<number>(initial ? parseInt(initial.capacity.split("/")[1], 10) : 5);

  const toggle = <T extends string>(list: T[], setList: (v: T[]) => void, v: T) =>
    setList(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  const canAdvance =
    step === 1 ? name.trim().length > 0 && email.trim().length > 0 :
    step === 2 ? specialties.length > 0 && strengths.length > 0 && languages.length > 0 :
    maxCap > 0;

  const handleClose = () => { setStep(1); onClose(); };

  const handleSubmit = () => {
    const curLoad = initial ? parseInt(initial.capacity.split("/")[0], 10) : 0;
    const load = maxCap > 0 ? Math.round((curLoad / maxCap) * 100) : 0;
    const draft: Omit<MentorRow, "id"> = {
      name: name.trim(),
      email: email.trim(),
      specialty: specialties.join(", "),
      languages: languages.join(", "),
      capacity: `${curLoad}/${maxCap}`,
      load,
      status: initial?.status ?? "Active",
      statusTone: initial?.statusTone ?? "green",
      avatarTone: initial?.avatarTone ?? "blue",
      experience,
      gender,
      strengths,
      bio: bio.trim(),
      joined: initial?.joined ?? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    onSubmit(draft);
    setStep(1);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? `Edit ${initial?.name}` : "New Mentor"} size="lg">
      <div className="space-y-5">
        {/* Progress */}
        <div className="flex items-center gap-2">
          {MENTOR_STEPS.map((s, i) => {
            const isDone   = step > s.id;
            const isActive = step === s.id;
            return (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2 flex-1">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border",
                    isDone ? "bg-primary border-primary text-primary-foreground"
                      : isActive ? "bg-primary/10 border-primary text-primary"
                      : "bg-muted border-border text-muted-foreground"
                  )}>
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.id}
                  </div>
                  <p className={cn("text-xs font-semibold hidden sm:block truncate", isActive || isDone ? "text-foreground" : "text-muted-foreground")}>{s.title}</p>
                </div>
                {i < MENTOR_STEPS.length - 1 && <div className={cn("h-px flex-1 min-w-[12px]", isDone ? "bg-primary" : "bg-border")} />}
              </div>
            );
          })}
        </div>

        <div>
          <h3 className="text-base font-bold text-foreground">{MENTOR_STEPS[step - 1].title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{MENTOR_STEPS[step - 1].description}</p>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Full name <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pastor James Kalu" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Email <span className="text-destructive">*</span></Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="james@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Gender</Label>
                <div className="flex items-center gap-1 bg-muted/60 rounded-md p-0.5 w-fit">
                  {(["female", "male"] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-semibold rounded transition-all capitalize",
                        gender === g ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >{g}</button>
                  ))}
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Experience level</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {EXPERIENCE_LEVELS.map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setExperience(lvl)}
                      className={cn(
                        "px-2.5 py-1.5 text-xs font-semibold rounded-md border transition-all",
                        experience === lvl ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/50"
                      )}
                    >{lvl}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short description shown on the mentor's profile."
                className="min-h-[80px] text-sm"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-xs font-semibold">Specialty areas <span className="text-destructive">*</span></Label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_SPECIALTIES.map(s => {
                  const isOn = specialties.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggle(specialties, setSpecialties, s)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                        isOn ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      {isOn && <CheckCircle2 className="inline w-3 h-3 mr-1" />}
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-semibold">Strengths <span className="text-destructive">*</span></Label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_STRENGTHS.map(s => {
                  const isOn = strengths.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggle(strengths, setStrengths, s)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                        isOn ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      {isOn && <CheckCircle2 className="inline w-3 h-3 mr-1" />}
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-semibold">Languages <span className="text-destructive">*</span></Label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_LANGUAGES.map(l => {
                  const isOn = languages.includes(l.code);
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => toggle(languages, setLanguages, l.code)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                        isOn ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      {isOn && <CheckCircle2 className="inline w-3 h-3 mr-1" />}
                      {l.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Maximum mentees (capacity) <span className="text-destructive">*</span></Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={maxCap}
                  onChange={(e) => setMaxCap(Math.max(1, parseInt(e.target.value || "1", 10)))}
                  className="w-28 h-10"
                />
                <span className="text-xs text-muted-foreground">Mentors at capacity are excluded from new matches.</span>
              </div>
            </div>
            <div className="rounded-md bg-muted/40 border border-border p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">Weekly schedule</p>
              <p>The mentor can edit their own weekly time slots from their profile. This form just creates the mentor; the schedule is filled in afterwards.</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (step === 1 ? handleClose() : setStep(step - 1))}
          >
            {step === 1 ? "Cancel" : <><ArrowLeft className="w-3.5 h-3.5" /> Back</>}
          </Button>
          {step < MENTOR_STEPS.length ? (
            <Button size="sm" disabled={!canAdvance} onClick={() => setStep(step + 1)}>Continue</Button>
          ) : (
            <Button size="sm" disabled={!canAdvance} onClick={handleSubmit}>
              {isEdit ? "Save changes" : <><Plus className="w-3.5 h-3.5" /> Add mentor</>}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ============================================================================
// MATCHES
// ============================================================================

type MatchRow = {
  id: string;
  score: number;
  scoreTone: "green" | "amber" | "red";
  seeker: string;
  mentor: string;
  factors: [string, number, "green" | "blue" | "amber" | "red" | "purple"][];
  status: "Proposed" | "Accepted" | "Active" | "Completed" | "Ended";
  statusTone: any;
  reasoning: string;
};

const INITIAL_MATCHES: MatchRow[] = [
  { id: "mt1", score: 94, scoreTone: "green", seeker: "Abigail Johnson", mentor: "Pastor James K.",  factors: [["Lang", 95, "green"], ["Interests", 88, "blue"]],      status: "Proposed", statusTone: "amber", reasoning: "Abigail shares strong language alignment (English, 95%) and interest overlap (Prayer, Bible Study) with Pastor James. Both are in the same timezone and James has capacity for 2 more seekers. Confidence: High." },
  { id: "mt2", score: 87, scoreTone: "green", seeker: "David Kebede",    mentor: "Mentor Daniel M.", factors: [["Age", 92, "green"], ["Location", 85, "blue"]],        status: "Proposed", statusTone: "amber", reasoning: "David is in the young-adult demographic that Daniel specializes in. Shared timezone and strong apologetics interest make this a balanced pairing. Confidence: High." },
  { id: "mt3", score: 72, scoreTone: "amber", seeker: "Miriam Tadesse",  mentor: "Sister Ruth B.",   factors: [["Gender", 100, "red"], ["Lang", 70, "amber"]],         status: "Accepted", statusTone: "green", reasoning: "Miriam preferred a female mentor and Ruth's prayer-focused ministry aligns with her stated interests. Language overlap is moderate but acceptable. Confidence: Medium." },
];

const MATCH_STATUSES = ["Proposed", "Accepted", "Active", "Completed", "Ended"] as const;

export function MatchesView() {
  const [matches, setMatches] = useState<MatchRow[]>(INITIAL_MATCHES);
  const [selectedId, setSelectedId] = useState<string | null>(INITIAL_MATCHES[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [sort, setSort] = useState<"score_high" | "score_low" | "newest">("score_high");
  const [isAutoMatchOpen, setIsAutoMatchOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = matches.filter(m => {
      const q = query.toLowerCase();
      const matchesQ = !q || m.seeker.toLowerCase().includes(q) || m.mentor.toLowerCase().includes(q);
      const matchesS = statusFilter === "all" || m.status === statusFilter;
      const matchesScore =
        scoreFilter === "all" ? true
        : scoreFilter === "excellent" ? m.score >= 90
        : scoreFilter === "good"      ? m.score >= 80 && m.score < 90
        : scoreFilter === "fair"      ? m.score >= 70 && m.score < 80
        : scoreFilter === "low"       ? m.score < 70
        : true;
      return matchesQ && matchesS && matchesScore;
    });
    if (sort === "score_high")     list = [...list].sort((a, b) => b.score - a.score);
    else if (sort === "score_low") list = [...list].sort((a, b) => a.score - b.score);
    return list;
  }, [matches, query, statusFilter, scoreFilter, sort]);

  const selected = matches.find(m => m.id === selectedId) || filtered[0] || null;

  const proposedCount = matches.filter(m => m.status === "Proposed").length;
  const activeCount   = matches.filter(m => m.status === "Active" || m.status === "Accepted").length;
  const avgScore      = matches.length === 0 ? 0 : Math.round(matches.reduce((s, m) => s + m.score, 0) / matches.length);

  const handleAccept = (id: string) => {
    setMatches(list => list.map(m => m.id === id ? { ...m, status: "Accepted", statusTone: "green" } : m));
    const m = matches.find(x => x.id === id);
    toast.success(`${m?.seeker} + ${m?.mentor} — match accepted`);
  };
  const handleReject = (id: string) => {
    setMatches(list => list.map(m => m.id === id ? { ...m, status: "Ended", statusTone: "slate" } : m));
    const m = matches.find(x => x.id === id);
    toast.success(`${m?.seeker} + ${m?.mentor} — match rejected`);
  };

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="AI Match Proposals"
        subtitle="Review and approve AI-suggested mentor-seeker matches"
        actions={(
          <Button onClick={() => setIsAutoMatchOpen(true)}>
            <Sparkles className="w-4 h-4" /> Run Auto-Match
          </Button>
        )}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard label="Total Proposed"  value={proposedCount}    icon={Clock}       tone="amber"  subtitle="awaiting review" />
        <StatCard label="Active"          value={activeCount}      icon={CheckCircle2} tone="green" />
        <StatCard label="Avg. Score"      value={`${avgScore}/100`} icon={Star}        tone="blue" />
        <StatCard label="Total Matches"   value={matches.length}   icon={Users}        tone="purple" />
      </div>

      {/* Filter row — above the table, fully functional */}
      <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search seeker or mentor..."
            className="pl-9 h-9"
          />
        </div>
        <FilterDropdown
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[{ value: "all", label: "All statuses" }, ...MATCH_STATUSES.map(s => ({ value: s, label: s }))]}
        />
        <FilterDropdown
          label="Score"
          value={scoreFilter}
          onChange={setScoreFilter}
          options={[
            { value: "all",       label: "Any score" },
            { value: "excellent", label: "Excellent (90+)" },
            { value: "good",      label: "Good (80–89)" },
            { value: "fair",      label: "Fair (70–79)" },
            { value: "low",       label: "Low (< 70)" },
          ]}
        />
        <FilterDropdown
          label="Sort"
          value={sort}
          onChange={(v) => setSort(v as typeof sort)}
          options={[
            { value: "score_high", label: "Score (high → low)" },
            { value: "score_low",  label: "Score (low → high)" },
            { value: "newest",     label: "Newest first" },
          ]}
        />
        {(query || statusFilter !== "all" || scoreFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setQuery(""); setStatusFilter("all"); setScoreFilter("all"); }}
          >
            Clear filters
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {matches.length}
        </span>
      </div>

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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No matches found with the current filters.
                </td>
              </tr>
            ) : filtered.map(m => {
              const isSelected = selected?.id === m.id;
              return (
                <tr
                  key={m.id}
                  className={cn(
                    "border-b border-border last:border-0 transition-colors cursor-pointer",
                    isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                  )}
                  onClick={() => setSelectedId(m.id)}
                >
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center justify-center w-10 h-8 rounded-full text-sm font-bold tabular-nums",
                      m.scoreTone === "green" ? "bg-emerald-50 text-emerald-700"
                      : m.scoreTone === "amber" ? "bg-amber-50 text-amber-700"
                      : "bg-rose-50 text-rose-700"
                    )}>{m.score}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{m.seeker}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{m.mentor}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {m.factors.map(([k, v, tone], i) => (
                        <Chip key={i} tone={tone}>{k} {v}%</Chip>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3"><Chip tone={m.statusTone}>{m.status}</Chip></td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {m.status === "Proposed" ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          className="bg-emerald-500 text-white hover:bg-emerald-600"
                          onClick={() => handleAccept(m.id)}
                        >Accept</Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(m.id)}
                        >Reject</Button>
                      </div>
                    ) : m.status === "Accepted" || m.status === "Active" ? (
                      <span className="text-xs font-semibold text-emerald-600">Matched</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{m.status}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* AI reasoning panel — always reflects the selected row */}
      {selected && (
        <div className="bg-violet-50/50 border border-violet-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-semibold text-violet-900">AI Match Reasoning · {selected.seeker} → {selected.mentor}</span>
            </div>
            <span className={cn(
              "text-xs font-bold tabular-nums",
              selected.scoreTone === "green" ? "text-emerald-700"
              : selected.scoreTone === "amber" ? "text-amber-700" : "text-rose-700"
            )}>Score: {selected.score}/100</span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{selected.reasoning}</p>
        </div>
      )}

      <RunAutoMatchDialog
        isOpen={isAutoMatchOpen}
        onClose={() => setIsAutoMatchOpen(false)}
        existingMatches={matches}
        onComplete={(newMatches) => {
          setMatches(list => [...newMatches, ...list]);
          setSelectedId(newMatches[0]?.id ?? selectedId);
          toast.success(`${newMatches.length} new match${newMatches.length === 1 ? "" : "es"} proposed`);
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Run Auto-Match dialog — staged progress with Claude pre-filter + scoring
// ---------------------------------------------------------------------------

type AutoMatchStage = "idle" | "scanning" | "prefilter" | "scoring" | "done";

function RunAutoMatchDialog({
  isOpen, onClose, existingMatches, onComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  existingMatches: MatchRow[];
  onComplete: (matches: MatchRow[]) => void;
}) {
  const [stage, setStage] = useState<AutoMatchStage>("idle");
  const [generated, setGenerated] = useState<MatchRow[]>([]);

  // Mock pipeline — in production each stage hits a worker/API. We step through
  // them with setTimeouts so the UX feels right.
  const run = () => {
    setStage("scanning");
    setTimeout(() => setStage("prefilter"), 900);
    setTimeout(() => setStage("scoring"), 1800);
    setTimeout(() => {
      // Produce two plausible new proposals that don't overlap existing seekers.
      const existingSeekers = new Set(existingMatches.map(m => m.seeker));
      const candidates: MatchRow[] = [
        { id: `mt-${Date.now()}-1`, score: 91, scoreTone: "green", seeker: "Sarah Abebe",    mentor: "Elder Susan M.",   factors: [["Interests", 94, "blue"], ["Lang", 92, "green"]], status: "Proposed", statusTone: "amber", reasoning: "Sarah is new in faith and responds well to structured Bible study. Susan's patient teaching style and schedule overlap make this a strong pairing. Confidence: High." },
        { id: `mt-${Date.now()}-2`, score: 83, scoreTone: "green", seeker: "Samuel Bekele",  mentor: "Mentor Daniel M.", factors: [["Age", 88, "green"], ["Interests", 80, "blue"]], status: "Proposed", statusTone: "amber", reasoning: "Samuel is a young adult wrestling with apologetics questions. Daniel specializes in this area and has capacity for one more mentee. Confidence: Medium-High." },
      ].filter(c => !existingSeekers.has(c.seeker));
      setGenerated(candidates);
      setStage("done");
    }, 2900);
  };

  const handleClose = () => {
    if (stage === "done" && generated.length > 0) onComplete(generated);
    setStage("idle");
    setGenerated([]);
    onClose();
  };

  // Kick off automatically when the dialog opens so there's no blank state.
  React.useEffect(() => {
    if (isOpen && stage === "idle") run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const stepState = (s: AutoMatchStage): "done" | "active" | "pending" => {
    const order: AutoMatchStage[] = ["scanning", "prefilter", "scoring", "done"];
    const current = order.indexOf(stage);
    const target  = order.indexOf(s);
    if (current > target) return "done";
    if (current === target) return "active";
    return "pending";
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Run Auto-Match" size="lg">
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">AI matching pipeline</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Scan unmatched seekers, filter compatible mentors, and score each pair with Claude. Top matches are proposed for your review.
            </p>
          </div>
        </div>

        {/* Staged progress */}
        <div className="space-y-2">
          {([
            ["scanning",  "Scan unmatched seekers",   "Looking for seekers without an active mentor."],
            ["prefilter", "Rules pre-filter",         "Language, gender preference, availability overlap, capacity."],
            ["scoring",   "Claude AI scoring",        "Evaluate shortlisted mentors on 5 dimensions and rank."],
            ["done",      "Propose matches",          "Write top matches to the list with AI reasoning."],
          ] as const).map(([key, title, desc], i) => {
            const s = stepState(key);
            return (
              <div
                key={key}
                className={cn(
                  "flex items-start gap-3 rounded-md border p-3 transition-colors",
                  s === "active" ? "border-primary bg-primary/5"
                    : s === "done" ? "border-emerald-200 bg-emerald-50/40"
                    : "border-border bg-muted/30"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center shrink-0 border text-xs font-bold",
                  s === "done" ? "bg-emerald-500 border-emerald-500 text-white"
                  : s === "active" ? "bg-primary/10 border-primary text-primary"
                  : "bg-muted border-border text-muted-foreground"
                )}>
                  {s === "done" ? <CheckCircle2 className="w-4 h-4" /> : s === "active" ? <Clock className="w-3.5 h-3.5 animate-pulse" /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-semibold", s === "done" ? "text-emerald-900" : s === "active" ? "text-primary" : "text-foreground")}>
                    {title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Result preview */}
        {stage === "done" && (
          <div className="rounded-md bg-emerald-50/60 border border-emerald-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-900">
                {generated.length === 0
                  ? "No new matches to propose — everyone is already matched."
                  : `${generated.length} new match${generated.length === 1 ? "" : "es"} ready for your review`}
              </p>
            </div>
            {generated.length > 0 && (
              <ul className="space-y-1.5 mt-2">
                {generated.map(m => (
                  <li key={m.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">
                      <span className="font-semibold">{m.seeker}</span>
                      <span className="mx-1.5 text-slate-400">→</span>
                      <span>{m.mentor}</span>
                    </span>
                    <span className="font-bold text-emerald-700 tabular-nums">{m.score}/100</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {stage === "done" ? "Matches will be added to your list in Proposed state." : "Runs against all unmatched seekers in your account."}
          </p>
          <div className="flex items-center gap-2">
            {stage !== "done" && <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>}
            {stage === "done" && (
              <Button size="sm" onClick={handleClose}>
                {generated.length > 0 ? <><Plus className="w-3.5 h-3.5" /> Add {generated.length} to list</> : "Close"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
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

// Shared utility — kicks off a CSV download for any 2-d array of cells.
function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  try {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch { return false; }
}

type JourneyStage = "Touchpoint" | "Engaged" | "Active Journey" | "Decision";
type JourneyType  = "Salvation" | "Baptism" | "Community" | "Growth";
type JourneySource = "Telegram" | "WhatsApp" | "SMS" | "Self-guided" | "Messenger" | "Conversation";
type JourneyValidation = "Pending" | "Confirmed" | "N/A";

type Journey = {
  id: string;
  name: string;
  source: JourneySource;
  type: JourneyType;
  stage: JourneyStage;
  indicators: number;
  total: number;
  milestone: string;
  validation: JourneyValidation;
  avatarTone: "blue" | "purple" | "rose" | "amber" | "green" | "slate";
  language: "English" | "Amharic" | "Afaan Oromoo";
  startedAt: string;
};

const INITIAL_JOURNEYS: Journey[] = [
  // Touchpoint
  { id: "j1",  name: "Sara Ahmed",       source: "Telegram",    type: "Salvation", stage: "Touchpoint",     indicators: 1, total: 7, milestone: "First contact",       validation: "N/A",      avatarTone: "rose",   language: "English", startedAt: "2026-04-01" },
  { id: "j2",  name: "Tadesse M.",       source: "WhatsApp",    type: "Salvation", stage: "Touchpoint",     indicators: 2, total: 7, milestone: "Intake started",      validation: "N/A",      avatarTone: "blue",   language: "Amharic", startedAt: "2026-04-02" },
  // Engaged
  { id: "j3",  name: "Abigail Johnson",  source: "Self-guided", type: "Salvation", stage: "Engaged",        indicators: 4, total: 7, milestone: "Prayer guide step 3", validation: "Pending",  avatarTone: "purple", language: "English", startedAt: "2026-03-12" },
  { id: "j4",  name: "David Kebede",     source: "Conversation",type: "Baptism",   stage: "Engaged",        indicators: 3, total: 7, milestone: "Bible study started", validation: "Confirmed",avatarTone: "rose",   language: "Amharic", startedAt: "2026-02-28" },
  { id: "j5",  name: "Sara K.",          source: "Self-guided", type: "Salvation", stage: "Engaged",        indicators: 4, total: 7, milestone: "Bible Study Started", validation: "Confirmed",avatarTone: "green",  language: "English", startedAt: "2026-03-18" },
  // Active Journey
  { id: "j6",  name: "Miriam Haile",     source: "Conversation",type: "Salvation", stage: "Active Journey", indicators: 6, total: 7, milestone: "Weekly mentor check", validation: "Pending",  avatarTone: "amber",  language: "English", startedAt: "2026-02-10" },
  { id: "j7",  name: "Daniel M.",        source: "WhatsApp",    type: "Baptism",   stage: "Active Journey", indicators: 3, total: 7, milestone: "Baptism Request",     validation: "Pending",  avatarTone: "blue",   language: "Amharic", startedAt: "2026-03-02" },
  // Decision
  { id: "j8",  name: "Samuel B.",        source: "Self-guided", type: "Salvation", stage: "Decision",       indicators: 7, total: 7, milestone: "Confirmed Decision",  validation: "Confirmed",avatarTone: "green",  language: "English", startedAt: "2026-01-22" },
  { id: "j9",  name: "Fatima A.",        source: "Telegram",    type: "Salvation", stage: "Decision",       indicators: 5, total: 7, milestone: "Salvation Decision",  validation: "Pending",  avatarTone: "rose",   language: "English", startedAt: "2026-03-05" },
  { id: "j10", name: "Tesfaye W.",       source: "Messenger",   type: "Community", stage: "Touchpoint",     indicators: 1, total: 7, milestone: "First Contact",       validation: "N/A",      avatarTone: "purple", language: "Afaan Oromoo", startedAt: "2026-04-05" },
];

const JOURNEY_STAGES: JourneyStage[] = ["Touchpoint", "Engaged", "Active Journey", "Decision"];
const JOURNEY_TYPES:  JourneyType[]  = ["Salvation", "Baptism", "Community", "Growth"];
const JOURNEY_SOURCES: JourneySource[] = ["Telegram", "WhatsApp", "SMS", "Self-guided", "Messenger", "Conversation"];
const PERIODS = ["All time", "Q1 2026", "Q4 2025", "Q3 2025", "Last 30 days", "Last 90 days"];

// Keep the old PIPELINE_COLS for back-compat but we no longer use them directly.

export function FaithJourneysView() {
  const [tab, setTab] = useState<"pipeline" | "milestones" | "list">("pipeline");
  const [journeys, setJourneys] = useState<Journey[]>(INITIAL_JOURNEYS);
  const [period, setPeriod]   = useState<string>("Q1 2026");
  const [stageF, setStageF]   = useState<string>("all");
  const [typeF, setTypeF]     = useState<string>("all");
  const [valF, setValF]       = useState<string>("all");
  const [langF, setLangF]     = useState<string>("all");
  const [sourceF, setSourceF] = useState<string>("all");
  const [query, setQuery]     = useState("");
  const [isNewOpen, setIsNewOpen] = useState(false);

  const filtered = useMemo(() => {
    return journeys.filter(j => {
      const q = query.toLowerCase();
      const matchesQ = !q || j.name.toLowerCase().includes(q) || j.milestone.toLowerCase().includes(q);
      return matchesQ
        && (stageF  === "all" || j.stage === stageF)
        && (typeF   === "all" || j.type === typeF)
        && (valF    === "all" || j.validation === valF)
        && (langF   === "all" || j.language === langF)
        && (sourceF === "all" || j.source === sourceF);
    });
  }, [journeys, query, stageF, typeF, valF, langF, sourceF]);

  // Pipeline columns are derived from the (filtered) journey list so filters
  // affect every tab identically.
  const pipelineCols = useMemo(() => {
    const byStage: Record<JourneyStage, Journey[]> = { Touchpoint: [], Engaged: [], "Active Journey": [], Decision: [] };
    filtered.forEach(j => byStage[j.stage].push(j));
    return [
      { key: "Touchpoint",     dot: "bg-slate-400",   tone: "slate" as const, journeys: byStage.Touchpoint },
      { key: "Engaged",        dot: "bg-amber-500",   tone: "amber" as const, journeys: byStage.Engaged },
      { key: "Active Journey", dot: "bg-blue-500",    tone: "blue"  as const, journeys: byStage["Active Journey"] },
      { key: "Decision",       dot: "bg-emerald-500", tone: "green" as const, journeys: byStage.Decision },
    ];
  }, [filtered]);

  const hasFilters = query || stageF !== "all" || typeF !== "all" || valF !== "all" || langF !== "all" || sourceF !== "all";

  const handleExport = () => {
    const header = ["Person", "Source", "Journey Type", "Stage", "Indicators", "Last Milestone", "Validation", "Language", "Started"];
    const body = filtered.map(j => [j.name, j.source, j.type, j.stage, `${j.indicators}/${j.total}`, j.milestone, j.validation, j.language, j.startedAt]);
    const ok = downloadCsv(`faith-journeys-${new Date().toISOString().split("T")[0]}.csv`, [header, ...body]);
    if (ok) toast.success(`Exported ${filtered.length} journey${filtered.length === 1 ? "" : "s"}`);
    else toast.error("Couldn't start the download — your browser may have blocked it.");
  };

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Faith Journey Pipeline"
        subtitle="Track new faith journeys and their progression through indicators"
        actions={(
          <>
            <FilterDropdown
              label="Period"
              value={period}
              onChange={setPeriod}
              options={PERIODS.map(p => ({ value: p, label: p }))}
            />
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
            <Button onClick={() => setIsNewOpen(true)}>
              <Plus className="w-4 h-4" /> New Journey
            </Button>
          </>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard label="New Faith Journeys"   value={filtered.length}                                                 change="+18% this quarter"        icon={TrendingUp}   tone="blue" />
        <StatCard label="Active Journeys"      value={filtered.filter(j => j.stage === "Active Journey" || j.stage === "Engaged").length} subtitle="across 5 platforms"     icon={Activity}     tone="purple" />
        <StatCard label="Milestone Reached"    value={filtered.filter(j => j.stage === "Decision").length}             subtitle="decisions this period" icon={CheckCircle2} tone="green" />
        <StatCard label="Avg. Indicators Met"  value={filtered.length === 0 ? "0 / 7" : `${(filtered.reduce((s, j) => s + j.indicators, 0) / filtered.length).toFixed(1)} / 7`} change="+0.6 from last quarter" icon={Star} tone="amber" />
      </div>

      {/* Filter toolbar */}
      <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by person or milestone..."
            className="pl-9 h-9"
          />
        </div>
        <FilterDropdown
          label="Stage"
          value={stageF}
          onChange={setStageF}
          options={[{ value: "all", label: "All stages" }, ...JOURNEY_STAGES.map(s => ({ value: s, label: s }))]}
        />
        <FilterDropdown
          label="Type"
          value={typeF}
          onChange={setTypeF}
          options={[{ value: "all", label: "All types" }, ...JOURNEY_TYPES.map(t => ({ value: t, label: t }))]}
        />
        <FilterDropdown
          label="Validation"
          value={valF}
          onChange={setValF}
          options={[
            { value: "all",       label: "Any validation" },
            { value: "Pending",   label: "Pending" },
            { value: "Confirmed", label: "Confirmed" },
            { value: "N/A",       label: "N/A" },
          ]}
        />
        <FilterDropdown
          label="Source"
          value={sourceF}
          onChange={setSourceF}
          options={[{ value: "all", label: "All sources" }, ...JOURNEY_SOURCES.map(s => ({ value: s, label: s }))]}
        />
        <FilterDropdown
          label="Language"
          value={langF}
          onChange={setLangF}
          options={[
            { value: "all",          label: "All languages" },
            { value: "English",      label: "English" },
            { value: "Amharic",      label: "Amharic" },
            { value: "Afaan Oromoo", label: "Afaan Oromoo" },
          ]}
        />
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setQuery(""); setStageF("all"); setTypeF("all"); setValF("all"); setLangF("all"); setSourceF("all"); }}
          >Clear</Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} of {journeys.length}</span>
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
          {pipelineCols.map(col => (
            <div key={col.key} className="bg-card border border-border rounded-lg p-3 min-h-[340px]">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2.5 h-2.5 rounded-full", col.dot)} />
                  <span className="text-sm font-semibold text-foreground">{col.key}</span>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">{col.journeys.length}</span>
              </div>
              <div className="space-y-2">
                {col.journeys.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">Nothing here yet.</p>
                ) : col.journeys.map((c) => (
                  <div key={c.id} className="bg-background border border-border rounded-md p-3 hover:border-foreground/10 transition-all cursor-pointer">
                    <div className="flex items-center gap-2.5 mb-2">
                      <Avatar name={c.name} tone={c.avatarTone} />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">{c.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{c.source}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: c.total }).map((_, idx) => (
                        <div key={idx} className={cn("h-1.5 flex-1 rounded-full", idx < c.indicators ? (col.tone === "green" ? "bg-emerald-500" : col.tone === "amber" ? "bg-amber-500" : col.tone === "blue" ? "bg-blue-500" : "bg-slate-400") : "bg-muted")} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <Chip tone={col.tone}>{c.type}</Chip>
                      <span className="text-xs text-muted-foreground">{c.indicators}/{c.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "milestones" && <MilestonesInner journeys={filtered} />}
      {tab === "list"       && <JourneyListInner journeys={filtered} />}

      <NewJourneyModal
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        onSubmit={(draft) => {
          setJourneys(list => [{ ...draft, id: `j-${Date.now()}` }, ...list]);
          toast.success(`${draft.name}'s journey started`);
          setIsNewOpen(false);
        }}
      />
    </div>
  );
}

// New Journey modal — minimal data needed to start tracking
function NewJourneyModal({
  isOpen, onClose, onSubmit,
}: { isOpen: boolean; onClose: () => void; onSubmit: (j: Omit<Journey, "id">) => void }) {
  const [name, setName]     = useState("");
  const [type, setType]     = useState<JourneyType>("Salvation");
  const [source, setSource] = useState<JourneySource>("Telegram");
  const [stage, setStage]   = useState<JourneyStage>("Touchpoint");
  const [language, setLanguage] = useState<Journey["language"]>("English");
  const canSave = name.trim().length > 0;

  const reset = () => { setName(""); setType("Salvation"); setSource("Telegram"); setStage("Touchpoint"); setLanguage("English"); };
  const close = () => { reset(); onClose(); };

  const handleSubmit = () => {
    onSubmit({
      name: name.trim(),
      source,
      type,
      stage,
      indicators: stage === "Touchpoint" ? 1 : stage === "Engaged" ? 3 : stage === "Active Journey" ? 5 : 7,
      total: 7,
      milestone: stage === "Touchpoint" ? "First contact"
               : stage === "Engaged"    ? "Engagement confirmed"
               : stage === "Active Journey" ? "Active mentoring"
               : "Decision reached",
      validation: stage === "Decision" ? "Pending" : "N/A",
      avatarTone: "blue",
      language,
      startedAt: new Date().toISOString().split("T")[0],
    });
    reset();
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="Start a new faith journey" size="md">
      <div className="space-y-4">
        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold">Person's name <span className="text-destructive">*</span></Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hanna Tadesse" autoFocus />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold">Journey type</Label>
            <select value={type} onChange={(e) => setType(e.target.value as JourneyType)} className="h-10 px-3 rounded-md border border-input bg-background text-sm">
              {JOURNEY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold">Source channel</Label>
            <select value={source} onChange={(e) => setSource(e.target.value as JourneySource)} className="h-10 px-3 rounded-md border border-input bg-background text-sm">
              {JOURNEY_SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold">Starting stage</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {JOURNEY_STAGES.map(s => (
                <button
                  key={s}
                  onClick={() => setStage(s)}
                  className={cn(
                    "px-2.5 py-1.5 text-xs font-semibold rounded-md border transition-all",
                    stage === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/50"
                  )}
                >{s}</button>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold">Language</Label>
            <select value={language} onChange={(e) => setLanguage(e.target.value as Journey["language"])} className="h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option>English</option>
              <option>Amharic</option>
              <option>Afaan Oromoo</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={close}>Cancel</Button>
          <Button size="sm" disabled={!canSave} onClick={handleSubmit}>
            <Plus className="w-3.5 h-3.5" /> Start journey
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Standalone Milestones page (also reachable as a tab inside Faith Journeys)
// Milestones page data — decoupled from the simpler journey list so we can
// show rich per-person milestone cards. Each row captures the spec's 4-step
// pipeline (Salvation, Baptism, Community, Growth Evidence).
type MilestoneState = "done" | "progress" | "pending";
type MilestonePerson = {
  id: string;
  name: string;
  journeyType: "Self-guided" | "Conversation-based" | "Hybrid";
  started: string;
  language: "English" | "Amharic" | "Afaan Oromoo";
  state: "Active Journey" | "Engaged" | "Touchpoint" | "Decision";
  stateTone: any;
  indicators: number;
  total: number;
  avatarTone: "blue" | "purple" | "rose" | "amber" | "green" | "slate";
  milestones: {
    key: "salvation" | "baptism" | "community" | "growth";
    label: string;
    date: string;
    state: MilestoneState;
    sub: string[];
  }[];
};

const MILESTONE_PEOPLE: MilestonePerson[] = [
  {
    id: "mp1", name: "Abigail Johnson", journeyType: "Self-guided", started: "Jan 12, 2026", language: "English",
    state: "Active Journey", stateTone: "green", indicators: 6, total: 7, avatarTone: "purple",
    milestones: [
      { key: "salvation", label: "Salvation Decision", date: "Feb 3, 2026", state: "done",     sub: ["Indicated decision (self-reported)", "Confirmed by Pastor James K."] },
      { key: "baptism",   label: "Baptism",            date: "Mar 15, 2026", state: "done",     sub: ["Public statement of faith confirmed"] },
      { key: "community", label: "Community",          date: "In Progress",  state: "progress", sub: ["Referred to local fellowship", "Awaiting connection confirmation"] },
      { key: "growth",    label: "Growth Evidence",    date: "Not Started",  state: "pending",  sub: ["Prayer (0/7 days)", "Bible engagement (0/7 days)", "Contribution / Serving"] },
    ]
  },
  {
    id: "mp2", name: "David Kebede", journeyType: "Conversation-based", started: "Feb 28, 2026", language: "Amharic",
    state: "Engaged", stateTone: "amber", indicators: 3, total: 7, avatarTone: "rose",
    milestones: [
      { key: "salvation", label: "Salvation", date: "Indicated only — awaiting confirmation", state: "progress", sub: [] },
      { key: "baptism",   label: "Baptism",   date: "Not yet", state: "pending", sub: [] },
      { key: "community", label: "Community", date: "Not yet", state: "pending", sub: [] },
      { key: "growth",    label: "Growth",    date: "Not yet", state: "pending", sub: [] },
    ]
  },
  {
    id: "mp3", name: "Samuel Bekele", journeyType: "Self-guided", started: "Jan 22, 2026", language: "English",
    state: "Decision", stateTone: "green", indicators: 7, total: 7, avatarTone: "green",
    milestones: [
      { key: "salvation", label: "Salvation Decision", date: "Feb 1, 2026",  state: "done", sub: ["Confirmed by Elder Susan M."] },
      { key: "baptism",   label: "Baptism",            date: "Mar 9, 2026",  state: "done", sub: ["Baptized at Addis community gathering"] },
      { key: "community", label: "Community",          date: "Mar 20, 2026", state: "done", sub: ["Joined Tuesday study group"] },
      { key: "growth",    label: "Growth Evidence",    date: "Apr 5, 2026",  state: "done", sub: ["Prayer 6/7 days", "Bible 5/7 days", "Serves weekly"] },
    ]
  },
  {
    id: "mp4", name: "Miriam Haile", journeyType: "Hybrid", started: "Mar 4, 2026", language: "Afaan Oromoo",
    state: "Active Journey", stateTone: "blue", indicators: 4, total: 7, avatarTone: "amber",
    milestones: [
      { key: "salvation", label: "Salvation Decision", date: "Mar 18, 2026", state: "done",     sub: ["Confirmed by Sister Ruth B."] },
      { key: "baptism",   label: "Baptism",            date: "In Progress",  state: "progress", sub: ["Planning community gathering"] },
      { key: "community", label: "Community",          date: "Not Started",  state: "pending",  sub: ["Awaiting fellowship match"] },
      { key: "growth",    label: "Growth Evidence",    date: "Not Started",  state: "pending",  sub: [] },
    ]
  },
];

const MILESTONE_STATES = ["Active Journey", "Engaged", "Touchpoint", "Decision"] as const;

export function MilestonesView() {
  const [query, setQuery]   = useState("");
  const [stateF, setStateF] = useState("all");
  const [langF, setLangF]   = useState("all");
  const [milestoneF, setMilestoneF] = useState<string>("all"); // filter by a specific milestone status
  const [typeF, setTypeF]   = useState("all");                 // self-guided / conversation / hybrid

  const filtered = useMemo(() => {
    return MILESTONE_PEOPLE.filter(p => {
      const q = query.toLowerCase();
      const matchesQ = !q || p.name.toLowerCase().includes(q);
      const matchesState = stateF === "all" || p.state === stateF;
      const matchesLang  = langF === "all" || p.language === langF;
      const matchesType  = typeF === "all" || p.journeyType === typeF;
      // milestoneF is encoded as "<key>:<state>" (e.g. "salvation:done")
      let matchesMilestone = true;
      if (milestoneF !== "all") {
        const [mkey, mstate] = milestoneF.split(":");
        matchesMilestone = p.milestones.some(m => m.key === mkey && m.state === mstate);
      }
      return matchesQ && matchesState && matchesLang && matchesType && matchesMilestone;
    });
  }, [query, stateF, langF, milestoneF, typeF]);

  const hasFilters = query || stateF !== "all" || langF !== "all" || milestoneF !== "all" || typeF !== "all";

  const handleExport = () => {
    const header = ["Person", "Journey Type", "Started", "Language", "State", "Indicators", "Milestone", "Status", "Date / Note"];
    const body: (string | number)[][] = [];
    filtered.forEach(p => {
      p.milestones.forEach(m => {
        const noteStr = m.sub.join("; ") || m.date;
        body.push([p.name, p.journeyType, p.started, p.language, p.state, `${p.indicators}/${p.total}`, m.label, m.state, noteStr]);
      });
    });
    const ok = downloadCsv(`spiritual-milestones-${new Date().toISOString().split("T")[0]}.csv`, [header, ...body]);
    if (ok) toast.success(`Exported ${filtered.length} person${filtered.length === 1 ? "" : "s"}`);
    else toast.error("Couldn't start the download — your browser may have blocked it.");
  };

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Spiritual Milestones"
        subtitle="Track salvation decisions, baptism, and community connection for each person"
        actions={(
          <Button onClick={handleExport}>
            <Download className="w-4 h-4" /> Export Report
          </Button>
        )}
      />

      {/* Filter toolbar — above the cards */}
      <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search person..."
            className="pl-9 h-9"
          />
        </div>
        <FilterDropdown
          label="State"
          value={stateF}
          onChange={setStateF}
          options={[{ value: "all", label: "All states" }, ...MILESTONE_STATES.map(s => ({ value: s, label: s }))]}
        />
        <FilterDropdown
          label="Journey"
          value={typeF}
          onChange={setTypeF}
          options={[
            { value: "all",                  label: "All journey types" },
            { value: "Self-guided",          label: "Self-guided" },
            { value: "Conversation-based",   label: "Conversation-based" },
            { value: "Hybrid",               label: "Hybrid" },
          ]}
        />
        <FilterDropdown
          label="Milestone"
          value={milestoneF}
          onChange={setMilestoneF}
          options={[
            { value: "all",               label: "Any milestone status" },
            { value: "salvation:done",    label: "Salvation confirmed" },
            { value: "salvation:progress", label: "Salvation in progress" },
            { value: "baptism:done",      label: "Baptism confirmed" },
            { value: "baptism:progress",  label: "Baptism in progress" },
            { value: "community:done",    label: "Community confirmed" },
            { value: "community:progress", label: "Community in progress" },
            { value: "growth:done",       label: "Growth evidence met" },
            { value: "growth:pending",    label: "Growth not started" },
          ]}
        />
        <FilterDropdown
          label="Language"
          value={langF}
          onChange={setLangF}
          options={[
            { value: "all",          label: "All languages" },
            { value: "English",      label: "English" },
            { value: "Amharic",      label: "Amharic" },
            { value: "Afaan Oromoo", label: "Afaan Oromoo" },
          ]}
        />
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setQuery(""); setStateF("all"); setLangF("all"); setMilestoneF("all"); setTypeF("all"); }}
          >Clear</Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} of {MILESTONE_PEOPLE.length}</span>
      </div>

      <MilestonesCards people={filtered} />
    </div>
  );
}

// Render the milestone cards given a list of people (shared between the
// standalone page and the Faith Journeys tab).
function MilestonesCards({ people }: { people: MilestonePerson[] }) {
  const stateClass = (s: MilestoneState) =>
    s === "done"     ? "bg-emerald-50 border-emerald-200"
  : s === "progress" ? "bg-amber-50 border-amber-200"
                     : "bg-muted/30 border-border";
  const stateIcon = (s: MilestoneState) =>
    s === "done"     ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
  : s === "progress" ? <Clock className="w-4 h-4 text-amber-600" />
                     : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />;

  if (people.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <p className="text-sm text-muted-foreground">No milestones match your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {people.map((p) => (
        <div key={p.id} className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <Avatar name={p.name} tone={p.avatarTone} />
              <div>
                <div className="text-sm font-bold text-foreground">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.journeyType} · Started: {p.started} · {p.language}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Chip tone={p.stateTone}>{p.state}</Chip>
              <span className="text-xs text-muted-foreground font-medium">{p.indicators}/{p.total} Indicators</span>
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

// Compact shim for the Faith Journeys "Spiritual Milestones" tab — reuses the
// same card renderer so both surfaces stay visually consistent. It projects
// the filtered journey list into MilestonePerson records so filters set on the
// page also narrow the milestones view.
function MilestonesInner({ journeys }: { journeys?: Journey[] }) {
  if (!journeys) {
    return <MilestonesCards people={MILESTONE_PEOPLE} />;
  }
  const nameSet = new Set(journeys.map(j => j.name));
  // Match on name where possible; fall back to every seeded person when the
  // journey list doesn't overlap so the tab never shows an empty void.
  const matched = MILESTONE_PEOPLE.filter(p => nameSet.has(p.name));
  return <MilestonesCards people={matched.length > 0 ? matched : MILESTONE_PEOPLE} />;
}

function JourneyListInner({ journeys }: { journeys?: Journey[] }) {
  const source = journeys ?? INITIAL_JOURNEYS;
  const stageTone = (s: JourneyStage) =>
    s === "Touchpoint"     ? "slate"
  : s === "Engaged"        ? "amber"
  : s === "Active Journey" ? "blue"
                           : "green";
  const validationTone = (v: JourneyValidation) =>
    v === "Confirmed" ? "green"
  : v === "Pending"   ? "amber"
                      : "slate";
  const rows = source.map(j => ({
    name: j.name, source: j.source, type: j.type,
    stage: j.stage === "Active Journey" ? "Active" : j.stage, // shorter chip label
    stageTone: stageTone(j.stage) as any,
    indicators: j.indicators, total: j.total, milestone: j.milestone,
    validation: j.validation,
    validationTone: validationTone(j.validation) as any,
    avatarTone: j.avatarTone,
  }));
  if (rows.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center text-sm text-muted-foreground">
        No journeys match your filters.
      </div>
    );
  }
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

type ContentStatus = "Draft" | "Published" | "Archived";
type ContentAuthor = "curated" | "ai_generated";

type ContentRow = {
  id: string;
  title: string;
  type: string;
  typeTone: any;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  lang: string;
  status: ContentStatus;
  statusTone: any;
  summary: string;
  body: string;           // markdown
  tags: string[];
  author: ContentAuthor;
  source?: string;        // bible ref or external
  readTimeMin: number;
  variants: { telegram: string; whatsapp: string; sms: string; web: string };
  stats: { views: number; engagement: number; completion: number };
  updatedAt: string;
};

const CONTENT_TYPES = [
  { id: "Devotional",    tone: "pink"   as const },
  { id: "Bible Study",   tone: "blue"   as const },
  { id: "Study",         tone: "blue"   as const },
  { id: "Prayer Guide",  tone: "pink"   as const },
  { id: "Guide",         tone: "purple" as const },
  { id: "Reflection",    tone: "green"  as const },
  { id: "Testimony",     tone: "amber"  as const },
  { id: "Challenge",     tone: "amber"  as const },
  { id: "Quiz",          tone: "purple" as const },
  { id: "Resource Link", tone: "slate"  as const },
];

const CONTENT_CATEGORIES = ["Salvation", "Prayer", "Bible Basics", "Community", "Spiritual Growth", "Apologetics", "Worship", "Holy Spirit"];
const DIFFICULTIES       = ["Beginner", "Intermediate", "Advanced"] as const;
const CONTENT_LANGS      = ["English", "Amharic", "Afaan Oromoo"];

const toneForType = (t: string) => CONTENT_TYPES.find(x => x.id.toLowerCase() === t.toLowerCase())?.tone ?? "slate";

const makeVariants = (title: string, body: string) => ({
  telegram: `🙏 *${title}*\n\n${body}\n\n_What spoke to you today? Tap Reply._`,
  whatsapp: `🙏 *${title}*\n\n${body}\n\n_What spoke to you today? Reply to share._`,
  sms:      `${title}\n\n${body.replace(/\*\*?/g, "").slice(0, 140)}${body.length > 140 ? "..." : ""}`,
  web:      `## ${title}\n\n${body}\n\n> Reflect: What spoke to you today?`,
});

const INITIAL_CONTENT: ContentRow[] = [
  { id: "c1", title: "Welcome to Your Faith Journey",              type: "Devotional",   typeTone: "pink",   category: "Salvation",    difficulty: "Beginner",     lang: "English", status: "Published", statusTone: "green", summary: "A gentle introduction to beginning a relationship with Jesus.", body: "Stepping into faith can feel like standing at the edge of something vast. The good news is you don't step alone. Today, begin with a simple prayer: 'Jesus, I want to know you. Will you meet me here?'\n\nThat's it. That's the start.", tags: ["salvation", "new_believer", "prayer"], author: "curated",     source: "John 3:16",  readTimeMin: 3, variants: makeVariants("Welcome to Your Faith Journey", "Stepping into faith can feel like standing at the edge of something vast. The good news is you don't step alone."), stats: { views: 1420, engagement: 78, completion: 64 }, updatedAt: "2 days ago" },
  { id: "c2", title: "Finding Peace in His Presence",              type: "Study",        typeTone: "blue",   category: "Prayer",       difficulty: "Intermediate", lang: "English", status: "Published", statusTone: "green", summary: "An in-depth study on stilling your heart in prayer.",       body: "Peace isn't the absence of chaos — it's the presence of Someone. In Mark 4, Jesus sleeps through a storm because peace lives with him, not around him.\n\nPractise today: sit for 3 quiet minutes. Name what troubles you. Name who is with you.", tags: ["prayer", "peace", "mark_4"], author: "curated", source: "Mark 4:35-41", readTimeMin: 7, variants: makeVariants("Finding Peace in His Presence", "Peace isn't the absence of chaos — it's the presence of Someone."), stats: { views: 890, engagement: 82, completion: 55 }, updatedAt: "1 week ago" },
  { id: "c3", title: "Understanding the Holy Spirit",              type: "Guide",        typeTone: "purple", category: "Holy Spirit",  difficulty: "Advanced",     lang: "Amharic", status: "Draft",     statusTone: "amber", summary: "A theological overview of the Holy Spirit's role.",          body: "The Holy Spirit is not a force or a feeling. He is the personal presence of God — the one Jesus promised would come after him...\n\nThis guide explores three dimensions: comfort, conviction, and commissioning.", tags: ["holy_spirit", "theology", "john_14"], author: "curated", source: "John 14:15-26", readTimeMin: 12, variants: makeVariants("Understanding the Holy Spirit", "The Holy Spirit is not a force or a feeling — he is the personal presence of God."), stats: { views: 0, engagement: 0, completion: 0 }, updatedAt: "3 days ago" },
  { id: "c4", title: "Understanding the Bible: A Beginner's Guide", type: "Bible Study", typeTone: "blue",   category: "Bible Basics", difficulty: "Beginner",     lang: "English", status: "Published", statusTone: "green", summary: "How the Bible is organised and a plan for reading it.",     body: "The Bible is a library, not a single book — 66 books written over 1,500 years, held together by one story: God drawing close to his people.\n\nStart here: the Gospel of John. One chapter a day, for 21 days.", tags: ["bible_basics", "reading_plan"], author: "curated",                          readTimeMin: 8, variants: makeVariants("Understanding the Bible: A Beginner's Guide", "The Bible is a library, not a single book — 66 books held together by one story."), stats: { views: 2100, engagement: 74, completion: 70 }, updatedAt: "2 weeks ago" },
  { id: "c5", title: "Daily Prayer Practice",                      type: "Prayer Guide", typeTone: "pink",   category: "Prayer",       difficulty: "Beginner",     lang: "English", status: "Published", statusTone: "green", summary: "A 5-minute daily prayer rhythm anyone can begin.",          body: "The simplest prayer rhythm: pause, praise, ask, listen.\n\n• Pause (30 seconds of silence)\n• Praise (something you're thankful for)\n• Ask (one real request)\n• Listen (what comes to mind?)\n\nFive minutes. Every day.", tags: ["prayer", "rhythm"], author: "curated", readTimeMin: 4, variants: makeVariants("Daily Prayer Practice", "The simplest prayer rhythm: pause, praise, ask, listen."), stats: { views: 1680, engagement: 85, completion: 72 }, updatedAt: "4 days ago" },
  { id: "c6", title: "7-Day Worship Challenge",                    type: "Challenge",    typeTone: "amber",  category: "Worship",      difficulty: "Beginner",     lang: "English", status: "Published", statusTone: "green", summary: "A week of small worship practices.",                        body: "Day 1: Sing one song.\nDay 2: Thank someone out loud.\nDay 3: Pray the Lord's Prayer.\nDay 4: Read Psalm 23.\nDay 5: Sit in silence for 5 minutes.\nDay 6: Share a verse with a friend.\nDay 7: Go to a gathering.", tags: ["worship", "challenge", "7-day"], author: "curated", readTimeMin: 2, variants: makeVariants("7-Day Worship Challenge", "A week of small worship practices."), stats: { views: 560, engagement: 69, completion: 41 }, updatedAt: "5 days ago" },
];

export function ContentLibraryView({ canEdit = true }: { canEdit?: boolean }) {
  const [items, setItems]        = useState<ContentRow[]>(INITIAL_CONTENT);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen]   = useState(false);
  const [isAiOpen, setIsAiOpen]     = useState(false);

  const [query, setQuery]           = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [catFilter, setCatFilter]   = useState("all");
  const [diffFilter, setDiffFilter] = useState("all");
  const [langFilter, setLangFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const selected = items.find(c => c.id === selectedId) || null;
  const editing  = items.find(c => c.id === editingId) || null;

  const filtered = useMemo(() => {
    return items.filter(c => {
      const q = query.toLowerCase();
      const matchesQ = !q || c.title.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q) || c.tags.some(t => t.includes(q));
      return matchesQ
        && (typeFilter === "all" || c.type === typeFilter)
        && (catFilter === "all" || c.category === catFilter)
        && (diffFilter === "all" || c.difficulty === diffFilter)
        && (langFilter === "all" || c.lang === langFilter)
        && (statusFilter === "all" || c.status === statusFilter);
    });
  }, [items, query, typeFilter, catFilter, diffFilter, langFilter, statusFilter]);

  const upsert = (row: ContentRow) => {
    setItems(list => list.some(x => x.id === row.id) ? list.map(x => x.id === row.id ? row : x) : [row, ...list]);
  };

  // Drill into detail view
  if (selected) {
    return (
      <ContentDetailView
        item={selected}
        canEdit={canEdit}
        onBack={() => setSelectedId(null)}
        onEdit={() => { setEditingId(selected.id); setSelectedId(null); }}
        onPublish={() => {
          setItems(list => list.map(x => x.id === selected.id ? { ...x, status: "Published", statusTone: "green" } : x));
          toast.success(`"${selected.title}" published`);
        }}
        onArchive={() => {
          setItems(list => list.map(x => x.id === selected.id ? { ...x, status: "Archived", statusTone: "slate" } : x));
          toast.success(`"${selected.title}" archived`);
        }}
        onDuplicate={() => {
          const copy: ContentRow = { ...selected, id: `c-${Date.now()}`, title: `${selected.title} (Copy)`, status: "Draft", statusTone: "amber", stats: { views: 0, engagement: 0, completion: 0 } };
          upsert(copy);
          toast.success(`Duplicated as "${copy.title}"`);
        }}
        onDelete={() => {
          setItems(list => list.filter(x => x.id !== selected.id));
          setSelectedId(null);
          toast.success(`"${selected.title}" deleted`);
        }}
      />
    );
  }

  const publishedCount = items.filter(i => i.status === "Published").length;
  const draftCount     = items.filter(i => i.status === "Draft").length;
  const aiCount        = items.filter(i => i.author === "ai_generated").length;

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Content Library"
        subtitle="Manage devotionals, studies, and resources for automations"
        actions={canEdit && (
          <>
            <Button
              variant="outline"
              className="border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-800"
              onClick={() => setIsAiOpen(true)}
            >
              <Sparkles className="w-4 h-4" /> AI Generate
            </Button>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="w-4 h-4" /> Add Content
            </Button>
          </>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard label="Total Items" value={items.length}      icon={BookOpen}     tone="blue" />
        <StatCard label="Published"   value={publishedCount}    icon={CheckCircle2} tone="green" />
        <StatCard label="Drafts"      value={draftCount}        icon={Edit2}        tone="amber" />
        <StatCard label="AI-generated" value={aiCount}          icon={Sparkles}     tone="purple" />
      </div>

      <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, summary, or tag..."
            className="pl-9 h-9"
          />
        </div>
        <FilterDropdown
          label="Type"
          value={typeFilter}
          onChange={setTypeFilter}
          options={[{ value: "all", label: "All types" }, ...CONTENT_TYPES.map(t => ({ value: t.id, label: t.id }))]}
        />
        <FilterDropdown
          label="Category"
          value={catFilter}
          onChange={setCatFilter}
          options={[{ value: "all", label: "All categories" }, ...CONTENT_CATEGORIES.map(c => ({ value: c, label: c }))]}
        />
        <FilterDropdown
          label="Difficulty"
          value={diffFilter}
          onChange={setDiffFilter}
          options={[{ value: "all", label: "Any difficulty" }, ...DIFFICULTIES.map(d => ({ value: d, label: d }))]}
        />
        <FilterDropdown
          label="Language"
          value={langFilter}
          onChange={setLangFilter}
          options={[{ value: "all", label: "All languages" }, ...CONTENT_LANGS.map(l => ({ value: l, label: l }))]}
        />
        <FilterDropdown
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all",       label: "All statuses" },
            { value: "Published", label: "Published" },
            { value: "Draft",     label: "Draft" },
            { value: "Archived",  label: "Archived" },
          ]}
        />
        {(query || typeFilter !== "all" || catFilter !== "all" || diffFilter !== "all" || langFilter !== "all" || statusFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setQuery(""); setTypeFilter("all"); setCatFilter("all"); setDiffFilter("all"); setLangFilter("all"); setStatusFilter("all"); }}
          >
            Clear
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} of {items.length}</span>
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
              <th className="px-4 py-3 text-right font-semibold w-10">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No content matches your filters.
                </td>
              </tr>
            ) : filtered.map(c => (
              <tr
                key={c.id}
                className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => setSelectedId(c.id)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{c.title}</span>
                    {c.author === "ai_generated" && (
                      <span title="AI-generated"><Sparkles className="w-3 h-3 text-violet-500" /></span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate max-w-[360px]">{c.summary}</p>
                </td>
                <td className="px-4 py-3"><Chip tone={c.typeTone}>{c.type}</Chip></td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{c.category}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{c.difficulty}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{c.lang}</td>
                <td className="px-4 py-3"><Chip tone={c.statusTone}>{c.status}</Chip></td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <ContentActionsMenu
                    item={c}
                    canEdit={canEdit}
                    onView={() => setSelectedId(c.id)}
                    onEdit={() => setEditingId(c.id)}
                    onTogglePublish={() => {
                      const next: ContentStatus = c.status === "Published" ? "Draft" : "Published";
                      setItems(list => list.map(x => x.id === c.id ? { ...x, status: next, statusTone: next === "Published" ? "green" : "amber" } : x));
                      toast.success(`${c.title} ${next === "Published" ? "published" : "unpublished"}`);
                    }}
                    onDuplicate={() => {
                      const copy: ContentRow = { ...c, id: `c-${Date.now()}`, title: `${c.title} (Copy)`, status: "Draft", statusTone: "amber", stats: { views: 0, engagement: 0, completion: 0 } };
                      upsert(copy);
                      toast.success(`Duplicated as "${copy.title}"`);
                    }}
                    onArchive={() => {
                      setItems(list => list.map(x => x.id === c.id ? { ...x, status: "Archived", statusTone: "slate" } : x));
                      toast.success(`${c.title} archived`);
                    }}
                    onDelete={() => {
                      setItems(list => list.filter(x => x.id !== c.id));
                      toast.success(`${c.title} deleted`);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit modal */}
      <ContentFormModal
        key={editing?.id ?? "new"}
        isOpen={isAddOpen || editing !== null}
        initial={editing ?? undefined}
        onClose={() => { setIsAddOpen(false); setEditingId(null); }}
        onSubmit={(row) => {
          upsert(row);
          toast.success(editing ? `"${row.title}" updated` : `"${row.title}" saved as draft`);
          setIsAddOpen(false);
          setEditingId(null);
        }}
      />

      {/* AI Generate modal */}
      <AiGenerateModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        onSave={(row) => {
          upsert(row);
          toast.success(`AI draft "${row.title}" added to your library`);
          setIsAiOpen(false);
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Content actions menu
// ---------------------------------------------------------------------------

function ContentActionsMenu({
  item, canEdit, onView, onEdit, onTogglePublish, onDuplicate, onArchive, onDelete,
}: {
  item: ContentRow;
  canEdit: boolean;
  onView: () => void;
  onEdit: () => void;
  onTogglePublish: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center justify-center h-8 w-8 rounded-md",
          "text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring"
        )}
        aria-label={`Actions for ${item.title}`}
      >
        <MoreHorizontal className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={onView}>
          <Eye className="w-3.5 h-3.5" /> View
        </DropdownMenuItem>
        {canEdit && (
          <>
            <DropdownMenuItem onSelect={onEdit}>
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onTogglePublish}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              {item.status === "Published" ? "Unpublish" : "Publish"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onDuplicate}>
              <FileText className="w-3.5 h-3.5" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onArchive}>
              <Archive className="w-3.5 h-3.5" /> Archive
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// Content detail view — full page with channel variant preview
// ---------------------------------------------------------------------------

function ContentDetailView({
  item, canEdit, onBack, onEdit, onPublish, onArchive, onDuplicate, onDelete,
}: {
  item: ContentRow; canEdit: boolean;
  onBack: () => void; onEdit: () => void;
  onPublish: () => void; onArchive: () => void;
  onDuplicate: () => void; onDelete: () => void;
}) {
  const [channel, setChannel] = useState<"telegram" | "whatsapp" | "sms" | "web">("telegram");
  const variant = item.variants[channel];

  return (
    <div className="p-6 space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Content Library
      </button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Chip tone={item.typeTone}>{item.type}</Chip>
            <Chip tone={item.statusTone}>{item.status}</Chip>
            {item.author === "ai_generated" && (
              <Chip tone="purple"><Sparkles className="w-3 h-3" /> AI-generated</Chip>
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{item.title}</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{item.summary}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {item.category} · {item.difficulty} · {item.lang} · {item.readTimeMin} min read · Updated {item.updatedAt}
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button onClick={onEdit}>
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </Button>
            {item.status !== "Published" ? (
              <Button variant="outline" onClick={onPublish}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Publish
              </Button>
            ) : (
              <Button variant="outline" onClick={onArchive}>
                <Archive className="w-3.5 h-3.5" /> Archive
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onSelect={onDuplicate}>
                  <FileText className="w-3.5 h-3.5" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Views"            value={item.stats.views.toLocaleString()} icon={Eye}         tone="blue" />
        <StatCard label="Engagement"       value={`${item.stats.engagement}%`}       icon={Activity}    tone="green" />
        <StatCard label="Completion Rate"  value={`${item.stats.completion}%`}       icon={CheckCircle2} tone="purple" />
        <StatCard label="Tags"             value={item.tags.length}                   icon={FileText}   tone="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-4">
        {/* Body */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="text-base font-bold text-foreground">Content</h3>
          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{item.body}</p>
          </div>
          {item.source && (
            <p className="text-xs text-muted-foreground italic border-t border-border pt-3">Source: {item.source}</p>
          )}
          {item.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-border">
              {item.tags.map(t => <Chip key={t} tone="slate">#{t}</Chip>)}
            </div>
          )}
        </div>

        {/* Channel variant preview */}
        <div className="bg-card border border-border rounded-xl p-5 h-fit">
          <h3 className="text-base font-bold text-foreground mb-3">Channel preview</h3>
          <div className="flex items-center gap-1 bg-muted/60 rounded-md p-0.5 mb-3">
            {([
              ["telegram", "Telegram"], ["whatsapp", "WhatsApp"], ["sms", "SMS"], ["web", "Web"],
            ] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setChannel(k)}
                className={cn(
                  "flex-1 px-2.5 py-1.5 text-xs font-semibold rounded transition-all",
                  channel === k ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >{label}</button>
            ))}
          </div>
          <div className="bg-muted rounded-lg p-3 min-h-[220px]">
            <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">{variant}</pre>
          </div>
          {channel === "sms" && (
            <p className="text-xs text-muted-foreground mt-2">
              {variant.length} chars · {Math.max(1, Math.ceil(variant.length / 160))} SMS segment{variant.length > 160 ? "s" : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add / Edit modal
// ---------------------------------------------------------------------------

function ContentFormModal({
  isOpen, initial, onClose, onSubmit,
}: {
  isOpen: boolean;
  initial?: ContentRow;
  onClose: () => void;
  onSubmit: (row: ContentRow) => void;
}) {
  const isEdit = !!initial;
  const [title, setTitle]         = useState(initial?.title ?? "");
  const [type, setType]           = useState<string>(initial?.type ?? "Devotional");
  const [category, setCategory]   = useState<string>(initial?.category ?? "Salvation");
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">(initial?.difficulty ?? "Beginner");
  const [lang, setLang]           = useState(initial?.lang ?? "English");
  const [summary, setSummary]     = useState(initial?.summary ?? "");
  const [body, setBody]           = useState(initial?.body ?? "");
  const [tagsText, setTagsText]   = useState((initial?.tags ?? []).join(", "));
  const [source, setSource]       = useState(initial?.source ?? "");

  const canSave = title.trim().length > 0 && body.trim().length > 0;

  const handleSave = (publish: boolean) => {
    const tags = tagsText.split(",").map(t => t.trim()).filter(Boolean);
    const row: ContentRow = {
      id: initial?.id ?? `c-${Date.now()}`,
      title: title.trim(),
      type,
      typeTone: toneForType(type),
      category,
      difficulty,
      lang,
      status: publish ? "Published" : (initial?.status ?? "Draft"),
      statusTone: publish ? "green" : (initial?.statusTone ?? "amber"),
      summary: summary.trim(),
      body: body.trim(),
      tags,
      author: initial?.author ?? "curated",
      source: source.trim() || undefined,
      readTimeMin: Math.max(1, Math.round(body.length / 900)),
      variants: makeVariants(title.trim(), body.trim()),
      stats: initial?.stats ?? { views: 0, engagement: 0, completion: 0 },
      updatedAt: "just now",
    };
    onSubmit(row);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? `Edit "${initial?.title}"` : "Add Content"} size="lg">
      <div className="space-y-4">
        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold">Title <span className="text-destructive">*</span></Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Finding Peace in Prayer" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold">Type</Label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="h-10 px-3 rounded-md border border-input bg-background text-sm">
              {CONTENT_TYPES.map(t => <option key={t.id}>{t.id}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold">Category</Label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 px-3 rounded-md border border-input bg-background text-sm">
              {CONTENT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold">Difficulty</Label>
            <div className="flex items-center gap-1 bg-muted/60 rounded-md p-0.5">
              {DIFFICULTIES.map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    "flex-1 px-2 py-1.5 text-xs font-semibold rounded transition-all",
                    difficulty === d ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >{d}</button>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold">Language</Label>
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="h-10 px-3 rounded-md border border-input bg-background text-sm">
              {CONTENT_LANGS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold">Summary</Label>
          <Input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="One-line preview used in lists and notifications." />
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold">Body <span className="text-destructive">*</span></Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[180px] text-sm"
            placeholder="Markdown supported. Channel variants will be generated automatically."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold">Tags <span className="text-muted-foreground font-normal">(comma-separated)</span></Label>
            <Input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="prayer, grace, john_3_16" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold">Source <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. John 3:16" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={!canSave} onClick={() => handleSave(false)}>Save as draft</Button>
            <Button size="sm" disabled={!canSave} onClick={() => handleSave(true)}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Save & publish
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// AI Generate modal — staged flow: configure -> generating -> preview -> save
// ---------------------------------------------------------------------------

type AiStage = "configure" | "generating" | "ready";

function AiGenerateModal({
  isOpen, onClose, onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (row: ContentRow) => void;
}) {
  const [stage, setStage] = useState<AiStage>("configure");
  const [topic, setTopic] = useState("");
  const [type, setType]   = useState<string>("Devotional");
  const [category, setCategory] = useState<string>("Salvation");
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [lang, setLang]   = useState("English");
  const [tone, setTone]   = useState<"warm" | "scholarly" | "challenging" | "poetic">("warm");
  const [generated, setGenerated] = useState<ContentRow | null>(null);

  const reset = () => {
    setStage("configure");
    setTopic("");
    setGenerated(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const runGeneration = () => {
    if (!topic.trim()) return;
    setStage("generating");
    // Stubbed generation — in production this hits POST /v1/content-items/generate.
    // We simulate Claude's output with a templated result so the preview is
    // realistic enough to evaluate the UX.
    setTimeout(() => {
      const title = topic.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      const body =
        tone === "warm"        ? `Today, as you sit with the idea of ${topic.toLowerCase()}, let it land without hurry.\n\nScripture does not rush us. It invites us closer, one breath at a time.\n\nReflect: Where might God be closer than you've noticed?`
      : tone === "scholarly"   ? `The idea of ${topic.toLowerCase()} threads through both testaments and has been wrestled with by theologians for centuries.\n\nAt its heart, it is an invitation into a way of seeing — one rooted in the character of God revealed in Christ.\n\nExplore further: consider the Greek root and the New Testament usage.`
      : tone === "challenging" ? `${topic} will cost you something. Don't skip past that.\n\nFollowing Jesus is not a spectator sport. Today, name one step that actually changes your week — not just your feelings.\n\nChallenge: Do the one thing by Friday.`
                                : `${title} — a quiet light in the morning.\nA word spoken softly, but true.\n\nWe do not climb to God.\nHe comes down, and stays.`;
      const summary = `A ${difficulty.toLowerCase()} ${type.toLowerCase()} on ${topic.toLowerCase()} in a ${tone} tone.`;
      const row: ContentRow = {
        id: `c-${Date.now()}`,
        title,
        type,
        typeTone: toneForType(type),
        category,
        difficulty,
        lang,
        status: "Draft",
        statusTone: "amber",
        summary,
        body,
        tags: [topic.toLowerCase().replace(/\s+/g, "_"), category.toLowerCase().replace(/\s+/g, "_")],
        author: "ai_generated",
        readTimeMin: Math.max(1, Math.round(body.length / 900)),
        variants: makeVariants(title, body),
        stats: { views: 0, engagement: 0, completion: 0 },
        updatedAt: "just now",
      };
      setGenerated(row);
      setStage("ready");
    }, 1600);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Generate content with AI" size="lg">
      {stage === "configure" && (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Tell Claude what to write</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Claude will draft the content, channel variants, tags, and suggested tone. Review before publishing.
              </p>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold">Topic <span className="text-destructive">*</span></Label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder='e.g. "trusting God in uncertainty"' />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Type</Label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="h-10 px-3 rounded-md border border-input bg-background text-sm">
                {CONTENT_TYPES.map(t => <option key={t.id}>{t.id}</option>)}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Category</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 px-3 rounded-md border border-input bg-background text-sm">
                {CONTENT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Difficulty</Label>
              <div className="flex items-center gap-1 bg-muted/60 rounded-md p-0.5">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={cn(
                      "flex-1 px-2 py-1.5 text-xs font-semibold rounded transition-all",
                      difficulty === d ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >{d}</button>
                ))}
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Language</Label>
              <select value={lang} onChange={(e) => setLang(e.target.value)} className="h-10 px-3 rounded-md border border-input bg-background text-sm">
                {CONTENT_LANGS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold">Tone</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([
                ["warm",         "Warm"],
                ["scholarly",    "Scholarly"],
                ["challenging",  "Challenging"],
                ["poetic",       "Poetic"],
              ] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTone(k)}
                  className={cn(
                    "px-3 py-2 rounded-md text-xs font-semibold border transition-all",
                    tone === k ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:bg-muted/50"
                  )}
                >{label}</button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
            <Button size="sm" onClick={runGeneration} disabled={!topic.trim()}>
              <Sparkles className="w-3.5 h-3.5" /> Generate
            </Button>
          </div>
        </div>
      )}

      {stage === "generating" && (
        <div className="space-y-5 py-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center">
              <Sparkles className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">Claude is drafting your {type.toLowerCase()}...</p>
              <p className="text-sm text-muted-foreground mt-1">Usually takes a few seconds. Crafting title, body, tags, and channel variants.</p>
            </div>
          </div>
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full animate-pulse" style={{ width: "70%" }} />
          </div>
        </div>
      )}

      {stage === "ready" && generated && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-md bg-emerald-50/60 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">Draft ready for review</p>
              <p className="text-xs text-emerald-800/80 mt-0.5">Review below, then save as a draft. You can edit it further before publishing.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Chip tone={generated.typeTone}>{generated.type}</Chip>
                <Chip tone="purple"><Sparkles className="w-3 h-3" /> AI</Chip>
                <span className="text-xs text-muted-foreground">{generated.category} · {generated.difficulty} · {generated.lang}</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">{generated.title}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{generated.summary}</p>
            </div>
            <div className="bg-muted rounded-md p-4">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{generated.body}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {generated.tags.map(t => <Chip key={t} tone="slate">#{t}</Chip>)}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setStage("configure")}>
              <RefreshCw className="w-3.5 h-3.5" /> Try again
            </Button>
            <Button size="sm" onClick={() => { if (generated) onSave(generated); reset(); }}>
              <Plus className="w-3.5 h-3.5" /> Save as draft
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ============================================================================
// GROWTH METRICS
// ============================================================================

// Period presets for time-windowed analytics. Each preset returns plausible
// numbers so the page reacts visibly to filter changes even without a backend.
type GrowthPeriod = "7d" | "30d" | "90d" | "qtd" | "ytd";
const GROWTH_PERIODS: { value: GrowthPeriod; label: string }[] = [
  { value: "7d",  label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "qtd", label: "Quarter to date" },
  { value: "ytd", label: "Year to date" },
];

const GROWERS = [
  { id: "g1", name: "Abigail J.", prayer: 6, bible: 5, serve: "Weekly",  avatarTone: "purple" as const, language: "English" },
  { id: "g2", name: "Samuel B.",  prayer: 7, bible: 6, serve: "Daily",   avatarTone: "green"  as const, language: "English" },
  { id: "g3", name: "David K.",   prayer: 3, bible: 2, serve: "Monthly", avatarTone: "rose"   as const, language: "Amharic" },
  { id: "g4", name: "Miriam H.",  prayer: 5, bible: 4, serve: "Weekly",  avatarTone: "amber"  as const, language: "Afaan Oromoo" },
  { id: "g5", name: "Sara A.",    prayer: 6, bible: 5, serve: "Weekly",  avatarTone: "blue"   as const, language: "English" },
];

export function GrowthMetricsView() {
  const [period, setPeriod] = useState<GrowthPeriod>("30d");
  const [language, setLanguage] = useState("all");
  const [serveFreq, setServeFreq] = useState("all");

  // Period multipliers — fake but deterministic so filters feel real.
  const stats = useMemo(() => {
    const m = period === "7d" ? 0.8 : period === "30d" ? 1 : period === "90d" ? 1.05 : period === "qtd" ? 1.1 : 1.2;
    return {
      prayer:        (4.3 * m).toFixed(1),
      bible:         (3.7 * m).toFixed(1),
      contribution:  Math.round(62 * m),
      testimonies:   Math.round(38 * m),
      prayerDelta:   period === "7d" ? "+0.2 from prev. week" : period === "30d" ? "+0.8 from last month" : period === "90d" ? "+1.4 from last quarter" : "+1.9 vs benchmark",
      bibleDelta:    period === "7d" ? "+0.4 from prev. week" : period === "30d" ? "+1.2 from last month" : period === "90d" ? "+1.7 from last quarter" : "+2.1 vs benchmark",
      newTestimonies: period === "7d" ? "+3 this week" : period === "30d" ? "+12 this month" : "+34 this quarter",
    };
  }, [period]);

  const filteredGrowers = useMemo(() => {
    return GROWERS.filter(g => {
      const matchesL = language === "all" || g.language === language;
      const matchesS = serveFreq === "all" || g.serve === serveFreq;
      return matchesL && matchesS;
    });
  }, [language, serveFreq]);

  // Trend bars react to the period — different shape per window.
  const weeklyTrend = useMemo(() => {
    if (period === "7d")  return [[80, 65, 50], [82, 68, 55], [85, 70, 58], [88, 72, 60]];
    if (period === "30d") return [[85, 70, 55], [90, 75, 50], [78, 82, 60], [92, 80, 65]];
    if (period === "90d") return [[70, 60, 45], [78, 65, 50], [85, 72, 58], [92, 80, 65]];
    return [[60, 55, 40], [72, 65, 50], [85, 75, 60], [95, 85, 70]];
  }, [period]);

  const handleExport = () => {
    const meta = [
      [`Growth Metrics export — ${GROWTH_PERIODS.find(p => p.value === period)?.label}`],
      [`Generated ${new Date().toISOString()}`],
      [],
      ["Aggregate metric", "Value", "Trend"],
      ["Prayer days/week",     stats.prayer,        stats.prayerDelta],
      ["Bible engagement days/week", stats.bible,    stats.bibleDelta],
      ["Weekly contribution participation %", stats.contribution, ""],
      ["Fruit of the Spirit testimonies", stats.testimonies, stats.newTestimonies],
      [],
      ["Individual growth"],
      ["Person", "Language", "Prayer (days/7)", "Bible (days/7)", "Serve frequency"],
      ...filteredGrowers.map(g => [g.name, g.language, `${g.prayer}/7`, `${g.bible}/7`, g.serve]),
    ];
    const ok = downloadCsv(`growth-metrics-${period}-${new Date().toISOString().split("T")[0]}.csv`, meta);
    if (ok) toast.success(`Exported growth metrics (${filteredGrowers.length} people)`);
    else toast.error("Couldn't start the download");
  };

  const hasFilters = language !== "all" || serveFreq !== "all";

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Growth Metrics"
        subtitle="Track prayer, Bible engagement, contribution, and spiritual fruit across all journeys"
        actions={(
          <>
            <FilterDropdown
              label="Period"
              value={period}
              onChange={(v) => setPeriod(v as GrowthPeriod)}
              options={GROWTH_PERIODS.map(p => ({ value: p.value, label: p.label }))}
            />
            <Button onClick={handleExport}>
              <Download className="w-4 h-4" /> Export
            </Button>
          </>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard label="Prayer"               value={`${stats.prayer} days/week`} change={stats.prayerDelta}                  icon={Heart}     tone="pink" />
        <StatCard label="Bible Engagement"     value={`${stats.bible} days/week`}  change={stats.bibleDelta}                   icon={BookOpen}  tone="blue" />
        <StatCard label="Contribution"         value="Weekly"                       subtitle={`${stats.contribution}% participate weekly`} icon={HandHeart} tone="amber" />
        <StatCard label="Fruit of the Spirit"  value={`${stats.testimonies} testimonies`} change={stats.newTestimonies}        icon={Star}      tone="purple" />
      </div>

      {/* Filter toolbar — narrows the individual growth table */}
      <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-2 flex-wrap">
        <FilterDropdown
          label="Language"
          value={language}
          onChange={setLanguage}
          options={[
            { value: "all",          label: "All languages" },
            { value: "English",      label: "English" },
            { value: "Amharic",      label: "Amharic" },
            { value: "Afaan Oromoo", label: "Afaan Oromoo" },
          ]}
        />
        <FilterDropdown
          label="Serving"
          value={serveFreq}
          onChange={setServeFreq}
          options={[
            { value: "all",     label: "Any frequency" },
            { value: "Daily",   label: "Daily" },
            { value: "Weekly",  label: "Weekly" },
            { value: "Monthly", label: "Monthly" },
          ]}
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => { setLanguage("all"); setServeFreq("all"); }}>Clear</Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{filteredGrowers.length} of {GROWERS.length} people</span>
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
            {weeklyTrend.map((vals, wi) => (
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
            {filteredGrowers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No people match your filters.</p>
            ) : filteredGrowers.map((g) => (
              <div key={g.id} className="grid grid-cols-4 gap-2 items-center py-1.5">
                <div className="flex items-center gap-2">
                  <Avatar name={g.name} tone={g.avatarTone} />
                  <span className="text-sm font-medium text-foreground truncate">{g.name}</span>
                </div>
                <span className="text-sm text-violet-600 font-semibold tabular-nums">{g.prayer}/7</span>
                <span className="text-sm text-blue-600 font-semibold tabular-nums">{g.bible}/7</span>
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

// VITAL framework — descriptive metadata for each stage so the page reads as
// an explainer + dashboard rather than a wall of numbers.
const VITAL_STAGES = [
  { key: "V", letter: "Volume",      title: "V — Volume",      color: "bg-blue-500",    text: "text-blue-600",    light: "bg-blue-50",    blurb: "How many people we reached. Counts every unique touchpoint across all platforms — passive views, link clicks, ad impressions that landed." },
  { key: "I", letter: "Interaction", title: "I — Interaction", color: "bg-violet-500",  text: "text-violet-600",  light: "bg-violet-50",  blurb: "How many of those people engaged back. A reply, a button tap, a form started — anything that says 'I'm listening.'" },
  { key: "T", letter: "Transaction", title: "T — Transaction", color: "bg-pink-500",    text: "text-pink-600",    light: "bg-pink-50",    blurb: "People who started a faith journey. Completed intake, entered the discipleship pipeline, accepted a mentor match." },
  { key: "A", letter: "Active",      title: "A — Active",      color: "bg-amber-500",   text: "text-amber-600",   light: "bg-amber-50",   blurb: "People with continuing engagement — opening drips, replying to mentors, completing campaign steps." },
  { key: "L", letter: "Loyal",       title: "L — Loyal",       color: "bg-emerald-500", text: "text-emerald-600", light: "bg-emerald-50", blurb: "Confirmed decisions + connected to a local fellowship. The full transition from seeker to disciple within community." },
] as const;

const VITAL_BASE = { V: 12450, I: 3820, T: 1247, A: 342, L: 89 };

const VITAL_PERIODS = [
  { value: "ytd",     label: "Year to date" },
  { value: "q1_2026", label: "Q1 2026" },
  { value: "q4_2025", label: "Q4 2025" },
  { value: "30d",     label: "Last 30 days" },
  { value: "90d",     label: "Last 90 days" },
];

export function VitalAnalyticsView() {
  const [period, setPeriod] = useState("ytd");
  const [platform, setPlatform] = useState("all");
  const [country, setCountry] = useState("all");
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Period multiplier — narrower windows shrink the funnel proportionally.
  const m = period === "30d" ? 0.18 : period === "90d" ? 0.45 : period === "q4_2025" ? 0.7 : period === "q1_2026" ? 0.8 : 1;
  const numbers: Record<keyof typeof VITAL_BASE, number> = {
    V: Math.round(VITAL_BASE.V * m),
    I: Math.round(VITAL_BASE.I * m),
    T: Math.round(VITAL_BASE.T * m),
    A: Math.round(VITAL_BASE.A * m),
    L: Math.round(VITAL_BASE.L * m),
  };
  const conversions = [
    { from: "V", to: "I", pct: numbers.V === 0 ? 0 : +(numbers.I / numbers.V * 100).toFixed(1) },
    { from: "I", to: "T", pct: numbers.I === 0 ? 0 : +(numbers.T / numbers.I * 100).toFixed(1) },
    { from: "T", to: "A", pct: numbers.T === 0 ? 0 : +(numbers.A / numbers.T * 100).toFixed(1) },
    { from: "A", to: "L", pct: numbers.A === 0 ? 0 : +(numbers.L / numbers.A * 100).toFixed(1) },
  ];

  // Largest stage drives the relative bar width — gives the funnel a real
  // sense of attrition between stages.
  const widths = useMemo(() => {
    const max = Math.max(numbers.V, 1);
    return {
      V: 100,
      I: Math.round((numbers.I / max) * 100),
      T: Math.round((numbers.T / max) * 100),
      A: Math.round((numbers.A / max) * 100),
      L: Math.round((numbers.L / max) * 100),
    };
  }, [numbers]);

  const periodLabel = VITAL_PERIODS.find(p => p.value === period)?.label ?? period;

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="VITAL Framework Analytics"
        subtitle="A 5-stage funnel that follows people from first touch to a community-rooted disciple."
        actions={(
          <>
            <FilterDropdown label="Period"   value={period}   onChange={setPeriod}   options={VITAL_PERIODS} />
            <FilterDropdown label="Platform" value={platform} onChange={setPlatform} options={[
              { value: "all",       label: "All platforms" },
              { value: "telegram",  label: "Telegram" },
              { value: "whatsapp",  label: "WhatsApp" },
              { value: "sms",       label: "SMS" },
              { value: "web",       label: "Web" },
              { value: "messenger", label: "Messenger" },
            ]} />
            <FilterDropdown label="Country" value={country} onChange={setCountry} options={[
              { value: "all",      label: "All countries" },
              { value: "ethiopia", label: "Ethiopia" },
              { value: "kenya",    label: "Kenya" },
              { value: "other",    label: "Other" },
            ]} />
            <Button onClick={() => setIsShareOpen(true)}>
              <Share2 className="w-4 h-4" /> Share Report
            </Button>
          </>
        )}
      />

      {/* Explainer banner — answers "what is VITAL?" up front */}
      <div className="bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-100 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">VITAL — Volume → Interaction → Transaction → Active → Loyal</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-3xl">
              Each letter is a discipleship stage. The funnel reveals where people drop off, where ministry effort pays off, and where to invest next.
              <span className="font-semibold text-foreground"> {periodLabel}</span> shows {numbers.V.toLocaleString()} touchpoints converted into {numbers.L.toLocaleString()} loyal disciples — a {((numbers.L / numbers.V) * 100).toFixed(2)}% end-to-end conversion rate.
            </p>
          </div>
        </div>
      </div>

      {/* Funnel — visually tapered by relative widths */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">VITAL Funnel — People Progression</h3>
          <span className="text-xs text-muted-foreground">{periodLabel}</span>
        </div>
        <div className="space-y-2.5">
          {VITAL_STAGES.map((s, i) => {
            const value = numbers[s.key as keyof typeof numbers];
            const width = widths[s.key as keyof typeof widths];
            const conv = i > 0 ? conversions[i - 1] : null;
            return (
              <div key={s.key}>
                {conv && (
                  <div className="flex items-center gap-2 px-2 mb-1">
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{conv.pct}% converted from {conv.from} → {conv.to}</span>
                  </div>
                )}
                <div
                  style={{ width: `${Math.max(width, 12)}%` }}
                  className={cn("rounded-lg p-4 text-white relative transition-all", s.color)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider opacity-90">{s.title}</div>
                      <div className="text-3xl font-bold tracking-tight tabular-nums mt-0.5">{value.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground px-2 mt-1.5 max-w-2xl leading-snug">{s.blurb}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-1">Platform Breakdown</h3>
          <p className="text-xs text-muted-foreground mb-3">Where Volume comes from. Helps you double down on what's working.</p>
          <div className="space-y-2.5">
            {[
              { label: "Telegram",  value: 4230, dot: "bg-blue-500" },
              { label: "WhatsApp",  value: 3810, dot: "bg-emerald-500" },
              { label: "SMS",       value: 2150, dot: "bg-violet-500" },
              { label: "Web",       value: 1420, dot: "bg-amber-500" },
              { label: "Messenger", value:  840, dot: "bg-pink-500" },
            ].map((p, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", p.dot)} />
                    <span className="text-sm text-foreground">{p.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground tabular-nums">{Math.round(p.value * m).toLocaleString()}</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", p.dot)} style={{ width: `${Math.min(100, (p.value / 4230) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-1">Journey Type Distribution</h3>
          <p className="text-xs text-muted-foreground mb-3">How the Active cohort entered discipleship — bot-led, human-led, or self-directed.</p>
          <div className="space-y-2.5">
            {[
              { chip: "Bot",          chipTone: "blue"  as const, label: "Self-guided bots",   value: 58 },
              { chip: "Conversation", chipTone: "green" as const, label: "Human-led",          value: 30 },
              { chip: "Self-guided",  chipTone: "amber" as const, label: "Web-based",          value: 12 },
            ].map((p, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Chip tone={p.chipTone}>{p.chip}</Chip>
                    <span className="text-sm text-muted-foreground">{p.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground tabular-nums">{p.value}%</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", p.chipTone === "blue" ? "bg-blue-500" : p.chipTone === "green" ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${p.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-1">Demographics</h3>
          <p className="text-xs text-muted-foreground mb-3">Who the Loyal cohort is — language, geography, and age signal targeting wins.</p>
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

      <ShareReportModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        reportName={`VITAL Analytics — ${periodLabel}`}
        summary={`${numbers.V.toLocaleString()} touchpoints, ${numbers.L.toLocaleString()} loyal disciples, ${((numbers.L / numbers.V) * 100).toFixed(2)}% end-to-end conversion.`}
      />
    </div>
  );
}

// Shared share-report modal — used by VITAL Analytics and Reporting page.
function ShareReportModal({
  isOpen, onClose, reportName, summary,
}: { isOpen: boolean; onClose: () => void; reportName: string; summary: string }) {
  const [recipients, setRecipients] = useState("");
  const [note, setNote] = useState(`Sharing the latest ${reportName} for your review.`);
  const [include, setInclude] = useState({ summary: true, charts: true, raw: false });

  const link = useMemo(() => {
    const slug = reportName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return `https://turumba.app/reports/${slug}`;
  }, [reportName]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy — copy it manually");
    }
  };

  const handleSend = () => {
    const list = recipients.split(/[,\s]+/).filter(Boolean);
    if (list.length === 0) {
      toast.error("Add at least one recipient");
      return;
    }
    toast.success(`Report shared with ${list.length} recipient${list.length === 1 ? "" : "s"}`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Share — ${reportName}`} size="lg">
      <div className="space-y-4">
        <div className="bg-muted/40 border border-border rounded-md p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Snapshot</p>
          <p className="text-sm text-foreground mt-1 leading-relaxed">{summary}</p>
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold">Shareable link</Label>
          <div className="flex items-center gap-2">
            <Input value={link} readOnly className="font-mono text-xs" />
            <Button variant="outline" size="sm" onClick={handleCopyLink}>Copy</Button>
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold">Email recipients</Label>
          <Input
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            placeholder="email1@example.com, email2@example.com"
          />
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold">Message</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[80px] text-sm"
          />
        </div>

        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Include</Label>
          <div className="space-y-1.5">
            {[
              ["summary", "Headline summary"],
              ["charts",  "Charts and visualisations"],
              ["raw",     "Raw data attachment (CSV)"],
            ].map(([k, label]) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={(include as any)[k]}
                  onChange={(e) => setInclude(prev => ({ ...prev, [k]: e.target.checked }))}
                />
                <span className="text-sm text-foreground">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSend}>
            <Share2 className="w-3.5 h-3.5" /> Send
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================================
// REPORTING (153 Collective)
// ============================================================================

type ReportDim = "language" | "country" | "platform" | "gender" | "journey";
const REPORT_PERIODS = [
  { value: "q1_2026", label: "Q1 2026", year: 2026, q: 1 },
  { value: "q4_2025", label: "Q4 2025", year: 2025, q: 4 },
  { value: "q3_2025", label: "Q3 2025", year: 2025, q: 3 },
  { value: "ytd",     label: "Year to date", year: 2026, q: 0 },
];

const REPORT_DATA: Record<ReportDim, { label: string; cols: number[]; pct: number }[]> = {
  language: [
    { label: "Amharic",       cols: [144, 38, 29, 14], pct: 26.4 },
    { label: "English",       cols: [118, 31, 24, 11], pct: 26.3 },
    { label: "Afaan Oromoo",  cols: [80,  20, 14, 8],  pct: 25.0 },
  ],
  country: [
    { label: "Ethiopia",      cols: [232, 62, 48, 23], pct: 26.7 },
    { label: "Kenya",         cols: [75,  19, 14, 7],  pct: 25.3 },
    { label: "Other",         cols: [35,  8,  5,  3],  pct: 22.8 },
  ],
  platform: [
    { label: "Telegram",      cols: [142, 36, 28, 14], pct: 25.3 },
    { label: "WhatsApp",      cols: [128, 35, 25, 12], pct: 27.3 },
    { label: "SMS",           cols: [72,  18, 12, 6],  pct: 25.0 },
  ],
  gender: [
    { label: "Female",        cols: [185, 50, 38, 18], pct: 27.0 },
    { label: "Male",          cols: [157, 39, 29, 15], pct: 24.8 },
  ],
  journey: [
    { label: "Salvation",     cols: [210, 60, 45, 22], pct: 28.6 },
    { label: "Baptism",       cols: [70,  17, 13, 6],  pct: 24.3 },
    { label: "Community",     cols: [62,  12, 9,  5],  pct: 19.4 },
  ],
};

export function ReportingView() {
  const [period, setPeriod] = useState("q1_2026");
  const [dim, setDim]       = useState<ReportDim>("language");
  const [country, setCountry] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [language, setLanguage] = useState("all");
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isShareOpen, setIsShareOpen]       = useState(false);

  const periodMeta = REPORT_PERIODS.find(p => p.value === period)!;

  // Period scales the data so cards + tables visibly change when period changes
  const m = period === "ytd" ? 1.4 : period === "q4_2025" ? 0.85 : period === "q3_2025" ? 0.65 : 1;

  const baseRows = REPORT_DATA[dim];
  const filteredRows = useMemo(() => {
    return baseRows.filter(r => {
      if (dim === "country"  && country  !== "all" && r.label.toLowerCase() !== country)  return false;
      if (dim === "platform" && platform !== "all" && r.label.toLowerCase() !== platform) return false;
      if (dim === "language" && language !== "all" && r.label !== language)              return false;
      return true;
    }).map(r => ({
      ...r,
      cols: r.cols.map(c => Math.round(c * m)),
    }));
  }, [baseRows, dim, country, platform, language, m]);

  // Aggregate from current dimension for the hero banner so it is always
  // self-consistent.
  const totals = useMemo(() => {
    const rows = REPORT_DATA.platform.map(r => ({ ...r, cols: r.cols.map(c => Math.round(c * m)) }));
    return {
      newJourneys: rows.reduce((s, r) => s + r.cols[0], 0),
      decisions:   rows.reduce((s, r) => s + r.cols[1], 0),
      active:      rows.reduce((s, r) => s + r.cols[2], 0),
      connected:   rows.reduce((s, r) => s + r.cols[3], 0),
      platforms:   5,
      languages:   3,
      countries:   3,
    };
  }, [m]);

  const handleExportCsv = () => {
    const meta: (string | number)[][] = [
      [`153 Collective Standard Report`],
      [`Period: ${periodMeta.label}`],
      [`Generated: ${new Date().toISOString()}`],
      [],
      ["Headline summary"],
      ["New Faith Journeys", totals.newJourneys],
      ["Decisions",          totals.decisions],
      ["Active",             totals.active],
      ["Connected",          totals.connected],
      [],
      [`Breakdown by ${dim}`],
      [dim, "New Journeys", "Decisions", "Active", "Connected", "Conversion %"],
      ...filteredRows.map(r => [r.label, ...r.cols, `${r.pct}%`]),
    ];
    downloadCsv(`153-collective-${period}-${dim}-${new Date().toISOString().split("T")[0]}.csv`, meta);
    toast.success(`Report exported`);
  };

  const handleExportPdf = () => {
    // Stub: real implementation would server-render a PDF; we surface intent
    // via toast and the same CSV download.
    toast.success("PDF export queued — emailed to you shortly");
  };

  const hasFilters = country !== "all" || platform !== "all" || language !== "all";

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="153 Collective Reporting"
        subtitle="Generate standardized reports for cross-ministry comparison"
        actions={(
          <>
            <FilterDropdown label="Period" value={period} onChange={setPeriod} options={REPORT_PERIODS.map(p => ({ value: p.value, label: p.label }))} />
            <Button
              variant="outline"
              className="border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-800"
              onClick={() => setIsGenerateOpen(true)}
            >
              <Sparkles className="w-4 h-4" /> Generate Report
            </Button>
            <Button onClick={handleExportPdf}>
              <Download className="w-4 h-4" /> Export PDF
            </Button>
          </>
        )}
      />

      <div className="bg-slate-900 text-white rounded-xl p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Chip tone="blue" className="uppercase tracking-widest bg-blue-500/20 text-blue-200">153 Collective Standard</Chip>
            <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">{periodMeta.label} Report</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
            onClick={() => setIsShareOpen(true)}
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </Button>
        </div>
        <p className="text-lg font-semibold leading-snug">
          Turumba had {totals.newJourneys.toLocaleString()} new faith journeys across its platforms in {periodMeta.label}, with {totals.decisions.toLocaleString()} confirmed decisions and {totals.active.toLocaleString()} active journeys progressing through spiritual milestones.
        </p>
        <div className="flex items-center gap-5 mt-4 text-sm text-slate-300 flex-wrap">
          <span className="inline-flex items-center gap-1.5"><Globe className="w-4 h-4" /> {totals.platforms} Platforms</span>
          <span className="inline-flex items-center gap-1.5"><Languages className="w-4 h-4" /> {totals.languages} Languages</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {totals.countries} Countries</span>
        </div>
      </div>

      {/* Filter toolbar — narrows the breakdown table */}
      <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-2 flex-wrap">
        <FilterDropdown label="Country" value={country} onChange={setCountry} options={[
          { value: "all",      label: "All countries" },
          { value: "ethiopia", label: "Ethiopia" },
          { value: "kenya",    label: "Kenya" },
          { value: "other",    label: "Other" },
        ]} />
        <FilterDropdown label="Platform" value={platform} onChange={setPlatform} options={[
          { value: "all",      label: "All platforms" },
          { value: "telegram", label: "Telegram" },
          { value: "whatsapp", label: "WhatsApp" },
          { value: "sms",      label: "SMS" },
        ]} />
        <FilterDropdown label="Language" value={language} onChange={setLanguage} options={[
          { value: "all",          label: "All languages" },
          { value: "Amharic",      label: "Amharic" },
          { value: "English",      label: "English" },
          { value: "Afaan Oromoo", label: "Afaan Oromoo" },
        ]} />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => { setCountry("all"); setPlatform("all"); setLanguage("all"); }}>Clear</Button>
        )}
        <Button variant="outline" size="sm" onClick={handleExportCsv} className="ml-auto">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
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
            <span className="capitalize">{dim}</span>
            <span>New Journeys</span>
            <span>Decisions</span>
            <span>Active</span>
            <span>Connected</span>
            <span>Conversion %</span>
          </div>
          {filteredRows.length === 0 ? (
            <div className="px-3 py-12 text-center text-sm text-muted-foreground">No rows match the current filters.</div>
          ) : filteredRows.map((r, i) => (
            <div key={i} className="grid grid-cols-6 gap-2 px-3 py-3 items-center border-b border-border last:border-0">
              <span className="text-sm font-medium text-foreground">{r.label}</span>
              {r.cols.map((c, ci) => <span key={ci} className="text-sm text-foreground tabular-nums">{c.toLocaleString()}</span>)}
              <div className="flex items-center gap-2">
                <div className="flex-1"><ProgressBar value={r.pct * 3} tone="green" /></div>
                <span className="text-sm font-semibold text-emerald-600 tabular-nums">{r.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <GenerateReportModal
        isOpen={isGenerateOpen}
        period={periodMeta.label}
        onClose={() => setIsGenerateOpen(false)}
        onDone={() => {
          setIsGenerateOpen(false);
          toast.success("Report generated and saved to your reports");
        }}
      />

      <ShareReportModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        reportName={`153 Collective ${periodMeta.label}`}
        summary={`${totals.newJourneys.toLocaleString()} new journeys, ${totals.decisions.toLocaleString()} decisions, ${totals.active.toLocaleString()} active across ${totals.platforms} platforms.`}
      />
    </div>
  );
}

// Generate report — staged dialog showing the AI compiling the report.
function GenerateReportModal({
  isOpen, period, onClose, onDone,
}: { isOpen: boolean; period: string; onClose: () => void; onDone: () => void }) {
  const [stage, setStage] = useState<"configure" | "running" | "done">("configure");
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeNarrative, setIncludeNarrative] = useState(true);
  const [includeRaw, setIncludeRaw] = useState(false);

  // Reset stage when modal opens so reopening always starts fresh.
  React.useEffect(() => { if (isOpen) setStage("configure"); }, [isOpen]);

  const run = () => {
    setStage("running");
    setTimeout(() => setStage("done"), 1800);
  };

  const close = () => {
    setStage("configure");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="Generate 153 Collective Report" size="lg">
      {stage === "configure" && (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Compile a 153 Collective standard report</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Period: <span className="font-semibold text-foreground">{period}</span>. Claude will pull metrics from your account, compose a narrative summary, and assemble the dimension breakdowns.
              </p>
            </div>
          </div>

          <div className="grid gap-2 pt-1">
            <Label className="text-xs font-semibold">Include in report</Label>
            <div className="space-y-1.5">
              {[
                ["narrative", "AI narrative summary",      includeNarrative, setIncludeNarrative],
                ["charts",    "Charts and visualisations", includeCharts,    setIncludeCharts],
                ["raw",       "Raw data tables (CSV)",     includeRaw,       setIncludeRaw],
              ].map(([k, label, val, setVal]: any) => (
                <label key={k} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="accent-primary" checked={val} onChange={(e) => setVal(e.target.checked)} />
                  <span className="text-sm text-foreground">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={close}>Cancel</Button>
            <Button size="sm" onClick={run}>
              <Sparkles className="w-3.5 h-3.5" /> Generate
            </Button>
          </div>
        </div>
      )}

      {stage === "running" && (
        <div className="space-y-5 py-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center">
              <Sparkles className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">Compiling your report...</p>
              <p className="text-sm text-muted-foreground mt-1">Aggregating metrics, drafting narrative, formatting tables.</p>
            </div>
          </div>
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full animate-pulse" style={{ width: "70%" }} />
          </div>
        </div>
      )}

      {stage === "done" && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-md bg-emerald-50/60 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">Report ready</p>
              <p className="text-xs text-emerald-800/80 mt-0.5">Saved to your reports archive. You can share, export, or open it now.</p>
            </div>
          </div>
          <div className="rounded-md border border-border p-4">
            <p className="text-sm font-bold text-foreground">153 Collective — {period}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Includes: {[includeNarrative && "narrative", includeCharts && "charts", includeRaw && "raw data"].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={close}>Done</Button>
            <Button size="sm" onClick={onDone}>Open report</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ============================================================================
// VALIDATIONS
// ============================================================================

// Validation row + audit trail event types
type ValidationStatus  = "pending" | "confirmed" | "rejected";
type ValidatorChannel  = "telegram" | "whatsapp" | "sms" | "email";
type AuditEventKind    = "self_reported" | "notified" | "reminder" | "confirmed" | "rejected" | "comment";

interface AuditEvent {
  kind: AuditEventKind;
  by: string;        // who performed the action
  at: string;        // human readable timestamp
  channel?: ValidatorChannel;
  note?: string;
}

interface ValidationRow {
  id: string;
  name: string;
  email: string;
  milestone: "Salvation Decision" | "Baptism" | "Community" | "Growth Evidence";
  milestoneTone: "green" | "blue" | "purple" | "amber";
  date: string;
  source: string;
  validator: string;
  validatorChannel: ValidatorChannel;
  status: ValidationStatus;
  avatarTone: "blue" | "purple" | "rose" | "amber" | "green";
  remindersSent: number;
  audit: AuditEvent[];
}

const INITIAL_VALIDATIONS: ValidationRow[] = [
  {
    id: "v1", name: "Sara Ahmed", email: "sara@email.com",
    milestone: "Salvation Decision", milestoneTone: "green",
    date: "Mar 28, 2026", source: "via Telegram bot",
    validator: "Pastor James K.", validatorChannel: "telegram",
    status: "pending", avatarTone: "rose", remindersSent: 1,
    audit: [
      { kind: "self_reported", by: "Sara Ahmed",     at: "Mar 28, 2026 · 10:14",            channel: "telegram", note: "Indicated decision via intake bot" },
      { kind: "notified",      by: "System",          at: "Mar 28, 2026 · 10:15",            channel: "telegram", note: "Validator notified: Pastor James K." },
      { kind: "reminder",      by: "System",          at: "Mar 30, 2026 · 09:00",            channel: "telegram", note: "Gentle reminder sent to validator" },
    ],
  },
  {
    id: "v2", name: "David Kebede", email: "david@email.com",
    milestone: "Baptism", milestoneTone: "blue",
    date: "Apr 2, 2026", source: "via WhatsApp",
    validator: "Mentor Daniel M.", validatorChannel: "whatsapp",
    status: "pending", avatarTone: "blue", remindersSent: 0,
    audit: [
      { kind: "self_reported", by: "David Kebede",   at: "Apr 2, 2026 · 16:42",             channel: "whatsapp", note: "Requested baptism appointment" },
      { kind: "notified",      by: "System",          at: "Apr 2, 2026 · 16:42",             channel: "whatsapp", note: "Validator notified: Mentor Daniel M." },
    ],
  },
  {
    id: "v3", name: "Abigail Johnson", email: "abigail@email.com",
    milestone: "Salvation Decision", milestoneTone: "green",
    date: "Feb 3, 2026", source: "via Self-guided",
    validator: "Pastor James K.", validatorChannel: "email",
    status: "confirmed", avatarTone: "purple", remindersSent: 0,
    audit: [
      { kind: "self_reported", by: "Abigail Johnson", at: "Feb 3, 2026 · 09:21",  channel: "telegram", note: "Indicated decision in intake form" },
      { kind: "notified",      by: "System",          at: "Feb 3, 2026 · 09:21",  channel: "email",    note: "Validator notified: Pastor James K." },
      { kind: "comment",       by: "Pastor James K.",  at: "Feb 4, 2026 · 14:02",                       note: "Met briefly after Sunday service. Sincere." },
      { kind: "confirmed",     by: "Pastor James K.",  at: "Feb 5, 2026 · 11:30",                       note: "Decision confirmed by mentor" },
    ],
  },
  {
    id: "v4", name: "Miriam Haile", email: "miriam@email.com",
    milestone: "Community", milestoneTone: "purple",
    date: "Apr 5, 2026", source: "Referred to fellowship",
    validator: "Sister Ruth B.", validatorChannel: "whatsapp",
    status: "pending", avatarTone: "amber", remindersSent: 0,
    audit: [
      { kind: "self_reported", by: "Miriam Haile",    at: "Apr 5, 2026 · 19:08",                          note: "Joined Tuesday community group" },
    ],
  },
];

const VALIDATION_TABS = ["pending", "confirmed", "rejected", "all"] as const;
const VALIDATION_MILESTONES = ["Salvation Decision", "Baptism", "Community", "Growth Evidence"] as const;

export function ValidationsView() {
  const [rows, setRows]                 = useState<ValidationRow[]>(INITIAL_VALIDATIONS);
  const [tab, setTab]                   = useState<typeof VALIDATION_TABS[number]>("pending");
  const [query, setQuery]               = useState("");
  const [milestoneF, setMilestoneF]     = useState<string>("all");
  const [validatorF, setValidatorF]     = useState<string>("all");
  const [staleF, setStaleF]             = useState<string>("all"); // notified > N days ago
  const [reminderTarget, setReminderTarget] = useState<ValidationRow[] | null>(null);
  const [auditFor, setAuditFor]         = useState<ValidationRow | null>(null);
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());

  // Validators dropdown is derived from current rows
  const allValidators = useMemo(() => Array.from(new Set(rows.map(r => r.validator))), [rows]);

  const baseFiltered = useMemo(() => {
    return rows.filter(r => {
      const q = query.toLowerCase();
      const matchesQ = !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.validator.toLowerCase().includes(q);
      const matchesM = milestoneF === "all" || r.milestone === milestoneF;
      const matchesV = validatorF === "all" || r.validator === validatorF;
      const matchesS =
        staleF === "all" ? true
        : staleF === "stale_3" ? r.status === "pending" && r.remindersSent >= 1
        : staleF === "no_reminder" ? r.status === "pending" && r.remindersSent === 0
        : true;
      return matchesQ && matchesM && matchesV && matchesS;
    });
  }, [rows, query, milestoneF, validatorF, staleF]);

  // Tab narrows further
  const tabFiltered = useMemo(
    () => tab === "all" ? baseFiltered : baseFiltered.filter(r => r.status === tab),
    [baseFiltered, tab]
  );

  const counts = useMemo(() => ({
    pending:   rows.filter(r => r.status === "pending").length,
    confirmed: rows.filter(r => r.status === "confirmed").length,
    rejected:  rows.filter(r => r.status === "rejected").length,
    all:       rows.length,
  }), [rows]);

  const hasFilters = query || milestoneF !== "all" || validatorF !== "all" || staleF !== "all";

  // Selection helpers — only pending rows are selectable
  const visiblePendingIds = tabFiltered.filter(r => r.status === "pending").map(r => r.id);
  const allVisibleSelected = visiblePendingIds.length > 0 && visiblePendingIds.every(id => selectedIds.has(id));
  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allVisibleSelected) visiblePendingIds.forEach(id => next.delete(id));
      else visiblePendingIds.forEach(id => next.add(id));
      return next;
    });
  };
  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // State mutations + audit trail
  const recordEvent = (id: string, evt: AuditEvent, statusPatch?: ValidationStatus) => {
    setRows(list => list.map(r => r.id === id
      ? { ...r, audit: [evt, ...r.audit], status: statusPatch ?? r.status, ...(evt.kind === "reminder" ? { remindersSent: r.remindersSent + 1 } : {}) }
      : r
    ));
  };

  const handleConfirm = (r: ValidationRow) => {
    recordEvent(r.id, { kind: "confirmed", by: r.validator, at: nowStamp(), note: "Confirmed via dashboard" }, "confirmed");
    toast.success(`${r.name}'s ${r.milestone.toLowerCase()} confirmed`);
  };
  const handleReject = (r: ValidationRow) => {
    recordEvent(r.id, { kind: "rejected", by: r.validator, at: nowStamp(), note: "Rejected via dashboard" }, "rejected");
    toast.success(`${r.name}'s ${r.milestone.toLowerCase()} marked rejected`);
  };

  // Open the reminder modal — global header click sends to all pending in the
  // current filter; per-row click sends to that one row.
  const openHeaderReminder = () => {
    const targets = baseFiltered.filter(r => r.status === "pending");
    if (selectedIds.size > 0) {
      const set = new Set(selectedIds);
      setReminderTarget(targets.filter(r => set.has(r.id)));
    } else if (targets.length > 0) {
      setReminderTarget(targets);
    } else {
      toast.error("No pending validations to remind");
    }
  };

  const handleRemindersSent = (targets: ValidationRow[], message: string) => {
    targets.forEach(r => {
      recordEvent(r.id, { kind: "reminder", by: "System", at: nowStamp(), channel: r.validatorChannel, note: message || "Gentle reminder" });
    });
    toast.success(`Reminders sent to ${targets.length} validator${targets.length === 1 ? "" : "s"}`);
    setReminderTarget(null);
    setSelectedIds(new Set());
  };

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Decision Validation"
        subtitle="Two-step confirmation: self-reported decisions validated by mentors or community leaders"
        actions={(
          <Button
            onClick={openHeaderReminder}
            className="bg-amber-500 text-white hover:bg-amber-600"
          >
            <Bell className="w-4 h-4" />
            Send Reminders {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
          </Button>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-4">
          <div className="text-xs font-medium text-amber-700 uppercase tracking-wider">Pending Validation</div>
          <div className="text-3xl font-bold text-amber-900 mt-1">{counts.pending}</div>
          <div className="text-xs text-amber-700">awaiting confirmation</div>
        </div>
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-4">
          <div className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Confirmed</div>
          <div className="text-3xl font-bold text-emerald-900 mt-1">{counts.confirmed}</div>
          <div className="text-xs text-emerald-700">total confirmed</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg. Validation Time</div>
          <div className="text-3xl font-bold text-foreground mt-1">4.2 days</div>
          <div className="text-xs text-emerald-600">-1.3 days improvement</div>
        </div>
      </div>

      {/* Filter toolbar — above the queue */}
      <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search person, email, or validator..."
            className="pl-9 h-9"
          />
        </div>
        <FilterDropdown
          label="Milestone"
          value={milestoneF}
          onChange={setMilestoneF}
          options={[{ value: "all", label: "All milestones" }, ...VALIDATION_MILESTONES.map(m => ({ value: m, label: m }))]}
        />
        <FilterDropdown
          label="Validator"
          value={validatorF}
          onChange={setValidatorF}
          options={[{ value: "all", label: "All validators" }, ...allValidators.map(v => ({ value: v, label: v }))]}
        />
        <FilterDropdown
          label="Reminders"
          value={staleF}
          onChange={setStaleF}
          options={[
            { value: "all",         label: "Any reminder state" },
            { value: "no_reminder", label: "Never reminded (pending)" },
            { value: "stale_3",     label: "Reminded 1+ time" },
          ]}
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setMilestoneF("all"); setValidatorF("all"); setStaleF("all"); }}>Clear</Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{tabFiltered.length} of {baseFiltered.length}</span>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Tab strip + selection summary */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-foreground">Validation Queue</span>
            {selectedIds.size > 0 && <Chip tone="blue">{selectedIds.size} selected</Chip>}
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold">
            {VALIDATION_TABS.map(k => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={cn(
                  "px-3 py-1 rounded transition-colors capitalize",
                  tab === k ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {k} {k !== "all" && counts[k] > 0 && <span className="text-muted-foreground/70">{counts[k]}</span>}
              </button>
            ))}
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 text-left font-semibold w-10">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAll}
                  disabled={visiblePendingIds.length === 0}
                  className="accent-primary"
                  aria-label="Select all visible pending"
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold">Person</th>
              <th className="px-4 py-3 text-left font-semibold">Milestone</th>
              <th className="px-4 py-3 text-left font-semibold">Self-Reported</th>
              <th className="px-4 py-3 text-left font-semibold">Validator</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tabFiltered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No validations match your filters.
                </td>
              </tr>
            ) : tabFiltered.map(r => {
              const lastReminderEvt = r.audit.find(e => e.kind === "reminder");
              const validatorStatus = r.status === "confirmed"
                ? `Confirmed ${r.audit.find(e => e.kind === "confirmed")?.at.split(" · ")[0] ?? ""}`
                : r.status === "rejected"
                  ? `Rejected ${r.audit.find(e => e.kind === "rejected")?.at.split(" · ")[0] ?? ""}`
                  : r.remindersSent > 0
                    ? `Reminded ${lastReminderEvt?.at.split(" · ")[0] ?? "recently"} (${r.remindersSent}x)`
                    : r.audit.some(e => e.kind === "notified")
                      ? `Notified ${r.audit.find(e => e.kind === "notified")?.at.split(" · ")[0] ?? ""}`
                      : "Not yet notified";
              return (
                <tr key={r.id} className={cn("border-b border-border last:border-0 transition-colors", r.status === "pending" ? "bg-amber-50/30 hover:bg-amber-50/60" : "hover:bg-muted/30")}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(r.id)}
                      disabled={r.status !== "pending"}
                      onChange={() => toggleOne(r.id)}
                      className="accent-primary"
                      aria-label={`Select ${r.name}`}
                    />
                  </td>
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
                    <div className={cn(
                      "text-xs",
                      r.status === "confirmed" ? "text-emerald-600"
                      : r.status === "rejected" ? "text-rose-600"
                      : r.remindersSent > 0    ? "text-amber-700"
                                                : "text-muted-foreground"
                    )}>{validatorStatus}</div>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "confirmed" && <Chip tone="green"><CheckCircle2 className="w-3 h-3" />Confirmed</Chip>}
                    {r.status === "rejected"  && <Chip tone="red"><XCircle className="w-3 h-3" />Rejected</Chip>}
                    {r.status === "pending"   && <Chip tone="amber">Pending</Chip>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === "pending" ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setReminderTarget([r])}>
                          <Bell className="w-3.5 h-3.5" /> Remind
                        </Button>
                        <Button size="sm" className="bg-emerald-500 text-white hover:bg-emerald-600" onClick={() => handleConfirm(r)}>Confirm</Button>
                        <Button size="sm" variant="outline" className="text-rose-600 hover:text-rose-700" onClick={() => handleReject(r)}>Reject</Button>
                        <Button size="sm" variant="ghost" onClick={() => setAuditFor(r)} title="View audit trail">
                          <FileText className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setAuditFor(r)}>
                        <FileText className="w-3.5 h-3.5" /> View audit trail
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {reminderTarget && (
        <SendRemindersModal
          targets={reminderTarget}
          onCancel={() => setReminderTarget(null)}
          onSend={(msg) => handleRemindersSent(reminderTarget, msg)}
        />
      )}
      {auditFor && (
        <AuditTrailModal row={auditFor} onClose={() => setAuditFor(null)} />
      )}
    </div>
  );
}

// Compact "now" stamp helper for audit events created in the dashboard.
function nowStamp() {
  const d = new Date();
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} · ${time}`;
}

// ---------------------------------------------------------------------------
// Send Reminders modal — one or many validators at once
// ---------------------------------------------------------------------------

function SendRemindersModal({
  targets, onCancel, onSend,
}: { targets: ValidationRow[]; onCancel: () => void; onSend: (message: string) => void }) {
  const [message, setMessage] = useState(
    `Hi! Just a gentle nudge — a decision is awaiting your confirmation in the Turumba dashboard. Whenever you have a moment, your input means a lot.`
  );
  // Channel breakdown
  const byChannel = useMemo(() => {
    const map: Record<ValidatorChannel, number> = { telegram: 0, whatsapp: 0, sms: 0, email: 0 };
    targets.forEach(t => { map[t.validatorChannel] = (map[t.validatorChannel] || 0) + 1; });
    return map;
  }, [targets]);

  const isOpen = targets.length > 0;
  const isBatch = targets.length > 1;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={isBatch ? `Send reminders to ${targets.length} validators` : `Send reminder to ${targets[0]?.validator}`} size="lg">
      <div className="space-y-4">
        <div className="rounded-md bg-amber-50/60 border border-amber-200 p-3 flex items-start gap-3">
          <Bell className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {isBatch ? `Reminding ${targets.length} validators` : "Reminding 1 validator"}
            </p>
            <p className="text-xs text-amber-800 mt-0.5">
              Reminders are delivered on each validator's preferred channel and logged to the audit trail.
            </p>
          </div>
        </div>

        {isBatch && (
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold">Channel breakdown</Label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {Object.entries(byChannel).filter(([, n]) => n > 0).map(([k, n]) => (
                <Chip key={k} tone="slate">
                  {k === "telegram" ? <Send className="w-3 h-3" />
                  : k === "whatsapp" ? <MessageCircle className="w-3 h-3" />
                  : k === "sms" ? <FileText className="w-3 h-3" />
                  : <FileText className="w-3 h-3" />}
                  {k} · {n}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold">Recipients</Label>
          <div className="rounded-md border border-border max-h-[160px] overflow-y-auto divide-y divide-border">
            {targets.map(t => (
              <div key={t.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div>
                  <span className="font-semibold text-foreground">{t.validator}</span>
                  <span className="text-muted-foreground"> · for {t.name}</span>
                </div>
                <Chip tone="slate" className="capitalize">{t.validatorChannel}</Chip>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs font-semibold">Message</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px] text-sm"
          />
          <p className="text-xs text-muted-foreground">{message.length} characters · sent on each validator's preferred channel</p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" className="bg-amber-500 text-white hover:bg-amber-600" onClick={() => onSend(message)} disabled={message.trim().length === 0}>
            <Bell className="w-3.5 h-3.5" /> Send {isBatch ? `${targets.length} reminders` : "reminder"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Audit Trail modal — vertical timeline of every event
// ---------------------------------------------------------------------------

function AuditTrailModal({ row, onClose }: { row: ValidationRow; onClose: () => void }) {
  const eventMeta = (k: AuditEventKind) => {
    switch (k) {
      case "self_reported": return { label: "Self-reported",        Icon: MessageSquareIcon, dot: "bg-blue-500" };
      case "notified":      return { label: "Validator notified",   Icon: Bell,              dot: "bg-violet-500" };
      case "reminder":      return { label: "Reminder sent",        Icon: Clock,             dot: "bg-amber-500" };
      case "comment":       return { label: "Comment",              Icon: FileText,          dot: "bg-slate-400" };
      case "confirmed":     return { label: "Confirmed",            Icon: CheckCircle2,      dot: "bg-emerald-500" };
      case "rejected":      return { label: "Rejected",             Icon: XCircle,           dot: "bg-rose-500" };
    }
  };

  const handleExport = () => {
    const header = ["Event", "Actor", "Timestamp", "Channel", "Note"];
    const body = row.audit.map(e => [eventMeta(e.kind).label, e.by, e.at, e.channel ?? "", e.note ?? ""]);
    downloadCsv(`audit-${row.name.replace(/\s+/g, "_").toLowerCase()}.csv`, [header, ...body]);
    toast.success("Audit trail downloaded");
  };

  return (
    <Modal isOpen={!!row} onClose={onClose} title="Audit Trail" size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Avatar name={row.name} tone={row.avatarTone} />
            <div>
              <p className="text-sm font-bold text-foreground">{row.name}</p>
              <p className="text-xs text-muted-foreground">{row.milestone} · self-reported {row.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {row.status === "confirmed" && <Chip tone="green"><CheckCircle2 className="w-3 h-3" />Confirmed</Chip>}
            {row.status === "rejected"  && <Chip tone="red"><XCircle className="w-3 h-3" />Rejected</Chip>}
            {row.status === "pending"   && <Chip tone="amber">Pending</Chip>}
          </div>
        </div>

        <ol className="relative space-y-3">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" aria-hidden />
          {row.audit.map((e, i) => {
            const meta = eventMeta(e.kind);
            const Icon = meta.Icon;
            return (
              <li key={i} className="relative flex items-start gap-3 pl-0">
                <span className={cn("w-6 h-6 rounded-full ring-4 ring-background relative z-10 flex items-center justify-center text-white shrink-0", meta.dot)}>
                  <Icon className="w-3 h-3" />
                </span>
                <div className="flex-1 min-w-0 bg-card border border-border rounded-md p-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{meta.label}</span>
                    <span className="text-xs text-muted-foreground">{e.at}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    by <span className="font-medium text-foreground">{e.by}</span>
                    {e.channel && <> · <span className="capitalize">{e.channel}</span></>}
                  </p>
                  {e.note && <p className="text-sm text-foreground mt-1.5 leading-relaxed">{e.note}</p>}
                </div>
              </li>
            );
          })}
        </ol>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">{row.audit.length} event{row.audit.length === 1 ? "" : "s"} · {row.remindersSent} reminder{row.remindersSent === 1 ? "" : "s"} sent</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
            <Button size="sm" onClick={onClose}>Done</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
