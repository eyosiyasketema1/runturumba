import React, { useState, useMemo } from "react";
import {
  MessageSquare, Users, Clock, TrendingUp, TrendingDown,
  Heart, Zap, FileText, Shield, ClipboardList, Settings,
  ArrowUpRight, ArrowDownRight, Globe, Star, AlertTriangle,
  Activity, Award, Bell, CheckCircle2, Rocket,
  LayoutDashboard, BarChart3, Megaphone, Download, Filter,
  Table2, Calculator, Plus, ChevronRight, ChevronDown,
  Trash2, Eye, Play, Edit3, Hash, Calendar, ArrowRight,
  Database, Archive, Lock, AlertCircle, Info, ExternalLink,
  Headphones, X, Search, FolderOpen, PieChart, Target,
  DollarSign, MousePointerClick, Route, ToggleLeft, HardDrive,
  ShieldCheck, History, Columns3,
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
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Checkbox } from "./ui/checkbox";
import { Progress } from "./ui/progress";
import { TabBar, LAYOUT, SPACING, MOTION, MUTED_SCALE } from "./design-system";

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

type ExecutiveTab = "overview" | "reports" | "campaigns" | "settings";

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
// Report Builder Data
// ---------------------------------------------------------------------------

const SAVED_REPORTS = [
  {
    id: "rpt-1",
    name: "Monthly Enrollment Summary",
    description: "Enrollment metrics by language team",
    lastRun: "2 days ago",
    type: "enrollment" as const,
    icon: Users,
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    id: "rpt-2",
    name: "Volunteer Performance Report",
    description: "Response times, resolution rates, satisfaction",
    lastRun: "1 week ago",
    type: "performance" as const,
    icon: BarChart3,
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    id: "rpt-3",
    name: "Decision Funnel Analysis",
    description: "Seeker journey from first contact to decision",
    lastRun: "3 days ago",
    type: "funnel" as const,
    icon: PieChart,
    color: "bg-violet-500/10 text-violet-600",
  },
];

const REPORT_FIELD_GROUPS = [
  {
    category: "Seeker",
    fields: [
      { id: "seeker_name", label: "Name" },
      { id: "seeker_language", label: "Language" },
      { id: "seeker_channelSource", label: "Channel Source" },
      { id: "seeker_firstContactDate", label: "First Contact Date" },
      { id: "seeker_status", label: "Status" },
      { id: "seeker_decisionsCount", label: "Decisions Count" },
    ],
  },
  {
    category: "Volunteer",
    fields: [
      { id: "volunteer_name", label: "Name" },
      { id: "volunteer_team", label: "Team" },
      { id: "volunteer_responseTime", label: "Response Time" },
      { id: "volunteer_resolutionRate", label: "Resolution Rate" },
      { id: "volunteer_activeCases", label: "Active Cases" },
      { id: "volunteer_certificationStatus", label: "Certification Status" },
    ],
  },
  {
    category: "Conversation",
    fields: [
      { id: "conversation_id", label: "ID" },
      { id: "conversation_startDate", label: "Start Date" },
      { id: "conversation_duration", label: "Duration" },
      { id: "conversation_messageCount", label: "Message Count" },
      { id: "conversation_channel", label: "Channel" },
      { id: "conversation_outcome", label: "Outcome" },
    ],
  },
  {
    category: "Campaign",
    fields: [
      { id: "campaign_name", label: "Name" },
      { id: "campaign_channel", label: "Channel" },
      { id: "campaign_impressions", label: "Impressions" },
      { id: "campaign_clicks", label: "Clicks" },
      { id: "campaign_conversions", label: "Conversions" },
      { id: "campaign_cost", label: "Cost" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Campaign Data
// ---------------------------------------------------------------------------

const CAMPAIGN_CHANNELS = [
  { name: "Facebook Ads", signups: 234, conversions: 45, cost: 1200, roi: 312, color: "bg-blue-500" },
  { name: "Instagram", signups: 189, conversions: 38, cost: 800, roi: 287, color: "bg-pink-500" },
  { name: "Google Search", signups: 156, conversions: 52, cost: 1500, roi: 245, color: "bg-emerald-500" },
  { name: "WhatsApp Referral", signups: 312, conversions: 89, cost: 200, roi: 890, color: "bg-green-500" },
  { name: "Church Partners", signups: 178, conversions: 67, cost: 0, roi: 0, color: "bg-violet-500" },
  { name: "Direct / Organic", signups: 145, conversions: 41, cost: 0, roi: 0, color: "bg-slate-500" },
];

const FUNNEL_STAGES = [
  { stage: "Impressions", value: 45200, pct: 100 },
  { stage: "Clicks", value: 8340, pct: 18.4 },
  { stage: "Sign-ups", value: 1214, pct: 2.7 },
  { stage: "First Conversation", value: 890, pct: 1.97 },
  { stage: "Active Engagement", value: 534, pct: 1.18 },
  { stage: "Decision", value: 332, pct: 0.73 },
];

const CONVERSION_PATHS = [
  { path: "Social → Chat → Decision", pct: 42, avgDays: 14 },
  { path: "Referral → Chat → Decision", pct: 31, avgDays: 8 },
  { path: "Search → Chat → Decision", pct: 27, avgDays: 21 },
];

// ---------------------------------------------------------------------------
// Mock data generator for report preview
// ---------------------------------------------------------------------------

function generateMockRows(fields: string[]): Record<string, string>[] {
  const rand = seededRandom("report-preview");
  const seekerNames = ["Abebe K.", "Fatima A.", "Daniel M.", "Hana T.", "Yonas G.", "Sara B.", "Meron D.", "Eyob W.", "Liya H.", "Dawit S."];
  const volunteerNames = ["Miriam T.", "Chaltu B.", "Yohannes G.", "Amina H.", "Daniel A.", "Fatima A.", "Samuel K.", "Grace M.", "Ruth N.", "Peter O."];
  const languages = ["Amharic", "English", "Afaan Oromoo", "Tigrinya", "Somali", "Arabic"];
  const channels = ["WhatsApp", "Telegram", "Facebook", "Instagram", "SMS", "Web Chat"];
  const statuses = ["Active", "Inactive", "Pending", "Completed", "Escalated"];
  const outcomes = ["Resolved", "Pending", "Escalated", "Decision Made", "Follow-up"];
  const certStatuses = ["Certified", "In Training", "Probation", "Senior"];
  const campaignNames = ["Easter Outreach", "Summer Connect", "Youth Campaign", "Language Launch", "Referral Drive"];

  const rows: Record<string, string>[] = [];
  for (let i = 0; i < 8; i++) {
    const row: Record<string, string> = {};
    for (const field of fields) {
      switch (field) {
        case "seeker_name": row[field] = seekerNames[i % seekerNames.length]; break;
        case "seeker_language": row[field] = languages[Math.floor(rand() * languages.length)]; break;
        case "seeker_channelSource": row[field] = channels[Math.floor(rand() * channels.length)]; break;
        case "seeker_firstContactDate": row[field] = `2026-0${Math.floor(rand() * 7) + 1}-${Math.floor(rand() * 28) + 1}`; break;
        case "seeker_status": row[field] = statuses[Math.floor(rand() * statuses.length)]; break;
        case "seeker_decisionsCount": row[field] = String(Math.floor(rand() * 5)); break;
        case "volunteer_name": row[field] = volunteerNames[i % volunteerNames.length]; break;
        case "volunteer_team": row[field] = languages[Math.floor(rand() * languages.length)]; break;
        case "volunteer_responseTime": row[field] = `${Math.floor(rand() * 5) + 1}m ${Math.floor(rand() * 50) + 10}s`; break;
        case "volunteer_resolutionRate": row[field] = `${Math.floor(rand() * 25) + 70}%`; break;
        case "volunteer_activeCases": row[field] = String(Math.floor(rand() * 15) + 1); break;
        case "volunteer_certificationStatus": row[field] = certStatuses[Math.floor(rand() * certStatuses.length)]; break;
        case "conversation_id": row[field] = `CONV-${1000 + i}`; break;
        case "conversation_startDate": row[field] = `2026-07-${Math.floor(rand() * 28) + 1}`; break;
        case "conversation_duration": row[field] = `${Math.floor(rand() * 45) + 5}min`; break;
        case "conversation_messageCount": row[field] = String(Math.floor(rand() * 50) + 5); break;
        case "conversation_channel": row[field] = channels[Math.floor(rand() * channels.length)]; break;
        case "conversation_outcome": row[field] = outcomes[Math.floor(rand() * outcomes.length)]; break;
        case "campaign_name": row[field] = campaignNames[Math.floor(rand() * campaignNames.length)]; break;
        case "campaign_channel": row[field] = channels[Math.floor(rand() * channels.length)]; break;
        case "campaign_impressions": row[field] = String(Math.floor(rand() * 10000) + 1000); break;
        case "campaign_clicks": row[field] = String(Math.floor(rand() * 2000) + 100); break;
        case "campaign_conversions": row[field] = String(Math.floor(rand() * 200) + 10); break;
        case "campaign_cost": row[field] = `$${Math.floor(rand() * 1500) + 100}`; break;
        default: row[field] = "-"; break;
      }
    }
    rows.push(row);
  }
  return rows;
}

function getFieldLabel(fieldId: string): string {
  for (const group of REPORT_FIELD_GROUPS) {
    const found = group.fields.find((f) => f.id === fieldId);
    if (found) return found.label;
  }
  return fieldId;
}

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
  const [activeTab, setActiveTab] = useState<ExecutiveTab>("overview");

  // --- Reports state ---
  const [reportView, setReportView] = useState<"list" | "builder">("list");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [reportFilters, setReportFilters] = useState<{ field: string; operator: string; value: string }[]>([]);
  const [reportDateRange, setReportDateRange] = useState<string>("last_30_days");
  const [reportName, setReportName] = useState("");
  const [reportAggregation, setReportAggregation] = useState<string>("none");
  const [reportGroupBy, setReportGroupBy] = useState<string>("");

  // --- Campaigns state ---
  const [campaignPeriod, setCampaignPeriod] = useState<string>("last_30_days");
  const [campaignChannel, setCampaignChannel] = useState<string>("all");

  // --- Settings state ---
  const [retentionPeriod, setRetentionPeriod] = useState<string>("365");
  const [autoArchive, setAutoArchive] = useState(true);
  const [autoArchiveDays, setAutoArchiveDays] = useState("90");
  const [anonymizeOnDelete, setAnonymizeOnDelete] = useState(true);
  const [exportBeforeDelete, setExportBeforeDelete] = useState(true);
  const [retentionExceptions, setRetentionExceptions] = useState<string[]>(["flagged", "decisions"]);

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

  // Report preview data
  const previewRows = useMemo(() => generateMockRows(selectedFields), [selectedFields]);

  // Campaign totals
  const campaignTotals = useMemo(() => {
    const totalSignups = CAMPAIGN_CHANNELS.reduce((s, c) => s + c.signups, 0);
    const totalConversions = CAMPAIGN_CHANNELS.reduce((s, c) => s + c.conversions, 0);
    const totalCost = CAMPAIGN_CHANNELS.reduce((s, c) => s + c.cost, 0);
    const avgCostPerConversion = totalCost / totalConversions;
    const bestChannel = [...CAMPAIGN_CHANNELS].sort((a, b) => b.conversions - a.conversions)[0];
    return { totalSignups, totalConversions, totalCost, avgCostPerConversion, bestChannel };
  }, []);

  const maxSignups = Math.max(...CAMPAIGN_CHANNELS.map((c) => c.signups));

  // Tab definitions
  const TABS: { id: ExecutiveTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "campaigns", label: "Campaigns", icon: Megaphone },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // Toggle retention exception
  const toggleException = (key: string) => {
    setRetentionExceptions((prev) =>
      prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key]
    );
  };

  // Toggle report field
  const toggleField = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId) ? prev.filter((f) => f !== fieldId) : [...prev, fieldId]
    );
  };

  // Add report filter
  const addFilter = () => {
    setReportFilters((prev) => [...prev, { field: "", operator: "equals", value: "" }]);
  };

  // Remove report filter
  const removeFilter = (index: number) => {
    setReportFilters((prev) => prev.filter((_, i) => i !== index));
  };

  // Update report filter
  const updateFilter = (index: number, key: "field" | "operator" | "value", val: string) => {
    setReportFilters((prev) => prev.map((f, i) => (i === index ? { ...f, [key]: val } : f)));
  };

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

      {/* Tab Navigation */}
      <TabBar
        tabs={TABS.map(t => ({ id: t.id, label: t.label, icon: t.icon }))}
        active={activeTab}
        onChange={(id) => setActiveTab(id as ExecutiveTab)}
        ariaLabel="Executive dashboard tabs"
      />

      {/* ================================================================ */}
      {/* OVERVIEW TAB                                                      */}
      {/* ================================================================ */}
      {activeTab === "overview" && (
        <>
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

          {/* Language Team Comparison -- full width */}
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
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Team</th>
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
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="font-semibold text-foreground">{team.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{team.coordinator}</td>
                        <td className="px-4 py-3 text-center font-medium text-foreground">{team.volunteers}</td>
                        <td className="px-4 py-3 text-center font-bold text-foreground">{team.activeConvos}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{team.avgResponseTime}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "font-medium",
                            team.resolutionRate >= 85 ? "text-emerald-600" :
                            team.resolutionRate >= 70 ? "text-amber-600" : "text-rose-600"
                          )}>
                            {team.resolutionRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-violet-600">{team.decisions}</td>
                        <td className="px-4 py-3 text-center">
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
            {/* Left Panel -- Global Trends */}
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

            {/* Right Panel -- Recent Activity & Alerts */}
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

          {/* Bottom Section -- Policy & Quick Links */}
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
        </>
      )}

      {/* ================================================================ */}
      {/* REPORTS TAB                                                       */}
      {/* ================================================================ */}
      {activeTab === "reports" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {reportView === "list" ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Reports</h2>
                  <p className="text-sm text-muted-foreground mt-1">Create custom reports with full field access</p>
                </div>
                <Button
                  onClick={() => {
                    setReportView("builder");
                    setReportName("");
                    setSelectedFields([]);
                    setReportFilters([]);
                    setReportAggregation("none");
                    setReportGroupBy("");
                  }}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Report
                </Button>
              </div>

              {/* Saved Report Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SAVED_REPORTS.map((report, i) => {
                  const ReportIcon = report.icon;
                  return (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.08, ease: "easeOut" }}
                      className="bg-card rounded-lg border border-border shadow-sm p-5 hover:border-primary/30 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={cn("p-2.5 rounded-md border border-border", report.color)}>
                          <ReportIcon className="w-4.5 h-4.5" />
                        </div>
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 capitalize">
                          {report.type}
                        </Badge>
                      </div>
                      <h3 className="text-sm font-bold text-foreground mb-1">{report.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3 leading-snug">{report.description}</p>
                      <p className="text-xs text-muted-foreground mb-4">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Last run {report.lastRun}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs gap-1.5"
                          onClick={() => toast.info(`Running "${report.name}"...`)}
                        >
                          <Play className="w-3 h-3" />
                          Run
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs gap-1.5"
                          onClick={() => {
                            setReportView("builder");
                            setReportName(report.name);
                          }}
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Report Builder View */
            <div className="space-y-4">
              {/* Builder Header */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReportView("list")}
                  className="gap-1.5"
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  Back
                </Button>
                <Input
                  placeholder="Report name..."
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className="max-w-sm text-sm font-medium"
                />
              </div>

              {/* Two Panel Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Panel: Configuration (40%) */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Select Fields */}
                  <div className="bg-card rounded-lg border border-border shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Columns3 className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-sm font-bold text-foreground">Select Fields</h3>
                    </div>
                    <div className="space-y-4">
                      {REPORT_FIELD_GROUPS.map((group) => (
                        <div key={group.category}>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            {group.category}
                          </p>
                          <div className="space-y-1.5">
                            {group.fields.map((field) => (
                              <label
                                key={field.id}
                                className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/40 transition-colors cursor-pointer"
                              >
                                <Checkbox
                                  checked={selectedFields.includes(field.id)}
                                  onCheckedChange={() => toggleField(field.id)}
                                />
                                <span className="text-sm text-foreground">{field.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="bg-card rounded-lg border border-border shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-bold text-foreground">Filters</h3>
                      </div>
                      <Button variant="outline" size="sm" className="text-xs gap-1" onClick={addFilter}>
                        <Plus className="w-3 h-3" />
                        Add
                      </Button>
                    </div>
                    {reportFilters.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No filters applied. Click Add to create one.</p>
                    ) : (
                      <div className="space-y-3">
                        {reportFilters.map((filter, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Select value={filter.field} onValueChange={(v) => updateFilter(idx, "field", v)}>
                              <SelectTrigger className="h-8 text-xs flex-1">
                                <SelectValue placeholder="Field" />
                              </SelectTrigger>
                              <SelectContent>
                                {REPORT_FIELD_GROUPS.flatMap((g) =>
                                  g.fields.map((f) => (
                                    <SelectItem key={f.id} value={f.id}>
                                      {g.category}: {f.label}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <Select value={filter.operator} onValueChange={(v) => updateFilter(idx, "operator", v)}>
                              <SelectTrigger className="h-8 text-xs w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="equals">Equals</SelectItem>
                                <SelectItem value="contains">Contains</SelectItem>
                                <SelectItem value="greater_than">Greater than</SelectItem>
                                <SelectItem value="less_than">Less than</SelectItem>
                                <SelectItem value="between">Between</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              value={filter.value}
                              onChange={(e) => updateFilter(idx, "value", e.target.value)}
                              placeholder="Value"
                              className="h-8 text-xs flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => removeFilter(idx)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Date Range */}
                  <div className="bg-card rounded-lg border border-border shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-sm font-bold text-foreground">Date Range</h3>
                    </div>
                    <Select value={reportDateRange} onValueChange={setReportDateRange}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last_7_days">Last 7 days</SelectItem>
                        <SelectItem value="last_30_days">Last 30 days</SelectItem>
                        <SelectItem value="last_90_days">Last 90 days</SelectItem>
                        <SelectItem value="this_month">This month</SelectItem>
                        <SelectItem value="this_quarter">This quarter</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Aggregation */}
                  <div className="bg-card rounded-lg border border-border shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Calculator className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-sm font-bold text-foreground">Aggregation</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Function</Label>
                        <Select value={reportAggregation} onValueChange={setReportAggregation}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="sum">Sum</SelectItem>
                            <SelectItem value="average">Average</SelectItem>
                            <SelectItem value="count">Count</SelectItem>
                            <SelectItem value="min">Min</SelectItem>
                            <SelectItem value="max">Max</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Group by</Label>
                        <Select value={reportGroupBy || "none"} onValueChange={(v) => setReportGroupBy(v === "none" ? "" : v)}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select field..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No grouping</SelectItem>
                            {REPORT_FIELD_GROUPS.flatMap((g) =>
                              g.fields.map((f) => (
                                <SelectItem key={f.id} value={f.id}>
                                  {g.category}: {f.label}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => toast.success("Exporting report as CSV...")}
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => toast.success("Exporting report as PDF...")}
                    >
                      <Download className="w-4 h-4" />
                      Export PDF
                    </Button>
                  </div>
                </div>

                {/* Right Panel: Preview (60%) */}
                <div className="lg:col-span-3">
                  <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                    <div className="px-6 pt-5 pb-4 border-b border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Table2 className="w-4 h-4 text-muted-foreground" />
                          <h3 className="text-sm font-bold text-foreground">Preview</h3>
                        </div>
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                          {selectedFields.length > 0 ? `${previewRows.length} records` : "No fields selected"}
                        </Badge>
                      </div>
                    </div>

                    {selectedFields.length === 0 ? (
                      <div className="p-12 text-center">
                        <Database className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Select fields from the left panel to preview report data</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/50 border-b border-border">
                              {selectedFields.map((f) => (
                                <th key={f} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                  {getFieldLabel(f)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {previewRows.map((row, ri) => (
                              <tr key={ri} className="hover:bg-muted/30 transition-colors">
                                {selectedFields.map((f) => (
                                  <td key={f} className="px-4 py-3 text-foreground whitespace-nowrap">
                                    {row[f] || "-"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                            {reportAggregation !== "none" && (
                              <tr className="bg-muted/40 font-semibold border-t-2 border-border">
                                {selectedFields.map((f, fi) => (
                                  <td key={f} className="px-4 py-3 text-foreground whitespace-nowrap">
                                    {fi === 0 ? (
                                      <span className="text-xs uppercase tracking-wider text-muted-foreground">
                                        {reportAggregation}
                                      </span>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                ))}
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ================================================================ */}
      {/* CAMPAIGNS TAB                                                     */}
      {/* ================================================================ */}
      {activeTab === "campaigns" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total Sign-ups",
                value: campaignTotals.totalSignups.toLocaleString(),
                icon: Users,
                color: "text-blue-600",
                bg: "bg-blue-500/10",
              },
              {
                label: "Total Conversions",
                value: campaignTotals.totalConversions.toLocaleString(),
                icon: Target,
                color: "text-emerald-600",
                bg: "bg-emerald-500/10",
              },
              {
                label: "Avg Cost per Conversion",
                value: `$${campaignTotals.avgCostPerConversion.toFixed(2)}`,
                icon: DollarSign,
                color: "text-amber-600",
                bg: "bg-amber-500/10",
              },
              {
                label: "Best Channel",
                value: campaignTotals.bestChannel.name,
                icon: Award,
                color: "text-violet-600",
                bg: "bg-violet-500/10",
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
                  <div className={cn("p-2 rounded-md border border-border group-hover:border-primary/20 transition-all", kpi.bg)}>
                    <kpi.icon className={cn("w-4 h-4 transition-all", kpi.color)} />
                  </div>
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{kpi.label}</p>
                <p className="text-2xl font-bold tracking-tight text-foreground mt-0.5">{kpi.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={campaignPeriod} onValueChange={setCampaignPeriod}>
              <SelectTrigger className="w-44 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_7_days">Last 7 days</SelectItem>
                <SelectItem value="last_30_days">Last 30 days</SelectItem>
                <SelectItem value="last_90_days">Last 90 days</SelectItem>
                <SelectItem value="this_quarter">This quarter</SelectItem>
              </SelectContent>
            </Select>
            <Select value={campaignChannel} onValueChange={setCampaignChannel}>
              <SelectTrigger className="w-44 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                {CAMPAIGN_CHANNELS.map((ch) => (
                  <SelectItem key={ch.name} value={ch.name}>{ch.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-2 ml-auto" onClick={() => toast.success("Exporting campaign data...")}>
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>
          </div>

          {/* Two Panel Row: Funnel + Channel Attribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Funnel Visualization */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
              className="bg-card rounded-lg border border-border shadow-sm overflow-hidden"
            >
              <div className="px-6 pt-5 pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-bold text-foreground">Conversion Funnel</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">From impression to decision</p>
              </div>
              <div className="p-5 space-y-3">
                {FUNNEL_STAGES.map((stage, i) => {
                  const barWidth = Math.max(stage.pct, 3);
                  const colors = [
                    "bg-blue-500", "bg-cyan-500", "bg-emerald-500",
                    "bg-amber-500", "bg-orange-500", "bg-violet-500",
                  ];
                  return (
                    <motion.div
                      key={stage.stage}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: 0.3 + i * 0.06, ease: "easeOut" }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-32 shrink-0 text-right">
                        <p className="text-xs font-medium text-foreground">{stage.stage}</p>
                      </div>
                      <div className="flex-1 relative">
                        <div className="w-full h-7 bg-muted/30 rounded-md overflow-hidden">
                          <div
                            className={cn("h-full rounded-md transition-all flex items-center justify-end pr-2", colors[i])}
                            style={{ width: `${barWidth}%` }}
                          >
                            {barWidth > 15 && (
                              <span className="text-[10px] font-bold text-white">{stage.value.toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        {barWidth <= 15 && (
                          <span className="text-[10px] font-bold text-foreground ml-2">{stage.value.toLocaleString()}</span>
                        )}
                      </div>
                      <div className="w-14 text-right shrink-0">
                        <span className="text-xs font-medium text-muted-foreground">{stage.pct}%</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Right: Channel Attribution */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25, ease: "easeOut" }}
              className="bg-card rounded-lg border border-border shadow-sm overflow-hidden"
            >
              <div className="px-6 pt-5 pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-bold text-foreground">Channel Attribution</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Sign-ups and conversions by channel</p>
              </div>
              <div className="p-5 space-y-3">
                {[...CAMPAIGN_CHANNELS].sort((a, b) => b.signups - a.signups).map((ch, i) => (
                  <motion.div
                    key={ch.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.3 + i * 0.05, ease: "easeOut" }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{ch.name}</span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{ch.signups} sign-ups</span>
                        <span>{ch.conversions} conv.</span>
                        {ch.roi > 0 && (
                          <span className="text-emerald-600 font-semibold">{ch.roi}% ROI</span>
                        )}
                      </div>
                    </div>
                    <div className="w-full h-3 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", ch.color)}
                        style={{ width: `${(ch.signups / maxSignups) * 100}%` }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Campaign Performance Table */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4, ease: "easeOut" }}
            className="bg-card rounded-lg border border-border shadow-sm overflow-hidden"
          >
            <div className="px-6 pt-5 pb-4 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">Campaign Performance</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Detailed channel metrics and trends</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Channel</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sign-ups</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conversions</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conv. Rate</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cost</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ROI</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {CAMPAIGN_CHANNELS.map((ch, i) => {
                    const convRate = ((ch.conversions / ch.signups) * 100).toFixed(1);
                    const trendUp = i % 3 !== 2;
                    const trendPct = [12, 8, -3, 24, 15, 5][i];
                    return (
                      <motion.tr
                        key={ch.name}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: 0.45 + i * 0.04, ease: "easeOut" }}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", ch.color)} />
                            <span className="font-medium text-foreground">{ch.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-foreground">{ch.signups}</td>
                        <td className="px-4 py-3 text-center font-medium text-foreground">{ch.conversions}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{convRate}%</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">
                          {ch.cost > 0 ? `$${ch.cost.toLocaleString()}` : "Free"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {ch.roi > 0 ? (
                            <span className="font-semibold text-emerald-600">{ch.roi}%</span>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className={cn("flex items-center justify-center gap-1 text-xs font-medium", trendPct >= 0 ? "text-emerald-600" : "text-rose-600")}>
                            {trendPct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {Math.abs(trendPct)}%
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                  {/* Totals Row */}
                  <tr className="bg-muted/40 font-semibold border-t-2 border-border">
                    <td className="px-4 py-3 text-foreground">Total</td>
                    <td className="px-4 py-3 text-center text-foreground">{campaignTotals.totalSignups.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center text-foreground">{campaignTotals.totalConversions}</td>
                    <td className="px-4 py-3 text-center text-foreground">
                      {((campaignTotals.totalConversions / campaignTotals.totalSignups) * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-center text-foreground">${campaignTotals.totalCost.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center text-foreground">-</td>
                    <td className="px-4 py-3 text-center text-foreground">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Conversion Paths */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6, ease: "easeOut" }}
          >
            <h3 className="text-sm font-bold text-foreground mb-3">Top Conversion Paths</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CONVERSION_PATHS.map((path, i) => (
                <motion.div
                  key={path.path}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.65 + i * 0.06, ease: "easeOut" }}
                  className="bg-card rounded-lg border border-border shadow-sm p-5 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Route className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-bold text-foreground">{path.path}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-2xl font-bold text-foreground">{path.pct}%</p>
                      <p className="text-xs text-muted-foreground">of decisions</p>
                    </div>
                    <Separator orientation="vertical" className="h-10" />
                    <div>
                      <p className="text-lg font-bold text-foreground">{path.avgDays}d</p>
                      <p className="text-xs text-muted-foreground">avg duration</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ================================================================ */}
      {/* SETTINGS TAB                                                      */}
      {/* ================================================================ */}
      {activeTab === "settings" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="space-y-6 pb-20"
        >
          {/* Chat History Retention */}
          <div className="bg-card rounded-lg border border-border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <History className="w-4.5 h-4.5 text-blue-600" />
              <h3 className="text-base font-bold text-foreground">Chat History Retention</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Configure how long conversation data is retained for compliance and data governance.
            </p>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Retention Period</Label>
                <Select value={retentionPeriod} onValueChange={setRetentionPeriod}>
                  <SelectTrigger className="w-64 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">365 days</SelectItem>
                    <SelectItem value="indefinite">Indefinite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {parseInt(retentionPeriod) < 90 && retentionPeriod !== "indefinite" && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20"
                >
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-700">Short retention period</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      A retention period under 90 days may result in loss of important conversation data before review. Consider a longer period for compliance purposes.
                    </p>
                  </div>
                </motion.div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Storage Usage</Label>
                  <span className="text-xs text-muted-foreground">Using 2.4 GB of 10 GB</span>
                </div>
                <Progress value={24} className="h-2" />
              </div>
            </div>
          </div>

          {/* Auto-Archive */}
          <div className="bg-card rounded-lg border border-border shadow-sm p-6">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Archive className="w-4.5 h-4.5 text-emerald-600" />
                <h3 className="text-base font-bold text-foreground">Auto-Archive</h3>
              </div>
              <Switch
                checked={autoArchive}
                onCheckedChange={setAutoArchive}
              />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Automatically archive inactive conversations after the specified period.
            </p>

            {autoArchive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-center gap-3"
              >
                <Label className="text-sm whitespace-nowrap">Archive after</Label>
                <Input
                  type="number"
                  value={autoArchiveDays}
                  onChange={(e) => setAutoArchiveDays(e.target.value)}
                  className="w-20 h-9 text-sm"
                />
                <span className="text-sm text-muted-foreground">days of inactivity</span>
              </motion.div>
            )}
          </div>

          {/* Data Protection */}
          <div className="bg-card rounded-lg border border-border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4.5 h-4.5 text-violet-600" />
              <h3 className="text-base font-bold text-foreground">Data Protection</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Control how personal data is handled during deletion processes.
            </p>

            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Anonymize personal data on deletion</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    When chat history is deleted, replace names and emails with anonymous identifiers.
                  </p>
                </div>
                <Switch
                  checked={anonymizeOnDelete}
                  onCheckedChange={setAnonymizeOnDelete}
                />
              </div>

              <Separator />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Export data before deletion</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Automatically export conversation data before scheduled deletion for backup purposes.
                  </p>
                </div>
                <Switch
                  checked={exportBeforeDelete}
                  onCheckedChange={setExportBeforeDelete}
                />
              </div>
            </div>
          </div>

          {/* Retention Exceptions */}
          <div className="bg-card rounded-lg border border-border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-4.5 h-4.5 text-amber-600" />
              <h3 className="text-base font-bold text-foreground">Retention Exceptions</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Selected categories will be retained regardless of the retention period.
            </p>

            <div className="space-y-3">
              {[
                { key: "flagged", label: "Flagged conversations", description: "Conversations flagged for review or follow-up" },
                { key: "decisions", label: "Conversations with decisions", description: "Conversations where a seeker made a decision" },
                { key: "escalated", label: "Escalated conversations", description: "Conversations escalated to coordinators or admins" },
                { key: "under_review", label: "Conversations under review", description: "Conversations currently being reviewed for quality" },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <Checkbox
                    checked={retentionExceptions.includes(item.key)}
                    onCheckedChange={() => toggleException(item.key)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Compliance & Audit */}
          <div className="bg-card rounded-lg border border-border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="w-4.5 h-4.5 text-cyan-600" />
              <h3 className="text-base font-bold text-foreground">Compliance & Audit</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Audit trail and compliance information for data retention activities.
            </p>

            <div className="space-y-3 mb-5">
              {[
                { label: "Last retention policy change", value: "January 15, 2026 by Admin" },
                { label: "Next scheduled deletion", value: "August 1, 2026" },
                { label: "Records pending deletion", value: "1,247 conversations" },
                { label: "Last data export", value: "July 20, 2026" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => onNavigate("audit-log")}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Audit Trail
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => toast.success("Manual data export started", { description: "You will be notified when the export is ready for download." })}
              >
                <Download className="w-3.5 h-3.5" />
                Run Manual Export Now
              </Button>
            </div>
          </div>

          {/* Save Changes Footer */}
          <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-10">
            <div className="max-w-7xl mx-auto flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setRetentionPeriod("365");
                  setAutoArchive(true);
                  setAutoArchiveDays("90");
                  setAnonymizeOnDelete(true);
                  setExportBeforeDelete(true);
                  setRetentionExceptions(["flagged", "decisions"]);
                  toast.info("Changes discarded");
                }}
              >
                Discard Changes
              </Button>
              <Button
                onClick={() => toast.success("Retention settings saved successfully")}
              >
                Save Retention Settings
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
