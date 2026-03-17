import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Search, Send, MessageSquare, MessageCircle, Check, CheckCheck,
  Phone, Mail, Info, X, GitBranch, SquarePen,
  User as UserIcon, UserPlus, UserCheck, CheckCircle2, XCircle,
  Clock, Tag, MoreHorizontal, Paperclip, Smile, Lock,
  ChevronDown, ArrowUp, Filter, Circle, Plus, Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  cn,
  type Contact, type Message, type ContactNote, type User,
  type MessagePort, type ChatEndpoint, type ConversationRule,
  type Group, type TeamGroup,
  formatTimeAgo,
} from "./types";
import { RoutingRulesPanel } from "./routing-rules-panel";

// ─── Local Types ──────────────────────────────────────────────────────────────

type ConvStatus   = "open" | "assigned" | "pending" | "resolved" | "closed";
type ConvPriority = "low" | "normal" | "high" | "urgent";
type ComposerMode = "reply" | "note";
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
      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 border text-[10px] font-bold uppercase tracking-wide", colorCls)}>
        {channelIcon(port, "w-3 h-3")}
        {CHANNEL_LABEL[port] ?? port}
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 border text-[9px] font-bold uppercase tracking-wide", colorCls)}>
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
      <span className="text-[11px] text-muted-foreground italic">Visitor is typing…</span>
    </div>
  );
}

// ─── ThreadMessage ────────────────────────────────────────────────────────────

function ThreadMessage({ entry }: { entry: ThreadEntry }) {
  if (entry.type === "system") {
    return (
      <div className="flex items-center gap-3 py-2.5 px-5">
        <div className="flex-1 h-px bg-border/60" />
        <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest whitespace-nowrap px-3">
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
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Internal Note</span>
          </div>
          <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">{entry.content}</p>
          <span className="text-[9px] text-amber-600/60 mt-1.5 block">
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
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider opacity-60">
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
  contact, lastMsg, meta, isActive, onClick, users,
}: {
  contact:  Contact;
  lastMsg:  Message | undefined;
  meta:     ConvMeta;
  isActive: boolean;
  onClick:  () => void;
  users:    User[];
}) {
  const assignee    = users.find(u => u.id === meta.assigneeId);
  const priorityOpt = PRIORITY_OPTIONS.find(p => p.id === meta.priority)!;
  const statusOpt   = STATUS_OPTIONS.find(s => s.id === meta.status)!;

  return (
    <button onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3.5 px-4 py-4 text-left border-b border-border/50 transition-all border-l-[3px]",
        isActive
          ? "bg-primary/5 border-l-primary"
          : cn("hover:bg-muted/40", PRIORITY_BORDER[meta.priority])
      )}
    >
      {/* Avatar with assignee overlay */}
      <div className="relative shrink-0">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center border text-sm font-bold shadow-sm",
          isActive ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
        )}>
          {contact.name.charAt(0)}
        </div>
        {assignee && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center text-[8px] font-bold text-white border-2 border-background">
            {assignee.name.charAt(0)}
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
            {lastMsg && (
              <span className="text-[10px] font-semibold text-muted-foreground">
                {formatTimeAgo(lastMsg.createdAt)}
              </span>
            )}
            {meta.unreadCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
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

        {/* Row 4: status + priority */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <span className={cn("text-[10px] font-bold px-2 py-0.5 border", statusOpt.cls)}>
            {statusOpt.label}
          </span>
          {meta.priority !== "normal" && (
            <span className={cn("flex items-center gap-1 text-[10px] font-bold uppercase", priorityOpt.text)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", priorityOpt.dot)} />
              {priorityOpt.label}
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
  onUpdateMeta, onAddSystem, onToggleInfo, isInfoOpen,
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
            <p className="text-[10px] text-muted-foreground mt-0.5">{contact.phone || contact.email}</p>
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

        {/* Assign */}
        <div className="relative">
          <button onClick={() => toggle("ctrl-assign")}
            className="flex items-center gap-1.5 h-7 px-2.5 border border-border text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
          >
            <UserPlus className="w-3 h-3 text-muted-foreground" />
            {assignee ? assignee.name.split(" ")[0] : "Assign"}
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
          {openDropdown === "ctrl-assign" && (
            <div className="absolute top-full left-0 z-50 mt-1 w-52 bg-background border border-border shadow-xl">
              <div className="px-3 py-2 border-b border-border">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Assign Agent</span>
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
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {u.name.charAt(0)}
                      </div>
                      <div className={cn("absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-background", PRESENCE_DOT[pr])} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{pr} · {u.role}</p>
                    </div>
                    {meta.assigneeId === u.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="relative">
          <button onClick={() => toggle("ctrl-status")}
            className={cn("flex items-center gap-1.5 h-7 px-2.5 border text-xs font-bold transition-colors", statusOpt.cls)}
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
                  <span className={cn("px-2 py-0.5 border text-[10px] font-bold", s.cls)}>{s.label}</span>
                  {s.id === meta.status && <Check className="w-3 h-3 text-primary ml-auto" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Priority */}
        <div className="relative">
          <button onClick={() => toggle("ctrl-priority")}
            className="flex items-center gap-1.5 h-7 px-2.5 border border-border text-xs font-semibold hover:bg-muted/50 transition-colors"
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
            className="flex items-center gap-1.5 h-7 px-2.5 border border-border text-xs font-semibold text-muted-foreground hover:bg-muted/50 transition-colors"
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
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Toggle Labels</p>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_LABELS.map(label => {
                  const active = meta.labels.includes(label);
                  return (
                    <button key={label}
                      onClick={() => onUpdateMeta({ labels: active ? meta.labels.filter(l => l !== label) : [...meta.labels, label] })}
                      className={cn("text-[10px] font-bold px-2 py-1 border transition-colors", active ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary")}
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
                { label: "Mark as unread", fn: () => toast.info("Marked as unread") },
                { label: "Star conversation", fn: () => toast.info("Starred") },
                { label: "Export transcript", fn: () => toast.info("Exporting transcript…") },
                { label: "Merge conversation", fn: () => toast.info("Feature coming soon") },
                { label: "Delete conversation", fn: () => toast.error("Conversation deleted") },
              ].map(item => (
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

// ─── ConversationContextPanel ─────────────────────────────────────────────────

function ConversationContextPanel({
  contact, meta, users, systemItems, onClose,
}: {
  contact:     Contact;
  meta:        ConvMeta;
  users:       User[];
  systemItems: LocalItem[];
  onClose:     () => void;
}) {
  const [newNote, setNewNote] = useState("");
  const [savedNotes, setSavedNotes] = useState<{ id: string; content: string; createdAt: string; author: string }[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const assignee    = users.find(u => u.id === meta.assigneeId);
  const contactGroups = meta.labels || [];
  const contactMessages = systemItems.filter(i => i.content);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note = {
      id: Date.now().toString(),
      content: newNote.trim(),
      createdAt: new Date().toISOString(),
      author: assignee?.name || "System Admin",
    };
    setSavedNotes(prev => [note, ...prev]);
    setNewNote("");
  };

  const filteredNotes = filterDate
    ? savedNotes.filter(note => new Date(note.createdAt).toISOString().slice(0, 10) === filterDate)
    : savedNotes;

  return (
    <div className="w-[576px] border-l border-border bg-card flex flex-col shrink-0 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/10 sticky top-0 z-10">
        <span className="text-sm font-bold text-foreground">Contact Info</span>
        <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Contact Profile - Centered */}
      <div className="flex flex-col items-center py-8 px-6 border-b border-border">
        <div className="w-20 h-20 rounded-full bg-muted border-2 border-border flex items-center justify-center text-3xl font-bold text-foreground mb-4 overflow-hidden">
          {contact.name.charAt(0)}
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">{contact.name}</h2>
        {contact.phone && (
          <p className="text-sm text-foreground font-medium">{contact.phone}</p>
        )}
        {contact.email && (
          <p className="text-sm text-muted-foreground mt-0.5">{contact.email}</p>
        )}
        <p className="text-xs text-primary mt-1.5 font-medium">Contact Since {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 border-b border-border">
        <div className="flex flex-col items-center py-4 border-r border-border">
          <span className="text-xl font-bold text-primary">{contactMessages.length}</span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Msgs</span>
        </div>
        <div className="flex flex-col items-center py-4 border-r border-border">
          <span className="text-xl font-bold text-primary">{contactGroups.length}</span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Groups</span>
        </div>
        <div className="flex flex-col items-center py-4">
          <span className="text-xl font-bold text-primary">{savedNotes.length}</span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Notes</span>
        </div>
      </div>

      {/* Groups and Tags */}
      <div className="px-6 py-5 border-b border-border">
        <h3 className="text-sm font-bold text-foreground mb-3">Groups and tags</h3>
        <div className="flex flex-wrap gap-2">
          {meta.labels.map(label => (
            <span key={label} className="px-3 py-1 bg-muted border border-border rounded-full text-xs font-medium text-foreground">{label}</span>
          ))}
          {contact.tags?.map(tag => (
            <span key={tag} className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-medium text-primary">{tag}</span>
          ))}
          {meta.labels.length === 0 && (!contact.tags || contact.tags.length === 0) && (
            <span className="text-xs text-muted-foreground italic">No groups or tags</span>
          )}
        </div>
      </div>

      {/* Notes Section */}
      <div className="px-6 py-5 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">Notes</h3>
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 pointer-events-none" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="pl-8 pr-2 py-1.5 bg-background border border-input rounded-lg text-xs text-foreground focus:ring-1 focus:ring-ring outline-none cursor-pointer"
              />
            </div>
            {filterDate && (
              <button onClick={() => setFilterDate("")} className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors">
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
            placeholder="Type here"
            className="flex-1 bg-background border border-input rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-ring outline-none placeholder:text-muted-foreground/50"
          />
          <button onClick={handleAddNote} disabled={!newNote.trim()} className="bg-primary text-primary-foreground p-2.5 rounded-lg hover:bg-primary/90 transition-all shrink-0 disabled:opacity-50">
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          {filteredNotes.length === 0 && (
            <p className="text-xs text-muted-foreground/50 italic p-2">{filterDate ? "No notes found for this date." : "No notes yet. Type a note above and click + to save."}</p>
          )}
          {(() => {
            const grouped: Record<string, typeof savedNotes> = {};
            filteredNotes.forEach(note => {
              const dateKey = new Date(note.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
              if (!grouped[dateKey]) grouped[dateKey] = [];
              grouped[dateKey].push(note);
            });
            return Object.entries(grouped).map(([date, notes]) => (
              <div key={date}>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{date}</p>
                <div className="space-y-2">
                  {notes.map(note => (
                    <div key={note.id} className="p-4 bg-muted/30 rounded-lg border border-border">
                      <p className="text-sm text-foreground leading-relaxed">{note.content}</p>
                      <p className="text-xs text-primary mt-2 font-medium">{note.author} {new Date(note.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}

// ─── ComposeArea ──────────────────────────────────────────────────────────────

function ComposeArea({
  contact, composerMode, setComposerMode, port, setPort, onSend, openDropdown, setOpenDropdown,
}: {
  contact:         Contact;
  composerMode:    ComposerMode;
  setComposerMode: (m: ComposerMode) => void;
  port:            MessagePort;
  setPort:         (p: MessagePort) => void;
  onSend:          (content: string, mode: ComposerMode) => void;
  openDropdown:    string | null;
  setOpenDropdown: (v: string | null) => void;
}) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text, composerMode);
    setText("");
    textareaRef.current?.focus();
  };

  const insertEmoji = (emoji: string) => {
    setText(prev => prev + emoji);
    setOpenDropdown(null);
    textareaRef.current?.focus();
  };

  const isNote = composerMode === "note";

  return (
    <div className="shrink-0 border-t border-border bg-background">
      {/* Reply / Note toggle */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-0.5 bg-muted/40 border border-border p-0.5">
          {(["reply", "note"] as const).map(mode => (
            <button key={mode}
              onClick={() => setComposerMode(mode)}
              className={cn(
                "px-3 py-1 text-xs font-bold uppercase tracking-wide transition-colors",
                composerMode === mode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {mode === "note" && <Lock className="w-3 h-3 inline mr-1 text-amber-500" />}
              {mode}
            </button>
          ))}
        </div>

        {/* Channel indicator (reply mode only) */}
        {!isNote && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-medium">Replying via</span>
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
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Send via</span>
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
        )}
        {isNote && (
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-600">
            <Lock className="w-3 h-3" />
            Only visible to agents
          </span>
        )}
      </div>

      {/* Textarea */}
      <form onSubmit={handleSend} className="px-4 pb-3">
        <div className={cn("border transition-colors", isNote ? "border-amber-200 bg-amber-50/50" : "border-input bg-background")}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={isNote
              ? "Write an internal note…"
              : `Message ${contact.name.split(" ")[0]} via ${CHANNEL_LABEL[port]}…`
            }
            rows={3}
            className={cn("w-full px-4 pt-3 pb-2 text-sm outline-none resize-none bg-transparent", isNote ? "placeholder:text-amber-400/70 text-amber-900" : "text-foreground")}
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
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed",
                isNote
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {isNote ? <Lock className="w-3 h-3" /> : <Send className="w-3 h-3" />}
              {isNote ? "Add Note" : "Send"}
            </button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/50 mt-1.5">Enter to send · Shift+Enter for new line</p>
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
                <p className="text-[10px] text-muted-foreground">Start a fresh conversation with any contact</p>
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
                      <p className="text-[10px] text-muted-foreground">{selected.phone || selected.email}</p>
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
                              <p className="text-[10px] text-muted-foreground truncate">{c.phone || c.email || "—"}</p>
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
}

export const ConversationView = ({
  contacts, messages, notes, users, currentUser, onSendMessage,
  preSelectedContactId, conversationRules, chatEndpoints, groups,
  teamGroups, onAddRule, onUpdateRule, onDeleteRule, onReorderRules,
}: ConversationViewProps) => {

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
  const [composerMode, setComposerMode]   = useState<ComposerMode>("reply");
  const [convPort, setConvPort]           = useState<MessagePort>("whatsapp");
  const [isInfoOpen, setIsInfoOpen]       = useState(false);
  const [isRoutingOpen, setIsRoutingOpen] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [openDropdown, setOpenDropdown]   = useState<string | null>(null);
  const [typingSet, setTypingSet]         = useState<Set<string>>(new Set());
  const [shownTyping, setShownTyping]     = useState<Set<string>>(new Set());
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // ── Helpers ────────────────────────────────────────────────────────────
  const getMeta = useCallback((id: string): ConvMeta => convMeta[id] ?? DEFAULT_META, [convMeta]);

  const updateMeta = useCallback((id: string, updates: Partial<ConvMeta>) => {
    setConvMeta(prev => ({ ...prev, [id]: { ...(prev[id] ?? DEFAULT_META), ...updates } }));
  }, []);

  const addLocalItem = useCallback((item: Omit<LocalItem, "id" | "createdAt">) => {
    setLocalItems(prev => [...prev, { ...item, id: `li-${Date.now()}-${Math.random()}`, createdAt: new Date().toISOString() }]);
  }, []);

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
  const handleSend = (content: string, mode: ComposerMode) => {
    if (!selectedId) return;
    if (mode === "note") {
      addLocalItem({ contactId: selectedId, type: "note", content, senderId: currentUser.id });
      toast.success("Note added");
    } else {
      onSendMessage(selectedId, content, undefined, convPort);
    }
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
          <button onClick={() => setIsRoutingOpen(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-background border border-border text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5 text-primary" />
            Conversation Rules
          </button>
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

          {/* Status tabs */}
          <div className="flex border-b border-border">
            {(["all", "open", "assigned", "pending", "resolved"] as const).map(f => (
              <button key={f} onClick={() => setStatusFilter(f)}
                className={cn(
                  "flex-1 px-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap",
                  statusFilter === f ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >{f}</button>
            ))}
          </div>

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
            {/* Assignee filter */}
            <div className="relative">
              <button onClick={() => setOpenDropdown(openDropdown === "f-assign" ? null : "f-assign")}
                className={cn("flex items-center gap-1.5 h-7 px-2.5 border text-xs font-semibold transition-colors", assigneeFilter ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:border-primary hover:text-primary")}
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

            {/* Channel filter */}
            <div className="relative">
              <button onClick={() => setOpenDropdown(openDropdown === "f-channel" ? null : "f-channel")}
                className={cn("flex items-center gap-1.5 h-7 px-2.5 border text-xs font-semibold transition-colors", channelFilter ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:border-primary hover:text-primary")}
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
                className={cn("flex items-center gap-1.5 h-7 px-2.5 border text-xs font-semibold transition-colors", priorityFilter ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:border-primary hover:text-primary")}
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
                    onClick={() => { setSelectedId(c.id); setComposerMode("reply"); }}
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
                  />
                </div>

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

                {/* Compose */}
                <div data-dropdown-host>
                  <ComposeArea
                    contact={selectedContact}
                    composerMode={composerMode}
                    setComposerMode={setComposerMode}
                    port={convPort}
                    setPort={setConvPort}
                    onSend={handleSend}
                    openDropdown={openDropdown}
                    setOpenDropdown={setOpenDropdown}
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
      <RoutingRulesPanel
        isOpen={isRoutingOpen} onClose={() => setIsRoutingOpen(false)}
        conversationRules={conversationRules} chatEndpoints={chatEndpoints}
        groups={groups} teamGroups={teamGroups} users={users}
        onAddRule={onAddRule} onUpdateRule={onUpdateRule}
        onDeleteRule={onDeleteRule} onReorderRules={onReorderRules}
      />
      <NewConversationModal
        isOpen={isComposeOpen} onClose={() => setIsComposeOpen(false)}
        contacts={contacts}
        onStart={(contactId, message, port) => { onSendMessage(contactId, message, undefined, port); setSelectedId(contactId); }}
      />
    </div>
  );
};
