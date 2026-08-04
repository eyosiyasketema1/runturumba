import React, { useState, useMemo } from "react";
import {
  Globe, ShieldCheck, AlertTriangle, Clock, Users,
  CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  Activity, Zap, FileText, UserPlus, Settings,
  ArrowUpRight, ArrowDownRight, CircleDot, Search,
  ClipboardCheck, Eye, BarChart3, MessageSquare,
  X, ChevronDown, Shield, MapPin, TrendingUp, Loader2,
  AlertCircle, Send, Calendar, Filter, Download,
  LayoutDashboard, UsersRound, Timer, ArrowLeftRight,
  Repeat2, Pencil, Trash2, Plus, Lock,
  ScanLine, ShieldAlert, FileWarning, KeyRound,
  Mail, Phone, MapPinned, CheckSquare, Square,
  UserCheck, UserMinus,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  cn, type Contact, type Message, type User,
  formatTimeAgo,
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
import { TabBar, LAYOUT, SPACING, MOTION, MUTED_SCALE, BACKDROP } from "./design-system";

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
type ComplianceStatus = "active" | "investigating" | "resolved" | "closed";
type ApprovalType = "New Volunteer" | "Policy Change" | "Region Request" | "Role Change";
type ComplianceTab = "active" | "resolved" | "audit";
type RejectionReason = "Incomplete Application" | "Failed Background Check" | "Policy Violation" | "Duplicate Request" | "Insufficient Qualifications" | "Other";

type GlobalOpsTab = "overview" | "assignments" | "chat_rules" | "privacy";

interface ComplianceIssue {
  id: string;
  severity: ComplianceSeverity;
  description: string;
  team: string;
  reportedAt: string;
  status: ComplianceStatus;
  resolutionNote?: string;
  investigationNotes?: string;
  rootCause?: string;
  correctiveActions?: string;
  assignee?: string;
  timeline?: { action: string; by: string; at: string }[];
}

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  category?: string;
}

interface ApprovalItem {
  id: string;
  type: ApprovalType;
  description: string;
  requester: string;
  submittedAt: string;
  details?: {
    name?: string;
    team?: string;
    languages?: string[];
    experience?: string;
    reason?: string;
    currentRole?: string;
    newRole?: string;
    policySection?: string;
    changeDescription?: string;
    regionName?: string;
    proposedTeams?: number;
  };
}

interface RegionData {
  name: string;
  flag: string;
  teams: number;
  volunteers: number;
  status: "Active" | "Warning" | "Critical";
  lastActivity: string;
  complianceScore?: number;
  avgResponseTime?: string;
  activeConversations?: number;
  topLanguages?: string[];
}

interface ChatRuleCondition {
  field: "location" | "time_inactive" | "volume" | "channel" | "language" | "time_of_day";
  operator: "equals" | "greater_than" | "less_than" | "between" | "not_equals";
  value: string;
}

interface ChatRule {
  id: string;
  name: string;
  conditions: ChatRuleCondition[];
  action: "expire" | "archive" | "escalate" | "notify";
  actionValue: string;
  priority: "low" | "medium" | "high";
  enabled: boolean;
  region: string;
  lastTriggered: string;
  triggerCount: number;
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
  Info: "bg-primary/10 text-primary border-primary/20",
};

const STATUS_DOT_COLORS: Record<RegionData["status"], string> = {
  Active: "bg-emerald-500",
  Warning: "bg-amber-500",
  Critical: "bg-rose-500",
};

const APPROVAL_TYPE_STYLES: Record<ApprovalType, string> = {
  "New Volunteer": "bg-primary/10 text-primary border-primary/20",
  "Policy Change": "bg-violet-500/10 text-violet-600 border-violet-500/20",
  "Region Request": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "Role Change": "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

const COMPLIANCE_STATUS_STYLES: Record<ComplianceStatus, { label: string; color: string }> = {
  active: { label: "Open", color: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  investigating: { label: "Investigating", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  resolved: { label: "Resolved", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  closed: { label: "Closed", color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
};

const REJECTION_REASONS: RejectionReason[] = [
  "Incomplete Application",
  "Failed Background Check",
  "Policy Violation",
  "Duplicate Request",
  "Insufficient Qualifications",
  "Other",
];

const ROOT_CAUSES = [
  "Process Gap",
  "Human Error",
  "System Failure",
  "Policy Violation",
  "Training Gap",
  "Resource Shortage",
  "External Factor",
  "Other",
];

// ---------------------------------------------------------------------------
// Static Data
// ---------------------------------------------------------------------------

const INITIAL_REGIONS: RegionData[] = [
  { name: "East Africa", flag: "\u{1F1F0}\u{1F1EA}", teams: 8, volunteers: 42, status: "Active", lastActivity: new Date(Date.now() - 300000).toISOString(), complianceScore: 96, avgResponseTime: "2m 14s", activeConversations: 34, topLanguages: ["Swahili", "English", "Somali"] },
  { name: "Horn of Africa", flag: "\u{1F1EA}\u{1F1F9}", teams: 6, volunteers: 31, status: "Active", lastActivity: new Date(Date.now() - 900000).toISOString(), complianceScore: 94, avgResponseTime: "3m 08s", activeConversations: 28, topLanguages: ["Amharic", "Afaan Oromoo", "Tigrinya"] },
  { name: "Middle East", flag: "\u{1F1F1}\u{1F1E7}", teams: 5, volunteers: 24, status: "Warning", lastActivity: new Date(Date.now() - 3600000).toISOString(), complianceScore: 87, avgResponseTime: "5m 42s", activeConversations: 16, topLanguages: ["Arabic", "Farsi", "Turkish"] },
  { name: "South Asia", flag: "\u{1F1EE}\u{1F1F3}", teams: 7, volunteers: 38, status: "Active", lastActivity: new Date(Date.now() - 1800000).toISOString(), complianceScore: 92, avgResponseTime: "2m 55s", activeConversations: 31, topLanguages: ["Hindi", "Bengali", "Urdu"] },
  { name: "Southeast Asia", flag: "\u{1F1F5}\u{1F1ED}", teams: 4, volunteers: 19, status: "Active", lastActivity: new Date(Date.now() - 5400000).toISOString(), complianceScore: 95, avgResponseTime: "1m 48s", activeConversations: 12, topLanguages: ["Tagalog", "Indonesian", "Vietnamese"] },
  { name: "North Africa", flag: "\u{1F1F2}\u{1F1E6}", teams: 3, volunteers: 14, status: "Critical", lastActivity: new Date(Date.now() - 7200000).toISOString(), complianceScore: 72, avgResponseTime: "8m 22s", activeConversations: 6, topLanguages: ["Arabic", "French", "Tamazight"] },
];

const INITIAL_COMPLIANCE: ComplianceIssue[] = [
  { id: "ci-1", severity: "Critical", description: "Unreviewed conversations exceed 48h threshold", team: "Somali team", reportedAt: new Date(Date.now() - 1800000).toISOString(), status: "active", assignee: "Sarah Chen", timeline: [{ action: "Issue flagged by system", by: "System", at: new Date(Date.now() - 1800000).toISOString() }] },
  { id: "ci-2", severity: "Critical", description: "Volunteer operating without certification", team: "English team", reportedAt: new Date(Date.now() - 3600000).toISOString(), status: "active", assignee: "Alex Rivera", timeline: [{ action: "Issue flagged by reviewer", by: "Miriam Osei", at: new Date(Date.now() - 3600000).toISOString() }] },
  { id: "ci-3", severity: "Warning", description: "Trigger word response time > 5min", team: "Amharic team", reportedAt: new Date(Date.now() - 5400000).toISOString(), status: "active", timeline: [{ action: "Issue detected automatically", by: "System", at: new Date(Date.now() - 5400000).toISOString() }] },
  { id: "ci-4", severity: "Warning", description: "Missing weekly review submission", team: "Arabic team", reportedAt: new Date(Date.now() - 7200000).toISOString(), status: "active", timeline: [{ action: "Overdue notice sent", by: "System", at: new Date(Date.now() - 7200000).toISOString() }] },
  { id: "ci-5", severity: "Info", description: "Volunteer coverage below 80% during overnight hours", team: "Tigrinya team", reportedAt: new Date(Date.now() - 10800000).toISOString(), status: "active", timeline: [{ action: "Coverage alert triggered", by: "System", at: new Date(Date.now() - 10800000).toISOString() }] },
  { id: "ci-6", severity: "Warning", description: "Escalation protocol not followed for flagged contact", team: "French team", reportedAt: new Date(Date.now() - 14400000).toISOString(), status: "active", timeline: [{ action: "Protocol violation detected", by: "System", at: new Date(Date.now() - 14400000).toISOString() }] },
  { id: "ci-7", severity: "Info", description: "Training material outdated (> 90 days)", team: "Oromo team", reportedAt: new Date(Date.now() - 18000000).toISOString(), status: "active", timeline: [{ action: "Content review reminder", by: "System", at: new Date(Date.now() - 18000000).toISOString() }] },
  { id: "ci-8", severity: "Critical", description: "Data retention policy violation detected", team: "Hindi team", reportedAt: new Date(Date.now() - 21600000).toISOString(), status: "active", timeline: [{ action: "Policy scan flagged violation", by: "System", at: new Date(Date.now() - 21600000).toISOString() }] },
  { id: "ci-9", severity: "Warning", description: "Concurrent chat limit exceeded by 3 volunteers", team: "Swahili team", reportedAt: new Date(Date.now() - 25200000).toISOString(), status: "resolved", resolutionNote: "Volunteers notified and limits enforced.", rootCause: "Human Error", timeline: [{ action: "Issue detected", by: "System", at: new Date(Date.now() - 25200000).toISOString() }, { action: "Resolved", by: "Sarah Chen", at: new Date(Date.now() - 22000000).toISOString() }] },
  { id: "ci-10", severity: "Info", description: "New channel integration pending validation", team: "Bengali team", reportedAt: new Date(Date.now() - 28800000).toISOString(), status: "resolved", resolutionNote: "Validation completed and channel activated.", rootCause: "Process Gap", timeline: [{ action: "Integration submitted", by: "Alex Rivera", at: new Date(Date.now() - 28800000).toISOString() }, { action: "Validation passed", by: "System", at: new Date(Date.now() - 25000000).toISOString() }] },
  { id: "ci-11", severity: "Critical", description: "Unauthorized access attempt logged", team: "System", reportedAt: new Date(Date.now() - 32400000).toISOString(), status: "closed", resolutionNote: "IP blocked and credentials rotated.", rootCause: "External Factor", timeline: [{ action: "Access attempt detected", by: "System", at: new Date(Date.now() - 32400000).toISOString() }, { action: "IP blocked", by: "System", at: new Date(Date.now() - 32000000).toISOString() }, { action: "Credentials rotated", by: "Sarah Chen", at: new Date(Date.now() - 31000000).toISOString() }] },
  { id: "ci-12", severity: "Warning", description: "Backup verification failed for region database", team: "Ops", reportedAt: new Date(Date.now() - 36000000).toISOString(), status: "resolved", resolutionNote: "Backup re-run successfully.", rootCause: "System Failure", timeline: [{ action: "Backup failed", by: "System", at: new Date(Date.now() - 36000000).toISOString() }, { action: "Re-run initiated", by: "Alex Rivera", at: new Date(Date.now() - 34000000).toISOString() }] },
];

const INITIAL_AUDIT: AuditEntry[] = [
  { id: "al-1", timestamp: new Date(Date.now() - 600000).toISOString(), action: "Updated trigger word list", user: "Sarah Chen", details: "Added 3 new trigger words for Amharic team", category: "Configuration" },
  { id: "al-2", timestamp: new Date(Date.now() - 1200000).toISOString(), action: "Approved new volunteer", user: "Alex Rivera", details: "Approved Henok Tadesse for Amharic team", category: "Approvals" },
  { id: "al-3", timestamp: new Date(Date.now() - 2400000).toISOString(), action: "Auto-escalation fired", user: "System", details: "Contact-5 escalated due to trigger word match", category: "Escalation" },
  { id: "al-4", timestamp: new Date(Date.now() - 3600000).toISOString(), action: "Policy updated", user: "Global Ops", details: "Escalation timeout changed from 10min to 15min", category: "Policy" },
  { id: "al-5", timestamp: new Date(Date.now() - 5400000).toISOString(), action: "Region status changed", user: "System", details: "North Africa status set to Critical (low coverage)", category: "Regions" },
  { id: "al-6", timestamp: new Date(Date.now() - 7200000).toISOString(), action: "Volunteer deactivated", user: "Miriam Osei", details: "Volunteer removed for policy violation", category: "Personnel" },
  { id: "al-7", timestamp: new Date(Date.now() - 10800000).toISOString(), action: "Compliance review completed", user: "Global Ops", details: "Monthly compliance audit for East Africa region", category: "Compliance" },
  { id: "al-8", timestamp: new Date(Date.now() - 14400000).toISOString(), action: "Certification renewed", user: "Training Bot", details: "12 volunteers re-certified in Horn of Africa", category: "Training" },
  { id: "al-9", timestamp: new Date(Date.now() - 18000000).toISOString(), action: "Channel connected", user: "System", details: "Telegram bot connected for Bengali team", category: "Configuration" },
  { id: "al-10", timestamp: new Date(Date.now() - 21600000).toISOString(), action: "Role permission updated", user: "Sarah Chen", details: "Coordinator role granted export_reports permission", category: "Permissions" },
  { id: "al-11", timestamp: new Date(Date.now() - 28800000).toISOString(), action: "Backup completed", user: "System", details: "Weekly full backup completed for all regions", category: "System" },
  { id: "al-12", timestamp: new Date(Date.now() - 36000000).toISOString(), action: "Training module published", user: "Miriam Osei", details: "New onboarding module for Somali team volunteers", category: "Training" },
];

const INITIAL_APPROVALS: ApprovalItem[] = [
  { id: "ap-1", type: "New Volunteer", description: "New volunteer: Henok Tadesse (Amharic team)", requester: "Yonas Gebre", submittedAt: new Date(Date.now() - 1200000).toISOString(), details: { name: "Henok Tadesse", team: "Amharic", languages: ["Amharic", "English"], experience: "3 years in youth ministry, trained in biblical counseling. Currently serves as deacon at Addis Ababa Evangelical Church.", reason: "High conversation volume in Amharic channel requires additional support." } },
  { id: "ap-2", type: "Policy Change", description: "Policy update: increase escalation timeout to 20min", requester: "Sarah Chen", submittedAt: new Date(Date.now() - 3600000).toISOString(), details: { policySection: "Escalation & Response", changeDescription: "Change escalation timeout from 15 minutes to 20 minutes. Analysis shows 40% of conversations resolve naturally between 15-20 minutes, reducing unnecessary escalations. Based on 3-month data review across all regions.", reason: "Reduce false-positive escalations by 40% while maintaining safety standards." } },
  { id: "ap-3", type: "Region Request", description: "New region request: West Africa", requester: "Alex Rivera", submittedAt: new Date(Date.now() - 7200000).toISOString(), details: { regionName: "West Africa", proposedTeams: 4, reason: "Growing demand from French and Hausa-speaking contacts. 200+ unserved inquiries in the past 60 days. Proposed initial setup: 4 teams covering French, Hausa, Yoruba, and Igbo languages." } },
  { id: "ap-4", type: "Role Change", description: "Role change: Dawit Mengistu → Reviewer", requester: "Rahel Tadesse", submittedAt: new Date(Date.now() - 10800000).toISOString(), details: { name: "Dawit Mengistu", currentRole: "Volunteer", newRole: "Reviewer", team: "Amharic", reason: "Dawit has been an active volunteer for 14 months with a 4.8/5.0 quality rating. He has completed all reviewer training modules and passed the certification exam. Recommended by team coordinator." } },
  { id: "ap-5", type: "New Volunteer", description: "New volunteer: Amina Hassan (Somali team)", requester: "Farhan Ali", submittedAt: new Date(Date.now() - 14400000).toISOString(), details: { name: "Amina Hassan", team: "Somali", languages: ["Somali", "Arabic", "English"], experience: "5 years as a community health worker. Fluent in three languages. Active member of local church outreach program.", reason: "Somali channel has longest wait times — additional volunteer would reduce average response time by ~30%." } },
];

const REGION_VOLUNTEERS = [
  { id: "v1", name: "Miriam Tadesse", region: "Horn of Africa", team: "Amharic", role: "Volunteer", status: "Active", cases: 8, lastActive: "2m ago" },
  { id: "v2", name: "Daniel Abera", region: "Horn of Africa", team: "English", role: "Volunteer", status: "Active", cases: 5, lastActive: "15m ago" },
  { id: "v3", name: "Chaltu Bekele", region: "Horn of Africa", team: "Afaan Oromoo", role: "Volunteer", status: "Active", cases: 6, lastActive: "1h ago" },
  { id: "v4", name: "Yohannes Gebre", region: "Horn of Africa", team: "Tigrinya", role: "Coordinator", status: "Active", cases: 3, lastActive: "30m ago" },
  { id: "v5", name: "Fatima Ahmed", region: "East Africa", team: "Somali", role: "Volunteer", status: "Active", cases: 12, lastActive: "5m ago" },
  { id: "v6", name: "Amina Hassan", region: "Middle East", team: "Arabic", role: "Volunteer", status: "Active", cases: 4, lastActive: "45m ago" },
  { id: "v7", name: "Joseph Kariuki", region: "East Africa", team: "Swahili", role: "Volunteer", status: "Active", cases: 9, lastActive: "10m ago" },
  { id: "v8", name: "Grace Nyambura", region: "East Africa", team: "English", role: "Reviewer", status: "Active", cases: 7, lastActive: "20m ago" },
  { id: "v9", name: "Raj Patel", region: "South Asia", team: "Hindi", role: "Volunteer", status: "Active", cases: 11, lastActive: "8m ago" },
  { id: "v10", name: "Priya Sharma", region: "South Asia", team: "Bengali", role: "Volunteer", status: "On Leave", cases: 0, lastActive: "2d ago" },
  { id: "v11", name: "Ahmed Ibrahim", region: "North Africa", team: "Arabic", role: "Volunteer", status: "Active", cases: 3, lastActive: "1h ago" },
  { id: "v12", name: "Marco Santos", region: "Southeast Asia", team: "Tagalog", role: "Coordinator", status: "Active", cases: 5, lastActive: "25m ago" },
  { id: "v13", name: "Linh Nguyen", region: "Southeast Asia", team: "Vietnamese", role: "Volunteer", status: "Active", cases: 4, lastActive: "40m ago" },
  { id: "v14", name: "Farhan Ali", region: "East Africa", team: "Somali", role: "Volunteer", status: "Active", cases: 6, lastActive: "12m ago" },
  { id: "v15", name: "Saba Haile", region: "Horn of Africa", team: "Tigrinya", role: "Volunteer", status: "Inactive", cases: 0, lastActive: "5d ago" },
];

const INITIAL_CHAT_RULES: ChatRule[] = [
  { id: "cr1", name: "Inactive Chat Expiration (Global)", conditions: [{ field: "time_inactive", operator: "greater_than", value: "48 hours" }], action: "expire", actionValue: "Close and archive conversation", priority: "high", enabled: true, region: "All Regions", lastTriggered: "2h ago", triggerCount: 45 },
  { id: "cr2", name: "High Volume Auto-Escalate", conditions: [{ field: "volume", operator: "greater_than", value: "50 messages" }, { field: "time_inactive", operator: "less_than", value: "2 hours" }], action: "escalate", actionValue: "Route to coordinator for review", priority: "high", enabled: true, region: "All Regions", lastTriggered: "30m ago", triggerCount: 12 },
  { id: "cr3", name: "Off-Hours Archive (Middle East)", conditions: [{ field: "location", operator: "equals", value: "Middle East" }, { field: "time_of_day", operator: "between", value: "23:00-06:00" }], action: "archive", actionValue: "Archive until next business day", priority: "medium", enabled: true, region: "Middle East", lastTriggered: "8h ago", triggerCount: 89 },
  { id: "cr4", name: "Low Activity Notification", conditions: [{ field: "time_inactive", operator: "greater_than", value: "24 hours" }, { field: "volume", operator: "less_than", value: "5 messages" }], action: "notify", actionValue: "Send follow-up reminder to volunteer", priority: "low", enabled: false, region: "All Regions", lastTriggered: "1d ago", triggerCount: 23 },
  { id: "cr5", name: "North Africa Business Hours Only", conditions: [{ field: "location", operator: "equals", value: "North Africa" }, { field: "time_of_day", operator: "between", value: "22:00-07:00" }], action: "archive", actionValue: "Hold until morning shift", priority: "medium", enabled: true, region: "North Africa", lastTriggered: "6h ago", triggerCount: 56 },
  { id: "cr6", name: "Stale Conversation Cleanup (South Asia)", conditions: [{ field: "location", operator: "equals", value: "South Asia" }, { field: "time_inactive", operator: "greater_than", value: "72 hours" }], action: "expire", actionValue: "Close with auto-summary", priority: "low", enabled: true, region: "South Asia", lastTriggered: "12h ago", triggerCount: 34 },
];

const DATA_REQUESTS = [
  { id: "dr1", type: "Access" as const, subject: "Abebe Kebede", email: "abebe@example.com", submittedAt: "2026-07-25", status: "pending" as const, region: "Horn of Africa" },
  { id: "dr2", type: "Deletion" as const, subject: "Sarah Mohamed", email: "sarah.m@example.com", submittedAt: "2026-07-22", status: "in_progress" as const, region: "East Africa" },
  { id: "dr3", type: "Export" as const, subject: "Raj Patel", email: "raj.p@example.com", submittedAt: "2026-07-20", status: "completed" as const, region: "South Asia" },
  { id: "dr4", type: "Deletion" as const, subject: "Ahmed Ibrahim", email: "ahmed.i@example.com", submittedAt: "2026-07-18", status: "completed" as const, region: "North Africa" },
  { id: "dr5", type: "Access" as const, subject: "Linh Nguyen", email: "linh.n@example.com", submittedAt: "2026-07-15", status: "pending" as const, region: "Southeast Asia" },
];

const CONSENT_STATS = [
  { category: "Data Processing", consented: 1847, total: 1892, pct: 97.6 },
  { category: "Communication Preferences", consented: 1654, total: 1892, pct: 87.4 },
  { category: "Analytics & Reporting", consented: 1423, total: 1892, pct: 75.2 },
  { category: "Third-party Sharing", consented: 892, total: 1892, pct: 47.1 },
];

const BREACH_LOG = [
  { id: "bl1", date: "2026-06-15", type: "Unauthorized Access Attempt", severity: "High" as const, affected: 0, status: "Contained", resolution: "IP blocked, credentials rotated, affected accounts notified" },
  { id: "bl2", date: "2026-03-02", type: "Data Exposure - Misconfigured Export", severity: "Medium" as const, affected: 23, status: "Resolved", resolution: "Export restricted, affected records re-encrypted, users notified within 72 hours" },
  { id: "bl3", date: "2025-11-18", type: "Phishing Attempt on Volunteer Account", severity: "Low" as const, affected: 1, status: "Resolved", resolution: "Account secured, MFA enforced, security training completed" },
];

// ---------------------------------------------------------------------------
// Sub-Components: Slide-over Drawers & Modals
// ---------------------------------------------------------------------------

/* --- Approval Detail Drawer --- */
function ApprovalDrawer({
  item,
  onClose,
  onApprove,
  onReject,
}: {
  item: ApprovalItem;
  onClose: () => void;
  onApprove: (id: string, notes: string) => void;
  onReject: (id: string, reason: RejectionReason, notes: string) => void;
}) {
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [approveNotes, setApproveNotes] = useState("");
  const [rejectReason, setRejectReason] = useState<RejectionReason>("Incomplete Application");
  const [rejectNotes, setRejectNotes] = useState("");

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-background border-l border-border z-50 flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={cn("text-xs px-2 py-0.5", APPROVAL_TYPE_STYLES[item.type])}>
              {item.type}
            </Badge>
            <span className="text-xs text-muted-foreground">by {item.requester}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Summary */}
          <div>
            <h3 className="text-lg font-bold text-foreground">{item.description}</h3>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Submitted {formatTimeAgo(item.submittedAt)}
            </p>
          </div>

          {/* Details by type */}
          {item.type === "New Volunteer" && item.details && (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Applicant Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Name</p>
                    <p className="text-sm font-semibold">{item.details.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Team</p>
                    <p className="text-sm font-semibold">{item.details.team}</p>
                  </div>
                </div>
                {item.details.languages && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Languages</p>
                    <div className="flex gap-1.5 mt-1">
                      {item.details.languages.map(l => (
                        <span key={l} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{l}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {item.details.experience && (
                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Experience</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.details.experience}</p>
                </div>
              )}
              {item.details.reason && (
                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Justification</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.details.reason}</p>
                </div>
              )}
            </div>
          )}

          {item.type === "Policy Change" && item.details && (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Policy Change Details</h4>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Section</p>
                  <p className="text-sm font-semibold">{item.details.policySection}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Proposed Change</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.details.changeDescription}</p>
                </div>
              </div>
              {item.details.reason && (
                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Rationale</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.details.reason}</p>
                </div>
              )}
            </div>
          )}

          {item.type === "Region Request" && item.details && (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Region Request Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Region Name</p>
                    <p className="text-sm font-semibold">{item.details.regionName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Proposed Teams</p>
                    <p className="text-sm font-semibold">{item.details.proposedTeams}</p>
                  </div>
                </div>
              </div>
              {item.details.reason && (
                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Justification</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.details.reason}</p>
                </div>
              )}
            </div>
          )}

          {item.type === "Role Change" && item.details && (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4 border border-border space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Role Change Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Name</p>
                    <p className="text-sm font-semibold">{item.details.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Team</p>
                    <p className="text-sm font-semibold">{item.details.team}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Current Role</p>
                    <p className="text-sm font-semibold">{item.details.currentRole}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">New Role</p>
                    <p className="text-sm font-semibold text-primary">{item.details.newRole}</p>
                  </div>
                </div>
              </div>
              {item.details.reason && (
                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Justification</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.details.reason}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action bar (sticky bottom) */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center gap-3 shrink-0">
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setShowApproveConfirm(true)}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Approve
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => setShowRejectConfirm(true)}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reject
          </Button>
        </div>
      </motion.div>

      {/* -- Approve Confirmation Modal -- */}
      <AnimatePresence>
        {showApproveConfirm && (
          <>
            <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowApproveConfirm(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background border border-border rounded-lg z-[70] p-6"
            >
              <h3 className="text-base font-bold text-foreground mb-1">Confirm Approval</h3>
              <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
              <div className="mb-4">
                <label className="text-xs font-semibold text-foreground block mb-1.5">Notes (optional)</label>
                <textarea
                  value={approveNotes}
                  onChange={e => setApproveNotes(e.target.value)}
                  placeholder="Add any notes for the record..."
                  className="w-full h-20 text-sm rounded-md border border-border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowApproveConfirm(false)}>Cancel</Button>
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { onApprove(item.id, approveNotes); onClose(); }}>
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Confirm Approval
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* -- Reject Confirmation Modal -- */}
      <AnimatePresence>
        {showRejectConfirm && (
          <>
            <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowRejectConfirm(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background border border-border rounded-lg z-[70] p-6"
            >
              <h3 className="text-base font-bold text-foreground mb-1">Reject Request</h3>
              <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
              <div className="mb-3">
                <label className="text-xs font-semibold text-foreground block mb-1.5">Reason <span className="text-rose-500">*</span></label>
                <select
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value as RejectionReason)}
                  className="w-full h-9 text-sm rounded-md border border-border bg-background px-3 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                >
                  {REJECTION_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Additional Details {rejectReason === "Other" && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  value={rejectNotes}
                  onChange={e => setRejectNotes(e.target.value)}
                  placeholder="Provide context for the rejection..."
                  className="w-full h-20 text-sm rounded-md border border-border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowRejectConfirm(false)}>Cancel</Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={rejectReason === "Other" && !rejectNotes.trim()}
                  onClick={() => { onReject(item.id, rejectReason, rejectNotes); onClose(); }}
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Confirm Rejection
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* --- Compliance Investigation Drawer --- */
function InvestigationDrawer({
  issue,
  onClose,
  onUpdateStatus,
  onResolve,
}: {
  issue: ComplianceIssue;
  onClose: () => void;
  onUpdateStatus: (id: string, status: ComplianceStatus, notes?: string) => void;
  onResolve: (id: string, data: { rootCause: string; resolutionNote: string; correctiveActions: string }) => void;
}) {
  const [notes, setNotes] = useState(issue.investigationNotes || "");
  const [rootCause, setRootCause] = useState(issue.rootCause || ROOT_CAUSES[0]);
  const [resolutionNote, setResolutionNote] = useState(issue.resolutionNote || "");
  const [correctiveActions, setCorrectiveActions] = useState(issue.correctiveActions || "");
  const [showResolve, setShowResolve] = useState(false);

  const statusTransitions: Record<ComplianceStatus, ComplianceStatus[]> = {
    active: ["investigating"],
    investigating: ["resolved"],
    resolved: ["closed"],
    closed: [],
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-background border-l border-border z-50 flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={cn("text-xs px-2 py-0.5", SEVERITY_STYLES[issue.severity])}>
              {issue.severity}
            </Badge>
            <Badge variant="outline" className={cn("text-xs px-2 py-0.5", COMPLIANCE_STATUS_STYLES[issue.status].color)}>
              {COMPLIANCE_STATUS_STYLES[issue.status].label}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Issue summary */}
          <div>
            <h3 className="text-lg font-bold text-foreground">{issue.description}</h3>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{issue.team}</span>
              <span>&middot;</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Reported {formatTimeAgo(issue.reportedAt)}</span>
              {issue.assignee && (
                <>
                  <span>&middot;</span>
                  <span className="flex items-center gap-1"><UserPlus className="w-3 h-3" />Assigned to {issue.assignee}</span>
                </>
              )}
            </div>
          </div>

          {/* Evidence / Context */}
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Evidence &amp; Context</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                <span>Policy rule triggered: <strong className="text-foreground">{issue.description}</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <span>Affected team: <strong className="text-foreground">{issue.team}</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="w-3.5 h-3.5 text-violet-500 mt-0.5 shrink-0" />
                <span>Severity level: <strong className="text-foreground">{issue.severity}</strong></span>
              </div>
            </div>
          </div>

          {/* Investigation Notes */}
          <div>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Investigation Notes</h4>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Document your findings here..."
              className="w-full h-28 text-sm rounded-md border border-border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {/* Activity Timeline */}
          {issue.timeline && issue.timeline.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Activity Timeline</h4>
              <div className="space-y-0 relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                {issue.timeline.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 relative py-2">
                    <div className={cn(
                      "w-[15px] h-[15px] rounded-full border-2 shrink-0 z-10",
                      i === issue.timeline!.length - 1
                        ? "bg-primary border-primary"
                        : "bg-background border-border"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{entry.action}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {entry.by} &middot; {formatTimeAgo(entry.at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolution form (shown when resolving) */}
          {issue.status === "resolved" && issue.resolutionNote && (
            <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/20">
              <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Resolution</h4>
              <p className="text-sm text-foreground">{issue.resolutionNote}</p>
              {issue.rootCause && (
                <p className="text-xs text-muted-foreground mt-2">Root cause: <strong>{issue.rootCause}</strong></p>
              )}
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 shrink-0">
          {issue.status === "active" && (
            <Button
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => onUpdateStatus(issue.id, "investigating", notes)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Begin Investigation
            </Button>
          )}
          {issue.status === "investigating" && (
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setShowResolve(true)}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Resolve Issue
            </Button>
          )}
          {issue.status === "resolved" && (
            <Button
              className="w-full"
              onClick={() => { onUpdateStatus(issue.id, "closed"); onClose(); }}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Close Issue
            </Button>
          )}
          {issue.status === "closed" && (
            <p className="text-sm text-center text-muted-foreground">This issue is closed.</p>
          )}
        </div>
      </motion.div>

      {/* -- Resolve Modal -- */}
      <AnimatePresence>
        {showResolve && (
          <>
            <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowResolve(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background border border-border rounded-lg z-[70] p-6"
            >
              <h3 className="text-base font-bold text-foreground mb-4">Resolve Compliance Issue</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">Root Cause <span className="text-rose-500">*</span></label>
                  <select
                    value={rootCause}
                    onChange={e => setRootCause(e.target.value)}
                    className="w-full h-9 text-sm rounded-md border border-border bg-background px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    {ROOT_CAUSES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">Resolution Summary <span className="text-rose-500">*</span></label>
                  <textarea
                    value={resolutionNote}
                    onChange={e => setResolutionNote(e.target.value)}
                    placeholder="Describe how the issue was resolved..."
                    className="w-full h-20 text-sm rounded-md border border-border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">Corrective Actions</label>
                  <textarea
                    value={correctiveActions}
                    onChange={e => setCorrectiveActions(e.target.value)}
                    placeholder="What steps were taken to prevent recurrence..."
                    className="w-full h-20 text-sm rounded-md border border-border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-5">
                <Button variant="outline" className="flex-1" onClick={() => setShowResolve(false)}>Cancel</Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={!resolutionNote.trim()}
                  onClick={() => {
                    onResolve(issue.id, { rootCause, resolutionNote, correctiveActions });
                    onClose();
                  }}
                >
                  Confirm Resolution
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* --- Region Detail Drawer --- */
function RegionDrawer({ region, onClose }: { region: RegionData; onClose: () => void }) {
  const rand = seededRandom(region.name + "-detail");

  const teamBreakdown = [
    { name: `${region.topLanguages?.[0] || "Primary"} Team`, volunteers: Math.floor(rand() * 8 + 5), conversations: Math.floor(rand() * 20 + 10), status: "Active" as const },
    { name: `${region.topLanguages?.[1] || "Secondary"} Team`, volunteers: Math.floor(rand() * 6 + 3), conversations: Math.floor(rand() * 15 + 5), status: "Active" as const },
    ...(region.topLanguages?.[2] ? [{ name: `${region.topLanguages[2]} Team`, volunteers: Math.floor(rand() * 5 + 2), conversations: Math.floor(rand() * 12 + 3), status: (rand() > 0.7 ? "Warning" : "Active") as "Active" | "Warning" }] : []),
  ];

  const recentActivity = [
    { action: "Volunteer certified", detail: `New volunteer joined ${teamBreakdown[0]?.name}`, time: "12m ago" },
    { action: "Escalation handled", detail: "Trigger word match resolved by coordinator", time: "45m ago" },
    { action: "Review completed", detail: `${Math.floor(rand() * 8 + 3)} conversations reviewed today`, time: "1h ago" },
    { action: "Training session", detail: "Weekly team sync completed", time: "3h ago" },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-background border-l border-border z-50 flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{region.flag}</span>
            <div>
              <h3 className="text-base font-bold text-foreground">{region.name}</h3>
              <p className="text-xs text-muted-foreground">{region.teams} teams &middot; {region.volunteers} volunteers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("w-2.5 h-2.5 rounded-full", STATUS_DOT_COLORS[region.status])} />
            <span className="text-xs font-semibold">{region.status}</span>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Compliance Score", value: `${region.complianceScore || 0}%`, color: (region.complianceScore || 0) >= 90 ? "text-emerald-600" : "text-amber-600" },
              { label: "Avg Response Time", value: region.avgResponseTime || "N/A", color: "text-primary" },
              { label: "Active Conversations", value: `${region.activeConversations || 0}`, color: "text-violet-600" },
              { label: "Last Activity", value: formatTimeAgo(region.lastActivity), color: "text-muted-foreground" },
            ].map(kpi => (
              <div key={kpi.label} className="bg-muted/30 rounded-lg p-3 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                <p className={cn("text-lg font-bold mt-0.5", kpi.color)}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Languages */}
          {region.topLanguages && (
            <div>
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Languages</h4>
              <div className="flex gap-1.5 flex-wrap">
                {region.topLanguages.map(l => (
                  <span key={l} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">{l}</span>
                ))}
              </div>
            </div>
          )}

          {/* Team Breakdown */}
          <div>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Team Breakdown</h4>
            <div className="space-y-2">
              {teamBreakdown.map(team => (
                <div key={team.name} className="flex items-center justify-between bg-muted/30 rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", team.status === "Active" ? "bg-emerald-500" : "bg-amber-500")} />
                    <span className="text-sm font-semibold">{team.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{team.volunteers} volunteers</span>
                    <span>{team.conversations} convos</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Recent Activity</h4>
            <div className="space-y-0 relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
              {recentActivity.map((entry, i) => (
                <div key={i} className="flex items-start gap-3 relative py-2.5">
                  <div className={cn(
                    "w-[15px] h-[15px] rounded-full border-2 shrink-0 z-10",
                    i === 0 ? "bg-primary border-primary" : "bg-background border-border"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{entry.action}</p>
                    <p className="text-xs text-muted-foreground">{entry.detail}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{entry.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const GlobalOpsDashboard = ({
  contacts,
  messages,
  users,
  currentUser,
  onNavigate,
}: GlobalOpsDashboardProps) => {
  // -- State (mutable data) --
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [complianceIssues, setComplianceIssues] = useState<ComplianceIssue[]>(INITIAL_COMPLIANCE);
  const [approvals, setApprovals] = useState<ApprovalItem[]>(INITIAL_APPROVALS);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(INITIAL_AUDIT);

  // -- UI state --
  const [activeTab, setActiveTab] = useState<GlobalOpsTab>("overview");
  const [complianceTab, setComplianceTab] = useState<ComplianceTab>("active");
  const [compliancePage, setCompliancePage] = useState(1);
  const COMPLIANCE_PAGE_SIZE = 5;

  // Drawers
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<ComplianceIssue | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);

  // Audit filters
  const [auditSearch, setAuditSearch] = useState("");
  const [auditTimeFilter, setAuditTimeFilter] = useState<"all" | "today" | "week">("all");
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<string>("all");
  const [auditPage, setAuditPage] = useState(1);
  const AUDIT_PAGE_SIZE = 5;

  // -- Region Assignments state --
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [selectedAssignRegion, setSelectedAssignRegion] = useState<string>("all");
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignVolunteer, setReassignVolunteer] = useState<{ name: string; currentRegion: string } | null>(null);
  const [reassignTarget, setReassignTarget] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [showBulkTransfer, setShowBulkTransfer] = useState(false);
  const [bulkSelectedVolunteers, setBulkSelectedVolunteers] = useState<string[]>([]);
  const [bulkTarget, setBulkTarget] = useState("");
  const [bulkReason, setBulkReason] = useState("");

  // -- Chat Rules state --
  const [chatRules, setChatRules] = useState(INITIAL_CHAT_RULES);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ChatRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: "",
    conditions: [{ field: "location" as ChatRuleCondition["field"], operator: "equals" as ChatRuleCondition["operator"], value: "" }],
    action: "expire" as "expire" | "archive" | "escalate" | "notify",
    actionValue: "",
    priority: "medium" as "low" | "medium" | "high",
    region: "All Regions",
  });

  // -- Privacy state --
  const [privacyTab, setPrivacyTab] = useState<"requests" | "consent" | "scanner" | "breach">("requests");

  // Derived stats
  const rand = useMemo(() => seededRandom(currentUser.id + "-gops"), [currentUser.id]);

  const activeRegions = INITIAL_REGIONS.length;
  const activeIssues = complianceIssues.filter(i => i.status === "active" || i.status === "investigating");
  const resolvedIssues = complianceIssues.filter(i => i.status === "resolved" || i.status === "closed");
  const complianceIssueCount = activeIssues.length;
  const pendingApprovalCount = approvals.length;

  const complianceScore = useMemo(() => {
    const r = seededRandom(currentUser.id + "-score");
    return Math.floor(92 + r() * 7);
  }, [currentUser.id]);

  const openIncidents = useMemo(() => {
    const r = seededRandom(currentUser.id + "-incidents");
    return Math.floor(2 + r() * 5);
  }, [currentUser.id]);

  const volunteerUtilization = useMemo(() => {
    const r = seededRandom(currentUser.id + "-util");
    return Math.floor(78 + r() * 12);
  }, [currentUser.id]);

  // Pagination for active issues
  const totalActivePages = Math.ceil(activeIssues.length / COMPLIANCE_PAGE_SIZE);
  const paginatedActiveIssues = activeIssues.slice(
    (compliancePage - 1) * COMPLIANCE_PAGE_SIZE,
    compliancePage * COMPLIANCE_PAGE_SIZE
  );

  // Filtered audit log
  const auditCategories = useMemo(() => [...new Set(auditLog.map(e => e.category || "Other"))], [auditLog]);

  const filteredAudit = useMemo(() => {
    let entries = auditLog;

    // Time filter
    if (auditTimeFilter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      entries = entries.filter(e => new Date(e.timestamp) >= today);
    } else if (auditTimeFilter === "week") {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      entries = entries.filter(e => new Date(e.timestamp) >= weekAgo);
    }

    // Category filter
    if (auditCategoryFilter !== "all") {
      entries = entries.filter(e => (e.category || "Other") === auditCategoryFilter);
    }

    // Search
    if (auditSearch.trim()) {
      const q = auditSearch.toLowerCase();
      entries = entries.filter(e =>
        e.action.toLowerCase().includes(q) ||
        e.user.toLowerCase().includes(q) ||
        e.details.toLowerCase().includes(q)
      );
    }

    return entries;
  }, [auditLog, auditTimeFilter, auditCategoryFilter, auditSearch]);

  const totalAuditPages = Math.ceil(filteredAudit.length / AUDIT_PAGE_SIZE);
  const paginatedAudit = filteredAudit.slice(
    (auditPage - 1) * AUDIT_PAGE_SIZE,
    auditPage * AUDIT_PAGE_SIZE
  );

  // Filtered volunteers
  const filteredVolunteers = useMemo(() => {
    let vols = REGION_VOLUNTEERS;
    if (selectedAssignRegion !== "all") {
      vols = vols.filter(v => v.region === selectedAssignRegion);
    }
    if (assignmentSearch.trim()) {
      const q = assignmentSearch.toLowerCase();
      vols = vols.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.team.toLowerCase().includes(q) ||
        v.role.toLowerCase().includes(q)
      );
    }
    return vols;
  }, [selectedAssignRegion, assignmentSearch]);

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = currentUser.name.split(" ")[0];

  // -- Handlers --
  const handleApprove = (id: string, notes: string) => {
    setApprovals(prev => prev.filter(a => a.id !== id));
    const item = approvals.find(a => a.id === id);
    if (item) {
      setAuditLog(prev => [{
        id: `al-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: `Approved: ${item.type}`,
        user: currentUser.name,
        details: `${item.description}${notes ? ` — Notes: ${notes}` : ""}`,
        category: "Approvals",
      }, ...prev]);
    }
    toast.success("Approved successfully", { description: item?.description });
  };

  const handleReject = (id: string, reason: RejectionReason, notes: string) => {
    setApprovals(prev => prev.filter(a => a.id !== id));
    const item = approvals.find(a => a.id === id);
    if (item) {
      setAuditLog(prev => [{
        id: `al-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: `Rejected: ${item.type}`,
        user: currentUser.name,
        details: `${item.description} — Reason: ${reason}${notes ? `. ${notes}` : ""}`,
        category: "Approvals",
      }, ...prev]);
    }
    toast.error("Request rejected", { description: `Reason: ${reason}` });
  };

  const handleUpdateIssueStatus = (id: string, status: ComplianceStatus, notes?: string) => {
    setComplianceIssues(prev => prev.map(issue => {
      if (issue.id !== id) return issue;
      const timeline = [...(issue.timeline || []), {
        action: `Status changed to ${COMPLIANCE_STATUS_STYLES[status].label}`,
        by: currentUser.name,
        at: new Date().toISOString(),
      }];
      return { ...issue, status, investigationNotes: notes || issue.investigationNotes, timeline };
    }));
    setAuditLog(prev => [{
      id: `al-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: `Compliance issue ${COMPLIANCE_STATUS_STYLES[status].label.toLowerCase()}`,
      user: currentUser.name,
      details: complianceIssues.find(i => i.id === id)?.description || "",
      category: "Compliance",
    }, ...prev]);
    // Update the selected issue reference
    setSelectedIssue(prev => {
      if (!prev || prev.id !== id) return prev;
      const timeline = [...(prev.timeline || []), {
        action: `Status changed to ${COMPLIANCE_STATUS_STYLES[status].label}`,
        by: currentUser.name,
        at: new Date().toISOString(),
      }];
      return { ...prev, status, investigationNotes: notes || prev.investigationNotes, timeline };
    });
    toast.success(`Issue ${COMPLIANCE_STATUS_STYLES[status].label.toLowerCase()}`);
  };

  const handleResolveIssue = (id: string, data: { rootCause: string; resolutionNote: string; correctiveActions: string }) => {
    setComplianceIssues(prev => prev.map(issue => {
      if (issue.id !== id) return issue;
      const timeline = [...(issue.timeline || []), {
        action: "Issue resolved",
        by: currentUser.name,
        at: new Date().toISOString(),
      }];
      return { ...issue, status: "resolved" as const, ...data, timeline };
    }));
    setAuditLog(prev => [{
      id: `al-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "Compliance issue resolved",
      user: currentUser.name,
      details: `${complianceIssues.find(i => i.id === id)?.description || ""} — Root cause: ${data.rootCause}`,
      category: "Compliance",
    }, ...prev]);
    toast.success("Issue resolved", { description: data.resolutionNote });
  };

  const handleToggleRule = (id: string) => {
    setChatRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    const rule = chatRules.find(r => r.id === id);
    toast.success(rule?.enabled ? "Rule disabled" : "Rule enabled", { description: rule?.name });
  };

  const handleDeleteRule = (id: string) => {
    setChatRules(prev => prev.filter(r => r.id !== id));
    toast.success("Rule deleted");
  };

  const handleSaveRule = () => {
    if (!ruleForm.name.trim()) {
      toast.error("Rule name is required");
      return;
    }
    if (editingRule) {
      setChatRules(prev => prev.map(r => r.id === editingRule.id ? {
        ...r,
        name: ruleForm.name,
        conditions: ruleForm.conditions,
        action: ruleForm.action,
        actionValue: ruleForm.actionValue,
        priority: ruleForm.priority,
        region: ruleForm.region,
      } : r));
      toast.success("Rule updated", { description: ruleForm.name });
    } else {
      const newRule: ChatRule = {
        id: `cr-${Date.now()}`,
        name: ruleForm.name,
        conditions: ruleForm.conditions,
        action: ruleForm.action,
        actionValue: ruleForm.actionValue,
        priority: ruleForm.priority,
        enabled: true,
        region: ruleForm.region,
        lastTriggered: "Never",
        triggerCount: 0,
      };
      setChatRules(prev => [newRule, ...prev]);
      toast.success("Rule created", { description: ruleForm.name });
    }
    setShowRuleModal(false);
    setEditingRule(null);
  };

  const openEditRule = (rule: ChatRule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      conditions: [...rule.conditions],
      action: rule.action,
      actionValue: rule.actionValue,
      priority: rule.priority,
      region: rule.region,
    });
    setShowRuleModal(true);
  };

  const openNewRule = () => {
    setEditingRule(null);
    setRuleForm({
      name: "",
      conditions: [{ field: "location", operator: "equals", value: "" }],
      action: "expire",
      actionValue: "",
      priority: "medium",
      region: "All Regions",
    });
    setShowRuleModal(true);
  };

  // -- Tab definitions --
  const GLOBAL_OPS_TABS: { key: GlobalOpsTab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "assignments", label: "Region Assignments", icon: UsersRound },
    { key: "chat_rules", label: "Chat Rules", icon: Timer },
    { key: "privacy", label: "Privacy", icon: ShieldCheck },
  ];

  const ACTION_BADGE_STYLES: Record<string, string> = {
    expire: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    archive: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    escalate: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    notify: "bg-primary/10 text-primary border-primary/20",
  };

  const PRIORITY_BADGE_STYLES: Record<string, string> = {
    low: "bg-slate-500/10 text-slate-600 border-slate-500/20",
    medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    high: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  };

  const CONDITION_FIELD_LABELS: Record<string, string> = {
    location: "Location",
    time_inactive: "Time Inactive",
    volume: "Volume",
    channel: "Channel",
    language: "Language",
    time_of_day: "Time of Day",
  };

  const OPERATOR_LABELS: Record<string, string> = {
    equals: "=",
    greater_than: ">",
    less_than: "<",
    between: "between",
    not_equals: "!=",
  };

  return (
    <div className="space-y-6 p-6 lg:p-8 animate-in fade-in duration-500 bg-gradient-to-br from-slate-50 via-background to-blue-50/30 min-h-full">
      {/* ================================================================ */}
      {/* Hero Header                                                      */}
      {/* ================================================================ */}
      <header className="relative overflow-hidden rounded-sm bg-slate-950 text-white p-8">
        <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-primary/40 to-violet-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-gradient-to-tr from-emerald-500/20 to-primary/10 blur-3xl pointer-events-none" />
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
            <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
              onClick={() => onNavigate("settings")}
            >
              <Settings className="w-3.5 h-3.5 mr-1.5" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* ================================================================ */}
      {/* Tab Navigation                                                   */}
      {/* ================================================================ */}
      <TabBar
        tabs={GLOBAL_OPS_TABS.map(t => ({ id: t.key, label: t.label, icon: t.icon }))}
        active={activeTab}
        onChange={(id) => setActiveTab(id as GlobalOpsTab)}
        ariaLabel="Global Ops dashboard tabs"
      />

      {/* ================================================================ */}
      {/* OVERVIEW TAB                                                     */}
      {/* ================================================================ */}
      {activeTab === "overview" && (
        <>
          {/* KPI Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "Active Regions", value: activeRegions, icon: Globe, color: "text-primary", bg: "bg-primary/10" },
              { label: "Compliance Score", value: `${complianceScore}%`, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-500/10" },
              { label: "Pending Approvals", value: pendingApprovalCount, icon: ClipboardCheck, color: "text-amber-600", bg: "bg-amber-500/10" },
              { label: "Open Incidents", value: openIncidents, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-500/10" },
              { label: "Volunteer Utilization", value: `${volunteerUtilization}%`, icon: Users, color: "text-violet-600", bg: "bg-violet-500/10" },
            ].map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06, ease: "easeOut" }}
                className="bg-card p-5 rounded-lg border border-border group hover:border-primary/30 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("p-2 rounded-md border border-border group-hover:border-primary/20 transition-all", kpi.bg)}>
                    <kpi.icon className={cn("w-4 h-4 transition-all", kpi.color)} />
                  </div>
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{kpi.label}</p>
                <p className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
                  {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Three-Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Panel -- Region Overview (col-span-4) */}
            <div className="lg:col-span-4">
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="px-6 pt-5 pb-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-foreground">Region Overview</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{INITIAL_REGIONS.length} operational regions</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {INITIAL_REGIONS.filter(r => r.status === "Active").length} active
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
                  {INITIAL_REGIONS.map((region, i) => (
                    <motion.button
                      key={region.name}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.04, ease: "easeOut" }}
                      onClick={() => setSelectedRegion(region)}
                      className="w-full text-left px-5 py-4 hover:bg-muted/50 transition-colors group flex items-center gap-3"
                    >
                      <span className="text-2xl shrink-0">{region.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-foreground truncate">{region.name}</span>
                          <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_DOT_COLORS[region.status])} />
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{region.teams} teams</span>
                          <span>&middot;</span>
                          <span>{region.volunteers} volunteers</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(region.lastActivity)}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Center Panel -- Compliance & Audit (col-span-5) */}
            <div className="lg:col-span-5">
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="px-6 pt-5 pb-4 border-b border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-sm font-bold text-foreground">Compliance &amp; Audit</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Governance and issue tracking</p>
                    </div>
                  </div>
                  <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
                    {([
                      { key: "active" as ComplianceTab, label: "Active Issues", count: activeIssues.length },
                      { key: "resolved" as ComplianceTab, label: "Resolved", count: resolvedIssues.length },
                      { key: "audit" as ComplianceTab, label: "Audit Log", count: filteredAudit.length },
                    ] as const).map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => { setComplianceTab(tab.key); setCompliancePage(1); setAuditPage(1); }}
                        className={cn(
                          "flex-1 text-xs font-semibold py-1.5 px-3 rounded-md transition-all",
                          complianceTab === tab.key
                            ? "bg-background text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {tab.label}
                        <span className="ml-1.5 text-[10px] opacity-60">({tab.count})</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="max-h-[520px] overflow-y-auto">
                  <AnimatePresence mode="wait">
                    {/* Active Issues Tab */}
                    {complianceTab === "active" && (
                      <motion.div key="active" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
                        {activeIssues.length === 0 ? (
                          <div className="px-6 py-12 text-center">
                            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                            <p className="text-sm font-semibold text-foreground">All clear!</p>
                            <p className="text-xs text-muted-foreground mt-1">No active compliance issues.</p>
                          </div>
                        ) : (
                          <>
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
                                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0", SEVERITY_STYLES[issue.severity])}>
                                          {issue.severity}
                                        </Badge>
                                        {issue.status === "investigating" && (
                                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 bg-amber-500/10 text-amber-600 border-amber-500/20">
                                            Investigating
                                          </Badge>
                                        )}
                                        <span className="text-[10px] text-muted-foreground">{issue.team}</span>
                                      </div>
                                      <p className="text-sm text-foreground leading-snug">{issue.description}</p>
                                      <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatTimeAgo(issue.reportedAt)}
                                        {issue.assignee && (
                                          <span className="ml-2 flex items-center gap-1">
                                            <UserPlus className="w-3 h-3" />{issue.assignee}
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-[11px] shrink-0 h-7 px-2.5"
                                      onClick={() => setSelectedIssue(issue)}
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      Investigate
                                    </Button>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                            {totalActivePages > 1 && (
                              <div className="px-5 py-3 border-t border-border flex items-center justify-between">
                                <p className="text-[11px] text-muted-foreground">Page {compliancePage} of {totalActivePages}</p>
                                <div className="flex items-center gap-1">
                                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={compliancePage <= 1} onClick={() => setCompliancePage(p => Math.max(1, p - 1))}>
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={compliancePage >= totalActivePages} onClick={() => setCompliancePage(p => Math.min(totalActivePages, p + 1))}>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </motion.div>
                    )}

                    {/* Resolved Tab */}
                    {complianceTab === "resolved" && (
                      <motion.div key="resolved" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
                        <div className="divide-y divide-border">
                          {resolvedIssues.map((issue, i) => (
                            <motion.div
                              key={issue.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.2, delay: i * 0.04, ease: "easeOut" }}
                              className="px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer"
                              onClick={() => setSelectedIssue(issue)}
                            >
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0", SEVERITY_STYLES[issue.severity])}>
                                      {issue.severity}
                                    </Badge>
                                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0", COMPLIANCE_STATUS_STYLES[issue.status].color)}>
                                      {COMPLIANCE_STATUS_STYLES[issue.status].label}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">{issue.team}</span>
                                  </div>
                                  <p className="text-sm text-foreground leading-snug">{issue.description}</p>
                                  {issue.resolutionNote && (
                                    <p className="text-[11px] text-emerald-600 mt-1.5 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      {issue.resolutionNote}
                                    </p>
                                  )}
                                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Reported {formatTimeAgo(issue.reportedAt)}
                                    {issue.rootCause && <span className="ml-2">Root cause: {issue.rootCause}</span>}
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
                      <motion.div key="audit" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
                        {/* Filters */}
                        <div className="px-5 py-3 border-b border-border space-y-2">
                          {/* Search */}
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <input
                              value={auditSearch}
                              onChange={e => { setAuditSearch(e.target.value); setAuditPage(1); }}
                              placeholder="Search audit log..."
                              className="w-full h-8 text-xs rounded-md border border-border bg-background pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            />
                          </div>
                          {/* Quick filters */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex gap-1 bg-muted/50 rounded-md p-0.5">
                              {(["all", "today", "week"] as const).map(f => (
                                <button
                                  key={f}
                                  onClick={() => { setAuditTimeFilter(f); setAuditPage(1); }}
                                  className={cn(
                                    "text-[10px] font-semibold px-2 py-1 rounded transition-all",
                                    auditTimeFilter === f ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  {f === "all" ? "All Time" : f === "today" ? "Today" : "This Week"}
                                </button>
                              ))}
                            </div>
                            <select
                              value={auditCategoryFilter}
                              onChange={e => { setAuditCategoryFilter(e.target.value); setAuditPage(1); }}
                              className="h-7 text-[10px] font-semibold rounded-md border border-border bg-background px-2 focus:outline-none focus:ring-1 focus:ring-primary/30"
                            >
                              <option value="all">All Categories</option>
                              {auditCategories.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                            {(auditSearch || auditTimeFilter !== "all" || auditCategoryFilter !== "all") && (
                              <button
                                onClick={() => { setAuditSearch(""); setAuditTimeFilter("all"); setAuditCategoryFilter("all"); setAuditPage(1); }}
                                className="text-[10px] font-semibold text-primary hover:text-primary/80"
                              >
                                Clear filters
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Entries */}
                        {paginatedAudit.length === 0 ? (
                          <div className="px-6 py-10 text-center">
                            <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">No audit entries match your filters.</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-border">
                            {paginatedAudit.map((entry, i) => (
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
                                      <span className="text-xs font-semibold text-foreground">{entry.action}</span>
                                      <span className="text-[10px] text-muted-foreground">by {entry.user}</span>
                                      {entry.category && (
                                        <span className="text-[9px] px-1.5 py-0 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20">{entry.category}</span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-snug">{entry.details}</p>
                                    <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5" />
                                      {formatTimeAgo(entry.timestamp)}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}

                        {/* Pagination */}
                        {totalAuditPages > 1 && (
                          <div className="px-5 py-3 border-t border-border flex items-center justify-between">
                            <p className="text-[11px] text-muted-foreground">
                              {filteredAudit.length} entries &middot; Page {auditPage} of {totalAuditPages}
                            </p>
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={auditPage <= 1} onClick={() => setAuditPage(p => Math.max(1, p - 1))}>
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={auditPage >= totalAuditPages} onClick={() => setAuditPage(p => Math.min(totalAuditPages, p + 1))}>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Right Panel -- Pending Approvals (col-span-3) */}
            <div className="lg:col-span-3">
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="px-6 pt-5 pb-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-foreground">Pending Approvals</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Awaiting your review</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      {approvals.length} pending
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
                  <AnimatePresence>
                    {approvals.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="px-6 py-12 text-center"
                      >
                        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-foreground">All caught up!</p>
                        <p className="text-xs text-muted-foreground mt-1">No pending approvals.</p>
                      </motion.div>
                    ) : (
                      approvals.map((item, i) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20, height: 0, paddingTop: 0, paddingBottom: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.04, ease: "easeOut" }}
                          className="px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                          onClick={() => setSelectedApproval(item)}
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0", APPROVAL_TYPE_STYLES[item.type])}>
                              {item.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground leading-snug mb-1.5">{item.description}</p>
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
                              onClick={(e) => { e.stopPropagation(); setSelectedApproval(item); }}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Review
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px] px-2.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => { e.stopPropagation(); handleApprove(item.id, ""); }}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Quick Approve
                            </Button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Health */}
          <div>
            <h2 className="text-sm font-bold text-foreground mb-4">Operational Health</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(() => {
                const r = seededRandom(currentUser.id + "-health");
                const unreviewedCount = Math.floor(8 + r() * 20);
                const unreviewedTrend = r() > 0.5;
                const queueWaitMin = Math.floor(1 + r() * 8);
                const queueWaitSec = Math.floor(r() * 60);
                const coverageHours = Math.floor(16 + r() * 8);

                const healthCards = [
                  { label: "System Uptime", value: "99.8%", subtitle: "Last 30 days", status: "green" as const, icon: Activity },
                  { label: "Avg Queue Wait", value: `${queueWaitMin}m ${queueWaitSec.toString().padStart(2, "0")}s`, subtitle: queueWaitMin < 5 ? "Under threshold" : queueWaitMin < 10 ? "Approaching limit" : "Exceeds limit", status: (queueWaitMin < 5 ? "green" : queueWaitMin < 10 ? "amber" : "red") as "green" | "amber" | "red", icon: Clock },
                  { label: "Unreviewed Conversations", value: unreviewedCount.toString(), subtitle: unreviewedTrend ? "Trending up" : "Trending down", status: (unreviewedTrend ? "amber" : "green") as "green" | "amber", trend: unreviewedTrend ? "up" as const : "down" as const, icon: MessageSquare },
                  { label: "Volunteer Coverage", value: `${coverageHours}/24 hours`, subtitle: "Hours with active volunteers", status: (coverageHours >= 20 ? "green" : coverageHours >= 16 ? "amber" : "red") as "green" | "amber" | "red", icon: Users },
                ];

                return healthCards.map((card, i) => {
                  const statusColors = { green: "bg-emerald-500", amber: "bg-amber-500", red: "bg-rose-500" };
                  const statusBg = { green: "bg-emerald-500/10", amber: "bg-amber-500/10", red: "bg-rose-500/10" };
                  return (
                    <motion.div
                      key={card.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + i * 0.06, ease: "easeOut" }}
                      className="bg-card p-5 rounded-lg border border-border"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={cn("p-2 rounded-md border border-border", statusBg[card.status])}>
                          <card.icon className={cn("w-4 h-4", { "text-emerald-600": card.status === "green", "text-amber-600": card.status === "amber", "text-rose-600": card.status === "red" })} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={cn("w-2 h-2 rounded-full", statusColors[card.status])} />
                          {"trend" in card && card.trend && (
                            card.trend === "up" ? <ArrowUpRight className="w-3.5 h-3.5 text-amber-500" /> : <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                        </div>
                      </div>
                      <p className="text-2xl font-bold tracking-tight text-foreground">{card.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                    </motion.div>
                  );
                });
              })()}
            </div>
          </div>
        </>
      )}

      {/* ================================================================ */}
      {/* REGION ASSIGNMENTS TAB                                           */}
      {/* ================================================================ */}
      {activeTab === "assignments" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
          {/* Region Coverage Grid */}
          <div>
            <h2 className="text-sm font-bold text-foreground mb-4">Region Coverage</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {INITIAL_REGIONS.map((region, i) => {
                const volCount = REGION_VOLUNTEERS.filter(v => v.region === region.name).length;
                const idealRatio = Math.max(region.teams * 5, 10);
                const capacityPct = Math.min(Math.round((volCount / idealRatio) * 100), 100);
                return (
                  <motion.div
                    key={region.name}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.04 }}
                    onClick={() => { setSelectedAssignRegion(region.name); }}
                    className={cn(
                      "bg-card rounded-lg border p-4 cursor-pointer transition-all hover:border-primary/30",
                      selectedAssignRegion === region.name ? "border-primary ring-1 ring-primary/20" : "border-border",
                      region.status === "Critical" && "border-rose-500/30 bg-rose-500/5",
                      region.status === "Warning" && "border-amber-500/30 bg-amber-500/5",
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{region.flag}</span>
                        <span className="text-sm font-bold text-foreground">{region.name}</span>
                      </div>
                      <span className={cn("w-2.5 h-2.5 rounded-full", STATUS_DOT_COLORS[region.status])} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <span>{volCount} volunteers</span>
                      <span>{region.teams} teams</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">Capacity</span>
                        <span className={cn("font-semibold", capacityPct >= 70 ? "text-emerald-600" : capacityPct >= 40 ? "text-amber-600" : "text-rose-600")}>{capacityPct}%</span>
                      </div>
                      <Progress value={capacityPct} className="h-1.5" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={assignmentSearch}
                onChange={e => setAssignmentSearch(e.target.value)}
                placeholder="Search volunteers..."
                className="w-full h-9 text-sm rounded-md border border-border bg-background pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <Select value={selectedAssignRegion} onValueChange={setSelectedAssignRegion}>
              <SelectTrigger className="w-[180px] h-9 text-sm">
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {INITIAL_REGIONS.map(r => (
                  <SelectItem key={r.name} value={r.name}>{r.flag} {r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              disabled={bulkSelectedVolunteers.length === 0}
              onClick={() => { setBulkTarget(""); setBulkReason(""); setShowBulkTransfer(true); }}
            >
              <Repeat2 className="w-3.5 h-3.5 mr-1.5" />
              Bulk Transfer ({bulkSelectedVolunteers.length})
            </Button>
            <Badge variant="outline" className="text-xs px-2.5 py-1">
              {filteredVolunteers.length} volunteers
            </Badge>
          </div>

          {/* Volunteer Assignment Table */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-4 py-3 text-left w-10">
                      <Checkbox
                        checked={bulkSelectedVolunteers.length === filteredVolunteers.length && filteredVolunteers.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setBulkSelectedVolunteers(filteredVolunteers.map(v => v.id));
                          } else {
                            setBulkSelectedVolunteers([]);
                          }
                        }}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Region</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Team</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cases</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Active</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredVolunteers.map((vol, i) => (
                    <motion.tr
                      key={vol.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15, delay: i * 0.02 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={bulkSelectedVolunteers.includes(vol.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setBulkSelectedVolunteers(prev => [...prev, vol.id]);
                            } else {
                              setBulkSelectedVolunteers(prev => prev.filter(id => id !== vol.id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">{vol.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{vol.region}</td>
                      <td className="px-4 py-3 text-muted-foreground">{vol.team}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0",
                          vol.role === "Coordinator" ? "bg-primary/10 text-primary border-primary/20" :
                          vol.role === "Reviewer" ? "bg-violet-500/10 text-violet-600 border-violet-500/20" :
                          "bg-slate-500/10 text-slate-600 border-slate-500/20"
                        )}>
                          {vol.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0",
                          vol.status === "Active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                          vol.status === "On Leave" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                          "bg-slate-500/10 text-slate-600 border-slate-500/20"
                        )}>
                          {vol.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{vol.cases}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{vol.lastActive}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] px-2.5"
                          onClick={() => {
                            setReassignVolunteer({ name: vol.name, currentRegion: vol.region });
                            setReassignTarget("");
                            setReassignReason("");
                            setShowReassignModal(true);
                          }}
                        >
                          <ArrowLeftRight className="w-3 h-3 mr-1" />
                          Reassign
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {filteredVolunteers.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No volunteers match your search.</p>
                </div>
              )}
            </div>
          </div>

          {/* Reassign Modal */}
          <AnimatePresence>
            {showReassignModal && reassignVolunteer && (
              <>
                <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowReassignModal(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background border border-border rounded-lg z-50 p-6"
                >
                  <h3 className="text-base font-bold text-foreground mb-1">Reassign Volunteer</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {reassignVolunteer.name} &middot; Currently in {reassignVolunteer.currentRegion}
                  </p>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-semibold mb-1.5">Target Region</Label>
                      <Select value={reassignTarget} onValueChange={setReassignTarget}>
                        <SelectTrigger className="w-full h-9 text-sm">
                          <SelectValue placeholder="Select region..." />
                        </SelectTrigger>
                        <SelectContent>
                          {INITIAL_REGIONS.filter(r => r.name !== reassignVolunteer.currentRegion).map(r => (
                            <SelectItem key={r.name} value={r.name}>{r.flag} {r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold mb-1.5">Reason</Label>
                      <textarea
                        value={reassignReason}
                        onChange={e => setReassignReason(e.target.value)}
                        placeholder="Provide reason for reassignment..."
                        className="w-full h-20 text-sm rounded-md border border-border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-5">
                    <Button variant="outline" className="flex-1" onClick={() => setShowReassignModal(false)}>Cancel</Button>
                    <Button
                      className="flex-1"
                      disabled={!reassignTarget}
                      onClick={() => {
                        toast.success("Volunteer reassigned", { description: `${reassignVolunteer.name} moved to ${reassignTarget}` });
                        setShowReassignModal(false);
                      }}
                    >
                      <ArrowLeftRight className="w-4 h-4 mr-1.5" />
                      Confirm Reassignment
                    </Button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Bulk Transfer Modal */}
          <AnimatePresence>
            {showBulkTransfer && (
              <>
                <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowBulkTransfer(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background border border-border rounded-lg z-50 p-6"
                >
                  <h3 className="text-base font-bold text-foreground mb-1">Bulk Transfer</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Transfer {bulkSelectedVolunteers.length} selected volunteer{bulkSelectedVolunteers.length !== 1 ? "s" : ""}
                  </p>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-semibold mb-1.5">Target Region</Label>
                      <Select value={bulkTarget} onValueChange={setBulkTarget}>
                        <SelectTrigger className="w-full h-9 text-sm">
                          <SelectValue placeholder="Select region..." />
                        </SelectTrigger>
                        <SelectContent>
                          {INITIAL_REGIONS.map(r => (
                            <SelectItem key={r.name} value={r.name}>{r.flag} {r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold mb-1.5">Reason</Label>
                      <textarea
                        value={bulkReason}
                        onChange={e => setBulkReason(e.target.value)}
                        placeholder="Provide reason for bulk transfer..."
                        className="w-full h-20 text-sm rounded-md border border-border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-5">
                    <Button variant="outline" className="flex-1" onClick={() => setShowBulkTransfer(false)}>Cancel</Button>
                    <Button
                      className="flex-1"
                      disabled={!bulkTarget}
                      onClick={() => {
                        toast.success("Bulk transfer complete", { description: `${bulkSelectedVolunteers.length} volunteers moved to ${bulkTarget}` });
                        setBulkSelectedVolunteers([]);
                        setShowBulkTransfer(false);
                      }}
                    >
                      <Repeat2 className="w-4 h-4 mr-1.5" />
                      Transfer {bulkSelectedVolunteers.length} Volunteer{bulkSelectedVolunteers.length !== 1 ? "s" : ""}
                    </Button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ================================================================ */}
      {/* CHAT RULES TAB                                                   */}
      {/* ================================================================ */}
      {activeTab === "chat_rules" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
          {/* Header + Stats */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Chat Expiration Rules</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Configure automated chat lifecycle rules by location, time, and volume</p>
            </div>
            <Button onClick={openNewRule}>
              <Plus className="w-4 h-4 mr-1.5" />
              New Rule
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Total Rules", value: chatRules.length, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
              { label: "Active Rules", value: chatRules.filter(r => r.enabled).length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
              { label: "Total Triggers", value: chatRules.reduce((sum, r) => sum + r.triggerCount, 0), icon: Zap, color: "text-amber-600", bg: "bg-amber-500/10" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                className="bg-card p-4 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-md border border-border", stat.bg)}>
                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Rules List */}
          <div className="space-y-3">
            {chatRules.map((rule, i) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className={cn(
                  "bg-card rounded-lg border border-border p-5 transition-all",
                  !rule.enabled && "opacity-60"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="pt-0.5">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => handleToggleRule(rule.id)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-sm font-bold text-foreground">{rule.name}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-500/10 text-slate-600 border-slate-500/20">
                        {rule.region}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap mb-3">
                      {rule.conditions.map((cond, ci) => (
                        <span key={ci} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {CONDITION_FIELD_LABELS[cond.field]} {OPERATOR_LABELS[cond.operator]} {cond.value}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Last triggered: {rule.lastTriggered}</span>
                      <span>&middot;</span>
                      <span>{rule.triggerCount} triggers</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", ACTION_BADGE_STYLES[rule.action])}>
                      {rule.action}
                    </Badge>
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", PRIORITY_BADGE_STYLES[rule.priority])}>
                      {rule.priority}
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditRule(rule)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600" onClick={() => handleDeleteRule(rule.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Rule Create/Edit Modal */}
          <AnimatePresence>
            {showRuleModal && (
              <>
                <div className="fixed inset-0 bg-black/50 z-40" onClick={() => { setShowRuleModal(false); setEditingRule(null); }} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-background border border-border rounded-lg z-50 p-6 max-h-[85vh] overflow-y-auto"
                >
                  <h3 className="text-base font-bold text-foreground mb-4">{editingRule ? "Edit Rule" : "Create Rule"}</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-semibold mb-1.5">Rule Name</Label>
                      <input
                        value={ruleForm.name}
                        onChange={e => setRuleForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter rule name..."
                        className="w-full h-9 text-sm rounded-md border border-border bg-background px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold mb-2">Conditions</Label>
                      <div className="space-y-2">
                        {ruleForm.conditions.map((cond, ci) => (
                          <div key={ci} className="flex items-center gap-2">
                            <select
                              value={cond.field}
                              onChange={e => {
                                const newConds = [...ruleForm.conditions];
                                newConds[ci] = { ...newConds[ci], field: e.target.value as ChatRuleCondition["field"] };
                                setRuleForm(prev => ({ ...prev, conditions: newConds }));
                              }}
                              className="h-8 text-xs rounded-md border border-border bg-background px-2 flex-1 focus:outline-none focus:ring-1 focus:ring-primary/30"
                            >
                              <option value="location">Location</option>
                              <option value="time_inactive">Time Inactive</option>
                              <option value="volume">Volume</option>
                              <option value="channel">Channel</option>
                              <option value="language">Language</option>
                              <option value="time_of_day">Time of Day</option>
                            </select>
                            <select
                              value={cond.operator}
                              onChange={e => {
                                const newConds = [...ruleForm.conditions];
                                newConds[ci] = { ...newConds[ci], operator: e.target.value as ChatRuleCondition["operator"] };
                                setRuleForm(prev => ({ ...prev, conditions: newConds }));
                              }}
                              className="h-8 text-xs rounded-md border border-border bg-background px-2 w-[100px] focus:outline-none focus:ring-1 focus:ring-primary/30"
                            >
                              <option value="equals">equals</option>
                              <option value="greater_than">greater than</option>
                              <option value="less_than">less than</option>
                              <option value="between">between</option>
                              <option value="not_equals">not equals</option>
                            </select>
                            <input
                              value={cond.value}
                              onChange={e => {
                                const newConds = [...ruleForm.conditions];
                                newConds[ci] = { ...newConds[ci], value: e.target.value };
                                setRuleForm(prev => ({ ...prev, conditions: newConds }));
                              }}
                              placeholder="Value..."
                              className="h-8 text-xs rounded-md border border-border bg-background px-2 flex-1 focus:outline-none focus:ring-1 focus:ring-primary/30"
                            />
                            {ruleForm.conditions.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-rose-500"
                                onClick={() => {
                                  const newConds = ruleForm.conditions.filter((_, j) => j !== ci);
                                  setRuleForm(prev => ({ ...prev, conditions: newConds }));
                                }}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => setRuleForm(prev => ({ ...prev, conditions: [...prev.conditions, { field: "location", operator: "equals", value: "" }] }))}
                          className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add Condition
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold mb-1.5">Action</Label>
                      <select
                        value={ruleForm.action}
                        onChange={e => setRuleForm(prev => ({ ...prev, action: e.target.value as typeof prev.action }))}
                        className="w-full h-9 text-sm rounded-md border border-border bg-background px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary mb-2"
                      >
                        <option value="expire">Expire</option>
                        <option value="archive">Archive</option>
                        <option value="escalate">Escalate</option>
                        <option value="notify">Notify</option>
                      </select>
                      <textarea
                        value={ruleForm.actionValue}
                        onChange={e => setRuleForm(prev => ({ ...prev, actionValue: e.target.value }))}
                        placeholder="Describe the action..."
                        className="w-full h-16 text-sm rounded-md border border-border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold mb-2">Priority</Label>
                      <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
                        {(["low", "medium", "high"] as const).map(p => (
                          <button
                            key={p}
                            onClick={() => setRuleForm(prev => ({ ...prev, priority: p }))}
                            className={cn(
                              "flex-1 text-xs font-semibold py-1.5 px-3 rounded-md transition-all capitalize",
                              ruleForm.priority === p
                                ? "bg-background text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold mb-1.5">Region</Label>
                      <Select value={ruleForm.region} onValueChange={v => setRuleForm(prev => ({ ...prev, region: v }))}>
                        <SelectTrigger className="w-full h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All Regions">All Regions</SelectItem>
                          {INITIAL_REGIONS.map(r => (
                            <SelectItem key={r.name} value={r.name}>{r.flag} {r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-6">
                    <Button variant="outline" className="flex-1" onClick={() => { setShowRuleModal(false); setEditingRule(null); }}>Cancel</Button>
                    <Button className="flex-1" onClick={handleSaveRule}>
                      Save Rule
                    </Button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ================================================================ */}
      {/* PRIVACY TAB                                                      */}
      {/* ================================================================ */}
      {activeTab === "privacy" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Pending Requests", value: DATA_REQUESTS.filter(r => r.status === "pending").length, icon: FileText, color: "text-amber-600", bg: "bg-amber-500/10" },
              { label: "Avg Response Time", value: "3.2 days", icon: Clock, color: "text-primary", bg: "bg-primary/10" },
              { label: "Consent Rate", value: "97.6%", icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-500/10" },
              { label: "Compliance Score", value: "94%", icon: ShieldCheck, color: "text-violet-600", bg: "bg-violet-500/10" },
            ].map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="bg-card p-5 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn("p-2 rounded-md border border-border", kpi.bg)}>
                    <kpi.icon className={cn("w-4 h-4", kpi.color)} />
                  </div>
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{kpi.label}</p>
                <p className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
                  {typeof kpi.value === "number" ? kpi.value : kpi.value}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Privacy Sub-tabs */}
          <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
            {([
              { key: "requests" as const, label: "Requests" },
              { key: "consent" as const, label: "Consent Tracking" },
              { key: "scanner" as const, label: "PII Scanner" },
              { key: "breach" as const, label: "Breach Log" },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setPrivacyTab(tab.key)}
                className={cn(
                  "flex-1 text-xs font-semibold py-2 px-3 rounded-md transition-all",
                  privacyTab === tab.key
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Requests Sub-tab */}
          {privacyTab === "requests" && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="px-6 pt-5 pb-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Data Subject Requests</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">GDPR / data protection requests</p>
                  </div>
                  <Button size="sm" onClick={() => toast.info("New request form would open here")}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    New Request
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Submitted</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Region</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {DATA_REQUESTS.map((req, i) => (
                        <motion.tr
                          key={req.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.15, delay: i * 0.02 }}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3 font-semibold text-foreground">{req.subject}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{req.email}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0",
                              req.type === "Access" ? "bg-primary/10 text-primary border-primary/20" :
                              req.type === "Deletion" ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                              "bg-violet-500/10 text-violet-600 border-violet-500/20"
                            )}>
                              {req.type}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{req.submittedAt}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{req.region}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0",
                              req.status === "pending" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                              req.status === "in_progress" ? "bg-primary/10 text-primary border-primary/20" :
                              "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            )}>
                              {req.status === "in_progress" ? "In Progress" : req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center gap-1 justify-end">
                              {req.status !== "completed" && (
                                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5" onClick={() => toast.info("Processing request...")}>
                                  Process
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2" onClick={() => toast.info("Viewing request details...")}>
                                <Eye className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Consent Tracking Sub-tab */}
          {privacyTab === "consent" && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CONSENT_STATS.map((stat, i) => (
                  <motion.div
                    key={stat.category}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.04 }}
                    className="bg-card rounded-lg border border-border p-5"
                  >
                    <h4 className="text-sm font-bold text-foreground mb-1">{stat.category}</h4>
                    <p className="text-xs text-muted-foreground mb-3">{stat.consented.toLocaleString()} / {stat.total.toLocaleString()} users</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Consent rate</span>
                        <span className={cn("font-bold", stat.pct >= 90 ? "text-emerald-600" : stat.pct >= 70 ? "text-amber-600" : "text-rose-600")}>{stat.pct}%</span>
                      </div>
                      <Progress value={stat.pct} className="h-2" />
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 border border-border">
                <Calendar className="w-3.5 h-3.5" />
                <span>Last consent audit: July 15, 2026</span>
              </div>
            </motion.div>
          )}

          {/* PII Scanner Sub-tab */}
          {privacyTab === "scanner" && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="space-y-4">
              <div className="bg-card rounded-lg border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">PII Scanner Status</h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span>Last scan: July 28, 2026 at 03:00 AM</span>
                      <span>&middot;</span>
                      <span>Next scheduled: July 29, 2026 at 03:00 AM</span>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => toast.info("Manual scan initiated...")}>
                    <ScanLine className="w-3.5 h-3.5 mr-1.5" />
                    Run Manual Scan
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { type: "Email Addresses", count: "1,247 records", icon: Mail, color: "text-primary", bg: "bg-primary/10" },
                  { type: "Phone Numbers", count: "834 records", icon: Phone, color: "text-violet-600", bg: "bg-violet-500/10" },
                  { type: "Location Data", count: "2,103 records", icon: MapPinned, color: "text-amber-600", bg: "bg-amber-500/10" },
                ].map((finding, i) => (
                  <motion.div
                    key={finding.type}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.04 }}
                    className="bg-card rounded-lg border border-border p-5"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn("p-2 rounded-md border border-border", finding.bg)}>
                        <finding.icon className={cn("w-4 h-4", finding.color)} />
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">{finding.type}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 mb-4">{finding.count}</p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5" onClick={() => toast.info(`Reviewing ${finding.type}...`)}>
                        <Eye className="w-3 h-3 mr-1" />
                        Review
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5 text-rose-600 border-rose-500/30 hover:bg-rose-500/10" onClick={() => toast.info(`Redacting all ${finding.type}...`)}>
                        <ShieldAlert className="w-3 h-3 mr-1" />
                        Redact All
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Breach Log Sub-tab */}
          {privacyTab === "breach" && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="px-6 pt-5 pb-4 border-b border-border">
                  <h3 className="text-sm font-bold text-foreground">Breach / Incident Log</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Security incidents and data breach records</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Severity</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Affected</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resolution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {BREACH_LOG.map((breach, i) => (
                        <motion.tr
                          key={breach.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.15, delay: i * 0.02 }}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3 text-muted-foreground text-xs">{breach.date}</td>
                          <td className="px-4 py-3 font-semibold text-foreground text-xs">{breach.type}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0",
                              breach.severity === "High" ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                              breach.severity === "Medium" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                              "bg-slate-500/10 text-slate-600 border-slate-500/20"
                            )}>
                              {breach.severity}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{breach.affected} records</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              {breach.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs max-w-[250px] truncate" title={breach.resolution}>
                            {breach.resolution}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Regulatory Compliance Checklist */}
          <div className="bg-card rounded-lg border border-border p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">Regulatory Compliance Checklist</h3>
            <div className="space-y-3">
              {[
                { label: "Data processing agreements signed (GDPR Art. 28)", checked: true },
                { label: "Privacy impact assessment completed", checked: true },
                { label: "Data retention policy documented", checked: true },
                { label: "Breach notification procedures established", checked: true },
                { label: "Right to erasure process implemented", checked: true },
                { label: "Annual privacy audit scheduled (Due: October 2026)", checked: false },
                { label: "Cross-border data transfer safeguards", checked: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded border flex items-center justify-center shrink-0",
                    item.checked
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                      : "bg-muted/30 border-border text-muted-foreground"
                  )}>
                    {item.checked ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span className={cn("text-sm", item.checked ? "text-foreground" : "text-muted-foreground")}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ================================================================ */}
      {/* Slide-over Drawers                                               */}
      {/* ================================================================ */}
      <AnimatePresence>
        {selectedApproval && (
          <ApprovalDrawer
            key={selectedApproval.id}
            item={selectedApproval}
            onClose={() => setSelectedApproval(null)}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedIssue && (
          <InvestigationDrawer
            key={selectedIssue.id}
            issue={selectedIssue}
            onClose={() => setSelectedIssue(null)}
            onUpdateStatus={handleUpdateIssueStatus}
            onResolve={handleResolveIssue}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedRegion && (
          <RegionDrawer
            key={selectedRegion.name}
            region={selectedRegion}
            onClose={() => setSelectedRegion(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
