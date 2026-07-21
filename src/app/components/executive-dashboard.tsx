import React, { useState, useMemo } from "react";
import {
  MessageSquare, Users, Clock, TrendingUp, TrendingDown,
  Heart, Zap, FileText, Shield, ClipboardList, Settings,
  ArrowUpRight, ArrowDownRight, Globe, Star, AlertTriangle,
  Activity, Award, Bell, CheckCircle2, Rocket,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  cn, type Contact, type Message, type User, formatTimeAgo,
} from "./types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { DateRangeFilter } from "./date-range-filter";
import type { DateRange } from "react-day-picker";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExecutiveDashboardProps {
  contacts: Contact[];
  messages: Message[];
  users: User[];
  currentUser: User;
  onNavigate: (view: string) => void;
}

type TeamStatus = "Active" | "Understaffed" | "Critical";

interface LanguageTeam {
  name: string;
  coordinator: string;
  volunteers: number;
  activeConvos: number;
  avgResponseTime: string;
  resolutionRate: number;
  decisions: number;
  status: TeamStatus;
}

interface TrendMetric {
  label: string;
  value: string;
  change: number; // positive = up, negative = down
  magnitude: number; // 0-100 for bar width
}

type ActivitySeverity = "milestone" | "success" | "critical" | "warning" | "info" | "celebration";

interface ActivityItem {
  id: string;
  message: string;
  timeAgo: string;
  severity: ActivitySeverity;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
    h = (h ^ (h >>> 16)) >>> 0;
    return h / 4294967296;
  };
}

const TEAM_STATUS_STYLES: Record<TeamStatus, { dot: string; bg: string; text: string }> = {
  Active: { dot: "bg-emerald-500", bg: "", text: "text-emerald-600" },
  Understaffed: { dot: "bg-amber-500", bg: "bg-amber-500/5", text: "text-amber-600" },
  Critical: { dot: "bg-rose-500", bg: "bg-rose-500/5", text: "text-rose-600" },
};

const SEVERITY_STYLES: Record<ActivitySeverity, { dot: string; icon: React.ElementType; color: string }> = {
  milestone: { dot: "bg-blue-500", icon: Star, color: "text-blue-500" },
  success: { dot: "bg-emerald-500", icon: CheckCircle2, color: "text-emerald-500" },
  critical: { dot: "bg-rose-500", icon: AlertTriangle, color: "text-rose-500" },
  warning: { dot: "bg-amber-500", icon: AlertTriangle, color: "text-amber-500" },
  info: { dot: "bg-slate-400", icon: Bell, color: "text-slate-400" },
  celebration: { dot: "bg-violet-500", icon: Award, color: "text-violet-500" },
};

// ---------------------------------------------------------------------------
// Static Data
// ---------------------------------------------------------------------------

const LANGUAGE_TEAMS: LanguageTeam[] = [
  { name: "Amharic", coordinator: "Miriam Tadesse", volunteers: 12, activeConvos: 87, avgResponseTime: "1m 32s", resolutionRate: 92, decisions: 34, status: "Active" },
  { name: "English", coordinator: "Daniel Abera", volunteers: 9, activeConvos: 64, avgResponseTime: "2m 05s", resolutionRate: 88, decisions: 28, status: "Active" },
  { name: "Afaan Oromoo", coordinator: "Chaltu Bekele", volunteers: 7, activeConvos: 45, avgResponseTime: "3m 18s", resolutionRate: 85, decisions: 19, status: "Active" },
  { name: "Tigrinya", coordinator: "Yohannes Gebre", volunteers: 4, activeConvos: 31, avgResponseTime: "4m 47s", resolutionRate: 79, decisions: 11, status: "Understaffed" },
  { name: "Somali", coordinator: "Fatima Ahmed", volunteers: 0, activeConvos: 18, avgResponseTime: "8m 22s", resolutionRate: 62, decisions: 5, status: "Critical" },
  { name: "Arabic", coordinator: "Amina Hassan", volunteers: 3, activeConvos: 12, avgResponseTime: "5m 10s", resolutionRate: 74, decisions: 4, status: "Understaffed" },
];

const TREND_METRICS: TrendMetric[] = [
  { label: "Weekly Conversations", value: "312", change: 12, magnitude: 78 },
  { label: "New Seekers", value: "89", change: 8, magnitude: 55 },
  { label: "Volunteer Retention", value: "91%", change: -3, magnitude: 91 },
  { label: "Decision Rate", value: "8.1%", change: 15, magnitude: 42 },
];

const ACTIVITY_FEED: ActivityItem[] = [
  { id: "act-1", message: "Amharic team reached 100 conversations this week", timeAgo: "12m ago", severity: "milestone" },
  { id: "act-2", message: "3 new volunteers certified in English team", timeAgo: "34m ago", severity: "success" },
  { id: "act-3", message: "Somali team has 0 active volunteers", timeAgo: "1h ago", severity: "critical" },
  { id: "act-4", message: "Trigger word 'suicide' detected 5 times today", timeAgo: "1h ago", severity: "warning" },
  { id: "act-5", message: "Tigrinya team coordinator requested more volunteers", timeAgo: "2h ago", severity: "info" },
  { id: "act-6", message: "Monthly report ready for download", timeAgo: "3h ago", severity: "info" },
  { id: "act-7", message: "Decision milestone: 500th seeker decision recorded", timeAgo: "5h ago", severity: "celebration" },
  { id: "act-8", message: "Arabic team launched — first conversation received", timeAgo: "8h ago", severity: "success" },
  { id: "act-9", message: "Volunteer surge: 5 applications received in Amharic", timeAgo: "12h ago", severity: "success" },
  { id: "act-10", message: "System update completed — no downtime", timeAgo: "1d ago", severity: "info" },
];

const QUICK_LINKS = [
  { label: "Download Monthly Report", description: "Export all team metrics as PDF", icon: FileText, color: "bg-blue-500/10 text-blue-600" },
  { label: "Manage Policies", description: "Content and safety policies", icon: Shield, color: "bg-violet-500/10 text-violet-600" },
  { label: "Audit Log", description: "System-wide activity log", icon: ClipboardList, color: "bg-amber-500/10 text-amber-600" },
  { label: "Global Settings", description: "Platform configuration", icon: Settings, color: "bg-slate-500/10 text-slate-600" },
  { label: "View All Teams", description: "Manage all language teams", icon: Users, color: "bg-emerald-500/10 text-emerald-600" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ExecutiveDashboard = ({
  contacts,
  messages,
  users,
  currentUser,
  onNavigate,
}: ExecutiveDashboardProps) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Derive KPI values from real data with seeded fallbacks
  const kpis = useMemo(() => {
    const rand = seededRandom("exec-kpis-" + currentUser.id);

    const totalConversations = contacts.length > 0 ? contacts.length : Math.floor(rand() * 400) + 900;
    const activeSeekers = Math.floor(totalConversations * (0.3 + rand() * 0.15));
    const decisionsThisMonth = LANGUAGE_TEAMS.reduce((sum, t) => sum + t.decisions, 0);
    const volunteerCapacity = Math.floor(rand() * 15) + 70;
    const avgFirstResponseMin = Math.floor(rand() * 2) + 1;
    const avgFirstResponseSec = Math.floor(rand() * 50) + 10;
    const seekerSatisfaction = Math.floor(rand() * 8) + 90;

    return {
      totalConversations,
      activeSeekers,
      decisionsThisMonth,
      volunteerCapacity,
      avgFirstResponse: `${avgFirstResponseMin}m ${avgFirstResponseSec}s`,
      seekerSatisfaction,
    };
  }, [contacts.length, currentUser.id]);

  // Sort language teams by active conversations descending
  const sortedTeams = useMemo(
    () => [...LANGUAGE_TEAMS].sort((a, b) => b.activeConvos - a.activeConvos),
    []
  );

  const totalTeams = LANGUAGE_TEAMS.length;
  const totalConvos = kpis.totalConversations;
  const totalDecisions = kpis.decisionsThisMonth;

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6 p-6 lg:p-8 animate-in fade-in duration-500 bg-gradient-to-br from-slate-50 via-background to-blue-50/30 min-h-full">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-sm bg-slate-950 text-white p-8 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.55)]">
        <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-blue-500/40 to-violet-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-gradient-to-tr from-emerald-500/20 to-blue-500/10 blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-300 uppercase tracking-[0.18em]">
                IE Executive &middot; Strategic Overview
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05]">
              {greeting},{" "}
              <span className="text-blue-300">
                {currentUser.name.split(" ")[0]}
              </span>
              .
            </h1>
            <p className="text-base text-slate-300 mt-3 max-w-2xl leading-relaxed">
              <span className="font-semibold text-white">
                {totalTeams} language teams
              </span>
              <span className="mx-2 text-slate-500">&middot;</span>
              <span className="font-semibold text-emerald-300">
                {totalConvos.toLocaleString()} total conversations
              </span>
              <span className="mx-2 text-slate-500">&middot;</span>
              <span className="font-semibold text-violet-300">
                {totalDecisions} decisions this month
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
              onClick={() => {
                toast.info("Generating monthly report...");
              }}
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Monthly Report
            </Button>
          </div>
        </div>
      </header>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          {
            label: "Total Conversations",
            value: kpis.totalConversations.toLocaleString(),
            icon: MessageSquare,
            color: "text-blue-600",
            bg: "bg-blue-500/10",
          },
          {
            label: "Active Seekers",
            value: kpis.activeSeekers.toLocaleString(),
            icon: Users,
            color: "text-emerald-600",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Decisions This Month",
            value: kpis.decisionsThisMonth.toLocaleString(),
            icon: Heart,
            color: "text-violet-600",
            bg: "bg-violet-500/10",
          },
          {
            label: "Volunteer Capacity",
            value: `${kpis.volunteerCapacity}%`,
            icon: Zap,
            color: "text-amber-600",
            bg: "bg-amber-500/10",
          },
          {
            label: "Avg First Response",
            value: kpis.avgFirstResponse,
            icon: Clock,
            color: "text-cyan-600",
            bg: "bg-cyan-500/10",
          },
          {
            label: "Seeker Satisfaction",
            value: `${kpis.seekerSatisfaction}%`,
            icon: Activity,
            color: "text-rose-600",
            bg: "bg-rose-500/10",
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06, ease: "easeOut" }}
            className="bg-card p-5 rounded-lg border border-border shadow-sm group hover:border-primary/30 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={cn(
                  "p-2 rounded-md border border-border group-hover:border-primary/20 transition-all",
                  kpi.bg
                )}
              >
                <kpi.icon
                  className={cn("w-4 h-4 transition-all", kpi.color)}
                />
              </div>
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              {kpi.label}
            </p>
            <p className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
              {kpi.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Language Team Comparison — full width */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4, ease: "easeOut" }}
        className="bg-card rounded-lg border border-border shadow-sm overflow-hidden"
      >
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Language Team Comparison</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalTeams} teams &middot; Cross-language performance overview
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
              <Globe className="w-2.5 h-2.5 mr-1" />
              All Teams
            </Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Team</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Coordinator</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Volunteers</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Convos</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Response</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resolution</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Decisions</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedTeams.map((team, i) => {
                const statusStyle = TEAM_STATUS_STYLES[team.status];
                return (
                  <motion.tr
                    key={team.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.5 + i * 0.05, ease: "easeOut" }}
                    className={cn(
                      "hover:bg-muted/30 transition-colors",
                      statusStyle.bg
                    )}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{team.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{team.coordinator}</td>
                    <td className="px-4 py-3.5 text-center font-medium text-foreground">{team.volunteers}</td>
                    <td className="px-4 py-3.5 text-center font-bold text-foreground">{team.activeConvos}</td>
                    <td className="px-4 py-3.5 text-center text-muted-foreground">{team.avgResponseTime}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={cn(
                        "font-medium",
                        team.resolutionRate >= 85 ? "text-emerald-600" :
                        team.resolutionRate >= 70 ? "text-amber-600" : "text-rose-600"
                      )}>
                        {team.resolutionRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-medium text-violet-600">{team.decisions}</td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={cn("w-2 h-2 rounded-full", statusStyle.dot)} />
                        <span className={cn("text-xs font-medium", statusStyle.text)}>
                          {team.status}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Bottom Two-Panel Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel — Global Trends */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.8, ease: "easeOut" }}
          className="bg-card rounded-lg border border-border shadow-sm overflow-hidden"
        >
          <div className="px-6 pt-5 pb-4 border-b border-border">
            <h2 className="text-sm font-bold text-foreground">Global Trends</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Key performance indicators over time
            </p>
          </div>

          <div className="p-4 space-y-3">
            {TREND_METRICS.map((metric, i) => {
              const isPositive = metric.change >= 0;
              // For "Volunteer Retention" a decrease is negative
              const isGood = metric.label === "Volunteer Retention" ? isPositive : isPositive;
              const trendColor = isGood ? "text-emerald-600" : "text-rose-600";
              const barColor = isGood ? "bg-emerald-500" : "bg-rose-500";
              const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

              return (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.9 + i * 0.06, ease: "easeOut" }}
                  className="p-4 rounded-md border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {metric.label}
                    </span>
                    <div className={cn("flex items-center gap-1 text-xs font-bold", trendColor)}>
                      <TrendIcon className="w-3.5 h-3.5" />
                      {Math.abs(metric.change)}%
                    </div>
                  </div>
                  <p className="text-xl font-bold text-foreground mb-2">{metric.value}</p>
                  {/* Sparkline bar */}
                  <div className="w-full h-1.5 rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full transition-all", barColor)}
                      style={{ width: `${metric.magnitude}%` }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Right Panel — Recent Activity & Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.85, ease: "easeOut" }}
          className="bg-card rounded-lg border border-border shadow-sm overflow-hidden"
        >
          <div className="px-6 pt-5 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">Recent Activity & Alerts</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  System-wide events and notifications
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-rose-500/10 text-rose-600 border-rose-500/20">
                {ACTIVITY_FEED.filter(a => a.severity === "critical" || a.severity === "warning").length} alerts
              </Badge>
            </div>
          </div>

          <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
            {ACTIVITY_FEED.map((item, i) => {
              const style = SEVERITY_STYLES[item.severity];
              const IconComponent = style.icon;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.9 + i * 0.04, ease: "easeOut" }}
                  className="px-5 py-3.5 hover:bg-muted/30 transition-colors flex items-start gap-3"
                >
                  <div className={cn("mt-0.5 p-1.5 rounded-md shrink-0", style.color)}>
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">
                      {item.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", style.dot)} />
                      <span className="text-xs text-muted-foreground">{item.timeAgo}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="px-5 py-3.5 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs gap-2 justify-center"
              onClick={() => {
                toast.info("Opening full activity log...");
                onNavigate("audit-log");
              }}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              View All Activity
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Bottom Section — Policy & Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 1.1, ease: "easeOut" }}
      >
        <h2 className="text-sm font-bold text-foreground mb-3">Policy & Quick Links</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {QUICK_LINKS.map((link, i) => {
            const LinkIcon = link.icon;
            return (
              <motion.button
                key={link.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 1.15 + i * 0.05, ease: "easeOut" }}
                onClick={() => {
                  toast.success(link.label, { description: link.description });
                }}
                className="bg-card rounded-lg border border-border shadow-sm p-5 text-left hover:border-primary/30 hover:shadow-md transition-all group cursor-pointer"
              >
                <div className={cn("p-2.5 rounded-md w-fit mb-3 border border-border group-hover:border-primary/20 transition-all", link.color)}>
                  <LinkIcon className="w-4.5 h-4.5" />
                </div>
                <p className="text-sm font-semibold text-foreground leading-tight">{link.label}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">{link.description}</p>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
