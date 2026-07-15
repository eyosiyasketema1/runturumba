import React, { useState, useMemo } from "react";
import {
  Globe, ShieldCheck, AlertTriangle, Clock, Users,
  CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  Activity, Zap, FileText, UserPlus, Settings,
  ArrowUpRight, ArrowDownRight, CircleDot, Search,
  ClipboardCheck, Eye, BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  cn, type Contact, type Message, type User,
  formatTimeAgo,
} from "./types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GlobalOpsDashboardProps {
  contacts: Contact[];
  messages: Message[];
  users: User[];
  currentUser: User;
  onNavigate: (view: string) => void;
}

type ComplianceSeverity = "Critical" | "Warning" | "Info";
type ComplianceStatus = "active" | "resolved";
type ApprovalType = "New Volunteer" | "Policy Change" | "Region Request" | "Role Change";
type ComplianceTab = "active" | "resolved" | "audit";

interface ComplianceIssue {
  id: string;
  severity: ComplianceSeverity;
  description: string;
  team: string;
  reportedAt: string;
  status: ComplianceStatus;
  resolutionNote?: string;
}

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
}

interface ApprovalItem {
  id: string;
  type: ApprovalType;
  description: string;
  requester: string;
  submittedAt: string;
}

interface RegionData {
  name: string;
  flag: string;
  teams: number;
  volunteers: number;
  status: "Active" | "Warning" | "Critical";
  lastActivity: string;
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

const SEVERITY_STYLES: Record<ComplianceSeverity, string> = {
  Critical: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  Warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Info: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const STATUS_DOT_COLORS: Record<RegionData["status"], string> = {
  Active: "bg-emerald-500",
  Warning: "bg-amber-500",
  Critical: "bg-rose-500",
};

const APPROVAL_TYPE_STYLES: Record<ApprovalType, string> = {
  "New Volunteer": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "Policy Change": "bg-violet-500/10 text-violet-600 border-violet-500/20",
  "Region Request": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "Role Change": "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

// ---------------------------------------------------------------------------
// Static Data
// ---------------------------------------------------------------------------

const REGIONS: RegionData[] = [
  { name: "East Africa", flag: "🇰🇪", teams: 8, volunteers: 42, status: "Active", lastActivity: new Date(Date.now() - 300000).toISOString() },
  { name: "Horn of Africa", flag: "🇪🇹", teams: 6, volunteers: 31, status: "Active", lastActivity: new Date(Date.now() - 900000).toISOString() },
  { name: "Middle East", flag: "🇱🇧", teams: 5, volunteers: 24, status: "Warning", lastActivity: new Date(Date.now() - 3600000).toISOString() },
  { name: "South Asia", flag: "🇮🇳", teams: 7, volunteers: 38, status: "Active", lastActivity: new Date(Date.now() - 1800000).toISOString() },
  { name: "Southeast Asia", flag: "🇵🇭", teams: 4, volunteers: 19, status: "Active", lastActivity: new Date(Date.now() - 5400000).toISOString() },
  { name: "North Africa", flag: "🇲🇦", teams: 3, volunteers: 14, status: "Critical", lastActivity: new Date(Date.now() - 7200000).toISOString() },
];

const COMPLIANCE_ISSUES: ComplianceIssue[] = [
  { id: "ci-1", severity: "Critical", description: "Unreviewed conversations exceed 48h threshold", team: "Somali team", reportedAt: new Date(Date.now() - 1800000).toISOString(), status: "active" },
  { id: "ci-2", severity: "Critical", description: "Volunteer operating without certification", team: "English team", reportedAt: new Date(Date.now() - 3600000).toISOString(), status: "active" },
  { id: "ci-3", severity: "Warning", description: "Trigger word response time > 5min", team: "Amharic team", reportedAt: new Date(Date.now() - 5400000).toISOString(), status: "active" },
  { id: "ci-4", severity: "Warning", description: "Missing weekly review submission", team: "Arabic team", reportedAt: new Date(Date.now() - 7200000).toISOString(), status: "active" },
  { id: "ci-5", severity: "Info", description: "Volunteer coverage below 80% during overnight hours", team: "Tigrinya team", reportedAt: new Date(Date.now() - 10800000).toISOString(), status: "active" },
  { id: "ci-6", severity: "Warning", description: "Escalation protocol not followed for flagged contact", team: "French team", reportedAt: new Date(Date.now() - 14400000).toISOString(), status: "active" },
  { id: "ci-7", severity: "Info", description: "Training material outdated (> 90 days)", team: "Oromo team", reportedAt: new Date(Date.now() - 18000000).toISOString(), status: "active" },
  { id: "ci-8", severity: "Critical", description: "Data retention policy violation detected", team: "Hindi team", reportedAt: new Date(Date.now() - 21600000).toISOString(), status: "active" },
  { id: "ci-9", severity: "Warning", description: "Concurrent chat limit exceeded by 3 volunteers", team: "Swahili team", reportedAt: new Date(Date.now() - 25200000).toISOString(), status: "resolved", resolutionNote: "Volunteers notified and limits enforced." },
  { id: "ci-10", severity: "Info", description: "New channel integration pending validation", team: "Bengali team", reportedAt: new Date(Date.now() - 28800000).toISOString(), status: "resolved", resolutionNote: "Validation completed and channel activated." },
  { id: "ci-11", severity: "Critical", description: "Unauthorized access attempt logged", team: "System", reportedAt: new Date(Date.now() - 32400000).toISOString(), status: "resolved", resolutionNote: "IP blocked and credentials rotated." },
  { id: "ci-12", severity: "Warning", description: "Backup verification failed for region database", team: "Ops", reportedAt: new Date(Date.now() - 36000000).toISOString(), status: "resolved", resolutionNote: "Backup re-run successfully." },
];

const AUDIT_LOG: AuditEntry[] = [
  { id: "al-1", timestamp: new Date(Date.now() - 600000).toISOString(), action: "Updated trigger word list", user: "Sarah Chen", details: "Added 3 new trigger words for Amharic team" },
  { id: "al-2", timestamp: new Date(Date.now() - 1200000).toISOString(), action: "Approved new volunteer", user: "Alex Rivera", details: "Approved Henok Tadesse for Amharic team" },
  { id: "al-3", timestamp: new Date(Date.now() - 2400000).toISOString(), action: "Auto-escalation fired", user: "System", details: "Contact-5 escalated due to trigger word match" },
  { id: "al-4", timestamp: new Date(Date.now() - 3600000).toISOString(), action: "Policy updated", user: "Global Ops", details: "Escalation timeout changed from 10min to 15min" },
  { id: "al-5", timestamp: new Date(Date.now() - 5400000).toISOString(), action: "Region status changed", user: "System", details: "North Africa status set to Critical (low coverage)" },
  { id: "al-6", timestamp: new Date(Date.now() - 7200000).toISOString(), action: "Volunteer deactivated", user: "Miriam Osei", details: "Volunteer removed for policy violation" },
  { id: "al-7", timestamp: new Date(Date.now() - 10800000).toISOString(), action: "Compliance review completed", user: "Global Ops", details: "Monthly compliance audit for East Africa region" },
  { id: "al-8", timestamp: new Date(Date.now() - 14400000).toISOString(), action: "Certification renewed", user: "Training Bot", details: "12 volunteers re-certified in Horn of Africa" },
];

const APPROVALS: ApprovalItem[] = [
  { id: "ap-1", type: "New Volunteer", description: "New volunteer: Henok Tadesse (Amharic team)", requester: "Yonas Gebre", submittedAt: new Date(Date.now() - 1200000).toISOString() },
  { id: "ap-2", type: "Policy Change", description: "Policy update: increase escalation timeout to 20min", requester: "Sarah Chen", submittedAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "ap-3", type: "Region Request", description: "New region request: West Africa", requester: "Alex Rivera", submittedAt: new Date(Date.now() - 7200000).toISOString() },
  { id: "ap-4", type: "Role Change", description: "Role change: Dawit Mengistu → Reviewer", requester: "Rahel Tadesse", submittedAt: new Date(Date.now() - 10800000).toISOString() },
  { id: "ap-5", type: "New Volunteer", description: "New volunteer: Amina Hassan (Somali team)", requester: "Farhan Ali", submittedAt: new Date(Date.now() - 14400000).toISOString() },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const GlobalOpsDashboard = ({
  contacts,
  messages,
  users,
  currentUser,
  onNavigate,
}: GlobalOpsDashboardProps) => {
  const [complianceTab, setComplianceTab] = useState<ComplianceTab>("active");
  const [compliancePage, setCompliancePage] = useState(1);
  const COMPLIANCE_PAGE_SIZE = 5;

  // Derived stats
  const rand = useMemo(() => seededRandom(currentUser.id + "-gops"), [currentUser.id]);

  const activeRegions = REGIONS.length;
  const complianceIssueCount = COMPLIANCE_ISSUES.filter(i => i.status === "active").length;
  const pendingApprovalCount = APPROVALS.length;

  const complianceScore = useMemo(() => {
    const r = seededRandom(currentUser.id + "-score");
    return Math.floor(92 + r() * 7); // 92-98
  }, [currentUser.id]);

  const openIncidents = useMemo(() => {
    const r = seededRandom(currentUser.id + "-incidents");
    return Math.floor(2 + r() * 5); // 2-6
  }, [currentUser.id]);

  const volunteerUtilization = useMemo(() => {
    const r = seededRandom(currentUser.id + "-util");
    return Math.floor(78 + r() * 12); // 78-89
  }, [currentUser.id]);

  // Filtered compliance issues
  const activeIssues = COMPLIANCE_ISSUES.filter(i => i.status === "active");
  const resolvedIssues = COMPLIANCE_ISSUES.filter(i => i.status === "resolved");

  // Pagination for active issues
  const totalActivePages = Math.ceil(activeIssues.length / COMPLIANCE_PAGE_SIZE);
  const paginatedActiveIssues = activeIssues.slice(
    (compliancePage - 1) * COMPLIANCE_PAGE_SIZE,
    compliancePage * COMPLIANCE_PAGE_SIZE
  );

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = currentUser.name.split(" ")[0];

  return (
    <div className="space-y-6 p-6 lg:p-8 animate-in fade-in duration-500 bg-gradient-to-br from-slate-50 via-background to-blue-50/30 min-h-full">
      {/* ================================================================ */}
      {/* Hero Header                                                      */}
      {/* ================================================================ */}
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
                Global Ops &middot; Operations &amp; Compliance
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05]">
              {greeting},{" "}
              <span className="text-blue-300">{firstName}</span>.
            </h1>
            <p className="text-base text-slate-300 mt-3 max-w-2xl leading-relaxed">
              <span className="font-semibold text-white">
                {activeRegions} regions active
              </span>
              <span className="mx-2 text-slate-500">&middot;</span>
              <span className="font-semibold text-amber-300">
                {complianceIssueCount} compliance issues
              </span>
              <span className="mx-2 text-slate-500">&middot;</span>
              <span className="font-semibold text-pink-300">
                {pendingApprovalCount} pending approvals
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
              onClick={() => toast.info("Opening global settings...")}
            >
              <Settings className="w-3.5 h-3.5 mr-1.5" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* ================================================================ */}
      {/* KPI Stats Row                                                    */}
      {/* ================================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Active Regions",
            value: activeRegions,
            icon: Globe,
            color: "text-blue-600",
            bg: "bg-blue-500/10",
          },
          {
            label: "Compliance Score",
            value: `${complianceScore}%`,
            icon: ShieldCheck,
            color: "text-emerald-600",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Pending Approvals",
            value: pendingApprovalCount,
            icon: ClipboardCheck,
            color: "text-amber-600",
            bg: "bg-amber-500/10",
          },
          {
            label: "Open Incidents",
            value: openIncidents,
            icon: AlertTriangle,
            color: "text-rose-600",
            bg: "bg-rose-500/10",
          },
          {
            label: "Volunteer Utilization",
            value: `${volunteerUtilization}%`,
            icon: Users,
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
              {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ================================================================ */}
      {/* Three-Panel Layout                                               */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* -------------------------------------------------------------- */}
        {/* Left Panel -- Region Overview (col-span-4)                     */}
        {/* -------------------------------------------------------------- */}
        <div className="lg:col-span-4">
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Region Overview
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {REGIONS.length} operational regions
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  {REGIONS.filter(r => r.status === "Active").length} active
                </span>
              </div>
            </div>

            {/* Region List */}
            <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
              {REGIONS.map((region, i) => (
                <motion.button
                  key={region.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04, ease: "easeOut" }}
                  onClick={() => toast.info(`Viewing region details for ${region.name}...`)}
                  className="w-full text-left px-5 py-4 hover:bg-muted/50 transition-colors group flex items-center gap-3"
                >
                  {/* Flag */}
                  <span className="text-2xl shrink-0">{region.flag}</span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {region.name}
                      </span>
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          STATUS_DOT_COLORS[region.status]
                        )}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {region.teams} teams
                      </span>
                      <span>&middot;</span>
                      <span>{region.volunteers} volunteers</span>
                    </div>
                  </div>

                  {/* Last Activity */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(region.lastActivity)}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Center Panel -- Compliance & Audit (col-span-5)                */}
        {/* -------------------------------------------------------------- */}
        <div className="lg:col-span-5">
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            {/* Header with tabs */}
            <div className="px-6 pt-5 pb-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Compliance &amp; Audit
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Governance and issue tracking
                  </p>
                </div>
              </div>
              {/* Tab pills */}
              <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
                {(
                  [
                    { key: "active" as ComplianceTab, label: "Active Issues", count: activeIssues.length },
                    { key: "resolved" as ComplianceTab, label: "Resolved", count: resolvedIssues.length },
                    { key: "audit" as ComplianceTab, label: "Audit Log", count: AUDIT_LOG.length },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setComplianceTab(tab.key);
                      setCompliancePage(1);
                    }}
                    className={cn(
                      "flex-1 text-xs font-semibold py-1.5 px-3 rounded-md transition-all",
                      complianceTab === tab.key
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab.label}
                    <span className="ml-1.5 text-[10px] opacity-60">({tab.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="max-h-[480px] overflow-y-auto">
              <AnimatePresence mode="wait">
                {/* Active Issues Tab */}
                {complianceTab === "active" && (
                  <motion.div
                    key="active"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="divide-y divide-border">
                      {paginatedActiveIssues.map((issue, i) => (
                        <motion.div
                          key={issue.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.04, ease: "easeOut" }}
                          className="px-5 py-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] px-1.5 py-0 shrink-0",
                                    SEVERITY_STYLES[issue.severity]
                                  )}
                                >
                                  {issue.severity}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {issue.team}
                                </span>
                              </div>
                              <p className="text-sm text-foreground leading-snug">
                                {issue.description}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(issue.reportedAt)}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[11px] shrink-0 h-7 px-2.5"
                              onClick={() => toast.info(`Investigating: ${issue.description}`)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Investigate
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalActivePages > 1 && (
                      <div className="px-5 py-3 border-t border-border flex items-center justify-between">
                        <p className="text-[11px] text-muted-foreground">
                          Page {compliancePage} of {totalActivePages}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            disabled={compliancePage <= 1}
                            onClick={() => setCompliancePage(p => Math.max(1, p - 1))}
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            disabled={compliancePage >= totalActivePages}
                            onClick={() => setCompliancePage(p => Math.min(totalActivePages, p + 1))}
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Resolved Tab */}
                {complianceTab === "resolved" && (
                  <motion.div
                    key="resolved"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="divide-y divide-border">
                      {resolvedIssues.map((issue, i) => (
                        <motion.div
                          key={issue.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.04, ease: "easeOut" }}
                          className="px-5 py-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] px-1.5 py-0 shrink-0",
                                    SEVERITY_STYLES[issue.severity]
                                  )}
                                >
                                  {issue.severity}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {issue.team}
                                </span>
                              </div>
                              <p className="text-sm text-foreground leading-snug">
                                {issue.description}
                              </p>
                              {issue.resolutionNote && (
                                <p className="text-[11px] text-emerald-600 mt-1.5 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  {issue.resolutionNote}
                                </p>
                              )}
                              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Reported {formatTimeAgo(issue.reportedAt)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Audit Log Tab */}
                {complianceTab === "audit" && (
                  <motion.div
                    key="audit"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="divide-y divide-border">
                      {AUDIT_LOG.map((entry, i) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.04, ease: "easeOut" }}
                          className="px-5 py-3.5 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-semibold text-foreground">
                                  {entry.action}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  by {entry.user}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-snug">
                                {entry.details}
                              </p>
                              <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {formatTimeAgo(entry.timestamp)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Right Panel -- Pending Approvals (col-span-3)                  */}
        {/* -------------------------------------------------------------- */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Pending Approvals
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Awaiting your review
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  {APPROVALS.length} pending
                </span>
              </div>
            </div>

            {/* Approval List */}
            <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
              {APPROVALS.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04, ease: "easeOut" }}
                  className="px-5 py-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0 shrink-0",
                        APPROVAL_TYPE_STYLES[item.type]
                      )}
                    >
                      {item.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground leading-snug mb-1.5">
                    {item.description}
                  </p>
                  <p className="text-[10px] text-muted-foreground mb-3 flex items-center gap-1">
                    <span>by {item.requester}</span>
                    <span>&middot;</span>
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(item.submittedAt)}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] px-2.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                      onClick={() => toast.success(`Approved: ${item.description}`)}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] px-2.5 text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
                      onClick={() => toast.error(`Rejected: ${item.description}`)}
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Bottom Section -- Operational Health                             */}
      {/* ================================================================ */}
      <div>
        <h2 className="text-sm font-bold text-foreground mb-4">
          Operational Health
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(() => {
            const r = seededRandom(currentUser.id + "-health");
            const unreviewedCount = Math.floor(8 + r() * 20);
            const unreviewedTrend = r() > 0.5;
            const queueWaitMin = Math.floor(1 + r() * 8);
            const queueWaitSec = Math.floor(r() * 60);
            const coverageHours = Math.floor(16 + r() * 8);

            const healthCards = [
              {
                label: "System Uptime",
                value: "99.8%",
                subtitle: "Last 30 days",
                status: "green" as const,
                icon: Activity,
              },
              {
                label: "Avg Queue Wait",
                value: `${queueWaitMin}m ${queueWaitSec.toString().padStart(2, "0")}s`,
                subtitle: queueWaitMin < 5 ? "Under threshold" : queueWaitMin < 10 ? "Approaching limit" : "Exceeds limit",
                status: (queueWaitMin < 5 ? "green" : queueWaitMin < 10 ? "amber" : "red") as "green" | "amber" | "red",
                icon: Clock,
              },
              {
                label: "Unreviewed Conversations",
                value: unreviewedCount.toString(),
                subtitle: unreviewedTrend ? "Trending up" : "Trending down",
                status: (unreviewedTrend ? "amber" : "green") as "green" | "amber",
                trend: unreviewedTrend ? "up" as const : "down" as const,
                icon: MessageSquare,
              },
              {
                label: "Volunteer Coverage",
                value: `${coverageHours}/24 hours`,
                subtitle: "Hours with active volunteers",
                status: (coverageHours >= 20 ? "green" : coverageHours >= 16 ? "amber" : "red") as "green" | "amber" | "red",
                icon: Users,
              },
            ];

            return healthCards.map((card, i) => {
              const statusColors = {
                green: "bg-emerald-500",
                amber: "bg-amber-500",
                red: "bg-rose-500",
              };
              const statusBg = {
                green: "bg-emerald-500/10",
                amber: "bg-amber-500/10",
                red: "bg-rose-500/10",
              };

              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + i * 0.06, ease: "easeOut" }}
                  className="bg-card p-5 rounded-lg border border-border shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn("p-2 rounded-md border border-border", statusBg[card.status])}>
                      <card.icon className={cn("w-4 h-4", {
                        "text-emerald-600": card.status === "green",
                        "text-amber-600": card.status === "amber",
                        "text-rose-600": card.status === "red",
                      })} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("w-2 h-2 rounded-full", statusColors[card.status])} />
                      {"trend" in card && card.trend && (
                        card.trend === "up" ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
                        )
                      )}
                    </div>
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-foreground">
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.subtitle}
                  </p>
                </motion.div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
};
