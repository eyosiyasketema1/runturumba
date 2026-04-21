import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Search, Send, MessageSquare, MessageCircle, Check, CheckCheck,
  Phone, Mail, Info, X, GitBranch, SquarePen,
  User as UserIcon, UserPlus, UserCheck, CheckCircle2, XCircle,
  Clock, Tag, MoreHorizontal, Paperclip, Smile, Lock,
  ChevronDown, ArrowUp, Filter, Circle, Plus, Calendar,
  FileText, BookOpen, Sparkles, RefreshCw, ChevronRight, AlertCircle,
  Zap, ListOrdered, Library, Hand, Timer,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  cn,
  type Contact, type Message, type ContactNote, type User,
  type MessagePort, type ChatEndpoint, type ConversationRule,
  type Group, type TeamGroup,
  type FaithJourney, type ContactMilestones, type Match, type ContentRow,
  type MilestoneKey,
  formatTimeAgo,
} from "./types";
import { RoutingRulesPanel } from "./routing-rules-panel";

// ─── Local Types ──────────────────────────────────────────────────────────────

type ConvStatus   = "open" | "assigned" | "pending" | "resolved" | "closed";
type ConvPriority = "low" | "normal" | "high" | "urgent";
type InboxFilter  = "all" | ConvStatus;

interface ConvMeta {
  status:     ConvStatus;
  priority:   ConvPriority;
  assigneeId: string | null;
  labels:     string[];
  unreadCount:number;
}

interface LocalItem {
  id:        string;
  contactId: string;
  type:      "note" | "system";
  content:   string;
  senderId?: string;
  createdAt: string;
}

interface ThreadEntry {
  id:          string;
  type:        "message" | "note" | "system";
  content:     string;
  senderType?: "user" | "contact";
  senderId?:   string;
  createdAt:   string;
  status?:     string;
  port?:       MessagePort;
}

// ─── Reassignment & Forms Types ──────────────────────────────────────────────

type ReassignmentStatus = "pending" | "approved" | "rejected";

interface ReassignmentRequest {
  id: string;
  contactId: string;
  fromMentorId: string;
  reason: string;
  status: ReassignmentStatus;
  createdAt: string;
}

// Maturity levels — the mentor can change a seeker's maturity stage from the profile panel.
const MATURITY_OPTIONS: { id: string; label: string; dot: string }[] = [
  { id: "Interested",   label: "Interested",   dot: "bg-blue-500" },
  { id: "Pre-Seeker",   label: "Pre-Seeker",   dot: "bg-slate-400" },
  { id: "Seeker",       label: "Seeker",       dot: "bg-amber-500" },
  { id: "New Believer", label: "New Believer", dot: "bg-sky-500" },
  { id: "Growing",      label: "Growing",      dot: "bg-emerald-500" },
  { id: "Mature",       label: "Mature",       dot: "bg-violet-500" },
  { id: "Leader",       label: "Leader",       dot: "bg-rose-500" },
];

const FORM_TEMPLATES = [
  { id: "intake",     label: "Intake Form",        desc: "Collect basic info, spiritual background, and contact preferences",       icon: FileText },
  { id: "assessment", label: "Faith Assessment",    desc: "5-question check-in to gauge current spiritual engagement",               icon: CheckCircle2 },
  { id: "prayer",     label: "Prayer Request Form", desc: "Structured form for submitting prayer requests with follow-up option",    icon: BookOpen },
  { id: "feedback",   label: "Mentor Feedback",     desc: "Short survey about their experience with their assigned mentor",          icon: UserCheck },
];

const CONTENT_SERIES = [
  { id: "foundations",   label: "Foundations of Faith",   lessons: 7,  desc: "Core beliefs and first steps for new believers" },
  { id: "prayer_basics", label: "Prayer Basics",          lessons: 5,  desc: "Learning to build a consistent prayer life" },
  { id: "bible_101",     label: "Bible 101",              lessons: 10, desc: "How to read, understand, and apply Scripture" },
  { id: "community",     label: "Finding Community",      lessons: 4,  desc: "Connecting with a faith community and small groups" },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { id: ConvStatus; label: string; cls: string }[] = [
  { id: "open",     label: "Open",     cls: "text-blue-600 bg-blue-500/10 border-blue-500/30" },
  { id: "assigned", label: "Assigned", cls: "text-violet-600 bg-violet-500/10 border-violet-500/30" },
  { id: "pending",  label: "Pending",  cls: "text-amber-600 bg-amber-500/10 border-amber-500/30" },
  { id: "resolved", label: "Resolved", cls: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30" },
  { id: "closed",   label: "Closed",   cls: "text-muted-foreground bg-muted border-border" },
];

const PRIORITY_OPTIONS: { id: ConvPriority; label: string; dot: string; text: string }[] = [
  { id: "urgent", label: "Urgent", dot: "bg-red-500",    text: "text-red-600" },
  { id: "high",   label: "High",   dot: "bg-orange-400", text: "text-orange-500" },
  { id: "normal", label: "Normal", dot: "bg-blue-400",   text: "text-blue-600" },
  { id: "low",    label: "Low",    dot: "bg-gray-400",   text: "text-muted-foreground" },
];

const PORT_COLORS: Record<string, string> = {
  whatsapp: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  sms:      "bg-blue-500/10 text-blue-600 border-blue-500/20",
  telegram: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  email:    "bg-purple-500/10 text-purple-600 border-purple-500/20",
  messenger:"bg-blue-400/10 text-blue-500 border-blue-400/20",
};

const CHANNEL_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp", sms: "SMS", telegram: "Telegram",
  email: "Email", messenger: "Messenger", smpp: "SMPP",
};

// Per-channel accent strips used for the left side-stripe in the header
const CHANNEL_ACCENT: Record<string, string> = {
  whatsapp: "bg-emerald-500",
  sms:      "bg-slate-400",
  telegram: "bg-sky-500",
  email:    "bg-purple-500",
  messenger:"bg-blue-500",
};

// ─── ChannelBadge ─────────────────────────────────────────────────────────────

function channelIcon(port: string, cls = "w-3 h-3") {
  if (port === "email")    return <Mail          className={cls} />;
  if (port === "sms")      return <MessageSquare className={cls} />;
  if (port === "telegram") return <Send          className={cls} />;
  return                          <MessageCircle className={cls} />; // whatsapp, messenger, default
}

function ChannelBadge({ port, size = "sm" }: { port: string; size?: "sm" | "md" | "lg" }) {
  const colorCls = PORT_COLORS[port] ?? "bg-muted text-muted-foreground border-border";
  if (size === "lg") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 border text-xs font-bold uppercase tracking-wide", colorCls)}>
        {channelIcon(port, "w-3.5 h-3.5")}
        {CHANNEL_LABEL[port] ?? port}
      </span>
    );
  }
  if (size === "md") {
    return (
      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 border text-xs font-bold uppercase tracking-wide", colorCls)}>
        {channelIcon(port, "w-3 h-3")}
        {CHANNEL_LABEL[port] ?? port}
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 border text-xs font-bold uppercase tracking-wide", colorCls)}>
      {channelIcon(port, "w-2.5 h-2.5")}
      {CHANNEL_LABEL[port] ?? port}
    </span>
  );
}

const PRIORITY_BORDER: Record<ConvPriority, string> = {
  urgent: "border-l-red-500",
  high:   "border-l-orange-400",
  normal: "border-l-transparent",
  low:    "border-l-transparent",
};

const COMMON_LABELS = ["Support", "Sales", "Billing", "Technical", "VIP", "Feedback", "Bug"];
const COMMON_EMOJIS = ["😊","👍","🙏","❤️","😅","🎉","🤔","😢","✅","🚀","💡","⚠️","🔥","📞","📧","✨","💬","🎯","👋","🙌"];
const DEFAULT_META: ConvMeta = { status: "open", priority: "normal", assigneeId: null, labels: [], unreadCount: 0 };

// ─── Grab Conversation — 10-minute window ────────────────────────────────────
const GRAB_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/** Hook that ticks every second and returns remaining seconds until deadline. Returns 0 when expired. */
function useCountdown(deadline: number | null) {
  const [remaining, setRemaining] = useState(() => {
    if (!deadline) return 0;
    return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  });
  useEffect(() => {
    if (!deadline) { setRemaining(0); return; }
    const tick = () => setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  return remaining;
}

function formatCountdown(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Small grab countdown badge used in the inbox list & banner */
function GrabCountdownBadge({ deadline }: { deadline: number }) {
  const remaining = useCountdown(deadline);
  if (remaining <= 0) return null;
  const pct = remaining / (GRAB_WINDOW_MS / 1000);
  const isUrgent = remaining <= 120; // last 2 min
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs font-bold tabular-nums px-1.5 py-0.5 rounded-sm",
      isUrgent ? "bg-red-500/10 text-red-600" : "bg-amber-500/10 text-amber-600"
    )}>
      <Timer className="w-3 h-3" />
      {formatCountdown(remaining)}
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getPresence = (userId: string): "online" | "away" | "offline" =>
  (["online", "away", "offline"] as const)[userId.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 3];

const PRESENCE_DOT: Record<string, string> = {
  online: "bg-green-500", away: "bg-amber-400", offline: "bg-gray-400",
};

// ─── TypingIndicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-5 py-2">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map(i => (
          <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground italic">Visitor is typing…</span>
    </div>
  );
}

// ─── ThreadMessage ────────────────────────────────────────────────────────────

function ThreadMessage({ entry }: { entry: ThreadEntry }) {
  if (entry.type === "system") {
    return (
      <div className="flex items-center gap-3 py-2.5 px-5">
        <div className="flex-1 h-px bg-border/60" />
        <span className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest whitespace-nowrap px-3">
          {entry.content}
        </span>
        <div className="flex-1 h-px bg-border/60" />
      </div>
    );
  }
  if (entry.type === "note") {
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center px-5 py-1.5">
        <div className="max-w-[80%] w-full bg-amber-50 border border-amber-200/80 px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Lock className="w-3 h-3 text-amber-600" />
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Internal Note</span>
          </div>
          <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">{entry.content}</p>
          <span className="text-xs text-amber-600/60 mt-1.5 block">
            {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </motion.div>
    );
  }
  const isAgent = entry.senderType === "user";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={cn("flex w-full px-5 py-0.5", isAgent ? "justify-end" : "justify-start")}
    >
      <div className={cn("max-w-[68%] flex flex-col", isAgent ? "items-end" : "items-start")}>
        <div className={cn(
          "px-4 py-2.5 text-sm shadow-sm border",
          isAgent
            ? "bg-primary text-primary-foreground border-primary rounded-2xl rounded-tr-none"
            : "bg-card text-foreground border-border rounded-2xl rounded-tl-none"
        )}>
          <p className="whitespace-pre-wrap leading-relaxed">{entry.content}</p>
        </div>
        <div className={cn("flex items-center gap-1.5 mt-1 px-1", isAgent ? "justify-end" : "justify-start")}>
          {entry.port && !isAgent && (
            <ChannelBadge port={entry.port} size="sm" />
          )}
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider opacity-60">
            {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {isAgent && (
            <span className="opacity-50">
              {entry.status === "delivered" || entry.status === "read"
                ? <CheckCheck className="w-3 h-3 text-primary" />
                : <Check className="w-3 h-3" />}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── InboxListItem ────────────────────────────────────────────────────────────

const InboxListItem = React.memo(function InboxListItem({
  contact, lastMsg, meta, isActive, onClick, users, grabDeadline, onGrab,
}: {
  contact:  Contact;
  lastMsg:  Message | undefined;
  meta:     ConvMeta;
  isActive: boolean;
  onClick:  () => void;
  users:    User[];
  grabDeadline?: number | null;
  onGrab?:  (contactId: string) => void;
}) {
  const assignee    = users.find(u => u.id === meta.assigneeId);
  const priorityOpt = PRIORITY_OPTIONS.find(p => p.id === meta.priority)!;
  const statusOpt   = STATUS_OPTIONS.find(s => s.id === meta.status)!;
  const isGrabbable = !!grabDeadline && grabDeadline > Date.now() && !meta.assigneeId;

  return (
    <button onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3.5 px-4 py-4 text-left border-b border-border/50 transition-all border-l-[3px]",
        isActive
          ? "bg-primary/5 border-l-primary"
          : isGrabbable
            ? "bg-amber-50/60 border-l-amber-400 hover:bg-amber-50"
            : cn("hover:bg-muted/40", PRIORITY_BORDER[meta.priority])
      )}
    >
      {/* Avatar with assignee overlay */}
      <div className="relative shrink-0">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center border text-sm font-bold shadow-sm",
          isActive ? "bg-primary text-primary-foreground border-primary"
            : isGrabbable ? "bg-amber-100 text-amber-700 border-amber-300"
            : "bg-muted text-muted-foreground border-border"
        )}>
          {contact.name.charAt(0)}
        </div>
        {assignee && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center text-[8px] font-bold text-white border-2 border-background">
            {assignee.name.charAt(0)}
          </div>
        )}
        {isGrabbable && !assignee && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center border-2 border-background">
            <Hand className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Row 1: name + time + unread */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className={cn("text-sm font-bold truncate", isActive ? "text-primary" : "text-foreground")}>
            {contact.name}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {isGrabbable && <GrabCountdownBadge deadline={grabDeadline!} />}
            {lastMsg && (
              <span className="text-xs font-semibold text-muted-foreground">
                {formatTimeAgo(lastMsg.createdAt)}
              </span>
            )}
            {meta.unreadCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {meta.unreadCount}
              </span>
            )}
          </div>
        </div>

        {/* Row 2: channel badge — prominent, right under name */}
        {lastMsg?.port && (
          <div className="mb-1.5">
            <ChannelBadge port={lastMsg.port} size="md" />
          </div>
        )}

        {/* Row 3: last message preview */}
        <p className="text-xs text-muted-foreground truncate leading-relaxed">
          {lastMsg?.content ?? "No messages yet"}
        </p>

        {/* Row 4: status + priority + grab button */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <span className={cn("text-xs font-bold px-2 py-0.5 border", statusOpt.cls)}>
            {statusOpt.label}
          </span>
          {meta.priority !== "normal" && (
            <span className={cn("flex items-center gap-1 text-xs font-bold uppercase", priorityOpt.text)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", priorityOpt.dot)} />
              {priorityOpt.label}
            </span>
          )}
          {isGrabbable && onGrab && (
            <span
              role="button"
              onClick={e => { e.stopPropagation(); onGrab(contact.id); }}
              className="ml-auto inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-amber-500 text-white hover:bg-amber-600 transition-colors rounded-sm cursor-pointer shadow-sm"
            >
              <Hand className="w-3 h-3" />
              Grab
            </span>
          )}
        </div>
      </div>
    </button>
  );
});

// ─── ConversationControlBar ───────────────────────────────────────────────────

function ConversationControlBar({
  contact, meta, users, port, openDropdown, setOpenDropdown,
  onUpdateMeta, onAddSystem, onToggleInfo, isInfoOpen, isAgent,
}: {
  contact:          Contact;
  meta:             ConvMeta;
  users:            User[];
  port?:            string;
  openDropdown:     string | null;
  setOpenDropdown:  (v: string | null) => void;
  onUpdateMeta:     (u: Partial<ConvMeta>) => void;
  onAddSystem:      (content: string) => void;
  onToggleInfo:     () => void;
  isInfoOpen:       boolean;
  isAgent?:         boolean;
}) {
  const assignee    = users.find(u => u.id === meta.assigneeId);
  const statusOpt   = STATUS_OPTIONS.find(s => s.id === meta.status)!;
  const priorityOpt = PRIORITY_OPTIONS.find(p => p.id === meta.priority)!;
  const toggle      = (name: string) => setOpenDropdown(openDropdown === name ? null : name);

  return (
    <div className="shrink-0 border-b border-border bg-background">
      {/* Channel accent stripe */}
      {port && (
        <div className={cn("h-0.5 w-full", CHANNEL_ACCENT[port] ?? "bg-primary")} />
      )}

      {/* Top row: contact identity + channel badge */}
      <div className="px-5 pt-3 pb-0 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
            {contact.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-foreground leading-tight">{contact.name}</h3>
              {port && <ChannelBadge port={port} size="md" />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{contact.phone || contact.email}</p>
          </div>
        </div>
        <button onClick={onToggleInfo}
          className={cn("p-2 transition-colors shrink-0", isInfoOpen ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted")}
          title="Contact info"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Controls row */}
      <div className="px-5 pt-2 pb-3 flex items-center gap-1.5 flex-wrap">

        {/* Assign — hidden in Agent mode */}
        {!isAgent && (
          <div className="relative">
            <button onClick={() => toggle("ctrl-assign")}
              className="flex items-center gap-1.5 h-8 px-3 border border-border text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
            >
              <UserPlus className="w-3 h-3 text-muted-foreground" />
              {assignee ? assignee.name.split(" ")[0] : "Assign"}
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
            {openDropdown === "ctrl-assign" && (
              <div className="absolute top-full left-0 z-50 mt-1 w-52 bg-background border border-border shadow-xl">
                <div className="px-3 py-2 border-b border-border">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Assign Agent</span>
                </div>
                <button onClick={() => { onUpdateMeta({ assigneeId: null, status: "open" }); onAddSystem("Conversation unassigned"); setOpenDropdown(null); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" /> Unassign
                </button>
                {users.filter(u => u.status === "active").map(u => {
                  const pr = getPresence(u.id);
                  return (
                    <button key={u.id}
                      onClick={() => { onUpdateMeta({ assigneeId: u.id, status: "assigned" }); onAddSystem(`Assigned to ${u.name}`); setOpenDropdown(null); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/50 transition-colors"
                    >
                      <div className="relative shrink-0">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {u.name.charAt(0)}
                        </div>
                        <div className={cn("absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-background", PRESENCE_DOT[pr])} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{pr} · {u.role}</p>
                      </div>
                      {meta.assigneeId === u.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Status */}
        <div className="relative">
          <button onClick={() => toggle("ctrl-status")}
            className={cn("flex items-center gap-1.5 h-8 px-3 border text-xs font-bold transition-colors", statusOpt.cls)}
          >
            {meta.status === "open"     && <Circle className="w-2.5 h-2.5" />}
            {meta.status === "assigned" && <UserCheck className="w-2.5 h-2.5" />}
            {meta.status === "pending"  && <Clock className="w-2.5 h-2.5" />}
            {meta.status === "resolved" && <CheckCircle2 className="w-2.5 h-2.5" />}
            {meta.status === "closed"   && <XCircle className="w-2.5 h-2.5" />}
            {statusOpt.label}
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>
          {openDropdown === "ctrl-status" && (
            <div className="absolute top-full left-0 z-50 mt-1 w-40 bg-background border border-border shadow-xl">
              {STATUS_OPTIONS.map(s => (
                <button key={s.id}
                  onClick={() => { onUpdateMeta({ status: s.id }); onAddSystem(`Status changed to ${s.label}`); setOpenDropdown(null); }}
                  className={cn("w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold hover:bg-muted/50 transition-colors", s.id === meta.status && "bg-muted/30")}
                >
                  <span className={cn("px-2 py-0.5 border text-xs font-bold", s.cls)}>{s.label}</span>
                  {s.id === meta.status && <Check className="w-3 h-3 text-primary ml-auto" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Priority */}
        <div className="relative">
          <button onClick={() => toggle("ctrl-priority")}
            className="flex items-center gap-1.5 h-8 px-3 border border-border text-xs font-semibold hover:bg-muted/50 transition-colors"
          >
            <span className={cn("w-2 h-2 rounded-full shrink-0", priorityOpt.dot)} />
            <span className={priorityOpt.text}>{priorityOpt.label}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
          {openDropdown === "ctrl-priority" && (
            <div className="absolute top-full left-0 z-50 mt-1 w-36 bg-background border border-border shadow-xl">
              {PRIORITY_OPTIONS.map(p => (
                <button key={p.id}
                  onClick={() => { onUpdateMeta({ priority: p.id }); onAddSystem(`Priority set to ${p.label}`); setOpenDropdown(null); }}
                  className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold hover:bg-muted/50 transition-colors", p.id === meta.priority && "bg-muted/30")}
                >
                  <span className={cn("w-2 h-2 rounded-full shrink-0", p.dot)} />
                  <span className={p.text}>{p.label}</span>
                  {p.id === meta.priority && <Check className="w-3 h-3 text-primary ml-auto" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Labels */}
        <div className="relative">
          <button onClick={() => toggle("ctrl-labels")}
            className="flex items-center gap-1.5 h-8 px-3 border border-border text-xs font-semibold text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <Tag className="w-3 h-3" />
            {meta.labels.length > 0 ? (
              <>
                {meta.labels.slice(0, 2).join(", ")}
                {meta.labels.length > 2 && <span className="text-primary ml-1">+{meta.labels.length - 2}</span>}
              </>
            ) : "Labels"}
          </button>
          {openDropdown === "ctrl-labels" && (
            <div className="absolute top-full left-0 z-50 mt-1 w-48 bg-background border border-border shadow-xl p-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Toggle Labels</p>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_LABELS.map(label => {
                  const active = meta.labels.includes(label);
                  return (
                    <button key={label}
                      onClick={() => onUpdateMeta({ labels: active ? meta.labels.filter(l => l !== label) : [...meta.labels, label] })}
                      className={cn("text-xs font-bold px-2 py-1 border transition-colors", active ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary")}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* More actions */}
        <div className="relative ml-auto">
          <button onClick={() => toggle("ctrl-more")} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {openDropdown === "ctrl-more" && (
            <div className="absolute top-full right-0 z-50 mt-1 w-44 bg-background border border-border shadow-xl py-1">
              {[
                { label: "Mark as unread", fn: () => toast.info("Marked as unread"), adminOnly: false },
                { label: "Star conversation", fn: () => toast.info("Starred"), adminOnly: false },
                { label: "Export transcript", fn: () => toast.info("Exporting transcript…"), adminOnly: true },
                { label: "Merge conversation", fn: () => toast.info("Feature coming soon"), adminOnly: true },
                { label: "Delete conversation", fn: () => toast.error("Conversation deleted"), adminOnly: true },
              ].filter(item => !isAgent || !item.adminOnly).map(item => (
                <button key={item.label} onClick={() => { item.fn(); setOpenDropdown(null); }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ConversationContextPanel (Tabbed) ────────────────────────────────────────

type InfoTab = "profile" | "journey" | "milestones" | "match" | "notes";

const INFO_TABS: { id: InfoTab; label: string }[] = [
  { id: "profile",    label: "Profile" },
  { id: "journey",    label: "Journey" },
  { id: "milestones", label: "Milestones" },
  { id: "match",      label: "Match" },
  { id: "notes",      label: "Notes" },
];

const MATURITY_COLORS: Record<string, string> = {
  "Interested":   "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  "Pre-Seeker":   "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
  "Seeker":       "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  "New Believer": "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  "Growing":      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  "Mature":       "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
  "Leader":       "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
};

const STAGE_COLORS: Record<string, string> = {
  "Touchpoint":      "bg-slate-100 text-slate-700",
  "Engaged":         "bg-sky-50 text-sky-700",
  "Active Journey":  "bg-emerald-50 text-emerald-700",
  "Decision":        "bg-violet-50 text-violet-700",
};

const MS_STATE_CLS: Record<string, { bg: string; ring: string; icon: string }> = {
  done:     { bg: "bg-emerald-50", ring: "ring-emerald-200", icon: "text-emerald-600" },
  progress: { bg: "bg-amber-50",   ring: "ring-amber-200",   icon: "text-amber-600" },
  pending:  { bg: "bg-slate-50",   ring: "ring-slate-200",   icon: "text-slate-400" },
};

function ConversationContextPanel({
  contact, meta, users, systemItems, onClose,
  messages = [], notes = [], groups = [],
  faithJourneys = [], contactMilestones = [], matches = [],
  onUpdateContact, onUpdateJourney, onLogMilestone, onAddNote, onDeleteNote,
  reassignRequests = [], onRequestReassign, viewMode, onApproveReassign, onRejectReassign,
}: {
  contact:     Contact;
  meta:        ConvMeta;
  users:       User[];
  systemItems: LocalItem[];
  onClose:     () => void;
  messages?:    Message[];
  notes?:       ContactNote[];
  groups?:      Group[];
  faithJourneys?:     FaithJourney[];
  contactMilestones?: ContactMilestones[];
  matches?:           Match[];
  onUpdateContact?:   (id: string, data: Partial<Contact>) => void;
  onUpdateJourney?:   (id: string, data: Partial<FaithJourney>) => void;
  onLogMilestone?:    (contactId: string, key: string, date: string, sub: string[]) => void;
  onAddNote?:         (content: string, contactId: string) => void;
  onDeleteNote?:      (id: string) => void;
  onRequestReassign?: (contactId: string, reason: string) => void;
  reassignRequests?:  ReassignmentRequest[];
  viewMode?:          string;
  onApproveReassign?: (reqId: string, newMentorId: string) => void;
  onRejectReassign?:  (reqId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<InfoTab>("profile");
  const [newNote, setNewNote] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [reassignReason, setReassignReason] = useState("");
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [selectedNewMentor, setSelectedNewMentor] = useState<string>("");

  const contactMessages = messages.filter(m => m.contactId === contact.id);
  const contactNotes = notes.filter(n => n.contactId === contact.id);
  const journey = faithJourneys.find(j => j.contactId === contact.id);
  const milestoneRecord = contactMilestones.find(m => m.contactId === contact.id);
  const contactMatches = matches.filter(m => m.seekerContactId === contact.id || m.mentorUserId === contact.id);
  const contactGroups = (contact.groupIds || []).map(gid => groups.find(g => g.id === gid)).filter(Boolean);
  const assignedMentor = contact.assignedMentorId ? users.find(u => u.id === contact.assignedMentorId) : null;

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    if (onAddNote) onAddNote(newNote.trim(), contact.id);
    setNewNote("");
  };

  const filteredNotes = filterDate
    ? contactNotes.filter(note => new Date(note.createdAt).toISOString().slice(0, 10) === filterDate)
    : contactNotes;

  return (
    <div className="w-[576px] border-l border-border bg-card flex flex-col shrink-0 h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/10 shrink-0">
        <span className="text-sm font-bold text-foreground">Contact Info</span>
        <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Compact profile header (always visible) — includes seeker status control */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border shrink-0">
        <div className="w-12 h-12 rounded-full bg-muted border-2 border-border flex items-center justify-center text-lg font-bold text-foreground shrink-0">
          {contact.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-foreground truncate">{contact.name}</h2>
          <p className="text-xs text-muted-foreground truncate">{contact.phone}{contact.email ? ` · ${contact.email}` : ""}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Maturity dropdown — mentor can change the seeker's maturity level */}
          <div className="relative">
            <button
              onClick={() => setIsStatusOpen(!isStatusOpen)}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold cursor-pointer transition-all",
                MATURITY_COLORS[contact.maturity || "Seeker"]
              )}
            >
              {contact.maturity || "Seeker"}
              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            </button>
            {isStatusOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsStatusOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-background border border-border shadow-xl rounded-sm py-1">
                  <div className="px-3 py-1.5 border-b border-border">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Maturity</span>
                  </div>
                  {MATURITY_OPTIONS.map(opt => {
                    const isActive = (contact.maturity || "Seeker") === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          if (onUpdateContact) {
                            onUpdateContact(contact.id, { maturity: opt.id as any });
                            toast.success(`Maturity changed to ${opt.label}`);
                          }
                          setIsStatusOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors",
                          isActive ? "bg-muted/50" : "hover:bg-muted/30"
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", opt.dot)} />
                        <span className={isActive ? "text-foreground" : "text-muted-foreground"}>{opt.label}</span>
                        {isActive && <Check className="w-3 h-3 text-primary ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0.5 px-4 py-1.5 border-b border-border bg-muted/20 shrink-0 overflow-x-auto no-scrollbar">
        {INFO_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-sm transition-all whitespace-nowrap",
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">

        {/* ──── PROFILE TAB ──── */}
        {activeTab === "profile" && (
          <div className="space-y-0">
            {/* Stats Row */}
            <div className="grid grid-cols-4 border-b border-border">
              {[
                { label: "Msgs", value: contactMessages.length },
                { label: "Groups", value: contactGroups.length },
                { label: "Notes", value: contactNotes.length },
                { label: "Engage", value: contact.engagement != null ? `${contact.engagement}%` : "—" },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center py-3 border-r border-border last:border-r-0">
                  <span className="text-lg font-bold text-primary">{s.value}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Contact details */}
            <div className="px-6 py-4 border-b border-border space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground text-xs">Phone</span><p className="font-medium text-foreground mt-0.5">{contact.phone}</p></div>
                <div><span className="text-muted-foreground text-xs">Email</span><p className="font-medium text-foreground mt-0.5 truncate">{contact.email || "—"}</p></div>
                <div><span className="text-muted-foreground text-xs">Language</span><p className="font-medium text-foreground mt-0.5">{contact.preferredLanguage || "—"}</p></div>
                <div><span className="text-muted-foreground text-xs">Status</span><p className="font-medium text-foreground mt-0.5">{contact.discipleshipStatus || "—"}</p></div>
                <div><span className="text-muted-foreground text-xs">Mentor</span><p className="font-medium text-foreground mt-0.5">{assignedMentor?.name || "Unassigned"}</p></div>
                <div><span className="text-muted-foreground text-xs">Since</span><p className="font-medium text-foreground mt-0.5">{new Date(contact.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p></div>
              </div>
            </div>

            {/* Engagement bar */}
            {contact.engagement != null && (
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Engagement</span>
                  <span className="text-xs font-bold text-foreground">{contact.engagement}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", contact.engagement >= 75 ? "bg-emerald-500" : contact.engagement >= 50 ? "bg-amber-500" : "bg-rose-500")}
                    style={{ width: `${contact.engagement}%` }}
                  />
                </div>
              </div>
            )}

            {/* Groups and Tags */}
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">Groups & Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {contactGroups.map((g: any) => (
                  <span key={g.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {g.name}
                  </span>
                ))}
                {meta.labels.map(label => (
                  <span key={label} className="px-2 py-0.5 bg-muted border border-border rounded-sm text-[11px] font-medium text-foreground">{label}</span>
                ))}
                {(contact.tags || []).map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-sm text-[11px] font-medium text-primary">#{tag}</span>
                ))}
                {contactGroups.length === 0 && meta.labels.length === 0 && (!contact.tags || contact.tags.length === 0) && (
                  <span className="text-xs text-muted-foreground italic">No groups or tags</span>
                )}
              </div>
            </div>

            {/* Reassignment Section */}
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mentor Assignment</h3>
              </div>

              {/* Current mentor display */}
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-sm border border-border mb-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {assignedMentor ? assignedMentor.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "—"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{assignedMentor?.name || "No mentor assigned"}</p>
                  {assignedMentor?.mentorProfile && (
                    <p className="text-[11px] text-muted-foreground">{assignedMentor.mentorProfile.specialty} · {assignedMentor.mentorProfile.experience}</p>
                  )}
                </div>
              </div>

              {/* Pending reassignment requests */}
              {(reassignRequests || []).filter(r => r.contactId === contact.id && r.status === "pending").map(req => {
                const fromMentor = users.find(u => u.id === req.fromMentorId);
                const mentorUsers = users.filter(u => u.mentorProfile && u.id !== req.fromMentorId);
                return (
                  <div key={req.id} className="bg-amber-50 border border-amber-200 rounded-sm p-3 mb-3 space-y-2.5">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-amber-800">Reassignment Pending</p>
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          Requested by {fromMentor?.name || "Unknown"}: "{req.reason}"
                        </p>
                        <p className="text-[10px] text-amber-600 mt-1">{formatTimeAgo(req.createdAt)}</p>
                      </div>
                    </div>

                    {/* Mentor Coach controls — only visible to mentor_coach / admin / super_admin */}
                    {(viewMode === "mentor_coach" || viewMode === "admin" || viewMode === "super_admin") && (
                      <div className="pt-2 border-t border-amber-200 space-y-2">
                        <label className="text-[11px] font-semibold text-amber-800 block">Assign to new mentor</label>
                        <select
                          value={selectedNewMentor}
                          onChange={e => setSelectedNewMentor(e.target.value)}
                          className="w-full h-8 px-2 text-xs border border-amber-300 bg-white rounded-sm outline-none focus:ring-1 focus:ring-amber-400"
                        >
                          <option value="">Select a mentor…</option>
                          {mentorUsers.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.name} {u.mentorProfile ? `(${u.mentorProfile.capacity}, ${u.mentorProfile.specialty})` : ""}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (!selectedNewMentor) { toast.error("Please select a mentor"); return; }
                              if (onApproveReassign) onApproveReassign(req.id, selectedNewMentor);
                              setSelectedNewMentor("");
                            }}
                            disabled={!selectedNewMentor}
                            className={cn(
                              "flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-sm transition-all",
                              selectedNewMentor
                                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                : "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Approve & Assign
                          </button>
                          <button
                            onClick={() => { if (onRejectReassign) onRejectReassign(req.id); }}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-sm transition-all"
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Request reassignment form */}
              {!isReassignOpen ? (
                <button
                  onClick={() => setIsReassignOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/50 border border-dashed border-border rounded-sm transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Request Reassignment
                </button>
              ) : (
                <div className="bg-muted/20 border border-border rounded-sm p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">Request Reassignment</p>
                    <button onClick={() => { setIsReassignOpen(false); setReassignReason(""); }}
                      className="p-0.5 text-muted-foreground hover:text-foreground transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Submit a reason and the mentor coach will review and assign a new mentor.
                  </p>
                  <textarea
                    value={reassignReason}
                    onChange={e => setReassignReason(e.target.value)}
                    placeholder="e.g. Language barrier, scheduling conflict, seeker requested change..."
                    rows={3}
                    className="w-full px-3 py-2 text-xs border border-input bg-background rounded-sm outline-none resize-none focus:ring-1 focus:ring-ring"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => { setIsReassignOpen(false); setReassignReason(""); }}
                      className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >Cancel</button>
                    <button
                      onClick={() => {
                        if (!reassignReason.trim()) { toast.error("Please provide a reason"); return; }
                        if (onRequestReassign) onRequestReassign(contact.id, reassignReason.trim());
                        setReassignReason("");
                        setIsReassignOpen(false);
                      }}
                      disabled={!reassignReason.trim()}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-sm transition-all",
                        reassignReason.trim()
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      )}
                    >
                      <Send className="w-3 h-3" />
                      Submit Request
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──── JOURNEY TAB ──── */}
        {activeTab === "journey" && (
          <div className="p-6 space-y-5">
            {journey ? (
              <>
                {/* Journey card */}
                <div className="bg-muted/30 rounded-sm border border-border p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={cn("px-2 py-0.5 rounded-sm text-[11px] font-bold", STAGE_COLORS[journey.stage] || "bg-muted text-muted-foreground")}>
                      {journey.stage}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{journey.type}</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Progress</span>
                      <span className="text-xs font-bold text-foreground">{journey.indicators}/{journey.total}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(journey.indicators / journey.total) * 100}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-muted-foreground">Current</span><p className="font-medium text-foreground mt-0.5">{journey.milestone}</p></div>
                    <div><span className="text-muted-foreground">Source</span><p className="font-medium text-foreground mt-0.5">{journey.source}</p></div>
                    <div><span className="text-muted-foreground">Language</span><p className="font-medium text-foreground mt-0.5">{journey.language}</p></div>
                    <div><span className="text-muted-foreground">Validation</span>
                      <p className={cn("font-medium mt-0.5", journey.validation === "Confirmed" ? "text-emerald-600" : journey.validation === "Pending" ? "text-amber-600" : "text-muted-foreground")}>{journey.validation}</p>
                    </div>
                    <div><span className="text-muted-foreground">Started</span><p className="font-medium text-foreground mt-0.5">{new Date(journey.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p></div>
                  </div>
                </div>

                {/* Stage pipeline */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Stage Pipeline</h4>
                  <div className="flex items-center gap-1">
                    {(["Touchpoint", "Engaged", "Active Journey", "Decision"] as const).map((stage, i) => {
                      const isActive = stage === journey.stage;
                      const isPast = (["Touchpoint", "Engaged", "Active Journey", "Decision"].indexOf(journey.stage)) > i;
                      return (
                        <React.Fragment key={stage}>
                          {i > 0 && <div className={cn("flex-1 h-0.5", isPast || isActive ? "bg-primary" : "bg-muted")} />}
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border-2 transition-all",
                            isActive ? "bg-primary text-primary-foreground border-primary" :
                            isPast ? "bg-primary/10 text-primary border-primary/30" :
                            "bg-muted text-muted-foreground border-border"
                          )}>
                            {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1.5 px-1">
                    {["Touch", "Engaged", "Active", "Decision"].map(s => (
                      <span key={s} className="text-[9px] text-muted-foreground font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <div className="w-10 h-10 rounded-sm bg-muted flex items-center justify-center">
                  <GitBranch className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">No journey started</p>
                <p className="text-xs text-muted-foreground/70 text-center max-w-[200px]">This contact hasn't been assigned to a faith journey yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ──── MILESTONES TAB ──── */}
        {activeTab === "milestones" && (
          <div className="p-6 space-y-3">
            {milestoneRecord ? (
              milestoneRecord.milestones.map(ms => {
                const cls = MS_STATE_CLS[ms.state] || MS_STATE_CLS.pending;
                return (
                  <div key={ms.key} className={cn("rounded-sm border ring-1 ring-inset p-4", cls.bg, cls.ring)}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {ms.state === "done" ? <CheckCircle2 className={cn("w-4 h-4", cls.icon)} /> :
                         ms.state === "progress" ? <Clock className={cn("w-4 h-4", cls.icon)} /> :
                         <Circle className={cn("w-4 h-4", cls.icon)} />}
                        <span className="text-sm font-bold text-foreground">{ms.label}</span>
                      </div>
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider", cls.icon)}>
                        {ms.state === "done" ? "Complete" : ms.state === "progress" ? "In Progress" : "Pending"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{ms.date}</p>
                    {ms.sub.length > 0 && (
                      <div className="space-y-1 ml-6">
                        {ms.sub.map((s, i) => (
                          <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0 mt-1.5" />
                            {s}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <div className="w-10 h-10 rounded-sm bg-muted flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">No milestones recorded</p>
                <p className="text-xs text-muted-foreground/70 text-center max-w-[220px]">Milestones will appear here as they are logged during the journey.</p>
              </div>
            )}
          </div>
        )}

        {/* ──── MATCH TAB ──── */}
        {activeTab === "match" && (
          <div className="p-6 space-y-4">
            {contactMatches.length > 0 ? (
              contactMatches.map(m => {
                const seeker = contacts.find(c => c.id === m.seekerContactId);
                const mentor = users.find(u => u.id === m.mentorUserId);
                const scoreCls = m.score >= 80 ? "text-emerald-600 bg-emerald-50 ring-emerald-200" : m.score >= 60 ? "text-amber-600 bg-amber-50 ring-amber-200" : "text-rose-600 bg-rose-50 ring-rose-200";
                const statusCls = m.status === "Active" ? "bg-emerald-50 text-emerald-700" : m.status === "Proposed" ? "bg-amber-50 text-amber-700" : m.status === "Accepted" ? "bg-sky-50 text-sky-700" : m.status === "Completed" ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-700";

                return (
                  <div key={m.id} className="bg-muted/30 rounded-sm border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={cn("px-2 py-0.5 rounded-sm text-[11px] font-bold", statusCls)}>{m.status}</span>
                      <span className={cn("px-2.5 py-0.5 rounded-sm text-sm font-black ring-1 ring-inset", scoreCls)}>{m.score}%</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Seeker</span>
                        <p className="text-sm font-semibold text-foreground mt-0.5">{seeker?.name || "Unknown"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Mentor</span>
                        <p className="text-sm font-semibold text-foreground mt-0.5">{mentor?.name || "Unknown"}</p>
                      </div>
                    </div>

                    {/* Factors */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Factors</span>
                      {m.factors.map(([name, score, tone], i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs text-foreground font-medium w-20 shrink-0">{name}</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", tone === "green" ? "bg-emerald-500" : tone === "blue" ? "bg-blue-500" : tone === "amber" ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${score}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground w-8 text-right">{score}%</span>
                        </div>
                      ))}
                    </div>

                    {/* Reasoning */}
                    <div className="bg-background rounded-sm border border-border p-3">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block mb-1">AI Reasoning</span>
                      <p className="text-xs text-foreground leading-relaxed">{m.reasoning}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <div className="w-10 h-10 rounded-sm bg-muted flex items-center justify-center">
                  <GitBranch className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">No matches yet</p>
                <p className="text-xs text-muted-foreground/70 text-center max-w-[220px]">This contact hasn't been matched with a mentor or seeker.</p>
              </div>
            )}
          </div>
        )}

        {/* ──── NOTES TAB ──── */}
        {activeTab === "notes" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notes ({contactNotes.length})</h3>
              <div className="flex items-center gap-2">
                <div className="relative flex items-center">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 pointer-events-none" />
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="pl-8 pr-2 py-1.5 bg-background border border-input rounded-sm text-xs text-foreground focus:ring-1 focus:ring-ring outline-none cursor-pointer"
                  />
                </div>
                {filterDate && (
                  <button onClick={() => setFilterDate("")} className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">Clear</button>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                placeholder="Add a note..."
                className="flex-1 bg-background border border-input rounded-sm px-3 py-2.5 text-sm focus:ring-1 focus:ring-ring outline-none placeholder:text-muted-foreground/50"
              />
              <button onClick={handleAddNote} disabled={!newNote.trim()} className="bg-primary text-primary-foreground p-2.5 rounded-sm hover:bg-primary/90 transition-all shrink-0 disabled:opacity-50">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {filteredNotes.length === 0 && (
                <p className="text-xs text-muted-foreground/50 italic p-2">{filterDate ? "No notes found for this date." : "No notes yet. Type a note above to add one."}</p>
              )}
              {filteredNotes.map(note => {
                const author = users.find(u => u.id === note.authorId);
                return (
                  <div key={note.id} className="p-3 bg-muted/30 rounded-sm border border-border group">
                    <p className="text-sm text-foreground leading-relaxed">{note.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-primary font-medium">
                        {author?.name || "System"} · {new Date(note.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} {new Date(note.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {onDeleteNote && (
                        <button onClick={() => onDeleteNote(note.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ConversationToolbar ──────────────────────────────────────────────────────
// Sits above the compose area — quick actions for forms, content, suggestions,
// and reassignment. Collapsible so it doesn't eat vertical space when not needed.

function ConversationToolbar({
  contact, contentLibrary = [], users = [], currentUser,
  onSendMessage, port,
  onUpdateContact, onRequestReassign,
}: {
  contact:           Contact;
  contentLibrary?:   ContentRow[];
  users?:            User[];
  currentUser:       User;
  onSendMessage:     (contactId: string, content: string, scheduledAt?: string, port?: MessagePort) => void;
  port:              MessagePort;
  onUpdateContact?:  (id: string, data: Partial<Contact>) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePanel, setActivePanel] = useState<"form" | "series" | "suggest" | null>(null);

  // AI content suggestion — picks from library based on seeker's maturity and journey
  const suggestions = useMemo(() => {
    const published = contentLibrary.filter(c => c.status === "Published");
    // Simple relevance: match difficulty to maturity
    const maturity = contact.maturity;
    const diffMap: Record<string, string> = { "Pre-Seeker": "Beginner", "Seeker": "Beginner", "New Believer": "Beginner", "Growing": "Intermediate", "Mature": "Advanced", "Leader": "Advanced" };
    const targetDiff = diffMap[maturity || "Seeker"] || "Beginner";
    const matched = published.filter(c => c.difficulty === targetDiff);
    return matched.length > 0 ? matched.slice(0, 4) : published.slice(0, 4);
  }, [contentLibrary, contact.maturity]);

  const handleSendForm = (formId: string) => {
    const form = FORM_TEMPLATES.find(f => f.id === formId);
    if (!form) return;
    const msg = `📋 *${form.label}*\n\n${form.desc}\n\n👉 Please fill out this form: [Open Form]`;
    onSendMessage(contact.id, msg, undefined, port);
    toast.success(`${form.label} sent to ${contact.name.split(" ")[0]}`);
    setActivePanel(null);
  };

  const handleStartSeries = (seriesId: string) => {
    const series = CONTENT_SERIES.find(s => s.id === seriesId);
    if (!series) return;
    const msg = `📚 *${series.label}* — ${series.lessons}-part series\n\n${series.desc}\n\nLesson 1 is on its way! You'll receive one lesson at a time. Reply "pause" to take a break.`;
    onSendMessage(contact.id, msg, undefined, port);
    toast.success(`Started "${series.label}" series for ${contact.name.split(" ")[0]}`);
    setActivePanel(null);
  };

  const handleSendContent = (item: ContentRow) => {
    const variant = item.variants?.[port] || item.variants?.web || item.body;
    const msg = `📖 *${item.title}*\n\n${variant}`;
    onSendMessage(contact.id, msg, undefined, port);
    toast.success(`Sent "${item.title}"`);
    setActivePanel(null);
  };

  const togglePanel = (panel: typeof activePanel) => {
    setActivePanel(prev => prev === panel ? null : panel);
    if (!isExpanded) setIsExpanded(true);
  };

  const TOOLBAR_ACTIONS = [
    { id: "form" as const,    icon: FileText,   label: "Send Form",      desc: "Assessment or intake" },
    { id: "series" as const,  icon: ListOrdered, label: "Content Series", desc: "Start a drip sequence" },
    { id: "suggest" as const, icon: Sparkles,    label: "AI Suggest",     desc: "Smart content pick" },
  ];

  return (
    <div className="shrink-0 border-t border-border bg-background">
      {/* Toggle bar */}
      <div className="flex items-center gap-1 px-3 py-1.5">
        <button
          onClick={() => { setIsExpanded(!isExpanded); if (isExpanded) setActivePanel(null); }}
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Quick Actions</span>
          <ChevronDown className={cn("w-3 h-3 transition-transform", isExpanded && "rotate-180")} />
        </button>

        {/* Compact action chips when collapsed */}
        {!isExpanded && (
          <div className="flex items-center gap-1 ml-1">
            {TOOLBAR_ACTIONS.map(action => (
              <button
                key={action.id}
                onClick={() => togglePanel(action.id)}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all rounded-sm"
                title={action.desc}
              >
                <action.icon className="w-3 h-3" />
                <span className="hidden sm:inline">{action.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Expanded toolbar with action tiles */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {/* Action tiles row */}
            <div className="grid grid-cols-3 gap-1.5 px-3 pb-2">
              {TOOLBAR_ACTIONS.map(action => {
                const isActive = activePanel === action.id;
                return (
                  <button
                    key={action.id}
                    onClick={() => setActivePanel(isActive ? null : action.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 px-2 py-2.5 text-center transition-all rounded-sm border",
                      isActive
                        ? "bg-primary/5 border-primary/30 text-primary"
                        : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <action.icon className="w-4 h-4" />
                    <span className="text-[11px] font-semibold leading-tight">{action.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Panel content */}
            <AnimatePresence mode="wait">
              {activePanel && (
                <motion.div
                  key={activePanel}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="overflow-hidden border-t border-border"
                >
                  <div className="px-3 py-3 max-h-52 overflow-y-auto custom-scrollbar">
                    {/* SEND FORM */}
                    {activePanel === "form" && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold text-foreground mb-2">Send a form to {contact.name.split(" ")[0]}</p>
                        {FORM_TEMPLATES.map(form => (
                          <button key={form.id} onClick={() => handleSendForm(form.id)}
                            className="w-full flex items-start gap-3 p-2.5 text-left bg-muted/20 hover:bg-muted/50 transition-colors rounded-sm group"
                          >
                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-sm flex items-center justify-center shrink-0">
                              <form.icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-foreground">{form.label}</p>
                              <p className="text-[11px] text-muted-foreground leading-snug">{form.desc}</p>
                            </div>
                            <Send className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* CONTENT SERIES */}
                    {activePanel === "series" && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold text-foreground mb-2">Start a content series</p>
                        {CONTENT_SERIES.map(series => (
                          <button key={series.id} onClick={() => handleStartSeries(series.id)}
                            className="w-full flex items-start gap-3 p-2.5 text-left bg-muted/20 hover:bg-muted/50 transition-colors rounded-sm group"
                          >
                            <div className="w-8 h-8 bg-violet-50 text-violet-600 rounded-sm flex items-center justify-center shrink-0">
                              <Library className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-foreground">{series.label} <span className="font-normal text-muted-foreground">· {series.lessons} lessons</span></p>
                              <p className="text-[11px] text-muted-foreground leading-snug">{series.desc}</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* AI CONTENT SUGGESTION */}
                    {activePanel === "suggest" && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <p className="text-xs font-bold text-foreground">AI picks for {contact.name.split(" ")[0]}</p>
                          {contact.maturity && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground">{contact.maturity}</span>
                          )}
                        </div>
                        {suggestions.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-4 text-center">No published content found. Add content in the Content Library first.</p>
                        ) : (
                          suggestions.map(item => (
                            <button key={item.id} onClick={() => handleSendContent(item)}
                              className="w-full flex items-start gap-3 p-2.5 text-left bg-muted/20 hover:bg-muted/50 transition-colors rounded-sm group"
                            >
                              <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-sm flex items-center justify-center shrink-0">
                                <BookOpen className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-foreground">{item.title}</p>
                                <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{item.summary}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground">{item.type}</span>
                                  <span className="text-[10px] text-muted-foreground">{item.readTimeMin} min read</span>
                                </div>
                              </div>
                              <Send className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
                            </button>
                          ))
                        )}
                      </div>
                    )}

                    {/* Reassignment moved to Profile tab in info panel */}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── AI Reply Suggestions ────────────────────────────────────────────────────
// Generates contextual pill-style reply suggestions based on the conversation
// context, contact maturity, and journey stage.

type AISuggestion = { id: string; text: string; tone: "primary" | "green" | "amber" | "purple" };

const AI_SUGGESTION_BANK: Record<string, AISuggestion[]> = {
  greeting: [
    { id: "sg1", text: "Hi! Thank you for reaching out. How can I help you today?", tone: "primary" },
    { id: "sg2", text: "Welcome! I'm glad you're here. What's on your mind?", tone: "green" },
    { id: "sg3", text: "Peace be with you! How are you doing today?", tone: "purple" },
  ],
  question: [
    { id: "sq1", text: "That's a great question! Let me share some thoughts...", tone: "primary" },
    { id: "sq2", text: "I appreciate you asking. Here's what I've found helpful...", tone: "green" },
    { id: "sq3", text: "Let me point you to a resource that covers this well.", tone: "amber" },
  ],
  struggle: [
    { id: "ss1", text: "Thank you for sharing that. I'm here for you and we can work through this together.", tone: "primary" },
    { id: "ss2", text: "I understand this is difficult. Would you like to talk more about it?", tone: "green" },
    { id: "ss3", text: "You're not alone in this. Let's set up a time to discuss further.", tone: "purple" },
  ],
  encouragement: [
    { id: "se1", text: "That's wonderful progress! I'm really encouraged by your growth.", tone: "green" },
    { id: "se2", text: "Keep going — you're doing amazing! God is faithful.", tone: "primary" },
    { id: "se3", text: "I love hearing this. Would you like to share your testimony with the group?", tone: "purple" },
  ],
  followup: [
    { id: "sf1", text: "Just checking in — how are things going since we last spoke?", tone: "primary" },
    { id: "sf2", text: "I've been thinking about our conversation. How are you feeling?", tone: "green" },
    { id: "sf3", text: "Have you had a chance to try what we discussed?", tone: "amber" },
  ],
  prayer: [
    { id: "sp1", text: "I'll be praying for you. Is there anything specific you'd like me to focus on?", tone: "purple" },
    { id: "sp2", text: "Let's pray together. When works best for you?", tone: "primary" },
    { id: "sp3", text: "Thank you for sharing that prayer request. God hears you.", tone: "green" },
  ],
  general: [
    { id: "sg1", text: "Thank you for sharing! Would you like to discuss this further?", tone: "primary" },
    { id: "sg2", text: "I appreciate you reaching out. How can I support you?", tone: "green" },
    { id: "sg3", text: "That's really insightful. Let me share a related resource.", tone: "amber" },
    { id: "sg4", text: "Would you like to schedule a time to meet and talk?", tone: "purple" },
  ],
};

function classifyLastMessage(lastMsg: string): string {
  const lower = lastMsg.toLowerCase();
  if (/^(hi|hello|hey|good morning|good evening|salam|selam)/.test(lower)) return "greeting";
  if (/\?$|how do|what is|can you|why do|where can|tell me/.test(lower)) return "question";
  if (/struggl|difficult|hard|lost|confus|doubt|afraid|scared|anxious|depress|lonely/.test(lower)) return "struggle";
  if (/thank|blessed|amazing|wonderful|great|happy|joy|excited|growth|progress/.test(lower)) return "encouragement";
  if (/pray|prayer|lord|god.*help|intercede/.test(lower)) return "prayer";
  if (/check.?in|follow.?up|how.*going|update/.test(lower)) return "followup";
  return "general";
}

function AISuggestionPills({
  contact, messages, onSelect,
}: {
  contact: Contact;
  messages: Message[];
  onSelect: (text: string) => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());

  // Reset dismissed state when the conversation or last message changes
  const lastInbound = useMemo(() => {
    const inbound = messages.filter(m => m.direction === "inbound");
    return inbound[inbound.length - 1];
  }, [messages]);

  useEffect(() => {
    setDismissed(false);
    setUsedIds(new Set());
  }, [lastInbound?.id]);

  const suggestions = useMemo(() => {
    if (!lastInbound) {
      // No inbound message — show follow-up suggestions
      return AI_SUGGESTION_BANK.followup;
    }
    const category = classifyLastMessage(lastInbound.body || "");
    return AI_SUGGESTION_BANK[category] || AI_SUGGESTION_BANK.general;
  }, [lastInbound]);

  const visibleSuggestions = suggestions.filter(s => !usedIds.has(s.id));

  if (dismissed || visibleSuggestions.length === 0) return null;

  const toneClasses: Record<string, string> = {
    primary: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20",
    green:   "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    amber:   "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
    purple:  "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100",
  };

  return (
    <div className="shrink-0 px-3 py-2 border-t border-border bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Sparkles className="w-3 h-3 text-amber-500" />
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">AI Suggestions</span>
        <button onClick={() => setDismissed(true)} className="ml-auto p-0.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors" title="Dismiss suggestions">
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {visibleSuggestions.map(suggestion => (
          <button
            key={suggestion.id}
            onClick={() => {
              onSelect(suggestion.text);
              setUsedIds(prev => new Set([...prev, suggestion.id]));
            }}
            className={cn(
              "inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full border transition-all",
              "max-w-[280px] truncate",
              toneClasses[suggestion.tone] || toneClasses.primary,
            )}
            title={suggestion.text}
          >
            <span className="truncate">{suggestion.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── ComposeArea ──────────────────────────────────────────────────────────────

function ComposeArea({
  contact, port, setPort, onSend, openDropdown, setOpenDropdown, suggestedText, onSuggestedTextConsumed,
}: {
  contact:         Contact;
  port:            MessagePort;
  setPort:         (p: MessagePort) => void;
  onSend:          (content: string) => void;
  openDropdown:    string | null;
  setOpenDropdown: (v: string | null) => void;
  suggestedText?:  string;
  onSuggestedTextConsumed?: () => void;
}) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // When an AI suggestion is selected, insert it into the compose area
  useEffect(() => {
    if (suggestedText) {
      setText(suggestedText);
      textareaRef.current?.focus();
      onSuggestedTextConsumed?.();
    }
  }, [suggestedText]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText("");
    textareaRef.current?.focus();
  };

  const insertEmoji = (emoji: string) => {
    setText(prev => prev + emoji);
    setOpenDropdown(null);
    textareaRef.current?.focus();
  };

  return (
    <div className="shrink-0 border-t border-border bg-background">
      {/* Channel indicator */}
      <div className="flex items-center justify-end px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Replying via</span>
          <div className="relative">
            <button onClick={() => setOpenDropdown(openDropdown === "compose-port" ? null : "compose-port")}
              className={cn("flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 border transition-colors hover:opacity-80", PORT_COLORS[port] ?? "bg-muted text-muted-foreground border-border")}
            >
              {channelIcon(port, "w-3 h-3")}
              {CHANNEL_LABEL[port] ?? port}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {openDropdown === "compose-port" && (
              <div className="absolute bottom-full right-0 mb-1 z-50 w-44 bg-background border border-border shadow-xl py-1">
                <div className="px-3 py-1.5 border-b border-border">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Send via</span>
                </div>
                {Object.entries(CHANNEL_LABEL).filter(([k]) => k !== "smpp").map(([k, label]) => (
                  <button key={k} onClick={() => { setPort(k as MessagePort); setOpenDropdown(null); }}
                    className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold hover:bg-muted/50 transition-colors", port === k && "bg-muted/30")}
                  >
                    <span className={cn("inline-flex items-center justify-center w-6 h-6 border shrink-0", PORT_COLORS[k] ?? "bg-muted text-muted-foreground border-border")}>
                      {channelIcon(k, "w-3 h-3")}
                    </span>
                    <span className={port === k ? "text-primary font-bold" : "text-foreground"}>{label}</span>
                    {port === k && <Check className="w-3 h-3 text-primary ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Textarea */}
      <form onSubmit={handleSend} className="px-4 pb-3">
        <div className="border border-input bg-background transition-colors">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={`Message ${contact.name.split(" ")[0]} via ${CHANNEL_LABEL[port]}…`}
            rows={3}
            className="w-full px-4 pt-3 pb-2 text-sm outline-none resize-none bg-transparent text-foreground"
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e as any);
              }
            }}
          />

          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 pb-2 border-t border-inherit">
            <div className="flex items-center gap-0.5">
              {/* Attachment */}
              <button type="button" onClick={() => toast.info("File attachments coming soon")}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Emoji picker */}
              <div className="relative">
                <button type="button" onClick={() => setOpenDropdown(openDropdown === "compose-emoji" ? null : "compose-emoji")}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Emoji"
                >
                  <Smile className="w-4 h-4" />
                </button>
                {openDropdown === "compose-emoji" && (
                  <div className="absolute bottom-full left-0 mb-2 z-50 bg-background border border-border shadow-xl p-2 w-52">
                    <div className="grid grid-cols-5 gap-0.5">
                      {COMMON_EMOJIS.map(e => (
                        <button key={e} type="button" onClick={() => insertEmoji(e)}
                          className="text-xl p-1.5 hover:bg-muted transition-colors text-center leading-none"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Send */}
            <button type="submit" disabled={!text.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Send className="w-3 h-3" />
              Send
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-xs text-muted-foreground/50">Enter to send · Shift+Enter for new line</p>
          <p className="text-xs font-medium text-muted-foreground/70">
            Replying via <span className="font-bold capitalize">{CHANNEL_LABEL[port] || port}</span>
          </p>
        </div>
      </form>
    </div>
  );
}

// ─── NewConversationModal ────────────────────────────────────────────────────

const CHANNEL_OPTIONS: { id: MessagePort; label: string }[] = [
  { id: "whatsapp", label: "WhatsApp" }, { id: "sms", label: "SMS" },
  { id: "telegram", label: "Telegram" }, { id: "email", label: "Email" },
  { id: "messenger", label: "Messenger" },
];

function NewConversationModal({ isOpen, onClose, contacts, onStart }: {
  isOpen:   boolean;
  onClose:  () => void;
  contacts: Contact[];
  onStart:  (contactId: string, message: string, port: MessagePort) => void;
}) {
  const [search, setSearch]             = useState("");
  const [selected, setSelected]         = useState<Contact | null>(null);
  const [channel, setChannel]           = useState<MessagePort>("whatsapp");
  const [message, setMessage]           = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) { setSearch(""); setSelected(null); setChannel("whatsapp"); setMessage(""); setShowDropdown(false); }
    else setTimeout(() => searchRef.current?.focus(), 80);
  }, [isOpen]);

  useEffect(() => {
    if (!showDropdown) return;
    const h = (e: MouseEvent) => { if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowDropdown(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showDropdown]);

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts.slice(0, 8);
    const q = search.toLowerCase();
    return contacts.filter(c => c.name.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q)).slice(0, 8);
  }, [contacts, search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) { toast.error("Please select a contact"); return; }
    if (!message.trim()) { toast.error("Please type a message"); return; }
    onStart(selected.id, message, channel);
    onClose();
    toast.success(`Conversation started with ${selected.name}`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }} transition={{ duration: 0.18 }}
          className="bg-background border border-border shadow-2xl w-full max-w-lg flex flex-col"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/10">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-primary/10 border border-primary/20 flex items-center justify-center">
                <SquarePen className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">New Conversation</h3>
                <p className="text-xs text-muted-foreground">Start a fresh conversation with any contact</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">To</label>
              <div className="relative" ref={dropRef}>
                {selected ? (
                  <div className="flex items-center gap-3 border border-primary bg-primary/5 px-3 py-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">{selected.name.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{selected.name}</p>
                      <p className="text-xs text-muted-foreground">{selected.phone || selected.email}</p>
                    </div>
                    <button type="button" onClick={() => { setSelected(null); setSearch(""); setTimeout(() => searchRef.current?.focus(), 50); }} className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input ref={searchRef} type="text" placeholder="Search contacts by name, phone, or email…" value={search}
                      onChange={e => { setSearch(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)}
                      className="w-full pl-9 pr-4 h-10 border border-input bg-background text-sm focus:ring-1 focus:ring-ring outline-none transition-all"
                    />
                  </div>
                )}
                {!selected && showDropdown && (
                  <div className="absolute top-full left-0 right-0 z-20 bg-background border border-border shadow-xl mt-1 max-h-48 overflow-y-auto">
                    {filtered.length === 0
                      ? <div className="flex items-center justify-center py-6 text-xs text-muted-foreground gap-2"><UserIcon className="w-4 h-4 opacity-40" />No contacts found</div>
                      : filtered.map(c => (
                          <button key={c.id} type="button" onClick={() => { setSelected(c); setSearch(c.name); setShowDropdown(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                          >
                            <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">{c.name.charAt(0)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{c.phone || c.email || "—"}</p>
                            </div>
                          </button>
                        ))
                    }
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Channel</label>
              <div className="flex gap-1.5 flex-wrap">
                {CHANNEL_OPTIONS.map(ch => (
                  <button key={ch.id} type="button" onClick={() => setChannel(ch.id)}
                    className={cn("px-3 py-1.5 text-xs font-bold border transition-colors", channel === ch.id ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground")}
                  >{ch.label}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                placeholder={selected ? `Type your first message to ${selected.name.split(" ")[0]}…` : "Type your message…"}
                rows={4} className="w-full border border-input bg-background px-3 py-2.5 text-sm focus:ring-1 focus:ring-ring outline-none transition-all resize-none"
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); } }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1 border-t border-border">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">Cancel</button>
              <button type="submit" disabled={!selected || !message.trim()} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                <Send className="w-3.5 h-3.5" />Send Message
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── ConversationView (Main) ──────────────────────────────────────────────────

interface ConversationViewProps {
  contacts:          Contact[];
  messages:          Message[];
  notes:             ContactNote[];
  users:             User[];
  currentUser:       User;
  onSendMessage:     (contactId: string, content: string, scheduledAt?: string, port?: MessagePort) => void;
  preSelectedContactId?: string | null;
  conversationRules: ConversationRule[];
  chatEndpoints:     ChatEndpoint[];
  groups:            Group[];
  teamGroups:        TeamGroup[];
  onAddRule:         (data: Partial<ConversationRule>) => void;
  onUpdateRule:      (id: string, data: Partial<ConversationRule>) => void;
  onDeleteRule:      (id: string) => void;
  onReorderRules:    (rules: ConversationRule[]) => void;
  viewMode?:         "super_admin" | "agent";
  // --- discipleship data ---
  faithJourneys?:      FaithJourney[];
  contactMilestones?:  ContactMilestones[];
  matches?:            Match[];
  contentLibrary?:     ContentRow[];
  onUpdateContact?:    (id: string, data: Partial<Contact>) => void;
  onUpdateJourney?:    (id: string, data: Partial<FaithJourney>) => void;
  onLogMilestone?:     (contactId: string, key: MilestoneKey, date: string, sub: string[]) => void;
  onUpdateMatch?:      (id: string, data: Partial<Match>) => void;
  onAddNote?:          (content: string, contactId: string) => void;
  onDeleteNote?:       (id: string) => void;
  reassignRequests?:   ReassignmentRequest[];
  onRequestReassign?:  (contactId: string, reason: string) => void;
  onApproveReassign?:  (reqId: string, newMentorId: string) => void;
  onRejectReassign?:   (reqId: string) => void;
}

export const ConversationView = ({
  contacts, messages, notes, users, currentUser, onSendMessage,
  preSelectedContactId, conversationRules, chatEndpoints, groups,
  teamGroups, onAddRule, onUpdateRule, onDeleteRule, onReorderRules,
  viewMode = "super_admin",
  faithJourneys = [], contactMilestones = [], matches = [], contentLibrary = [],
  onUpdateContact, onUpdateJourney, onLogMilestone, onUpdateMatch,
  onAddNote, onDeleteNote,
  reassignRequests = [], onRequestReassign, onApproveReassign, onRejectReassign,
}: ConversationViewProps) => {
  const isAgent = viewMode === "agent";

  // ── State ────────────────────────────────────────────────────────────────
  const contactsWithMsg = useMemo(() => {
    const s = new Set(messages.map(m => m.contactId));
    return contacts.filter(c => s.has(c.id));
  }, [contacts, messages]);

  const [selectedId, setSelectedId]       = useState<string | null>(preSelectedContactId ?? contactsWithMsg[0]?.id ?? null);
  const [inboxSearch, setInboxSearch]     = useState("");
  const [statusFilter, setStatusFilter]   = useState<InboxFilter>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<ConvPriority | null>(null);
  const [convMeta, setConvMeta]           = useState<Record<string, ConvMeta>>({});
  const [localItems, setLocalItems]       = useState<LocalItem[]>([]);
  const [convPort, setConvPort]           = useState<MessagePort>("whatsapp");
  const [isInfoOpen, setIsInfoOpen]       = useState(false);
  const [isRoutingOpen, setIsRoutingOpen] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [openDropdown, setOpenDropdown]   = useState<string | null>(null);
  const [typingSet, setTypingSet]         = useState<Set<string>>(new Set());
  const [shownTyping, setShownTyping]     = useState<Set<string>>(new Set());
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [aiSuggestedText, setAiSuggestedText] = useState<string>("");

  // ── Grab Conversation state (declared here, logic wired after helpers) ──
  const [grabDeadlines, setGrabDeadlines] = useState<Record<string, number>>({});

  // ── Helpers ────────────────────────────────────────────────────────────
  const getMeta = useCallback((id: string): ConvMeta => convMeta[id] ?? DEFAULT_META, [convMeta]);

  const updateMeta = useCallback((id: string, updates: Partial<ConvMeta>) => {
    setConvMeta(prev => ({ ...prev, [id]: { ...(prev[id] ?? DEFAULT_META), ...updates } }));
  }, []);

  const addLocalItem = useCallback((item: Omit<LocalItem, "id" | "createdAt">) => {
    setLocalItems(prev => [...prev, { ...item, id: `li-${Date.now()}-${Math.random()}`, createdAt: new Date().toISOString() }]);
  }, []);

  // ── Grab Conversation logic ────────────────────────────────────────────
  // Seed grab deadlines on mount for demo — first 3 unassigned contacts
  const grabSeeded = useRef(false);
  useEffect(() => {
    if (grabSeeded.current || contactsWithMsg.length === 0) return;
    grabSeeded.current = true;
    const now = Date.now();
    const seeds: Record<string, number> = {};
    contactsWithMsg.slice(0, 3).forEach((c, i) => {
      const offsets = [8 * 60 * 1000, 5 * 60 * 1000, 30 * 1000];
      seeds[c.id] = now + GRAB_WINDOW_MS - (offsets[i] ?? 0);
    });
    setGrabDeadlines(seeds);
  }, [contactsWithMsg]);

  const grabConversation = useCallback((contactId: string) => {
    updateMeta(contactId, { assigneeId: currentUser.id, status: "assigned" });
    addLocalItem({ contactId, type: "system", content: `${currentUser.name} grabbed this conversation` });
    setGrabDeadlines(prev => { const n = { ...prev }; delete n[contactId]; return n; });
    toast.success("Conversation grabbed!");
  }, [currentUser, updateMeta, addLocalItem]);

  // Auto-assign expired grab windows
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      setGrabDeadlines(prev => {
        const updated = { ...prev };
        let changed = false;
        for (const [cid, deadline] of Object.entries(updated)) {
          if (deadline <= now && !convMeta[cid]?.assigneeId) {
            const activeUsers = users.filter(u => u.status === "active");
            if (activeUsers.length > 0) {
              const mentor = activeUsers[Math.floor(Math.random() * activeUsers.length)];
              updateMeta(cid, { assigneeId: mentor.id, status: "assigned" });
              addLocalItem({ contactId: cid, type: "system", content: `AI auto-assigned to ${mentor.name} (grab window expired)` });
            }
            delete updated[cid];
            changed = true;
          }
        }
        return changed ? updated : prev;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [convMeta, users, updateMeta, addLocalItem]);

  // ── Typing simulation ──────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedId || shownTyping.has(selectedId)) return;
    const t1 = setTimeout(() => setTypingSet(s => new Set([...s, selectedId!])), 800);
    const t2 = setTimeout(() => {
      setTypingSet(s => { const n = new Set(s); n.delete(selectedId!); return n; });
      setShownTyping(s => new Set([...s, selectedId!]));
    }, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [selectedId]);

  // ── Auto-scroll ────────────────────────────────────────────────────────
  const selectedMessages = useMemo(() =>
    messages.filter(m => m.contactId === selectedId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages, selectedId]
  );

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedMessages.length, selectedId, localItems.length]);

  // ── Mark read on select + sync composer port to conversation channel ───
  useEffect(() => {
    if (!selectedId) return;
    updateMeta(selectedId, { unreadCount: 0 });
    const last = messages
      .filter(m => m.contactId === selectedId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    if (last?.port) setConvPort(last.port as MessagePort);
  }, [selectedId]);

  // ── Thread entries ─────────────────────────────────────────────────────
  const threadEntries = useMemo((): ThreadEntry[] => {
    const msgEntries: ThreadEntry[] = selectedMessages.map(m => ({
      id: m.id, type: "message", content: m.content,
      senderType: m.senderType, senderId: m.senderId,
      createdAt: m.createdAt, status: m.status, port: m.port,
    }));
    const localEntries: ThreadEntry[] = localItems
      .filter(i => i.contactId === selectedId)
      .map(i => ({ id: i.id, type: i.type, content: i.content, senderId: i.senderId, createdAt: i.createdAt }));
    return [...msgEntries, ...localEntries].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [selectedMessages, localItems, selectedId]);

  // ── Filtered + sorted inbox ────────────────────────────────────────────
  const filteredContacts = useMemo(() => {
    let list = contactsWithMsg;
    if (inboxSearch) {
      const q = inboxSearch.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.phone?.includes(q));
    }
    if (statusFilter !== "all") list = list.filter(c => getMeta(c.id).status === statusFilter);
    if (assigneeFilter)         list = list.filter(c => getMeta(c.id).assigneeId === assigneeFilter);
    if (priorityFilter)         list = list.filter(c => getMeta(c.id).priority === priorityFilter);
    if (channelFilter) {
      const withChannel = new Set(messages.filter(m => m.port === channelFilter).map(m => m.contactId));
      list = list.filter(c => withChannel.has(c.id));
    }
    // Sort by newest message
    return [...list].sort((a, b) => {
      const la = messages.filter(m => m.contactId === a.id).sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())[0];
      const lb = messages.filter(m => m.contactId === b.id).sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())[0];
      return (lb ? new Date(lb.createdAt).getTime() : 0) - (la ? new Date(la.createdAt).getTime() : 0);
    });
  }, [contactsWithMsg, inboxSearch, statusFilter, assigneeFilter, priorityFilter, channelFilter, messages, getMeta]);

  const selectedContact = contacts.find(c => c.id === selectedId) ?? null;
  const selectedMeta    = selectedId ? getMeta(selectedId) : DEFAULT_META;
  const systemItems     = localItems.filter(i => i.contactId === selectedId && i.type === "system");

  // Derive the active channel from the most recent message in the conversation
  const activePort: string | undefined = useMemo(() => {
    if (!selectedId) return undefined;
    const last = messages
      .filter(m => m.contactId === selectedId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    return last?.port ?? convPort;
  }, [selectedId, messages, convPort]);

  const hasFilters = statusFilter !== "all" || !!assigneeFilter || !!channelFilter || !!priorityFilter;

  // ── Send handler ───────────────────────────────────────────────────────
  const handleSend = (content: string) => {
    if (!selectedId) return;
    onSendMessage(selectedId, content, undefined, convPort);
  };

  // ── Close dropdowns on outside click ──────────────────────────────────
  useEffect(() => {
    if (!openDropdown) return;
    const h = (e: MouseEvent) => {
      const el = (e.target as HTMLElement);
      if (!el.closest("[data-dropdown-host]")) setOpenDropdown(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [openDropdown]);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden animate-in fade-in duration-300">

      {/* ── Page Header ── */}
      <div className="shrink-0 border-b border-border bg-background px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Conversations</h2>
          <p className="text-sm text-muted-foreground">{contactsWithMsg.length} active thread{contactsWithMsg.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isAgent && (
            <button onClick={() => setIsRoutingOpen(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-background border border-border text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5 text-primary" />
              Conversation Rules
            </button>
          )}
          <button onClick={() => setIsComposeOpen(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <SquarePen className="w-3.5 h-3.5" />
            New Conversation
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Inbox Sidebar ── */}
        <aside className="w-[340px] xl:w-[400px] border-r border-border bg-card flex flex-col shrink-0" data-dropdown-host>

          {/* Status tabs — hidden in Agent mode */}
          {!isAgent && (
            <div className="flex border-b border-border">
              {(["all", "open", "assigned", "pending", "resolved"] as const).map(f => (
                <button key={f} onClick={() => setStatusFilter(f)}
                  className={cn(
                    "flex-1 px-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap",
                    statusFilter === f ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >{f}</button>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="px-4 py-3 border-b border-border bg-muted/10">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search conversations…" value={inboxSearch}
                onChange={e => setInboxSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-input text-sm focus:ring-1 focus:ring-ring outline-none transition-all"
              />
            </div>
          </div>

          {/* Secondary filters */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/5 flex-wrap" data-dropdown-host>
            {/* Assignee filter — hidden in Agent mode */}
            {!isAgent && (
              <div className="relative">
                <button onClick={() => setOpenDropdown(openDropdown === "f-assign" ? null : "f-assign")}
                  className={cn("flex items-center gap-1.5 h-8 px-3 border text-xs font-semibold transition-colors", assigneeFilter ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:border-primary hover:text-primary")}
                >
                  <UserIcon className="w-3 h-3" />
                  {assigneeFilter ? users.find(u => u.id === assigneeFilter)?.name.split(" ")[0] ?? "Agent" : "Agent"}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {openDropdown === "f-assign" && (
                  <div className="absolute top-full left-0 z-50 mt-1 w-44 bg-background border border-border shadow-xl py-1">
                    <button onClick={() => { setAssigneeFilter(null); setOpenDropdown(null); }} className="w-full text-left px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/50 transition-colors">All agents</button>
                    {users.filter(u => u.status === "active").map(u => (
                      <button key={u.id} onClick={() => { setAssigneeFilter(u.id); setOpenDropdown(null); }}
                        className={cn("w-full text-left px-3 py-2 text-xs font-semibold hover:bg-muted/50 transition-colors", assigneeFilter === u.id ? "text-primary" : "text-foreground")}
                      >{u.name}</button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Channel filter */}
            <div className="relative">
              <button onClick={() => setOpenDropdown(openDropdown === "f-channel" ? null : "f-channel")}
                className={cn("flex items-center gap-1.5 h-8 px-3 border text-xs font-semibold transition-colors", channelFilter ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:border-primary hover:text-primary")}
              >
                <Filter className="w-3 h-3" />
                {channelFilter ? CHANNEL_LABEL[channelFilter] : "Channel"}
                <ChevronDown className="w-3 h-3" />
              </button>
              {openDropdown === "f-channel" && (
                <div className="absolute top-full left-0 z-50 mt-1 w-36 bg-background border border-border shadow-xl py-1">
                  <button onClick={() => { setChannelFilter(null); setOpenDropdown(null); }} className="w-full text-left px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/50 transition-colors">All channels</button>
                  {Object.entries(CHANNEL_LABEL).filter(([k]) => k !== "smpp").map(([k, label]) => (
                    <button key={k} onClick={() => { setChannelFilter(k); setOpenDropdown(null); }}
                      className={cn("w-full text-left px-3 py-2 text-xs font-semibold hover:bg-muted/50 transition-colors", channelFilter === k ? "text-primary" : "text-foreground")}
                    >{label}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Priority filter */}
            <div className="relative">
              <button onClick={() => setOpenDropdown(openDropdown === "f-priority" ? null : "f-priority")}
                className={cn("flex items-center gap-1.5 h-8 px-3 border text-xs font-semibold transition-colors", priorityFilter ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:border-primary hover:text-primary")}
              >
                <ArrowUp className="w-3 h-3" />
                {priorityFilter ? PRIORITY_OPTIONS.find(p => p.id === priorityFilter)?.label : "Priority"}
                <ChevronDown className="w-3 h-3" />
              </button>
              {openDropdown === "f-priority" && (
                <div className="absolute top-full left-0 z-50 mt-1 w-32 bg-background border border-border shadow-xl py-1">
                  <button onClick={() => { setPriorityFilter(null); setOpenDropdown(null); }} className="w-full text-left px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/50 transition-colors">All priorities</button>
                  {PRIORITY_OPTIONS.map(p => (
                    <button key={p.id} onClick={() => { setPriorityFilter(p.id); setOpenDropdown(null); }}
                      className={cn("w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-muted/50 transition-colors", priorityFilter === p.id ? "text-primary" : "text-foreground")}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full", p.dot)} />{p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear filters */}
            {hasFilters && (
              <button onClick={() => { setStatusFilter("all"); setAssigneeFilter(null); setChannelFilter(null); setPriorityFilter(null); }}
                className="ml-auto text-xs font-bold text-primary hover:text-primary/70 transition-colors"
              >Clear</button>
            )}
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-8 gap-3">
                <div className="w-14 h-14 bg-muted flex items-center justify-center opacity-20"><MessageSquare className="w-7 h-7" /></div>
                <p className="text-sm text-muted-foreground">No conversations found.</p>
                {hasFilters && <button onClick={() => { setStatusFilter("all"); setAssigneeFilter(null); setChannelFilter(null); setPriorityFilter(null); }} className="text-xs font-bold text-primary hover:text-primary/70">Clear filters</button>}
              </div>
            ) : (
              filteredContacts.map(c => {
                const lastMsg = messages.filter(m => m.contactId === c.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                return (
                  <InboxListItem key={c.id} contact={c} lastMsg={lastMsg} meta={getMeta(c.id)}
                    isActive={selectedId === c.id} users={users}
                    grabDeadline={grabDeadlines[c.id] ?? null}
                    onGrab={grabConversation}
                    onClick={() => { setSelectedId(c.id); }}
                  />
                );
              })
            )}
          </div>
        </aside>

        {/* ── Chat Pane ── */}
        <div className="flex-1 flex overflow-hidden">
          {selectedContact ? (
            <>
              {/* Chat column */}
              <div className="flex-1 flex flex-col bg-background overflow-hidden">
                {/* Control bar */}
                <div data-dropdown-host>
                  <ConversationControlBar
                    contact={selectedContact}
                    meta={selectedMeta}
                    users={users}
                    port={activePort}
                    openDropdown={openDropdown}
                    setOpenDropdown={setOpenDropdown}
                    onUpdateMeta={u => updateMeta(selectedId!, u)}
                    onAddSystem={content => addLocalItem({ contactId: selectedId!, type: "system", content })}
                    onToggleInfo={() => setIsInfoOpen(v => !v)}
                    isInfoOpen={isInfoOpen}
                    isAgent={isAgent}
                  />
                </div>

                {/* Grab conversation banner */}
                {selectedId && grabDeadlines[selectedId] && !selectedMeta.assigneeId && grabDeadlines[selectedId] > Date.now() && (
                  <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-5 py-3 flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-sm bg-amber-500 flex items-center justify-center shrink-0 shadow-sm">
                        <Hand className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-amber-900">This conversation is unassigned</p>
                        <p className="text-xs text-amber-700/80">Grab it before AI auto-assigns to a mentor</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <GrabCountdownBadge deadline={grabDeadlines[selectedId]} />
                      <button
                        onClick={() => grabConversation(selectedId)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors rounded-sm shadow-sm"
                      >
                        <Hand className="w-3.5 h-3.5" />
                        Grab Conversation
                      </button>
                    </div>
                  </div>
                )}

                {/* Thread */}
                <div className="flex-1 overflow-y-auto py-4 space-y-1 custom-scrollbar bg-muted/5">
                  {threadEntries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-16">
                      <div className="w-14 h-14 bg-muted flex items-center justify-center opacity-20"><MessageSquare className="w-7 h-7" /></div>
                      <p className="text-sm text-muted-foreground">No messages yet. Send the first one!</p>
                    </div>
                  ) : (
                    <>
                      {threadEntries.map(entry => <ThreadMessage key={entry.id} entry={entry} />)}
                      {/* Typing indicator */}
                      {typingSet.has(selectedId!) && (
                        <div className="px-5"><TypingIndicator /></div>
                      )}
                      <div ref={chatBottomRef} />
                    </>
                  )}
                </div>

                {/* Quick Actions Toolbar */}
                <ConversationToolbar
                  contact={selectedContact}
                  contentLibrary={contentLibrary}
                  users={users}
                  currentUser={currentUser}
                  onSendMessage={onSendMessage}
                  port={convPort}
                  onUpdateContact={onUpdateContact}
                />

                {/* AI Reply Suggestions */}
                <AISuggestionPills
                  contact={selectedContact}
                  messages={selectedMessages}
                  onSelect={(text) => setAiSuggestedText(text)}
                />

                {/* Compose */}
                <div data-dropdown-host>
                  <ComposeArea
                    contact={selectedContact}
                    port={convPort}
                    setPort={setConvPort}
                    onSend={handleSend}
                    openDropdown={openDropdown}
                    setOpenDropdown={setOpenDropdown}
                    suggestedText={aiSuggestedText}
                    onSuggestedTextConsumed={() => setAiSuggestedText("")}
                  />
                </div>
              </div>

              {/* Context panel */}
              <AnimatePresence>
                {isInfoOpen && (
                  <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 576, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden shrink-0"
                  >
                    <ConversationContextPanel
                      contact={selectedContact}
                      meta={selectedMeta}
                      users={users}
                      systemItems={systemItems}
                      onClose={() => setIsInfoOpen(false)}
                      messages={messages}
                      notes={notes}
                      groups={groups}
                      faithJourneys={faithJourneys}
                      contactMilestones={contactMilestones}
                      matches={matches}
                      onUpdateContact={onUpdateContact}
                      onUpdateJourney={onUpdateJourney}
                      onLogMilestone={onLogMilestone}
                      onAddNote={onAddNote}
                      onDeleteNote={onDeleteNote}
                      onRequestReassign={onRequestReassign}
                      reassignRequests={reassignRequests}
                      viewMode={viewMode}
                      onApproveReassign={onApproveReassign}
                      onRejectReassign={onRejectReassign}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 gap-4">
              <div className="w-20 h-20 bg-muted flex items-center justify-center opacity-20"><MessageSquare className="w-10 h-10" /></div>
              <div>
                <h3 className="text-lg font-bold text-muted-foreground">Select a conversation</h3>
                <p className="text-sm text-muted-foreground/60 max-w-xs mt-1">Choose a contact from the sidebar to view messages and reply.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {!isAgent && (
        <RoutingRulesPanel
          isOpen={isRoutingOpen} onClose={() => setIsRoutingOpen(false)}
          conversationRules={conversationRules} chatEndpoints={chatEndpoints}
          groups={groups} teamGroups={teamGroups} users={users}
          onAddRule={onAddRule} onUpdateRule={onUpdateRule}
          onDeleteRule={onDeleteRule} onReorderRules={onReorderRules}
        />
      )}
      <NewConversationModal
        isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)}
        contacts={contacts}
        onStart={(contactId, message, port) => { onSendMessage(contactId, message, undefined, port); setSelectedId(contactId); }}
      />
    </div>
  );
};
